/**
 * A chord in, a small flat keyboard out. Pure string work, like `chords.ts`.
 *
 * Two halves, kept apart on purpose. `keyboardLayout` decides *which keys
 * exist and what each one means* — a model with no pixels in it, which is the
 * half worth testing. `keyboardSvg` turns that model into one SVG string, and
 * is the only place that knows about geometry.
 *
 * **Nothing here picks a colour.** Every shape gets a class and the page's
 * stylesheet fills it from `--kb-*` custom properties (`keyboard.css`), so the
 * same markup sits in the parser's light and dark palettes and in the room
 * without a branch. Colour is also never the only signal: the root carries a
 * solid pip and a slash bass a hollow one, so the diagram still reads in one
 * ink, and the `aria-label` spells the notes out for anyone not looking.
 *
 * **One number sizes it.** `height` is the height of the keys in CSS pixels;
 * the width follows from how many keys the window holds. The drawing itself
 * is unitless (a white key is 10 wide) and scales through the `viewBox`, so
 * there are no size variants to keep in step — only *detail tiers*, because a
 * pip that helps at 32 px is mud at 14.
 */

import type { Chord, PitchClass } from './chords.ts';
import { INTERVALS, LETTER_OFFSETS } from './chords.ts';

/**
 * What a key is doing. `idle` keys are just the keyboard.
 *
 * `tone`, `root` and `bass` describe one chord. `stay`, `leave` and `arrive`
 * describe the step from one chord to the next, and nothing in the shipped
 * pages produces them: they exist for the "what moves" mock in the explorer
 * (`src/explorer/moves.ts`), which is an open design question, not a feature.
 */
export type KeyRole = 'idle' | 'tone' | 'root' | 'bass' | 'stay' | 'leave' | 'arrive';

/**
 * How much of the keyboard to draw.
 *
 * - `octave`: always C to B, chord tones folded into it. Every diagram is the
 *   same width, so a column of them lines up, and the same key always means
 *   the same note. The cost is that the *shape* of the chord is lost: G7
 *   shows its F below its G. This is a map of pitch classes, not a voicing.
 * - `fit`: root position, stacked upward from the root, cropped to the
 *   nearest C or F below and E or B above — the only places a keyboard can be
 *   cut without slicing a black key. Shows the hand shape; width varies from
 *   7 to 14 white keys.
 */
export type KeyboardWindow = 'octave' | 'fit';

/**
 * - `fill`: sounding keys change colour. Reads fastest at small sizes.
 * - `dot`: keys stay neutral and each sounding key carries a dot. Quieter,
 *   and needs about 7 px of key width before the dots resolve.
 */
export type KeyboardMarks = 'fill' | 'dot';

/**
 * - `glyph`: keys only. For sitting in a line of text.
 * - `compact`: adds the root and bass pips.
 * - `full`: adds note names under the sounding keys.
 */
export type KeyboardDetail = 'glyph' | 'compact' | 'full';

export interface KeyboardKey {
  /** Semitones above the window's lowest C-octave origin. May be negative. */
  readonly semitone: number;
  readonly pc: PitchClass;
  readonly black: boolean;
  readonly role: KeyRole;
  /** Spelled the way the chord spells it (`Eb`, never `D#`, in Cm). */
  readonly name: string | null;
  /**
   * White keys: index among the window's white keys. Black keys: index of
   * the white key to their left.
   */
  readonly slot: number;
}

export interface KeyboardLayout {
  readonly keys: readonly KeyboardKey[];
  readonly whiteCount: number;
}

export interface KeyboardOptions {
  /** Height of the keys in CSS pixels. Default 32. */
  readonly height?: number;
  readonly window?: KeyboardWindow;
  readonly marks?: KeyboardMarks;
  /** `auto` picks a tier from the rendered key width. */
  readonly detail?: KeyboardDetail | 'auto';
}

const BLACK_PCS: ReadonlySet<number> = new Set([1, 3, 6, 8, 10]);
const LETTERS = 'CDEFGAB';
const NATURALS = [0, 2, 4, 5, 7, 9, 11] as const;

const mod12 = (n: number): number => ((n % 12) + 12) % 12;

/** A letter plus whatever accidental reaches `pc` from it. */
function spell(letter: number, pc: PitchClass): string {
  const alter = ((pc - NATURALS[letter] + 18) % 12) - 6;
  return LETTERS[letter] + (alter > 0 ? '♯'.repeat(alter) : '♭'.repeat(-alter));
}

/** One sounding note: where it is, what it is doing, how it is spelled. */
export interface Sounding {
  readonly semitone: number;
  readonly role: Exclude<KeyRole, 'idle'>;
  readonly name: string;
}

