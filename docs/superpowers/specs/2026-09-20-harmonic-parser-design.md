# harmonic-parser — design

2026-09-20

## Why this exists, and why it is not what the PRD described

The original PRD described an *analysis* tool: paste a progression, a
hand-written harmonic grammar proposes every legal reading, a tiny trained
model ranks them, the page explains why. That plan has a load-bearing problem
its own risk table rates High/High — the corpus (Chordonomicon) carries no
harmonic labels, so the labels would come from the same grammar the model is
then compared against. A model trained on parser output and measured against
that parser can, at best, agree with it.

Worse, the labelling plan filtered training data to progressions where *the
top parse is unambiguous*, while the model's entire job is the ambiguous
cases. The training distribution excluded the deployment distribution.

This repo takes a different first step. It builds the **interface** first,
with no grammar and no trained model, because the PRD's own claim is that the
novelty is the interface. If the ambiguity-first idea is not good, no amount
of scorer quality rescues it, and that is answerable in days rather than
months.

## What it does

Type chords. Get: the key, a Roman numeral under each chord, ranked
alternative readings, a marker when the music is genuinely ambiguous, a
different marker when nothing fits, a way to pin a chord's function, and a
suggestion of what could come next.

Six of the eight rows of the PRD's product table, with no model.

## Architecture

Four layers plus a UI, and the seam between them is the design.

| Module | Responsibility |
|---|---|
| `chords.ts` | `"F#m7b5"` -> `{root, quality, bass}`. Pure string work, no theory. |
| `keyprofiles.ts` | 24 profiles x 12 numbers, ported from music21. The entire "model", ~1.2 KB. |
| `readings.ts` | `rank(chords) -> Reading[]`, all 24 keys, sorted by correlation. |
| `confidence.ts` | Ambiguity (a margin) and uncertainty (an absolute). Never one number. |
| `suggest.ts` | Candidate next chords from a rule table of functional moves. |
| `ui.ts` | Knows about `Reading` and `Suggestion`. Nothing else. |

```ts
interface Reading {
  key: Key;
  functions: RomanNumeral[];
  score: number;
  source: 'key-profile' | 'grammar' | 'model';
}
```

`source` exists on day one although only one producer does. That is the whole
trick: a grammar becomes a second producer and a trained scorer a third, and
the UI never learns anything changed. Roman numerals are a deterministic
lookup from key plus chord — no grammar required for that part.

## The confidence design

Two questions that must never collapse into one number:

- **Ambiguity** — the top two scores are close. The *music* supports both.
  Show both, and highlight the chord where they diverge.
- **Uncertainty** — the top score is low in absolute terms. Nothing fits. Dim
  the reading and stop asserting.

Krumhansl-Schmuckler returns a Pearson correlation, which is bounded and
comparable across inputs, so an absolute threshold is meaningful in a way a
raw log-probability would not be.

**Both thresholds are currently unmeasured and one is provably unsettable
from available data** — see `experiments/confidence-thresholds.spike.md`. The
distinction survives; the numbers do not yet mean anything.

## The oracle and the parity test

music21 generates a 200-progression fixture with full 24-key rankings. The
port is checked against it and **prints the disagreement rate rather than
asserting a tolerance**, mirroring `examples/02-config-lexer` in
tiny-model-lab. music21 is pinned exactly, not floored: it is the oracle, and
a floor lets the oracle move underneath you.

Current rate: 1/200 top reading, 7/200 ranking order, 2/200 scores. The cause
is known and recorded (`experiments/slash-bass-spelling.spike.md`) and the fix
is a change to the parser, not to the test.

## The five design checks

From tiny-model-lab's `design-eval` skill. This repo is the first thing in
either project with an interface, so the first thing able to answer them.

| Check | Answer |
|---|---|
| Failure state | A suggestion you ignore costs nothing; a doubtful reading dims rather than asserting |
| Uncertainty legibility | Two distinct states, above — and the page must not present either as calibrated until they are |
| User override | Pin any chord's function; everything re-derives |
| Privacy legibility | "Runs entirely in your browser." True: the model is 288 numbers in the bundle |
| First-run cost | There is none. No download, no warm-up |

The last one is free **only because there is no trained model**. The day an
n-gram ships, first-run cost becomes a real design problem, and that is a cost
to weigh before paying it rather than after.

## Out of scope

No grammar, no chart parser, no phrase brackets, no pivot detection, no
training, no corpus, no audio, no accounts, no persistence beyond
localStorage, no framework.

## What it sets up

When a trained scorer is worth building, the contract nearly writes itself,
and it avoids the PRD's trap:

- **Labels are free.** Next-chord prediction is self-supervised — the next
  chord is the label — so the corpus needs no harmonic annotation and no
  parser-derived silver labels.
- **The baseline is the shipped rule table**, with a number measured from
  this page rather than invented.
- **Split by genre, not by song.** The PRD's own Q4 says a per-genre model may
  be the single biggest quality win; if genre is where the quality is, genre
  is the axis generalisation has to cross. Splitting by song measures memorised
  genre convention and reports it as harmonic understanding.
- There are published reference numbers: the Chordonomicon authors benchmarked
  next-chord prediction on this dataset at 354K-1.33M parameters.

## Decisions worth revisiting

- **No framework.** State is one object and one render call. Preact is 3 KB if
  it stops being true, but staying framework-free is what makes the privacy
  claim credible rather than a slogan.
- **Matching music21 exactly.** Its slash-bass behaviour is arguably a
  spelling artifact rather than a fact about music. Diverging is legitimate,
  but it has to be argued and written down, not arrived at by lowering a
  number until the suite goes green.
