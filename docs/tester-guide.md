# Tester guide

**The page:** <https://melissa-pereira-deel.github.io/harmonic-parser/>

Type a chord progression and the page tells you which key it is probably in,
puts a Roman numeral under each chord, and suggests what could come next. The
idea being tested is that "two right answers" and "no right answer" are different
things, and a page should say which one it means.

It is an early proof of concept. The thresholds that decide "ambiguous" and
"uncertain" were picked by hand, and the suggestions come from a hand-written
rule table. There is no trained model. **Disagreeing with it is useful feedback,
not a mistake on your part.** It runs entirely in your browser.

## Try these

About ten minutes. If something does not match, that is worth reporting.

| Do this | You should see |
|---|---|
| Click `Am F C G` | A **Clear** banner for C major, with suggestions below |
| Click `Dm7 G7 Cmaj7` | A **Musical ambiguity** banner with C major and G major side by side |
| Click `G7 C# E7 F9` | A **Model uncertainty** banner, dashed reading cards, and suggestions withheld with a reason |
| Click `C G/B Am F` | The `G/B` row reads `V6` |
| Click `Am F C G`, then change the `C` chord's numeral to `IV` | The top reading becomes G major, and a bar shows your pin with a button to clear it |
| Click "Clear" on that bar | The original reading comes back |
| Type `Cm Fm G` | Suggestions use flats, such as `Ab`, never `G#` |
| Type `Am Dm E` | Suggestions include `Am` and `F`, never `F#` |
| Type `C H7 xyz` | A notice names the chords it could not read |

## Then try your own

This is the part that matters most. Type progressions you actually know or are
working on: songs, your own writing, anything. For each one, ask yourself:

- **Did it feel like one reading, two, or nothing fits?** Decide this for yourself
  as well as reading the banner.
- What key would you call it?
- Did the numerals and suggestions make sense?
- Did you want to overrule anything, and could you?

## Telling us

Use **Give feedback** at the bottom of the page, or
[open the form directly](https://github.com/melissa-pereira-deel/harmonic-parser/issues/new?template=reading-feedback.yml).
It takes one progression at a time, and a few sentences or a dropdown is plenty.
You need a GitHub account, and what you submit is public.

Your reports do a second job. The page's thresholds are guesses until they can be
compared with what people actually hear, so each one becomes a labelled example
for calibrating them ([#15](https://github.com/melissa-pereira-deel/harmonic-parser/issues/15)).
