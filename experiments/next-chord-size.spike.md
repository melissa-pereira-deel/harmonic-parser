---
question: "Does a next-chord count table over (mode, degree, quality) contexts, pruned to 8 continuations, fit in the page's first round trip when bundled?"
informs:
  - budgets.max_size_kb
  - architecture.representation
threshold: "Bundled at worst-case counts, index.html + JS + CSS stay ≤ 14 KB gzipped and add no request."
if_not: "The table loads after first paint as a designed download. First-run cost gets a designed moment and is named in the contract's kill criteria."
budget_minutes: 240
status: open
finding: ""
measured: null
elapsed_minutes: 0
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

## What I will do

1. Build the page as it ships today and gzip each file the first paint needs:
   `dist/index.html`, `dist/assets/*.js`, `dist/assets/*.css`. Source maps and
   `favicon.svg` are excluded and the reason is stated with the numbers.
2. Generate synthetic worst-case tables over the vocabulary of 12 degrees ×
   the 17 `Quality` values in `src/chords.ts` (204 next-chord classes), for
   three context shapes — (mode, degree) = 24, (mode, degree, quality) = 408
   (the headline), (mode, previous degree, last degree) = 288 — at top-k of 4
   and 8, with counts drawn as random uint16.
3. Bundle each table into a throwaway copy of the build, gzip it the same way,
   and report the delta over the base and the total against 14 KB.

Nothing here has been measured yet. This record is committed first so the
threshold cannot move to meet the number.

## What this is not

Not a run. No `start_run()`, no manifest, no `runs/` directory, nothing
promotable. One measurement against one threshold, and a synthetic table
rather than a trained one: it bounds the size, it says nothing about whether
the counts would be any good.
