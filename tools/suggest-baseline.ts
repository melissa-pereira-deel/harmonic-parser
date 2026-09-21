/**
 * Export the entire baseline as a flat file, once, from the real code.
 *
 * `suggest()` reads exactly two things: the last chord's root and the key. So
 * its whole input domain is **12 tonics x 2 modes x 12 last degrees = 288
 * contexts**, and the baseline is a 288-row table that happens to be written
 * as seventeen rules.
 *
 * That matters because the next-chord experiment
 * (tiny-model-lab#18) has to score this baseline from Python, and the
 * alternative to a fixture is re-implementing the rule table, two spelling
 * tables, a quality table, the fallback and the tie-break in a second
 * language. Every transcription slip there would be invisible and would
 * favour the model -- which is precisely the failure #18 exists to prevent,
 * achieved by typo rather than by intent. There is no port to get wrong if
 * there is no port.
 *
 * Same idiom as `fixtures/music21-rankings.json`: generated from the source of
 * truth, committed, and regenerated in CI so any drift shows up as a diff.
 *
 * No Node builtins in this file on purpose: `test/suggest.test.ts` imports
 * it to re-derive the fixture, and `tsconfig.json` typechecks `test/`, so
 * anything reachable from here would need @types/node. The file writing
 * lives next door in `export-suggest-baseline.ts`.
 */

import { parseChord } from '../src/chords.ts';
import type { Key, Mode } from '../src/keyprofiles.ts';
import { keyName, tonicName } from '../src/keyprofiles.ts';
import { suggest } from '../src/suggest.ts';

/**
 * Explicit, not the `suggest()` default of 4.
 *
 * The rule path can offer at most 3 (degrees 0 and 5); the fallback can offer
 * 7 before truncation. Pinning the limit here means the fixture records the
 * full fallback rather than a 4-item slice of it, so a later scorer can match
 * k per row instead of guessing what was cut.
 */
const LIMIT = 8;

const MODES: readonly Mode[] = ['major', 'minor'];

interface Candidate {
  /** Semitones above the tonic. What the experiment actually predicts. */
  readonly degree: number;
  readonly symbol: string;
  readonly reason: string;
  readonly weight: number;
}

export interface Row {
  readonly key: string;
  readonly tonic: number;
  readonly mode: Mode;
  /** Semitones of the last chord above the tonic. */
  readonly from: number;
  /** True when no rule matched and the key's own chords were used instead. */
  readonly fallback: boolean;
  /** Whether the top two candidates share a weight, so order came from the
   *  alphabet rather than from the table. */
  readonly topIsTied: boolean;
  readonly candidates: Candidate[];
}

/**
 * Recover the degree by parsing the symbol `suggest()` produced.
 *
 * `Suggestion` carries a spelled symbol and no pitch class, and the honest way
 * back is the parser the page itself uses -- inverting `spell()` by hand would
 * be a second implementation of exactly the kind this file exists to avoid.
 */
function degreeOf(symbol: string, tonic: number): number {
  const chord = parseChord(symbol);
  if (chord === null) {
    throw new Error(
      `suggest() produced "${symbol}", which parseChord cannot read. ` +
        'The two disagree about chord spelling and the fixture would be wrong.',
    );
  }
  return ((chord.root - tonic) % 12 + 12) % 12;
}

/** A chord on `degree` above `tonic`, for feeding back in as "the last chord". */
function probeChord(tonic: number, degree: number) {
  const pc = (tonic + degree) % 12;
  const chord = parseChord(SHARP_NAMES[pc]);
  if (chord === null) throw new Error(`cannot build a probe chord for pc ${pc}`);
  return chord;
}

// Only used to construct a probe input. The spelling never reaches the
// fixture -- `suggest()` re-spells everything in the key's own accidentals --
// and `suggest()` reads only `.root`, so the quality is irrelevant too.
const SHARP_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

export function exportRows(): Row[] {
  const rows: Row[] = [];
  for (let tonic = 0; tonic < 12; tonic++) {
    for (const mode of MODES) {
      const key: Key = { tonic, mode };
      for (let from = 0; from < 12; from++) {
        const out = suggest([probeChord(tonic, from)], key, LIMIT);
        const candidates = out.map((s) => ({
          degree: degreeOf(s.symbol, tonic),
          symbol: s.symbol,
          reason: s.reason,
          weight: s.weight,
        }));
        rows.push({
          key: keyName(key),
          tonic,
          mode,
          from,
          // The fallback writes its own reason, and it is the only path that
          // does. Cheaper and more robust than re-deriving which degrees have
          // no rule.
          fallback: out.length > 0 && out[0].reason.includes('no rule covers this move'),
          topIsTied: candidates.length > 1 && candidates[0].weight === candidates[1].weight,
          candidates,
        });
      }
    }
  }
  return rows;
}

export interface Fixture {
  readonly generator: string;
  readonly source: string;
  readonly limit: number;
  readonly contexts: number;
  readonly note: string;
  readonly rows: Row[];
}

/** The committed file's exact shape, so the test can rebuild it byte for byte. */
export function buildFixture(): Fixture {
  const rows = exportRows();
  return {
    generator: 'tools/export-suggest-baseline.ts',
    source: 'src/suggest.ts',
    limit: LIMIT,
    contexts: rows.length,
    note:
      'The complete baseline. suggest() reads only the last chord root and the ' +
      'key, so 12 tonics x 2 modes x 12 degrees is its entire input domain. ' +
      'Generated, never edited by hand: test/suggest.test.ts re-derives it and ' +
      'CI fails on any diff.',
    rows,
  };
}

export function serialise(fixture: Fixture): string {
  return `${JSON.stringify(fixture, null, 1)}\n`;
}

/** Key-aware tonic spelling, for the CLI's report. */
export function tonicNameFor(tonic: number, mode: Mode): string {
  return tonicName({ tonic, mode });
}
