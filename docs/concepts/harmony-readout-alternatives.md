# Harmony readout: alternatives

*Harmonic Parser · Decision brief · 18 November 2026 · Nothing here is decided.*

What should condition C show as its next-chord cue? Six options are on the table. This brief sets them out with the reasoning, so the choice can be made later with the mocks in front of you.

**To see them:** `npm run dev`, then open `/explorer/`. All six read the same typed progression through the real `rank()` and `suggest()`. The explorer is a development page and is not part of the build. Option 6 is a rough mock that assumes the current chord is held in root position.

## Where things stand

Condition C shows a text readout: **Chord**, **Possible key**, **Try next**. Three things about it matter here.

- **It goes quiet when the music is ambiguous.** In [`live.ts`](../../src/room/analysis/live.ts), an ambiguous or uncertain reading returns no key, and no key means no suggestion. The parser page treats ambiguity as a result worth showing. The room discards it.
- **It already contains an invitation.** The [concept brief](a-room-for-the-next-variation.md) says to treat invitations and next-chord suggestions as separate from reflection, so they don't blur what the comparison teaches. "Try next F" is an invitation inside the condition being compared. See [E008](../project-memory.md#e008--2026-11-08--minimal-harmony-readout), which added it as a local experiment.
- **The suggestion looks one chord back.** [`suggest()`](../../src/suggest.ts) is a rule table over the last chord and the chosen key. The repo calls it a baseline.

## From first principles

A cue is worth showing only if it gives a stuck player something new to *hear*, at a cost in attention they can afford. Six facts about the situation, each from the brief, the project memory or the code:

| Fact | What it demands of a cue |
| --- | --- |
| The player works by ear and reports no formal theory. | It must read without vocabulary. Keys are the one notation everyone at a keyboard shares. |
| While playing, eyes and ears are busy. | It must be decodable in one glance, or wait for a pause. |
| The ear is the judge. The system cannot know what will sound right to this player. | It should offer and let the ear choose. It should never look like the answer. |
| The system knows little: an order-blind scorer, a one-chord rule table, two unmeasured thresholds. | How certain it looks must not exceed how certain it is. |
| The hand is already somewhere on the keyboard. | The cheapest suggestion to try is the smallest move from there. |
| The study compares conditions that differ by one thing. | A cue that changes two things at once cannot be credited or blamed. |

No option passes all six. Options 5 and 6 fail the fewest, and they fail different ones.

## The room as a system

The risk in a next-chord cue is the pattern systems thinking calls *shifting the burden*: a quick fix that relieves a problem while weakening the slower process that would solve it for good.

```
            ┌──────────────────────────┐   builds
            │  Play what the cue shows │ ───────────┐
            └──────────────────────────┘            ▼
        prompts ▲          │ eases, now   ┌────────────────────────┐
                │          ▼              │ Reliance on the screen │
            ┌──────────────────────────┐  └────────────────────────┘
            │     Stuck on a motif     │            │
            └──────────────────────────┘            │
        prompts │          ▲ eases, slowly          │ weakens
                ▼          │                        │
            ┌──────────────────────────┐            │
            │  Find a variation by ear │ ◀──────────┘
            └──────────────────────────┘
```

Being stuck prompts two responses. Playing what the screen shows eases it now. Finding a variation by ear eases it slowly and leaves the player more able next time. Each time the cue answers, the player leans on it a little more and explores by ear a little less. The brief's own goal, that the next decision still happens at the keyboard, says the lower loop is the one the room exists to strengthen.

This is a model of the risk, not a measurement. No sessions have been run.

Two more dynamics:

- **Delay.** The reading describes what was just played. A chord settles after 125 ms and a key needs three distinct chords, so a cue that arrives mid-phrase is information about the past. *When* a cue may appear matters more than how it looks.
- **Trust.** A confident drawing that sounds wrong teaches the player to ignore the readout. A cue that shows its own doubt loses less when it misses.

Where the leverage is, in rising order, after Donella Meadows' places to intervene in a system:

1. **Parameters.** The ambiguity margin, the size of the keys. The evidence below shows the margin alone swings option 5 from rare to constant, so tuning it first would be optimising a system whose purpose is undecided.
2. **Information flows.** What the player can see. Today the room hides ambiguity. Option 5 adds that flow. Option 6 adds the flow from the hand.
3. **Rules.** When a cue may appear: on every settled chord, only at a pause, or only when asked.
4. **Goal.** Whether condition C exists to reflect or to invite. Every option is downstream of this.

## The options

