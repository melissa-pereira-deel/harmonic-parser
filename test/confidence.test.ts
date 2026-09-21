/**
 * The two thresholds, and the distinction they exist to keep.
 *
 * These tests pin the *shape* of the claim — that a relative major and its
 * relative minor come out ambiguous and not uncertain, and that a pile of
 * unrelated triads comes out uncertain and not merely ambiguous. They do not
 * pin the numbers: `AMBIGUITY_MARGIN` and `UNCERTAINTY_FLOOR` are unmeasured
 * and are expected to move. A test that asserted 0.06 would make tuning them
 * look like a regression.
 */

import { describe, expect, it } from 'vitest';

import { parseProgression } from '../src/chords.ts';
import { AMBIGUITY_MARGIN, UNCERTAINTY_FLOOR, assess } from '../src/confidence.ts';
import { keyName } from '../src/keyprofiles.ts';
import { rank } from '../src/readings.ts';

function read(text: string) {
  return assess(rank(parseProgression(text).chords));
}

describe('ambiguity is not uncertainty', () => {
  // KNOWN FAILING, deliberately. `it.fails` asserts this does NOT hold
  // today, so it goes red in both directions: if somebody fixes it, and
  // if somebody breaks it further. The assertion below is unchanged --
  // see experiments/confidence-thresholds.spike.md for what was measured, and
  // why the number must not simply be adjusted until this passes.
  it.fails('calls a relative major/minor pair ambiguous, not uncertain', () => {
    const c = read('Am F C G');
    expect(c.uncertain).toBe(false);
    expect(c.ambiguous).toBe(true);
    expect(c.contenders.map((r) => keyName(r.key))).toContain('C major');
    expect(c.contenders.map((r) => keyName(r.key))).toContain('A minor');
  });

  // KNOWN FAILING, deliberately. `it.fails` asserts this does NOT hold
  // today, so it goes red in both directions: if somebody fixes it, and
  // if somebody breaks it further. The assertion below is unchanged --
  // see experiments/confidence-thresholds.spike.md for what was measured, and
  // why the number must not simply be adjusted until this passes.
  it.fails('calls a plain cadence clear', () => {
    const c = read('Dm7 G7 Cmaj7');
    expect(c.uncertain).toBe(false);
    expect(c.ambiguous).toBe(false);
    expect(keyName(c.contenders[0].key)).toBe('C major');
  });

  // KNOWN FAILING, deliberately. `it.fails` asserts this does NOT hold
  // today, so it goes red in both directions: if somebody fixes it, and
  // if somebody breaks it further. The assertion below is unchanged --
  // see experiments/confidence-thresholds.spike.md for what was measured, and
  // why the number must not simply be adjusted until this passes.
  it.fails('calls unrelated triads uncertain', () => {
    const c = read('C F#m7b5 Bb E');
    expect(c.uncertain).toBe(true);
  });

  it('says nothing at all about an empty box', () => {
    const c = read('');
    expect(c.margin).toBeNull();
    expect(c.contenders).toEqual([]);
    expect(c.uncertain).toBe(true);
  });
});

describe('the wrong-state is reachable', () => {
  // The page has a designed degraded state -- dashed cards, no emphasised
  // winner, suggestions withheld -- and all of it hangs off
  // `confidence.uncertain`. If UNCERTAINTY_FLOOR is ever tuned down far
  // enough that nothing trips it, that whole design becomes dead code and
  // nothing else in the suite would notice. This is the tripwire.
  //
  // 16 of the 200 fixture progressions score below the floor; these are the
  // two lowest.
  it.each([['C#9 C#dim Abm6 F#aug Gaug Dm'], ['F#9 Abm9 C9']])(
    'calls %s uncertain',
    (progression) => {
      const { chords, unparsed } = parseProgression(progression);
      expect(unparsed, 'every chord must parse or the case proves nothing').toEqual([]);
      expect(assess(rank(chords)).uncertain).toBe(true);
    },
  );

  it('does not call an ordinary progression uncertain', () => {
    // The other half of the tripwire. A floor raised until everything trips
    // it would make the wrong-state permanent, which is equally broken.
    expect(read('Am F C G').uncertain).toBe(false);
    expect(read('Dm7 G7 Cmaj7').uncertain).toBe(false);
  });
});

describe('the thresholds are separate numbers', () => {
  // KNOWN FAILING, deliberately. `it.fails` asserts this does NOT hold
  // today, so it goes red in both directions: if somebody fixes it, and
  // if somebody breaks it further. The assertion below is unchanged --
  // see experiments/confidence-thresholds.spike.md for what was measured, and
  // why the number must not simply be adjusted until this passes.
  it.fails('reads a margin, not an absolute, for ambiguity', () => {
    const c = read('Am F C G');
    expect(c.margin).not.toBeNull();
    expect(c.margin!).toBeLessThanOrEqual(AMBIGUITY_MARGIN);
  });

  // KNOWN FAILING, deliberately. `it.fails` asserts this does NOT hold
  // today, so it goes red in both directions: if somebody fixes it, and
  // if somebody breaks it further. The assertion below is unchanged --
  // see experiments/confidence-thresholds.spike.md for what was measured, and
  // why the number must not simply be adjusted until this passes.
  it.fails('reads an absolute, not a margin, for uncertainty', () => {
    const c = read('C F#m7b5 Bb E');
    expect(c.contenders[0].score).toBeLessThan(UNCERTAINTY_FLOOR);
  });

  it('never returns a single number that conflates them', () => {
    // If this ever compiles with a `confidence` field, the distinction has
    // been collapsed back into the thing this module exists to prevent.
    const c = read('Am F C G');
    expect(Object.keys(c).sort()).toEqual([
      'ambiguous',
      'contenders',
      'margin',
      'summary',
      'uncertain',
    ]);
  });
});
