# Live room PoC backlog and implementation plan

> For agentic workers, use the [agent harness](live-room-agent-harness.md) with `superpowers:subagent-driven-development` or `superpowers:executing-plans` as appropriate. Tasks use checkboxes. Complete the shared contract before dispatching dependent implementation.

**Goal.** Run one room with three comparable playing conditions and learn whether gesture or harmonic reflection helps the player vary a melody by ear.

**Architecture.** A second browser entry presents a shared scene. MIDI and replay go through one gesture reducer. Cue delivery is a separate channel, and the room can use either a facilitated cue or a candidate from the real parser under an explicitly labeled lab path.

**Tech stack.** TypeScript, Vite, Web MIDI, a WebGL2/GLSL candidate scene, CSS fallback, Vitest and a small Playwright suite. Node 24 is the starting environment.

**Basis.** [Experience brief](../../concepts/a-room-for-the-next-variation.md) · [Technical research and draft functional contract](../../concepts/live-room-technical-research.md) · [Project memory](../../project-memory.md)

## PoC boundary

- Three conditions share one field and one sound setup. A drifts, B adds gesture response, and C adds occasional reflection with B's gesture response. The field takes the full screen in playing mode, with setup recoverable by keyboard.
- The player can use their usual instrument and a reproducible replay can run without a device. Sparse melody, deliberate rests and an unresolved phrase are first-class inputs.
- The first playable study can use a facilitated cue. A separate vertical slice must use the repository's real parser on annotated input, with its limitations visible. Live-note cue eligibility is an experiment with its own gate.
- Current scope is a local browser experiment alongside the [hosted chord-page PoC](../../2026-11-05-poc-gap-analysis.md). Future work such as microphone input, generated accompaniment, persistent session history, and additional browsers has separate evidence requirements.

## Start here

| Sequence | Track | What it unlocks |
| --- | --- | --- |
| 1 | POC-00 | Shared types, launch commands, gates and ownership |
| 2 | POC-01, POC-02 and POC-03 in parallel | One scene, one live adapter, and a reliable replay source |
| 3 | POC-04 then POC-05 | Playable A/B/C with one cue, a browser smoke test and real-keyboard check |
| 4 | POC-06 and POC-07 in parallel once their inputs exist | Experience evidence and a real parser integration result |
| 5 | POC-08 after POC-07, and POC-09 when evidence is in | Decide which technical and experience bets to carry forward |

## P0 · Make the same room playable three ways

### POC-00 · Set the contract and preserve a baseline

**Owner** · Coordinator. **Depends on** · Concept brief and technical research.

