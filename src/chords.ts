/**
 * Chord symbols in, `{root, quality, bass}` out. Pure string work.
 *
 * There is no music theory in this file on purpose. It does not know what a
 * key is, it cannot tell you a chord is a dominant, and it will happily parse
 * `B#aug/Fb`. Everything that reasons about harmony reads the struct this
 * produces, so the parser can stay small enough to be obviously right and the
 * theory can stay in one place.
 *
 * Pitch classes are integers 0-11 with C = 0, and that is what every consumer
 * downstream compares. Spelling is *almost* discarded: `Bb` and `A#` both
 * become 10, but the letter and accidental are kept alongside, because one
 * thing genuinely depends on them.
 *
 * That thing is the slash bass. music21 appends the bass as an extra pitch
 * unless its **exact spelled name** already appears among the chord tones —
 * so `C/E` is three pitches and `C/E-` is four, and `Cdim/G-` is three while
 * `Cdim/F#` is four even though G-flat and F-sharp are the same pitch class.
 * A port comparing pitch classes cannot tell those apart, counts one pitch
 * where music21 counts two, and lands on a different key. See
 * `experiments/slash-bass-spelling.spike.md` for how that was found.
 *
 * So spelling survives as far as `pitchClasses()` and no further. Everything
 * above this file still sees integers.
 */

/** A pitch class: 0 = C, 1 = C#/Db, ... 11 = B. */
export type PitchClass = number;

/**
 * The quality vocabulary. Every member is checked against
 * `music21.harmony.ChordSymbol` by `tools/generate-fixtures.py`, which will
 * not build a fixture for a quality music21 spells differently. Adding one
 * here without adding it there is how the oracle silently stops covering it.
 */
export type Quality =
  | 'maj'
  | 'min'
  | 'dim'
  | 'aug'
  | 'sus2'
  | 'sus4'
  | 'dom7'
  | 'maj7'
  | 'min7'
  | 'min7b5'
  | 'dim7'
  | 'maj6'
  | 'min6'
  | 'add9'
  | 'dom9'
  | 'min9'
  | 'dom7sus4';

export interface Chord {
  /** The symbol exactly as it was typed. Never normalized; the UI echoes it. */
  readonly symbol: string;
  readonly root: PitchClass;
  readonly quality: Quality;
  /** The root again unless a slash named something else. */
  readonly bass: PitchClass;
  /** Index into `C D E F G A B`. Spells the chord tones; see `pitchClasses`. */
  readonly rootLetter: LetterIndex;
  /** Index into `C D E F G A B` for the bass, the root's letter if no slash. */
  readonly bassLetter: LetterIndex;
  /** Semitones the bass accidental shifts its letter: -2 to 2, 0 for natural. */
  readonly bassAlter: number;
}

/** 0 = C, 1 = D, ... 6 = B. Letters, not pitch classes: E and Eb share one. */
export type LetterIndex = number;

const LETTER_ORDER = 'CDEFGAB';

/** Semitones above the root for each quality. */
const INTERVALS: Readonly<Record<Quality, readonly number[]>> = {
  maj: [0, 4, 7],
  min: [0, 3, 7],
  dim: [0, 3, 6],
  aug: [0, 4, 8],
  sus2: [0, 2, 7],
  sus4: [0, 5, 7],
  dom7: [0, 4, 7, 10],
  maj7: [0, 4, 7, 11],
  min7: [0, 3, 7, 10],
  min7b5: [0, 3, 6, 10],
  dim7: [0, 3, 6, 9],
  maj6: [0, 4, 7, 9],
  min6: [0, 3, 7, 9],
  add9: [0, 2, 4, 7],
  dom9: [0, 2, 4, 7, 10],
  min9: [0, 2, 3, 7, 10],
  dom7sus4: [0, 5, 7, 10],
};

