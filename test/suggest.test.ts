/**
 * The baseline, pinned.
 *
 * `src/suggest.ts` shipped in this repo's first commit calling itself "the
 * baseline any future model has to beat", and until now **nothing had ever
 * asserted that a single one of its suggestions was right.** That is not an
 * oversight worth fixing quietly: an unmeasured baseline is what
 * tiny-model-lab#18 means by a comparison that decorates rather than tests.
 *
 * These tests do two different jobs and it is worth keeping them apart.
 *
 * The first job is **anti-tampering**. `fixtures/suggest-baseline.json` is the
 * whole baseline as a flat file, and the next-chord experiment will score it
 * from Python by reading that file rather than by re-implementing seventeen
 * rules in a second language. The re-derivation test is what makes the file
 * trustworthy: edit `suggest.ts` and it fails; edit the fixture by hand and it
 * fails.
 *
 * The second job is **describing behaviour, including behaviour that is
 * wrong.** The mode-blindness tests below do not endorse what they assert.
 * They exist because the alternative — leaving it latent — is how a
 * measurement gets attributed to the wrong cause. The tie-break used to be
 * described the same way, as a bug; it is fixed now, and its tests pin the
 * fix.
 */

import { describe, expect, it } from 'vitest';

import type { Fixture } from '../tools/suggest-baseline.ts';
import { buildFixture } from '../tools/suggest-baseline.ts';
import committedJson from '../fixtures/suggest-baseline.json' with { type: 'json' };

// Imported rather than read off disk, the same way test/parity.test.ts loads
// its oracle -- it keeps Node builtins out of a file `tsconfig.json`
// typechecks, in a repo with no @types/node and no runtime dependencies. The
// byte-for-byte half is CI's job: it regenerates and fails on any diff.
const committed = committedJson as unknown as Fixture;

describe('the fixture is the baseline', () => {
  it('re-derives from the real suggest()', () => {
    // The whole anti-tampering argument rests on this one assertion. If it
    // ever needs relaxing, the experiment's baseline stops being reviewable
    // and the honest move is to say so rather than to loosen it.
    expect(buildFixture()).toEqual(committed);
  });

  it('covers the entire input domain and no more', () => {
    // suggest() reads only the last chord's root and the key, so this really
    // is all of it: 12 tonics x 2 modes x 12 degrees.
    expect(committed.rows).toHaveLength(288);
    expect(committed.contexts).toBe(288);

    const seen = new Set(committed.rows.map((r) => `${r.tonic}|${r.mode}|${r.from}`));
    expect(seen.size).toBe(288);
  });

  it('records a degree for every candidate, not just a spelling', () => {
    // The experiment predicts degrees. A fixture carrying only symbols would
    // push the symbol-to-degree mapping into the Python scorer, which is the
    // re-implementation this file exists to avoid.
    for (const row of committed.rows) {
      for (const candidate of row.candidates) {
        expect(candidate.degree).toBeGreaterThanOrEqual(0);
        expect(candidate.degree).toBeLessThan(12);
      }
    }
  });
});

describe('what the rule table can offer', () => {
  it('fans out to at most three from the rule path', () => {
    // 17 moves over 12 antecedents. Degrees 0 and 5 have three; most have one
    // or two. This is the ceiling for any matched-k comparison later: a model
    // that always emits three would otherwise be scored at a different k
    // from a baseline that can only emit one.
    const ruleRows = committed.rows.filter((r) => !r.fallback);
    const widest = Math.max(...ruleRows.map((r) => r.candidates.length));
    expect(widest).toBe(3);
  });

  it('has no rule at all for two degrees, and falls back for them', () => {
    // bII and #IV/bV. Nothing in MOVES has either as an antecedent.
    const fallbackDegrees = new Set(
      committed.rows.filter((r) => r.fallback).map((r) => r.from),
    );
    expect([...fallbackDegrees].sort((a, b) => a - b)).toEqual([1, 6]);
  });

  it('never suggests staying on the same chord', () => {
    // Load-bearing for the experiment rather than for the page. No move has
    // from === to, and the fallback skips the last chord explicitly, so the
    // baseline structurally cannot predict a repeat. Any corpus that encodes
    // held chords as repeated symbols would therefore score the baseline at
    // zero on those rows for a reason that has nothing to do with harmony --
    // which is why the experiment must collapse repeats before scoring.
    for (const row of committed.rows) {
      for (const candidate of row.candidates) {
        expect(candidate.degree, `${row.key} after degree ${row.from}`).not.toBe(row.from);
      }
    }
  });
});

