/**
 * Write `fixtures/suggest-baseline.json`, and report what is in it.
 *
 * The baseline itself is built in `suggest-baseline.ts`, which imports no Node
 * builtins so the test can pull it in without dragging `@types/node` into a
 * repo that has no runtime dependencies. This file is the half that touches
 * the disk.
 *
 *     node tools/export-suggest-baseline.ts
 *
 * Node 22 strips the types natively, so there is no build step and nothing to
 * install. Regenerated in CI; any diff fails the build.
 */

import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { buildFixture, serialise, tonicNameFor } from './suggest-baseline.ts';

const fixture = buildFixture();
const rows = fixture.rows;

const here = dirname(fileURLToPath(import.meta.url));
const out = join(here, '..', 'fixtures', 'suggest-baseline.json');
writeFileSync(out, serialise(fixture));

// A short report, because the point of exporting was to look at it.
const tied = rows.filter((r) => r.topIsTied);
const fallback = rows.filter((r) => r.fallback);
const fanout = new Map<number, number>();
for (const r of rows) fanout.set(r.candidates.length, (fanout.get(r.candidates.length) ?? 0) + 1);

console.log(`wrote ${out} — ${rows.length} contexts, limit ${fixture.limit}`);
console.log(`  top choice decided by the alphabet: ${tied.length}/${rows.length}`);
console.log(`  fell through to the fallback:        ${fallback.length}/${rows.length}`);
console.log(
  `  fan-out: ${[...fanout.entries()].sort((a, b) => a[0] - b[0]).map(([n, c]) => `${n}->${c}`).join('  ')}`,
);

const byFrom = new Map<number, number>();
for (const r of tied) byFrom.set(r.from, (byFrom.get(r.from) ?? 0) + 1);
console.log(
  `  ties by last degree: ${[...byFrom.entries()].sort((a, b) => a[0] - b[0]).map(([d, c]) => `${d}:${c}`).join('  ')}`,
);

for (const from of [0, 5]) {
  const picks = new Map<number, string[]>();
  for (const r of rows.filter((x) => x.from === from && x.topIsTied)) {
    const d = r.candidates[0].degree;
    picks.set(d, [...(picks.get(d) ?? []), tonicNameFor(r.tonic, r.mode)]);
  }
  const summary = [...picks.entries()]
    .sort((a, b) => b[1].length - a[1].length)
    .map(([d, keys]) => `degree ${d} in ${keys.length}`)
    .join(', ');
  console.log(`  after degree ${from}, the tie resolves to: ${summary}`);
}
