export const fieldTuningRanges = {
  speed: [0, 2],
  warp: [0, 1],
  detail: [0, 1],
  edgeWidth: [0.5, 3],
  strike: [0, 1.5],
  light: [0, 1.5],
  attack: [25, 250],
} as const;

export type FieldTuning = Readonly<Record<keyof typeof fieldTuningRanges, number>>;
const tuningKeys = Object.keys(fieldTuningRanges) as (keyof FieldTuning)[];

export const defaultFieldTuning: FieldTuning = {
  speed: 1,
  warp: 0.85,
  detail: 0.28,
  edgeWidth: 1,
  strike: 1,
  light: 1,
  attack: 45,
};

export const gentleFieldTuning: FieldTuning = {
  ...defaultFieldTuning,
  warp: 0.425,
  strike: 0.5,
  attack: 110,
};

export function readFieldTuning(params: URLSearchParams): FieldTuning {
  const preset = params.get('motion') === 'gentle' ? gentleFieldTuning : defaultFieldTuning;
  const tuning = { ...preset };
  for (const key of tuningKeys) {
    const raw = params.get(key);
    if (!raw?.trim()) continue;
    const value = Number(raw);
    const [min, max] = fieldTuningRanges[key];
    if (Number.isFinite(value)) tuning[key] = Math.max(min, Math.min(max, value));
  }
  return tuning;
}

export function interpolateFieldTuning(from: FieldTuning, to: FieldTuning, progress: number): FieldTuning {
  if (progress >= 1) return to;
  const blend = progress * progress * (3 - 2 * progress);
  const tuning = { ...from };
  for (const key of tuningKeys) tuning[key] += (to[key] - from[key]) * blend;
  return tuning;
}
