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

  it('says only what to add when nothing has to go', () => {
    expect(moves('C', 'Cmaj7').sentence).toBe('Keep C, E, G. Add B.');
  });

  it('says only what to let go of when nothing new comes in', () => {
    expect(moves('C7', 'C').sentence).toBe('Keep C, E, G. Let go of B♭.');
  });

  it('says so when the chord does not change', () => {
    expect(moves('C', 'C').sentence).toBe('Nothing changes. Keep C, E, G.');
  });

  it('treats a slash bass as its own voice under the hand', () => {
    const toFirstInversion = moves('C', 'C/E');
    expect(toFirstInversion.stay).toEqual(['C', 'E', 'G']);
    expect(toFirstInversion.arrive).toEqual(['E in the bass']);
    expect(toFirstInversion.sentence).toBe('Keep C, E, G. Add E in the bass.');

    const lowest = (m: ReturnType<typeof moves>) =>
      m.layout.keys.find((k) => k.role !== 'idle');
    expect(lowest(toFirstInversion)).toMatchObject({ name: 'E', role: 'arrive' });

    expect(moves('Am/G', 'Am').sentence).toBe('Keep A, C, E. Let go of G in the bass.');
  });

  it('keeps a shared bass where it is', () => {
    const { stay, leave, arrive } = moves('C/E', 'Am/E');
    expect(stay).toContain('E in the bass');
    expect(leave.some((name) => name.endsWith('in the bass'))).toBe(false);
    expect(arrive.some((name) => name.endsWith('in the bass'))).toBe(false);
  });
});
