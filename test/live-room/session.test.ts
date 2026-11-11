import { describe, expect, it } from 'vitest';
import type { ReplayFixture, RoomEvent } from '../../src/room/contracts.ts';
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
    expect(a.frame).toEqual({ tMs: 200, impulse: 0, register: 0.5, envelope: 0, reducedMotion: false });
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

describe('live harmony', () => {
  function playChords(chords: number[][]) {
    const room = createRoomSession('C', null);
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
    expect(room.sample(400, false).harmony).toEqual({ chord: 'C/E', key: null, next: null });
    expect(room.sample(1200, false).harmony).toBeNull();
  });

  it('hears a ii–V–I resolution and offers one chord to try', () => {
    const room = playChords([[50, 53, 57], [55, 59, 62], [48, 52, 55]]);
    expect(room.sample(1600, false).harmony).toEqual({ chord: 'C', key: 'C major', next: 'F' });
    room.reset();
    expect(room.sample(0, false).harmony).toBeNull();
  });

  it('withholds key and suggestions when the key profiles tie', () => {
    const room = playChords([[48, 52, 55], [55, 59, 62], [57, 60, 64]]);
    expect(room.sample(1600, false).harmony).toEqual({ chord: 'Am', key: null, next: null });
  });
});
