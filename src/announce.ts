/**
 * What a screen reader hears, which is not what the screen shows.
 *
 * The visible panel rebuilds on every keystroke and that is deliberate: it
 * measures 27.6 ms from keystroke to painted, inside the 100 ms instant band
 * with room to spare, so debouncing it would spend the whole budget to fix a
 * problem the page does not have. See
 * `experiments/render-latency.spike.md`.
 *
 * A live region is the opposite case. `index.html` used to put
 * `aria-live="polite"` on the output panel itself, so every keystroke
 * replaced the region wholesale and queued another announcement — typing
 * `Am F C G` read the entire analysis out eight times. Fast is exactly wrong
 * there: an announcement is only useful once the typing has stopped.
 *
 * So the two channels are split. The panel stays instant and silent; this
 * module waits for a pause and says one sentence.
 */

import type { Confidence } from './confidence.ts';
import { keyName } from './keyprofiles.ts';
import type { Reading } from './readings.ts';

/**
 * Announce once the input has been quiet this long.
 *
 * Deliberately far outside the instant band — the point is to wait until
 * somebody has stopped typing, and 500 ms is roughly a slow typist's gap
 * between characters without being long enough to feel broken. A judgement
 * call, not a perceptual constant: `LATENCY_BANDS_MS` in the sibling repo is
 * Miller and Nielsen measuring people, and there is no equivalent literature
 * behind this number. Unmeasured.
 */
export const ANNOUNCE_DELAY_MS = 500;

/**
 * One sentence, for hearing rather than reading.
 *
 * Shorter than the visible summary in `renderConfidence` and front-loaded
 * with the key, because a listener cannot skim: the thing they came for goes
 * first, the caveat second. The wording tracks `confidence.summary` so the
 * two channels never disagree about what happened.
 */
export function announcement(
  readings: readonly Reading[],
  confidence: Confidence,
  unparsed: readonly string[],
  pinCount = 0,
): string {
  if (readings.length === 0) {
    if (unparsed.length > 0) return `No readable chords. Could not read ${unparsed.join(', ')}.`;
    // Empty with nothing unreadable and a pin set means the pins contradict.
    // Worth saying out loud: a listener cannot see the conflict notice, and
    // silence here would be indistinguishable from the page having nothing
    // to say about a progression they just typed.
    if (pinCount > 0) return 'No reading fits those pins. Clear a pin to see the readings again.';
    return '';
  }

  const top = keyName(readings[0].key);
  const skipped =
    unparsed.length > 0 ? ` Skipped ${unparsed.join(', ')}.` : '';

  if (confidence.uncertain && confidence.ambiguous) {
    return `${top}, but nothing fits well and the near-misses are tied.${skipped}`;
  }
  if (confidence.uncertain) {
    return `${top}, the least bad reading. No key fits this well.${skipped}`;
  }
  if (confidence.ambiguous) {
    const names = confidence.contenders.map((r) => keyName(r.key));
    return `${names.length} close readings: ${names.join(', ')}.${skipped}`;
  }
  return `${top}, clearly ahead.${skipped}`;
}

/**
 * The whole of a live region this module needs.
 *
 * Narrower than `HTMLElement` so the debounce is testable under vitest's
 * `environment: 'node'`, where there is no DOM at all. A function that wants
 * one property should say so.
 */
export interface LiveRegion {
  textContent: string | null;
}

/**
 * Write `text` into `target` after the caller stops calling.
 *
 * Returns a function you call on every keystroke; it reschedules rather than
 * stacking, so N keystrokes produce one announcement. The region is cleared
 * first so an unchanged sentence still reads as a change — without that,
 * correcting a typo back to the same progression would say nothing at all.
 */
export function announcer(
  target: LiveRegion,
  delayMs: number = ANNOUNCE_DELAY_MS,
): (text: string) => void {
  let timer: ReturnType<typeof setTimeout> | undefined;
  return (text: string): void => {
    if (timer !== undefined) clearTimeout(timer);
    timer = setTimeout(() => {
      target.textContent = '';
      target.textContent = text;
    }, delayMs);
  };
}
