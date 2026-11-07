# Contributing

## What's most wanted

**Real progressions with a human judgement attached** (#15).
`confidence-thresholds` in `experiments/` hit this wall head-on: there is no
corpus of things people actually typed, with somebody saying which felt
ambiguous, so the parity fixture is the wrong population to calibrate
against. Without that corpus the two confidence thresholds are guesses with a
plausible shape, and the page should not claim otherwise. A few hundred
labelled progressions is worth more here than any amount of code. They are
collected through the page's feedback form
(`.github/ISSUE_TEMPLATE/reading-feedback.yml`, linked from the page footer
and from `docs/tester-guide.md`), one progression per submission.

**That is not the next-chord corpus.** The two are easy to confuse, and
obtaining one does not help with the other.

| | Calibration corpus | Next-chord corpus |
|---|---|---|
| Issue | #15 | #14, #28 |
| What it is | Progressions people typed, each with a person's label: one reading, two, or nothing fits | Chord sequences from existing music. Self-supervised: the next chord is the label, so nobody labels anything |
| What it is for | Calibrating `AMBIGUITY_MARGIN` and `UNCERTAINTY_FLOOR` | Training the next-chord model and gating it against `suggest.ts` |
| How it is obtained | The feedback form | A licensed corpus. ChoCo's audit is `docs/choco-licence-audit.md`; the include/exclude verdict is pending and is the owner's |

Whether the next-chord corpus is worth obtaining is decided: it is.
`suggest-baseline-shape` deferred that question until a defect in the rules
was fixed; once it was, #17 re-read the numbers and recorded the decision.
What gates the corpus now is the licence verdict (#14) and the contract
(#28), written before any corpus data is opened.

Also wanted: the next-chord experiment itself, whose ordered plan is #17; and
a harmonic grammar as a second `Reading` producer (#16), which is still a
scoping question.

## Ground rules

- **Do not adjust a number to make a test pass.** Five tests are marked
  `it.fails` and each points at a spike record explaining what was measured.
  If you believe one is wrong, write a spike that measures it and say so
  there. Changing `AMBIGUITY_MARGIN` until the suite goes green is the exact
  failure the sibling repo exists to prevent.
- **Do not widen the parity tolerance.** `test/parity.test.ts` is the only
  sensor on the port. The first tolerance added to it is the moment it stops
  sensing: accepting 1/200 today means not noticing 12/200 later.
- **The fixture is generated, never edited by hand.** If you need it to
  change, change `tools/generate-fixtures.py` or the pinned music21 version,
  regenerate, and read the diff.
- **Nothing under `src/` may import anything from `tools/`.** music21 is a
  dev-time oracle. The page ships 24 profiles and no dependencies.
- **Say what leaves the device.** Nothing does. If you add something that
  does, it belongs in the README before it belongs in the code.

## Which Node versions this supports

The floor is in `package.json` under `engines`, and CI tests the floor and the
ceiling, not the versions between. Those two move together: raising the floor
means editing `engines` and the CI matrix in the same commit, or the claim and
the evidence disagree.

Python in `tools/` is dev-only. music21 is pinned **exactly**, unlike
everything else, because it is the oracle rather than a tool — see the comment
in `tools/requirements.txt`.

## Spikes

A question about this repo that can be answered by one cheap measurement gets
a spike record, not an opinion in a PR description. Copy
`harness/templates/spike.md` from tiny-model-lab, save it as
`experiments/<slug>.spike.md`, and check it with `python -m harness spikes`.
It wants a question, a threshold written before the number exists, a named
consequence, and a budget of at most one working day.

A spike is a finding, never a run. If it starts to need a training loop, it is
an experiment and it needs a contract first.

## Before opening a PR

Exactly what CI runs, in CI's order:

```bash
npm ci
npm run typecheck
npm test
npm run build

pip install music21==10.5.0
python tools/generate-fixtures.py
git status --porcelain      # must be empty
```

Then add a `CHANGELOG.md` entry. There is no `Gate semantics` category here —
no gate arithmetic lives in this repo.
