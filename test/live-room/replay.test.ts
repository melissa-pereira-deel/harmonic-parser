import { describe, expect, it } from 'vitest';
import type { ReplayFixture, RoomEvent } from '../../src/room/contracts.ts';
import { createGestureState } from '../../src/room/input/gesture.ts';
import { chordReplay, motifReplay } from '../../src/room/replay/motif.ts';
import { createReplay, replayCueAt } from '../../src/room/replay/replay.ts';

function strikes(fixture: ReplayFixture) {
  return fixture.events.filter(event => event.kind === 'noteOn');
}

describe('replay', () => {
  it('emits events once through the requested time, breaking ties by sequence', () => {
    const fixture: ReplayFixture = {
      ...motifReplay,
      events: [
        { kind: 'reset', tMs: 100, seq: 2 },
        { kind: 'reset', tMs: 100, seq: 1 },
        { kind: 'reset', tMs: 200, seq: 0 },
      ],
    };
    const emitted: RoomEvent[] = [];
    const replay = createReplay(fixture, event => emitted.push(event));

    replay.advanceTo(99);
    expect(emitted).toEqual([]);
    replay.advanceTo(100);
    expect(emitted.map(event => event.seq)).toEqual([1, 2]);
    replay.advanceTo(100);
    replay.advanceTo(90);
    expect(emitted.map(event => event.seq)).toEqual([1, 2]);
    replay.advanceTo(200);
    expect(emitted.map(event => event.seq)).toEqual([1, 2, 0]);
    expect(fixture.events.map(event => event.seq)).toEqual([2, 1, 0]);
  });

  it('reaches the same events and gesture state after reset at a fixed time', () => {
    const emitted: RoomEvent[] = [];
    const gesture = createGestureState();
    const replay = createReplay(motifReplay, event => {
      emitted.push(event);
      gesture.apply(event);
    });
    replay.advanceTo(750);
    replay.advanceTo(2500);
    replay.advanceTo(3600);
    const firstPass = emitted.slice();
    const firstSnapshot = gesture.snapshot();
    expect(firstSnapshot.physical).toEqual([]);
    expect(firstSnapshot.sustained.map(note => note.note).sort((a, b) => a - b)).toEqual([48, 77, 79]);
    expect(firstSnapshot.lastStrike).toMatchObject({ kind: 'noteOn', note: 77, velocity: 96 });

    replay.advanceTo(3850);
    expect(gesture.snapshot()).toMatchObject({ physical: [], sustained: [] });

    emitted.length = 0;
    replay.reset();
    gesture.reset();
    expect(emitted).toEqual([]);
    replay.advanceTo(3600);
    expect(emitted).toEqual(firstPass);
    expect(gesture.snapshot()).toEqual(firstSnapshot);
  });
});

describe('live room fixtures', () => {
  it('repeats the same melody at the same relative times over a changed bass', () => {
    const first = strikes(motifReplay).filter(event => event.tMs < 5000);
    const second = strikes(motifReplay).filter(event => event.tMs >= 5000);
    const melody = [72, 75, 79, 77];

    expect(first.map(event => event.note)).toEqual([48, ...melody]);
    expect(second.map(event => event.note)).toEqual([44, ...melody]);
    expect(first.map(event => event.tMs)).toEqual([700, 700, 1320, 2190, 2670]);
    expect(second.map(event => event.tMs - 5000)).toEqual(first.map(event => event.tMs));
    expect(first[1].velocity).toBe(38);
    expect(first.at(-1)?.velocity).toBe(96);
    expect(motifReplay.events.filter(event => event.tMs > 3850 && event.tMs < 5700)).toEqual([]);
    expect(motifReplay.chords).toEqual([]);
  });

  it('shows the facilitated reflection only in its cue window', () => {
    expect(replayCueAt(motifReplay, 8999)).toBeNull();
    const cue = replayCueAt(motifReplay, 9000);
    expect(cue).toMatchObject({ origin: 'facilitated', text: 'Same phrase, different bass.' });
    expect(replayCueAt(motifReplay, 11099)).toBe(cue);
    expect(replayCueAt(motifReplay, 11100)).toBeNull();
    expect(replayCueAt(chordReplay, 4000)).toBeNull();
  });

  it('pairs each annotated chord onset with its matching played triad', () => {
    expect(chordReplay.chords).toEqual([
      { tMs: 400, symbol: 'Am' },
      { tMs: 1600, symbol: 'F' },
      { tMs: 2800, symbol: 'G' },
      { tMs: 4000, symbol: 'C' },
    ]);
    expect(chordReplay.chords.map(({ tMs }) =>
      strikes(chordReplay).filter(event => event.tMs === tMs).map(event => event.note),
    )).toEqual([[57, 60, 64], [53, 57, 60], [55, 59, 62], [48, 52, 55]]);
  });
});
