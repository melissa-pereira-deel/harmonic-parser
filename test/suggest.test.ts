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
 * from Python by reading that file rather than by re-implementing the rule
 * tables in a second language. The re-derivation test is what makes the file
 * trustworthy: edit `suggest.ts` and it fails; edit the fixture by hand and it
 * fails.
 *
 * The second job is **describing behaviour, including behaviour that is
 * wrong.** The mode-blindness tests that used to be here did not endorse what
 * they asserted. They existed because the alternative — leaving it latent — is
 * how a measurement gets attributed to the wrong cause. The tie-break was
 * described the same way, as a bug. Both are fixed now, and their tests pin
 * the fixes.
 */

import { describe, expect, it } from 'vitest';

import type { Chord } from '../src/chords.ts';
import { parseChord } from '../src/chords.ts';
import type { Key } from '../src/keyprofiles.ts';
import type { Suggestion } from '../src/suggest.ts';
import { diatonicFallback, suggest } from '../src/suggest.ts';
import { romanNumeral } from '../src/readings.ts';
import type { Fixture } from '../tools/suggest-baseline.ts';
import { buildFixture } from '../tools/suggest-baseline.ts';
import committedJson from '../fixtures/suggest-baseline.json' with { type: 'json' };

// Imported rather than read off disk, the same way test/parity.test.ts loads
// its oracle -- it keeps Node builtins out of a file `tsconfig.json`
// typechecks, in a repo with no @types/node and no runtime dependencies. The
// byte-for-byte half is CI's job: it regenerates and fails on any diff.
const committed = committedJson as unknown as Fixture;

const C_MAJOR: Key = { tonic: 0, mode: 'major' };
const C_MINOR: Key = { tonic: 0, mode: 'minor' };
const A_MINOR: Key = { tonic: 9, mode: 'minor' };

function chord(symbol: string): Chord {
  const parsed = parseChord(symbol);
  if (parsed === null) throw new Error(`test chord "${symbol}" does not parse`);
  return parsed;
}

/** Degrees above the key's tonic, read back through the parser as the fixture does. */
function degrees(suggestions: readonly Suggestion[], key: Key): number[] {
  return suggestions.map((s) => (chord(s.symbol).root - key.tonic + 12) % 12);
}

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
    // Moves over 12 antecedents. Degrees 0 and 5 have three; most have one
    // or two, and 1 and 6 have two each. This is the ceiling for any matched-k
    // comparison later: a model that always emits three would otherwise be
    // scored at a different k from a baseline that can only emit one.
    const ruleRows = committed.rows.filter((r) => !r.fallback);
    const widest = Math.max(...ruleRows.map((r) => r.candidates.length));
    expect(widest).toBe(3);
  });

  it('has a rule for every degree in both modes, so nothing falls back', () => {
    // This used to assert [1, 6]: bII and #IV/bV had no antecedent in either
    // table, so 48 of 288 contexts fell back to the key's own chords. #13
    // decided that was a gap rather than a boundary, and gave each two rules.
    // 48/288 is now 0/288, and every context has at least one rule.
    expect(committed.rows.filter((r) => r.fallback)).toEqual([]);
    for (const row of committed.rows) {
      expect(row.candidates.length, `${row.key} after degree ${row.from}`).toBeGreaterThan(0);
    }
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

  it('has ties in a sixth of all contexts, all of them after I or IV', () => {
    // This was 96 of 288, the spike's count, which the tie-break fix left alone
    // because it moved no weight. Half of those were the fallback after bII and
    // the tritone, where the tonic and dominant tie at 3. Those degrees now have
    // rules with two different weights each, so 96 is now 48: degrees 0 and 5 in
    // both modes, where table order decides. If this moves, a weight changed,
    // and that is a different PR.
    const tied = committed.rows.filter((r) => r.topIsTied);
    expect(tied).toHaveLength(48);
    expect([...new Set(tied.map((r) => r.from))].sort((a, b) => a - b)).toEqual([0, 5]);
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
    //
    // This read the fixture's C major and A minor rows after degrees 1 and 6.
    // Those rows now have rules, and no row falls back (48/288 is 0/288), so
    // it calls the fallback directly: the same function suggest() calls when
    // no rule matches, with the same last chords the fixture probed. What it
    // cannot show is suggest() reaching it, because nothing does.
    const cMajor = diatonicFallback(chord('C#').root, C_MAJOR);
    expect(degrees(cMajor, C_MAJOR)).toEqual([0, 7, 2, 4, 5, 9, 11]);
    const aMinor = diatonicFallback(chord('D#').root, A_MINOR);
    expect(degrees(aMinor, A_MINOR)).toEqual([0, 7, 2, 3, 5, 8, 10]);
    expect(aMinor.map((s) => s.weight)).toEqual([3, 3, 2, 2, 2, 2, 2]);
    expect(aMinor[0].reason).toBe('diatonic in A minor — no rule covers this move');
  });
});

