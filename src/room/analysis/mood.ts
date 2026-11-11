type Decay = { rise: number; tail: number };

function pulse(riseMs: number, tailMs: number) {
  let state: Decay = { rise: 0, tail: 0 };
  return {
    decay(dtMs: number): void {
      state.rise *= Math.exp(-dtMs / riseMs);
      state.tail *= Math.exp(-dtMs / tailMs);
    },
    add(amount: number): void {
      state.rise += amount;
      state.tail += amount;
    },
    value: () => 1 - Math.exp(-(state.tail - state.rise)),
    reset(): void { state = { rise: 0, tail: 0 }; },
  };
}

export function createPlayingMood() {
  // Each strike adds equally to both decays, so a new pulse starts at zero.
  const activity = pulse(850, 3_200);
  const release = pulse(1_200, 6_200);
  let time = 0;
  let onset: { time: number; velocity: number } | null = null;
  let interval = 500;
  let phraseOnsets = 0;
  let restAt: number | null = null;

  function decayTo(tMs: number): void {
    const dt = Math.max(0, tMs - time);
    activity.decay(dt);
    release.decay(dt);
    time += dt;
  }

  function advance(tMs: number): void {
    if (restAt !== null && restAt <= tMs) {
      decayTo(restAt);
      release.add(0.65);
      restAt = null;
      phraseOnsets = 0;
    }
    decayTo(tMs);
  }

  return {
    strike(tMs: number, velocity: number): void {
      advance(tMs);
      const gap = onset ? tMs - onset.time : Infinity;
      // Near-simultaneous chord tones share an onset. Keep its strongest attack.
      if (onset && gap <= 55) {
        if (velocity > onset.velocity) {
          activity.add(0.55 * (velocity - onset.velocity) / 127);
          onset.velocity = velocity;
        }
        return;
      }
      interval = phraseOnsets && gap < 1_500 ? 0.7 * interval + 0.3 * gap : 500;
      onset = { time: tMs, velocity };
      phraseOnsets += 1;
      activity.add(0.22 + 0.55 * velocity / 127);
      restAt = phraseOnsets >= 3 ? tMs + Math.max(950, interval * 1.8) : null;
    },
    cadence(tMs: number): void {
      advance(tMs);
      release.add(1.1);
    },
    sample(tMs: number) {
      advance(tMs);
      return { energy: activity.value(), warmth: release.value() };
    },
    reset(): void {
      activity.reset();
      release.reset();
      time = 0;
      onset = null;
      interval = 500;
      phraseOnsets = 0;
      restAt = null;
    },
  };
}
