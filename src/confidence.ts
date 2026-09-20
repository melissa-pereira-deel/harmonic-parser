/**
 * Two thresholds, and they are never the same question.
 *
 * **Ambiguity** is the top two readings sitting close together. `Am F C G` is
 * ambiguous: C major and A minor are both genuinely right, and a page that
 * picks one and hides the other is not more confident, it is less honest.
 * Ambiguity is a property of the music.
 *
 * **Uncertainty** is the top reading scoring low in absolute terms. Nothing
 * fits. `C F# Bb E` is uncertain: there is a best key, but "best" here means
 * least bad. Uncertainty is a property of the model.
 *
 * Conflating them is the failure this file exists to prevent. A single
 * "confidence: 62%" number cannot tell you whether the answer is *two right
 * answers* or *no right answer*, and those want opposite things from an
 * interface: the first wants both readings shown side by side, the second
 * wants the page to stop asserting and say so.
 *
 * **Both numbers below are this repo's, and neither has been measured.** They
 * are not the harness's gate thresholds and they are not derived from
 * `LATENCY_BANDS_MS` or anything else with a citation behind it. They were
 * picked by hand from a handful of progressions typed into a box. Tune them
 * against real material and record what you tuned them against; until someone
 * does, treat any claim this page makes about its own confidence as a
 * placeholder with a plausible shape.
 */

import type { Reading } from './readings.ts';

/**
 * Ambiguous when the top two scores are within this much of each other.
 *
 * Correlations live in [-1, 1] and a clear tonal progression usually opens a
 * gap of 0.1 or more over its relative major or minor, so 0.06 flags the
 * genuinely close calls. Unmeasured.
 */
export const AMBIGUITY_MARGIN = 0.06;

/**
 * Uncertain when the top score falls below this.
 *
 * Four diatonic triads correlate around 0.9 with their key. Something that
 * cannot clear 0.6 against any of the 24 profiles is not a progression this
 * model understands. Unmeasured, and the more suspect of the two: it is the
 * number that decides when the page admits it does not know.
 */
export const UNCERTAINTY_FLOOR = 0.6;

export interface Confidence {
  /** Two or more readings are close enough to both be right. */
  readonly ambiguous: boolean;
  /** The best reading is not good enough to assert. */
  readonly uncertain: boolean;
  /** The gap between the top two scores, or `null` below two readings. */
  readonly margin: number | null;
  /** Every reading within `AMBIGUITY_MARGIN` of the top, the top included. */
  readonly contenders: Reading[];
  /** One sentence for the UI. Say what happened, not how sure you are. */
  readonly summary: string;
}

/** Assess a ranked list. Pass the output of `rank()` unmodified. */
export function assess(readings: readonly Reading[]): Confidence {
  if (readings.length === 0) {
    return {
      ambiguous: false,
      uncertain: true,
      margin: null,
      contenders: [],
      summary: 'Nothing to read yet.',
    };
  }

  const top = readings[0];
  const margin = readings.length > 1 ? top.score - readings[1].score : null;
  const contenders = readings.filter(
    (r) => top.score - r.score <= AMBIGUITY_MARGIN,
  );
  const ambiguous = contenders.length > 1;
  const uncertain = top.score < UNCERTAINTY_FLOOR;

  return { ambiguous, uncertain, margin, contenders, summary: summarise(ambiguous, uncertain, contenders.length) };
}

function summarise(
  ambiguous: boolean,
  uncertain: boolean,
  contenders: number,
): string {
  if (uncertain && ambiguous) {
    return 'Nothing fits well, and the near-misses are tied. This is the model failing, not the music being clever.';
  }
  if (uncertain) {
    return 'No key fits this well. The reading below is the least bad one, not a confident answer.';
  }
  if (ambiguous) {
    return `${contenders} readings are genuinely close. Both are right; the music has not decided yet.`;
  }
  return 'One reading is clearly ahead.';
}
