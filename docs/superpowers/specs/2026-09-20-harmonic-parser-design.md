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

A handful of small modules plus a UI, and the seams between them are the
design.

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
  Show both. This also said to highlight the chord where they diverge; that
  highlight was never built, and the page shows the contenders side by side
  without it.
- **Uncertainty** — the top score is low in absolute terms. Nothing fits. Dim
  the reading and stop asserting.

Krumhansl-Schmuckler returns a Pearson correlation, which is bounded and
comparable across inputs, so an absolute threshold is meaningful in a way a
raw log-probability would not be.

**Both thresholds are currently unmeasured, and neither can be calibrated
from available data** — see `experiments/confidence-thresholds.spike.md`. Five
tests in `test/confidence.test.ts` are marked `it.fails` and keep the
falsified claims on record. The distinction survives; the numbers do not yet
mean anything.

## The oracle and the parity test

music21 generates a 200-progression fixture with full 24-key rankings. The
port is checked against it and **prints the disagreement rate rather than
asserting a tolerance**, mirroring `examples/02-config-lexer` in
tiny-model-lab. music21 is pinned exactly, not floored: it is the oracle, and
a floor lets the oracle move underneath you.

When this was written the rate was 1/200 top reading, 7/200 ranking order and
2/200 scores. The cause was recorded in
`experiments/slash-bass-spelling.spike.md`, and the fix was a change to the
parser, not to the test. Since it landed the rate is **0/200** on all three.
Five rankings reorder within a tie, and those are counted separately because
they are not disagreements.

## The five design checks

From tiny-model-lab's `design-eval` skill. This repo is the first thing in
either project with an interface, so the first thing able to answer them.

| Check | Answer |
|---|---|
| Failure state | When no key clears the floor the readings go dashed and dimmed, no card is emphasised, the score turns the uncertain colour, and the suggestions are **withheld with a stated reason** rather than offered for a key the page has just disowned |
| Uncertainty legibility | Two distinct states, above — and the page must not present either as calibrated until they are |
| User override | Pin any chord's function from the leading card and the ranking re-filters. Pins are a filter over keys, not a re-parse — `functions` is deterministic from key plus chord, so every reading a pin can reach is already in the list. Contradictory pins return nothing, which the page says plainly and offers a way out of |
| Privacy legibility | "Runs entirely in your browser." True: the model is 288 numbers in the bundle |
| First-run cost | There is none. No download, no warm-up |

The last one is free **only because there is no trained model**. The day an
n-gram ships, first-run cost becomes a real design problem, and that is a cost
to weigh before paying it rather than after.

## Out of scope

No grammar, no chart parser, no phrase brackets, no pivot detection, no
training, no corpus, no audio, no accounts, no persistence beyond
localStorage, no framework.

## Scope revisited (2026-11-07)

The list above is the scope as decided on 2026-09-20, kept as the record.
Some of it has moved, and this is where that is written down.

- **A corpus and a next-chord model are on the roadmap.** Next-chord
  prediction is the one planned learned model (#17). It is gated twice: by the
  contract, `experiments/next-chord.yaml` (#28), written before any corpus
  data is opened; and by the licence verdict on the corpus (#14). The
  per-partition audit is `docs/choco-licence-audit.md`. The verdict is
  pending, and it is the owner's to give.
- **It would feed suggestions, not readings.** The model would be a second
  source of suggestions in `suggest.ts`, beside the rule table it has to
  beat. `Reading.source: 'model'` has no plan behind it, so the trained
  scorer that the architecture above names as a third producer is a type,
  not a roadmap.
- **The baseline will cover every context.** #13 adds rules for degrees 1
  and 6, so that the rule table answers all 288 contexts instead of falling
  back on 48.
- **First-run cost stops being free if the model ships.**
  `experiments/next-chord-size.spike.md` found that a bundled count table
  will not fit the page's first round trip, so it would load after first
  paint, as a designed download rather than a discovered one.
- **Modal ranking is proposed, not planned.** Naming Dorian or Mixolydian
  rather than only major and minor waits on a scoping spike (#29).
- **A grammar stays out.** #16 is a scoping question: which theory, and what
  oracle, before any code.
- **localStorage is still unused.** The list allowed it; nothing uses it.
- The modules in the architecture table have been joined by `pins.ts` (user
  override), `announce.ts` (the spoken channel) and `main.ts` (wiring).

## What it sets up

When a trained next-chord model is worth building, the contract nearly writes
itself, and it avoids the PRD's trap:

- **Labels are free.** Next-chord prediction is self-supervised — the next
  chord is the label — so the corpus needs no harmonic annotation and no
  parser-derived silver labels.
- **The baseline is the shipped rule table**, with a number measured from
  this page rather than invented.
- **Split by song, and report by genre.** This line first read *split by
  genre, not by song*: the PRD's own Q4 says a per-genre model may be the
  single biggest quality win, so genre looked like the axis generalisation has
  to cross. The current plan (#28) is `split_by: song`, never random, for
  leakage control, because a progression's neighbours are its own bars. The
  genre question moves to reporting: results are broken down per partition
  and genre as well as overall, and that is where generalisation across genre
  is read.
- There are published reference numbers: the Chordonomicon authors benchmarked
  next-chord prediction on their dataset at 354K-1.33M parameters. They are a
  reference only. Chordonomicon is CC BY-NC 4.0, which #14 rules out for
  commercial use, so those numbers were not measured on any corpus this repo
  would train on.

## Decisions worth revisiting

- **No framework.** State is one object and one render call. Preact is 3 KB if
  it stops being true, but staying framework-free is what makes the privacy
  claim credible rather than a slogan.
- **Matching music21 exactly.** Its slash-bass behaviour is arguably a
  spelling artifact rather than a fact about music. Diverging is legitimate,
  but it has to be argued and written down, not arrived at by lowering a
  number until the suite goes green.
