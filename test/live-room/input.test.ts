import { describe, expect, it, vi } from 'vitest';
import type { RoomEvent } from '../../src/room/contracts';
import { createGestureState } from '../../src/room/input/gesture';
import { createMidiInput, type MidiStatus } from '../../src/room/input/midi';

class FakePort {
  readonly id: string;
  readonly name: string;
  state: MIDIPortDeviceState = 'connected';
  onmidimessage: ((event: MIDIMessageEvent) => void) | null = null;
  open = vi.fn<() => Promise<void>>().mockResolvedValue(undefined);
  close = vi.fn<() => Promise<void>>().mockResolvedValue(undefined);

  constructor(id: string) {
    this.id = id;
    this.name = `Keyboard ${id}`;
  }

  send(...bytes: number[]) {
    this.onmidimessage?.(message(...bytes));
  }
}

function message(...bytes: number[]): MIDIMessageEvent {
  return Object.assign(new Event('midimessage'), { data: Uint8Array.from(bytes) });
}

function fakeAccess(...ports: FakePort[]) {
  return {
    inputs: new Map(ports.map((port) => [port.id, port])),
    onstatechange: null as ((event: MIDIConnectionEvent) => void) | null,
    change() {
      this.onstatechange?.(Object.assign(new Event('statechange'), { port: null }));
    },
  };
}

function setup(...ports: FakePort[]) {
  const access = fakeAccess(...ports);
  const events: RoomEvent[] = [];
  const statuses: MidiStatus[] = [];
  const gesture = createGestureState();
  const requestAccess = vi.fn(async (_options: MIDIOptions) => access);
  let tMs = 12;
  const input = createMidiInput({
    requestAccess,
    now: () => tMs,
    emit(event) {
      events.push(event);
      gesture.apply(event);
    },
    onStatus: (status) => statuses.push(status),
  });
  return { access, events, statuses, gesture, requestAccess, input, advance: () => tMs++ };
}

describe('live MIDI normalization', () => {
  it('requests ordinary access on Connect and auto-selects a lone keyboard', async () => {
    const port = new FakePort('a');
    const { input, requestAccess, statuses } = setup(port);
    expect(requestAccess).not.toHaveBeenCalled();

    await Promise.all([input.connect(), input.connect()]);

    expect(requestAccess).toHaveBeenCalledExactlyOnceWith({ sysex: false });
    expect(statuses.at(-1)).toEqual({
      kind: 'ready', ports: [{ id: 'a', name: 'Keyboard a' }], selectedId: 'a',
    });
  });

  it('uses the session clock and orders events independently of browser timestamps', async () => {
    const port = new FakePort('a');
    const { input, events, advance } = setup(port);
    await input.connect();
    port.send(0x91, 60, 75);
    port.send(0x81, 60, 42);
    advance();
    port.send(0x9f, 62, 0);

    expect(events).toEqual([
      { tMs: 12, seq: 0, kind: 'noteOn', channel: 1, note: 60, velocity: 75 },
      { tMs: 12, seq: 1, kind: 'noteOff', channel: 1, note: 60 },
      { tMs: 13, seq: 2, kind: 'noteOff', channel: 15, note: 62 },
    ]);
  });

  it('ignores unrelated and incomplete MIDI messages', async () => {
    const port = new FakePort('a');
    const { input, events } = setup(port);
    await input.connect();
    port.send(0xb0, 1, 127);
    port.send(0xc0, 1);
    port.send(0xf8);
    port.send(0x90, 60);
    port.send(0x90, 60, 128);

    port.send(0x90, 60, 1);
    expect(events).toEqual([{ tMs: 12, seq: 0, kind: 'noteOn', channel: 0, note: 60, velocity: 1 }]);
  });

  it('keeps a key physically held until release, then holds it via CC64 until pedal-up', async () => {
    const port = new FakePort('a');
    const { input, events, gesture } = setup(port);
    await input.connect();
    const note = { channel: 0, note: 60, velocity: 93 };
    port.send(0x90, 60, 93);
    port.send(0xb0, 64, 64);
    expect(gesture.snapshot()).toMatchObject({ physical: [note], sustained: [] });

    port.send(0x90, 60, 0);
    expect(gesture.snapshot()).toMatchObject({ physical: [], sustained: [note] });

    port.send(0xb0, 64, 63);
    expect(gesture.snapshot()).toMatchObject({ physical: [], sustained: [] });
    expect(events.filter((event) => event.kind === 'sustain')).toEqual([
      { kind: 'sustain', channel: 0, down: true, tMs: 12, seq: 1 },
      { kind: 'sustain', channel: 0, down: false, tMs: 12, seq: 3 },
    ]);
  });
});

