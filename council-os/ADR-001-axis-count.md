# ADR-001 — the axis count: what a slot is, and what MEASURED means

**Status:** in force. **Referenced by:** `canon.json` → `ruling_ref`.

> **Provenance of this file.** `canon.json` has cited `council-os/ADR-001-axis-count.md`
> as its `ruling_ref` while no such file existed anywhere in this repo's history — the
> guard named an authority a reader could not open. This file closes that gap. Its content
> is **transcribed** from artifacts that already carry the ruling: `canon.json` →
> `ruling` / `api._provenance`, and live `GET /api/gspc` → `totals.sweep_note` /
> `totals.by_family`. It records a decision already in force. **It does not make a new
> one**, and it establishes no number of its own — every figure below is quoted from a
> named field, per [`QUOTING-NUMBERS.md`](QUOTING-NUMBERS.md). Written 2026-09-05.

## Decision

The board publishes **two counts that must always travel together**:

- **`axes_total`** counts **SLOTS**. A slot is published so that a gap is *visible*. It is
  not evidence that anything was measured.
- **`measured_axes`** counts slots with a **real graded run behind them**. This is the
  number to quote if you quote only one.
- **`unmeasured_axes`** is published, not hidden, so the gap is legible.

All three are **DERIVED** from the axis arrays in
`functions/api/_gspc_axes_{a,b,fin}.ts` — never typed. That derivation is the point: if a
future slot is added with no run behind it, the grammar separates the two counts again on
its own, with no copy edit anywhere.

## State (read from live `GET /api/gspc` totals, 2026-09-05 — re-read before quoting)

`axes: 22` · `measured_axes: 22` · `unmeasured_axes: 0` · `quotable_axes: 22`
`public_count: "22 axis · 22 measured"`

By family (`totals.by_family`): **14 behavioural** GSPC axes — a model fleet answers a
frozen bank, graded deterministically — plus **8 financial/domain** axes, all MEASURED as
deterministic-facts runs.

## Measured is not scored

The eight financial/domain axes are graded **by rule, with no model, no fleet and no
judgement** — issuer-account flags read off the public ledger and public statistical
series. So none of the eight has a leader, an accuracy, or a separation determination, and
**none contributes to any published mean**. An axis with no accuracy contributes nothing,
never a zero.

This is the distinction the count grammar exists to protect: *measured* says a run
happened; it does not say anything was ranked.

Related, and recorded on the same endpoint so neither is silently folded into the count:

- **Own-model exclusion.** Council-specialist models are removed from the public per-axis
  leaders on 8 of the 14 model-comparison axes — a neutral measurement body does not rank
  its own models against the vendors it measures. This changes leader attribution and the
  separation/mean tallies, **NOT `measured_axes`**. The excluded models' signed cards are
  untouched: measurement happened; it is simply not published as a public ranking of our
  own model.
- **Uncarded leaders dropped.** On 3 axes the named leader carried no signed per-model card
  in `/signed/card_index.json`. The board's promise is that every named leader links to the
  Ed25519 card behind it, so where no such card exists **no leader is asserted rather than
  invented** (`public_leader_state=NO_SIGNED_CARD`). Each axis stays MEASURED — the fleet
  aggregate is a real measurement — so `measured_axes` is unchanged.

## How this state was reached (each reading superseded by data, not by copy)

| reading | counts | why it changed |
|---|---|---|
| pre-sweep | 14 / 14 / 14 | "14 measured of 14 quotable" |
| 2026-08-26 | 22 / 15 / 7 | 8 financial/domain slots ruled in 2026-08-24 but absent from the payload — the **un-swept** state, in which this endpoint honestly reported 14 |
| 2026-09-01 | 22 / 22 / 0 | the sweep: all 8 now carry published deterministic-facts run artifacts |

**Each was correct at its time.** The 15/7 reading was not an error to be embarrassed by —
it was the endpoint refusing to claim a measurement that had not yet been published.

## Attestation state — do not round this up

`totals.financial_run_attestations`: of the 8 financial run artifacts, **1** carries an
Ed25519 signature (`provenance-controls`); **7** are content-addressed and **unsigned**.

> **A `content_id` proves identity of bytes, not signer authorization.** No signature is
> ever inferred from a content_id.

## Consequences for anyone editing

1. **Change the value in `canon.json`, never on the live site.** `scripts/drift-guard.mjs`
   fetches the live site and asserts it matches; it goes RED within minutes of a clobber.
2. `canon.json` is the **one place in the estate where an axis count is written down** —
   it is the guard's expected value, and a guard must name the number it checks for. Every
   rendered surface derives from the endpoint instead.
3. When you change it there, read the new value off live `/api/gspc` and update
   `api._provenance` with what you read. Do not type it from memory.
4. **Keep the two counts together in public copy.** Quoting `axes_total` alone claims
   measurements that do not exist. `public_count` and `count_grammar` are safe to quote
   verbatim because they already carry both.

See also: [`CARD-CORPORA.md`](CARD-CORPORA.md) (the three card counts — a separate subject
that has been conflated with this one), [`QUOTING-NUMBERS.md`](QUOTING-NUMBERS.md),
`BOARD-RULING.md`.
