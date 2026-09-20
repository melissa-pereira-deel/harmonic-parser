/**
 * Chord symbols in, `{root, quality, bass}` out. Pure string work.
 *
 * There is no music theory in this file on purpose. It does not know what a
 * key is, it cannot tell you a chord is a dominant, and it will happily parse
 * `B#aug/Fb`. Everything that reasons about harmony reads the struct this
 * produces, so the parser can stay small enough to be obviously right and the
 * theory can stay in one place.
 *
 * Pitch classes are integers 0-11 with C = 0. Spelling is discarded here —
 * `Bb` and `A#` both become 10 — because every consumer downstream compares
 * pitch classes. Spelling comes back at the display edge, in `keyName()`.
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
}

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

/** Read a root letter plus its accidentals off the front of `text`. */
function readRoot(text: string): { pc: PitchClass; rest: string } | null {
  const letter = text[0]?.toUpperCase();
  if (letter === undefined || !(letter in LETTERS)) return null;
  let pc = LETTERS[letter];
  let i = 1;
  // `-` is music21's flat and people paste it in from music21 output, so it
  // is accepted on input even though nothing here ever writes it.
  while (i < text.length && '#b-♯♭'.includes(text[i])) {
    pc += text[i] === '#' || text[i] === '♯' ? 1 : -1;
    i += 1;
  }
  return { pc: ((pc % 12) + 12) % 12, rest: text.slice(i) };
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

  let bass = root.pc;
  if (slash !== undefined) {
    const bassRoot = readRoot(slash);
    if (bassRoot === null || bassRoot.rest !== '') return null;
    bass = bassRoot.pc;
  }

  return { symbol: trimmed, root: root.pc, quality: SUFFIXES[suffix], bass };
}

/**
 * The pitch classes a chord sounds, deduplicated and sorted.
 *
 * A slash bass is added rather than substituted, which is what
 * `music21.harmony.ChordSymbol` does: `C/E` is still three pitch classes,
 * `C/D` is four. Getting this wrong is invisible on `C/E` and shifts every
 * key score on `C/D`, so it is pinned by the parity fixture.
 */
export function pitchClasses(chord: Chord): PitchClass[] {
  const set = new Set<PitchClass>(
    INTERVALS[chord.quality].map((i) => (chord.root + i) % 12),
  );
  set.add(chord.bass);
  return [...set].sort((a, b) => a - b);
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
