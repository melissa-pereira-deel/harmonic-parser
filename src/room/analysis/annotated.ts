import { parseProgression } from '../../chords.ts';
import { keyName } from '../../keyprofiles.ts';
import { rank } from '../../readings.ts';
import type { ReplayFixture } from '../contracts.ts';

export interface AnnotatedChordAnalysis {
  readonly origin: 'annotated-replay';
  readonly span: { readonly startMs: number; readonly endMs: number } | null;
  readonly labels: ReplayFixture['chords'];
  readonly candidates: readonly { readonly name: string; readonly score: number }[];
  readonly quietReason: string;
}

/** Rank the annotations visible at this replay time for the lab. */
export function analyzeAnnotatedChords(
  chords: ReplayFixture['chords'],
  tMs: number,
): AnnotatedChordAnalysis {
  const labels = chords.filter(annotation => annotation.tMs <= tMs);
  if (labels.length === 0) {
    return {
      origin: 'annotated-replay',
      span: null,
      labels,
      candidates: [],
      quietReason: 'No chord annotations have arrived.',
    };
  }

  const { chords: parsedChords } = parseProgression(labels.map(({ symbol }) => symbol).join(' '));
  const candidates = rank(parsedChords).slice(0, 3).map(({ key, score }) => ({
    name: keyName(key),
    score,
  }));

  const times = labels.map(label => label.tMs);
  const span = { startMs: Math.min(...times), endMs: Math.max(...times) };
  const quietReason = [
    'No annotated chord symbols could be parsed.',
    'One parsed chord is insufficient for a public tonal claim.',
  ][parsedChords.length] ?? 'Annotated replay readings are for the lab only.';

  return { origin: 'annotated-replay', span, labels, candidates, quietReason };
}
