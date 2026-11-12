import type { ActiveNote, GestureSnapshot, RoomEvent } from '../contracts';

export function createGestureState() {
  const physical = new Map<number, ActiveNote>();
  const sustained = new Map<number, ActiveNote>();
  const pedals = new Set<number>();
  let lastStrike: GestureSnapshot['lastStrike'] = null;

  function reset(): void {
    physical.clear();
    sustained.clear();
    pedals.clear();
    lastStrike = null;
  }

  function apply(event: RoomEvent): void {
    switch (event.kind) {
      case 'noteOn': {
        const { channel, note, velocity } = event;
        const key = channel * 128 + note;
        sustained.delete(key);
        physical.set(key, { channel, note, velocity });
        lastStrike = event;
        break;
      }
      case 'noteOff': {
        const key = event.channel * 128 + event.note;
        const activeNote = physical.get(key);
        if (activeNote && pedals.has(event.channel)) sustained.set(key, activeNote);
        physical.delete(key);
        break;
      }
      case 'sustain':
        if (event.down) {
          pedals.add(event.channel);
        } else {
          pedals.delete(event.channel);
          for (const [key, note] of sustained) {
            if (note.channel === event.channel) sustained.delete(key);
          }
        }
        break;
      case 'reset':
        reset();
        break;
    }
  }

  function snapshot(): GestureSnapshot {
    return { physical: [...physical.values()], sustained: [...sustained.values()], lastStrike };
  }

  return { apply, snapshot, reset };
}
