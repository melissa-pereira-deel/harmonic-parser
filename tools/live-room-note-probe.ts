// Offline synthetic preflight. Run with Node 24 from the repository root.
import { parseProgression } from '../src/chords.ts';
import { KEY_PROFILES, keyName } from '../src/keyprofiles.ts';
import { rank } from '../src/readings.ts';
import type { RoomEvent } from '../src/room/contracts.ts';
import { createGestureState } from '../src/room/input/gesture.ts';

const stepMs = 20;
const windowMs = 2400;
const holdMs = 180;
const minSoundingMs = 1200;
const minPitchClasses = 5;
const minScore = 0.70;
const minLead = 0.05;

const C = [48, 60, 64, 67];
const F = [53, 60, 65, 69];
const G = [55, 59, 62, 67];
const Dm = [50, 57, 62, 65];
const D = [50, 57, 62, 66];
const A = [45, 57, 61, 64];
const cLoop = [C, F, G, C];

function fixture(
  id: string,
  durationMs: number,
  checkpoints: number[],
  write: (note: (pitch: number, start: number, end: number) => void,
    pedal: (time: number, down: boolean) => void) => void,
) {
  const events: RoomEvent[] = [];
  write((pitch, start, end) => {
    events.push({ kind: 'noteOn', tMs: start, seq: events.length, channel: 0, note: pitch, velocity: 70 });
    events.push({ kind: 'noteOff', tMs: end, seq: events.length, channel: 0, note: pitch });
  }, (time, down) => {
    events.push({ kind: 'sustain', tMs: time, seq: events.length, channel: 0, down });
  });
  return { id, durationMs, checkpoints, events: events.toSorted((a, b) => a.tMs - b.tMs || a.seq - b.seq) };
}

function blocks(chords: number[][], start: number, note: (pitch: number, from: number, to: number) => void) {
  for (const [index, pitches] of chords.entries()) {
    const tMs = start + index * 600;
    for (const pitch of pitches) note(pitch, tMs, tMs + 500);
  }
}

const melody = [72, 75, 79, 77];
const fixtures = [
  fixture('sparse-melody', 3000, [1200, 2400, 3000], note => {
    const line = [72, 74, 75, 79, 77, 74, 72, 75];
    line.forEach((pitch, index) => note(pitch, index * 300, index * 300 + 240));
  }),
  fixture('changed-bass', 3400, [1440, 1600, 3040], note => {
    [48, 44].forEach((bass, index) => {
      const start = 1600 * index;
      note(bass, start, start + 1440);
      melody.forEach((pitch, i) => note(pitch, start + i * 360, start + i * 360 + 240));
    });
  }),
  fixture('rolled-sustained', 2800, [180, 500, 1200, 2300], (note, pedal) => {
    cLoop.forEach((pitches, index) => {
      const start = 600 * index;
      pedal(start, true);
      pitches.forEach((pitch, i) => note(pitch, start + i * 80, start + i * 80 + 60));
      pedal(start + 500, false);
    });
  }),
  fixture('clear-loop', 4800, [1200, 2300, 4700], note => blocks([...cLoop, ...cLoop], 0, note)),
  fixture('open-ending', 3400, [1780, 2000, 2300, 3000], note => blocks([C, F, Dm, G], 0, note)),
  fixture('tonal-shift', 4800, [2300, 3000, 3600, 4700], note => blocks([...cLoop, D, G, A, D], 0, note)),
];

function correlation(a: readonly number[], b: readonly number[]): number {
  const meanA = a.reduce((sum, x) => sum + x, 0) / a.length;
  const meanB = b.reduce((sum, x) => sum + x, 0) / b.length;
  let covariance = 0;
  let varianceA = 0;
  let varianceB = 0;
  for (const [index, value] of a.entries()) {
    const da = value - meanA;
    const db = b[index] - meanB;
    covariance += da * db;
    varianceA += da * da;
    varianceB += db * db;
  }
  const denominator = Math.sqrt(varianceA * varianceB);
  return denominator === 0 ? 0 : covariance / denominator;
}

const rootNames = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'];