/**
 * Letter steps above the root letter, parallel to `INTERVALS`.
 *
 * What spells each chord tone. A minor third is two letters up (C to E-flat),
 * a diminished seventh is six (C to B-double-flat) — the letter follows the
 * *degree*, never the semitone count, which is why a table is needed and
 * arithmetic on `INTERVALS` will not do.
 *
 * Read out of music21 rather than derived by hand, and verified stable across
 * all twelve roots for every quality here. `tools/generate-fixtures.py`
 * already refuses to build a fixture for a quality music21 spells
 * differently; this table is the same contract one level down, and
 * `test/chords.test.ts` pins that it stays the same length as `INTERVALS`.
 */
const LETTER_OFFSETS: Readonly<Record<Quality, readonly number[]>> = {
  maj: [0, 2, 4],
  min: [0, 2, 4],
  dim: [0, 2, 4],
  aug: [0, 2, 4],
  sus2: [0, 1, 4],
  sus4: [0, 3, 4],
  dom7: [0, 2, 4, 6],
  maj7: [0, 2, 4, 6],
  min7: [0, 2, 4, 6],
  min7b5: [0, 2, 4, 6],
  dim7: [0, 2, 4, 6],
  maj6: [0, 2, 4, 5],
  min6: [0, 2, 4, 5],
  add9: [0, 1, 2, 4],
  dom9: [0, 1, 2, 4, 6],
  min9: [0, 1, 2, 4, 6],
  dom7sus4: [0, 3, 4, 6],
};

const LETTERS: Readonly<Record<string, PitchClass>> = {
  C: 0,
  D: 2,
  E: 4,
  F: 5,
  G: 7,
  A: 9,
  B: 11,
};

/**
 * Suffix to quality, longest match first.
 *
 * Order matters and the sort below enforces it: `m7b5` must be tried before
 * `m7`, and `maj7` before `maj`, or `Cmaj7` parses as C major with a stray
 * `7`. Sorting by length is the cheap way to never have to think about it
 * again.
 */
const SUFFIXES: Readonly<Record<string, Quality>> = {
  '': 'maj',
  M: 'maj',
  maj: 'maj',
  major: 'maj',
  m: 'min',
  min: 'min',
  minor: 'min',
  '-': 'min',
  dim: 'dim',
  o: 'dim',
  '°': 'dim',
  aug: 'aug',
  '+': 'aug',
  sus2: 'sus2',
  sus: 'sus4',
  sus4: 'sus4',
  '7': 'dom7',
  dom7: 'dom7',
  maj7: 'maj7',
  M7: 'maj7',
  'Δ7': 'maj7',
  Δ: 'maj7',
  m7: 'min7',
  min7: 'min7',
  '-7': 'min7',
  m7b5: 'min7b5',
  'm7-5': 'min7b5',
  ø: 'min7b5',
  ø7: 'min7b5',
  dim7: 'dim7',
  o7: 'dim7',
  '°7': 'dim7',
  '6': 'maj6',
  m6: 'min6',
  min6: 'min6',
  add9: 'add9',
  '9': 'dom9',
  m9: 'min9',
  min9: 'min9',
  '7sus4': 'dom7sus4',
  '7sus': 'dom7sus4',
};

const SUFFIX_KEYS: readonly string[] = Object.keys(SUFFIXES).sort(
  (a, b) => b.length - a.length,
);

/**
 * Read a root letter plus its accidentals off the front of `text`.
 *
 * Returns the letter and the accidental separately as well as the pitch
 * class, because `pitchClasses` has to compare a bass against chord tones by
 * spelling and cannot recover `F#` from `6`.
 */
function readRoot(
  text: string,
): { pc: PitchClass; letter: LetterIndex; alter: number; rest: string } | null {
  const letter = text[0]?.toUpperCase();
  if (letter === undefined || !(letter in LETTERS)) return null;
  let alter = 0;
  let i = 1;
  // `-` is music21's flat and people paste it in from music21 output, so it
  // is accepted on input even though nothing here ever writes it.
  while (i < text.length && '#b-♯♭'.includes(text[i])) {
    alter += text[i] === '#' || text[i] === '♯' ? 1 : -1;
    i += 1;
  }
  return {
    pc: (((LETTERS[letter] + alter) % 12) + 12) % 12,
    letter: LETTER_ORDER.indexOf(letter),
    alter,
    rest: text.slice(i),
  };
}

