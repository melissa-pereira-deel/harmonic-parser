/**
 * Correction as a filter over keys.
 *
 * The claims worth pinning are the ones the design rests on: a single pin can
 * never empty the list, two pins can, and editing the progression drops pins
 * that stopped meaning anything.
 */

import { describe, expect, it } from 'vitest';

import { parseProgression } from '../src/chords.ts';
import { keyName } from '../src/keyprofiles.ts';
import { applyPins, optionsFor, prunePins } from '../src/pins.ts';
import { rank } from '../src/readings.ts';

function readingsFor(text: string) {
  return rank(parseProgression(text).chords);
}

describe('the menu is derived from the readings', () => {
  it('offers every numeral the chord actually takes', () => {
    const readings = readingsFor('Am F C G');
    const options = optionsFor(readings, 2); // the C

    // C is the tonic of C major and the fourth of G major. Both are readings
    // the ranker produced, so both must be offerable.
    const numerals = options.map((o) => o.numeral);
    expect(numerals).toContain('I');
    expect(numerals).toContain('IV');
    expect(options.length).toBeGreaterThan(2);
  });

  it('names the best-scoring key for each numeral', () => {
    const readings = readingsFor('Am F C G');
    const tonic = optionsFor(readings, 2).find((o) => o.numeral === 'I');
    expect(tonic).toBeDefined();
    expect(keyName(tonic!.exampleKey)).toBe('C major');
  });

  it('counts how many readings agree, so a rare option looks rare', () => {
    const readings = readingsFor('Am F C G');
    const total = optionsFor(readings, 2).reduce((n, o) => n + o.readings, 0);
    expect(total).toBe(readings.length);
  });
});

describe('a single pin never empties the list', () => {
  // This is the property that makes the menu safe to offer: every option came
  // from a reading, so choosing one always leaves that reading standing. If
  // this ever fails, the menu is being built from something other than the
  // readings and is lying about what is available.
  it.each([
    ['Am F C G', 2],
    ['Dm7 G7 Cmaj7', 0],
    ['C G/B Am F', 1],
  ])('holds for every option on %s chord %i', (text, index) => {
    const readings = readingsFor(text);
    for (const option of optionsFor(readings, index)) {
      const kept = applyPins(readings, new Map([[index, option.numeral]]));
      expect(kept.length, `${option.numeral} emptied the list`).toBeGreaterThan(0);
      expect(kept[0].functions[index].numeral).toBe(option.numeral);
    }
  });

  it('keeps the original order among survivors', () => {
    const readings = readingsFor('Am F C G');
    const kept = applyPins(readings, new Map([[2, 'IV']]));
    const scores = kept.map((r) => r.score);
    expect([...scores].sort((a, b) => b - a)).toEqual(scores);
  });
});

describe('two pins can contradict, and that is an answer', () => {
  it('returns nothing when no key satisfies both', () => {
    const readings = readingsFor('Am F C G');
    // Two different chords cannot both be the tonic of one key.
    const kept = applyPins(readings, new Map([[2, 'I'], [3, 'I']]));
    expect(kept).toEqual([]);
  });

  it('does not quietly drop a pin to keep the list non-empty', () => {
    // The page overruling the person inside the override feature would be
    // the worst possible failure here, so it is pinned explicitly.
    const readings = readingsFor('Am F C G');
    const kept = applyPins(readings, new Map([[0, 'i'], [2, 'IV']]));
    for (const reading of kept) {
      expect(reading.functions[0].numeral).toBe('i');
      expect(reading.functions[2].numeral).toBe('IV');
    }
  });

  it('is a no-op with no pins', () => {
    const readings = readingsFor('Am F C G');
    expect(applyPins(readings, new Map())).toHaveLength(readings.length);
  });
});

describe('pins are dropped when they stop meaning anything', () => {
  it('keeps a pin when the chord it names is unchanged', () => {
    const pins = new Map([[1, 'IV']]);
    expect(prunePins(pins, ['Am', 'F', 'C'], ['Am', 'F', 'C', 'G'])).toEqual(pins);
  });

  it('drops a pin when that chord was replaced', () => {
    const pins = new Map([[1, 'IV']]);
    expect(prunePins(pins, ['Am', 'F', 'C'], ['Am', 'Bb', 'C'])).toEqual(new Map());
  });

  it('drops a pin when the progression got shorter', () => {
    const pins = new Map([[3, 'V']]);
    expect(prunePins(pins, ['Am', 'F', 'C', 'G'], ['Am', 'F'])).toEqual(new Map());
  });

  it('keeps unaffected pins when a later chord changes', () => {
    const pins = new Map([[0, 'vi'], [3, 'V']]);
    const kept = prunePins(pins, ['Am', 'F', 'C', 'G'], ['Am', 'F', 'C', 'Bb']);
    expect(kept).toEqual(new Map([[0, 'vi']]));
  });
});
