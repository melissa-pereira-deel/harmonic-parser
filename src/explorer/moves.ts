/**
 * "What moves": the next chord drawn as a change from the hand, not as a
 * chord of its own. A mock for the explorer, and deliberately not in `src/`
 * proper — the room has not decided to do this.
 *
 * **The big assumption.** The room would use the notes actually held. This
 * mock has no keyboard, so it pretends the current chord is held in root
 * position, and that is the first thing a real version would replace.
 *
 * **The voicing rule is the simplest one that could work.** Each note of the
 * next chord goes to whichever octave puts it closest to the middle of the
 * hand. It is not voice leading in any taught sense: it does not avoid
 * crossings or keep a bass, and it ignores a slash. It is enough to show the
 * idea, which is that most of the hand usually stays where it is.
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

const list = (names: readonly string[]): string => names.join(', ');

export function movesBetween(from: Chord, to: Chord): Moves {
  // An octave up, so the next chord has room to land below the hand.
  const held = chordTones({ ...from, bass: from.root }).map((s) => ({ ...s, semitone: s.semitone + 12 }));
  const centre = held.reduce((sum, s) => sum + s.semitone, 0) / held.length;

  const target = chordTones({ ...to, bass: to.root }).map((s) => {
    const pc = ((s.semitone % 12) + 12) % 12;
    let best = pc;
    for (let candidate = pc; candidate <= pc + 36; candidate += 12) {
      if (Math.abs(candidate - centre) < Math.abs(best - centre)) best = candidate;
    }
    return { ...s, semitone: best };
  });

  const heldAt = new Set(held.map((s) => s.semitone));
  const targetAt = new Set(target.map((s) => s.semitone));
  const notes: Sounding[] = [
    ...held.map((s) => ({ ...s, role: targetAt.has(s.semitone) ? ('stay' as const) : ('leave' as const) })),
    ...target.filter((s) => !heldAt.has(s.semitone)).map((s) => ({ ...s, role: 'arrive' as const })),
  ].sort((a, b) => a.semitone - b.semitone);

  const names = (role: Sounding['role']): string[] => notes.filter((s) => s.role === role).map((s) => s.name);
  const stay = names('stay');
  const leave = names('leave');
  const arrive = names('arrive');
  const sentence =
    (stay.length > 0 ? `Keep ${list(stay)}. ` : 'Nothing stays. ') +
    (arrive.length > 0 ? `Let go of ${list(leave)} and play ${list(arrive)}.` : `Let go of ${list(leave)}.`);

  return { layout: keyboardRange(notes), stay, leave, arrive, sentence };
}
