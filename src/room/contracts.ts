export type Condition = 'A' | 'B' | 'C';

export type RoomEvent = {
  readonly tMs: number;
  readonly seq: number;
} & (
  | { readonly kind: 'noteOn'; readonly channel: number; readonly note: number; readonly velocity: number }
  | { readonly kind: 'noteOff'; readonly channel: number; readonly note: number }
  | { readonly kind: 'sustain'; readonly channel: number; readonly down: boolean }
  | { readonly kind: 'reset' }
);

export interface ActiveNote {
  readonly channel: number;
  readonly note: number;
  readonly velocity: number;
}

export interface GestureSnapshot {
  readonly physical: readonly ActiveNote[];
  readonly sustained: readonly ActiveNote[];
  readonly lastStrike: Extract<RoomEvent, { kind: 'noteOn' }> | null;
}

export interface RoomFrame {
  readonly tMs: number;
  readonly impulse: number;
  readonly register: number;
  readonly envelope: number;
  readonly energy: number;
  readonly warmth: number;
  readonly reducedMotion: boolean;
}

export interface RoomCue {
  readonly text: string;
  readonly startMs: number;
  readonly durationMs: number;
  readonly origin: 'facilitated' | 'parser';
  readonly evidence: string;
}

export interface ReplayFixture {
  readonly id: string;
  readonly description: string;
  readonly durationMs: number;
  readonly seed: number;
  readonly events: readonly RoomEvent[];
  readonly cues: readonly RoomCue[];
  readonly chords: readonly { readonly tMs: number; readonly symbol: string }[];
}
