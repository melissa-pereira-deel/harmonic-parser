/**
 * How long the arithmetic takes. **Not how long the page takes.**
 *
 * That distinction is the whole point of this file, so it goes first. This
 * measures `parseProgression -> rank -> assess -> suggest` in Node. It does
 * not touch the DOM, because vitest here runs `environment: 'node'` and there
 * is no DOM to touch. So it cannot tell you what `design-eval` actually asks
 * — keystroke to painted, on the machine somebody is using.
 *
 * Adding jsdom would make this *look* like it measured the render while
 * measuring a simulated one on a CI runner, and `design-eval` is explicit
 * that benchmarks from the wrong machine say nothing. A green number that
 * means little is worse than a documented manual procedure, so the real
 * measurement lives in `tools/bench-latency.md` and its result in
 * `experiments/render-latency.spike.md`. What follows is a regression sensor
 * for the algorithm, and only that.
 *
 * The statistics deliberately mirror `harness/profile.py::latency_ms` in the
 * sibling repo — cold reported separately, warmup discarded, nearest-rank p95
 * — so a number here means the same thing as a number there.
 */

import { describe, expect, it } from 'vitest';

import { parseProgression } from '../src/chords.ts';
import { assess } from '../src/confidence.ts';
import { rank } from '../src/readings.ts';
import { suggest } from '../src/suggest.ts';

/**
 * Ten times the measured arithmetic cost, an order of magnitude under the
 * 100 ms instant band.
 *
 * Not set near the real number on purpose. The browser measures 0.2-0.4 ms
 * for the whole render; the arithmetic alone is a fraction of that. A bound
 * at 1 ms would be tighter but would also fire on a loaded shared CI runner,
 * and a test that cries wolf gets muted, which costs more than the looseness.
 * This catches an algorithmic regression -- an accidental O(n^2), a profile
 * table rebuilt per call -- and nothing subtler. A judgement call.
 */
const ARITHMETIC_BUDGET_MS = 10;

interface Stats {
  cold: number;
  median: number;
  p95: number;
  max: number;
}

function measure(text: string, warmup = 10, iterations = 100): Stats {
  const run = (): void => {
    const { chords } = parseProgression(text);
    const readings = rank(chords);
    const confidence = assess(readings);
    if (readings.length > 0) suggest(chords, readings[0].key);
    void confidence;
  };

  // The first call is the cold one and also counts as warmup #1, exactly as
  // profile.py does it.
  const coldStart = performance.now();
  run();
  const cold = performance.now() - coldStart;
  for (let i = 0; i < Math.max(0, warmup - 1); i++) run();

  const samples: number[] = [];
  for (let i = 0; i < iterations; i++) {
    const t0 = performance.now();
    run();
    samples.push(performance.now() - t0);
  }
  samples.sort((a, b) => a - b);

  // Nearest rank, the same rule as profile.py:
  // samples[min(len-1, int(0.95 * len))]
  const at = (q: number): number =>
    samples[Math.min(samples.length - 1, Math.trunc(q * samples.length))];

  return { cold, median: at(0.5), p95: at(0.95), max: samples[samples.length - 1] };
}

const CASES: ReadonlyArray<readonly [string, string]> = [
  ['typical, 4 chords', 'Am F C G'],
  ['ambiguous, 4 chords', 'C F#m7b5 Bb E'],
  ['16 chords', 'Am F C G Dm7 G7 Cmaj7 Em A7 Dm G7 C F Bb Eb Ab'],
  ['64 chords', Array.from({ length: 16 }, () => 'Am F C G').join(' ')],
  ['64 unreadable tokens', Array.from({ length: 64 }, () => 'zzz').join(' ')],
];

describe('arithmetic latency', () => {
  it('stays an order of magnitude inside the instant band', () => {
    const rows = CASES.map(([label, text]) => [label, measure(text)] as const);

    // Printed, not hidden -- the same choice test/parity.test.ts makes about
    // its disagreement rate. A number you cannot see is a number you cannot
    // reason about later.
    // eslint-disable-next-line no-console
    console.log(
      [
        'arithmetic only (parse -> rank -> assess -> suggest), 100 iterations',
        '  NOT the render, NOT paint. See tools/bench-latency.md for those.',
        ...rows.map(
          ([label, s]) =>
            `  ${label.padEnd(22)} cold ${s.cold.toFixed(3)}  median ${s.median.toFixed(3)}` +
            `  p95 ${s.p95.toFixed(3)}  max ${s.max.toFixed(3)} ms`,
        ),
      ].join('\n'),
    );

    for (const [label, s] of rows) {
      expect(s.p95, `${label} p95`).toBeLessThan(ARITHMETIC_BUDGET_MS);
    }
  });

  it('scales with the number of chords rather than exploding', () => {
    // 16x the chords should not be anywhere near 16x the cost squared. This
    // is the shape check the budget above is too loose to make.
    const four = measure('Am F C G', 5, 50).median;
    const sixtyFour = measure(
      Array.from({ length: 16 }, () => 'Am F C G').join(' '),
      5,
      50,
    ).median;

    // Guard against a zero denominator on a fast machine with a coarse timer.
    if (four > 0.001) {
      expect(sixtyFour / four).toBeLessThan(64);
    }
    expect(sixtyFour).toBeLessThan(ARITHMETIC_BUDGET_MS);
  });
});
