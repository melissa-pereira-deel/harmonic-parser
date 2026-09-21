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

- **The baseline, as a file, and the first tests it has ever had.**
  `src/suggest.ts` shipped in the first commit calling itself "the baseline
  any future model has to beat" and nothing had ever asserted one of its
  suggestions was right. `tools/export-suggest-baseline.ts` writes all 288
  contexts it can be asked about — `suggest()` reads only the last chord's
  root and the key, so 12 tonics x 2 modes x 12 degrees is its whole input
  domain — to `fixtures/suggest-baseline.json`. `test/suggest.test.ts`
  re-derives it and a CI job fails on any diff.

  The point is not tidiness. The next-chord experiment
  ([tiny-model-lab#18](https://github.com/melissa-pereira-deel/tiny-model-lab/issues/18))
  has to score this baseline from Python, and the alternative to a committed
  fixture is re-implementing seventeen rules, two spelling tables, a quality
  table, the fallback and the tie-break in a second language — where every
  transcription slip is invisible and favours the model. There is no port to
  get wrong if there is no port.

  **And exporting it immediately found a bug.** See
  `experiments/suggest-baseline-shape.spike.md`: 96 of the 288 contexts have
  their top suggestion decided by `localeCompare` on the spelled chord name
  rather than by the rule table, concentrated on degrees 0 and 5 — I and IV,
  most of the traffic in tonal music. After a IV chord the page suggests I in
  six major keys and V in six, the same situation with opposite answers. `Ab
  major` and `G# minor` share a tonic pitch class and disagree, because one
  spells it A-flat and the other G-sharp.

  `suggest.ts` is deliberately unchanged. The tie-break is what ships, so it
  is the honest baseline, and editing it before measuring is the move #18
  warns against even when the edit is an improvement. The fixture records the
  before.
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
- Four answered spike records in `experiments/`, written with
  tiny-model-lab's `harness/templates/spike.md`. This repo is the first thing
  to use that template.
- **User override.** Every chord on the leading reading carries its numeral as
  a control; changing it pins that chord to that function and the ranking
  re-filters. Tap the `C` in `Am F C G`, read it as IV, and the top reading
  becomes G major — the original PRD's own scenario, and the last of the five
  `design-eval` checks.

  It is a filter over keys, not a re-parse. `functions` is deterministic from
  key plus chord, so the readings a pin can reach are already in the list of
  24 and there is nothing to re-derive. That also makes the menu safe: every
  option offered came from a reading, so a *single* pin can never empty the
  result — `test/pins.test.ts` checks that property across every option of
  three progressions rather than trusting it.

  Two pins can contradict, and that is a real answer rather than an error.
  Ask for `C as I` and `G as I` and no key provides both; the page names the
  pins you set, says nothing is wrong with the progression, and offers the
  clear button. It does **not** silently drop a pin to keep a list on screen
  — the page overruling the person inside the feature whose purpose is
  letting the person overrule the page would be the worst available failure,
  so a test pins that too.

  The control is a `<select>` rather than a custom popup: keyboard-operable,
  already meaningful to a screen reader, and works on a phone, for no
  JavaScript. Pins are held by chord index and dropped when the chord they
  name changes, so editing the box cannot leave an invisible constraint
  behind.

  The wide half of correction — re-parse with the constraint baked in, so the
  parser can reach a reading the ranker never generated — still needs a
  parser to bake it into.
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

- Setup no longer needs `rm experiments/experiment.yaml`, because the reason
  for it is gone. `harness init` used to copy a blank contract in under that
  name, and tiny-model-lab's training guard only checks that *some*
  `experiments/*.yaml` exists — it never reads the file — so a freshly
  scaffolded project had training unlocked by a file that exists in order to
  be invalid. Fixed upstream in
  [tiny-model-lab#21](https://github.com/melissa-pereira-deel/tiny-model-lab/issues/21):
  `init` writes `experiments/experiment.yaml.template`, which that glob does
  not see. The workaround did not merely become unnecessary — it became an
  error, since `rm` on a missing path exits 1.

  `experiments/*.yaml.template` is gitignored. It is tiny-model-lab's file and
  `init` rewrites it on demand, so a vendored copy here would only drift.
  Upstream also now writes a `.gitignore` into a project that lacks one
  ([tiny-model-lab#30](https://github.com/melissa-pereira-deel/tiny-model-lab/issues/30));
  this repo has one already, and `init` leaves it alone.
- Corrected the counts, which had drifted independently in four places and
  did not agree with each other or with the directory. There are **four**
  answered spike records — `README.md` said three, `experiments/README.md`
  said two, `CONTRIBUTING.md` said both — and **five** expected failures, not
  the six claimed in `CONTRIBUTING.md` and the CI comment. `CONTRIBUTING.md`
  also said the answered spikes all hit the missing-corpus wall; one did, and
  `suggest-baseline-shape` deferred that question rather than answering it.
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
