import { analyzeAnnotatedChords } from './analysis/annotated.ts';
import type { Condition, ReplayFixture } from './contracts.ts';
import { chordReplay, motifReplay } from './replay/motif.ts';
import type { createRoomSession } from './session.ts';

type Sample = ReturnType<ReturnType<typeof createRoomSession>['sample']> & { renderer: 'css' | 'webgl2' };
type FixtureName = 'motif' | 'chords';

export function createRoomMetrics() {
  const intervals: number[] = [];
  const delays: number[] = [];
  let previousFrame: number | null = null;
  let pendingStrike: number | null = null;
  let strikes = 0;
  let coalesced = 0;
  let withoutDraw = 0;

  function record(samples: number[], value: number): void {
    if (samples.length === 12_000) samples.shift();
    samples.push(value);
  }

  function clearPending(): void {
    if (pendingStrike !== null) withoutDraw += 1;
    pendingStrike = null;
  }

  function p95(samples: number[]): number | null {
    if (!samples.length) return null;
    const ordered = samples.toSorted((a, b) => a - b);
    return ordered[Math.ceil(ordered.length * 0.95) - 1];
  }

  return {
    noteOn(tMs: number): void {
      strikes += 1;
      if (pendingStrike !== null) coalesced += 1;
      pendingStrike = tMs;
    },
    draw(tMs: number, submittedAtMs: number, usesWebGL: boolean): void {
      if (previousFrame !== null && tMs > 1_000) record(intervals, tMs - previousFrame);
      previousFrame = tMs;
      if (pendingStrike === null) return;
      if (usesWebGL) record(delays, Math.max(0, submittedAtMs - pendingStrike));
      else withoutDraw += 1;
      pendingStrike = null;
    },
    clearPending,
    resume(): void {
      previousFrame = null;
    },
    reset(): void {
      intervals.length = 0;
      delays.length = 0;
      previousFrame = null;
      pendingStrike = null;
      strikes = 0;
      coalesced = 0;
      withoutDraw = 0;
    },
    stats() {
      return {
        strikes,
        coalesced,
        withoutDraw,
        pending: Number(pendingStrike !== null),
        drawDelaySamples: delays.length,
        drawDelayP95Ms: p95(delays),
        frameSamples: intervals.length,
        frameIntervalP95Ms: p95(intervals),
        frameFractionWithin25Ms: intervals.length
          ? intervals.filter(interval => interval <= 25).length / intervals.length
          : null,
      };
    },
  };
}

export type RoomMetrics = ReturnType<typeof createRoomMetrics>;

export function installRoomLab(controls: {
  start(condition: Condition, fixture: ReplayFixture): Sample;
  sampleAt(tMs: number): Sample;
  stats(): ReturnType<RoomMetrics['stats']>;
}): void {
  let fixture = motifReplay;

  Object.defineProperty(window, '__roomLab', {
    configurable: true,
    value: {
      start(condition: Condition, name: FixtureName = 'motif') {
        fixture = name === 'chords' ? chordReplay : motifReplay;
        return controls.start(condition, fixture);
      },
      sampleAt(tMs: number) {
        if (!Number.isFinite(tMs) || tMs < 0) throw new RangeError('Use a non-negative replay time.');
        return {
          ...controls.sampleAt(tMs),
          fixture: fixture.id,
          analysis: analyzeAnnotatedChords(fixture.chords, tMs),
        };
      },
      stats: controls.stats,
    },
  });
}
