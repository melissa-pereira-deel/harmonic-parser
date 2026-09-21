/**
 * Correcting a reading, by constraining it rather than re-deriving it.
 *
 * A pin says "chord 3 is a IV, whatever you think". `rank()` has already
 * produced all 24 readings and `functions` is a deterministic lookup from key
 * plus chord, so a pin does not need a re-parse: **it is a filter over keys.**
 * If chord 3 is a `C` and you pin it to IV, the keys where that holds are
 * exactly the keys where C is the fourth degree, and those readings are
 * already in the list.
 *
 * That is the narrow half of the two answers to *what does correction mean*.
 * The wide half -- re-parse with the constraint baked in, so the parser can
 * reach a reading the ranker never generated -- needs a parser to bake it
 * into, and this repo does not have one. The narrow half is not a placeholder
 * for it: constraining a ranking is a real operation with a real answer, and
 * "nothing survives that" is a real answer too.
 *
 * No DOM in this file, so it is testable under `environment: 'node'`.
 */

import type { Reading } from './readings.ts';

/** Chord index in the progression -> the Roman numeral it is pinned to. */
export type Pins = ReadonlyMap<number, string>;

export interface PinOption {
  /** The numeral, e.g. `IV`. */
  readonly numeral: string;
  /** The best-scoring key in which this chord takes that numeral. */
  readonly exampleKey: Reading['key'];
  /** How many of the 24 readings agree, so a rare reading looks rare. */
  readonly readings: number;
}

/**
 * Every numeral `chordIndex` takes, across the readings given, best first.
 *
 * Derived from the readings rather than from a table of legal numerals, which
 * is what makes the menu honest: every option shown is one the ranker
 * actually produced, so picking any single option always leaves at least one
 * reading standing. An empty result can only come from *two* pins that
 * disagree -- see `applyPins`.
 */
export function optionsFor(
  readings: readonly Reading[],
  chordIndex: number,
): PinOption[] {
  const best = new Map<string, PinOption>();
  for (const reading of readings) {
    const fn = reading.functions[chordIndex];
    if (fn === undefined) continue;
    const seen = best.get(fn.numeral);
    if (seen === undefined) {
      // Readings arrive sorted, so the first key to offer a numeral is the
      // best-scoring one that offers it.
      best.set(fn.numeral, { numeral: fn.numeral, exampleKey: reading.key, readings: 1 });
    } else {
      best.set(fn.numeral, { ...seen, readings: seen.readings + 1 });
    }
  }
  return [...best.values()];
}

/**
 * The readings that satisfy every pin, in their original order.
 *
 * Returns an empty array when the pins contradict each other. That is a
 * legitimate answer and the caller has to render it: pinning chord 1 to I and
 * chord 2 to I asks for a key in which two different chords are both the
 * tonic, and there is none. Silently dropping a pin to keep the list non-empty
 * would be the page overruling the person, which is the opposite of what an
 * override is for.
 */
export function applyPins(readings: readonly Reading[], pins: Pins): Reading[] {
  if (pins.size === 0) return [...readings];
  return readings.filter((reading) =>
    [...pins].every(([index, numeral]) => reading.functions[index]?.numeral === numeral),
  );
}

/**
 * Drop pins that no longer refer to anything.
 *
 * Pins are held by chord *index*, so editing the progression can leave a pin
 * pointing past the end, or at a chord that is now a different symbol. Either
 * way the pin meant something about a chord that is no longer there, and
 * carrying it forward would silently constrain a reading for a reason the
 * person cannot see.
 */
export function prunePins(
  pins: Pins,
  previousSymbols: readonly string[],
  symbols: readonly string[],
): Map<number, string> {
  const kept = new Map<number, string>();
  for (const [index, numeral] of pins) {
    if (index < symbols.length && symbols[index] === previousSymbols[index]) {
      kept.set(index, numeral);
    }
  }
  return kept;
}
