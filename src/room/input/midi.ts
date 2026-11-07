import type { RoomEvent } from '../contracts';

export interface MidiStatus {
  readonly kind: 'idle' | 'connecting' | 'ready' | 'unsupported' | 'denied' | 'no-device' | 'disconnected' | 'unavailable';
  readonly ports: readonly { readonly id: string; readonly name: string }[];
  readonly selectedId: string | null;
}

interface MidiPort {
  readonly id: string;
  readonly name: string | null;
  readonly state: MIDIPortDeviceState;
  onmidimessage: ((event: MIDIMessageEvent) => void) | null;
  open(): Promise<unknown>;
  close(): Promise<unknown>;
}

interface MidiAccess {
  readonly inputs: { forEach(callback: (input: MidiPort) => void): void };
  onstatechange: ((event: MIDIConnectionEvent) => void) | null;
}

interface MidiInputOptions {
  readonly emit: (event: RoomEvent) => void;
  readonly onStatus: (status: MidiStatus) => void;
  readonly now: () => number;
  readonly requestAccess?: (options: MIDIOptions) => Promise<MidiAccess>;
}

type EventPayload<T = RoomEvent> = T extends RoomEvent ? Omit<T, 'tMs' | 'seq'> : never;

function decodeMessage(data: MIDIMessageEvent['data']): EventPayload | undefined {
  if (data?.length !== 3) return;
  const [status, note, value] = data;
  if (note > 127 || value > 127) return;
  const channel = status & 0x0f;
  switch (status & 0xf0) {
    case 0x80:
      return { kind: 'noteOff', channel, note };
    case 0x90:
      return value === 0 ? { kind: 'noteOff', channel, note } : { kind: 'noteOn', channel, note, velocity: value };
    case 0xb0:
      if (note === 64) return { kind: 'sustain', channel, down: value >= 64 };
      break;
  }
}

interface PortBinding {
  readonly port: MidiPort;
  kind: 'connecting' | 'ready' | 'unavailable';
  opening?: Promise<void>;
}

export function createMidiInput({ emit, onStatus, now, requestAccess }: MidiInputOptions) {
  let access: MidiAccess | undefined;
  let requesting: Promise<void> | undefined;
  let binding: PortBinding | undefined;
  let selectedId: string | null = null;
  let closed = false;
  let seq = 0;
  let status: MidiStatus | undefined;

  function publish(event: EventPayload): void {
    emit({ ...event, tMs: now(), seq: seq++ });
  }

  function connectedPorts(): MidiPort[] {
    const ports: MidiPort[] = [];
    access?.inputs.forEach((port) => {
      if (port.state === 'connected') ports.push(port);
    });
    return ports;
  }

  function report(kind: MidiStatus['kind'], inputs = connectedPorts()): void {
    const ports = inputs.map(({ id, name }) => ({ id, name: name || 'MIDI input' }));
    if (status?.kind === kind && status.selectedId === selectedId &&
      status.ports.length === ports.length &&
      status.ports.every((port, i) => port.id === ports[i].id && port.name === ports[i].name)
    ) return;
    status = { kind, ports, selectedId };
    onStatus(status);
  }

  function reset(): void {
    if (!closed) publish({ kind: 'reset' });
  }

  function detach(): void {
    const previous = binding;
    binding = undefined;
    if (!previous) return;
    previous.port.onmidimessage = null;
    // A disconnected port can reject close. Its listener is already detached.
    void previous.port.close().catch(() => {});
  }

  async function open(current: PortBinding): Promise<void> {
    const { port } = current;
    try {
      await port.open();
    } catch {
      if (binding !== current) return;
      current.kind = 'unavailable';
      report(current.kind);
      return;
    }

    if (binding !== current) return;
    if (port.state !== 'connected') {
      refresh();
      return;
    }

    current.kind = 'ready';
    port.onmidimessage = ({ data }) => {
      if (binding !== current || port.state !== 'connected') return;
      const event = decodeMessage(data);
      if (event) publish(event);
    };
    report(current.kind);
  }

  function refresh(retry = false): Promise<void> | undefined {
    const ports = connectedPorts();
    if (selectedId === null && ports.length === 1) selectedId = ports[0].id;
    const port = ports.find(({ id }) => id === selectedId);

    if (binding && (binding.port !== port || (retry && binding.kind === 'unavailable'))) {
      detach();
      reset();
    }
    if (!port) {
      report(selectedId !== null ? 'disconnected' : ports.length ? 'ready' : 'no-device', ports);
      return;
    }
    if (!binding) {
      const current: PortBinding = { port, kind: 'connecting' };
      binding = current;
      report(current.kind, ports);
      if (binding === current) current.opening = open(current);
      return current.opening;
    }

    report(binding.kind, ports);
    return binding.opening;
  }

  async function getAccess(request: NonNullable<MidiInputOptions['requestAccess']>): Promise<void> {
    let next: MidiAccess;
    try {
      next = await request({ sysex: false });
    } catch (error) {
      if (!closed) {
        const denied = error instanceof Error && ['NotAllowedError', 'SecurityError'].includes(error.name);
        report(denied ? 'denied' : 'unavailable');
      }
      return;
    }

    if (closed) return;
    access = next;
    next.onstatechange = () => {
      if (!closed) refresh();
    };
    await refresh();
  }

  async function connect(): Promise<void> {
    if (closed) return;
    if (requesting) return requesting;
    if (access) return refresh(true);

    const navigator = globalThis.navigator;
    const request = requestAccess ?? navigator?.requestMIDIAccess?.bind(navigator);
    if (!request) {
      report('unsupported');
      return;
    }

    report('connecting');
    if (closed) return;
    requesting = getAccess(request);
    try {
      await requesting;
    } finally {
      requesting = undefined;
    }
  }

  function select(id: string): void {
    if (closed || !connectedPorts().some((port) => port.id === id)) return;
    selectedId = id;
    refresh(true);
  }

  function close(): void {
    if (closed) return;
    closed = true;
    if (access) access.onstatechange = null;
    access = undefined;
    selectedId = null;
    detach();
    publish({ kind: 'reset' });
    report('idle');
  }

  return { connect, select, reset, close };
}
