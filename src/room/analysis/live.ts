import { INTERVALS, parseChord } from '../../chords.ts';
import type { Chord, Quality } from '../../chords.ts';
import { assess, UNCERTAINTY_FLOOR } from '../../confidence.ts';
import { keyName } from '../../keyprofiles.ts';
import type { Key } from '../../keyprofiles.ts';
import { rank } from '../../readings.ts';
import { suggest } from '../../suggest.ts';
import type { ActiveNote } from '../contracts.ts';

const NAMES = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'];
const QUALITIES = {
  maj: '', min: 'm', dim: 'dim', aug: 'aug', sus2: 'sus2', sus4: 'sus4',
  dom7: '7', maj7: 'maj7', min7: 'm7', min7b5: 'm7b5', dim7: 'dim7',
  maj6: '6', min6: 'm6', add9: 'add9',
} satisfies Partial<Record<Quality, string>>;
const HOLD_MS = 125;
/** How long a one-key readout stays after the chord is released or changes. */
export const LINGER_MS = 700;
/**
 * How long a readout with two keys stays. Two labelled entries, each with a
 * keyboard and a chord name, are about twice as much to read as one, so this
 * is roughly double `LINGER_MS` with a little room for the eye to arrive. It
 * stays under the facilitated reflection's 2.1 s so it never outlasts a
 * deliberate cue. Unmeasured, like `LINGER_MS`.
 */
export const TWO_HEARINGS_LINGER_MS = 1_500;
const CONTEXT_MS = 12_000;
const MAX_CHORDS = 12;

const templates = new Map<number, Chord[]>();
for (const [root, name] of NAMES.entries()) {
  for (const [quality, suffix] of Object.entries(QUALITIES)) {
    const chord = parseChord(name + suffix);
    if (!chord) continue;
    const mask = INTERVALS[quality as keyof typeof QUALITIES]
      .reduce((bits, interval) => bits | (1 << ((root + interval) % 12)), 0);
    const candidates = templates.get(mask) ?? [];
    candidates.push(chord);
    templates.set(mask, candidates);
  }
}

interface Voicing {
  chord: Chord;
  symbol: string;
}

/** One way of hearing the recent chords: a key and the chord it suggests next. */
export interface Hearing {
  readonly key: string;
  readonly next: string | null;
}

/**
 * - `chord-only`: too few distinct chords to name a key, or nothing fits.
 * - `clear`: one key, or a heard cadence settled it.
 * - `two-hearings`: the top two keys sit within the parser's ambiguity
 *   margin and suggest different chords.
 * - `merged`: they sit within the margin and suggest the same chord.
 */
export type HarmonyState = 'chord-only' | 'clear' | 'two-hearings' | 'merged';

export interface HarmonyReading {
  readonly state: HarmonyState;
  /** The key, only when the reading is `clear`. */
  readonly key: string | null;
  /** The one chord to try: the clear key's, or the one two hearings share. */
  readonly next: string | null;
  /** Every plausible key with its own next chord: none, one, or two. */
  readonly hearings: readonly Hearing[];
}

export interface LiveHarmony extends HarmonyReading {
  readonly chord: string;
}

function identify(notes: readonly ActiveNote[]): Voicing | null {
  if (notes.length < 3) return null;
  let mask = 0;
  let lowest = Infinity;
  for (const { note } of notes) {
    mask |= 1 << (note % 12);
    lowest = Math.min(lowest, note);
  }
  const candidates = templates.get(mask);
  if (!candidates) return null;
  const bass = lowest % 12;
  const onBass = candidates.filter(chord => chord.root === bass);
  const chord = candidates.length === 1 ? candidates[0] : onBass.length === 1 ? onBass[0] : null;
  if (!chord) return null;
  return { chord, symbol: chord.root === bass ? chord.symbol : `${chord.symbol}/${NAMES[bass]}` };
}

function difference(from: Chord, to: Chord): number {
  return (from.root - to.root + 12) % 12;
}

function cadentialKey(chords: readonly Chord[]): Key | null {
  if (chords.length < 3) return null;
  const [approach, dominant, tonic] = chords.slice(-3);
  const mode = ['maj', 'maj7'].includes(tonic.quality) ? 'major'
    : ['min', 'min7'].includes(tonic.quality) ? 'minor' : null;
  const twoToFive = difference(approach, tonic) === 2
    && ['min', 'min7', 'dim', 'min7b5'].includes(approach.quality);
  if (mode && difference(dominant, tonic) === 7
    && (dominant.quality === 'dom7' || (dominant.quality === 'maj' && twoToFive))) {
    return { tonic: tonic.root, mode };
  }
  return null;
}

