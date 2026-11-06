/**
 * The buttons a tester can click must show everything the page can say.
 *
 * Nobody types `F#9 Abm9 C9` to see what happens. For most people the example
 * buttons are the whole page, and for a long time none of them reached the
 * uncertain state, so the designed wrong-state was invisible to anyone who did
 * not go looking for it. Same idea as "the wrong-state is reachable" in
 * test/confidence.test.ts, applied to what is actually on screen.
 *
 * Read from the real markup, so swapping a button cannot quietly lose a state.
 */

import { describe, expect, it } from 'vitest';

import { parseProgression } from '../src/chords.ts';
import { assess } from '../src/confidence.ts';
import { rank } from '../src/readings.ts';
import html from '../index.html?raw';

const examples = [...html.matchAll(/data-example="([^"]+)"/g)].map((m) => m[1]);

function stateOf(progression: string): string {
  const c = assess(rank(parseProgression(progression).chords));
  if (c.uncertain) return 'uncertain';
  return c.ambiguous ? 'ambiguous' : 'clear';
}

describe('the example buttons', () => {
  it('are found in the page', () => {
    expect(examples.length).toBeGreaterThan(0);
  });

  it.each(examples)('%s parses completely', (progression) => {
    expect(parseProgression(progression).unparsed).toEqual([]);
  });

  it('reach all three confidence states between them', () => {
    expect(new Set(examples.map(stateOf))).toEqual(
      new Set(['clear', 'ambiguous', 'uncertain']),
    );
  });
});