/**
 * Parse one chord symbol. Returns `null` for anything unrecognised — the UI
 * needs to say *which* token it could not read, so throwing would lose the
 * one piece of information the person typing wants back.
 */
export function parseChord(symbol: string): Chord | null {
  const trimmed = symbol.trim();
  if (trimmed === '') return null;

  const [body, slash, ...extra] = trimmed.split('/');
  if (extra.length > 0) return null;

  const root = readRoot(body);
  if (root === null) return null;

  const suffix = SUFFIX_KEYS.find((key) => key === root.rest);
  if (suffix === undefined) return null;

  let bass = root;
  if (slash !== undefined) {
    const bassRoot = readRoot(slash);
    if (bassRoot === null || bassRoot.rest !== '') return null;
    bass = bassRoot;
  }

  return {
    symbol: trimmed,
    root: root.pc,
    quality: SUFFIXES[suffix],
    bass: bass.pc,
    rootLetter: root.letter,
    bassLetter: bass.letter,
    bassAlter: bass.alter,
  };
}

/**
 * The pitch classes a chord sounds, sorted. **A multiset, not a set.**
 *
 * One pitch class can appear twice, and that is the whole point. music21
 * builds the chord's tones and then *appends* the slash bass as a further
 * pitch unless its exact spelled name is already among them:
 *
 * ```
 * C/E        E  G  C            3 pitches, bass is a chord tone
 * C/D     D  C  E  G            4, D is not
 * C/E-    E- C  E  G            4, E-flat is not E
 * Cdim/G-    G- C  E-           3, G-flat IS the diminished fifth
 * Cdim/F# F# C  E- G-           4, and pitch class 6 twice
 * ```
 *
 * The last two are the same four semitones and get different answers, so
 * comparing pitch classes cannot work — the comparison has to be on spelling.
 * `readings.ts` counts these into a distribution, so a duplicate genuinely
 * weights that pitch class twice, which is what moved the key on the one
 * progression in the fixture that used to disagree.
 *
 * This is music21's behaviour rather than a claim about music: double-counting
 * G-flat because somebody typed F-sharp is a spelling artifact. Matching it is
 * a deliberate choice to keep the oracle meaningful, argued in
 * `experiments/slash-bass-spelling.spike.md`.
 */
export function pitchClasses(chord: Chord): PitchClass[] {
  const intervals = INTERVALS[chord.quality];
  const offsets = LETTER_OFFSETS[chord.quality];
  const out = intervals.map((i) => (chord.root + i) % 12);

  // How the chord tone on the bass's letter is spelled, if there is one. The
  // accidental is the gap between the pitch the tone actually sounds and the
  // natural note its letter names.
  const spelledOnBassLetter = offsets.findIndex(
    (o) => (chord.rootLetter + o) % 7 === chord.bassLetter,
  );
  if (spelledOnBassLetter === -1) {
    out.push(chord.bass);
  } else {
    const natural = LETTERS[LETTER_ORDER[chord.bassLetter]];
    const alter = (((out[spelledOnBassLetter] - natural + 18) % 12) - 6);
    if (alter !== chord.bassAlter) out.push(chord.bass);
  }

  return out.sort((a, b) => a - b);
}

export interface ParsedProgression {
  readonly chords: Chord[];
  /** Tokens that did not parse, in the order they were typed. */
  readonly unparsed: string[];
}

/** Split on whitespace, commas, pipes and bar lines, then parse each token. */
export function parseProgression(text: string): ParsedProgression {
  const tokens = text.split(/[\s,|]+/).filter((t) => t !== '');
  const chords: Chord[] = [];
  const unparsed: string[] = [];
  for (const token of tokens) {
    const chord = parseChord(token);
    if (chord === null) unparsed.push(token);
    else chords.push(chord);
  }
  return { chords, unparsed };
}
