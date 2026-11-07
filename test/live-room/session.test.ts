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
