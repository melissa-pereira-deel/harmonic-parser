/**
 * Wiring. Find the input, find the panel, re-render on every keystroke.
 *
 * Everything that decides anything lives in the four modules under this one.
 * If a change belongs in this file it is a change to the page, not to the
 * parser.
 */

import { announcement, announcer } from './announce.ts';
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

function update(): void {
  state.input = input.value;
  const { readings, confidence, unparsed } = render(panel, state);
  announce(announcement(readings, confidence, unparsed));
}

input.addEventListener('input', update);

for (const button of document.querySelectorAll<HTMLButtonElement>('[data-example]')) {
  button.addEventListener('click', () => {
    input.value = button.dataset.example ?? '';
    input.focus();
    update();
  });
}

update();
