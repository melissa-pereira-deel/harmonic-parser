import type { Condition, GestureSnapshot, ReplayFixture, RoomCue, RoomEvent, RoomFrame } from './contracts.ts';
import { createGestureState } from './input/gesture.ts';
import { createReplay, replayCueAt } from './replay/replay.ts';

const REFLECTION = 'Same phrase, different bass.';

function frameFor(tMs: number, reducedMotion: boolean, gesture: GestureSnapshot | null): RoomFrame {
  const strike = gesture?.lastStrike;
  const age = strike ? Math.max(0, tMs - strike.tMs) : 0;
  const held = (gesture?.physical.length ?? 0) + (gesture?.sustained.length ?? 0);

  return {
    tMs,
    reducedMotion,
    impulse: strike ? (strike.velocity / 127) * Math.exp(-age / 320) : 0,
    register: strike ? strike.note / 127 : 0.5,
    envelope: Math.min(held / 4, 1),
  };
}

export function createRoomSession(condition: Condition, fixture: ReplayFixture | null) {
  const gesture = createGestureState();
  const replay = fixture ? createReplay(fixture, gesture.apply) : null;
  let reflection: RoomCue | null = null;

  return {
    apply(event: RoomEvent): void {
      if (event.kind === 'reset') reflection = null;
      gesture.apply(event);
    },
    reflect(tMs: number): void {
      if (condition !== 'C' || fixture) return;
      if (reflection && tMs < reflection.startMs + reflection.durationMs) return;
      reflection = {
        text: REFLECTION,
        startMs: tMs,
        durationMs: 2_100,
        origin: 'facilitated',
        evidence: 'Manually offered by the facilitator.',
      };
    },
    sample(tMs: number, reducedMotion: boolean) {
      replay?.advanceTo(tMs);
      const snapshot = gesture.snapshot();
      const frame = frameFor(tMs, reducedMotion, condition === 'A' ? null : snapshot);
      if (reflection && tMs >= reflection.startMs + reflection.durationMs) reflection = null;
      const cue = condition === 'C' ? (fixture ? replayCueAt(fixture, tMs) : reflection) : null;
      return { frame, gesture: snapshot, cue };
    },
    reset(): void {
      replay?.reset();
      gesture.reset();
      reflection = null;
    },
  };
}