describe('suggestions are spelled by key signature', () => {
  it.each(['C minor', 'D minor', 'G minor', 'F minor', 'Bb minor', 'Eb minor', 'F major', 'Bb major', 'Eb major', 'Ab major'])(
    'never uses a sharp in %s',
    (key) => {
      const symbols = committed.rows
        .filter((r) => r.key === key)
        .flatMap((r) => r.candidates.map((c) => c.symbol));
      expect(symbols.length).toBeGreaterThan(0);
      expect(symbols.filter((s) => s.includes('#'))).toEqual([]);
    },
  );

  it('spells the flat side of C minor with flats', () => {
    const symbols = committed.rows
      .filter((r) => r.key === 'C minor')
      .flatMap((r) => r.candidates.map((c) => c.symbol.replace(/m|dim/, '')));
    expect(symbols).toEqual(expect.arrayContaining(['Eb', 'Ab', 'Bb']));
  });

  // A key uses each letter once. Checked over every in-scale candidate in the
  // fixture, without the step table `suggest.ts` spells with, so this is not
  // the implementation asserting itself. "Never uses a sharp" passed while Eb
  // minor offered both `Bb` and `B`, two chords on one letter (#37).
  it.each([...new Set(committed.rows.map((r) => r.key))])(
    'uses each letter once across the scale of %s',
    (key) => {
      const rows = committed.rows.filter((r) => r.key === key);
      const scale = rows[0].mode === 'major' ? [0, 2, 4, 5, 7, 9, 11] : [0, 2, 3, 5, 7, 8, 10];
      const letterOf = new Map<number, Set<string>>();
      for (const c of rows.flatMap((r) => r.candidates)) {
        if (!scale.includes(c.degree)) continue;
        const letters = letterOf.get(c.degree) ?? new Set<string>();
        letters.add(c.symbol[0]);
        letterOf.set(c.degree, letters);
      }
      const used = [...letterOf.values()];
      expect(used.every((s) => s.size === 1)).toBe(true);
      expect(new Set(used.map((s) => [...s][0])).size).toBe(used.length);
    },
  );

  it('spells the flat sixth of Eb minor as Cb', () => {
    const tonic = committed.rows.find((r) => r.key === 'Eb minor' && r.from === 0);
    expect(tonic?.candidates.map((c) => c.symbol)).toContain('Cb');
  });

  it('keeps sharps in the sharp keys', () => {
    const symbols = committed.rows
      .filter((r) => r.key === 'E major')
      .flatMap((r) => r.candidates.map((c) => c.symbol));
    expect(symbols.some((s) => s.includes('#'))).toBe(true);
  });
});

