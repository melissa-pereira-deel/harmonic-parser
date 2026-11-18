/**
 * The chord keyboard's model, and just enough of its SVG to catch a broken one.
 *
 * Most of these are about `keyboardLayout`, because that is where a wrong
 * answer is a wrong *note*. The SVG tests only pin what the stylesheet and a
 * screen reader depend on: classes, the label, and the detail tiers.
 */

import { describe, expect, it } from 'vitest';

import { INTERVALS, parseChord } from '../src/chords.ts';
import type { Chord, Quality } from '../src/chords.ts';
import { detailFor, keyboardLayout, keyboardSvg } from '../src/keyboard.ts';

function chord(symbol: string): Chord {
  const parsed = parseChord(symbol);
  if (parsed === null) throw new Error(`fixture chord did not parse: ${symbol}`);
  return parsed;
}

/** `name:role` for every sounding key, low to high. */
function sounding(symbol: string, window: 'octave' | 'fit'): string[] {
  return keyboardLayout(chord(symbol), window)
    .keys.filter((k) => k.role !== 'idle')
    .map((k) => `${k.name}:${k.role}`);
}

describe('keyboardLayout, one octave', () => {
  it('is always C to B: seven white keys and five black', () => {
    for (const symbol of ['C', 'F#m7b5', 'Bb9', 'G7/B']) {
      const { keys, whiteCount } = keyboardLayout(chord(symbol), 'octave');
      expect(keys.map((k) => k.pc)).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);
      expect(whiteCount).toBe(7);
    }
  });

  it('folds the tones into the octave and marks the root', () => {
    expect(sounding('Dm', 'octave')).toEqual(['D:root', 'F:tone', 'A:tone']);
    expect(sounding('G7', 'octave')).toEqual(['D:tone', 'F:tone', 'G:root', 'B:tone']);
  });

  it('spells tones the way the chord does, not from a sharp table', () => {
    expect(sounding('Cm', 'octave')).toEqual(['C:root', 'E♭:tone', 'G:tone']);
    expect(sounding('F#', 'octave')).toEqual(['C♯:tone', 'F♯:root', 'A♯:tone']);
    expect(sounding('Cdim7', 'octave')).toContain('B♭♭:tone');
  });

  it('marks a slash bass, whether or not it is a chord tone', () => {
    expect(sounding('C/E', 'octave')).toEqual(['C:root', 'E:bass', 'G:tone']);
    expect(sounding('C/D', 'octave')).toEqual(['C:root', 'D:bass', 'E:tone', 'G:tone']);
  });

  it('sounds exactly as many keys as the quality has intervals', () => {
    for (const quality of Object.keys(INTERVALS) as Quality[]) {
      const layout = keyboardLayout({ ...chord('C'), quality }, 'octave');
      const count = layout.keys.filter((k) => k.role !== 'idle').length;
      expect(count, quality).toBe(INTERVALS[quality].length);
    }
  });
});

describe('keyboardLayout, fit', () => {
  it('stacks root position upward from the root', () => {
    expect(sounding('G7', 'fit')).toEqual(['G:root', 'B:tone', 'D:tone', 'F:tone']);
    expect(sounding('C9', 'fit')).toEqual(['C:root', 'D:tone', 'E:tone', 'G:tone', 'B♭:tone']);
  });

  it('puts a slash bass under the root and does not double it', () => {
    expect(sounding('C/E', 'fit')).toEqual(['E:bass', 'C:root', 'G:tone']);
    expect(sounding('C/D', 'fit')).toEqual(['D:bass', 'C:root', 'E:tone', 'G:tone']);
  });

  it('only ever cuts the keyboard where no black key is sliced', () => {
    for (const root of ['C', 'Db', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B']) {
      for (const suffix of ['', 'm7', '9', '/E', '/Bb']) {
        const { keys } = keyboardLayout(chord(root + suffix), 'fit');
        expect([0, 5], root + suffix).toContain(keys[0].pc);
        expect([4, 11], root + suffix).toContain(keys[keys.length - 1].pc);
      }
    }
  });

  it('stays within two octaves of white keys', () => {
    for (const root of ['C', 'F#', 'B']) {
      for (const suffix of ['', '9', 'm9', '/C#']) {
        expect(keyboardLayout(chord(root + suffix), 'fit').whiteCount).toBeLessThanOrEqual(14);
      }
    }
  });
});

describe('keyboardSvg', () => {
  it('sizes by key height and derives the width', () => {
    const svg = keyboardSvg(chord('Dm'), { height: 32 });
    expect(svg).toContain('width="70" height="32"');
    expect(keyboardSvg(chord('Dm'), { height: 16 })).toContain('width="35" height="16"');
  });

  it('labels itself for a screen reader, escaping the symbol', () => {
    expect(keyboardSvg(chord('Dm'))).toContain('aria-label="Dm on a keyboard: D, F, A"');
    const hostile = { ...chord('C'), symbol: 'C"><script>' };
    expect(keyboardSvg(hostile)).not.toContain('<script>');
  });

  it('gives the root a pip so colour is never the only signal', () => {
    const svg = keyboardSvg(chord('Dm'), { detail: 'compact' });
    expect(svg.match(/kb-pip/g)).toHaveLength(1);
    expect(svg).toContain('kb-pip on-white is-root');
    expect(keyboardSvg(chord('C/E'), { detail: 'compact' })).toContain('is-bass is-hollow');
  });

  it('dots every sounding key in dot marks', () => {
    const svg = keyboardSvg(chord('Dm7'), { detail: 'compact', marks: 'dot' });
    expect(svg.match(/kb-pip/g)).toHaveLength(4);
  });

  it('draws keys only at glyph detail and note names only at full', () => {
    const glyph = keyboardSvg(chord('Dm'), { detail: 'glyph' });
    expect(glyph).not.toContain('kb-pip');
    expect(glyph).not.toContain('<text');
    expect(keyboardSvg(chord('Dm'), { detail: 'full' }).match(/<text/g)).toHaveLength(3);
  });

  it('picks the tier from the rendered key width', () => {
    expect(detailFor(14)).toBe('glyph');
    expect(detailFor(24)).toBe('compact');
    expect(detailFor(64)).toBe('full');
  });
});
