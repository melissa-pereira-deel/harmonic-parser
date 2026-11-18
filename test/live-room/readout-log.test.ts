/**
 * The lab's readout log: what the room heard, what it offered, and whether
 * the next chord the player chose was one of the offers. B is logged with
 * the suggestions C would have shown, so the two can be compared.
 */

import { describe, expect, it } from 'vitest';

import type { LiveHarmony } from '../../src/room/analysis/live.ts';
import { createReadoutLog, sameHarmony } from '../../src/room/readout-log.ts';

const clear = (chord: string, key: string, next: string): LiveHarmony => ({
  chord, state: 'clear', key, next, hearings: [{ key, next }],
});
const chordOnly = (chord: string): LiveHarmony => ({
  chord, state: 'chord-only', key: null, next: null, hearings: [],
});
const twoHearings = (chord: string, first: [string, string], second: [string, string]): LiveHarmony => ({
  chord,
  state: 'two-hearings',
  key: null,
  next: null,
  hearings: [{ key: first[0], next: first[1] }, { key: second[0], next: second[1] }],
});
const merged = (chord: string, keys: [string, string], next: string): LiveHarmony => ({
  chord, state: 'merged', key: null, next, hearings: keys.map((key) => ({ key, next })),
});

describe('sameHarmony', () => {
  it('counts a richer chord on the same root and colour as the offer', () => {
    expect(sameHarmony('F', 'F')).toBe(true);
    expect(sameHarmony('F', 'Fmaj7')).toBe(true);
    expect(sameHarmony('G', 'G7')).toBe(true);
    expect(sameHarmony('F', 'F/A')).toBe(true);
    expect(sameHarmony('Dm', 'Dm7')).toBe(true);
  });

  it('does not count a different root or a different colour', () => {
    expect(sameHarmony('F', 'Dm')).toBe(false);
    expect(sameHarmony('E', 'Em')).toBe(false);
    expect(sameHarmony('Am', 'A')).toBe(false);
  });
});

describe('createReadoutLog', () => {
  it('logs each new reading once and ignores gaps', () => {
    const log = createReadoutLog();
    const c = clear('C', 'C major', 'F');
    log.observe({ run: 1, condition: 'C', tMs: 0, reading: c, shown: true });
    log.observe({ run: 1, condition: 'C', tMs: 16, reading: c, shown: true });
    log.observe({ run: 1, condition: 'C', tMs: 900, reading: null, shown: false });
    log.observe({ run: 1, condition: 'C', tMs: 916, reading: c, shown: true });
    expect(log.report().entries).toHaveLength(1);
  });

  it('records what was offered in each state', () => {
    const log = createReadoutLog();
    const readings = [
      chordOnly('C'),
      clear('Am', 'C major', 'F'),
      twoHearings('Cmaj7', ['C major', 'F'], ['G major', 'G']),
      merged('G7', ['C major', 'G major'], 'C'),
    ];
    readings.forEach((reading, i) => log.observe({ run: 1, condition: 'C', tMs: i * 1000, reading, shown: true }));
    expect(log.report().entries.map((e) => e.offered)).toEqual([[], ['F'], ['F', 'G'], ['C']]);
  });

  it('says which offer the next different chord matched, within the window', () => {
    const log = createReadoutLog();
    const play = (tMs: number, reading: LiveHarmony, run = 1) =>
      log.observe({ run, condition: 'C', tMs, reading, shown: true });
    play(0, clear('C', 'C major', 'F'));
    play(500, clear('C', 'C major', 'F')); // the same chord again is skipped
    play(1200, clear('Fmaj7', 'C major', 'G'));
    play(2000, twoHearings('Cmaj7', ['C major', 'F'], ['G major', 'G']));
    play(3000, chordOnly('G7'));
    play(20_000, clear('F', 'C major', 'C')); // too late to count for G7
    play(0, clear('C', 'C major', 'F'), 2); // a new run does not continue the old one

    const entries = log.report().entries;
    expect(entries.map((e) => [e.chord, e.nextChord, e.followed])).toEqual([
      ['C', 'Fmaj7', 'F'],
      ['C', 'Fmaj7', 'F'],
      ['Fmaj7', 'Cmaj7', null],
      ['Cmaj7', 'G7', 'G'],
      ['G7', null, null],
      ['F', null, null],
      ['C', null, null],
    ]);
    expect(entries[0].afterMs).toBe(1200);
  });

  it('summarises each condition, with B as the unseen baseline', () => {
    const log = createReadoutLog();
    log.observe({ run: 1, condition: 'B', tMs: 0, reading: clear('C', 'C major', 'F'), shown: false });
    log.observe({ run: 1, condition: 'B', tMs: 800, reading: clear('F', 'C major', 'C'), shown: false });
    log.observe({ run: 2, condition: 'C', tMs: 0, reading: twoHearings('Cmaj7', ['C major', 'F'], ['G major', 'G']), shown: true });
    log.observe({ run: 2, condition: 'C', tMs: 900, reading: chordOnly('G'), shown: true });
    log.observe({ run: 2, condition: 'C', tMs: 1800, reading: clear('Dm', 'C major', 'G'), shown: false });

    expect(log.report().summary).toEqual([
      { condition: 'B', chords: 2, shown: 0, offered: 2, followed: 1, twoKeys: 0, followedFromTwoKeys: 0 },
      { condition: 'C', chords: 3, shown: 2, offered: 2, followed: 1, twoKeys: 1, followedFromTwoKeys: 1 },
    ]);
  });

  it('starts over when cleared', () => {
    const log = createReadoutLog();
    log.observe({ run: 1, condition: 'C', tMs: 0, reading: clear('C', 'C major', 'F'), shown: true });
    log.clear();
    expect(log.report()).toEqual({ entries: [], summary: [] });
  });
});
