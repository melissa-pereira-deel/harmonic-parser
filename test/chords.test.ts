/**
 * The parser, on its own.
 *
 * The parity fixture covers what the parser produces for progressions that
 * music21 also read. These are the cases the fixture cannot pin: the symbols
 * this repo promised to handle, and the tokens it must refuse rather than
 * guess at.
 */

import { describe, expect, it } from 'vitest';

import { parseChord, parseProgression, pitchClasses } from '../src/chords.ts';

describe('parseChord', () => {
  it('reads the four symbols the design named', () => {
    expect(parseChord('Am')).toMatchObject({ root: 9, quality: 'min', bass: 9 });
    expect(parseChord('F#m7b5')).toMatchObject({ root: 6, quality: 'min7b5', bass: 6 });
    expect(parseChord('C/E')).toMatchObject({ root: 0, quality: 'maj', bass: 4 });
    expect(parseChord('Bb')).toMatchObject({ root: 10, quality: 'maj', bass: 10 });
  });

  it('tries the longest suffix first', () => {
    // `Cmaj7` must not parse as C major with a stray 7, and `Cm7b5` must not
    // parse as Cm7 with a stray b5.
    expect(parseChord('Cmaj7')?.quality).toBe('maj7');
    expect(parseChord('Cm7b5')?.quality).toBe('min7b5');
    expect(parseChord('Cm7')?.quality).toBe('min7');
    expect(parseChord('C7sus4')?.quality).toBe('dom7sus4');
  });

  it('accepts music21 spelling on input though it never writes it', () => {
    expect(parseChord('B-')?.root).toBe(10);
    expect(parseChord('Bb')?.root).toBe(10);
  });

  it('refuses rather than guesses', () => {
    for (const junk of ['', 'H', 'Cxyz', 'C/', 'C/E/G', 'Cmaj13', '7']) {
      expect(parseChord(junk), junk).toBeNull();
    }
  });
});

describe('pitchClasses', () => {
  it('adds a slash bass rather than replacing the root', () => {
    // music21 does the same, and the difference is invisible on C/E and
    // changes every key score on C/D.
    expect(pitchClasses(parseChord('C/E')!)).toEqual([0, 4, 7]);
    expect(pitchClasses(parseChord('C/D')!)).toEqual([0, 2, 4, 7]);
  });

  // Every expectation below was read out of music21 rather than reasoned
  // about. The fixture already covers this indirectly, but it took one
  // progression in two hundred to notice -- these name the rule so the next
  // person does not have to rediscover it. See
  // experiments/slash-bass-spelling.spike.md.
  describe('decides by spelling, not by pitch class', () => {
    it('inverts when the bass is spelled exactly like a chord tone', () => {
      expect(pitchClasses(parseChord('C/G')!)).toEqual([0, 4, 7]);
      // Gb IS the diminished fifth of C dim, spelled the same way.
      expect(pitchClasses(parseChord('Cdim/Gb')!)).toEqual([0, 3, 6]);
      expect(pitchClasses(parseChord('C7/Bb')!)).toEqual([0, 4, 7, 10]);
    });

    it('appends when the letter matches but the accidental does not', () => {
      // E is in a C major triad; E-flat is not, so it is a fourth pitch.
      expect(pitchClasses(parseChord('C/Eb')!)).toEqual([0, 3, 4, 7]);
      // B-flat is the seventh of C7; B natural is not.
      expect(pitchClasses(parseChord('C7/B')!)).toEqual([0, 4, 7, 10, 11]);
    });

    it('counts a pitch class twice when two spellings collide', () => {
      // The one that cost a progression. F# and Gb are both pitch class 6,
      // and music21 counts it twice because C dim spells its fifth Gb.
      expect(pitchClasses(parseChord('Cdim/F#')!)).toEqual([0, 3, 6, 6]);
      expect(pitchClasses(parseChord('Ebdim/F#')!)).toEqual([3, 6, 6, 9]);
      // Even against the root: B# is pitch class 0, and so is C.
      expect(pitchClasses(parseChord('C/B#')!)).toEqual([0, 0, 4, 7]);
    });

    it('is a multiset, so readings.ts weights the doubled pitch twice', () => {
      // Why any of this matters: readings.ts counts these into a pitch-class
      // distribution, so a duplicate is real extra weight on that class.
      const pcs = pitchClasses(parseChord('Cdim/F#')!);
      expect(pcs).toHaveLength(4);
      expect(new Set(pcs).size).toBe(3);
    });
  });
});

describe('parseProgression', () => {
  it('splits on whitespace, commas and bar lines', () => {
    const parsed = parseProgression('Am, F | C  G');
    expect(parsed.chords.map((c) => c.symbol)).toEqual(['Am', 'F', 'C', 'G']);
    expect(parsed.unparsed).toEqual([]);
  });

  it('keeps unreadable tokens so the UI can name them', () => {
    const parsed = parseProgression('Am Hq C');
    expect(parsed.chords).toHaveLength(2);
    expect(parsed.unparsed).toEqual(['Hq']);
  });
});