const CHORD_ONLY: HarmonyReading = { state: 'chord-only', key: null, next: null, hearings: [] };

function nextIn(chords: readonly Chord[], key: Key): string | null {
  return suggest(chords, key, 1)[0]?.symbol ?? null;
}

function hearing(chords: readonly Chord[], key: Key): Hearing {
  return { key: keyName(key), next: nextIn(chords, key) };
}

function clearReading(chords: readonly Chord[], key: Key): HarmonyReading {
  const only = hearing(chords, key);
  return { state: 'clear', key: only.key, next: only.next, hearings: [only] };
}

/** The reading, and whether a heard cadence is what made it clear. */
function interpret(chords: readonly Chord[], cadence: Key | null): { reading: HarmonyReading; voted: boolean } {
  if (new Set(chords.map(chord => chord.symbol)).size < 3) return { reading: CHORD_ONLY, voted: false };
  const readings = rank(chords);
  // The profile is order independent. Give an audible dominant resolution a vote.
  if (cadence && readings.some(({ key, score }) =>
    key.tonic === cadence.tonic && key.mode === cadence.mode && score >= UNCERTAINTY_FLOOR)) {
    return { reading: clearReading(chords, cadence), voted: true };
  }
  const confidence = assess(readings);
  if (confidence.uncertain) return { reading: CHORD_ONLY, voted: false };
  if (!confidence.ambiguous) return { reading: clearReading(chords, readings[0].key), voted: false };
  const [first, second] = confidence.contenders.slice(0, 2).map(({ key }) => hearing(chords, key));
  const reading: HarmonyReading = first.next === second.next
    ? { state: 'merged', key: null, next: first.next, hearings: [first, second] }
    : { state: 'two-hearings', key: null, next: null, hearings: [first, second] };
  return { reading, voted: false };
}

/**
 * What condition C says about `chords`, oldest first. Pure: the room's rules
 * (three distinct chords, the cadence vote) and the parser's confidence
 * states, with `AMBIGUITY_MARGIN` and `UNCERTAINTY_FLOOR` as they are.
 * Pass `cadence: null` to read the chords as the parser page would.
 */
export function readHarmony(
  chords: readonly Chord[],
  cadence: Key | null = cadentialKey(chords),
): HarmonyReading {
  return interpret(chords, cadence).reading;
}

export function createLiveHarmony(onCadence?: (tMs: number) => void) {
  let pending: Voicing | null = null;
  let since = 0;
  let settled = false;
  let expiresAt = 0;
  let reading: LiveHarmony | null = null;
  let history: { chord: Chord; tMs: number }[] = [];

  function settle(tMs: number): void {
    if (!pending || settled || tMs - since < HOLD_MS) return;
    const acceptedAt = since + HOLD_MS;
    const chord = pending.chord;
    history = history.filter(item => acceptedAt - item.tMs <= CONTEXT_MS);
    const repeated = history.at(-1)?.chord.symbol === chord.symbol;
    if (repeated) history.pop();
    history.push({ chord, tMs: acceptedAt });
    history = history.slice(-MAX_CHORDS);
    const chords = history.map(item => item.chord);
    const { reading: heard, voted } = interpret(chords, cadentialKey(chords));
    if (!repeated && voted) onCadence?.(acceptedAt);
    reading = { chord: pending.symbol, ...heard };
    settled = true;
  }

  return {
    observe(notes: readonly ActiveNote[], tMs: number): void {
      settle(tMs);
      const next = identify(notes);
      if (pending?.symbol === next?.symbol) return;
      if (settled) {
        expiresAt = tMs + ((reading?.hearings.length ?? 0) > 1 ? TWO_HEARINGS_LINGER_MS : LINGER_MS);
      }
      pending = next;
      since = tMs;
      settled = false;
    },
    sample(tMs: number): LiveHarmony | null {
      settle(tMs);
      return settled || tMs < expiresAt ? reading : null;
    },
    reset(): void {
      pending = null;
      settled = false;
      expiresAt = 0;
      reading = null;
      history = [];
    },
  };
}
