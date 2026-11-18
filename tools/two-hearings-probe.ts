// How often would the room show two hearings, and would they differ?
// Usage: node tools/two-hearings-probe.ts
//
// An observation, not a spike: no threshold was set before the numbers
// existed. It backs docs/concepts/harmony-readout-alternatives.md, and the
// proper next step is a spike on played phrases with a threshold written
// first. The progression list is one person's idea of "common", typed as
// chord symbols; it is not a corpus and should not be mistaken for #15.
import { readFileSync } from 'node:fs';

import { parseProgression } from '../src/chords.ts';
import { UNCERTAINTY_FLOOR } from '../src/confidence.ts';
import { rank } from '../src/readings.ts';
import { suggest } from '../src/suggest.ts';

const COMMON = [
  'Am F C G', 'C G Am F', 'C Am F G', 'F G Am', 'Dm7 G7 Cmaj7', 'Dm7 G7 Cmaj7 Am7',
  'Am Dm E7 Am', 'Am G F E', 'C F G C', 'G D Em C', 'Em C G D', 'D A Bm G',
  'Bm G D A', 'F C G Am', 'Am Em F C', 'C Em Am F', 'E B C#m A', 'A E F#m D',
  'Dm Bb C Dm', 'Dm C Bb A', 'Cm Ab Eb Bb', 'Eb Bb Cm Ab', 'G Em C D',
  'Am7 D7 Gmaj7 Cmaj7', 'Fmaj7 Em7 Dm7 Cmaj7', 'C G F G', 'Am C D F', 'Em G D A',
  'C Bb F C', 'F Am Dm Bb',
];

/** `two`: the top two keys are within `margin`. `differ`: and suggest different chords. */
function tally(progressions: readonly string[], margin: number): { two: number; differ: number; uncertain: number } {
  let two = 0;
  let differ = 0;
  let uncertain = 0;
  for (const text of progressions) {
    const { chords } = parseProgression(text);
    const readings = rank(chords);
    if (readings[0].score < UNCERTAINTY_FLOOR) {
      uncertain += 1;
      continue;
    }
    if (readings[0].score - readings[1].score > margin) continue;
    two += 1;
    const [a, b] = [readings[0], readings[1]].map((r) => suggest(chords, r.key, 1)[0]?.symbol);
    if (a !== b) differ += 1;
  }
  return { two, differ, uncertain };
}

const fixture = JSON.parse(readFileSync(new URL('../fixtures/music21-rankings.json', import.meta.url), 'utf8')) as {
  cases: { progression: string[] }[];
};
const generated = fixture.cases.map((c) => c.progression.join(' '));

console.log('margin | common (30): two hearings, differ | fixture (200): two hearings, differ, uncertain');
for (const margin of [0.06, 0.1, 0.12, 0.15]) {
  const c = tally(COMMON, margin);
  const f = tally(generated, margin);
  console.log(`${margin.toFixed(2)}   | ${c.two}, ${c.differ} | ${f.two}, ${f.differ}, ${f.uncertain}`);
}
