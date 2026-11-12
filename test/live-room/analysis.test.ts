import { describe, expect, it } from 'vitest';
import { analyzeAnnotatedChords } from '../../src/room/analysis/annotated.ts';
import { chordReplay, motifReplay } from '../../src/room/replay/motif.ts';

describe('annotated chord analysis', () => {
  it('keeps the motif quiet when there are no chord annotations', () => {
    expect(analyzeAnnotatedChords(motifReplay.chords, motifReplay.durationMs)).toEqual({
      origin: 'annotated-replay',
      span: null,
      labels: [],
      candidates: [],
      quietReason: 'No chord annotations have arrived.',
    });
  });

  it('ranks the first chord when it arrives but withholds a public tonal claim', () => {
    expect(analyzeAnnotatedChords(chordReplay.chords, 399).candidates).toEqual([]);
    const result = analyzeAnnotatedChords(chordReplay.chords, 400);

    expect(result.span).toEqual({ startMs: 400, endMs: 400 });
    expect(result.labels).toEqual([{ tMs: 400, symbol: 'Am' }]);
    expect(result.candidates[0]).toEqual({ name: 'A minor', score: 0.888553105488688 });
    expect(result.quietReason).toBe('One parsed chord is insufficient for a public tonal claim.');
  });

  it('preserves the replay labels and the ranker scores for a clean progression', () => {
    const result = analyzeAnnotatedChords(chordReplay.chords, 4000);

    expect(result.span).toEqual({ startMs: 400, endMs: 4000 });
    expect(result.labels.map(({ symbol }) => symbol)).toEqual(['Am', 'F', 'G', 'C']);
    expect(result.candidates).toEqual([
      { name: 'C major', score: 0.9348407777978376 },
      { name: 'A minor', score: 0.8297571460473248 },
      { name: 'E minor', score: 0.626286263277459 },
    ]);
    expect(result.quietReason).toBe('Annotated replay readings are for the lab only.');
    expect(JSON.parse(JSON.stringify(result))).toEqual(result);
  });

  it('keeps an unreadable annotation visible without producing a candidate', () => {
    const result = analyzeAnnotatedChords([{ tMs: 40, symbol: 'Hq' }], 40);

    expect(result.span).toEqual({ startMs: 40, endMs: 40 });
    expect(result.labels).toEqual([{ tMs: 40, symbol: 'Hq' }]);
    expect(result.candidates).toEqual([]);
    expect(result.quietReason).toBe('No annotated chord symbols could be parsed.');
  });
});