describe('ties are broken by degree, never by spelling', () => {
  // `suggest.ts` used to sort ties with `localeCompare` on the spelled chord
  // name, so a third of all contexts had their top suggestion decided by the
  // alphabet. experiments/suggest-baseline-shape.spike.md measured that before
  // it was fixed; these tests pin what replaced it. Ties now go to the move
  // listed first in MOVES, and in the fallback to the lower degree.

  it('still has ties in a third of all contexts -- only what decides them changed', () => {
    // The weights are untouched, so the count of tied rows is the spike's 96
    // exactly. If this moves, a weight changed, and that is a different PR.
    const tied = committed.rows.filter((r) => r.topIsTied);
    expect(tied).toHaveLength(96);
  });

  it('gives the same answer in every key', () => {
    // The property the alphabet broke. Within one mode, the degrees suggested
    // after a given degree must not depend on which tonic it is: transposing
    // a progression must transpose the suggestions and nothing else. Before
    // the fix, 8 of these 24 contexts failed it.
    for (const mode of ['major', 'minor'] as const) {
      for (let from = 0; from < 12; from++) {
        const answers = new Set(
          committed.rows
            .filter((r) => r.mode === mode && r.from === from)
            .map((r) => r.candidates.map((c) => c.degree).join()),
        );
        expect(answers.size, `${mode}, after degree ${from}`).toBe(1);
      }
    }
  });

  it('goes home after IV in every key', () => {
    // The sharpest instance of the old bug: I and V tie after IV, and the
    // answer used to be I in six major keys and V in the other six. IV to I
    // is listed first in MOVES, so it is I everywhere.
    const afterFour = committed.rows.filter((r) => r.from === 5);
    for (const row of afterFour) expect(row.candidates[0].degree, row.key).toBe(0);

    // The two keys the spike quoted, which used to disagree.
    expect(afterFour.find((r) => r.key === 'C major')?.candidates[0].symbol).toBe('C');
    expect(afterFour.find((r) => r.key === 'D major')?.candidates[0].symbol).toBe('D');
  });

  it('leaves home for IV after I in every key', () => {
    // IV and V tie after I. The alphabet picked IV in 22 of 24 contexts; the
    // table order picks it in all of them.
    const afterOne = committed.rows.filter((r) => r.from === 0);
    for (const row of afterOne) expect(row.candidates[0].degree, row.key).toBe(5);
  });

  it('orders the fallback by degree, tonic first', () => {
    // The fallback ties too: the tonic and dominant at 3, everything else at
    // 2. Lower degree wins, so the order is the scale read upwards.
    const cMajor = committed.rows.find((r) => r.key === 'C major' && r.from === 1);
    expect(cMajor?.candidates.map((c) => c.degree)).toEqual([0, 7, 2, 4, 5, 9, 11]);
    const aMinor = committed.rows.find((r) => r.key === 'A minor' && r.from === 6);
    expect(aMinor?.candidates.map((c) => c.degree)).toEqual([0, 7, 2, 3, 5, 8, 10]);
  });
});

describe('the rule path is mode-blind; only the fallback is not', () => {
  // I expected the whole thing to be mode-blind and the fixture said
  // otherwise, which is the argument for exporting it before reasoning about
  // it. The 17-move table never consults `mode` when choosing a degree -- but
  // the fallback calls `scalePitchClasses(key)`, which really does return the
  // minor scale in a minor key. So the file is half mode-aware, and the half
  // that is not is the half that does the work.

  it('suggests identical degrees in minor and major wherever a rule fires', () => {
    // In a minor key the diatonic degrees are 3, 8 and 10, and rules like
    // vi->IV and iii->vi are major-mode idioms. suggest() applies them
    // unchanged, using `mode` only to spell the chord and pick its triad
    // quality.
    for (let tonic = 0; tonic < 12; tonic++) {
      for (let from = 0; from < 12; from++) {
        if (from === 1 || from === 6) continue; // the fallback, asserted below
        const major = committed.rows.find(
          (r) => r.tonic === tonic && r.mode === 'major' && r.from === from,
        );
        const minor = committed.rows.find(
          (r) => r.tonic === tonic && r.mode === 'minor' && r.from === from,
        );
        // The *set* is identical everywhere, and since the tie-break
        // stopped reading spellings, so is the order -- see below.
        expect(
          minor?.candidates.map((c) => c.degree).sort((a, b) => a - b),
          `${major?.key} vs ${minor?.key} after degree ${from}`,
        ).toEqual(major?.candidates.map((c) => c.degree).sort((a, b) => a - b));
      }
    }
  });

  it('no longer flips an answer on how the tonic is spelled', () => {
    // This was the tightest demonstration of the old tie-break. Ab major and
    // G# minor have the same tonic pitch class and hit the same rules, and
    // after a IV chord they used to disagree -- because one spells its tonic
    // A-flat and the other G-sharp, and `localeCompare` noticed.
    const flat = committed.rows.find((r) => r.key === 'Ab major' && r.from === 5);
    const sharp = committed.rows.find((r) => r.key === 'G# minor' && r.from === 5);

    expect(flat?.tonic).toBe(sharp?.tonic);
    expect(flat?.candidates[0].degree).toBe(0);
    expect(sharp?.candidates[0].degree).toBe(0);

    // It was the only row where minor and major ordered the same rules
    // differently. Now there are none.
    const orderFlips = committed.rows.filter((r) => {
      if (r.mode !== 'minor' || r.from === 1 || r.from === 6) return false;
      const major = committed.rows.find(
        (m) => m.tonic === r.tonic && m.mode === 'major' && m.from === r.from,
      );
      const a = r.candidates.map((c) => c.degree).join();
      const b = major?.candidates.map((c) => c.degree).join();
      return a !== b;
    });
    expect(orderFlips).toHaveLength(0);
  });

  it('does consult the mode in the fallback, where it offers the key scale', () => {
    const majorFallback = committed.rows.find((r) => r.key === 'C major' && r.from === 1);
    const minorFallback = committed.rows.find((r) => r.key === 'C minor' && r.from === 1);

    expect(majorFallback?.candidates.map((c) => c.degree).sort((a, b) => a - b)).toEqual(
      [0, 2, 4, 5, 7, 9, 11],
    );
    expect(minorFallback?.candidates.map((c) => c.degree).sort((a, b) => a - b)).toEqual(
      [0, 2, 3, 5, 7, 8, 10],
    );
  });

  it('still labels them with major-mode reasons in minor', () => {
    // In A minor, a G chord is bVII. The table calls the move "V to I".
    const aMinorAfterSeven = committed.rows.find(
      (r) => r.key === 'A minor' && r.from === 7,
    );
    expect(aMinorAfterSeven?.candidates[0].reason).toContain('V to I');
  });
});
