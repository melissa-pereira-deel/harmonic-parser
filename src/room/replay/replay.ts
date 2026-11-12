import type { ReplayFixture, RoomCue, RoomEvent } from '../contracts.ts';

export function createReplay(fixture: ReplayFixture, emit: (event: RoomEvent) => void) {
  const events = fixture.events.toSorted((a, b) => a.tMs - b.tMs || a.seq - b.seq);
  let next = 0;

  return {
    advanceTo(tMs: number): void {
      while (next < events.length && events[next].tMs <= tMs) {
        const event = events[next++];
        emit(event);
      }
    },
    // The caller also resets the shared gesture state before advancing again.
    reset(): void {
      next = 0;
    },
  };
}

export function replayCueAt(fixture: ReplayFixture, tMs: number): RoomCue | null {
  return fixture.cues.find(cue => cue.startMs <= tMs && tMs < cue.startMs + cue.durationMs) ?? null;
}
