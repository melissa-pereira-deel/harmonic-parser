/**
 * "What moves": the next chord drawn as a change from the hand, not as a
 * chord of its own. A mock for the explorer, and deliberately not in `src/`
 * proper — the room has not decided to do this.
 *
 * **The big assumption.** The room would use the notes actually held. This
 * mock has no keyboard, so it pretends the current chord is held in root
 * position, and that is the first thing a real version would replace.
 *
 * **A slash bass is its own voice.** The chord's tones are the hand; a slash
 * bass sits under them as a separate low note, the way a left hand would play
 * it. So `C` to `C/E` keeps the whole hand and adds an E in the bass, rather
 * than reading as no change at all.
 *
 * **The voicing rule is the simplest one that could work.** Each note of the
 * next chord goes to whichever octave puts it closest to the middle of the
 * hand. It is not voice leading in any taught sense: it does not pair old
 * notes with new ones or avoid crossings, and an exact tritone tie goes to the
 * lower octave, so `Csus2` to `Am` moves 8 semitones where 4 would do. A
 * smallest-total-motion matching is the obvious replacement, and is left for a
 * spike. On common pairs (C to Am, Dm7 to G7) it already finds the textbook
 * smallest move.
 */

import type { Chord } from '../chords.ts';
import type { KeyboardLayout, Sounding } from '../keyboard.ts';
import { chordTones, keyboardRange } from '../keyboard.ts';

export interface Moves {
  readonly layout: KeyboardLayout;
  readonly stay: readonly string[];
  readonly leave: readonly string[];
  readonly arrive: readonly string[];
  /** One sentence saying the same thing as the drawing. */
  readonly sentence: string;
}

/** A note in the mock, plus whether it is the separate bass voice. */
interface Voice extends Sounding {
  readonly low: boolean;
}

const list = (names: readonly string[]): string => names.join(', ');
const mod12 = (n: number): number => ((n % 12) + 12) % 12;

/** The chord's own tones, root position, without any slash. */
function hand(chord: Chord): Sounding[] {
  return chordTones({ ...chord, bass: chord.root });
}

/**
 * The highest `pc` strictly under `ceiling`, dropped by octaves while that
 * brings it closer to `near` (the bass already held, if there is one).
 */
function bassUnder(pc: number, ceiling: number, near: number | null): number {
  let semitone = ceiling - 1;
  while (mod12(semitone) !== pc) semitone -= 1;
  if (near === null) return semitone;
  while (Math.abs(semitone - 12 - near) < Math.abs(semitone - near)) semitone -= 12;
  return semitone;
}

function bassVoice(chord: Chord, ceiling: number, near: number | null): Voice | null {
  if (chord.bass === chord.root) return null;
  const slash = chordTones(chord).find((s) => s.role === 'bass');
  if (slash === undefined) return null;
  return { ...slash, semitone: bassUnder(chord.bass, ceiling, near), low: true };
}

function sentenceFor(stay: readonly string[], leave: readonly string[], arrive: readonly string[]): string {
  if (leave.length === 0 && arrive.length === 0) return `Nothing changes. Keep ${list(stay)}.`;
  const keep = stay.length > 0 ? `Keep ${list(stay)}. ` : 'Nothing stays. ';
  if (leave.length === 0) return `${keep}Add ${list(arrive)}.`;
  if (arrive.length === 0) return `${keep}Let go of ${list(leave)}.`;
  return `${keep}Let go of ${list(leave)} and play ${list(arrive)}.`;
}

export function movesBetween(from: Chord, to: Chord): Moves {
  // An octave up, so the next chord has room to land below the hand.
  const heldHand: Voice[] = hand(from).map((s) => ({ ...s, semitone: s.semitone + 12, low: false }));
  const centre = heldHand.reduce((sum, s) => sum + s.semitone, 0) / heldHand.length;
  const heldBass = bassVoice(from, Math.min(...heldHand.map((s) => s.semitone)), null);

  const targetHand: Voice[] = hand(to).map((s) => {
    const pc = mod12(s.semitone);
    let best = pc;
    for (let candidate = pc; candidate <= pc + 36; candidate += 12) {
      if (Math.abs(candidate - centre) < Math.abs(best - centre)) best = candidate;
    }
    return { ...s, semitone: best, low: false };
  });
  const targetBass = bassVoice(
    to,
    Math.min(...targetHand.map((s) => s.semitone)),
    heldBass?.semitone ?? null,
  );

  const held = heldBass === null ? heldHand : [heldBass, ...heldHand];
  const target = targetBass === null ? targetHand : [targetBass, ...targetHand];

  const heldAt = new Set(held.map((s) => s.semitone));
  const targetAt = new Set(target.map((s) => s.semitone));
  const voices: Voice[] = [
    ...held.map((s) => ({ ...s, role: targetAt.has(s.semitone) ? ('stay' as const) : ('leave' as const) })),
    ...target.filter((s) => !heldAt.has(s.semitone)).map((s) => ({ ...s, role: 'arrive' as const })),
  ].sort((a, b) => a.semitone - b.semitone);

  // The bass is named last and labelled, so a sentence never says "E" twice
  // without saying which E.
  const names = (role: Sounding['role']): string[] => {
    const inRole = voices.filter((s) => s.role === role);
    return [
      ...inRole.filter((s) => !s.low).map((s) => s.name),
      ...inRole.filter((s) => s.low).map((s) => `${s.name} in the bass`),
    ];
  };
  const stay = names('stay');
  const leave = names('leave');
  const arrive = names('arrive');

  const notes: Sounding[] = voices.map(({ low: _low, ...s }) => s);
  return { layout: keyboardRange(notes), stay, leave, arrive, sentence: sentenceFor(stay, leave, arrive) };
}
