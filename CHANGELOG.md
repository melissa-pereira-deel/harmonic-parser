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
- Three answered spike records in `experiments/`, written with
  tiny-model-lab's `harness/templates/spike.md`. This repo is the first thing
  to use that template.
- A designed wrong-state. When no key clears `UNCERTAINTY_FLOOR` the page
  stops asserting: the reading cards go dashed and dimmed, **no card gets the
  emphasis border**, the score turns the uncertain colour, and the
  suggestions are withheld behind a stated reason instead of being offered
  for a key the banner has just disowned.

  Previously only the banner changed. Everything below it rendered
  identically at 0.41 and 0.95, including a cheerful *"What could come next
  in C major"* under a notice saying C major was merely the least bad guess.
  `design-eval` offers two options for low confidence — surface it or
  suppress the output — and the page was doing neither below the fold.

  Two details worth keeping. The top card's emphasis now depends on
  confidence rather than on position: something is always first, and being
  first is not an achievement. And the withheld suggestions say so out loud,
  because a section that silently disappears reads as a bug rather than as a
  decision.

  `test/confidence.test.ts` pins that the state is reachable in both
  directions — two real progressions trip it, two ordinary ones do not — so
  tuning the floor cannot quietly turn the whole design into dead code.
- A separate spoken channel. `aria-live="polite"` was on `<section
  id="output">` — the whole render target, which `render()` replaces on every
  keystroke — so typing `Am F C G` announced the full analysis eight times.
  `#output` is no longer a live region; a visually-hidden `#status` outside it
  receives one sentence 500 ms after typing stops (`src/announce.ts`). The
  visible panel is untouched.

  This is the fix the brief asked for, aimed somewhere else. The measurement
  below says a *render* debounce would make the page worse.
- `test/latency.test.ts` — the arithmetic, in Node, with the statistics
  mirroring `harness/profile.py::latency_ms`. It prints its numbers and states
  in its own header that it does **not** measure the render or paint, and so
  is not the number `design-eval` asks for. Adding jsdom would have produced a
  green CI number measuring a simulated DOM on the wrong hardware.
- `tools/bench-latency.md` — the real browser procedure and its script, so
  27.6 ms is reproducible rather than folklore.
- `experiments/render-latency.spike.md`, the first spike here to inform a
  contract field (`budgets.latency_band`) rather than `scope`.

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

- `renderSuggestions` takes the already-parsed chords instead of `state`. It
  used to re-parse `state.input` itself, tokenising the whole progression
  twice per keystroke for nothing -- `parseProgression` is pure, so the
  second call could only return what the first already had. Parity is
  unchanged at 0/200, which is the check that the two parses really were
  equivalent.
- `render()` returns the readings, confidence and unparsed tokens it worked
  out, so the announcement can reuse them instead of running `rank()` a
  second time.
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