describe('gesture state', () => {
  it('replaces a sustained or held entry with the latest strike on retrigger', () => {
    const gesture = createGestureState();
    gesture.apply({ kind: 'sustain', channel: 0, down: true, tMs: 0, seq: 0 });
    gesture.apply({ kind: 'noteOn', channel: 0, note: 60, velocity: 22, tMs: 1, seq: 1 });
    gesture.apply({ kind: 'noteOff', channel: 0, note: 60, tMs: 2, seq: 2 });
    gesture.apply({ kind: 'noteOn', channel: 0, note: 60, velocity: 44, tMs: 3, seq: 3 });
    const strike = { kind: 'noteOn', channel: 0, note: 60, velocity: 88, tMs: 4, seq: 4 } as const;
    gesture.apply(strike);

    expect(gesture.snapshot()).toEqual({
      physical: [{ channel: 0, note: 60, velocity: 88 }],
      sustained: [],
      lastStrike: strike,
    });
  });

  it('tracks the same pitch and pedal release independently on each channel', () => {
    const gesture = createGestureState();
    gesture.apply({ kind: 'sustain', channel: 0, down: true, tMs: 0, seq: 0 });
    gesture.apply({ kind: 'sustain', channel: 1, down: true, tMs: 0, seq: 1 });
    gesture.apply({ kind: 'noteOn', channel: 0, note: 60, velocity: 40, tMs: 1, seq: 2 });
    gesture.apply({ kind: 'noteOn', channel: 1, note: 60, velocity: 80, tMs: 1, seq: 3 });
    gesture.apply({ kind: 'noteOff', channel: 0, note: 60, tMs: 2, seq: 4 });
    gesture.apply({ kind: 'noteOff', channel: 1, note: 60, tMs: 2, seq: 5 });
    gesture.apply({ kind: 'sustain', channel: 0, down: false, tMs: 3, seq: 6 });

    expect(gesture.snapshot()).toMatchObject({
      physical: [],
      sustained: [{ channel: 1, note: 60, velocity: 80 }],
    });
  });

  it('clears held notes, sustain and the last strike on reset', () => {
    const gesture = createGestureState();
    gesture.apply({ kind: 'sustain', channel: 0, down: true, tMs: 0, seq: 0 });
    gesture.apply({ kind: 'noteOn', channel: 0, note: 60, velocity: 80, tMs: 1, seq: 1 });
    expect(gesture.snapshot().physical).toEqual([{ channel: 0, note: 60, velocity: 80 }]);
    gesture.reset();
    expect(gesture.snapshot()).toEqual({ physical: [], sustained: [], lastStrike: null });

    gesture.apply({ kind: 'noteOn', channel: 0, note: 60, velocity: 80, tMs: 2, seq: 2 });
    gesture.apply({ kind: 'noteOff', channel: 0, note: 60, tMs: 3, seq: 3 });
    expect(gesture.snapshot()).toMatchObject({ physical: [], sustained: [] });
  });
});

