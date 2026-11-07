---
question: "Does a next-chord count table over (mode, degree, quality) contexts, pruned to 8 continuations, fit in the page's first round trip when bundled?"
informs:
  - budgets.max_size_kb
  - architecture.representation
threshold: "Bundled at worst-case counts, index.html + JS + CSS stay ≤ 14 KB gzipped and add no request."
if_not: "The table loads after first paint as a designed download. First-run cost gets a designed moment and is named in the contract's kill criteria."
budget_minutes: 240
status: answered
finding: "No. Bundled as JSON the table takes the page from 8.2 KB to 24.4 KB gzipped, and no encoding can rescue it: the information alone is 8.7 KB against 5.8 KB of headroom."
measured: 24.4
elapsed_minutes: 10
---

# next-chord-size

Part of #17.

A future next-chord model would ship as a bundled count table: for each
context, the most frequent continuations and how often each was seen. Before
anyone writes a contract with a `budgets.max_size_kb` in it, this measures how
big that table could be, and whether the page can carry it without a second
request.

**14 KB is a heuristic, not a measured fact about these users.** It is the
size of one initial TCP congestion window — about 10 segments of ~1460 bytes,
per RFC 6928 — so a response that fits can arrive in the first round trip
after the connection is up. It says nothing about who actually loads this
page, on what network, over which protocol, or whether TLS, HTTP/2 framing or
headers eat into the window first. It is a line to measure against, chosen
before the number exists, and it is treated as one.

KB below means KiB, 1024 bytes, so the line is 14,336 bytes. The script also
checks 14,000 and 14,600 (10 × 1460); the headline fails all three, and only
one cell anywhere in the grid changes verdict between them.

## What I did

**The base.** `npm run build` at `6f276f0` — the commit that wrote this
record's question, whose `src/` is identical to `main` at `6c0d2b7`. Vite
8.3.5, then `gzip -9` (Apple gzip 479) on each file the first paint fetches:

| file | raw bytes | gzip -9 bytes |
|---|---|---|
| `dist/index.html` | 2,878 | 1,287 |
| `dist/assets/index-Bd1XDD76.js` | 14,168 | 5,645 |
| `dist/assets/index-N5syPr2N.css` | 4,346 | 1,464 |
| **total** | 21,392 | **8,396 (8.20 KB)** |

Excluded, and why: `index-Bd1XDD76.js.map` (76.6 KB raw) is only fetched when
someone opens devtools, so no visitor's first paint waits on it.
`favicon.svg` is its own request, made by the browser off the paint path, and
nothing on screen waits for it either. Counting either would make the base
look worse for a reason no user experiences.

That leaves **5,940 bytes (5.80 KB) of headroom** for any table at all.

**The tables.** Synthetic and worst-case on purpose. The vocabulary is 12
degrees × the 17 `Quality` values in `src/chords.ts`, 204 next-chord classes.
Three context shapes: (mode, degree) = 24; (mode, degree, quality) = 2 × 12 ×
17 = 408, the headline; (mode, previous degree, last degree) = 2 × 12 × 12 =
288. Top-k of 4 and 8. Every context is full to k, the k classes are distinct
and random, and every count is a uniform random uint16. Real counts compress
better than this — they are Zipf-shaped, mostly small, sorted descending once
pruned, and plenty of contexts would see fewer than k continuations — so every
number here is a ceiling, not an estimate. The threshold says worst case, so
the ceiling is what it asks for.

Three encodings of the same table per cell:

- `pairs` — `[[[class, count], ...], ...]`, one array of pairs per context.
- `columnar` — `{ "c": [...classes], "n": [...counts] }`. Fixed k, so context
  *i* is the slice `i*k .. (i+1)*k` and no offsets are needed.
- `base64` — one string of packed bytes, uint8 class + uint16 count. The few
  lines of decoder it would need are **not** counted, so it is flattered.

**The bundle.** For each table the script copies `index.html`, `src/`,
`public/` and the configs into a scratch directory outside the repo, symlinks
`node_modules`, writes `src/next-chord.json`, and prepends to the copy's
`src/main.ts` an import plus a `window` assignment, so the bundler cannot
tree-shake the table away. It runs the repo's own `vite build` there and
gzips the result the same way. The repo is never patched. A control build of
the unpatched copy has to reproduce 8,396 bytes exactly, or the script stops;
it did.

