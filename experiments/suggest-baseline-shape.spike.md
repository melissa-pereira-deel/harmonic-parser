---
question: "In how many of the baseline's 288 contexts is the top suggestion decided by the alphabetical tie-break rather than by a weight?"
informs: scope
threshold: "Under 20% of the 288 contexts, and not concentrated on degree 0 or degree 5."
if_not: "File a product issue against suggest.ts and fix the tie-break before any corpus work, because the experiment's premise changes from beating the rules to repairing them."
budget_minutes: 90
status: answered
finding: "96 of 288, a third, and concentrated exactly on the two commonest contexts in tonal music."
measured: 96
elapsed_minutes: 65
---

# suggest-baseline-shape

## What I did

`suggest()` reads exactly two things: the last chord's root and the key. So
its entire input domain is **12 tonics x 2 modes x 12 last degrees = 288
contexts**, and the baseline is a 288-row table that happens to be written as
seventeen rules. That can be exported and inspected without a corpus, a
licence audit, or a training run.

`tools/export-suggest-baseline.ts` enumerates all 288 and writes
`fixtures/suggest-baseline.json`. `test/suggest.test.ts` re-derives it, and CI
regenerates and fails on any diff.

This was step one of the next-chord experiment (tiny-model-lab#18) on the
grounds that it might end the experiment. It did.

## What I found

**96 of 288 contexts — a third — have their top suggestion decided by
`localeCompare` on the spelled chord symbol rather than by anything in the
rule table.** `src/suggest.ts` sorts
`b.weight - a.weight || a.symbol.localeCompare(b.symbol)`, and the table
contains weight ties.

The threshold was under 20% and not concentrated on degrees 0 or 5. It is 33%
and concentrated on exactly those, plus the two degrees with no rules:

```
ties by last degree:  0: 24    1: 24    5: 24    6: 24
fan-out:              1 -> 120   2 -> 72   3 -> 48   7 -> 48
fallback:             48 / 288   (degrees 1 and 6, which have no rule at all)
```

Degrees 0 and 5 are **I** and **IV** — between them, most of the traffic in
tonal music.

**After IV, the baseline suggests I in six major keys and V in six.** Same
musical situation, opposite answer, decided by whether the tonic's name sorts
before the dominant's:

| key | suggests | beat | |
|---|---|---|---|
| C major | `C` (I) | `G` (V) | on spelling |
| D major | `A` (V) | `D` (I) | on spelling |
| F major | `C` (V) | `F` (I) | on spelling |
| A major | `A` (I) | `E` (V) | on spelling |

After I the split is lopsided rather than even — IV in 22 of 24 contexts —
which is less visibly arbitrary but no better reasoned.

The tightest demonstration is a single row. **`Ab major` and `G# minor` have
the same tonic pitch class and hit the same rules, and after a IV chord they
disagree** — `Ab major` goes to the tonic, `G# minor` goes to the dominant,
because one spells its tonic A-flat and the other G-sharp. It is the only row
in the rule path where the two modes differ in order, and nothing musical
distinguishes them.

## Two things I expected and got wrong

**I expected the whole file to be mode-blind.** The rule path is — the
seventeen moves never consult `mode` when choosing a degree, so a major-mode
table is applied unchanged in minor, where the diatonic degrees are 3, 8 and
10. But the *fallback* calls `scalePitchClasses(key)` and correctly offers the
minor scale. The file is half mode-aware, and the half that is not is the half
that does the work. Pinned in `test/suggest.test.ts`.

**I expected the fallback to be rare.** It is 48 of 288 — a sixth of the input
domain has no rule at all, and reaches the user as seven diatonic chords with
weight ties of their own, ordered alphabetically and truncated.

## What changes

`if_not` fires as written. **No corpus work, no licence audit, no contract.**

The experiment's premise was *can a learned model beat these rules*. That
question cannot be answered cleanly while a third of the rules' answers are
decided by the alphabet, because any margin a model won could be this instead
— and the fix is two lines in `suggest.ts`, which is cheaper and more useful
to the page than any model.

Filed against harmonic-parser. The order is: fix the tie-break deliberately,
regenerate this fixture, re-read these numbers, and only then decide whether a
corpus is worth obtaining.

**The baseline was deliberately not fixed in this change.** The alphabetical
tie-break is what ships, so it is the honest baseline, and editing it before
measuring is the move tiny-model-lab#18 warns against even when the edit is an
improvement. The fixture records the before.

## Resolution

Fixed in its own change, after this record and the fixture had kept the
before. Ties now go to the move listed first in `MOVES`, and in the fallback
to the lower degree — both about degrees, so no spelling can reach the order.
The weights did not move.

```
                                           before   after
top suggestion decided by a tie              96/288   96/288   (weights unchanged)
(mode, degree) answers that vary by tonic      8/24     0/24
minor/major order flips on shared rules        1        0
after IV, suggests I                         11/24    24/24
after I, suggests IV                         22/24    24/24
rows reordered                                    -   57/288
rows whose top suggestion changed                 -   41/288
rows whose candidate set changed                  -    0/288
```

The record above says this was filed as an issue. It was not; this change
is the fix it would have tracked.

What comes next is the order the record already gave: re-read these numbers
— now, for the first time, about the rules rather than the alphabet — and
only then decide whether a corpus is worth obtaining.

### The second fix: minor keys

The rule table was major-only and applied unchanged in minor, the half of the
file this record said was mode-blind. Minor now has its own table. The major
table did not change, and no major row moved.

```
                                     before   after
suggestions outside the minor scale    48        0
...of which the top suggestion         12        0
minor rows changed                      -      120/144
top suggestions changed                 -       84/288
top suggestion decided by a tie        96/288   96/288
fell through to the fallback           48/288   48/288
```

Its weights are hand-assigned too, on the same scale. Writing them is a musical
judgement that nothing has measured.

### The third fix: uncovered contexts

Degrees 1 and 6, `bII` and the tritone, had no rule in either table, which is
the 48 this record found falling back. The owner decided in #13 that this was
a gap, not a boundary, and approved two rules for each degree in each mode:
the tritone substitution and the Neapolitan from `bII`, and `#iv°` to V or
to the tonic from the tritone. No other row moved.

```
                                     before   after
fell through to the fallback          48/288    0/288
top suggestion decided by a tie       96/288   48/288
rows changed                               -   48/288
top suggestions changed                    -   36/288
widest fan-out                             7        3
suggestions outside the minor scale        0        0
```

The ties that went were all fallback rows, where the tonic and dominant tie
at 3; the 48 left follow I and IV in both modes, decided by table order as
before. The widest fan-out was the fallback's seven, and the rule path's
widest is still three. Top suggestions changed in 36 rows, not 48, because
the fallback already put the tonic first, and in major the tritone
substitution after `bII` goes there too.

The weights are hand-assigned and unmeasured, like the rest of the table. The
reasons are keyed on the degree, not the chord, so "bII7" is the reason after
a plain `bII` triad and "#iv°" after any chord on the raised fourth.

## What this is not

Not a run. One question against one written threshold, answered no, inside its
budget — and it saved the ten hours of corpus work the rest of the experiment
would have cost.
