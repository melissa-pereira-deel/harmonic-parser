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
const LINGER_MS = 700;
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

export interface LiveHarmony {
  chord: string;
  key: string | null;
  next: string | null;
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

function possibleKey(chords: readonly Chord[], cadence: Key | null): Key | null {
  if (new Set(chords.map(chord => chord.symbol)).size < 3) return null;
  const readings = rank(chords);
  // The profile is order independent. Give an audible dominant resolution a vote.
  if (cadence && readings.some(({ key, score }) =>
    key.tonic === cadence.tonic && key.mode === cadence.mode && score >= UNCERTAINTY_FLOOR)) return cadence;
  const confidence = assess(readings);
  return confidence.uncertain || confidence.ambiguous ? null : readings[0].key;
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
    const cadence = cadentialKey(chords);
    const key = possibleKey(chords, cadence);
    if (!repeated && cadence && key === cadence) onCadence?.(acceptedAt);
    reading = {
      chord: pending.symbol,
      key: key ? keyName(key) : null,
      next: key ? suggest(chords, key, 1)[0]?.symbol ?? null : null,
    };
    settled = true;
  }

  return {
    observe(notes: readonly ActiveNote[], tMs: number): void {
      settle(tMs);
      const next = identify(notes);
      if (pending?.symbol === next?.symbol) return;
      if (settled) expiresAt = tMs + LINGER_MS;
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