/**
 * The notes of the chord as semitones above the C below the root.
 *
 * Root position, stacked upward. A slash bass goes *under* the root, and if
 * it is already a chord tone that tone moves down rather than sounding twice:
 * `C/E` is E-C-G, the first inversion a pianist would actually play.
 * (`pitchClasses()` in `chords.ts` counts some basses twice to match music21.
 * That is about scoring keys; this is about fingers, so it is not reused.)
 */
export function chordTones(chord: Chord): Sounding[] {
  const offsets = LETTER_OFFSETS[chord.quality];
  const out: Sounding[] = INTERVALS[chord.quality].map((interval, i) => ({
    semitone: chord.root + interval,
    role: i === 0 ? 'root' : 'tone',
    name: spell((chord.rootLetter + offsets[i]) % 7, mod12(chord.root + interval)),
  }));
  if (chord.bass === chord.root) return out;
  const below = chord.root - mod12(chord.root - chord.bass);
  return [
    {
      semitone: below,
      role: 'bass',
      name: spell(chord.bassLetter, chord.bass),
    },
    ...out.filter((s) => mod12(s.semitone) !== chord.bass),
  ];
}

function buildKeys(
  marks: ReadonlyMap<number, Sounding>,
  first: number,
  last: number,
): KeyboardLayout {
  const keys: KeyboardKey[] = [];
  let whiteCount = 0;
  for (let semitone = first; semitone <= last; semitone += 1) {
    const pc = mod12(semitone);
    const black = BLACK_PCS.has(pc);
    const s = marks.get(semitone);
    keys.push({
      semitone,
      pc,
      black,
      role: s?.role ?? 'idle',
      name: s?.name ?? null,
      slot: black ? whiteCount - 1 : whiteCount,
    });
    if (!black) whiteCount += 1;
  }
  return { keys, whiteCount };
}

/**
 * The smallest clean stretch of keyboard that holds every note in `notes`.
 *
 * Cropped to the nearest C or F below and E or B above: C and F have no black
 * key on their left, E and B none on their right, so those are the only
 * places a keyboard can be cut without slicing a black key in half.
 */
export function keyboardRange(notes: readonly Sounding[]): KeyboardLayout {
  const marks = new Map(notes.map((s) => [s.semitone, s]));
  let first = Math.min(...marks.keys());
  while (mod12(first) !== 0 && mod12(first) !== 5) first -= 1;
  let last = Math.max(...marks.keys());
  while (mod12(last) !== 4 && mod12(last) !== 11) last += 1;
  return buildKeys(marks, first, last);
}

/** Which keys to draw for `chord`, and what each one is doing. */
export function keyboardLayout(
  chord: Chord,
  window: KeyboardWindow = 'octave',
): KeyboardLayout {
  const tones = chordTones(chord);
  if (window === 'fit') return keyboardRange(tones);
  return buildKeys(new Map(tones.map((s) => [mod12(s.semitone), s])), 0, 11);
}

// The drawing's own units. A white key is 10 wide; everything else is a
// proportion of that, so changing one number rescales the lot.
const W = 10;
const H = 32;
const GAP = 1;
const BLACK_W = 6;
const BLACK_H = 19;
const RADIUS = 1.4;
const LABEL_H = 9;

/** Below this many CSS pixels of key width, pips stop resolving. */
export const COMPACT_MIN_KEY_PX = 6;
/** Below this, a note name under a key is smaller than about 8 px. */
export const FULL_MIN_KEY_PX = 15;

/** The tier `detail: 'auto'` picks for keys `height` pixels tall. */
export function detailFor(height: number): KeyboardDetail {
  const keyPx = (height / H) * W;
  if (keyPx >= FULL_MIN_KEY_PX) return 'full';
  return keyPx >= COMPACT_MIN_KEY_PX ? 'compact' : 'glyph';
}

const n = (value: number): string => String(Math.round(value * 100) / 100);

function escapeAttribute(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
}

/**
 * A white key with a notch cut for each black key beside it.
 *
 * The notch is what lets the background show between a white key and its
 * black neighbour. Drawing black keys over plain rectangles would need a
 * stroke in the page's background colour to separate two sounding keys, and
 * this file does not know the page's background colour.
 */
