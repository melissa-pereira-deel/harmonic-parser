import { describe, expect, it } from 'vitest';
import type { ReplayFixture, RoomEvent } from '../../src/room/contracts.ts';
import { LINGER_MS, TWO_HEARINGS_LINGER_MS } from '../../src/room/analysis/live.ts';
import { createPlayingMood } from '../../src/room/analysis/mood.ts';
import { createRoomSession } from '../../src/room/session.ts';

const strike: RoomEvent = { kind: 'noteOn', channel: 0, note: 60, velocity: 90, tMs: 100, seq: 0 };
const phrase: ReplayFixture = {
  id: 'session-test',
  description: 'One strike and an independent reflection.',
  durationMs: 2_000,
  seed: 1,
  events: [strike],
  cues: [{ text: 'Same phrase, different bass.', startMs: 500, durationMs: 600, origin: 'facilitated', evidence: 'test' }],
  chords: [],
};

describe('playing conditions', () => {
  it('keeps A independent and gives B and C identical gesture values', () => {
    const a = createRoomSession('A', phrase).sample(200, false);
    const b = createRoomSession('B', phrase).sample(200, false);
    const c = createRoomSession('C', phrase).sample(200, false);
    expect(a.frame).toEqual({
      tMs: 200, impulse: 0, register: 0.5, envelope: 0, energy: 0, warmth: 0, reducedMotion: false,
    });
    expect(b.frame.impulse).toBeGreaterThan(0);
    expect(b.frame).toEqual(c.frame);
    expect(c.cue).toBeNull();
  });

  it('lets only C display the cue and retires it at the end of its window', () => {
    expect(createRoomSession('A', phrase).sample(500, false).cue).toBeNull();
    expect(createRoomSession('B', phrase).sample(500, false).cue).toBeNull();
    const c = createRoomSession('C', phrase);
    expect(c.sample(500, false).cue).toEqual(phrase.cues[0]);
    expect(c.sample(1_100, false).cue).toBeNull();
  });

  it('resets held notes and facilitator cue on a fresh run', () => {
    const c = createRoomSession('C', null);
    c.apply(strike);
    c.reflect(200);
    expect(c.sample(200, true).gesture.physical).toHaveLength(1);
    expect(c.sample(200, true).cue?.origin).toBe('facilitated');
    c.reset();
    expect(c.sample(0, true)).toMatchObject({ gesture: { physical: [], sustained: [] }, cue: null });
  });
});

describe('palette response', () => {
  it('builds color over a phrase and groups the tones of a chord into one attack', () => {
    const run = (attacks: [number, number][]) => {
      const mood = createPlayingMood();
      for (const [time, velocity] of attacks) mood.strike(time, velocity);
      return mood.sample(1000).energy;
    };
    const isolated = run([[400, 105]]);
    expect(run([[400, 105], [400, 80], [400, 90]])).toBe(isolated);
    expect(run([[400, 40]])).toBeLessThan(isolated);
    expect(run([[0, 105], [200, 105], [400, 105]])).toBeGreaterThan(isolated);
    expect(run([[1000, 127]])).toBe(0);
  });

  it('eases into warmth after a gap and fades back on its own', () => {
    const mood = createPlayingMood();
    for (const time of [0, 200, 400]) mood.strike(time, 80);
    expect(mood.sample(1349).warmth).toBe(0);
    expect(mood.sample(1350).warmth).toBe(0);
    expect(mood.sample(2300).warmth).toBeGreaterThan(0.2);
    expect(mood.sample(30_000).warmth).toBeLessThan(0.01);
  });
});

describe('live harmony', () => {
  function playChords(chords: number[][], condition: 'B' | 'C' = 'C') {
    const room = createRoomSession(condition, null);
    let seq = 0;
    for (const [index, notes] of chords.entries()) {
      const tMs = index * 600;
      for (const note of notes) room.apply({ kind: 'noteOn', note, velocity: 70, channel: 0, seq: seq++, tMs });
      for (const note of notes) room.apply({ kind: 'noteOff', note, channel: 0, seq: seq++, tMs: tMs + 400 });
    }
    return room;
  }

  it('names a held inversion without inferring a key from one chord', () => {
    const room = playChords([[52, 55, 60, 72]]);
    expect(room.sample(400, false).harmony).toEqual({
      chord: 'C/E', state: 'chord-only', key: null, next: null, hearings: [],
    });
    expect(room.sample(1200, false).harmony).toBeNull();
  });

  it('hears a ii–V–I resolution and offers one chord to try', () => {
    const chords = [[50, 53, 57], [55, 59, 62], [48, 52, 55]];
    const room = playChords(chords);
    const c = room.sample(1600, false);
    const b = playChords(chords, 'B').sample(1600, false);
    expect(c.harmony).toEqual({
      chord: 'C', state: 'clear', key: 'C major', next: 'F', hearings: [{ key: 'C major', next: 'F' }],
    });
    expect(b.harmony).toBeNull();
    expect(b.frame).toEqual(c.frame);
    expect(c.frame.warmth).toBeGreaterThan(0.15);
    room.reset();
    expect(room.sample(0, false)).toMatchObject({ harmony: null, frame: { warmth: 0, energy: 0 } });
  });

  it('keeps a played Dm7 G7 Cmaj7 clear, because the room hears the cadence', () => {
    const room = playChords([[50, 53, 57, 60], [55, 59, 62, 65], [48, 52, 55, 59]]);
    expect(room.sample(1600, false).harmony).toMatchObject({ chord: 'Cmaj7', state: 'clear', key: 'C major' });
  });

  it('offers one chord per hearing when two keys are close, and only in C', () => {
    const chords = [[55, 59, 62, 65], [50, 53, 57, 60], [48, 52, 55, 59]];
    const c = playChords(chords).sample(1600, false);
    const b = playChords(chords, 'B').sample(1600, false);
    expect(c.harmony).toEqual({
      chord: 'Cmaj7',
      state: 'two-hearings',
      key: null,
      next: null,
      hearings: [{ key: 'C major', next: 'F' }, { key: 'G major', next: 'G' }],
    });
    expect(b.harmony).toBeNull();
    expect(b.frame).toEqual(c.frame);
  });

  it('lets two hearings linger longer than one after the hands lift', () => {
    const twoHearings = playChords([[55, 59, 62, 65], [50, 53, 57, 60], [48, 52, 55, 59]]);
    const clear = playChords([[50, 53, 57], [55, 59, 62], [48, 52, 55]]);
    // Both release their last chord at 1600 ms.
    expect(clear.sample(1600 + LINGER_MS - 1, false).harmony).not.toBeNull();
    expect(clear.sample(1600 + LINGER_MS, false).harmony).toBeNull();
    expect(twoHearings.sample(1600 + LINGER_MS, false).harmony?.state).toBe('two-hearings');
    expect(twoHearings.sample(1600 + TWO_HEARINGS_LINGER_MS - 1, false).harmony).not.toBeNull();
    expect(twoHearings.sample(1600 + TWO_HEARINGS_LINGER_MS, false).harmony).toBeNull();
  });

  it('shows two hearings where it used to withhold the key', () => {
    const room = playChords([[48, 52, 55], [55, 59, 62], [57, 60, 64]]);
    const state = room.sample(1600, false);
    expect(state.harmony).toMatchObject({ chord: 'Am', key: null });
    expect(state.harmony?.hearings).toHaveLength(2);
    expect(state.frame.warmth).toBe(0);
  });
});
