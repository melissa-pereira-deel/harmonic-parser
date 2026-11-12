import './motion-panel.css';
import { defaultFieldTuning, fieldTuningRanges, gentleFieldTuning } from './visual/tuning.ts';
import type { FieldTuning } from './visual/tuning.ts';

const presets = [
  { label: 'Current', tuning: defaultFieldTuning },
  { label: 'Gentle', tuning: gentleFieldTuning },
];

const sliders = [
  { key: 'speed', label: 'Speed', step: 0.01, unit: '×' },
  { key: 'warp', label: 'Warp', step: 0.005, unit: '' },
  { key: 'detail', label: 'Detail', step: 0.01, unit: '' },
  { key: 'strike', label: 'Strike strength', step: 0.01, unit: '×' },
  { key: 'attack', label: 'Strike attack', step: 1, unit: ' ms' },
] as const;

export function mountMotionPanel(room: HTMLElement, initial: FieldTuning, update: (tuning: FieldTuning) => void): void {
  const panel = document.createElement('details');
  panel.className = 'motion-panel';
  panel.innerHTML = `
    <summary>Motion</summary>
    <div class="motion-settings">
      <div class="motion-presets" role="group" aria-label="Motion preset"></div>
    </div>`;
  const settings = panel.querySelector('.motion-settings')!;
  const presetGroup = panel.querySelector('.motion-presets')!;
  let tuning = initial;

  function apply(next: FieldTuning): void {
    tuning = next;
    sync();
    update(tuning);
  }

  const buttons = presets.map(preset => {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = preset.label;
    button.addEventListener('click', () => apply(preset.tuning));
    presetGroup.append(button);
    return button;
  });

  const fields = sliders.map(({ key, label, step, unit }) => {
    const row = document.createElement('label');
    const value = document.createElement('span');
    value.setAttribute('aria-hidden', 'true');
    const input = document.createElement('input');
    const [min, max] = fieldTuningRanges[key];
    input.type = 'range';
    input.min = String(min);
    input.max = String(max);
    input.step = String(step);
    input.addEventListener('input', () => apply({ ...tuning, [key]: input.valueAsNumber }));
    row.append(label, value, input);
    settings.append(row);
    return { key, unit, value, input };
  });

  function sync(): void {
    for (const { key, unit, value, input } of fields) {
      input.valueAsNumber = tuning[key];
      const formatted = `${Number(tuning[key].toFixed(3))}${unit}`;
      value.textContent = formatted;
      input.setAttribute('aria-valuetext', formatted);
    }
    presets.forEach((preset, index) => {
      const selected = Object.entries(tuning).every(([key, value]) => preset.tuning[key as keyof FieldTuning] === value);
      buttons[index].setAttribute('aria-pressed', String(selected));
    });
  }

  sync();
  room.append(panel);
}
