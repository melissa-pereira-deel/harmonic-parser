# Proof-of-concept gap analysis

Reviewed 2026-11-05. Every `file:line` below is against `main` at `c37a8d5`.
Nothing here has been tested by a person outside the project; "verified" means
read in the source, or run under Node against `src/`.

## 1. Decision

**The page is the proof of concept, and it comes first.** The aim is a hosted,
self-consistent page that testers can open in a browser and give feedback on.
The next-chord experiment (#17) stays defined but later. Section 7 names what is
still undecided for it.

This matches why the page exists: it was built before any model to find out
whether the ambiguity-first idea is good, "in days rather than months" (design
spec, `docs/superpowers/specs/2026-09-20-harmonic-parser-design.md`). That
question cannot be answered until somebody other than its author can use it.

## 2. Implemented versus claimed

| Area | What it does (verified) | Gap |
|---|---|---|
| `src/chords.ts` | Parses 17 qualities and slash basses; `pitchClasses` returns a multiset following music21's slash-bass rule | `:32` says `generate-fixtures.py` refuses qualities music21 spells differently, and `:108` says a test pins `LETTER_OFFSETS` to `INTERVALS`. Neither check exists |
| `src/keyprofiles.ts` | 24 Krumhansl-Schmuckler profiles from music21 10.5.0 | Profile choice is "untested" (`:14`) |
| `src/readings.ts` | Ranks all 24 keys; numeral and role per chord | Every inversion renders the literal `/bass` (`:148`), so `G/B` shows `V/bass`. `'grammar'` and `'model'` have no producer. Equal chord weighting is unmeasured (`:162`) |
| `src/confidence.ts` | Computes ambiguity and uncertainty separately | Both thresholds unmeasured (`:37`, `:47`). The header's examples are wrong: `Am F C G` is clear, not ambiguous |
| `src/suggest.ts` | 17 rules, ties broken by degree since #11 | Rule path ignores mode (#12). D, G, C and F minor get sharp spellings (`:75-86`), for example `D#` in C minor. 48 of 288 contexts have no rule (#13) |
| `src/pins.ts`, `src/ui.ts` | Pin a chord's function, re-filter, named conflict state, designed wrong-state | Narrow override only; the wide half needs a parser (`pins.ts:12`, #16). No per-chord unpin, only "Clear pins" |
| `src/announce.ts` | One spoken sentence after typing stops | 500 ms is unmeasured (`:34`) |
| Tests | 64 cases in 7 files, 5 of them `it.fails`; parity with music21 at 0/200 | README (`:27`, `:31`, `:81`) says tests fail, but `npm test` is green |
| CI | Test matrix, `baseline` job, `fixture` job | No deploy job |
| Hosting | None: `has_pages: false`, `homepage: null`, no live URL | `vite.config.ts:12-14` mentions "the deployed page" |
| Example buttons | Five buttons, see below | **None reaches the uncertain state** |

What the buttons produce today, measured under Node:

| Button | Top / second | State |
|---|---|---|
| `Am F C G` | C major 0.935 / A minor 0.830 | clear |
| `Dm7 G7 Cmaj7` | C major 0.739 / G major 0.719 | ambiguous |
| `C G/B Am F` | C major 0.935 / A minor 0.830 | clear |
| `Bb Eb F Bb` | Bb major 0.959 / F major 0.745 | clear |
| `C F#m7b5 Bb E` | E minor 0.672 / C major 0.614 | ambiguous, by 0.058 against a 0.06 margin |

Proposed replacement for the last button: `G7 C# E7 F9`, F minor 0.488 / D minor
0.376, which is uncertain and not ambiguous.

## 3. The five design checks

| Check | Real status |
|---|---|
| Failure state | Done, but no example button shows it |
| Uncertainty legibility | Built. The thresholds are unmeasured, and the footer says so |
| User override | Narrow half shipped in PR #5 on 2026-09-21. Wide half is #16. tiny-model-lab#19, #16 and #17 still describe it as unbuilt |
| Privacy legibility | True today. Must stay true after a feedback link is added |
| First-run cost | None, only because there is no model. Becomes a decision at E10 |

## 4. What "testable proof of concept" means

No success criteria for the page were written anywhere. These are proposed:

- **A1** A live URL built from `main` by a workflow, linked from the README and
  the repo homepage.
- **A2** Clear, ambiguous and uncertain are each reachable from an example
  button, enforced by a test.
- **A3** Override round trip on the live page: pinning filters the list and shows
  the pin bar, Clear restores it, and two contradicting pins reach the conflict
  notice.
- **A4** Junk input reaches the unreadable-token notice.
- **A5** Inversions read as figures, never `/bass`.
- **A6** Suggestions use the key's accidentals in all 24 keys, with no
  non-diatonic degree-9 suggestion in minor.
- **A7** CI green on `main`: typecheck, tests with 5 `it.fails`, parity 0/200,
  baseline and fixture jobs clean.
- **A8** A tester guide and a feedback path that feeds #15 with no backend, with
  the privacy sentence still true.
- **A9** Explicitly **not** criteria: calibrated thresholds, latency on other
  hardware, any model.

## 5. Contradictions to fix

| Where | Claim | Fact |
|---|---|---|
| `README.md:27,31,81` | Tests are red, five fail | Five are `it.fails`; `npm test` is green |
| `README.md:29,46`, spec `:36` | Four layers | Six modules are listed |
| `src/main.ts:4`, `vite.config.ts:12` | Four modules | Nine TypeScript modules |
| `README.md:87`, `experiments/README.md:19,53`, `tools/requirements.txt:15` | A model lands in `readings.ts` | #17 has it beating `suggest.ts` (E0) |
| `CHANGELOG.md:43` | `suggest.ts` is deliberately unchanged | Changed in #11, recorded under Fixed |
| Spec `:66` | Highlights the chord where readings diverge | Not built |
| Spec `:74` | One threshold is provably unsettable | README and spike say neither can be calibrated |
| Spec `:86` | Parity 1/200, 7/200, 2/200 | 0/200 |
| Spec `:107` | No corpus, no training | CONTRIBUTING and #17 want both; scope was never formally reopened |
| Spec `:123` | Split by genre | #17 says song or artist |
| Spec `:127` | Chordonomicon reference numbers | #14 rules it out on licence |
| `src/chords.ts:32,105-108` | A generator check and a test | Neither exists |
| `src/confidence.ts:4-10` | `Am F C G` is ambiguous, `C F# Bb E` is uncertain | `Am F C G` is clear; the page's button `C F#m7b5 Bb E` is ambiguous |
| `experiments/confidence-thresholds.spike.md:63` | Two falsified tests | Five |
| `tools/requirements.txt:15` | Floored, not pinned | Neither |
| `CONTRIBUTING.md:5-13` | One corpus, decision deferred | #14 and #15 are different data; #17 records the decision as made |

## 6. Unmeasured constants

None of these is needed for the proof of concept.

| Constant | What would measure it |
|---|---|
| `AMBIGUITY_MARGIN`, `UNCERTAINTY_FLOOR` | Labelled progressions from real people (#15) |
| 17 suggestion weights | Accuracy on a real corpus (#17) |
| 500 ms announce delay | Testing with screen-reader users |
| Equal chord weighting | Comparison against duration-weighted material |
| Krumhansl-Schmuckler profile choice | Comparing profiles on labelled material |
| Latency, 27.6 ms p95 on one laptop | `tools/bench-latency.md` on other hardware |

## 7. Experiment track: what is still undefined

Dependency order. Nothing here runs as part of the proof of concept.

| # | Undefined | What settles it | Size |
|---|---|---|---|
| E0 | Two "model" ideas: `Reading.source: 'model'` versus next-chord beating `suggest.ts` | A recorded decision. Recommended: next-chord is the only planned model | XS |
| E1 | Mode-blind baseline (#12) | Fix, re-export, spike Resolution | S-M |
| E2 | 48 uncovered contexts (#13) | Add rules, or report accuracy split covered/uncovered | XS-S |
| E3 | ChoCo licence (#14) | Per-partition table against upstream terms, yes or no | ~10 h |
| E4 | Harte parser language | Recommended: Python in `tools/`, since the page never reads Harte | S-M |
| E5 | Key for each corpus sequence | Recommended: music21 `key.krumhansl`, with ChoCo tonality as a secondary column | S |
| E6 | Metric | Recommended: top-1 root accuracy against the baseline's top pick, hit@4 secondary | XS |
| E7 | Size budget | A spike with its threshold written first | 1 day |
| E8 | `split_by` | Recommended: song for leakage, with per-partition reporting | XS |
| E9 | `target` has no honest value | tiny-model-lab#36 | S |
| E10 | First-run cost | Follows E7: the size under which "no download" stays true | XS |
| E11 | The contract | `experiments/next-chord.yaml`, passing `python -m harness validate` | S |
| E12 | Runner and baseline scoring | Reads the committed fixture, never re-implements the rules | M |
| E13 | Ship path into the page | `suggest.ts` consumes a bundled table as a second source | M |
| E14 | Harness gaps | tiny-model-lab#36, #37, #38: none blocks starting, all bite before shipping | S each |

## 8. Issue state

| Issue | State | Action |
|---|---|---|
| #12 mode-blind rules | Open, P1 | Fix before testers see the page |
| #13 uncovered contexts | Open, decision | Experiment track (E2) |
| #14 licence audit | Open, P1 | Experiment track (E3) |
| #15 labelled corpus | Open | The feedback form becomes its collection path |
| #16 grammar | Open | Correct: the narrow override already shipped |
| #17 experiment plan | Open, P1 | Correct the override claim; add the E items |
| tiny-model-lab#19 | Open, stale | Comment, with the owner's approval |

Needed but untracked until now: hosting, example-button coverage, the `/bass`
numeral, minor-key spelling, the Harte parser, the contract, the size-budget
spike, first-run cost, and the "model" reconciliation.
