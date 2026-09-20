---
question: "Can AMBIGUITY_MARGIN and UNCERTAINTY_FLOOR be set from the 200-progression parity fixture?"
informs: scope
threshold: "A margin cutoff that flags a relative major/minor pair and fewer than a quarter of progressions, and a floor that flags unrelated triads and leaves diatonic ones alone."
if_not: "Stop asserting calibrated confidence in the UI, keep both numbers marked unmeasured, and get real typed progressions before claiming either flag means anything."
budget_minutes: 60
status: answered
finding: "No. The relative pair is not close under Krumhansl-Schmuckler, and the fixture is the wrong population to calibrate against."
measured: 0.105
elapsed_minutes: 35
---

# confidence-thresholds

## What I did

Took the 200 cases already in `fixtures/music21-rankings.json`, which carry
music21's full 24-key ranking and scores, and looked at two distributions: the
top score, and the gap between the top two. Then compared those against the
three progressions `test/confidence.test.ts` uses as labelled probes.

```
top score    min 0.408  p10 0.612  p25 0.694  median 0.795  p90 0.910  max 0.952
top-2 margin min 0.000  p10 0.014  p25 0.039  median 0.091  p90 0.224  max 0.341

Am F C G        margin 0.105   (C major over A minor)
C F#m7b5 Bb E   top    0.672
```

## What I found

**Two findings, and the second is the one that matters.**

**A relative major/minor pair is not ambiguous under this scorer.** `Am F C G`
separates C major from A minor by 0.105. The *median* margin over 200
progressions is 0.091. So the pair everyone reaches for as the canonical
example of harmonic ambiguity is, by this measurement, less close than half of
all progressions — and any `AMBIGUITY_MARGIN` large enough to flag it would
flag most of the corpus. `test/confidence.test.ts` asserts that pair comes out
ambiguous. That assertion is musically intuitive and empirically wrong here,
and it is left failing rather than adjusted: the same way
`examples/02-config-lexer` in tiny-model-lab left a falsified hypothesis in its
`experiment.yaml` instead of editing it to match the result.

Why it happens is worth knowing. Krumhansl-Schmuckler correlates a
pitch-class distribution against 24 profiles. C major and A minor share all
seven pitch classes, so they are not separated by *which* notes appear but by
*how often* — and four chords is enough weighting for the major profile to
pull clear. The ambiguity a musician hears is about function and context,
which a bag of pitch classes does not represent at all.

**The fixture is the wrong population.** Its 200 progressions are generated
from a seed: random roots, random qualities. That is chord salad, not music. A
threshold for "does this look confusing" calibrated against nonsense is
calibrated for nonsense. `C F#m7b5 Bb E` scores 0.672, which sits between the
p10 and p25 of that population — so against random chords it is unremarkable,
and a floor set here would say more about the generator than about music.

## What changes

`if_not` fires as written. Both constants stay marked unmeasured in
`src/confidence.ts`, the UI must not present either flag as a calibrated
number, and the two falsified tests stay red until there is real material to
set them against. What is needed is a few hundred progressions somebody
actually typed, with a human saying which felt ambiguous — which is a
different and more expensive piece of work than this spike, and should be
scoped as one.

The *distinction* survives intact. Ambiguity as a margin and uncertainty as an
absolute are still two different questions, and `assess()` still computes them
separately. What is not yet true is that either number means anything.

## What this is not

Not a run. One measurement against one written threshold, answered no, inside
its budget.
