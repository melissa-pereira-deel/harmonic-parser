#!/usr/bin/env python3
"""Generate the parity fixture: 200 progressions ranked by music21.

Dev-only. music21 is never bundled, never imported by anything under `src/`,
and is not a dependency of the page — it is the oracle the TypeScript port is
measured against, and it lives here so that `test/parity.test.ts` has
something to disagree with.

Run it:

    pip install -r tools/requirements.txt
    python tools/generate-fixtures.py

It rewrites `fixtures/music21-rankings.json` in place. The output is a pure
function of `SEED` and the pinned music21 version, so a regeneration that
changes the file is a real change: CI regenerates and then asserts the tree is
clean.

The 200 progressions are built from the seed *inside this script* rather than
read from a list beside it. One file reproduces the fixture; a list that could
drift from the fixture that was generated from it is the same defect as an
unsourced number in a contract.

**The music21 gotcha.** music21 spells a flat root `B-`, not `Bb`. `Bb` parses
as B natural followed by a quality abbreviation it does not recognise, which
raises rather than silently mis-reading — but only because `b` alone is not a
quality. Accidentals *inside* a quality are fine: `m7b5` is `m7b5` in both
spellings. `to_music21()` below bridges exactly the root, and the fixture
stores the display spelling, because nobody types `B-` into a chord box.
"""

from __future__ import annotations

import json
import random
import sys
from pathlib import Path

from music21 import harmony, stream

# Bumping this regenerates every case. It is here rather than on the command
# line so that the fixture cannot be produced from an unrecorded seed.
SEED = 20260920
COUNT = 200

FIXTURE = Path(__file__).resolve().parent.parent / "fixtures" / "music21-rankings.json"

# The processor named in src/keyprofiles.ts. music21 ships five weightings
# with different documented biases; changing this without changing that file
# is what the parity test is for.
PROCESSOR = "key.krumhansl"

# Spellings music21 accepts for every quality in the vocabulary, checked as
# a cross product before this script was written. D# and A# are avoided in
# favour of Eb and Bb: spelling does not change a pitch class, and these are
# the ones a chord box gets typed with.
SHARP_NAMES = ["C", "C#", "D", "Eb", "E", "F", "F#", "G", "Ab", "A", "Bb", "B"]
FLAT_NAMES = ["C", "Db", "D", "Eb", "E", "F", "Gb", "G", "Ab", "A", "Bb", "B"]
FLAT_KEY_TONICS = {1, 3, 5, 8, 10}

# Display suffix -> the pitch classes src/chords.ts builds for it. Kept here so
# a quality added to one side and not the other fails loudly at generation
# time rather than quietly narrowing what the oracle covers.
QUALITIES = {
    "": (0, 4, 7),
    "m": (0, 3, 7),
    "dim": (0, 3, 6),
    "aug": (0, 4, 8),
    "sus2": (0, 2, 7),
    "sus4": (0, 5, 7),
    "7": (0, 4, 7, 10),
    "maj7": (0, 4, 7, 11),
    "m7": (0, 3, 7, 10),
    "m7b5": (0, 3, 6, 10),
    "dim7": (0, 3, 6, 9),
    "6": (0, 4, 7, 9),
    "m6": (0, 3, 7, 9),
    "add9": (0, 2, 4, 7),
    "9": (0, 2, 4, 7, 10),
    "m9": (0, 2, 3, 7, 10),
    "7sus4": (0, 5, 7, 10),
}

MAJOR_DEGREES = [(0, ""), (2, "m"), (4, "m"), (5, ""), (7, ""), (9, "m"), (11, "dim")]
MINOR_DEGREES = [(0, "m"), (2, "dim"), (3, ""), (5, "m"), (7, "m"), (8, ""), (10, "")]

# Sevenths a degree is commonly dressed in. Applied at a fixed rate so the
# fixture exercises the four- and five-note qualities without becoming a jazz
# corpus.
SEVENTHS = {"": ["maj7", "6", "add9", "7"], "m": ["m7", "m6", "m9"], "dim": ["m7b5", "dim7"]}


def use_utf8_stdout() -> None:
    """Say what encoding this program's output is in, rather than inheriting.

    The same reasoning as `harness/__main__.py` in tiny-model-lab: Python
    falls back to the locale encoding, this script prints an em dash, and a
    Windows CI leg under cp1252 is where that gets discovered. Only programs
    call this; a library that reconfigures its caller's stdout has overstepped.
    """
    for handle in (sys.stdout, sys.stderr):
        try:
            handle.reconfigure(encoding="utf-8", errors="replace")
        except (AttributeError, ValueError, OSError):
            pass  # Not a real stream, or already wrapped. Nothing to do.


def to_music21(symbol: str) -> str:
    """Bridge the display spelling to music21's. Root accidentals only."""
    head, _, bass = symbol.partition("/")
    converted = _flatten_root(head)
    if bass:
        converted += "/" + _flatten_root(bass)
    return converted


def _flatten_root(text: str) -> str:
    if len(text) > 1 and text[1] == "b":
        return text[0] + "-" + text[2:]
    return text


def build_progressions(rng: random.Random) -> list[list[str]]:
    """COUNT progressions: mostly tonal, one in ten deliberately not."""
    progressions: list[list[str]] = []
    while len(progressions) < COUNT:
        if rng.random() < 0.1:
            progressions.append(_atonal(rng))
        else:
            progressions.append(_tonal(rng))
    return progressions


def _names_for(tonic: int) -> list[str]:
    return FLAT_NAMES if tonic in FLAT_KEY_TONICS else SHARP_NAMES


