/**
 * The model. Twenty-four key profiles of twelve numbers each, about 1.2 KB.
 *
 * Source: the `KrumhanslSchmuckler` weightings in
 * `music21.analysis.discrete.KeyWeightKeyAnalysis.getWeights`, music21 v10.5.0
 * (identical to its `KrumhanslKessler` since music21 v6.3, where the two were
 * found to differ only by a typo). music21 in turn cites
 * https://extras.humdrum.org/man/keycor/, which describes these weightings as
 * having a "strong tendency to identify the dominant key as the tonic".
 *
 * music21 ships five weightings — KrumhanslSchmuckler, AardenEssen,
 * BellmanBudge, SimpleWeights, TemperleyKostkaPayne — and each has a
 * documented bias. This one was picked because its bias is the one written
 * down in the source, not because it is the best. **That choice is untested
 * here.** Nothing in this repo has been run against real material, so treat
 * the pick as a starting position to measure, not a result. Swapping it is one
 * edit to `MAJOR` and `MINOR` plus a fixture regeneration; the parity test
 * will tell you immediately whether the port still matches the oracle.
 *
 * The 288 numbers are the two published rows below, rotated twelve ways each,
 * built once at module load. Writing them out longhand would be 288 chances to
 * mistype a digit that no test could catch without the oracle, and would cost
 * more bytes than the rotation. The fixture is what proves the table right.
 */

import type { PitchClass } from './chords.ts';

export type Mode = 'major' | 'minor';

/** Krumhansl-Schmuckler major profile, scale degrees 1 through 7 chromatic. */
const MAJOR: readonly number[] = [
  6.35, 2.23, 3.48, 2.33, 4.38, 4.09, 2.52, 5.19, 2.39, 3.66, 2.29, 2.88,
];

/** Krumhansl-Schmuckler minor profile. */
const MINOR: readonly number[] = [
  6.33, 2.68, 3.52, 5.38, 2.6, 3.53, 2.54, 4.75, 3.98, 2.69, 3.34, 3.17,
];

export interface Key {
  readonly tonic: PitchClass;
  readonly mode: Mode;
}

export interface KeyProfile {
  readonly key: Key;
  /** Twelve weights indexed by absolute pitch class, not by scale degree. */
  readonly weights: readonly number[];
}

function rotate(profile: readonly number[], tonic: PitchClass): number[] {
  // weights[pc] is how much this key expects to hear pitch class pc.
  return Array.from({ length: 12 }, (_, pc) => profile[(pc - tonic + 12) % 12]);
}

/** All 24 keys, major before minor at each tonic, tonic ascending from C. */
export const KEY_PROFILES: readonly KeyProfile[] = Object.freeze(
  Array.from({ length: 12 }, (_, tonic) => [
    { key: { tonic, mode: 'major' as const }, weights: rotate(MAJOR, tonic) },
    { key: { tonic, mode: 'minor' as const }, weights: rotate(MINOR, tonic) },
  ]).flat(),
);

/**
 * How music21 spells each of the 24 keys.
 *
 * Not a preference — a compatibility table. music21 respells a key after
 * choosing it, and the results are asymmetric: pitch class 8 comes back as
 * `A- major` but `G# minor`. The fixture carries music21's own names, so if
 * this table drifts the parity test fails on every case rather than quietly
 * comparing different things. `tools/generate-fixtures.py` asserts the map is
 * stable across every progression it generates before it writes anything.
 *
 * The one deliberate difference: `b` for a flat where music21 writes `-`.
 * Nobody types `B-` into a chord box.
 */
const TONIC_NAMES: Readonly<Record<Mode, readonly string[]>> = {
  major: ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'],
  minor: ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'G#', 'A', 'Bb', 'B'],
};

/** `{tonic: 0, mode: 'major'}` becomes `"C major"`. */
export function keyName(key: Key): string {
  return `${TONIC_NAMES[key.mode][key.tonic]} ${key.mode}`;
}

/** The pitch class of scale degree 1, in whichever spelling the mode uses. */
export function tonicName(key: Key): string {
  return TONIC_NAMES[key.mode][key.tonic];
}
