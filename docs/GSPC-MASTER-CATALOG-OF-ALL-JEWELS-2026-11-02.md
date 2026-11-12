# CSOAI — MASTER CATALOGUE OF ALL JEWELS · 2026-11-02 (repaired edition)

**Published:** 2026-11-02 · **Page:** `/jewels/master-catalogue/` · **JSON:** `/jewels/master-catalogue/index.json`
**Supersedes the 2026-11-01 edition** (still published, still readable, not edited).

Three laws govern every line, and they are the estate's own, not mine:

1. **A signed artefact is not a true artefact.** Signature and presence prove where bytes came from. They never prove the
   number inside.
2. **The measurement must not manufacture the evidence it measures.** Where the only way to "finish" a jewel would be to
   mint the evidence, the jewel stays open and the blocker is named.
3. **Absence is a state.** A refused URL, an unreachable endpoint, an unmeasured axis: each is recorded in its own state
   and never converted to a zero, a failure, or a score.

---

## 1. The state table is repaired at the source

The published state table's evidence cells were truncated at **220 characters** by the builder that made it
(`merge-catalogue.mjs`, lines 57–58), so a URL landing on the cut was published cut. Ten rows carried a malformed URL and
one cell was indeterminate.

On 2026-10-30 this was recorded as **unrepairable**: the full URL was recorded nowhere the table could reach, so a repair
would have meant guessing one — and a guessed URL in a state table is a fabricated measurement.

It is repairable now, and **not by guessing**. The table was built from the estate's own published lane audit JSONs, which
carry each row's full evidence string. The repaired cell is that text **byte for byte**, and every recovered URL was
asserted to appear verbatim in the lane JSON it is attributed to.