Re-run with `node measure.ts <repo> <scratch-dir>` (Node 24 strips the types):

```ts
// Size-budget spike for a bundled next-chord count table (experiments/next-chord-size.spike.md).
// Usage: node measure.ts <repo> <scratch>
// Builds throwaway copies of the page under <scratch>; never writes to <repo>.
import { execFileSync } from 'node:child_process';
import { cpSync, mkdirSync, readdirSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const [repo, scratch] = process.argv.slice(2);
const LINE = 14 * 1024; // 14 KB read as KiB; 14,000 and 14,600 (10 x 1460) are checked below too

// Every file the first paint fetches: the document, the script, the stylesheet.
// Not *.map (devtools only) and not favicon.svg (its own request, not on the paint path).
function firstPaintGzip(dist: string): { files: Record<string, number>; total: number; requests: number } {
  const assets = readdirSync(join(dist, 'assets')).filter((f) => /\.(js|css)$/.test(f));
  const files: Record<string, number> = {};
  for (const f of ['index.html', ...assets.map((a) => `assets/${a}`)]) {
    files[f] = execFileSync('gzip', ['-9', '-c', join(dist, f)]).length;
  }
  return { files, total: Object.values(files).reduce((a, b) => a + b, 0), requests: 1 + assets.length };
}

// Deterministic PRNG so the tables are reproducible (mulberry32).
function rng(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 2 ** 32;
  };
}

const CLASSES = 12 * 17; // 12 degrees x 17 Quality values = 204 next-chord classes
const SHAPES = { '(mode, degree)': 2 * 12, '(mode, degree, quality)': 2 * 12 * 17, '(mode, prev, last)': 2 * 12 * 12 };

// Worst case: every context full to k, k distinct random classes, counts uniform uint16.
function table(contexts: number, k: number, seed: number): [number, number][][] {
  const r = rng(seed);
  return Array.from({ length: contexts }, () => {
    const picked = new Set<number>();
    while (picked.size < k) picked.add(Math.floor(r() * CLASSES));
    return [...picked].map((c) => [c, Math.floor(r() * 65536)] as [number, number]);
  });
}

const ENCODINGS: Record<string, (t: [number, number][][]) => unknown> = {
  // [[[class, count], ...], ...] -- one array of pairs per context
  pairs: (t) => t,
  // { c: [...classes], n: [...counts] } -- fixed k, so context i is slice i*k..(i+1)*k
  columnar: (t) => ({ c: t.flat().map(([c]) => c), n: t.flat().map(([, n]) => n) }),
  // one base64 string of packed bytes: uint8 class + uint16 count, little-endian
  base64: (t) => {
    const flat = t.flat();
    const buf = Buffer.alloc(flat.length * 3);
    flat.forEach(([c, n], i) => { buf.writeUInt8(c, i * 3); buf.writeUInt16LE(n, i * 3 + 1); });
    return buf.toString('base64');
  },
};

function copyOfPage(dir: string): void {
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(dir, { recursive: true });
  for (const f of ['index.html', 'src', 'public', 'vite.config.ts', 'package.json', 'tsconfig.json']) {
    cpSync(join(repo, f), join(dir, f), { recursive: true });
  }
  symlinkSync(join(repo, 'node_modules'), join(dir, 'node_modules'));
}

function build(dir: string): ReturnType<typeof firstPaintGzip> {
  execFileSync(join(repo, 'node_modules/.bin/vite'), ['build', '--logLevel', 'error'], { cwd: dir });
  return firstPaintGzip(join(dir, 'dist'));
}

// Control: the copy, unpatched, must measure the same as the repo's own dist/.
const repoBase = firstPaintGzip(join(repo, 'dist'));
const controlDir = join(scratch, 'control');
copyOfPage(controlDir);
const base = build(controlDir);
console.log('base (repo dist):', JSON.stringify(repoBase));
console.log('base (scratch copy):', JSON.stringify(base));
if (base.total !== repoBase.total) throw new Error('scratch copy does not reproduce the repo build');

console.log('\nshape | contexts | k | encoding | raw JSON bytes | table gz delta | total gz | requests | <= 14336 | <= 14000 | <= 14600');
for (const [shape, contexts] of Object.entries(SHAPES)) {
  for (const k of [4, 8]) {
    const t = table(contexts, k, contexts * 100 + k); // same table for every encoding of a cell
    for (const [enc, encode] of Object.entries(ENCODINGS)) {
      const dir = join(scratch, 'build');
      copyOfPage(dir);
      const json = JSON.stringify(encode(t));
      writeFileSync(join(dir, 'src/next-chord.json'), json);
      // Hold a reference on window so the bundler cannot tree-shake the table away.
      const main = readFileSync(join(dir, 'src/main.ts'), 'utf8');
      writeFileSync(join(dir, 'src/main.ts'),
        `import nextChord from './next-chord.json';\n(window as unknown as { nextChord: unknown }).nextChord = nextChord;\n${main}`);
      const m = build(dir);
      const delta = m.total - base.total;
      console.log([shape, contexts, k, enc, json.length, delta, m.total, m.requests,
        m.total <= LINE, m.total <= 14000, m.total <= 14600].join(' | '));
    }
  }
}

// Floor for any lossless encoding of these worst-case tables: an unordered set of k classes
// from 204, plus k uniform uint16 counts (which carry the order). No encoder beats this.
const log2 = Math.log2;
const log2choose = (n: number, k: number) => { let s = 0; for (let i = 0; i < k; i++) s += log2(n - i) - log2(i + 1); return s; };
console.log('\nentropy floor (bytes) = contexts x (log2 C(204,k) + 16k) / 8');
for (const [shape, contexts] of Object.entries(SHAPES)) {
  for (const k of [4, 8]) {
    const bytes = Math.ceil((contexts * (log2choose(CLASSES, k) + 16 * k)) / 8);
    console.log(`${shape} k=${k}: ${bytes} bytes; base + floor = ${base.total + bytes}`);
  }
}
```

