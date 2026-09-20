/**
 * A reading is one way of hearing a progression: a key, what each chord is
 * doing in that key, and how well the key fits.
 *
 * `source` names which producer made the reading, and it exists on day one
 * though there is exactly one producer. That is deliberate. A grammar and an
 * n-gram model are both plausible second and third producers, and when either
 * arrives the UI must not learn that anything changed — it already renders a
 * list of `Reading`, already sorts by `score`, and already has somewhere to
 * put "this came from the key profiles, that one came from the model". Adding
 * the field later would mean touching every consumer at the moment you are
 * least able to afford it.
 *
 * `'grammar'` and `'model'` are not implemented and nothing in this repo
 * produces them. Do not read the union as a roadmap that has been costed.
 */

import type { Chord, PitchClass } from './chords.ts';
import { pitchClasses } from './chords.ts';
import type { Key, Mode } from './keyprofiles.ts';
import { KEY_PROFILES } from './keyprofiles.ts';

export type ReadingSource = 'key-profile' | 'grammar' | 'model';

export interface RomanNumeral {
  /** The chord symbol as typed, so the UI can line the two up. */
  readonly symbol: string;
  /** `V7`, `ii`, `bVII`, `vii°7`. */
  readonly numeral: string;
  /** One phrase for what it is doing. Empty for chords outside the key. */
  readonly role: string;
  readonly diatonic: boolean;
}

export interface Reading {
  readonly key: Key;
  readonly functions: RomanNumeral[];
  /** Higher is better. For `'key-profile'` this is a correlation in [-1, 1]. */
  readonly score: number;
  readonly source: ReadingSource;
}

/**
 * Degree spelling per mode. Indexed by semitones above the tonic.
 *
 * Minor spells its own sixth and seventh without a flat, because in a minor
 * key they are the diatonic degrees rather than borrowings. This is a lookup,
 * not a grammar: it never looks at the chord before or after.
 */
const DEGREES: Readonly<Record<Mode, readonly string[]>> = {
  major: [
    'I',
    'bII',
    'II',
    'bIII',
    'III',
    'IV',
    '#IV',
    'V',
    'bVI',
    'VI',
    'bVII',
    'VII',
  ],
  minor: [
    'I',
    'bII',
    'II',
    'III',
    '#III',
    'IV',
    '#IV',
    'V',
    'VI',
    '#VI',
    'VII',
    '#VII',
  ],
};

/** Semitones above the tonic that the mode's own scale contains. */
const SCALE: Readonly<Record<Mode, readonly number[]>> = {
  major: [0, 2, 4, 5, 7, 9, 11],
  minor: [0, 2, 3, 5, 7, 8, 10],
};

const LOWERCASE_QUALITIES = new Set([
  'min',
  'dim',
  'min7',
  'min7b5',
  'dim7',
  'min6',
  'min9',
]);

const FIGURES: Readonly<Record<string, string>> = {
  maj: '',
  min: '',
  dim: '°',
  aug: '+',
  sus2: 'sus2',
  sus4: 'sus4',
  dom7: '7',
  maj7: 'maj7',
  min7: '7',
  min7b5: 'ø7',
  dim7: '°7',
  maj6: '6',
  min6: '6',
  add9: 'add9',
  dom9: '9',
  min9: '9',
  dom7sus4: '7sus4',
};

/**
 * What a degree is doing, in the key it is being heard in.
 *
 * Function is read off the scale degree alone. That is the honest limit of a
 * lookup: `V` here means "the chord on the fifth degree", not "a chord that
 * resolved". Telling those apart needs a grammar, which is the `'grammar'`
 * source and does not exist.
 */