| | |
|---|---|
| rows repaired | **129 of 130** (one row's evidence was short enough never to be cut) |
| URLs recovered | **38** |
| rows refused | **0** — no cell was repaired without its source being verified |
| distinct URLs named, before | 126 |
| distinct URLs named, after | **242** |
| URLs that answer, before | 89 |
| URLs that answer, after | **156** |

The truncated cells were hiding **116 surfaces the estate had already read**, 67 of which answer.

## 2. The board moved, and the old reading is kept visible

| What | The 2026-11-01 edition said | Today | State |
|---|---|---|---|
| the board | 33 axes · 23 measured · 10 unmeasured | **34 axes · 34 measured · 0 unmeasured** | SUPERSEDED THREE TIMES TODAY — a 34th axis (`watchdog-ingest`) was declared UNMEASURED at 04:33Z, `claim-maintenance` was promoted to MEASURED at 07:03Z, and the remaining subject axes acquired frozen sha-pinned banks with runs behind them. Each step is named, not dropped |
| the public root | 331 leaves | **428 leaves** | SUPERSEDED — the root advanced; the edition did not |
| the docket re-read | 126 URLs, 89 readable | **242 URLs, 156 readable** | SUPERSEDED — by a repaired defect, not by a change in the field |

A dated record is not rewritten and the error is kept visible. The 2026-11-01 edition stands as it was published.

## 2b. The board moved three times today, and the residue it left

The first build of this edition read the board as **34 axes · 23 measured · 11 unmeasured**. The next read was
**34 · 24 · 10** — **`claim-maintenance` moved to MEASURED** — and the reading at publication time is
**34 · 34 · 0**: the remaining subject axes acquired frozen sha-pinned banks with runs behind them.

The board is being actively re-measured by other lanes today. So the figure in this edition is a **reading at
a stated timestamp**, the live board remains the authority, and the chain of readings is published rather than
smoothed over.

The axis on the board now carries:

| field | value |
|---|---|
| status / kind | `MEASURED` · `measured-subject` |
| method | `claim-maintenance v0.2` |
| method_sha | `32470d102112154b14a4d5530d71d7a30ecc2acdc5cd8c906c21f672b1deeef7` |
| bank | `public/interop/claim-maintenance-wave-2026-10-28.json` |
| bank_sha256 | `a62b017a9081b817613c03887c3c6690597a2016ea175f9d95c211d593db0877` |
| facts_as_of | `2026-10-28T06:05:00Z` |
| n | 174 |

**The residue.** The corrections ledger carries 93 entries. Four of them mention claim-maintenance — and all
four are dated 29–30 September, concerning the claim-maintenance *category*'s re-read schedule and the
23-axis count, not the axis's promotion. **None of them names this promotion.** So the promotion is visible
on the board and absent from the dated ledger of changes.

This catalogue records what the board says and does not assert who ruled it. The missing ledger entry is
carried as an owner gate rather than quietly assumed away.

## 3. The second text-level diff, over the repaired table

110 URLs were read on both 1 and 2 November with a visible-text digest. **14 changed their visible text** and 2 changed
their HTTP status. Text that changes under an unchanged status is invisible to a status-level reading.

## 4. What the other lanes shipped

Eight sessions work this estate in parallel. The catalogue is the reconciled picture, so what they merged since
2026-11-01 is recorded on the page with its pull request, and the new live surfaces they shipped are recorded as jewels
J-157 through J-163.

## 5. Reproducibility

```bash
# the repaired table and its provenance
node ~/jewel-audit-20261027/build-repaired-table.mjs
node ~/jewel-audit-20261027/re-read-docket-rows-20261102.mjs \
     ~/jewel-audit-20261027/publish-20261102/GSPC-JEWEL-STATE-TABLE-2026-11-02.md \
     ~/jewel-audit-20261027/out/docket-row-reread-20261102.json
node ~/jewel-audit-20261027/build-catalogue-20261102.mjs
```

**The extractor is the estate's own** `scripts/claim-capture.mjs`, sha256
`10432c76c61b34ff9b726d2341844833b3e9a7fef19e5b77e5e545c45483559d`, matched against the sha256 pinned in the published
spec manifest. The run refuses to measure if the pin does not match. A negative control — a URL that cannot exist — is
read first; a reader that cannot fail cannot measure.

**Not a certification.** This catalogue counts and quotes. It decides nothing about whether any measured claim is true,
and it grants no status to any subject.

## 6. The gates, run against the estate's own code

Not approximated this time. `gate-check-20261102.mjs` imports `scripts/brand-gate.mjs` and `scripts/link-gate.mjs` from
master and runs the estate's own `visibleText()`, `scanRendered()`, `jsonDisplayHits()`, `linksIn()` and `isServed()`
against a modelled built tree — `public/**`, the `functions/**` route walk, `client/src/data/route-manifest.ts`,
`public/_redirects` — plus the paths this publication adds.

**Result: 0 brand failures, 1 held report, 0 NEW dead same-origin URLs across 282 links.** The held report is the
`certificate_term` rule matching the jewel name *Merkle Tree Certificates* (row CJ-88) — a rule that reports and does
not fail, on a row name the state table already carried.

That check earned its keep. The first run found **five NEW dead same-origin URLs** in the repair record: the quoted
2026-10-27 cells carry absolute URLs for paths the site does not serve — which is the very defect being repaired — and
a machine surface that publishes a dead absolute URL sends a consumer to nothing. Those are now published in the
estate's `path:/` form with the host and path in separate fields.

It also found that the repair builder had been edited with a **missing closing parenthesis** and had never been
syntax-checked, so the record it would have produced was never built. The repaired table's own bytes are unchanged
by that fix (`be57c4b9daa241375932dbea301db3a70c65adc889087b56d067d61fbf210735`, 130,166 B).

## 7. What this publication adds to the tree

| Path | What it is |
|---|---|
| `public/jewels/master-catalogue/index.html` | the page, replaced with this edition |
| `public/jewels/master-catalogue/index.json` | machine-readable, replaced with this edition |
| `public/interop/subject-axis-live-20261027/docket-row-reread-20261102.json` | the read this edition cites |
| `public/interop/subject-axis-live-20261027/state-table-repair-2026-11-02.json` | the repair record, published as a machine surface |
| `docs/GSPC-JEWEL-STATE-TABLE-2026-11-02.md` | the repaired table |
| `docs/GSPC-MASTER-CATALOG-OF-ALL-JEWELS-2026-11-02.md` | this receipt |
| `docs/DOCKET-ROW-REREAD-2026-11-02.md` | the read's receipt |

The 2026-11-01 edition's own files are untouched and remain published.

