# First playing session

*Harmonic Parser · Session sheet · Prepared 18 November 2026 · Not yet run.*

One sitting at the KeyLab, about 45 minutes, to find out whether the room helps you vary a motif. It compares the three conditions with the same motif, and checks whether condition C's readout can be read while you play, now that it can show two keys at once ([E015](project-memory.md#e015--2026-11-18--two-hearings-in-condition-c)).

Fill this sheet in as you go, or copy it and fill in the copy. A lab log records what the readout offered and what you played next, so you don't have to remember chords.

## 1 · Set the bar before you play

Decide what would count as a yes **before** the first note. Once you start, don't change these. If the session falls short, that is the finding.

The four below are proposals. Edit them now, then tick each one you keep.

- [ ] **Readable.** In the two-key check (section 4), you can say both keys and both chords before the readout goes, in at least 2 of the 3 tries.
- [ ] **Useful.** In C, at least one stuck moment ends with you trying a chord the readout offered and keeping it for at least two more times round the motif.
- [ ] **Affordable.** In C, the readout makes you lose the phrase no more than once.
- [ ] **Different from B.** In the log, the share of offers you followed is clearly higher in C than in B. B computes the same offers but never shows them, so B is what you would have played anyway.

Anything else you want to know, written as a question: ____________________

## 2 · Set up

1. In the project folder, run `npm run dev`. Open `/room/?setup=1&lab=1` at the address Vite prints, in desktop Chrome. The `lab=1` part turns on the log. It also shows a small **Motion** panel, which you can leave closed.
2. Open your usual instrument or synth for sound, so you hear what you play.
3. Choose **Play my keyboard**, click **Connect MIDI**, and select **Arturia KeyLab Essential 49 MIDI In**. Wait for **Keyboard ready**.
4. Open the browser console (**View → Developer → JavaScript Console**) and run `__roomLab.clearReadouts()`, so the log starts empty.
5. Write down:

| | |
| --- | --- |
| Date and time | |
| Browser and macOS version | |
| Sound source | |
| How you feel today (fresh, tired, distracted) | |
| The motif, in a few words or notes | |

## 3 · Play the three conditions

Use the same motif in every condition. Spend about 10 minutes in each. Play as you normally would: find the motif, repeat it, vary it, and notice when it starts to feel stuck. Press **Esc** to return to setup between conditions.

**Order for this session: A, then B, then C.** Next time, reverse it, so warming up and getting tired don't look like an effect of the room.

After each condition, take two minutes to fill in its row before you move on.

| | A · Drifting | B · Gesture | C · Gesture and harmony |
| --- | --- | --- | --- |
| Minutes played | | | |
| Times you got stuck | | | |
| What you did when stuck | | | |
| A variation you wanted to keep | | | |
| Did you look at the screen while playing? | | | |
| C only: did you notice the readout? When? | — | — | |
| C only: did you try a chord it offered? Did you keep it? | — | — | |
| C only: did it ever cost you the phrase? | — | — | |
| One sentence on how it felt | | | |

## 4 · Two-key check (condition C)

This checks the new readout directly. Stay in C. Hold each chord for about a second, then move to the next. On the last chord, keep holding for a moment, then lift your hands. A readout with two keys stays about 1.5 s after you let go, then disappears.

| Try | Chords, in order | What the room should show on the last chord | Could you read it all? | Would you try either chord? |
| --- | --- | --- | --- | --- |
| 1 | G7 (G–B–D–F), Dm7 (D–F–A–C), Cmaj7 (C–E–G–B) | **Heard in C major: F** and **Heard in G major: G**, each with a keyboard | | |
| 2 | Cmaj7, Dm7, G7 | **Could be C major or G major**, **Try next C** | | |
| 3 | Dm7, G7, Cmaj7 | **Possible key C major**, **Try next F**. The room hears a ii–V–I, so it shows one key | | |

Press **Esc** and enter C again before each try, so earlier chords don't affect the reading.

Then play one four-chord loop you like, slowly. Two keys may appear on the third chord and clear on the fourth. Did you see them? ____________

## 5 · Save the log

In the console, before closing the tab:

```js
console.table(__roomLab.readouts().summary)
copy(__roomLab.readouts())
```

The first line prints one row per condition. The second copies the whole log, so you can paste it into a file next to this sheet. The log stays in the browser tab until you copy it; nothing is sent anywhere. Reloading the page clears it.

| Summary column | Meaning |
| --- | --- |
| `chords` | Chords the room recognised |
| `shown` | How many you could see. Always 0 in B |
| `offered` | Chords where the readout offered, or in B would have offered, something to try |
| `followed` | Of those, how many times the next chord you played matched an offer: same root and same major or minor colour, within 12 s |
| `twoKeys` | Readouts with two keys, split or merged |
| `followedFromTwoKeys` | Of those, how many you followed |

Condition A has no analysis, so it doesn't appear in the log.

## 6 · Afterwards

1. Go back to section 1 and mark each bar: met, not met, or can't tell.
2. Write down the one thing that surprised you.
3. Ask Claude, or whoever picks this up, to add an entry to [project memory](project-memory.md). It should separate what you said from what the log shows, and record which bars were met.

Then decide what happens to [PR #46](https://github.com/melissa-pereira-deel/harmonic-parser/pull/46): merge it, change the linger or when two keys may appear, or rethink the cue. The [alternatives](concepts/harmony-readout-alternatives.md) keep the options that were weighed.

## Limits of a single session

One sitting, one player and one motif can show whether something is clearly working or clearly in the way. They cannot show a small effect. The log treats a following chord as a response, which counts chords you would have played anyway; that is why B is there. The two-key readout appears for about one chord in common loops, so it may not come up at all in free playing. Section 4 makes sure it does.
