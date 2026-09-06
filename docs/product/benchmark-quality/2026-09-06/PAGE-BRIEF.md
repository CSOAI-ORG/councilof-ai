# Page brief — /benchmark-quality (for TUI-3)

Route `/benchmark-quality`. New route, so it needs its **PRIMARY_PATHS** entry in the fourth
wiring place or it ships flagged archived — that is the standing failure mode for new pages
here, not an optional polish step.

## The one sentence at the top

> We applied 35 deterministic predicates to what eight AI benchmark publishers put on three
> public artifacts each, on 6 September 2026. We are the eighth publisher and we fail 16 of
> them. There is no score and no ranking here.

## The rule every cell obeys

**Every cell is a link, and the link goes to the evidence — not to a tooltip.** A cell renders
as `PASS` / `FAIL` / `UNMEASURED` and links to a detail view carrying, verbatim from
`register.json`:

- the predicate's question, and the one-line why it is on the register
- `evidence.source_url`, `evidence.fetched`, `evidence.http_status`, `evidence.bytes`
- `evidence.sha256` — the hash of the exact bytes, shown in full, copyable
- `evidence.matched` and `evidence.context` — the matched span in ±90 characters of its
  surroundings, so a reader can see a false positive without re-fetching anything
- the exact recompute command, copyable:
  `python3 scripts/benchmark_quality/register.py --explain <publisher>:<predicate>`
- for a narrowed predicate, `narrowed_after_run_1` — the false positive that changed the
  pattern. Show it. It is the strongest evidence on the page that the instrument is watched.

## UNMEASURED is rendered as itself

Not grey, not a dash, not an empty cell, never a zero, and never in the same visual family as
FAIL. An UNMEASURED cell shows its `reason` inline on hover and in full on the detail view. The
legend states, above the table:

> UNMEASURED means the bytes that would answer the question were not in the artifact — a
> client-rendered page, a redirect off-host, or an index with no attributable record. It is a
> result, not a zero and not a failure.

## The HELM row needs its own treatment

`helm-crfm` has 31 UNMEASURED of 35, from one cause. The row must carry, on the row itself and
not in a footnote: **"The results surface returned 45 characters of visible text — a
client-rendered shell. 31 predicates could not be read from it."** If a reader can scan this
page and come away thinking HELM scored badly, the page is wrong.

## Our own row

- Rendered **first**, above the others, not last and not in a separate section.
- Badged `SELF-ASSESSED` in the row, in the card, and in the legend.
- Beside the badge: *"a self-assessed row is not independent evidence about us."*
- The three failures in `README.md` appear as a short block above the table, in our own words,
  before any other publisher's failures are visible.

## What the page must not do

- No totals column that can be sorted. No default sort by PASS count. The table sorts by
  publisher name and by predicate, and by nothing else. If it can be ordered by score it will
  be read as a ranking, whatever the caption says.
- No adjective about any publisher. No "leader", "best-in-class", "laggard", "gap".
- No badge, seal, mark, tier or letter grade. No colour scale that implies a spectrum from bad
  to good — PASS/FAIL/UNMEASURED are three categories, not a gradient.
- No prices anywhere, including in the `commercial_offering_disclosed` cells, which record
  *that* a commercial offering is disclosed and never what it costs.

## Links out, in this order

1. `/interop/benchmark-quality/index.json` — the machine index
2. `/interop/benchmark-quality/2026-09-06/register.json` — every cell with its bytes
3. `/api/benchmark-quality?register=v1` — the API
4. `/api/benchmark-quality` — the v0.1 benchmark register, with the sentence explaining why one
   register excludes us and the other includes us
5. `/contact` — right of reply
6. `/api/corrections` — the corrections ledger

## Accessibility and dark mode

Verify by looking, on a real phone viewport, with a screenshot, before calling it done. The
three states must be distinguishable without colour (text label, not colour alone) and must
meet contrast in both themes. A shipped table that is illegible on a phone is a shipped table
nobody read.
