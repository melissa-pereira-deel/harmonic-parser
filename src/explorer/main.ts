/**
 * The chord keyboard explorer: a development page, not a product page.
 *
 * `npm run dev`, then open `/explorer/`. It is not in the build's inputs, so
 * it never ships. It exists so that the open questions about showing a next
 * chord can be looked at rather than argued about: every keyboard here is
 * drawn by `src/keyboard.ts`, and every key and suggestion comes from the
 * real `rank()` and `suggest()`.
 *
 * The six numbered readouts match `docs/concepts/harmony-readout-alternatives.md`.
 */

import '../keyboard.css';
import './explorer.css';

import { INTERVALS, parseChord, parseProgression } from '../chords.ts';
import type { Chord, Quality } from '../chords.ts';
import { UNCERTAINTY_FLOOR } from '../confidence.ts';
import { detailFor, keyboardLayout, keyboardSvg, layoutSvg } from '../keyboard.ts';
import type { KeyboardDetail, KeyboardMarks, KeyboardWindow } from '../keyboard.ts';
import { keyName } from '../keyprofiles.ts';
import { rank } from '../readings.ts';
import { suggest } from '../suggest.ts';
import { movesBetween } from './moves.ts';

function $<T extends HTMLElement = HTMLElement>(id: string): T {
  const node = document.getElementById(id);
  if (node === null) throw new Error(`explorer/index.html is missing #${id}`);
  return node as T;
}

interface State {
  chord: string;
  height: number;
  window: KeyboardWindow;
  marks: KeyboardMarks;
  theme: string;
  progression: string;
  margin: number;
}

const state: State = {
  chord: 'Dm7',
  height: 56,
  window: 'octave',
  marks: 'fill',
  theme: 'room',
  progression: 'Dm7 G7 Cmaj7',
  margin: 0.06,
};

/** The suffix the parser reads back as each quality. */
const SUFFIX: Readonly<Record<Quality, string>> = {
  maj: '', min: 'm', dim: 'dim', aug: 'aug', sus2: 'sus2', sus4: 'sus4', dom7: '7',
  maj7: 'maj7', min7: 'm7', min7b5: 'm7b5', dim7: 'dim7', maj6: '6', min6: 'm6',
  add9: 'add9', dom9: '9', min9: 'm9', dom7sus4: '7sus4',
};

function svg(chord: Chord, height: number, detail: KeyboardDetail | 'auto' = 'auto'): string {
  return keyboardSvg(chord, { height, window: state.window, marks: state.marks, detail });
}

function esc(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;');
}

function renderStage(chord: Chord): void {
  $('stage-kb').innerHTML = svg(chord, state.height);
  $('stage-symbol').textContent = chord.symbol;
  const { whiteCount } = keyboardLayout(chord, state.window);
  const keyPx = (state.height / 32) * 10;
  $('readout').textContent =
    `${Math.round(whiteCount * keyPx)} × ${state.height} px · key width ${keyPx.toFixed(1)} px · detail: ${detailFor(state.height)}`;
  $('height-out').textContent = `${state.height} px`;
}

function renderLadder(chord: Chord): void {
  $('ladder').innerHTML = [12, 16, 20, 24, 32, 48, 72, 112]
    .map(
      (h) =>
        `<div class="rung"><span class="rung-label">${h} px<br><i>${detailFor(h)}</i></span><span class="rung-kb">${svg(chord, h)}</span></div>`,
    )
    .join('');
}