describe('MIDI input lifecycle', () => {
  it('requires a choice with multiple devices and drops stale messages after switching', async () => {
    const first = new FakePort('a');
    const second = new FakePort('b');
    const { input, statuses, gesture, events } = setup(first, second);
    await input.connect();
    first.send(0x90, 60, 90);
    expect(statuses.at(-1)).toMatchObject({ kind: 'ready', selectedId: null });
    expect(events).toEqual([]);

    input.select('a');
    await Promise.resolve();
    first.send(0x90, 60, 90);
    const staleHandler = first.onmidimessage;
    expect(gesture.snapshot().physical).toHaveLength(1);

    input.select('b');
    await Promise.resolve();
    expect(first.onmidimessage).toBeNull();
    expect(first.close).toHaveBeenCalledOnce();
    staleHandler?.(message(0x90, 61, 90));
    expect(gesture.snapshot()).toEqual({ physical: [], sustained: [], lastStrike: null });
    expect(statuses.at(-1)).toMatchObject({ kind: 'ready', selectedId: 'b' });
    second.send(0x90, 62, 80);
    expect(gesture.snapshot().physical).toEqual([{ channel: 0, note: 62, velocity: 80 }]);

    input.select('a');
    await Promise.resolve();
    staleHandler?.(message(0x90, 61, 90));
    expect(gesture.snapshot().physical).toEqual([]);
  });

  it('detects an empty port list and picks a lone hotplugged keyboard', async () => {
    const { input, statuses, access, events } = setup();
    await input.connect();
    expect(statuses.at(-1)).toEqual({ kind: 'no-device', ports: [], selectedId: null });

    const port = new FakePort('a');
    access.inputs.set(port.id, port);
    access.change();
    await Promise.resolve();
    expect(statuses.at(-1)).toMatchObject({ kind: 'ready', selectedId: 'a' });
    port.send(0x90, 60, 80);
    expect(events.at(-1)).toMatchObject({ kind: 'noteOn', note: 60 });
  });

  it('clears state on unplug and resumes with the same port ID on replug', async () => {
    const port = new FakePort('a');
    const { input, statuses, access, gesture, events } = setup(port);
    await input.connect();
    port.send(0x90, 60, 80);
    port.state = 'disconnected';
    access.inputs.delete(port.id);
    access.change();
    expect(statuses.at(-1)).toEqual({ kind: 'disconnected', ports: [], selectedId: 'a' });
    expect(events.at(-1)).toMatchObject({ kind: 'reset' });
    expect(gesture.snapshot()).toEqual({ physical: [], sustained: [], lastStrike: null });

    const replacement = new FakePort('a');
    access.inputs.set(replacement.id, replacement);
    access.change();
    await Promise.resolve();
    expect(statuses.at(-1)).toMatchObject({ kind: 'ready', selectedId: 'a' });
    replacement.send(0x90, 61, 80);
    expect(gesture.snapshot().physical).toEqual([{ channel: 0, note: 61, velocity: 80 }]);
  });

  it('resets on suspension while keeping the selected connection and sequence', async () => {
    const port = new FakePort('a');
    const { input, gesture, events, statuses } = setup(port);
    await input.connect();
    port.send(0xb0, 64, 127);
    port.send(0x90, 60, 80);
    port.send(0x80, 60, 0);
    input.reset();
    expect(gesture.snapshot()).toEqual({ physical: [], sustained: [], lastStrike: null });
    expect(statuses.at(-1)).toMatchObject({ kind: 'ready', selectedId: 'a' });

    port.send(0x90, 61, 80);
    port.send(0x80, 61, 0);
    expect(gesture.snapshot()).toMatchObject({ physical: [], sustained: [] });
    expect(events.slice(-3)).toMatchObject([
      { kind: 'reset', seq: 3 },
      { kind: 'noteOn', seq: 4 },
      { kind: 'noteOff', seq: 5 },
    ]);
  });

  it('reports unavailable when an input is busy and can retry opening it', async () => {
    const port = new FakePort('a');
    port.open.mockRejectedValueOnce(new DOMException('busy', 'NotAllowedError'));
    const { input, statuses, events } = setup(port);
    await input.connect();
    expect(statuses.at(-1)).toMatchObject({ kind: 'unavailable', selectedId: 'a' });
    port.send(0x90, 60, 80);
    expect(events).toEqual([]);

    await input.connect();
    expect(statuses.at(-1)).toMatchObject({ kind: 'ready', selectedId: 'a' });
  });

  it.each(['NotAllowedError', 'SecurityError'])('reports denied when access rejects with %s', async (name) => {
    const { input, statuses, requestAccess } = setup();
    requestAccess.mockRejectedValueOnce(new DOMException('permission blocked', name));
    await input.connect();
    expect(statuses.at(-1)).toEqual({ kind: 'denied', ports: [], selectedId: null });
  });

  it('reports unsupported when Web MIDI is absent', async () => {
    const onStatus = vi.fn<(status: MidiStatus) => void>();
    await createMidiInput({ now: () => 0, emit: vi.fn(), onStatus }).connect();
    expect(onStatus).toHaveBeenLastCalledWith({ kind: 'unsupported', ports: [], selectedId: null });
  });

  it('detaches from the active port and stops listening after close', async () => {
    const port = new FakePort('a');
    const { input, events, gesture, access, statuses } = setup(port);
    await input.connect();
    port.send(0x90, 60, 80);
    const staleHandler = port.onmidimessage;
    input.close();
    staleHandler?.(message(0x90, 61, 80));
    access.change();
    expect(statuses.at(-1)).toEqual({ kind: 'idle', ports: [], selectedId: null });
    expect(events.at(-1)).toMatchObject({ kind: 'reset' });
    expect(gesture.snapshot()).toEqual({ physical: [], sustained: [], lastStrike: null });
    expect(port.onmidimessage).toBeNull();
    expect(access.onstatechange).toBeNull();
  });

  it('ignores permission that resolves after close', async () => {
    const port = new FakePort('a');
    const { input, statuses, requestAccess, access, events } = setup(port);
    let allow!: (value: typeof access) => void;
    const permission = new Promise<typeof access>((resolve) => { allow = resolve; });
    requestAccess.mockReturnValueOnce(permission);
    const connecting = input.connect();
    input.close();
    allow(access);
    await connecting;

    expect(statuses.map(({ kind }) => kind)).toEqual(['connecting', 'idle']);
    expect(port.open).not.toHaveBeenCalled();
    expect(access.onstatechange).toBeNull();
    expect(events.every(({ kind }) => kind === 'reset')).toBe(true);
  });
});
