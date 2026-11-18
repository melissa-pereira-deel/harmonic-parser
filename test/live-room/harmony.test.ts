/**
 * The room's harmony readout as a pure function of the chords it has heard.
 *
 * Four states, driven by the parser's own confidence: chord only (too early,
 * or nothing fits), clear (one key), two hearings (two keys within the
 * margin, each with its own next chord), and merged (two keys that agree on
 * the next chord). The margin and floor are `confidence.ts`'s, unchanged.
 */

import { describe, expect, it } from 'vitest';

import { parseProgression } from '../../src/chords.ts';
import type { Key } from '../../src/keyprofiles.ts';
import { readHarmony } from '../../src/room/analysis/live.ts';

const read = (text: string, cadence?: Key | null) => {
  const { chords, unparsed } = parseProgression(text);
  if (unparsed.length > 0) throw new Error(`fixture did not parse: ${unparsed.join(' ')}`);
  return readHarmony(chords, cadence);
};

describe('readHarmony', () => {
  it('names no key before three distinct chords', () => {
    const quiet = { state: 'chord-only', key: null, next: null, hearings: [] };
    expect(read('C F')).toEqual(quiet);
    expect(read('C F C')).toEqual(quiet);
  });

  it('names no key when nothing fits, as today', () => {
    expect(read('G7 C# E7 F9')).toEqual({ state: 'chord-only', key: null, next: null, hearings: [] });
  });

  it('keeps Am F C G as one hearing', () => {
    expect(read('Am F C G')).toEqual({
      state: 'clear',
      key: 'C major',
      next: 'C',
      hearings: [{ key: 'C major', next: 'C' }],
    });
  });

  it('reads Dm7 G7 Cmaj7 as two hearings, each with its own next chord', () => {
    const twoHearings = {
      state: 'two-hearings',
      key: null,
      next: null,
      hearings: [
        { key: 'C major', next: 'F' },
        { key: 'G major', next: 'G' },
      ],
    };
    // As the parser ranks it, with no cadence heard.
    expect(read('Dm7 G7 Cmaj7', null)).toEqual(twoHearings);
    // The same chords in an order with no V–I at the end.
    expect(read('G7 Dm7 Cmaj7')).toEqual(twoHearings);
  });

  it('lets a heard cadence make the reading clear', () => {
    expect(read('Dm7 G7 Cmaj7')).toEqual({
      state: 'clear',
      key: 'C major',
      next: 'F',
      hearings: [{ key: 'C major', next: 'F' }],
    });
  });

  it('merges two hearings that suggest the same chord', () => {
    expect(read('Cmaj7 Dm7 G7')).toEqual({
      state: 'merged',
      key: null,
      next: 'C',
      hearings: [
        { key: 'C major', next: 'C' },
        { key: 'G major', next: 'C' },
      ],
    });
  });
});