describe('minor keys have their own rules', () => {
  // The rule table used to be major-only and applied unchanged in minor, which
  // sent every minor key to degree 9, a note outside its scale. In A minor that
  // was a suggestion of F#. See experiments/suggest-baseline-shape.spike.md.
  const minorRows = committed.rows.filter((r) => r.mode === 'minor');
  const MINOR_SCALE = [0, 2, 3, 5, 7, 8, 10];

  it('never suggests a degree outside the minor scale', () => {
    for (const row of minorRows) {
      for (const candidate of row.candidates) {
        expect(MINOR_SCALE, `${row.key} after degree ${row.from}`).toContain(candidate.degree);
      }
    }
  });

  it('covers the same contexts as major', () => {
    // This asserted [1, 6] in both modes, deliberately: whether those degrees
    // were a gap was a separate decision, and the minor table did not move it.
    // #13 decided it, and both tables gained rules for both degrees. The minor
    // fallback set is now empty, 24/144 to 0/144, and so is the major one.
    const fallbackFrom = (mode: 'major' | 'minor') =>
      committed.rows.filter((r) => r.mode === mode && r.fallback).map((r) => r.from);
    expect(fallbackFrom('minor')).toEqual([]);
    expect(fallbackFrom('minor')).toEqual(fallbackFrom('major'));
  });

  it('resolves the dominant to the tonic, with a major dominant as the target', () => {
    const afterFive = minorRows.find((r) => r.key === 'A minor' && r.from === 7);
    expect(afterFive?.candidates[0].symbol).toBe('Am');
    expect(afterFive?.candidates[0].reason).toContain('V to i');

    const afterTwo = minorRows.find((r) => r.key === 'A minor' && r.from === 2);
    expect(afterTwo?.candidates[0].symbol).toBe('E');
  });

  it('names the deceptive cadence on the sixth', () => {
    const afterFive = minorRows.find((r) => r.key === 'A minor' && r.from === 7);
    expect(afterFive?.candidates[1].symbol).toBe('F');
  });

  it('names chords in its reasons the way the chord cards do', () => {
    // The minor reasons used to say bIII, bVI and bVII, so in A minor a G
    // card read VII while its suggestion said "bVII". Both numerals in each
    // reason should be what `romanNumeral` puts on the card for that chord.
    // bII and the raised fourth are left out: their rules key on the degree
    // alone and name the seventh chord (bII7, #iv°7) after a plain triad.
    //
    // The target side skips G#dim. Its rule's `quality: 'dim'` lands on the
    // target, so it suggests Adim where the reason says i. That is a symbol
    // bug, not a wording one, and is left for its own change.
    const lasts = ['Am', 'Bdim', 'C', 'C#', 'Dm', 'E', 'F', 'F#', 'G', 'G#dim'];
    for (const symbol of lasts) {
      const last = chord(symbol);
      for (const s of suggest([last], A_MINOR)) {
        const named = /^(\S+) (?:back )?to (\S+)/.exec(s.reason);
        expect(named, s.reason).not.toBeNull();
        expect(named?.[1], s.reason).toBe(romanNumeral(last, A_MINOR).numeral);
        if (symbol === 'G#dim') continue;
        expect(named?.[2], s.reason).toBe(romanNumeral(chord(s.symbol), A_MINOR).numeral);
      }
    }
  });

  it('does not flip an answer on how the tonic is spelled', () => {
    // Ab major and G# minor share a tonic pitch class. This was the tightest
    // demonstration of the old alphabetical tie-break.
    const flat = committed.rows.find((r) => r.key === 'Ab major' && r.from === 5);
    const sharp = committed.rows.find((r) => r.key === 'G# minor' && r.from === 5);

    expect(flat?.tonic).toBe(sharp?.tonic);
    expect(flat?.candidates[0].degree).toBe(0);
    expect(sharp?.candidates[0].degree).toBe(0);
  });

  it('offers the key scale in the fallback', () => {
    // Read from the fixture's C major and C minor rows after degree 1 until
    // those rows gained rules. Called directly now, for the reason given in
    // 'orders the fallback by degree, tonic first'.
    const majorFallback = diatonicFallback(chord('C#').root, C_MAJOR);
    const minorFallback = diatonicFallback(chord('C#').root, C_MINOR);

    expect(degrees(majorFallback, C_MAJOR).sort((a, b) => a - b)).toEqual(
      [0, 2, 4, 5, 7, 9, 11],
    );
    expect(degrees(minorFallback, C_MINOR).sort((a, b) => a - b)).toEqual(
      [0, 2, 3, 5, 7, 8, 10],
    );
  });
});

describe('bII and the tritone have rules', () => {
  // Neither degree had a rule in either mode until #13, and all 48 of their
  // contexts fell back to the key's diatonic chords, tonic first. The owner
  // approved two idioms for each. The weights are hand-assigned, like the
  // rest of the table, and nothing has measured them.
  const after = (symbol: string, key: Key) => suggest([chord(symbol)], key).map((s) => s.symbol);

  it('resolves bII to I, then V, in major -- the tritone substitution first', () => {
    expect(after('Db', C_MAJOR)).toEqual(['C', 'G']);
  });

  it('resolves #iv° to V, then I, in major', () => {
    expect(after('F#dim', C_MAJOR)).toEqual(['G', 'C']);
  });

  it('resolves bII to a major V, then i, in minor -- the Neapolitan first', () => {
    // The order from bII is reversed between the modes, as the owner decided.
    expect(after('Bb', A_MINOR)).toEqual(['E', 'Am']);
  });

  it('resolves #iv° to a major V, then i, in minor', () => {
    expect(after('D#dim', A_MINOR)).toEqual(['E', 'Am']);
  });
});
