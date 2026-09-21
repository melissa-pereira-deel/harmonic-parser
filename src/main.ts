/**
 * Wiring. Find the input, find the panel, re-render on every keystroke.
 *
 * Everything that decides anything lives in the four modules under this one.
 * If a change belongs in this file it is a change to the page, not to the
 * parser.
 */

import { announcement, announcer } from './announce.ts';
import { parseProgression } from './chords.ts';
import { prunePins } from './pins.ts';
import './style.css';
import type { State } from './ui.ts';
import { initialState, render } from './ui.ts';

const box = document.querySelector<HTMLInputElement>('#progression');
const output = document.querySelector<HTMLElement>('#output');
const live = document.querySelector<HTMLElement>('#status');

if (box === null || output === null || live === null) {
  throw new Error('index.html is missing #progression, #output or #status');
}

const input = box;
const panel = output;
const state: State = initialState();

// Two channels, two speeds, on purpose. The panel repaints immediately; the
// live region waits for a pause. src/announce.ts says why fast is the wrong
// answer for one of them.
const announce = announcer(live);

// Pins are held by chord index, so a pin only keeps its meaning while the
// chord it points at is the same chord. Tracking the symbols is how `update`
// knows whether editing the box invalidated one.
let symbols: string[] = [];

function update(): void {
  state.input = input.value;
  const next = parseProgression(state.input).chords.map((c) => c.symbol);
  state.pins = prunePins(state.pins, symbols, next);
  symbols = next;

  const { readings, confidence, unparsed } = render(panel, state);
  announce(announcement(readings, confidence, unparsed, state.pins.size));
}

input.addEventListener('input', update);

// One delegated listener rather than one per control. The panel is rebuilt
// wholesale on every render, so anything bound to a node inside it would be
// bound to a node that no longer exists a keystroke later.
panel.addEventListener('change', (event) => {
  const target = event.target;
  if (!(target instanceof HTMLSelectElement) || target.dataset.chord === undefined) return;
  state.pins.set(Number(target.dataset.chord), target.value);
  update();
});

panel.addEventListener('click', (event) => {
  const target = event.target;
  if (!(target instanceof HTMLElement)) return;
  if (target.closest('[data-clear-pins]') === null) return;
  state.pins.clear();
  update();
  input.focus();
});

for (const button of document.querySelectorAll<HTMLButtonElement>('[data-example]')) {
  button.addEventListener('click', () => {
    input.value = button.dataset.example ?? '';
    input.focus();
    update();
  });
}

update();
