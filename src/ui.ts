/**
 * One state object, one render function, no framework.
 *
 * `render` throws away the panel and rebuilds it on every keystroke. That is
 * fine at this size — the whole analysis is 24 correlations over 12 numbers —
 * and it means there is no reconciliation to get wrong. The input element is
 * deliberately outside the rebuilt region, so the caret survives.
 *
 * If this file starts growing a diffing strategy, stop: Preact is 3 KB and
 * the honest move is to reach for it rather than to write a worse one here.
 * It is not needed yet.
 */

import { parseProgression } from './chords.ts';
import type { Confidence } from './confidence.ts';
import { assess } from './confidence.ts';
import { keyName } from './keyprofiles.ts';
import type { Reading } from './readings.ts';
import { rank } from './readings.ts';
import { suggest } from './suggest.ts';

export interface State {
  /** Exactly what is in the box. The only thing a keystroke changes. */
  input: string;
}

export function initialState(): State {
  return { input: '' };
}

function el(tag: string, className?: string, text?: string): HTMLElement {
  const node = document.createElement(tag);
  if (className !== undefined) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function renderUnparsed(tokens: readonly string[]): HTMLElement {
  const box = el('div', 'notice notice-error');
  box.append(
    el('strong', undefined, tokens.length === 1 ? 'Unreadable token: ' : 'Unreadable tokens: '),
    el('span', 'mono', tokens.join(', ')),
    el(
      'p',
      'notice-body',
      'These were skipped. Roots take # and b; qualities are m, dim, aug, sus2, sus4, 7, maj7, m7, m7b5, dim7, 6, m6, add9, 9, m9 and 7sus4. A slash bass goes last: C/E.',
    ),
  );
  return box;
}

function renderConfidence(confidence: Confidence): HTMLElement {
  // Ambiguity and uncertainty get different words and different colours
  // because they want different things from the reader. Rendering them
  // identically is the interface lying about which one happened.
  const kind = confidence.uncertain
    ? 'uncertain'
    : confidence.ambiguous
      ? 'ambiguous'
      : 'clear';
  const box = el('div', `notice notice-${kind}`);
  const label = { uncertain: 'Model uncertainty', ambiguous: 'Musical ambiguity', clear: 'Clear' }[kind];
  box.append(el('strong', undefined, `${label}. `), el('span', undefined, confidence.summary));
  if (confidence.margin !== null) {
    box.append(
      el(
        'p',
        'notice-body',
        `Top score ${confidence.contenders[0].score.toFixed(3)}, gap to second ${confidence.margin.toFixed(3)}.`,
      ),
    );
  }
  return box;
}

function renderReading(reading: Reading, place: number): HTMLElement {
  const card = el('article', place === 0 ? 'reading reading-top' : 'reading');
  const head = el('header', 'reading-head');
  head.append(
    el('h3', undefined, keyName(reading.key)),
    el('span', 'score mono', reading.score.toFixed(3)),
    el('span', 'source', reading.source),
  );
  card.append(head);

  const table = el('table', 'functions');
  const body = el('tbody');
  for (const fn of reading.functions) {
    const row = el('tr', fn.diatonic ? undefined : 'chromatic');
    row.append(
      el('td', 'mono chord', fn.symbol),
      el('td', 'mono numeral', fn.numeral),
      el('td', 'role', fn.role),
    );
    body.append(row);
  }
  table.append(body);
  card.append(table);
  return card;
}

function renderSuggestions(state: State, reading: Reading): HTMLElement {
  const chords = parseProgression(state.input).chords;
  const section = el('section', 'suggestions');
  section.append(el('h3', undefined, `What could come next in ${keyName(reading.key)}`));
  const list = el('ul');
  for (const s of suggest(chords, reading.key)) {
    const item = el('li');
    item.append(el('span', 'mono chord', s.symbol), el('span', 'reason', s.reason));
    list.append(item);
  }
  section.append(list);
  section.append(
    el(
      'p',
      'caveat',
      'A rule table over the last chord only. It is the baseline any future model has to beat.',
    ),
  );
  return section;
}

/** Rebuild `mount` from `state`. Called on every keystroke; idempotent. */
export function render(mount: HTMLElement, state: State): void {
  mount.replaceChildren();

  const parsed = parseProgression(state.input);
  if (parsed.unparsed.length > 0) mount.append(renderUnparsed(parsed.unparsed));

  if (parsed.chords.length === 0) {
    mount.append(
      el('p', 'empty', 'Type a progression. Am F C G is a good place to start.'),
    );
    return;
  }

  const readings = rank(parsed.chords);
  const confidence = assess(readings);
  mount.append(renderConfidence(confidence));

  // Show every contender when the reading is ambiguous, because that is the
  // whole claim: two right answers, both on screen. Otherwise show the top
  // one plus two runners-up, so the ranking is visible without pretending
  // the runners-up are live options.
  const shown = confidence.ambiguous ? confidence.contenders : readings.slice(0, 3);
  const list = el('div', 'readings');
  shown.forEach((reading, i) => list.append(renderReading(reading, i)));
  mount.append(list);

  mount.append(renderSuggestions(state, readings[0]));
}
