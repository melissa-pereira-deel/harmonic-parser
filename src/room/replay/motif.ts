import type { ReplayFixture, RoomEvent } from '../contracts.ts';

const firstBass = 48;
const secondBass = 44;
const repeatOffsetMs = 5000;

const firstPhrase: readonly RoomEvent[] = [
  { kind: 'noteOn', tMs: 700, seq: 0, channel: 0, note: firstBass, velocity: 46 },
  { kind: 'noteOn', tMs: 700, seq: 1, channel: 0, note: 72, velocity: 38 },
  { kind: 'noteOff', tMs: 1150, seq: 2, channel: 0, note: 72 },
  { kind: 'noteOn', tMs: 1320, seq: 3, channel: 0, note: 75, velocity: 55 },
  { kind: 'noteOff', tMs: 1800, seq: 4, channel: 0, note: 75 },
  { kind: 'sustain', tMs: 2060, seq: 5, channel: 0, down: true },
  // The 620 ms pulse would put G5 at 1940 ms. It arrives 250 ms late.
  { kind: 'noteOn', tMs: 2190, seq: 6, channel: 0, note: 79, velocity: 64 },
  { kind: 'noteOff', tMs: 2450, seq: 7, channel: 0, note: 79 },
  { kind: 'noteOn', tMs: 2670, seq: 8, channel: 0, note: 77, velocity: 96 },
  { kind: 'noteOff', tMs: 3440, seq: 9, channel: 0, note: 77 },
  { kind: 'noteOff', tMs: 3440, seq: 10, channel: 0, note: firstBass },
  { kind: 'sustain', tMs: 3850, seq: 11, channel: 0, down: false },
];

const secondPhrase = firstPhrase.map(event => {
  const shifted = { ...event, tMs: event.tMs + repeatOffsetMs, seq: event.seq + firstPhrase.length };
  if ('note' in shifted && shifted.note === firstBass) {
    return { ...shifted, note: secondBass };
  }
  return shifted;
});

export const motifReplay: ReplayFixture = {
  id: 'motif-v1',
  description: 'A C–E♭–G–F phrase with a late G and a sustained ending, played over C and then A♭.',
  durationMs: 12000,
  seed: 42,
  events: [...firstPhrase, ...secondPhrase],
  cues: [{
    text: 'Same phrase, different bass.',
    startMs: 9000,
    durationMs: 2100,
    origin: 'facilitated',
    evidence: 'The same C5–E♭5–G5–F5 melody starts at 700 ms over C3 and at 5700 ms over A♭2.',
  }],
  chords: [],
};

const chordScore = [
  { tMs: 400, symbol: 'Am', notes: [57, 60, 64] },
  { tMs: 1600, symbol: 'F', notes: [53, 57, 60] },
  { tMs: 2800, symbol: 'G', notes: [55, 59, 62] },
  { tMs: 4000, symbol: 'C', notes: [48, 52, 55] },
];

export const chordReplay: ReplayFixture = {
  id: 'annotated-chords-v1',
  description: 'Four deliberately annotated block triads for the parser lab.',
  durationMs: 5100,
  seed: 42,
  events: chordScore.flatMap(({ tMs, notes }, index) => {
    const firstSeq = index * notes.length * 2;
    return [
      ...notes.map((note, offset): RoomEvent => ({
        kind: 'noteOn', tMs, seq: firstSeq + offset, channel: 0, note, velocity: 64,
      })),
      ...notes.map((note, offset): RoomEvent => ({
        kind: 'noteOff', tMs: tMs + 900, seq: firstSeq + notes.length + offset, channel: 0, note,
      })),
    ];
  }),
  cues: [],
  chords: chordScore.map(({ tMs, symbol }) => ({ tMs, symbol })),
};
