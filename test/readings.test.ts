import { describe, expect, it } from 'vitest';

import { parseChord } from '../src/chords.ts';
import type { Key } from '../src/keyprofiles.ts';
import { romanNumeral } from '../src/readings.ts';

const C_MAJOR: Key = { tonic: 0, mode: 'major' };
const A_MINOR: Key = { tonic: 9, mode: 'minor' };

function numeralOf(symbol: string, key: Key = C_MAJOR): string {
  const chord = parseChord(symbol);
  if (chord === null) throw new Error(`cannot parse ${symbol}`);
  return romanNumeral(chord, key).numeral;
}

describe('inversions', () => {
  it.each([
    ['C', 'I'],
    ['G7', 'V7'],
    ['Dm', 'ii'],
  ])('leaves root position alone: %s is %s', (symbol, numeral) => {
    expect(numeralOf(symbol)).toBe(numeral);
  });

  it.each([
    ['G/B', 'V6'],
    ['C/E', 'I6'],
    ['C/G', 'I64'],
    ['Dm/F', 'ii6'],
    ['Bdim/D', 'vii°6'],
  ])('figures a triad: %s is %s', (symbol, numeral) => {
    expect(numeralOf(symbol)).toBe(numeral);
  });

  it.each([
    ['G7/B', 'V65'],
    ['G7/D', 'V43'],
    ['G7/F', 'V42'],
    ['Dm7/C', 'ii42'],
    ['Cmaj7/E', 'Imaj65'],
    ['Bm7b5/D', 'viiø65'],
  ])('replaces the seven in a seventh: %s is %s', (symbol, numeral) => {
    expect(numeralOf(symbol)).toBe(numeral);
  });

  it.each([
    ['C/D', 'I/II'],
    ['G7/C', 'V7/I'],
    ['Csus4/F', 'Isus4/IV'],
    ['Cadd9/E', 'Iadd9/III'],
  ])('uses the bass degree when figures would not apply: %s is %s', (symbol, numeral) => {
    expect(numeralOf(symbol)).toBe(numeral);
  });

  it('keeps a sixth chord apart from a first inversion', () => {
    // Both used to read I6: one figure for two different chords.
    expect(numeralOf('C6')).toBe('Iadd6');
    expect(numeralOf('C/E')).toBe('I6');
    expect(numeralOf('Am6', A_MINOR)).toBe('iadd6');
  });

  it('reads the bass degree against the key, not the chord', () => {
    expect(numeralOf('E/A', A_MINOR)).toBe('V/I');
  });

  it('never shows the old placeholder', () => {
    for (const symbol of ['G/B', 'C/D', 'G7/F', 'Csus4/F', 'Cdim/Gb', 'Cdim/F#']) {
      expect(numeralOf(symbol)).not.toContain('bass');
    }
  });
});
