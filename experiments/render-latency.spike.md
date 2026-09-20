---
question: "Does the page render inside the 100 ms instant band, and does the per-keystroke recompute need a debounce?"
informs: budgets.latency_band
threshold: "p95 keystroke-to-painted at or under 100 ms, the instant band ceiling in LATENCY_BANDS_MS."
if_not: "Add a render debounce, re-target the flow band in the README, and design the acknowledgement the slower band requires."
budget_minutes: 90
status: answered
finding: "27.6 ms p95 to paint, firmly instant, and the debounce that was about to be added would have destroyed that."
measured: 27.6
elapsed_minutes: 55
---

# render-latency

## What I did

The brief was "fix the debounce and measure the latency", in that order. I
measured first, which turned out to matter.

Browser measurement over 100 iterations per case, procedure and script in
`tools/bench-latency.md`, statistics mirroring
`harness/profile.py::latency_ms` so the number can be handed to
`band_landed_in()` unchanged.

## What I found

| | sync handler p95 | keystroke to painted p95 |
|---|---|---|
| `Am F C G` (84 nodes) | 0.2 ms | **27.6 ms** |
| 64 chords (804 nodes) | 0.4 ms | **27.6 ms** |
| 1500-chord pathological | 3.6 ms | — |
| 64 unreadable tokens | 0.1 ms | — |

`band_landed_in(27.6)` returns **`instant`**. The threshold was 100 ms; the
page clears it with 72 ms to spare.

**The threshold was met, and the planned fix was still wrong.** A debounce is
how you stop expensive work from running per keystroke. This work is not
expensive. Any debounce anyone would actually write — 100 to 300 ms — added
to 27.6 ms lands in `flow`, so the change would have spent the entire instant
budget solving a problem the page does not have, and the page would have felt
worse while looking more carefully engineered.

Two details that make the case rather than decorate it:

**Paint is identical at 84 nodes and 804.** Ten times the DOM, the same
27.6 ms. That is roughly two frames at 60 Hz, so what is being measured is
frame scheduling and not this page's work. There is nothing here for a
debounce to save.

**The timer is clamped at 0.1 ms**, so every sync figure sits on the
resolution floor. The honest reading of the sync column is "below what this
instrument can see."

## What changed instead

The instinct behind the debounce was sound; it was aimed at the wrong target.
`index.html` had `aria-live="polite"` on `<section id="output">` — the entire
render target, which `render()` replaces wholesale on every keystroke. Typing
`Am F C G` announced the full analysis **eight times**.

That is a real defect and the fix is a debounce — of the announcement, not
the render. `#output` is no longer a live region; a visually-hidden
`#status` outside it gets one sentence 500 ms after typing stops
(`src/announce.ts`). The visible panel is untouched and still measures
27.6 ms.

So: fast for the eye, settled for the ear. One interaction, two speeds,
because they are answering different questions.

## What this is not

Not a run. One measurement against one written threshold, inside its budget.

It also does not answer `design-eval`'s real question for anyone else's
hardware. This is a fast laptop, and the skill is explicit that benchmarks
from the wrong machine say nothing. A tenfold slower device still lands
inside the band, but that is arithmetic, not a measurement.
