# Harmonic Parser project memory

This journal tracks the live playing exploration alongside the existing chord-symbol parser. The snapshot is the place to resume. The dated entries preserve what led there so we can revisit a decision without reconstructing it from chat.

## Current snapshot · 2026-11-18

- **User brief.** A private browser room for playing by ear. It opens to a fluid, slowly moving field of light, color and texture with no visible controls or copy. A connected MIDI keyboard can shape the field. Harmonic information should blend into the world when it appears. Its form and level of interaction are open.
- **Playing practice.** Find a melody by ear, repeat it, and vary the rhythm, phrasing, or notes. The hard moment comes once a motif feels worth keeping. How can it gain tension, find release, or acquire harmonic depth without losing what made it compelling? Theory vocabulary should be optional in the playing experience.
- **User-endorsed study.** Compare the same visual world in three conditions. A drifts independently. B responds to gestures. C keeps B's gesture response and adds occasional harmonic reflection and, since [E015](#e015--2026-11-18--two-hearings-in-condition-c), a next-chord invitation per plausible key. This is a study direction. No sessions or results have been recorded.
- **Working hypothesis.** Let the field acknowledge the hand immediately. Let a reading emerge at a moment that makes sense musically. Start by investigating whether a reflection helps the player hear another possibility in the same motif. The timing, cue and visual vocabulary are proposals.
- **Evidence from the parser.** The current browser app ranks major and minor keys from typed chord symbols. It uses an order-independent pitch-class profile. Its score thresholds are uncalibrated, and its suggestions use the last chord's root and the supplied key. See [scorer](../src/readings.ts#L247), [confidence experiment](../experiments/confidence-thresholds.spike.md), and [suggestion rules](../src/suggest.ts#L150).
- **Open.** Which kind of variation actually helps in a stuck moment, how the field carries a phrase through a rest, whether cues should appear on their own or by request, how much analysis is useful for melody-first playing, and where sound and MIDI come from in a real session. The renderer, parser integration and product scope are open.
- **Current brief.** [A room for the next variation](concepts/a-room-for-the-next-variation.md). Its listening references and study plan contain interpretations and proposals.
- **PoC preparation.** The [technical research](concepts/live-room-technical-research.md), [backlog](superpowers/plans/2026-11-07-live-room-poc.md), and [agent harness](superpowers/plans/live-room-agent-harness.md) are the handoff for a first build. The starting stack and the two-stage parser path are recommendations to verify during that build.
- **First implementation.** [Play the room and verify the rig](live-room-poc.md). The room has three comparable replay conditions, selected-port MIDI, and a lab-only connection to the real parser through annotated replay. The physical rig and listening comparison are open.
- **Field motion.** The user wants perceptible, organic variation in the field before playing, with TouchDesigner noise as the reference. Two layers of continuous noise shape the field on an independent clock. The user still sees an occasional flick. The lab's **Motion** panel lets the player compare Current and Gentle and adjust drift and strike response during a MIDI session. [Motion map](field-motion.md) · [E011](#e011--2026-11-11--gradient-motion-investigation) · [E012](#e012--2026-11-11--live-motion-comparison)
- **Phrase color.** In B and C, playing gradually shifts the palette toward violet with activity and toward amber at pauses and recognizable resolutions. The mapping is a proposed visual interpretation of timing and dynamics. The player's experience with a repeated motif is still open.
- **Keyboard setup.** The player's KeyLab Essential 49 exposes two inputs. The player confirmed that **Arturia KeyLab Essential 49 MIDI In** drives the field. The sound-route check and listening comparison are still open.
- **Live harmony exploration.** Condition C has a small chord, possible key and next-chord readout. It uses recognizable held voicings and recent chord history. When two keys are about equally likely it shows one suggestion per key, and each suggestion carries a small keyboard. Its timing and usefulness are open for a playing test. [Try it](live-room-poc.md)
- **Next-chord cue.** Decided for condition C, open beyond it. The user wants a next chord shown as a small keyboard instead of a symbol, and raised showing one suggestion per reading. Options for condition C are set out, with a development page that mocks six of them. A review then asked whether a next chord is the right help at all for a melody-first player, proposed playing condition C once before choosing, and added two cues that work over a melody: a different low note, and another chord under the same note. The user then chose option 5b for condition C: "Try next" stays during the comparison, as one suggestion per plausible key, drawn as a keyboard beside the chord name. It is wired into the room. The parser page is unchanged. Whether it helps is open. [Alternatives](concepts/harmony-readout-alternatives.md) · [E013](#e013--2026-11-18--chord-keyboards-and-the-next-chord-cue) · [E014](#e014--2026-11-18--specialist-review-of-the-next-chord-cue) · [E015](#e015--2026-11-18--two-hearings-in-condition-c)
- **First playing session.** Prepared, not run. A [session sheet](first-playing-session.md) proposes a bar to set before playing, the A/B/C comparison with one motif, a check of the two-key readout, and a lab log that compares what C offered and you followed with what B would have offered. [E016](#e016--2026-11-18--first-playing-session-prepared)
- **Typography.** The user chose Rubik for the live room's setup, controls, harmony readout and reflection. [Design system](design-system.md#typography)

## Journal

### E001 · 2026-11-07 · Initial concept and repository review

- **User direction.** Explore the experience before architecture and scope. The idle browser is an artwork in its own right. Playing should modulate it, and any parser response should feel like part of that environment. A small cue and a more interactive object were both raised as possibilities.
- **Observed.** Reviewed checkout `6c0d2b7`. `Am F G C` and `C F G Am` both scored C major 0.935 and A minor 0.830 to three decimals. A lone `C` chord also cleared the current margin and fit checks. These probes show why the live room needs its own judgment about when to offer a reading. The GitHub remote could not be reached during this review.
- **Proposed.** Separate the pace of gesture response from the pace of harmonic interpretation. Compare the same visual world with autonomous drift, gesture response, and gesture response plus reflection.

### E002 · 2026-11-07 · Playing practice and the study

- **User confirmed.** The three-condition experience study is worth exploring. The player starts with a melody that feels meaningful, repeats it, and experiments with cadence, rhythm, and adding or removing notes. The creative block is finding a way to develop the loop through tension, resolution, or harmonic depth. The player works by ear and reports no formal theory knowledge.
- **User references.** Björk, Aphex Twin, Boards of Canada, Arca, Moderat, Headache, Vegyn, Sonic Youth, Warpaint, and Blonde Redhead. The user described an experimental, passionate, technologically adventurous sensibility that moves between abstraction, complexity and simplicity.
- **Proposed.** Translate those references into musical operations such as timing drift, layers at different speeds, a changed bass note, a held rough edge, and small detail inside a quiet whole. Use one recognizable motif to compare the effects in a session. Test reflection separately from suggestions so the study can tell which intervention mattered.
- **Next evidence to gather.** A firsthand playing example with the point where the loop feels alive and the point where it starts to feel stuck. The first session can use listening notes and a manually timed cue if useful. Label any such cue as facilitated and keep it separate from evidence about the live analyzer.

### E003 · 2026-11-07 · Backlog, technical research and agent harness

- **User direction.** Prepare an exploratory backlog, research the functional and technical choices, and design how agents will implement and verify a first PoC.
- **Observed.** A clean archive of `6c0d2b7` on Node 24.21.0 passed typechecking, tests and build. Vitest reported 59 passes and five expected failures. The command sandbox could neither bind a loopback server nor complete a headless Chrome probe. Browser, GPU and physical MIDI acceptance need a suitable environment.
- **Proposed.** Reuse TypeScript and Vite with a separate browser entry, try WebGL2 and Web MIDI on the target desktop rig, and share one normalized input path between MIDI and deterministic replay. Start with a facilitated reflection for the experience comparison. Prove the real parser path with annotated replay and evaluate live-note interpretation separately. [Technical research](concepts/live-room-technical-research.md)
- **Proposed.** Start agent work with one shared contract, independently owned visual, input and replay packets, and a coordinator who integrates and verifies them. Use reproducible fixtures and an evidence ledger. Keep browser, hardware, and player judgments as distinct checks. [Backlog](superpowers/plans/2026-11-07-live-room-poc.md) · [Agent harness](superpowers/plans/live-room-agent-harness.md)

### E004 · 2026-11-07 · Discovery PR baseline

- **User direction.** Open a PR with the proposed backlog and discovery artifacts.
- **Observed.** The PR base `7b9b5d6` includes the hosted chord-page PoC, mode-aware suggestions and inversion figures. Typechecking and build passed, Vitest reported 101 passes and five expected failures, and the E001 ranking probes reproduced. The current verification counts supersede E003's baseline for the build handoff.
- **Implication.** Keep the live room as a separate experience study. The [backlog](superpowers/plans/2026-11-07-live-room-poc.md) includes a project-subpath smoke test so a future room entry can coexist with the [chord-page PoC](2026-11-05-poc-gap-analysis.md).

### E005 · 2026-11-07 · Agent-built live room

- **User direction.** After merging the discovery PR, proceed autonomously with an agent-led first build.
- **Observed.** Starting from `405b62c`, agents built the shared WebGL field, MIDI and replay paths, and annotated parser diagnostics. Browser checks exercised the built routes, A/B/C parity and cue lifetime, permission denial and disconnect with a mock input, and WebGL context loss and recovery. [Run and verify](live-room-poc.md)
- **Observed.** In the [synthetic note comparison](../experiments/live-room-note-evidence.spike.md), both methods could change keys after an unresolved phrase had stopped. The sounding-note method also named a key over the sparse melody, while the held-triad method missed the rolled harmony.
- **Decision for this build.** Keep parser candidates in the lab and use a facilitated cue for C. The player's real MIDI and sound route, useful and quiet phrase windows, and the A/B/C playing comparison are the next evidence.

### E006 · 2026-11-08 · Perceptible motion at rest

- **User direction.** The initial veil looked static. Make its background color and shape move organically, as with noise in TouchDesigner.
- **Observed.** The user's browser was rendering WebGL2 with Reduced Motion off. In a fixed-frame Chrome probe the original shader averaged 1.45 levels of RGB-channel change over two seconds. Its time offset was small, and its palette was fixed.
- **Proposed adjustment.** Sample two spatial scales of 3D noise through time and use them for both fold displacement and a muted indigo-to-teal shift. In Chrome the revised field cleared the test's two-second change threshold, stayed below its short-interval change limit, and held still at idle with Reduced Motion enabled. The user still needs to judge how the pace feels in the room. [Renderer](../src/room/visual/renderer.ts) · [Browser check](../e2e/live-room.spec.mjs)

### E007 · 2026-11-08 · KeyLab input discovery

- **Observed.** macOS and the preview browser listed the KeyLab Essential 49's **MIDI In** and **DAW In** ports. With two inputs, room setup waits for an explicit choice. Selecting **MIDI In** opened the port and enabled **Enter room** in condition B.
- **Open.** Verify that played notes move the field and the player's usual instrument or synth sounds at the same time.

### E008 · 2026-11-08 · Minimal harmony readout

- **User confirmed.** Playing the KeyLab changes the background animation.
- **User direction.** Explore showing the current chord, key and what could come next in an extremely minimal interface.
- **Proposed adjustment.** Condition C shows a small readout after a recognizable voicing settles. A possible key and one rule-based next chord appear only after a short sequence supplies enough evidence. A separate chord replay exercises the same live detector without requiring a keyboard. This revises E005's lab-only decision for the local experiment.
- **Open.** Test which voicings the player uses and whether the readout helps them vary a motif. Key suggestions are provisional. A melody without overlapping chord tones can leave the readout quiet.

### E009 · 2026-11-11 · Continuous drift and phrase color

- **User direction.** The field sometimes flicks or seems to reach the end of a short loop. Make it fluid and let the colors change gradually with the feeling of the playing, including rhythm and cadence.
- **Observed.** The field used the session clock, which resets on entering the room, opening setup and resuming a replay. A repeating sweep also drove the whole fold, and raw gesture values could step between frames. This revises the motion treatment in [E006](#e006--2026-11-08--perceptible-motion-at-rest).
- **Proposed adjustment.** Use separate, continuous paths through the noise volume and give the field its own clock. Let nearby note attacks count as one onset. Map stronger or more frequent attacks toward violet, and give a break in a phrase or a supported harmonic resolution a slower amber response. B and C share this mapping. [Renderer](../src/room/visual/renderer.ts) · [Design system](design-system.md#field-palette-and-motion)
- **Verified.** Chrome's field clock continued across entering the room and returning to setup. At matching replay times and noise positions, rendered B frames shifted toward violet during the phrase and became warmer after the pause. This used the chord replay. [Browser checks](../e2e/live-room.spec.mjs)
- **Open.** Play a familiar motif on the KeyLab at different speeds and dynamics, then leave a pause. Check whether the transition feels like it follows the phrase and whether the field still seems to return to the same shape.

### E010 · 2026-11-11 · Live room typography

- **User direction.** Give the room a more Helvetica-like feel using Rubik.
- **Implementation.** The room serves Rubik locally. Body text and labels use regular weight, and the setup title and current chord use medium weight. [Room CSS](../src/room/room.css)

### E011 · 2026-11-11 · Gradient motion investigation

- **User direction.** Investigate the recurring flick from first principles and map the controls for pace, irregularity and response.
- **Observed.** The independent clock from [E009](#e009--2026-11-11--continuous-drift-and-phrase-color) addresses setup resets. An idle Chrome probe reproduced a different effect. The bright contour can split or rejoin as the noise bends it. A controlled hard note produced a much larger pixel change in its first frame, especially when that frame was delayed.
- **Proposed.** Compare the current field with a development-only Gentle variant. Its lower warp removed contour splits in the sampled minute. Lower strike displacement and a longer attack reduced the largest first-frame changes in the simulated MIDI probe. [Motion map and controls](field-motion.md)
- **Open.** Identify which behavior matches the user's flick on their browser and KeyLab. Compare responsiveness and drift before choosing a production setting.

### E012 · 2026-11-11 · Live motion comparison

- **User direction.** Add a small lab panel to adjust speed, warp, detail and strike response with the KeyLab and compare Current and Gentle without reloading.
- **Implementation.** A collapsible panel applies presets and slider changes in the current session. Changes ease from the values currently on screen. Speed changes advance or hold the existing phase. Strength and attack have independent controls. [Motion panel](field-motion.md#controls-to-try)
- **Open.** Compare the two presets on the physical KeyLab and record the motion and response settings that feel best.

### E013 · 2026-11-18 · Chord keyboards and the next-chord cue

- **User direction.** Show a next chord as a flat, minimal keyboard that marks its keys with colour and perhaps a small dot, as a system that can be resized to explore the UI as the rooms evolve. Then: could the room show a next chord per reading? Write the alternatives down to decide later, mock what can be mocked, and open a PR.
- **Implementation.** [`src/keyboard.ts`](../src/keyboard.ts) draws any parsed chord as an SVG sized by one number, with detail that drops away as it shrinks and colours set by the surface it sits on. It is tested and unused: no shipped page imports it. A development page at `/explorer/` mocks six readouts for condition C on the real `rank()` and `suggest()`.
- **Observed.** At the current `AMBIGUITY_MARGIN` of 0.06, 1 of 30 hand-picked common progressions reads as two hearings; at 0.12, 20 do. On the generated fixture at 0.06, 41 of 57 two-hearing cases suggest different next chords. `node tools/two-hearings-probe.ts` reproduces this. It is an observation with no threshold set in advance, on typed symbols, and says nothing yet about played phrases.
- **Observed.** Condition C returns no key and no suggestion when the reading is ambiguous ([`live.ts`](../src/room/analysis/live.ts)), so the room is quiet where the parser page has the most to say.
- **Proposed.** Treat every keyboard as an invitation, which [E002](#e002--2026-11-07--playing-practice-and-the-study) asked to test separately from reflection. Keep condition C as it is, or remove "Try next", while the three conditions are compared. Put keyboards on the parser page first. Explore two hearings and a "what moves" cue in a fourth condition, and decide when a cue may appear before how it looks. [Alternatives and reasoning](concepts/harmony-readout-alternatives.md)
- **Open.** All of the above. The user has not chosen an option, and has not said whether "Try next" from [E008](#e008--2026-11-08--minimal-harmony-readout) stays in condition C.

### E014 · 2026-11-18 · Specialist review of the next-chord cue

- **User direction.** Analyse PR #46 with an interaction-design reviewer and a music theorist and composer, against the project's goals, the player's job and the architecture, and think critically about what it adds and how to approach it. Then update the PR to reflect the review.
- **Observed.** All six options in [E013](#e013--2026-11-18--chord-keyboards-and-the-next-chord-cue) are silent over a single-line melody, because [`live.ts`](../src/room/analysis/live.ts) names a chord only when three or more held notes exactly match a template. An added colour tone fails the match too.
- **Observed.** The two-hearings numbers mostly describe the model. All four rotations of `Am F C G` score C major 0.935 and A minor 0.830. The one fork at 0.06 is `Dm7 G7 Cmaj7`, C major or G major 0.020 apart, which the room's cadence vote would settle. `Am F C G` merges because both readings suggest `C`. At 0.12, 9 of the 11 disagreeing forks come from the minor table's "VI to V" rule against the major table's "IV to I". Reproduced on `rank()` and `suggest()` at `0d18237`.
- **Observed.** The concept brief defines a second hearing as a reflection, "two felt centres and optional names". Option 5 as mocked attaches a next chord to each reading, which makes it an invitation. The brief's own example of an invitation is the same phrase over a different low note.
- **Observed.** At the 22 px the explorer uses for options 3 and 5, a key is about 7 px wide and a root pip about 3 px. Pips meant root and bass on a chord but arrive and leave in "what moves". The mock's sentence broke when nothing left or nothing arrived, and it dropped a slash bass, so `C` to `C/E` read as no change. These were fixed in the PR: pips now mean root and bass only, a slash bass is its own low voice, and the sentence covers every case.
- **Proposed.** Play condition C once, as option 2 with a facilitated cue, before choosing a drawing. Rotate three cues at a stuck moment: the rule-table next chord, the same melody over a named low note, and ending elsewhere or leaving a gap, with the success threshold written first. Ask for invitations with a KeyLab pad, in a lab panel like Motion, rather than adding a fourth condition. Spike an offline ranking of low notes and chords that contain a motif. Split option 5 into 5a (two centres, a reflection) and 5b (a next chord per reading), and add option 7 (a different low note) and option 8 (same note, another chord). [Alternatives](concepts/harmony-readout-alternatives.md)
- **Open.** Whether a next chord is the help a stuck motif needs. Which cue, if any, the player wants. Whether invitations should be offered or asked for. The user has not chosen; this revises E013's suggested sequence but decides nothing.

### E015 · 2026-11-18 · Two hearings in condition C

- **User confirmed.** "Try next" stays in condition C during the three-condition comparison. It changes from one suggestion to one suggestion per plausible reading, each drawn as a small keyboard beside the chord name. Conditions A and B do not change. The reasons given: the room was silent exactly where the parser has most to say, and a single drawn chord looks like the answer, while one per key shows the system's doubt and leaves the choice to the ear.
- **Revises.** This makes condition C test reflection plus invitation. It revises the separation proposed in [E002](#e002--2026-11-07--playing-practice-and-the-study) and [E013](#e013--2026-11-18--chord-keyboards-and-the-next-chord-cue), and E014's proposal to keep C as reflection only or to ask for cues on request. Their reasoning stands: a comparison of A, B and C can no longer separate the effect of reflection from the effect of an invitation. The user chose to accept that.
- **Implementation.** [`readHarmony()`](../src/room/analysis/live.ts) returns one of four states from `assess()` as it is: chord only, clear, two hearings, or merged when both keys suggest the same chord. The room's rules for naming a key are unchanged: at least three distinct chords, and a heard cadence still settles the reading. `AMBIGUITY_MARGIN` and `UNCERTAINTY_FLOOR` are unchanged. Keyboards use `keyboardSvg()` at 22 px, coloured from the room's existing palette. A one-key readout still lingers 700 ms after the hands lift; a readout with two keys lingers 1.5 s (`TWO_HEARINGS_LINGER_MS`), roughly double for twice as much to read and under the facilitated reflection's 2.1 s.
- **Observed.** The cadence vote absorbs the only common progression the parser reads as ambiguous at 0.06: played as `Dm7 G7 Cmaj7`, the room hears a ii–V–I and shows C major alone. The same chords as `G7 Dm7 Cmaj7` show two hearings (C major → F, G major → G), and as `Cmaj7 Dm7 G7` they merge on C. Through the room's rules, read after each chord, 8 of the 30 common progressions in [`two-hearings-probe.ts`](../tools/two-hearings-probe.ts) show two hearings at some chord and 5 merge; all 30 are clear at their last chord. Two keys appear on the third chord, the first moment a key can be named, and the fourth settles them. On a repeated loop the chord history keeps the reading clear. Unit and browser tests pass, including A and B showing no readout and no keyboard for the same playing.
- **Open.** Whether one suggestion per key helps a player vary a motif, and at what attention cost. Whether a two-key readout that appears for one chord and clears on the next is readable at all while playing. Whether 1.5 s is the right linger. The physical playing session, the margin for live playing, and E014's questions about melody-first cues remain open.

### E016 · 2026-11-18 · First playing session prepared

- **User direction.** After E015, the recommended next step was to play the room on the KeyLab before changing the readout further. The user asked for a session sheet and a lab log to support it.
- **Implementation.** [First playing session](first-playing-session.md) is a fill-in sheet: a bar to set before playing, about 10 minutes each in A, B and C with the same motif, a scripted two-key check in C, and how to save the log. With `?lab=1` and MIDI input, [`readout-log.ts`](../src/room/readout-log.ts) records each chord the room recognises, what the readout offered, whether it was shown, and whether the next different chord within 12 s matched an offer by root and major or minor colour. B is logged with the offers it computes but never shows, as a baseline for chords the player would have chosen anyway. A has no analysis and is not logged. Nothing leaves the tab.
- **Proposed.** The four bars in the sheet (readable, useful, affordable, different from B) are suggestions for the user to confirm or edit before playing.
- **Open.** The session has not been run. The bar has not been confirmed. One session can show a clear effect or a clear cost, not a small one.

## How to continue

Append an entry with the next ID, date, what changed and why, and a pointer to the chat, artifact, or observation when available. Use **User confirmed**, **Observed**, **Proposed**, or **Open** so an idea stays distinguishable from a decision. When a later entry revises an earlier one, say which entry it revises and what evidence or preference changed. Update the snapshot to reflect the new state.