const ROLES: Readonly<Record<string, string>> = {
  I: 'tonic — home',
  II: 'predominant — leans on V',
  III: 'tonic-ish — shares two notes with I',
  IV: 'subdominant — leaves home',
  V: 'dominant — pulls back to I',
  VI: 'tonic substitute — the soft landing',
  VII: 'leading — pulls to I',
  bII: 'chromatic — Neapolitan colour',
  bIII: 'borrowed from the parallel minor',
  bVI: 'borrowed from the parallel minor',
  bVII: 'borrowed — the rock cadence',
  '#IV': 'chromatic — usually a secondary dominant',
  '#III': 'chromatic',
  '#VI': 'chromatic — raised sixth',
  '#VII': 'leading tone — the harmonic minor seventh',
};

function romanNumeral(chord: Chord, key: Key): RomanNumeral {
  const semitones = (chord.root - key.tonic + 12) % 12;
  const degree = DEGREES[key.mode][semitones];
  const lower = LOWERCASE_QUALITIES.has(chord.quality);
  const numeral = (lower ? degree.toLowerCase() : degree) + FIGURES[chord.quality];
  const inversion = chord.bass === chord.root ? '' : '/bass';
  return {
    symbol: chord.symbol,
    numeral: numeral + inversion,
    role: ROLES[degree] ?? 'chromatic',
    diatonic: SCALE[key.mode].includes(semitones),
  };
}

/**
 * Sum the pitch classes a progression sounds, one count per chord tone.
 *
 * Every chord is weighted equally. Real music weights by duration and a chord
 * box has no durations to weight by, so this is the assumption the whole
 * ranking rests on, and it is unmeasured. `tools/generate-fixtures.py` makes
 * the same assumption, which means the parity test proves the port faithful,
 * not the assumption right.
 */
export function pitchClassProfile(chords: readonly Chord[]): number[] {
  const counts = new Array<number>(12).fill(0);
  for (const chord of chords) {
    for (const pc of pitchClasses(chord)) counts[pc] += 1;
  }
  return counts;
}

/**
 * Pearson correlation between two twelve-element vectors.
 *
 * This is the whole of Krumhansl-Schmuckler, and it is what music21's
 * `Key.correlationCoefficient` reports — verified to fifteen decimal places
 * against music21 v10.5.0 before the fixture was generated.
 */
function correlation(a: readonly number[], b: readonly number[]): number {
  const meanA = a.reduce((s, x) => s + x, 0) / a.length;
  const meanB = b.reduce((s, x) => s + x, 0) / b.length;
  let cov = 0;
  let varA = 0;
  let varB = 0;
  for (let i = 0; i < a.length; i += 1) {
    const da = a[i] - meanA;
    const db = b[i] - meanB;
    cov += da * db;
    varA += da * da;
    varB += db * db;
  }
  const denom = Math.sqrt(varA * varB);
  // A progression whose pitch classes are perfectly flat has no variance and
  // so no correlation with anything. Score it zero rather than NaN; the
  // uncertainty threshold will catch it and say nothing fits.
  return denom === 0 ? 0 : cov / denom;
}

/**
 * Every key, ranked. Always 24 readings, never fewer — the caller decides how
 * many to show, and `confidence.ts` needs the runners-up to tell ambiguity
 * from uncertainty.
 *
 * Ties break by the key order in `KEY_PROFILES` (C major, C minor, C# major,
 * ...), which is arbitrary but deterministic. An exact tie between two keys
 * is a fact about the input, not about the sort.
 */
export function rank(chords: readonly Chord[]): Reading[] {
  if (chords.length === 0) return [];
  const profile = pitchClassProfile(chords);
  return KEY_PROFILES.map(({ key, weights }) => ({
    key,
    functions: chords.map((chord) => romanNumeral(chord, key)),
    score: correlation(profile, weights),
    source: 'key-profile' as const,
  })).sort((x, y) => y.score - x.score);
}

/** The pitch classes a key's own scale contains. Used by `suggest.ts`. */
export function scalePitchClasses(key: Key): PitchClass[] {
  return SCALE[key.mode].map((s) => (key.tonic + s) % 12);
}

export { romanNumeral };