## What I found

Every build stayed at three requests: Vite inlines a statically imported JSON
file into the one JS chunk, so "add no request" holds in every cell, and the
whole question is bytes.

| shape | contexts | k | encoding | raw KB | table gz KB | total gz KB | ≤ 14 KB |
|---|---|---|---|---|---|---|---|
| (mode, degree) | 24 | 4 | pairs | 1.1 | 0.63 | 8.83 | pass |
| (mode, degree) | 24 | 4 | columnar | 0.9 | 0.56 | 8.76 | pass |
| (mode, degree) | 24 | 4 | base64 | 0.4 | 0.39 | 8.59 | pass |
| (mode, degree) | 24 | 8 | pairs | 2.2 | 1.17 | 9.37 | pass |
| (mode, degree) | 24 | 8 | columnar | 1.8 | 1.04 | 9.24 | pass |
| (mode, degree) | 24 | 8 | base64 | 0.8 | 0.74 | 8.94 | pass |
| (mode, degree, quality) | 408 | 4 | pairs | 18.8 | 8.54 | 16.74 | **fail** |
| (mode, degree, quality) | 408 | 4 | columnar | 14.8 | 7.44 | 15.64 | **fail** |
| (mode, degree, quality) | 408 | 4 | base64 | 6.4 | 5.48 | 13.68 | pass ¹ |
| **(mode, degree, quality)** | **408** | **8** | **pairs** | **36.8** | **16.23** | **24.43** | **fail** |
| (mode, degree, quality) | 408 | 8 | columnar | 29.6 | 14.35 | 22.55 | **fail** |
| (mode, degree, quality) | 408 | 8 | base64 | 12.8 | 10.48 | 18.68 | **fail** |
| (mode, prev, last) | 288 | 4 | pairs | 13.3 | 6.16 | 14.36 | **fail** |
| (mode, prev, last) | 288 | 4 | columnar | 10.5 | 5.36 | 13.56 | pass |
| (mode, prev, last) | 288 | 4 | base64 | 4.5 | 3.94 | 12.14 | pass |
| (mode, prev, last) | 288 | 8 | pairs | 26.0 | 11.72 | 19.92 | **fail** |
| (mode, prev, last) | 288 | 8 | columnar | 20.9 | 10.36 | 18.56 | **fail** |
| (mode, prev, last) | 288 | 8 | base64 | 9.0 | 7.59 | 15.79 | **fail** |

"Table gz" is the gzipped total minus the 8,396-byte base, so it includes
whatever Vite wraps around a JSON import. ¹ 14,004 bytes: 332 under the KiB
line, 4 over a 14,000-byte one, and with no decoder counted. It is the one
cell whose verdict depends on how you read "KB", and it is not a pass anybody
should build on.

