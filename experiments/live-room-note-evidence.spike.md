---
question: "Where do recent sounding-note duration and conservative held-triad recognition agree, disagree, or withhold a key candidate?"
informs: scope
threshold: "In held-out player material, a usable observation arrives within at least five of six annotated helpful windows, and all four annotated quiet windows remain silent."
if_not: "Keep automatic C cues gated and continue with facilitated reflection. A missing player sample leaves this criterion unmeasured."
budget_minutes: 20
status: open
---

# Live room note evidence

## Synthetic preflight protocol

The six constructed sequences are implementation probes. Their authored expectations identify places to inspect and carry no player judgment.

- Sparse melody. Inspect whether a line can acquire a key label without accompaniment.
- Changed bass. Repeat the same melody with a different held bass. Inspect whether a tonal reading hides the concrete bass change.
- Rolled and sustained notes. Roll four chords with pedal overlap and one physical key at a time. Inspect how the two methods handle the resulting harmony.
- Clear loop. Repeat C, F, G and C. Expect a C major candidate late in the loop.
- Open ending. Play C, F, Dm and G, then stop. Inspect whether either method names a settled key over the final dominant.
- Tonal shift. Play C, F, G and C followed by D, G, A and D. Expect C major before the shift and D major by the end. Record intermediate claims or silence.

Sample gesture state every 20 ms with a trailing 2400 ms window. The duration profile credits each sounding pitch class once per interval, including pedal sustain. It requires at least five pitch classes and 1200 ms with notes sounding, then compares the duration vector against the existing major and minor profiles with Pearson correlation. The held-triad path accepts an exact major or minor triad after 180 ms of continuous physical overlap, credits it once per held run and requires two distinct accepted chord symbols within the window. It passes those symbols to the existing parser and ranker. Both paths withhold below a score of 0.70 or a lead of 0.05 over the runner-up. These fixed trial values are for comparing behavior in this preflight.

Capture transitions between quiet and candidate states, changes of candidate, and authored checkpoints. Synthetic cases can reveal failure modes. The acceptance threshold above requires annotations from the player on material held out from tuning.

## Synthetic findings · 2026-11-07

Run `node tools/live-room-note-probe.ts` from the repository root with Node 24. The output records every change of candidate or quiet state and includes scores and leads at selected checkpoints. Times are elapsed milliseconds, with 20 ms resolution. Both methods keep a trailing window, so a reading can change while no keys are sounding.

| Synthetic case | Sounding-note duration | Physical held triads |
| --- | --- | --- |
| Sparse melody | C minor first at 1440 ms (0.727, lead 0.188). Withheld at 1540 ms, returned at 2040 ms, withheld at 2540 ms and returned at 2860 ms. | Withheld throughout. No held triads. |
| Changed bass | C minor at 1620 ms, 20 ms into the repeat over A♭. Withheld at 2780 ms as the lead narrowed. A♭ major first passed at 3200 ms (0.778, lead 0.052), 160 ms after all notes ended. | Withheld throughout. No held triads. |
| Rolled and sustained | C major from 1400 ms (0.951, lead 0.257) through the end of the 2800 ms trace. | Withheld throughout. The pedal preserved the harmony while physical overlap stayed below three pitch classes. |
| Clear loop | C major first at 1400 ms (0.982, lead 0.240), then stable through 4800 ms. | C major first at 780 ms after accepting C and F (0.933, lead 0.161), then stable through 4800 ms. |
| Open ending | C major at 2140 ms while the final G was held. Withheld at 2480 ms, then named D minor at 2720 ms. | C major at 1980 ms while G was held. Switched to D minor at 2580 ms as the opening C aged out. |
| Tonal shift | C major by 1400 ms. Withheld at 2800 ms, then named G major at 3040 ms and D major at 4240 ms, 40 ms into the last D chord. | C major by 780 ms. Withheld at 2580 ms, then named G major at 3180 ms and D major at 4380 ms, 180 ms into the last D chord. Both paths returned to quiet once between G major and D major. |

Both methods gave the expected late readings in the clear loop and tonal shift. Both gave unwanted readings over the authored open ending. The final G stopped sounding at 2300 ms. The later switch to D minor came from the window aging, with no new gesture. The duration method heard evidence from pedal-held notes but also produced a fluctuating C minor reading in the sparse melody and a late key change in the bass example. The physical-triad method withheld in both examples and missed the rolled harmony entirely.

The trial treats “speaking” as an eligible candidate on a sample. It includes no phrasing model or cue scheduler. Gesture state approximates sounding notes from held keys and CC64, with equal weight for each active pitch class per interval. The held-triad path instead uses the parser's equal weighting per recognized chord. The comparison therefore includes differences in weighting and evidence gates as well as note recognition.

## Player evidence

The automatic-C criterion remains unmeasured. There is no player sample or written account of specific playing windows in this run, and the authored expectations provide no evidence of which reading would help the player. Keep key candidates in the lab and retain facilitated reflection for the comparison. For the changed-bass case, test whether a reflection about the bass itself is useful in a player-annotated window.
