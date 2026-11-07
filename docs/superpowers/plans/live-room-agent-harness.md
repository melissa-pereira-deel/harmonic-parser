# Agent harness for the live room PoC

7 November 2026 · Design for the first agent-led build

[PoC backlog](2026-11-07-live-room-poc.md) · [Technical research](../../concepts/live-room-technical-research.md) · [Project memory](../../project-memory.md)

## The two loops

The **build loop** gives coding agents a small contract, a reproducible way to play the product, and evidence another person can review. The **experience loop** tests whether the room helps the player hear and develop a motif. Agents can reproduce MIDI state, make visual alternatives and show how the app responds. The player decides what feels expressive, distracting, or worth trying again.

Use Codex with the existing repo and local browser tooling for the first run. The coordinator owns sequencing, integration, decisions and the evidence record. A separate orchestration service only becomes relevant if repeat runs expose a specific coordination problem. The product runtime is an ordinary browser app. [Codex harness engineering](https://openai.com/index/harness-engineering/) · [Codex workflow iteration](https://developers.openai.com/cookbook/examples/codex/iterating-development-workflows-with-codex) · [Codex subagents](https://learn.chatgpt.com/docs/agent-configuration/subagents)

## What exists before dispatch

1. **A recoverable base.** Give each worker the same source revision and the current concept, backlog and contracts. The prior design files in the working tree need to be included in the shared snapshot. Record the baseline checks before changes. Use an integration branch and isolated worktrees for concurrent edits, or disjoint paths in the same isolated workspace when the environment only offers a shared filesystem. Assign each running preview a distinct localhost port. Verify the runner can bind a port and launch Chrome before assigning browser evidence. [Codex worktrees](https://learn.chatgpt.com/docs/environments/git-worktrees)
2. **A narrow entry point.** Keep the root chord tool in the normal build. Give the room its own entry and a development-only lab harness with replay, frozen time, condition selection and inspectable frame/cue state. Production setup provides only the controls needed to connect and play. Choose how development-only diagnostics are excluded from the production build during POC-00.
3. **A fixture with a human-readable score.** Keep a versioned synthetic input fixture with a stable ID, duration, ordered events, and descriptions of what to look for. Use session-relative time and deterministic tie order. Keep facilitator cue schedules and explicit chord annotations as separate optional tracks. A new run resets input state, cue state and clock. A reviewer should be able to replay a phrase and see the same expected state without asking which keys to play.
4. **A clear entry into the work.** The root `AGENTS.md` points at project memory. The snapshot links this harness and the backlog. Put task-specific instructions in dispatch cards. Use the existing spike records for timeboxed questions, with a threshold and consequence recorded before the run. Keep training contracts separate from interaction evidence. [Codex AGENTS.md](https://learn.chatgpt.com/docs/agent-configuration/agents-md) · [Repository spike format](../../../experiments/README.md)

## First agent wave

The coordinator settles POC-00 and owns the HTML entries, shared types, dependency changes and integration. Give workers exact file allowlists, including test files. Workers own separate directories. A requested change to a shared contract goes back to the coordinator and is announced to every affected worker before it lands.

| Role | Work packet | Evidence expected |
| --- | --- | --- |
| Visual worker | POC-01. Own the renderer and its shader/material. Compare two treatments on the same replay and keep one scene. | Fixed-time captures, a short motion capture, fallback behavior, and render settings. |
| MIDI worker | POC-02. Own the live adapter and pure reducer. Document the input lifecycle. | Raw byte fixtures, reducer assertions, simulated device status checks, and a hardware checklist. |
| Replay and verification worker | POC-03. Own the fixture loader, replay clock, synthetic fixtures and browser-test starter. | Repeatable command, replay state trace and browser status. |
| Coordinator | POC-04 and POC-05. Integrate input, field and cue, and run the same setup and replay checks on the assembled build. | Built page smoke results, comparable A/B/C captures, and hardware record. |
| Parser worker | POC-07 and POC-08 after the first shared fixtures exist. Own the analysis adapter and live-note comparison. | Replay proof with annotated chords, withheld cases, and a separate spike record for raw notes. |
| Fresh reviewer | Review the integrated revision with no write ownership. Use task cards, run records and the diff. | Findings by severity and reproduction steps. Verify which conclusions the evidence supports. |

Dispatch the independent work after shared types are pinned. Merge each packet at the coordinator's checkpoint and rerun the impacted checks on the new integration revision. The player check follows integration. A repair packet addresses specific evidence failures, and completed packets retain their original evidence and revisions.

## Dispatch card and return format

Use this card for each ticket. The coordinator fills in exact file allowlists and runnable commands before assigning it.

```text
Ticket and base revision
Why this matters during a playing session
Allowed file paths and existing contracts
Fixture IDs and expected observations
Acceptance commands and expected result
Browser or hardware access available
Timebox and decision if the question remains open
Return evidence and handoff owner
```

**Example for POC-02.** Own `src/room/input/` and `test/live-room/input.test.ts`. Consume the agreed input event type. One fixture presses MIDI note 60, holds CC64, releases note 60 using velocity-zero note-on, and then releases CC64. After key release the physical set is empty and the pedal-held set contains 60. After pedal release both sets are empty. A second fixture switches inputs while a note is held and sends a late message from the old input. Both sets stay empty until the new input plays. Return `npx vitest run test/live-room/input.test.ts` output, the exact revision, and whether any real device was used.

The return includes the exact patch or commit, reproduction commands, environment, result for each check, artifact pointers and unresolved decisions. Record checks as **pass**, **fail**, or **not run**, with the reason. For an experiment, include the question, input, threshold, budget, measured result and what it changes. Keep failures and contrary examples available to the reviewer.

## Verification layers

| Layer | Replayable evidence | What it can establish |
| --- | --- | --- |
| Baseline | `npm run typecheck`, `npm test`, `npm run build` from the integration revision | The old chord tool and the new bundle still meet code and build checks. Five expected-failure tests are part of the current parser baseline. |
| Pure checks | Normalized event trace, expected note/pedal state, reset cases, cue policy, fixture order | Live and replay reducers follow the same rules. A single chord and sparse material can leave C quiet. |
| Browser smoke | Playwright with pinned browser and viewport. Build routes, setup, fake MIDI states, reduced motion, forced fallback, and A/B/C at a known fixture time. | Pages load and conditions differ as intended. Assert state and cue semantics. Save visual artifacts for comparison. |
| Visual review | Paired frames, moving capture and settings for the same fixture and viewport | A reviewer can judge whether the world is still coherent and the gesture is perceptible. GPU output can vary across machines, so use same-run captures for judgment and stable invariants for portable assertions. |
| Physical rig | Keyboard and pedal, browser/OS, sound route, display refresh, timing sample, recovery check | Real permission and device behavior, frame cadence, and whether response feels attached to the hand. |
| Playing study | Condition order, cue origin and timestamp, player observations, next musical action | Whether a form of response changes the experience. Record facilitated and automatic cues as separate interventions. |

Playwright clock controls are useful for reproducing states. Use real time for latency measurement. Capture a trace on browser failure. If browser startup or loopback is restricted, finish pure checks and route browser verification to an environment that can run it. A mock device and a software renderer are separate evidence from the physical rig. [Playwright clock](https://playwright.dev/docs/clock) · [Playwright visual comparisons](https://playwright.dev/docs/test-snapshots) · [Playwright trace viewer](https://playwright.dev/docs/trace-viewer)

## Small execution ledger

For the first build, maintain one ledger named in POC-00. Each row records `ticket`, `owner`, `base`, `revision`, `status`, `checks`, `evidence` and `next`. Update it after dispatch, handoff and integration. On resume, read the ledger and verify the recorded revision before assigning unfinished work. A completed ticket with valid evidence stays completed unless a later integration invalidates it.

Use a dated run directory outside tracked source for traces, screenshots and video. A durable result should name the source revision, fixture version, viewport, renderer, condition, and cue origin so the run can be reproduced. Store synthetic fixtures and short findings with the repo. Personal performances stay local unless the player chooses to retain or share them. Summarize decisions in project memory, including which earlier hypothesis a result revises.

## Readiness decisions

**Ready to play.** A/B/C run from one built page. B and C have equal gesture state for the same event trace. C can show and retire one clearly sourced cue. The existing chord app builds and passes the baseline. The player's keyboard and sound route work on the target rig, or the run is explicitly a replay demonstration.

**Ready to claim parser integration.** The lab can show output from the actual parser and the input it used. Annotated replay is labeled. Ineligible material can produce diagnostic readings while the playing field stays free of key claims.

**Ready to replace facilitation in C.** The cue earns attention in a playing session, the automatic provider agrees often enough with the agreed listening criteria on relevant material, and the withholding cases pass. Record those criteria before measuring. A finding that favors gesture alone is a valid result of the build.
