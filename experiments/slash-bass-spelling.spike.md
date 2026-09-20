---
question: "Why does the TypeScript port disagree with music21 on one progression in two hundred?"
informs: scope
threshold: "A named cause, and a decision on whether to match music21 or diverge from it deliberately."
if_not: "Leave the parity test red rather than widening it, because a tolerance would make the only sensor on the port stop sensing."
budget_minutes: 45
status: answered
finding: "music21 appends a slash bass as an extra pitch when its letter name differs from every chord tone, so a pitch class can be counted twice."
measured: 1
elapsed_minutes: 25
---

# slash-bass-spelling

## What I did

Ran the parity test, read the one case it named, and asked music21 directly
what pitches it builds for that chord.

```
F#m C#m E B Ebdim/F#   ours: B major    music21: F# minor

E-dim/F#  pitches ['F#2','E-3','G-3','B--3']  pitch classes [6, 3, 6, 9]
E-dim     pitches ['E-3','G-3','B--3']        pitch classes [3, 6, 9]
C/E       pitches ['E3','G3','C4']            pitch classes [4, 7, 0]
```

## What I found

**music21 counts pitch class 6 twice for `E-dim/F#`.** The chord's diminished
fifth is spelled `G-` and the slash bass is spelled `F#`. Same pitch class,
different letter — so music21 appends the bass as a fourth pitch instead of
inverting. For `C/E` the bass letter E matches a chord tone, so it inverts and
stays at three pitches.

The rule is **letters, not pitch classes**: append the bass when its letter
name is absent from the chord's spelled tones. `E-dim` is lettered E, G, B;
`F#` is lettered F; so it appends.

`src/chords.ts:194` does `set.add(chord.bass)` on a `Set`, so a pitch class
already present is a no-op and the chord stays at three. The distribution
differs, the correlation differs, and B major edges out F# minor.

The full rates, which the test prints rather than hides:

```
top reading disagreement:   1/200 (0.50%)
ranking order disagreement: 7/200 (3.50%)
score disagreement > 1e-6:  2/200 (1.00%)
```

## What changes

**Match music21, do not widen the test.** The parity test's own docstring says
a non-zero rate is a bug in the port rather than a tolerance to widen, and
that is right: this test is the only sensor on the port, and the first
tolerance added to it is the moment it stops sensing. Accepting 1/200 today
means not noticing 12/200 later.

The fix is to carry letter names through `chords.ts` — root letter plus
interval degree gives each chord tone a letter — and to build a pitch-class
*multiset* rather than a `Set`, appending the bass when its letter is absent.
That is a real change to the parser's data model, not a patch, and it is
scoped as its own piece of work rather than squeezed in here.

Worth saying plainly: music21's behaviour here is arguably an artifact of
spelling rather than a fact about music. Double-counting G-flat because
somebody typed F-sharp is not a musical judgement. Diverging from the oracle
on purpose is a legitimate option — but it would have to be argued, written
down, and the parity test's contract changed deliberately. It is not
something to arrive at by lowering a number until the suite goes green.

## What this is not

Not a run. One question, one cause, one decision, inside its budget.