def _tonal(rng: random.Random) -> list[str]:
    tonic = rng.randrange(12)
    degrees = MAJOR_DEGREES if rng.random() < 0.6 else MINOR_DEGREES
    names = _names_for(tonic)
    chords: list[str] = []
    for _ in range(rng.randint(3, 6)):
        semitones, quality = rng.choice(degrees)
        if rng.random() < 0.3 and quality in SEVENTHS:
            quality = rng.choice(SEVENTHS[quality])
        if rng.random() < 0.08:
            # A borrowed chord, so the fixture covers chromatic degrees.
            semitones = rng.choice([1, 3, 6, 8, 10])
            quality = rng.choice(["", "7", "m"])
        symbol = names[(tonic + semitones) % 12] + quality
        if rng.random() < 0.12:
            symbol += "/" + names[(tonic + rng.randrange(12)) % 12]
        chords.append(symbol)
    return chords


def _atonal(rng: random.Random) -> list[str]:
    """Random roots and qualities. These are what 'uncertain' has to catch."""
    names = SHARP_NAMES
    qualities = sorted(QUALITIES)
    return [
        names[rng.randrange(12)] + rng.choice(qualities)
        for _ in range(rng.randint(3, 6))
    ]


def rank_with_music21(progression: list[str]) -> list[tuple[str, float]]:
    """All 24 keys with their correlation coefficients, best first."""
    score = stream.Stream()
    for symbol in progression:
        chord = harmony.ChordSymbol(to_music21(symbol))
        # Equal duration per chord. Pearson correlation is invariant to a
        # positive scaling of the distribution, so the value is arbitrary as
        # long as it is the same for every chord — which is the same
        # assumption src/readings.ts makes by counting each chord once.
        chord.quarterLength = 4.0
        score.append(chord)
    best = score.analyze(PROCESSOR)
    ordered = [best, *best.alternateInterpretations]
    return [(_display_key(k), round(k.correlationCoefficient, 6)) for k in ordered]


def _display_key(key) -> str:  # noqa: ANN001 - music21.key.Key, not imported for one hint
    return f"{key.tonic.name.replace('-', 'b')} {key.mode}"


def check_spelling_is_stable(rankings: list[list[tuple[str, float]]]) -> None:
    """music21 respells a key after choosing it, and the results are asymmetric
    (`Ab major` but `G# minor`). src/keyprofiles.ts hard-codes that table. If
    music21 ever spells one differently for a different input, the fixture
    would carry two names for one key and the parity test would compare
    different things while looking green. Refuse to write in that case.
    """
    seen: dict[tuple[int, str], str] = {}
    for ranking in rankings:
        for name, _ in ranking:
            tonic, mode = name.rsplit(" ", 1)
            identity = (_pitch_class_of(tonic), mode)
            if identity in seen and seen[identity] != name:
                raise SystemExit(
                    f"music21 spelled the same key two ways: {seen[identity]!r} and "
                    f"{name!r}. src/keyprofiles.ts cannot hold both; fix the table "
                    "before regenerating."
                )
            seen[identity] = name
    if len(seen) != 24:
        raise SystemExit(f"expected 24 distinct keys across the fixture, saw {len(seen)}")


_LETTERS = {"C": 0, "D": 2, "E": 4, "F": 5, "G": 7, "A": 9, "B": 11}


def _pitch_class_of(tonic: str) -> int:
    value = _LETTERS[tonic[0]]
    for accidental in tonic[1:]:
        value += 1 if accidental == "#" else -1
    return value % 12


def render(cases: list[dict[str, object]], version: str) -> str:
    """One case per line, so a diff shows which progressions moved.

    `json.dumps` on the whole structure with `indent=2` would be 5000 lines
    for the same data and every regeneration would be unreadable in review.
    """
    head = {
        "generator": "tools/generate-fixtures.py",
        "oracle": f"music21 {version}, analysis.discrete.KrumhanslSchmuckler",
        "processor": PROCESSOR,
        "seed": SEED,
        "count": len(cases),
        "note": (
            "Ranking is every key by Pearson correlation between the pitch-class "
            "distribution and the rotated profile, which is what music21 reports as "
            "Key.correlationCoefficient. Scores are rounded to 6 decimal places."
        ),
    }
    lines = ["{"]
    for key, value in head.items():
        lines.append(f"  {json.dumps(key)}: {json.dumps(value)},")
    lines.append('  "cases": [')
    for i, case in enumerate(cases):
        comma = "," if i < len(cases) - 1 else ""
        lines.append("    " + json.dumps(case, separators=(", ", ": ")) + comma)
    lines.append("  ]")
    lines.append("}")
    return "\n".join(lines) + "\n"


def main() -> int:
    use_utf8_stdout()
    import music21  # noqa: PLC0415 - imported here only for its version string

    rng = random.Random(SEED)
    progressions = build_progressions(rng)
    rankings = [rank_with_music21(p) for p in progressions]
    check_spelling_is_stable(rankings)

    cases = [
        {
            "progression": progression,
            "ranking": [name for name, _ in ranking],
            "scores": [score for _, score in ranking],
        }
        for progression, ranking in zip(progressions, rankings)
    ]
    FIXTURE.parent.mkdir(parents=True, exist_ok=True)
    FIXTURE.write_text(render(cases, music21.__version__), encoding="utf-8", newline="\n")
    print(f"wrote {FIXTURE.relative_to(Path.cwd())} — {len(cases)} progressions, seed {SEED}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
