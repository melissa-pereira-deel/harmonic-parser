/**
 * The spoken channel. Two claims: it says the right sentence, and it says it
 * once.
 */

import { describe, expect, it, vi } from 'vitest';

import { ANNOUNCE_DELAY_MS, announcement, announcer } from '../src/announce.ts';
import { parseProgression } from '../src/chords.ts';
import { assess } from '../src/confidence.ts';
import { rank } from '../src/readings.ts';

function say(text: string): string {
  const { chords, unparsed } = parseProgression(text);
  const readings = rank(chords);
  return announcement(readings, assess(readings), unparsed);
}

describe('what a screen reader hears', () => {
  it('leads with the key, because a listener cannot skim', () => {
    expect(say('Am F C G')).toMatch(/^C major/);
  });

  it('names the unreadable tokens instead of silently dropping them', () => {
    const heard = say('Am zzz C qq G');
    expect(heard).toContain('zzz');
    expect(heard).toContain('qq');
  });

  it('says nothing at all for an empty box', () => {
    expect(say('')).toBe('');
  });

  it('distinguishes nothing-readable from nothing-typed', () => {
    expect(say('zzz qq')).toContain('No readable chords');
  });

  it('agrees with the visible summary about which state it is in', () => {
    // The two channels must never disagree about what happened. This checks
    // the claim rather than the wording, which is allowed to differ.
    const { chords } = parseProgression('C F#m7b5 Bb E');
    const readings = rank(chords);
    const confidence = assess(readings);
    const heard = announcement(readings, confidence, []);
    if (confidence.uncertain) expect(heard).toMatch(/least bad|nothing fits/i);
    else if (confidence.ambiguous) expect(heard).toMatch(/close readings/);
    else expect(heard).toMatch(/clearly ahead/);
  });
});

describe('it announces once, after the typing stops', () => {
  it('collapses a burst of keystrokes into one announcement', () => {
    vi.useFakeTimers();
    try {
      const region = { textContent: null as string | null };
      const announce = announcer(region, ANNOUNCE_DELAY_MS);

      // Someone typing "Am F C G" one character at a time.
      for (const text of ['A', 'Am', 'Am ', 'Am F', 'Am F ', 'Am F C', 'Am F C G']) {
        announce(`${text} heard`);
        vi.advanceTimersByTime(50);
      }
      // Nothing yet: the pause has not happened.
      expect(region.textContent).toBeNull();

      vi.advanceTimersByTime(ANNOUNCE_DELAY_MS);
      expect(region.textContent).toBe('Am F C G heard');
    } finally {
      vi.useRealTimers();
    }
  });

  it('re-announces an unchanged sentence, so a corrected typo is not silent', () => {
    vi.useFakeTimers();
    try {
      const seen: (string | null)[] = [];
      const region = {
        _v: null as string | null,
        get textContent(): string | null {
          return this._v;
        },
        set textContent(v: string | null) {
          this._v = v;
          seen.push(v);
        },
      };
      const announce = announcer(region, ANNOUNCE_DELAY_MS);

      announce('C major, clearly ahead.');
      vi.advanceTimersByTime(ANNOUNCE_DELAY_MS);
      announce('C major, clearly ahead.');
      vi.advanceTimersByTime(ANNOUNCE_DELAY_MS);

      // Cleared before each write, so the region changes even when the
      // sentence does not.
      expect(seen).toEqual([
        '',
        'C major, clearly ahead.',
        '',
        'C major, clearly ahead.',
      ]);
    } finally {
      vi.useRealTimers();
    }
  });

  it('waits well outside the instant band, unlike the render', () => {
    // Not a perceptual constant and not tuned; this pins the intent that the
    // spoken channel is deliberately the slow one. The render is ~27 ms.
    expect(ANNOUNCE_DELAY_MS).toBeGreaterThan(100);
  });
});
