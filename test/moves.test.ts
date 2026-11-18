/**
 * The "what moves" mock. Thin on purpose: it pins the idea, not a voicing
 * rule nobody has agreed to yet.
 */

import { describe, expect, it } from 'vitest';

import { parseChord } from '../src/chords.ts';
import { movesBetween } from '../src/explorer/moves.ts';

const moves = (from: string, to: string) => movesBetween(parseChord(from)!, parseChord(to)!);

describe('movesBetween', () => {
  it('keeps the notes two chords share', () => {
    const { stay, leave, arrive } = moves('C', 'Am');
    expect(stay).toEqual(['C', 'E']);
    expect(leave).toEqual(['G']);
    expect(arrive).toEqual(['A']);
  });

  it('says so when nothing is shared', () => {
    expect(moves('C', 'Dm').sentence).toMatch(/^Nothing stays/);
  });

  it('lands every new note within a tritone of the middle of the hand', () => {
    const { layout } = moves('Cmaj7', 'F');
    const sounding = layout.keys.filter((k) => k.role !== 'idle').map((k) => k.semitone);
    expect(Math.max(...sounding) - Math.min(...sounding)).toBeLessThanOrEqual(12);
  });
});
