# Harmonic Parser project memory

This journal tracks the live playing exploration alongside the existing chord-symbol parser. The snapshot is the place to resume. The dated entries preserve what led there so we can revisit a decision without reconstructing it from chat.

## Current snapshot · 2026-11-07

- **User brief.** A private browser room for playing by ear. It opens to a fluid, slowly moving field of light, color and texture with no visible controls or copy. A connected MIDI keyboard can shape the field. Harmonic information should blend into the world when it appears. Its form and level of interaction are open.
- **Playing practice.** Find a melody by ear, repeat it, and vary the rhythm, phrasing, or notes. The hard moment comes once a motif feels worth keeping. How can it gain tension, find release, or acquire harmonic depth without losing what made it compelling? Theory vocabulary should be optional in the playing experience.
- **User-endorsed study.** Compare the same visual world in three conditions. A drifts independently. B responds to gestures. C keeps B's gesture response and adds occasional harmonic reflection. This is a study direction. No sessions or results have been recorded.
- **Working hypothesis.** Let the field acknowledge the hand immediately. Let a reading emerge at a moment that makes sense musically. Start by investigating whether a reflection helps the player hear another possibility in the same motif. The timing, cue and visual vocabulary are proposals.
- **Evidence from the parser.** The current browser app ranks major and minor keys from typed chord symbols. It uses an order-independent pitch-class profile. Its score thresholds are uncalibrated, and its suggestions use the last chord's root and the supplied key. See [scorer](../src/readings.ts#L247), [confidence experiment](../experiments/confidence-thresholds.spike.md), and [suggestion rules](../src/suggest.ts#L150).
- **Open.** Which kind of variation actually helps in a stuck moment, how the field carries a phrase through a rest, whether cues should appear on their own or by request, how much analysis is useful for melody-first playing, and where sound and MIDI come from in a real session. The renderer, parser integration and product scope are open.
- **Current brief.** [A room for the next variation](concepts/a-room-for-the-next-variation.md). Its listening references and study plan contain interpretations and proposals.
- **PoC preparation.** The [technical research](concepts/live-room-technical-research.md), [backlog](superpowers/plans/2026-11-07-live-room-poc.md), and [agent harness](superpowers/plans/live-room-agent-harness.md) are the handoff for a first build. The starting stack and the two-stage parser path are recommendations to verify during that build.

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

## How to continue

Append an entry with the next ID, date, what changed and why, and a pointer to the chat, artifact, or observation when available. Use **User confirmed**, **Observed**, **Proposed**, or **Open** so an idea stays distinguishable from a decision. When a later entry revises an earlier one, say which entry it revises and what evidence or preference changed. Update the snapshot to reflect the new state.
