/**
 * What could come next. A rule table, not a model.
 *
 * Seventeen rules over scale degrees, scored and sorted. It knows that V goes
 * to I, that ii goes to V, that IV goes home, and that in pop bVII is a
 * cadence rather than a mistake. It does not know anything else, and in
 * particular it cannot see further back than the last chord.
 *
 * **This table is the baseline.** When a next-chord model arrives — and
 * next-chord prediction is self-supervised, so the corpus for it needs no
 * harmonic annotation at all — this is the thing it has to beat. Write the
 * number down before training anything; a rule table that nobody measured is
 * not a baseline, it is an excuse.
 */

import type { Chord, PitchClass } from './chords.ts';
import type { Key } from './keyprofiles.ts';
import { tonicName } from './keyprofiles.ts';
import { scalePitchClasses } from './readings.ts';

export interface Suggestion {
  /** A chord symbol to show, spelled the way the key would spell it. */
  readonly symbol: string;
  /** Why this one. Shown to the user; keep it to a clause. */
  readonly reason: string;
  /** Higher is better. Unitless, hand-assigned, comparable only here. */
  readonly weight: number;
}

/** Degree of the last chord to degree of a likely next chord, with a reason. */
interface Move {
  readonly from: number;
  readonly to: number;
  readonly reason: string;
  readonly weight: number;
}

/**
 * The rule table. Degrees are semitones above the tonic.
 *
 * Weights are hand-assigned on one scale: 10 for a cadence that resolves, 8
 * for a strong functional step, 6 for a common move, 4 for a colour. They
 * were not fitted to anything.
 */
const MOVES: readonly Move[] = [
  { from: 7, to: 0, reason: 'V to I — the cadence', weight: 10 },
  { from: 7, to: 9, reason: 'V to vi — the deceptive cadence', weight: 6 },
  { from: 5, to: 0, reason: 'IV to I — the plagal cadence', weight: 8 },
  { from: 5, to: 7, reason: 'IV to V — builds the cadence', weight: 8 },
  { from: 2, to: 7, reason: 'ii to V — the other half of ii-V-I', weight: 10 },
  { from: 2, to: 0, reason: 'ii back to I', weight: 4 },
  { from: 0, to: 5, reason: 'I to IV — leaves home', weight: 8 },
  { from: 0, to: 7, reason: 'I to V — opens the cadence', weight: 8 },
  { from: 0, to: 9, reason: 'I to vi — the soft turn', weight: 6 },
  { from: 9, to: 5, reason: 'vi to IV — the four-chord loop', weight: 8 },
  { from: 9, to: 2, reason: 'vi to ii — down the circle', weight: 6 },
  { from: 4, to: 9, reason: 'iii to vi — down the circle', weight: 6 },
  { from: 11, to: 0, reason: 'vii to I — the leading tone resolves', weight: 8 },
  { from: 10, to: 0, reason: 'bVII to I — the rock cadence', weight: 6 },
  { from: 5, to: 9, reason: 'IV to vi', weight: 4 },
  { from: 3, to: 5, reason: 'bIII to IV — borrowed, then home', weight: 4 },
  { from: 8, to: 7, reason: 'bVI to V — the chromatic approach', weight: 4 },
];

const SHARP_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const FLAT_NAMES = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];

/** Keys whose signature is flats, so a suggestion is spelled with flats. */
const FLAT_TONICS: Readonly<Record<string, boolean>> = {
  F: true,
  Bb: true,
  Eb: true,
  Ab: true,
  Db: true,
  Gb: true,
  D: false,
};

function spell(pc: PitchClass, key: Key): string {
  const names = FLAT_TONICS[tonicName(key)] ? FLAT_NAMES : SHARP_NAMES;
  return names[pc];
}

/**
 * The triad quality the key builds on a given degree.
 *
 * Only diatonic degrees get a quality. Everything else is suggested as a bare
 * major triad, which is what a borrowed chord usually is in pop, and is
 * wrong often enough to be worth saying out loud.
 */
function triadQuality(semitones: number, key: Key): string {
  const table: Readonly<Record<number, string>> =
    key.mode === 'major'
      ? { 0: '', 2: 'm', 4: 'm', 5: '', 7: '', 9: 'm', 11: 'dim' }
      : { 0: 'm', 2: 'dim', 3: '', 5: 'm', 7: 'm', 8: '', 10: '' };
  return table[semitones] ?? '';
}

/**
 * Rank candidate next chords for a progression heard in `key`.
 *
 * Only the last chord is consulted. Two chords of context would already be a
 * grammar, and a grammar is the thing this repo has decided not to write yet.
 */
export function suggest(
  chords: readonly Chord[],
  key: Key,
  limit = 4,
): Suggestion[] {
  if (chords.length === 0) return [];
  const last = chords[chords.length - 1];
  const from = (last.root - key.tonic + 12) % 12;
  const diatonic = new Set(scalePitchClasses(key));

  const scored = new Map<number, Suggestion>();
  for (const move of MOVES) {
    if (move.from !== from) continue;
    const pc = (key.tonic + move.to) % 12;
    const existing = scored.get(pc);
    if (existing !== undefined && existing.weight >= move.weight) continue;
    scored.set(pc, {
      symbol: spell(pc, key) + triadQuality(move.to, key),
      reason: move.reason,
      weight: move.weight,
    });
  }

  // Nothing in the table matched, so fall back to the key's own chords. A
  // blank panel would read as "there is no answer" when the truth is "this
  // table has no rule for that".
  if (scored.size === 0) {
    for (const pc of diatonic) {
      if (pc === last.root) continue;
      const semitones = (pc - key.tonic + 12) % 12;
      scored.set(pc, {
        symbol: spell(pc, key) + triadQuality(semitones, key),
        reason: `diatonic in ${tonicName(key)} ${key.mode} — no rule covers this move`,
        weight: semitones === 0 || semitones === 7 ? 3 : 2,
      });
    }
  }

  return [...scored.values()]
    .sort((a, b) => b.weight - a.weight || a.symbol.localeCompare(b.symbol))
    .slice(0, limit);
}