function renderSheet(chord: Chord): void {
  const rootText = chord.symbol.match(/^[A-Ga-g][#b♯♭-]*/)?.[0] ?? 'C';
  $('sheet-title').textContent = `Every quality the parser knows, on ${rootText}`;
  $('sheet').innerHTML = (Object.keys(INTERVALS) as Quality[])
    .map((quality) => {
      const c = parseChord(rootText + SUFFIX[quality]);
      return c ? `<figure>${svg(c, 30, 'compact')}<figcaption>${esc(c.symbol)}</figcaption></figure>` : '';
    })
    .join('');
}

function keysAndName(symbol: string | null, height = 22): string {
  const chord = symbol === null ? null : parseChord(symbol);
  return chord ? `${svg(chord, height, 'compact')}<span>${esc(chord.symbol)}</span>` : '–';
}

const item = (term: string, value: string, className = ''): string =>
  `<div><dt>${esc(term)}</dt><dd${className ? ` class="${className}"` : ''}>${value}</dd></div>`;

/** Options 1 to 4 and 6: everything that follows from one key and one suggestion. */
function renderSingleReadouts(chords: readonly Chord[]): void {
  const reading = rank(chords)[0];
  const last = chords[chords.length - 1];
  const nextSymbol = suggest(chords, reading.key, 1)[0]?.symbol ?? null;
  const next = nextSymbol === null ? null : parseChord(nextSymbol);
  const chord = item('Chord', esc(last.symbol), 'now');
  const key = item('Possible key', esc(keyName(reading.key)));

  $('opt-1').innerHTML = chord + key + item('Try next', esc(nextSymbol ?? '–'), 'next');
  $('opt-2').innerHTML = chord + key;
  $('opt-3').innerHTML = chord + key + item('Try next', keysAndName(nextSymbol), 'next');
  $('opt-4').innerHTML = chord + key + item('Try next', next ? svg(next, 34, 'compact') : '–', 'next');

  if (next === null) {
    $('opt-6').innerHTML = chord;
    $('opt-6-note').textContent = 'No suggestion to move toward.';
    return;
  }
  const moves = movesBetween(last, next);
  const drawing = layoutSvg(moves.layout, `From ${last.symbol} toward ${next.symbol}. ${moves.sentence}`, {
    height: 34,
    marks: 'fill',
    detail: 'compact',
  });
  $('opt-6').innerHTML = chord + item(`Toward ${next.symbol}`, `<span class="kb-moves">${drawing}</span>`, 'next');
  $('opt-6-note').textContent = `${moves.sentence} Assumes ${last.symbol} is held in root position.`;
}

/** Option 5: one suggestion per plausible key. */
function renderHearings(chords: readonly Chord[]): void {
  const readings = rank(chords);
  const top = readings[0];
  const last = chords[chords.length - 1];
  const hearings = readings
    .filter((r) => top.score - r.score <= state.margin)
    .slice(0, 2)
    .map((r) => ({ key: keyName(r.key), score: r.score, next: suggest(chords, r.key, 1)[0]?.symbol ?? null }));
  const chord = item('Chord', esc(last.symbol), 'now');

  let status: string;
  let body: string;
  if (top.score < UNCERTAINTY_FLOOR) {
    status = `Uncertain: the best fit, ${top.score.toFixed(2)}, is under the ${UNCERTAINTY_FLOOR} floor. The room names the chord and nothing else.`;
    body = chord;
  } else if (hearings.length === 1) {
    status = `Clear: ${hearings[0].key} leads by ${(top.score - readings[1].score).toFixed(2)}. One hearing, one suggestion.`;
    body = chord + item('Possible key', esc(hearings[0].key)) + item('Try next', keysAndName(hearings[0].next), 'next');
  } else if (hearings[0].next === hearings[1].next) {
    status = `Two hearings ${(top.score - hearings[1].score).toFixed(2)} apart that agree on the next chord, so they merge.`;
    body =
      chord +
      item('Could be', `${esc(hearings[0].key)} or ${esc(hearings[1].key)}`) +
      item('Try next', keysAndName(hearings[0].next), 'next');
  } else {
    status = `Two hearings ${(top.score - hearings[1].score).toFixed(2)} apart, each with its own next chord.`;
    body = chord + hearings.map((h) => item(`Heard in ${h.key}`, keysAndName(h.next), 'next')).join('');
  }
  $('opt-5').innerHTML = body;
  $('opt-5-note').textContent = status;
  $('margin-out').textContent = state.margin.toFixed(2) + (state.margin === 0.06 ? ' (repo default)' : '');
}

function renderParserMock(chords: readonly Chord[]): void {
  $('strip').innerHTML = chords
    .map((c) => `<span class="strip-item">${svg(c, 18, 'glyph')}<b>${esc(c.symbol)}</b></span>`)
    .join('');
  const reading = rank(chords)[0];
  $('suggest-title').textContent = `What could come next in ${keyName(reading.key)}`;
  $('suggestions').innerHTML = suggest(chords, reading.key)
    .map((s) => {
      const c = parseChord(s.symbol);
      return `<li>${c ? svg(c, 26, 'compact') : ''}<span class="mono chord">${esc(s.symbol)}</span><span class="reason">${esc(s.reason)}</span></li>`;
    })
    .join('');
}

function render(): void {
  const chord = parseChord(state.chord);
  $('chord').setAttribute('aria-invalid', chord ? 'false' : 'true');
  $('chord-error').hidden = chord !== null || state.chord.trim() === '';
  document.querySelectorAll<HTMLElement>('[data-themed]').forEach((node) => {
    node.dataset.theme = state.theme;
  });
  if (chord) {
    renderStage(chord);
    renderLadder(chord);
    renderSheet(chord);
  }

  const { chords } = parseProgression(state.progression);
  $('options').hidden = chords.length === 0;
  $('options-empty').hidden = chords.length > 0;
  if (chords.length > 0) {
    renderSingleReadouts(chords);
    renderHearings(chords);
    renderParserMock(chords);
  }

  document.querySelectorAll<HTMLButtonElement>('button[data-set]').forEach((button) => {
    const [key, value] = (button.dataset.set ?? '').split(':');
    button.setAttribute('aria-pressed', String(String(state[key as keyof State]) === value));
  });
}

document.addEventListener('click', (event) => {
  const button = (event.target as HTMLElement).closest<HTMLButtonElement>('button[data-set]');
  if (!button) return;
  const [key, value] = (button.dataset.set ?? '').split(':');
  Object.assign(state, { [key]: value });
  const field = document.getElementById(key);
  if (field instanceof HTMLInputElement && field.type === 'text') field.value = value;
  render();
});

function bind(id: string, apply: (value: string) => void): void {
  $<HTMLInputElement>(id).addEventListener('input', (event) => {
    apply((event.target as HTMLInputElement).value);
    render();
  });
}

bind('chord', (v) => { state.chord = v; });
bind('progression', (v) => { state.progression = v; });
bind('height', (v) => { state.height = Number(v); });
bind('margin', (v) => { state.margin = Number(v); });
render();
