# Changelog

Notable changes to this project, in [Keep a Changelog](https://keepachangelog.com/en/1.1.0/)
format, following [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

tiny-model-lab, the sibling repo, adds a `Gate semantics` category to this
format because a gate that gets stricter invalidates a run that already
passed. **There is no such category here**, and there should not be: no gate
arithmetic lives in this repo. A change to what a gate accepts is a harness
change and is recorded there. What this repo has instead is a parity fixture,
and a change to *that* is a `Changed` with the disagreement rate quoted.

## [Unreleased]

### Added

- The four layers. `chords.ts` parses a chord symbol to `{root, quality,
  bass}`; `keyprofiles.ts` holds 24 Krumhansl-Schmuckler profiles ported from
  music21; `readings.ts` ranks all 24 keys and returns `Reading[]`;
  `confidence.ts` separates ambiguity from uncertainty; `suggest.ts` proposes
  next chords from a rule table; `ui.ts` renders.
- `Reading.source` — `'key-profile' | 'grammar' | 'model'` — present from the
  first commit though only one producer exists. A grammar and a trained scorer
  are meant to land as further producers without the interface learning that
  anything changed.
- `test/parity.test.ts` and `fixtures/music21-rankings.json`: 200 progressions
  with music21's full 24-key ranking, regenerable byte-identically from
  `tools/generate-fixtures.py` and a seed held inside that script. The test
  prints the disagreement rate rather than asserting a tolerance.
- Two answered spike records in `experiments/`, written with tiny-model-lab's
  `harness/templates/spike.md`. This repo is the first thing to use that
  template.

### Known failing

Six tests, left red deliberately. Adjusting a number to make them pass would
be the exact failure the sibling repo's baseline gate exists to prevent.

- Five in `test/confidence.test.ts`. `experiments/confidence-thresholds.spike.md`
  measured why: `Am F C G` separates C major from A minor by 0.105, while the
  *median* margin over 200 progressions is 0.091 — so a relative major/minor
  pair is not close under this scorer, and any threshold wide enough to flag
  it would flag most of the corpus. The test encodes a musically intuitive
  claim that the measurement falsified. It stays as written.
- One in `test/parity.test.ts`. `experiments/slash-bass-spelling.spike.md`
  found the cause: music21 appends a slash bass as an extra pitch when its
  *letter name* differs from every chord tone, so `E-dim/F#` counts pitch
  class 6 twice. `src/chords.ts` uses a `Set` and cannot. The fix is letter
  names through the parser and a multiset, not a wider tolerance.
