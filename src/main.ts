/**
 * Wiring. Find the input, find the panel, re-render on every keystroke.
 *
 * Everything that decides anything lives in the four modules under this one.
 * If a change belongs in this file it is a change to the page, not to the
 * parser.
 */

import './style.css';
import type { State } from './ui.ts';
import { initialState, render } from './ui.ts';

const box = document.querySelector<HTMLInputElement>('#progression');
const output = document.querySelector<HTMLElement>('#output');

if (box === null || output === null) {
  throw new Error('index.html is missing #progression or #output');
}

const input = box;
const panel = output;
const state: State = initialState();

function update(): void {
  state.input = input.value;
  render(panel, state);
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
