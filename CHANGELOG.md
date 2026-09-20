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

### Fixed

- The port now agrees with music21 on **every** top reading and every score:
  1/200, 7/200 and 2/200 disagreements all go to 0/200.
  `experiments/slash-bass-spelling.spike.md` has the whole trail. music21
  appends a slash bass as an extra pitch unless a chord tone is spelled
  *identically* — accidental included — so `Cdim/Gb` is three pitches and
  `Cdim/F#` is four with pitch class 6 counted twice. `chords.ts` compared
  pitch classes, could not tell those apart, and lost one progression in two
  hundred.

  The fix carries the root letter and the bass letter-plus-accidental through
  the parser, spells each chord tone from a `LETTER_OFFSETS` table read out
  of music21 and verified stable across all twelve roots, and makes
  `pitchClasses` return a multiset rather than a `Set`. `readings.ts` counts
  into a distribution, so the duplicate is real weight.

  An earlier reading of the rule — match on *letter* — fit the first two
  examples and was wrong: `C/E-` appends although letter E is present. Widen
  the sample before believing a rule.

### Changed

- `test/parity.test.ts` counts a reordering *within a tie* separately from a
  disagreement, and still asserts zero on the top reading and on every score.
  Five cases remain reordered and none is a port bug: two are exact ties
  (`Fdim Bbm Ebm` scores D major and C major both `-0.5697452319355997`, so
  the order is enumeration order before a stable sort) and three differ in
  the last bit of an IEEE 754 sum. The fixture stores six decimal places and
  the ties survive at seventeen, so a total order over 24 keys was asking the
  oracle a question it cannot answer. Bounded to exact ties, measured rather
  than assumed, and it does not extend to the answer.

### Known failing

Five tests, left red deliberately. Adjusting a number to make them pass would
be the exact failure the sibling repo's baseline gate exists to prevent.

- Five in `test/confidence.test.ts`. `experiments/confidence-thresholds.spike.md`
  measured why: `Am F C G` separates C major from A minor by 0.105, while the
  *median* margin over 200 progressions is 0.091 — so a relative major/minor
  pair is not close under this scorer, and any threshold wide enough to flag
  it would flag most of the corpus. The test encodes a musically intuitive
  claim that the measurement falsified. It stays as written.
Parity is no longer among them — see Fixed above.
