# Harmony readout: alternatives

*Harmonic Parser · Decision brief · 18 November 2026, revised after review the same day ([E014](../project-memory.md#e014--2026-11-18--specialist-review-of-the-next-chord-cue)) · Nothing here is decided.*

What should condition C show as its next-chord cue, and is a next chord the right cue at all? The first draft set out six options. A review from an interaction-design seat and a music-theory seat added a seventh fact, split option 5, and added two options that work over a melody. This brief sets them out with the reasoning, so the choice can be made later with the mocks in front of you.

**To see them:** `npm run dev`, then open `/explorer/`. Options 1 to 6 read the same typed progression through the real `rank()` and `suggest()`. The explorer's option 5 is 5b below. Options 5a, 7 and 8 are not mocked. The explorer is a development page and is not part of the build. Option 6 is a rough mock that assumes the current chord is held in root position. The explorer's options 1, 3, 4 and 6 always use the top-ranked key, while the room goes quiet when the reading is ambiguous and lets a heard cadence decide, so the mocks show more often than the room would.

## Where things stand

Condition C shows a text readout: **Chord**, **Possible key**, **Try next**. Three things about it matter here.

- **It goes quiet when the music is ambiguous.** In [`live.ts`](../../src/room/analysis/live.ts), an ambiguous or uncertain reading returns no key, and no key means no suggestion. The parser page treats ambiguity as a result worth showing. The room discards it.
- **It already contains an invitation.** The [concept brief](a-room-for-the-next-variation.md) says to treat invitations and next-chord suggestions as separate from reflection, so they don't blur what the comparison teaches. "Try next F" is an invitation inside the condition being compared. See [E008](../project-memory.md#e008--2026-11-08--minimal-harmony-readout), which added it as a local experiment.
- **The suggestion looks one chord back.** [`suggest()`](../../src/suggest.ts) is a rule table over the last chord and the chosen key. The repo calls it a baseline.

## From first principles

A cue is worth showing only if it gives a stuck player something new to *hear*, at a cost in attention they can afford. Seven facts about the situation, each from the brief, the project memory or the code:

| Fact | What it demands of a cue |
| --- | --- |
| The player works by ear and reports no formal theory. | It must read without vocabulary. Keys are the one notation everyone at a keyboard shares. |
| While playing, eyes and ears are busy. | It must be decodable in one glance, or wait for a pause. |
| The ear is the judge. The system cannot know what will sound right to this player. | It should offer and let the ear choose. It should never look like the answer. |
| The system knows little: an order-blind scorer, a one-chord rule table, two unmeasured thresholds. | How certain it looks must not exceed how certain it is. |
| The hand is already somewhere on the keyboard. | The cheapest suggestion to try is the smallest move from there. |
| The study compares conditions that differ by one thing. | A cue that changes two things at once cannot be credited or blamed. |
| The player starts from a melody and wants to keep it ([E002](../project-memory.md#e002--2026-11-07--playing-practice-and-the-study)). The room names a chord only when three or more held notes match a template ([`live.ts`](../../src/room/analysis/live.ts)). | It must have something to say over a single line, and it should vary what is under or around the motif, not replace it. |

None of options 1 to 6 passes all seven: each goes silent over a melody and each answers "what chord comes next" rather than "what could change under this phrase". Options 5 and 6 fail the fewest of the rest, and they fail different ones. Options 7 and 8 were added for the seventh fact. The brief's own example of an invitation is "the original phrase over a different low note" ([concept brief](a-room-for-the-next-variation.md)).

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
| 5a | Two centres | When two keys are close, both possible homes, as a felt centre first and a name only if wanted. No next chord | This is the brief's "second hearing": a reflection, so it belongs in condition C without blurring the study. Shows the system's doubt. | Needs a way to show a centre without key names. Depends on an unmeasured threshold. |
| 5b | Two hearings, next chord each | One suggestion when the key is clear, one per key when two are close, merged if they agree, nothing when no key fits. What the explorer mocks as option 5 | Uses the parser's core idea. Shows the system's doubt. Hands the choice to the ear. | An invitation, not the brief's second hearing. Twice as much to read, with key names. Needs a pause. Its forks mostly reflect the two rule tables, not the music (see the evidence below). |
| 6 | What moves | The next chord as a change from the held notes: which keys stay, which to let go, which are new. A slash bass is its own low voice | The only option of the first six that uses the hand. One moved finger is closer to something the player might have found unaided. On common pairs it finds the textbook smallest move. | Most work. Needs a voicing rule and the real held notes. Places each note on its own rather than pairing old with new. Unclear for a single-note melody. |
| 7 | A different low note | One bass key to try under the phrase as it is: a pedal, an inversion, a slash chord | The brief's own example of an invitation. One left-hand key. The motif is untouched. Works over a single line. Close to the drones in the player's references. | Not mocked. Needs the motif's recent notes, which the room's analysis does not keep: it only looks at notes held together. |
| 8 | Same note, another chord | The note the player is holding, shown under two or three chords that contain it, ranked by notes kept in common | Keeps the motif and changes its meaning. E as the 3rd of C, the 5th of Am, the 7th of Fmaj7. Computable from the existing templates. | Not mocked. A chord drawing again, so it carries the risks of options 3 and 4. |

On the loops: options 3 and 4 are the strongest quick fix. Option 2 removes the quick fix and adds nothing to the lower loop. Option 5b turns the cue from an answer into a question, because two candidates cannot be copied without listening to both. Option 6 shrinks the step. Options 7 and 8 keep the player's own phrase at the centre, so what is tried is still theirs.

Options 3 to 8, except 5a, all change what condition C tests. Each can run as an invitation in its own setting instead, which keeps the original comparison intact.

## Evidence for two hearings

`node tools/two-hearings-probe.ts` runs `rank()` and `suggest()` over 30 hand-picked common progressions and the 200 generated fixture cases, at four values of the margin. `AMBIGUITY_MARGIN` is 0.06.

| Margin | Common: two hearings (of 30) | Of those, different next chords | Fixture: two hearings (of 200) | Of those, different next chords |
| --- | --- | --- | --- | --- |
| 0.06 (today) | 1 | 1 | 57 | 41 |
| 0.10 | 6 | 3 | 94 | 65 |
| 0.12 | 20 | 11 | 108 | 77 |
| 0.15 | 22 | 13 | 130 | 95 |

- **On common progressions, two hearings would almost never appear today, and would appear on most of them at 0.12.** Many relative major and minor pairs sit about 0.11 apart. `Am F C G` is one, which matches the 0.105 that [`confidence-thresholds`](../../experiments/confidence-thresholds.spike.md) measured.
- **When two hearings appear, they usually disagree about the next chord, but mostly because of one rule.** At 0.12, 9 of the 11 disagreeing forks are the major table's "IV to I" against the minor table's "VI to V", which forces a major V (after `F` in A minor, `E` with its G♯). The disagreement measures the two rule tables more than the music.
- **The margin cannot hear where a loop starts.** `Am F C G`, `C G Am F`, `C Am F G` and `F C G Am` all score C major 0.935 and A minor 0.830, because the scorer ignores order. The textbook relative-key loop, `Am F C G`, merges: both readings suggest `C`.
- **The one fork at today's margin is a model quirk.** `Dm7 G7 Cmaj7` reads as C major or G major, 0.020 apart, because key profiles of this kind lean toward the dominant. The room's vote for a heard cadence would choose C, so live this fork would rarely appear.
- **This is an observation, not a spike.** No threshold was set before the numbers existed. The 30 progressions are one person's list, typed as symbols, and are not the calibration corpus [#15](https://github.com/melissa-pereira-deel/harmonic-parser/issues/15) asks for. Live playing goes through the room's own rules (three distinct chords, a vote for a heard cadence), which this did not exercise. The fixture is random chords, as `confidence-thresholds` already warned.

## Suggested sequence

A recommendation. Play first, then decide the goal, then the rule, then the information, then the numbers. Revised after review: step 0 is new, step 3 asks for cues on request rather than a fourth condition, and step 5 replaces "two hearings, then what moves".

0. **Play condition C once before anything changes.** No code. Run C as option 2, with a facilitator offering one of three cues at a stuck moment: (a) the rule-table next chord, (b) the same melody over a named low note, (c) end somewhere else or leave a gap. Write down beforehand what would count, for example that (b) is tried and kept at least twice as often as (a) and the player says the motif survived. Note where the stuck moment happens and whether it involves chords at all. The cue cards can be drawn with `keyboard.ts`.
1. **Settle the goal of condition C.** Either it reflects (option 2, perhaps with 5a) or it stays as shipped (option 1) for the comparison. What blurs the study is adding more invitation while the comparison runs.
2. **Put keyboards on the parser page.** A reading surface: no hands on keys, no study to disturb, no timing problem. It serves people who type symbols, not the room, so it can happen in parallel.
3. **Ask for invitations on request, apart from the study.** A pad on the KeyLab asks for a cue, in a separate session or a lab panel like the room's Motion panel ([E012](../project-memory.md#e012--2026-11-11--live-motion-comparison)). How often the player asks becomes the measure, and it removes both the timing problem and the risk of leaning on the screen. A fourth condition is the alternative, at the cost of more order effects with one player.
4. **Decide when a cue may appear.** At a pause or on request, before choosing how it looks. The phrase-colour mapping already detects a break in a phrase.
5. **Spike the cues that work over a melody.** An offline probe, shaped like `two-hearings-probe.ts`: given a motif's notes and the current bass, rank the low notes and chords that contain the motif by notes in common and semitone motion (options 7 and 8). Write its threshold first. Then show the best one at the key's place in the register, using `keyboardLayout`, and try what moves (option 6) with the real held notes.
6. **Measure the margin last, on played phrases.**

Steps 0 and 2 can happen now. Steps 1 and 3 to 6 are a direction.

## Risks that apply to every option

- **Both confidence thresholds are unmeasured**, and a single `C` chord clears both checks ([E001](../project-memory.md#e001--2026-11-07--initial-concept-and-repository-review)).
- **The scorer ignores chord order.** The room's cadence rule is the only part of key detection that hears order.
- **Silence over a melody.** The room names a chord only when three or more held notes exactly match a template, so options 1 to 6 all say nothing while the player plays a single line. A held colour tone or added note also fails the match, so the rough edge the references ask for makes the readout disappear. E008 noted this for the readout. It applies to every option here, not only to option 6.
- **A folded octave is a map of notes, not a hand position.** It also loses register: a slash bass is drawn above its root, and the field already maps register to horizontal position, which a keyboard centred at the bottom ignores. Option 6 addresses the hand. Nothing yet addresses register.
- **Sized for reading, not playing.** At the 22 px the explorer uses for options 3 and 5, a key is about 7 px wide and a pip about 3 px, and the whole drawing is under a degree of vision at a player's distance. Thresholds should be set by visual angle, measured at the rig, before a keyboard is judged.
- **Colour against the field.** The readout's tone colour sits close to the field's amber, which rises at pauses, the moment a cue would most likely appear. Idle keys on the explorer's room theme are about 1.9:1 (white) and 1.2:1 (black) against the readout's background.
- **Timing.** The readout lingers 700 ms and appears without a transition. Anything richer than a word needs a pause and needs to hold until the next phrase starts.

## Open questions

- Does the three-condition study run before any of this changes?
- Should "Try next" stay in condition C at all?
- What margin is right for live playing?
- When may a cue appear: on every settled chord, or only at a pause?
- Is option 6 worth a spike before committing to option 5?
- Do the keyboards go onto the parser page now, independent of the room decision?
- Is a next chord the help a stuck motif needs, or is it a different low note, another chord under the same note, or a change to the motif itself?
- Should invitations be asked for, with a pad, rather than offered?