| # | Option | What it shows | For | Against |
| --- | --- | --- | --- | --- |
| 1 | Text readout | Chord, Possible key, Try next, as shipped | Nothing to build. Fastest glance. The study runs as planned. | A chord symbol is vocabulary. Silent when ambiguous. Keeps an invitation inside reflection. |
| 2 | No "Try next" | Chord and Possible key only | The cleanest study. The room reflects and never instructs. | Gives a stuck player nothing new to hear. |
| 3 | Keys beside the name | The same suggestion with a small keyboard | Serves symbol readers and ear players. Teaches the name through the shape. | A louder invitation. One drawn chord looks like the answer, from a rule that saw one chord. |
| 4 | Keys alone | The keyboard, no name | Most direct by ear. | No name to remember or say. Slower for anyone who reads symbols. |
| 5 | Two hearings | One suggestion when the key is clear, one per key when two are close, merged if they agree, nothing when no key fits | Uses the parser's core idea. Matches the brief's "second hearing". Shows the system's doubt. Hands the choice to the ear. | Twice as much to read. Needs a pause. Depends on an unmeasured threshold. Still an invitation. |
| 6 | What moves | The next chord as a change from the held notes: which keys stay, which to let go, which are new | The only option that uses the hand. One moved finger is closer to something the player might have found unaided. | Most work. Needs a voicing rule. Unclear for a single-note melody. |

On the loops: options 3 and 4 are the strongest quick fix. Option 2 removes the quick fix and adds nothing to the lower loop. Option 5 turns the cue from an answer into a question, because two candidates cannot be copied without listening to both. Option 6 shrinks the step.

Options 3 to 6 all change what condition C tests. Each can run as a fourth condition instead, which keeps the original comparison intact.

## Evidence for two hearings

`node tools/two-hearings-probe.ts` runs `rank()` and `suggest()` over 30 hand-picked common progressions and the 200 generated fixture cases, at four values of the margin. `AMBIGUITY_MARGIN` is 0.06.

| Margin | Common: two hearings (of 30) | Of those, different next chords | Fixture: two hearings (of 200) | Of those, different next chords |
| --- | --- | --- | --- | --- |
| 0.06 (today) | 1 | 1 | 57 | 41 |
| 0.10 | 6 | 3 | 94 | 65 |
| 0.12 | 20 | 11 | 108 | 77 |
| 0.15 | 22 | 13 | 130 | 95 |

- **On common progressions, two hearings would almost never appear today, and would appear on most of them at 0.12.** Many relative major and minor pairs sit about 0.11 apart. `Am F C G` is one, which matches the 0.105 that [`confidence-thresholds`](../../experiments/confidence-thresholds.spike.md) measured.
- **When two hearings appear, they usually disagree about the next chord.** So the fork is rarely redundant.
- **This is an observation, not a spike.** No threshold was set before the numbers existed. The 30 progressions are one person's list, typed as symbols, and are not the calibration corpus [#15](https://github.com/melissa-pereira-deel/harmonic-parser/issues/15) asks for. Live playing goes through the room's own rules (three distinct chords, a vote for a heard cadence), which this did not exercise. The fixture is random chords, as `confidence-thresholds` already warned.

## Suggested sequence

A recommendation. Decide the goal, then the rule, then the information, then the numbers.

1. **Settle the goal of condition C.** Either it reflects (option 2) or it stays as shipped (option 1) for the comparison. What blurs the study is adding more invitation while the comparison runs.
2. **Put keyboards on the parser page.** A reading surface: no hands on keys, no study to disturb, no timing problem.
3. **Give invitations their own condition.** So "does an invitation help?" is asked separately from "does reflection help?".
4. **Decide when a cue may appear.** At a pause or on request, before choosing how it looks.
5. **Build two hearings there, then try what moves inside it.** Option 5 is mocked on real code and needs no new input. Option 6 needs a voicing rule and the held notes.
6. **Measure the margin last, on played phrases.**

Steps 1 and 2 can happen now. Steps 3 to 6 are a direction.

## Risks that apply to every option

- **Both confidence thresholds are unmeasured**, and a single `C` chord clears both checks ([E001](../project-memory.md#e001--2026-11-07--initial-concept-and-repository-review)).
- **The scorer ignores chord order.** The room's cadence rule is the only part of key detection that hears order.
- **A folded octave is a map of notes, not a hand position.** Only option 6 addresses that.
- **Timing.** The readout lingers 700 ms. Anything richer than a word needs a pause, and the room does not yet detect one for this purpose.

## Open questions

- Does the three-condition study run before any of this changes?
- Should "Try next" stay in condition C at all?
- What margin is right for live playing?
- When may a cue appear: on every settled chord, or only at a pause?
- Is option 6 worth a spike before committing to option 5?
- Do the keyboards go onto the parser page now, independent of the room decision?