function heldTriad(physical: ReadonlySet<number>): string | null {
  if (physical.size !== 3) return null;
  for (const root of physical) {
    if (!physical.has((root + 7) % 12)) continue;
    if (physical.has((root + 4) % 12)) return rootNames[root];
    if (physical.has((root + 3) % 12)) return `${rootNames[root]}m`;
  }
  return null;
}

interface Candidate {
  name: string;
  score: number;
}

function decide(candidates: Candidate[], insufficient: string | null) {
  const [top, runnerUp] = candidates;
  const lead = top && runnerUp ? top.score - runnerUp.score : null;
  if (insufficient) return { candidate: null, reason: insufficient, top, lead };
  if (!top || top.score < minScore) return { candidate: null, reason: 'weak fit', top, lead };
  if (lead === null || lead < minLead) return { candidate: null, reason: 'close readings', top, lead };
  return { candidate: top.name, reason: null, top, lead };
}

function format(decision: ReturnType<typeof decide>) {
  const result = decision.candidate ?? `quiet (${decision.reason})`;
  if (!decision.top || decision.lead === null) return result;
  return `${result} | ${decision.top.name} ${decision.top.score.toFixed(3)}, lead ${decision.lead.toFixed(3)}`;
}

function run({ id, durationMs, checkpoints, events }: ReturnType<typeof fixture>) {
  const gesture = createGestureState();
  const recentSound: Set<number>[] = [];
  let recentTriads: { symbol: string; tMs: number }[] = [];
  let prevTriad: string | null = null;
  let heldMs = 0;
  let nextEvent = 0;
  let prevDurationCandidate: string | null = null;
  let prevTriadCandidate: string | null = null;
  console.log(`\n${id}\nms\tduration\theld triads\taccepted labels`);

  for (let tMs = stepMs; tMs <= durationMs; tMs += stepMs) {
    const from = tMs - stepMs;
    while (nextEvent < events.length && events[nextEvent].tMs <= from) {
      gesture.apply(events[nextEvent++]);
    }

    const { physical, sustained } = gesture.snapshot();
    recentSound.push(new Set([...physical, ...sustained].map(({ note }) => note % 12)));
    if (recentSound.length > windowMs / stepMs) recentSound.shift();
    const durations = Array<number>(12).fill(0);
    let soundingMs = 0;
    for (const interval of recentSound) {
      if (interval.size > 0) soundingMs += stepMs;
      for (const pitchClass of interval) durations[pitchClass] += stepMs;
    }

    const triad = heldTriad(new Set(physical.map(({ note }) => note % 12)));
    heldMs = triad === prevTriad ? heldMs + stepMs : stepMs;
    prevTriad = triad;
    if (triad && heldMs === holdMs) recentTriads.push({ symbol: triad, tMs });
    recentTriads = recentTriads.filter(chord => chord.tMs > tMs - windowMs);
    const symbols = recentTriads.map(chord => chord.symbol);

    const durationCandidates = KEY_PROFILES.map(({ key, weights }) => ({
      name: keyName(key),
      score: correlation(durations, weights),
    })).sort((a, b) => b.score - a.score);
    const durationInsufficient = soundingMs < minSoundingMs || durations.filter(Boolean).length < minPitchClasses;
    const byDuration = decide(durationCandidates, durationInsufficient ? 'thin note evidence' : null);
    const triadCandidates = rank(parseProgression(symbols.join(' ')).chords)
      .map(({ key, score }) => ({ name: keyName(key), score }));
    const byTriad = decide(triadCandidates, new Set(symbols).size < 2 ? 'fewer than two distinct triads' : null);

    if (byDuration.candidate !== prevDurationCandidate || byTriad.candidate !== prevTriadCandidate ||
        checkpoints.includes(tMs) || tMs === stepMs) {
      console.log(`${tMs}\t${format(byDuration)}\t${format(byTriad)}\t${symbols.join(' ') || '—'}`);
    }
    prevDurationCandidate = byDuration.candidate;
    prevTriadCandidate = byTriad.candidate;
  }
}

for (const example of fixtures) run(example);
