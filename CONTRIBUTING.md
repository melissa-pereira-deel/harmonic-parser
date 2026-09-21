# Contributing

## What's most wanted

**Real progressions with a human judgement attached.** `confidence-thresholds`
in `experiments/` hit this wall head-on: there is no corpus of things people
actually typed, with somebody saying which felt ambiguous, so the parity
fixture is the wrong population to calibrate against. Without that corpus the
two confidence thresholds are guesses with a plausible shape, and the page
should not claim otherwise. `suggest-baseline-shape` deferred the same question
rather than answering it — it found a defect worth fixing first, and said to
decide whether a corpus is worth obtaining only afterwards. A few hundred
labelled progressions is worth more here than any amount of code.

Then, in order: the slash-bass spelling fix described in
`experiments/slash-bass-spelling.spike.md`; a harmonic grammar as a second
`Reading` producer; and better `suggest.ts` than a rule table.

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