- [ ] Capture the source revision and output of `npm ci`, `npm run typecheck`, `npm test` and `npm run build` on the intended build host. The documented baseline at `7b9b5d6` has 101 passes and five expected failures.
- [ ] Settle the initial event, frame and cue contracts from the [technical research](../../concepts/live-room-technical-research.md#functional-contract-to-settle-first). Own `room/index.html`, the Vite entry configuration and `src/room/contracts.ts`. Prove both HTML entries are emitted and open locally. Smoke-test the production build under a project subpath to preserve the chord page's existing Pages layout.
- [ ] Set up the execution ledger, initial fixtures and dispatch cards from the [agent harness](live-room-agent-harness.md). Pin the study conditions and target rig assumptions. Determine the real audio source with a short manual check before the player session. A synthetic input track can proceed independently.

### POC-01 · Explore the visual material and build one scene

**Owner** · Visual worker. **Depends on** · Frame contract from POC-00.

- [ ] Make two treatments of the same movement using the same short synthetic trace. Try a soft field with local light displacement and a field with a faint lingering trace. Compare the idle field, first note and a return to silence. Give the coordinator paired fixed-frame captures and a short moving capture.
- [ ] Carry the chosen treatment through one WebGL2 renderer under `src/room/visual/`. Use separate inputs for baseline drift and gesture influence. Make the static CSS field available for context failure, and a subdued setting for reduced motion.
- [ ] Demonstrate a field that starts quietly, visibly distinguishes a soft and harder strike, and settles after the fixture. Verify a documented viewport and resize. If neither treatment preserves the intended feel inside the first render budget, simplify the field or compare Canvas 2D before adding scene complexity.

### POC-02 · Receive physical MIDI and recover cleanly

**Owner** · Input worker. **Depends on** · Event contract from POC-00.

- [ ] Implement the selected-port adapter and pure gesture reducer under `src/room/input/`. Request permission only from setup. Cover ready, unsupported, denied, no-device and disconnected states.
- [ ] Verify note-on/off and velocity-zero release, CC64 hold and release, retrigger, ignored messages, and reset on input change, disconnect and suspension. Use an injected MIDI-shaped adapter for permission and disconnect tests. Assert that stale messages cannot add notes after a source switch.
- [ ] Hand back an input snapshot that distinguishes physically held notes from pedal-held notes. Include a short real-device checklist for the integrator. Hardware evidence is collected in POC-05.

### POC-03 · Replay the same musical input on demand

**Owner** · Replay and verification worker. **Depends on** · Event contract from POC-00.

- [ ] Own `src/room/replay/` and `test/fixtures/live-room/`. Add a versioned synthetic trace for soft/hard attacks, sustain/release, a rest and a repeated motif with a changed bass note. Keep notes and cues as separate tracks.
- [ ] Expose play, reset and sample-at-time for development and verification. Feed replay events through the same normalized consumer as MIDI. Assert that repeating the same seeded fixture and time produces the same event order, state and cue eligibility.
- [ ] Produce a small browser-test starter and failure traces if a browser-capable runner is available. Verify deterministic state in Node as well so renderer differences do not mask event regressions.

### POC-04 · Integrate the study conditions and one cue

**Owner** · Coordinator. **Depends on** · POC-01, POC-02 and POC-03.

- [ ] Wire the room entry, setup, and one condition per fresh run. Exit and re-entry reset gesture and cue state. Keep controls out of playing mode and make setup reachable by keyboard. A blocked device leaves the scene and replay available.
- [ ] In A, feed zero gesture influence and suppress cues. In B and C, feed the same gesture state. In C only, support a facilitator trigger and a fixture-driven cue with a finite lifetime and accessible wording. Start with one short observation such as “Same phrase, different bass.” Keep origin and timing in the study notes or lab.
- [ ] Verify with a fixed replay time that A receives baseline state, B and C match before a cue, and only C receives and removes the cue. Verify reset, setup reachability, and a route smoke for both built HTML pages.

### POC-05 · Check the intended playing rig

**Owner** · Coordinator with the player. **Depends on** · POC-04.

- [ ] Run in real desktop Chrome with the player's MIDI keyboard and normal sound. Log browser, OS, refresh rate, viewport and whether the synth can share the MIDI input. Check first-run permission, playing and recovery after unplug/replug. Keep replay available for diagnosis.
- [ ] Collect foreground gesture and frame measurements from the [technical research](../../concepts/live-room-technical-research.md#measurement-and-risks). Compare frame cadence across all three conditions at the same render scale and measure gesture response in B and C. Record missed responses and whether an attack feels attached to the hand. If the first target misses, investigate the rendering path and physical setup before interpreting the study.

## P1 · Learn what the room adds and connect the parser

### POC-06 · Run the first playing comparison

**Owner** · Coordinator with the player. **Depends on** · POC-05.

- [ ] Use the same room and sound for A, B and C. Begin with free playing, then bring the same ear-found motif into each condition. Record order, the first intentional variation, what felt worth keeping, and any glance that interrupted or supported playing. Change order on a later pass to check warm-up and familiarity.
- [ ] Log the facilitated cue, the point it arrived, and what the player tried afterward. Keep the cue descriptive for this comparison. Save a short result and decide whether to keep, change or drop the cue before trying invitations or richer UI.

### POC-07 · Prove a real parser connection with annotated replay

**Owner** · Parser worker. **Depends on** · POC-00 and the fixture interface from POC-03.

- [ ] Own `src/room/analysis/` and its tests. Use a replay fixture that explicitly includes ordered chord labels at known times. Parse the supplied labels through `parseProgression` and reuse `rank` for candidates. Keep the existing chord app's APIs and scores intact.
- [ ] Show in the lab when a candidate becomes available, the source chord span, and why the public cue stayed quiet. Test a clean chord example, no labels, and a single-chord case that can rank but is ineligible for a public tonal claim.
- [ ] Deliver a screenshot or replay trace from the local provider. Label the chord annotations and keep the result distinct from live chord recognition. A missed browser proof is recorded separately from passing pure tests.

### POC-08 · Compare live-note evidence against listening

**Owner** · Parser worker with player annotations. **Depends on** · POC-07.

- [ ] Run a timeboxed comparison of recent-note profiles and conservative held-triad recognition. Include sparse melody, bass changes under the same motif, rolled or sustained notes, a clear loop, an intentionally open ending, and a change of center. Keep a short sample of the player's own material with permission or use a written description of it.
- [ ] Record when each method would speak, withhold or change its mind. Check candidate readings against the player's hearing and keep disagreements. Before measuring, record the criterion and the consequence of a miss in the [existing spike format](../../../experiments/README.md).
- [ ] Start from this proposed criterion for an automatic cue. Annotate six windows where a specific observation would help and four where the room should stay quiet, using material held out from tuning. Require a usable observation within the annotated window on at least five of the six, and silence in all four quiet windows. If the sample is unavailable or the criterion fails, keep the provider in the lab for this round. Treat a pass as a reason to try the cue, with musical usefulness still checked at the keyboard.
- [ ] Recommend an observation, a harmonic candidate in the lab, or continued facilitated reflection. Add an automatic C cue only after the selected claim and timing have evidence on the player examples and there is a passing withholding case.

### POC-09 · Close the loop

**Owner** · Coordinator. **Depends on** · POC-06 and POC-08 evidence or a recorded reason the latter was deferred.

- [ ] Update [project memory](../../project-memory.md) with the comparison, technical outcome, and links to the relevant runs. Preserve earlier hypotheses when a result supersedes them.
- [ ] Choose the next bet using the evidence. Keep the current field if gesture helps, compare a new mapping if the connection is weak, and invest in live reflection if the cue contributed to playing and the parser path can earn it.

## Exploration queue

| Question | Cheapest useful comparison | Bring forward when |
| --- | --- | --- |
| How much history should the field retain? | Same motif with short decay versus a trace that survives the next loop. | Repetition feels visually disconnected or the field becomes busy. |
| Which gesture should be most legible? | Compare a register-sensitive mapping with a strike-sensitive one using the same phrase and art. | Player can sense the visual change but cannot deliberately reproduce it. |
| How should a cue come into view? | Compare blended type and a quiet glass-like surface with identical words and timing. | Reflection helps but is hard to notice, read, or ignore. |
| Would a playable invitation help when stuck? | Compare an observation with a single optional invitation, such as changing the bass note. | The player wants a direction at a specific moment and the reflection baseline is understood. |
| Does spatial depth matter? | Compare shader depth with a small actual 3D or particle scene driven by the same frame input. | The player can describe a missing musical or visual relationship that depth could convey. |

## Review focus

- A replay with sustain and a device switch must not leave notes held. POC-02 and POC-04 own the regression checks.
- A sparse motif must not be promoted to a confident key label. POC-07 and POC-08 own the evidence and policy.
- C must preserve B's gesture response. POC-04 verifies parity with one fixture and one clock.
- A successful source adapter test can coexist with a permission or device-sharing failure on the intended rig. POC-05 owns that distinction.
- Reduced motion, unavailable WebGL and keyboard-only setup should remain operable. POC-01 and POC-04 own the recovery checks.
