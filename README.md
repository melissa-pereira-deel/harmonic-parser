# harmonic-parser

[![ci](https://github.com/melissa-pereira-deel/harmonic-parser/actions/workflows/ci.yml/badge.svg)](https://github.com/melissa-pereira-deel/harmonic-parser/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

Type `Am F C G` into a box. The page tells you it is probably C major, puts a
Roman numeral under each chord, and shows you the readings it did not pick.

The interesting part is not the answer. It is that there are usually several,
and that two very different things make a page unsure of which one to show.

**Musical ambiguity** is when the music genuinely supports more than one
reading. A pivot chord belongs to two keys at once; that is a fact about the
music and it is the most interesting thing on the screen. **Model
uncertainty** is when nothing fits and the top answer is merely the least bad.
Most interfaces collapse both into one number — "confidence: 62%" — which
cannot tell you whether you are looking at *two right answers* or *no right
answer*. Those want opposite things from an interface. The first wants both
readings side by side. The second wants the page to stop asserting.

Everything runs in your browser. The model is 24 key profiles of 12 numbers
each, about 1.2 KB, ported from music21. There is no network call, no
download, no warm-up, and nothing to opt out of — which is worth saying out
loud, because it is the strongest thing local inference buys and it is
completely invisible unless somebody shows you.

> **⚠️ Status: skeleton, and the tests are red on purpose.**
>
> The four layers, the key ranking and the parity harness all run. The port
> agrees with music21 on every top reading and every score across 200
> progressions. **Five tests fail, and none should be made to pass by
> adjusting a number.** An answered spike record in
> [`experiments/`](experiments/) says why: the two confidence thresholds
> cannot be calibrated from the data that exists, so the page's claims about
> its own confidence are placeholders.
>
> There is no grammar, no trained model, no Roman-numeral *analysis* beyond a
> lookup from the inferred key, and no audio. The `'model'` source in
> `readings.ts` is a type, not a thing that exists.
>
> Treat every claim this page makes about its own confidence as a placeholder
> with a plausible shape.

## How it fits together

Four layers, and the seam between them is the point.

```
chords.ts      "F#m7b5" -> { root, quality, bass }        pure string work
keyprofiles.ts 24 profiles x 12 numbers                   the whole "model"
readings.ts    rank() -> Reading[]                        ranked, with a source
confidence.ts  ambiguity (a margin) vs uncertainty (an absolute)
suggest.ts     what could come next                       a rule table, for now
ui.ts          knows about Reading. Nothing else.
```

`Reading` carries a `source` field — `'key-profile' | 'grammar' | 'model'` —
even though only the first producer exists. That is deliberate. A hand-written
harmonic grammar and a trained scorer are both meant to land here later as
further producers, and when they do, the interface should not have to learn
that anything changed.

## The oracle

`fixtures/music21-rankings.json` holds music21's full 24-key ranking for 200
progressions. `test/parity.test.ts` checks the TypeScript port against it and
**prints the disagreement rate rather than asserting a tolerance**, the way
`examples/02-config-lexer` in tiny-model-lab prints its torch-vs-ONNX and
fp32-vs-int8 rates. That rate is **0/200** on the top reading and 0/200 on
scores. Five rankings reorder within an exact tie, counted and printed
separately because it is not a disagreement: the fixture stores six decimal
places and those ties survive at seventeen, so a total order over 24 keys is
a question the oracle cannot answer.

music21 is pinned exactly rather than floored, which is a deliberate deviation
from the sibling repo's policy. A floor says "at least this new"; here music21
*is* the oracle, and a floor lets the oracle move underneath you.

```bash
npm install
npm test          # 5 failing, on purpose. Read experiments/ first.
npm run dev
```

## Measuring the model source

When `readings.ts` grows a real `'model'` producer, the claim that it beats the
key profiles has to survive a gate rather than a demo. That is what
[tiny-model-lab](https://github.com/melissa-pereira-deel/tiny-model-lab) is
for, and this repo is set up to be measured by it from outside:

```bash
pip install -r tools/requirements.txt
python -m harness init && rm experiments/experiment.yaml   # see experiments/README.md
python -m harness spikes
```

## Sibling project

[tiny-model-lab](https://github.com/melissa-pereira-deel/tiny-model-lab) — a
harness for deciding whether a narrow task should be a model at all, and for
proving it beat the simpler thing it replaced. Two seams meet this repo. The
[spike record](https://github.com/melissa-pereira-deel/tiny-model-lab/blob/main/harness/templates/spike.md)
is where the three answered questions in `experiments/` came from — this repo
is the first thing to use it. And `LATENCY_BANDS_MS` in
[`harness/experiment.py`](https://github.com/melissa-pereira-deel/tiny-model-lab/blob/main/harness/experiment.py)
puts the instant boundary at 100 ms and the flow boundary at 1 s.

That second seam used to be an assertion. It is now a measurement: **p95 from
keystroke to painted is 27.6 ms**, so `band_landed_in()` returns `instant`
with 72 ms of headroom. Method in [`tools/bench-latency.md`](tools/bench-latency.md),
result in [`experiments/render-latency.spike.md`](experiments/render-latency.spike.md).

Worth keeping the correction visible, because this README used to argue the
other way. The original 200 ms target sits in **flow**, and the page was
described here as needing a designed acknowledgement rather than direct
manipulation. That was one unmeasured target disagreeing with another. The
real number is seven times faster than the target, and the disagreement
dissolves: the interaction is instant, and the honest thing is to say so and
protect the headroom rather than spend it.

Protecting it is why this page has no render debounce. Adding one was the
plan until the number arrived.

## License

MIT. See [LICENSE](LICENSE).

---

Created by Melissa de Britto.