**The headline fails by 10.4 KB.** (mode, degree, quality) at k = 8, as the
compact JSON arrays the question imagined, adds 16.2 KB and takes the page to
24.4 KB — 1.7 times the line, and nearly three times the page it is attached
to. Columnar saves 12%. Packed base64 saves 35%. Neither is close.

**No encoding can make it fit, and that is arithmetic rather than a failure
of effort.** A worst-case context carries an unordered set of 8 classes from
204 (45.9 bits) and eight uniform 16-bit counts (128 bits). Over 408 contexts
that is 8,868 bytes before any format, framing or decoder — and the headroom
is 5,940. Base plus the information-theoretic floor is 16.86 KB. The best
encoding tried, base64 under gzip, lands 21% above that floor, which is about
what a general-purpose compressor does on random data.

| shape | k | floor KB | base + floor KB |
|---|---|---|---|
| (mode, degree) | 4 | 0.26 | 8.46 |
| (mode, degree) | 8 | 0.51 | 8.71 |
| (mode, degree, quality) | 4 | 4.49 | 12.69 |
| (mode, degree, quality) | 8 | 8.66 | **16.86** |
| (mode, prev, last) | 4 | 3.17 | 11.37 |
| (mode, prev, last) | 8 | 6.11 | **14.31** |

**The only shape that fits comfortably is the one the rules already
answer.** (mode, degree) at k = 8 is 9.4 KB in the plainest encoding. That is
the domain `suggest()` already covers: its input is the key and the last
degree, and since the tie-break fix in `suggest-baseline-shape` none of its
24 (mode, degree) answers varies by tonic. So a bundled table
fits the first round trip only if it asks no more of the music than the
baseline does, which is not a model anybody needs to train.

## What changes

`if_not` fires as written. **The table does not get bundled.** It loads after
first paint, as its own request, and that download is designed rather than
discovered. One shape that would do it: the page paints and parses exactly
as it does today, suggestions come from `suggest()` until the table lands,
and the switch-over is something the UI says rather than something that
happens to it. Designing that moment is its own piece of work. The
first-run cost — one extra fetch, on the visit that has no cache — goes into
the contract's `kill_criteria` by name, alongside the template's three, as
something like *"the page waits on the table before first paint, or the
first-run download exceeds `budgets.max_size_kb`"*.

For **`budgets.max_size_kb`** that means two numbers stop being one. The
14 KB line stays the page's first-paint budget, and the table is not counted
in it. `max_size_kb` becomes the table's own gzipped download, and this record
bounds it: **about 16.2 KB for the headline shape as JSON pairs at
worst-case counts**, about 10.5 KB if packed. (Measured as a bundled import,
so the module wrapper is in there; a fetched `.json` would not carry it.) A contract that writes 17 is writing a measured
ceiling with a little room; the template's default of 50 would be three times
anything this table can be, which is slack rather than a budget. A real
corpus should come in under both, and the contract should say what it
actually measured once there is one.

For **`architecture.representation`**: since the floor rules out every
encoding for the bundled case, the encoding stops being a size decision and
becomes a legibility one. A fetched file is plain JSON — no module wrapper,
diffable in review — and pairs are the format a reviewer can read. Packing is
a 35% saving to reach for only if the separate download turns out to matter,
and only once there are real counts to measure it on.

## What this is not

Not a run. No `start_run()`, no manifest, no `runs/` directory, nothing
promotable. One measurement against one threshold, inside its budget.

The 10 elapsed minutes are an agent's wallclock, from the committed question
to the pull request. They are not evidence of what this costs a person, and
the next budget should not be estimated from them.

It is not a measurement of a real table. The counts are random uint16 and
every context is full, which is the most a table of this shape can cost, not
what one will cost. It bounds the size and says nothing about whether the
counts would be any good.

It is not a measurement of first paint either. The 14 KB line, read strictly,
is about the first response, and that is `index.html` alone at 1.3 KB; the JS
and CSS are discovered from it and fetched after. The threshold sums all
three as a budget for the paint path, which is stricter than the heuristic
and was chosen before the number existed. Nobody timed a page load on a
network here, and the heuristic is not a fact about this page's users.