function whitePath(slot: number, count: number, notchLeft: boolean, notchRight: boolean): string {
  const x0 = slot === 0 ? 0 : slot * W + GAP / 2;
  const x1 = slot === count - 1 ? count * W : (slot + 1) * W - GAP / 2;
  const left = notchLeft ? slot * W + BLACK_W / 2 + GAP : x0;
  const right = notchRight ? (slot + 1) * W - BLACK_W / 2 - GAP : x1;
  const notchY = BLACK_H + GAP;
  return [
    `M${n(left)} 0H${n(right)}`,
    notchRight ? `V${n(notchY)}H${n(x1)}` : '',
    `V${n(H - RADIUS)}Q${n(x1)} ${H} ${n(x1 - RADIUS)} ${H}`,
    `H${n(x0 + RADIUS)}Q${n(x0)} ${H} ${n(x0)} ${n(H - RADIUS)}`,
    notchLeft ? `V${n(notchY)}H${n(left)}` : '',
    'Z',
  ].join('');
}

function blackPath(slot: number): string {
  const x0 = (slot + 1) * W - BLACK_W / 2;
  const x1 = x0 + BLACK_W;
  const r = RADIUS * 0.8;
  return (
    `M${n(x0)} 0H${n(x1)}V${n(BLACK_H - r)}Q${n(x1)} ${BLACK_H} ${n(x1 - r)} ${BLACK_H}` +
    `H${n(x0 + r)}Q${n(x0)} ${BLACK_H} ${n(x0)} ${n(BLACK_H - r)}Z`
  );
}

/** Roles that get a pip: solid for where the hand lands, hollow for where it was. */
const PIP: Readonly<Partial<Record<KeyRole, 'solid' | 'hollow'>>> = {
  root: 'solid',
  bass: 'hollow',
  arrive: 'solid',
  leave: 'hollow',
};

/**
 * Any layout as an inline SVG string. `keyboardSvg` is this plus a chord.
 *
 * Safe to assign to `innerHTML`: the label and the note names are the only
 * text that comes from outside, and both are escaped.
 */
export function layoutSvg(
  layout: KeyboardLayout,
  label: string,
  options: Omit<KeyboardOptions, 'window'> = {},
): string {
  const height = options.height ?? 32;
  const marks = options.marks ?? 'fill';
  const detail =
    options.detail === undefined || options.detail === 'auto'
      ? detailFor(height)
      : options.detail;
  const { keys, whiteCount } = layout;

  const blackSlots = new Set(keys.filter((k) => k.black).map((k) => k.slot));
  const whites: string[] = [];
  const blacks: string[] = [];
  const pips: string[] = [];
  const labels: string[] = [];

  for (const key of keys) {
    const state = key.role === 'idle' ? '' : ` is-${key.role}`;
    if (key.black) {
      blacks.push(`<path class="kb-key kb-black${state}" d="${blackPath(key.slot)}"/>`);
    } else {
      const d = whitePath(key.slot, whiteCount, blackSlots.has(key.slot - 1), blackSlots.has(key.slot));
      whites.push(`<path class="kb-key kb-white${state}" d="${d}"/>`);
    }
    if (key.role === 'idle') continue;

    const cx = key.black ? (key.slot + 1) * W : key.slot * W + W / 2;
    // `fill` marks the keys themselves, so only some roles need a pip on top.
    const pip = PIP[key.role];
    if (detail !== 'glyph' && (marks === 'dot' || pip !== undefined)) {
      const cy = key.black ? BLACK_H - 4.2 : H - 5.5;
      const big = pip !== undefined;
      const r = key.black ? (big ? 1.9 : 1.4) : big ? 2.2 : 1.6;
      const on = key.black ? 'on-black' : 'on-white';
      const shape = pip === 'hollow' ? ' is-hollow' : '';
      pips.push(`<circle class="kb-pip ${on}${state}${shape}" cx="${n(cx)}" cy="${n(cy)}" r="${r}"/>`);
    }
    if (detail === 'full' && key.name !== null) {
      labels.push(
        `<text class="kb-label${state}" x="${n(cx)}" y="${H + LABEL_H - 2}">${escapeAttribute(key.name)}</text>`,
      );
    }
  }

  const viewW = whiteCount * W;
  const viewH = detail === 'full' ? H + LABEL_H : H;
  const scale = height / H;

  return (
    `<svg class="kb" data-marks="${marks}" data-detail="${detail}" role="img" aria-label="${escapeAttribute(label)}" ` +
    `viewBox="0 0 ${viewW} ${viewH}" width="${n(viewW * scale)}" height="${n(viewH * scale)}">` +
    whites.join('') +
    blacks.join('') +
    pips.join('') +
    labels.join('') +
    '</svg>'
  );
}

/** One chord as an inline SVG string. */
export function keyboardSvg(chord: Chord, options: KeyboardOptions = {}): string {
  const layout = keyboardLayout(chord, options.window ?? 'octave');
  const names = layout.keys.filter((k) => k.name !== null).map((k) => k.name);
  return layoutSvg(layout, `${chord.symbol} on a keyboard: ${names.join(', ')}`, options);
}
