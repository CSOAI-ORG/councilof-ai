# Docket row re-read — 2026-11-01

**A dated, status-level re-read of every third-party surface the 130-row jewel state table names.**
Machine-readable: `public/interop/subject-axis-live-20261027/docket-row-reread-20261101.json` · observed at 2026-11-01T04:32:57.274Z.

---

## What this is, and what it is not

**It is** a dated re-read of the URLs the state table's evidence cells name, compared with the reading each
row recorded on 2026-10-27. 130 jewel rows, 126
distinct URLs, read today with the same reader and the same extractor the estate publishes.

**It is not** a text-level wave. The state table records HTTP status and bytes, not a capture-time
visible-text digest, so there is no digest baseline to diff against. This measures **reachability and
status**. A visible-text digest **is** computed on every read, so the *next* reading of this table has a
digest baseline and can be text-level.

## Method

| | |
|---|---|
| reader | Node `fetch`, not Python `urllib` — `councilof.ai` returns 200 to Node/curl and 403 to urllib under the Cloudflare rule `public-data: no BIC` |
| extractor | `csoai-visible-text/2` |
| extractor source | scripts/claim-capture.mjs, fetched from master |
| extractor sha256 | `10432c76c61b34ff9b726d2341844833b3e9a7fef19e5b77e5e545c45483559d` |
| pinned in | `public/spec/claim-maintenance/v0.2/reference/manifest.json` |
| pin verified | true |
| user agent | `Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36` |
| timeout / concurrency | 25000 ms / 6 |

**The extractor is the estate's, not a re-implementation.** It is checked against the sha256 pinned in the
published spec manifest *before* it is used. A re-implemented extractor would be a different measurement from
the captures it compares to.

## Negative control — passed

A URL that cannot exist is read **first**. If the reader reports it reachable, the whole run is void: a reader
that cannot fail cannot measure.

| | |
|---|---|
| control | `https://councilof.ai/__csoai-negative-control-never-exists__/` |
| status | **404** |
| required | unreachable |
| passed | **true** |

## Counts

| | |
|---|---|
| jewel rows | 130 |
| distinct URLs | 126 |
| **n_valid (reachable today)** | **89** |
| unreachable today | 37 |
| **status changed since 2026-10-27** | **6** |
| became unreachable | 3 |
| became reachable | 1 |

| threshold | state |
|---|---|
| n_valid ≥ 30 (the slot's own threshold) | **MET** |
| negative control discriminates | **MET** |

## The 6 status changes

| row | target | 2026-10-27 → today | note |
|---|---|---|---|
| CJ-08 | `https://www.w3.org/community/agent-conformance/participants` | 200 → **403** | became unreachable |
| CJ-09 | `https://www.w3.org/community/agent-identity/participants` | 200 → **403** | became unreachable |
| CJ-25 | `https://claude.ai/directory` | 403 → **200** | became reachable |
| CJ-43 | `https://www.opensource.org/` | 200 → **403** | became unreachable |
| CJ-43 | `https://www.opensource.org/metrics` | 404 → **403** | status flip |
| CJ-83 | `https://www.un.org/en/scientific-panel-on-ai` | 403 → **404** | status flip |

**What these mean, and what they do not.** A 403 is a **reachable path that refuses this client** — it is
not a dead link, and it is not a zero. A 404 is a path that does not exist. The 403s are concentrated on
hosts that refuse an unrecognised agent (`w3.org`, `opensource.org`, `nccoe.nist.gov`, `ipo.gov.uk`,
the IETF's TPAC pages) and on `claude.ai/directory`, which **became reachable** today. A 403 is a state, not
a measurement of the subject's claim; nothing here moves a row's verdict on its own.

## Two findings the re-read produced

1. **The published state table carries malformed URLs.** Its Evidence cells are cut at a fixed character
   budget, and where a URL lands on the cut the **published table** carries the fragment:

| row | published fragment | read today | note |
|---|---|---|---|
| CJ-01 | `path:/spec/claim-maintenanc` | 404  | the Evidence cell is cut at the table column boundary and the URL is cut with it |
| CJ-06 | `https://da` | 0 (TypeError) | the Evidence cell is cut at the table column boundary and the URL is cut with it |
| CJ-15 | `https://www.canada.ca/en/department-finance/news/2026/03/canada-announces-progress-to-est` | 404  | the Evidence cell is cut at the table column boundary and the URL is cut with it |
| CJ-32 | `https://www.iana.or` | 0 (TypeError) | the Evidence cell is cut at the table column boundary and the URL is cut with it |
| CJ-36 | `https://eic.ecuropa` | 0 (TypeError) | the Evidence cell is cut at the table column boundary and the URL is cut with it |
| CJ-38 | `https://www.ukri.or` | 0 (TypeError) | the Evidence cell is cut at the table column boundary and the URL is cut with it |
| CJ-42 | `https://xrpl.org/ecosystem/gl` | 404  | the Evidence cell is cut at the table column boundary and the URL is cut with it |
| CJ-73 | `https://www.presidency` | 0 (TypeError) | the Evidence cell is cut at the table column boundary and the URL is cut with it |
| CJ-91 | `https://openinventionnetwork.com/community-of-lice` | 404  | the Evidence cell is cut at the table column boundary and the URL is cut with it |
| N-03 | `https://genorma.com/en/standards/pren-iso-iec-232` | 404  | the Evidence cell is cut at the table column boundary and the URL is cut with it |

   **10 cells, 10 distinct fragments, 10 rows.** Each fragment is cut at the cell boundary, so it is not a URL — which is why the read of it cannot resolve. **These are not repaired here.** The full URL behind each fragment is recorded nowhere in the estate, so repairing the cell would mean guessing one — and a guessed URL in a state table is a fabricated measurement. The defect is recorded, not quietly patched.

   **1 further cell end in a fragment the read cannot adjudicate.** A 403 proves the host *refused* this client, not that the path is absent, so a refused fragment is reported separately rather than counted as a proven truncation:

| row | published fragment | read today | why it is not counted as proven |
|---|---|---|---|
| CJ-80 | `https://www.w3.org/2026/TPA` | 403 | the cell ends in a URL fragment and the host refuses this client, so the read cannot distinguish a cut fragment from a live path |
2. **A dated note that contradicted the live register is now corrected.** The 30 September convergence note
   (`_alignment/CLAIM-MAINTENANCE-CATEGORY-CONVERGENCE-20260930.md`) carried *"scheduled subject coverage:
   92.86%"* from a register version of 25–28 September. The live register today (`as_of 2026-10-08`) reads
   `scheduled_next_read 0`, `due_unrun_next_read 0`, `completed_scheduled_read 21`. The note received a
   **dated correction** on 2026-10-30 — a dated record is not rewritten, and the error is kept visible.

## Unreachable today — 37 of 126

These are recorded in full in the machine-readable artefact, with the status and the error each returned.
A `TypeError` is a transport failure (the host did not answer at all within the timeout); a 403 is a
refusal; a 404 is a path that does not exist. **None of these is a zero, and none of them is a measurement of
the subject's claim.** Absence is a state.

## What this does not do

- It does not change any row's verdict. The verdict is a human adjudication against the evidence, and the
  evidence here is *reachability*, dated.
- It does not close a jewel. It re-reads the surfaces the jewels' rows point at.
- It does not certify anything, and it mints no card and signs nothing.

**Measurement, never a certification.**

---

*Reader: `Node fetch, not Python urllib: councilof.ai returns 200 to Node/curl and 403 to urllib under the Cloudflare rule `public-data: no BIC`.` · Extractor: the estate's, sha256-verified against its published pin.*
