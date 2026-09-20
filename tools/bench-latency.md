# Measuring latency in a real browser

`test/latency.test.ts` measures the arithmetic and says so. This measures what
`design-eval` actually asks for: **keystroke to painted, on the machine
somebody is using.** It is manual on purpose — a jsdom number from a CI runner
would look automated while measuring a simulated DOM on the wrong hardware,
and a green number that means little is worse than a procedure you have to
run.

Re-run this when the render path changes: a new `Reading` producer, a
framework, anything that touches `src/ui.ts`.

## Procedure

```bash
npm run dev
```

Open the page, open the console, paste the script below. It reports two
numbers per case:

- **sync** — the `input` handler start to finish. Parse, rank, assess, and
  building the DOM. This is what you can reduce by writing faster code.
- **to paint** — dispatch to the second `requestAnimationFrame`, so layout and
  paint are included. **This is the number that answers the design question**,
  and the one to compare against `LATENCY_BANDS_MS`: instant 100 ms, flow
  1 s, attention 10 s.

The statistics mirror `harness/profile.py::latency_ms` in
[tiny-model-lab](https://github.com/melissa-pereira-deel/tiny-model-lab) — the
first call reported separately as cold, warmup discarded, nearest-rank p95 as
`sorted[min(n-1, trunc(0.95n))]` — so a number from here means the same thing
as a number from there and can be handed to `band_landed_in()` unmodified.

```js
const input = document.querySelector('#progression');

function stats(s) {
  s = [...s].sort((a, b) => a - b);
  const at = (q) => s[Math.min(s.length - 1, Math.trunc(q * s.length))];
  return { median: +at(0.5).toFixed(2), p95: +at(0.95).toFixed(2), max: +s[s.length - 1].toFixed(2) };
}

function sync(text, n = 100) {
  const out = [];
  for (let i = 0; i < n; i++) {
    input.value = ''; input.dispatchEvent(new Event('input', { bubbles: true }));
    input.value = text;
    const t0 = performance.now();
    input.dispatchEvent(new Event('input', { bubbles: true }));
    out.push(performance.now() - t0);
  }
  return stats(out);
}

async function toPaint(text, n = 40) {
  const out = [];
  for (let i = 0; i < n; i++) {
    input.value = ''; input.dispatchEvent(new Event('input', { bubbles: true }));
    await new Promise((r) => requestAnimationFrame(() => r()));
    const t0 = performance.now();
    input.value = text; input.dispatchEvent(new Event('input', { bubbles: true }));
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(() => r())));
    out.push(performance.now() - t0);
  }
  return stats(out);
}

const long = Array(16).fill('Am F C G').join(' ');
console.table({
  'sync  Am F C G':  sync('Am F C G'),
  'sync  64 chords': sync(long),
  'paint Am F C G':  await toPaint('Am F C G'),
  'paint 64 chords': await toPaint(long),
});
```

## What was measured, and on what

2026-09-20, macOS on Apple silicon, Chromium via the in-app browser pane,
Vite dev server.

| | sync p95 | to paint p95 |
|---|---|---|
| `Am F C G` (84 nodes) | 0.2 ms | **27.7 ms** |
| 64 chords (804 nodes) | 0.6 ms | **27.5 ms** |

`band_landed_in(27.6)` → **`instant`**, with 72 ms of headroom.

Measured twice: once at `45b4320` before the announcement channel existed,
and again after. Paint did not move — 27.6 ms then, 27.5-27.7 ms now — which
is the point, since debouncing the *announcement* must not cost the render
anything. The 64-chord sync figure went from 0.4 ms to 0.6 ms, which is the
announcement sentence being built on each keystroke. Reported rather than
rounded away, though 0.6 ms of a 100 ms budget is not a number to act on.

Three things worth knowing before you trust these.

**`performance.now()` is clamped.** Resolution measured 0.1 ms, so every sync
figure sits at or near the floor — the true values are smaller and this
procedure cannot say by how much. That is fine: the answer is "too fast to
measure," which is the strongest form of the answer.

**Paint is identical at 84 and 804 nodes.** 27.6 ms is roughly two frames at
60 Hz. What is being measured there is frame scheduling, not this page's work
— which is the whole reason a render debounce would be the wrong fix.

**This is a fast laptop.** `design-eval` says benchmarks from your machine say
nothing about a mid-range one. A tenfold slower device still lands inside the
instant band, but nobody has checked, and the honest claim is about the
hardware in the table.
