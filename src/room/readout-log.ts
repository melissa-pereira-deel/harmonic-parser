/**
 * A development-only log for a playing session: every chord the room settled
 * on, what the harmony readout offered or would have offered, and whether the
 * next chord the player chose was one of those offers.
 *
 * It runs only with `?lab=1` in the development server, and only for MIDI
 * input. Nothing leaves the tab: `window.__roomLab.readouts()` returns the log,
 * and the player copies it out by hand.
 *
 * **B is the baseline.** B analyses the same playing but shows nothing, so
 * its entries record what C *would* have offered. If the player follows the
 * offer about as often in B as in C, the readout did not change what they
 * played; they were going there anyway.
 *
 * **"Followed" is deliberately loose.** The next different chord counts when
 * it shares the offer's root and its major or minor colour, so `G7` follows an
 * offered `G`, and `F/A` follows `F`. It must arrive within
 * `FOLLOW_WINDOW_MS`, the room's own context window, in the same run.
 */

import { parseChord } from '../chords.ts';
import type { Quality } from '../chords.ts';
import type { HarmonyState, LiveHarmony } from './analysis/live.ts';
import type { Condition } from './contracts.ts';

/** How long after a chord the next one may come and still count as a response. */
export const FOLLOW_WINDOW_MS = 12_000;

const MINOR: ReadonlySet<Quality> = new Set(['min', 'min7', 'min6', 'min9', 'dim', 'min7b5', 'dim7']);

/** True when `played` has the root and the major or minor colour of `offered`. */
export function sameHarmony(offered: string, played: string): boolean {
  const a = parseChord(offered);
  const b = parseChord(played);
  if (a === null || b === null) return false;
  return a.root === b.root && MINOR.has(a.quality) === MINOR.has(b.quality);
}

export interface Observation {
  /** Which entry into the room, counted from 1 for the page's life. */
  readonly run: number;
  readonly condition: Condition;
  /** Milliseconds since that entry into the room. */
  readonly tMs: number;
  /** What the room's analysis heard, shown or not. */
  readonly reading: LiveHarmony | null;
  /** Whether the player could see it: condition C, with no reflection on screen. */
  readonly shown: boolean;
}

export interface ReadoutEntry {
  readonly run: number;
  readonly condition: Condition;
  readonly tMs: number;
  readonly chord: string;
  readonly state: HarmonyState;
  readonly keys: readonly string[];
  /** The chords the readout offered, or would have offered, in hearing order. */
  readonly offered: readonly string[];
  readonly shown: boolean;
  /** The next different chord in the same run within the window, if any. */
  readonly nextChord: string | null;
  readonly afterMs: number | null;
  /** The offer that next chord matched, if any. */
  readonly followed: string | null;
}

export interface ConditionSummary {
  readonly condition: Condition;
  readonly chords: number;
  readonly shown: number;
  /** Entries that offered at least one chord. */
  readonly offered: number;
  /** Of those, how many the player followed. */
  readonly followed: number;
  /** Entries with two keys: two hearings or merged. */
  readonly twoKeys: number;
  readonly followedFromTwoKeys: number;
}

export interface ReadoutReport {
  readonly entries: readonly ReadoutEntry[];
  readonly summary: readonly ConditionSummary[];
}

type Logged = Omit<ReadoutEntry, 'nextChord' | 'afterMs' | 'followed'>;

function offers(reading: LiveHarmony): string[] {
  const out: string[] = [];
  for (const { next } of reading.hearings) if (next !== null && !out.includes(next)) out.push(next);
  return out;
}

function withFollowUp(logged: readonly Logged[]): ReadoutEntry[] {
  return logged.map((entry, i) => {
    const next = logged.slice(i + 1).find((later) => later.run === entry.run && later.chord !== entry.chord);
    const inTime = next !== undefined && next.tMs - entry.tMs <= FOLLOW_WINDOW_MS ? next : null;
    return {
      ...entry,
      nextChord: inTime?.chord ?? null,
      afterMs: inTime ? inTime.tMs - entry.tMs : null,
      followed: inTime ? entry.offered.find((offer) => sameHarmony(offer, inTime.chord)) ?? null : null,
    };
  });
}

function summarise(entries: readonly ReadoutEntry[]): ConditionSummary[] {
  const conditions = [...new Set(entries.map((e) => e.condition))].sort();
  return conditions.map((condition) => {
    const mine = entries.filter((e) => e.condition === condition);
    const twoKeys = mine.filter((e) => e.state === 'two-hearings' || e.state === 'merged');
    return {
      condition,
      chords: mine.length,
      shown: mine.filter((e) => e.shown).length,
      offered: mine.filter((e) => e.offered.length > 0).length,
      followed: mine.filter((e) => e.followed !== null).length,
      twoKeys: twoKeys.length,
      followedFromTwoKeys: twoKeys.filter((e) => e.followed !== null).length,
    };
  });
}

export function createReadoutLog() {
  let logged: Logged[] = [];
  // The room hands back the same reading object for as long as it lingers.
  let seen = new WeakSet<LiveHarmony>();

  return {
    observe({ run, condition, tMs, reading, shown }: Observation): void {
      if (reading === null || seen.has(reading)) return;
      seen.add(reading);
      logged.push({
        run,
        condition,
        tMs: Math.round(tMs),
        chord: reading.chord,
        state: reading.state,
        keys: reading.hearings.map(({ key }) => key),
        offered: offers(reading),
        shown,
      });
    },
    report(): ReadoutReport {
      const entries = withFollowUp(logged);
      return { entries, summary: summarise(entries) };
    },
    clear(): void {
      logged = [];
      seen = new WeakSet();
    },
  };
}

export type ReadoutLog = ReturnType<typeof createReadoutLog>;
