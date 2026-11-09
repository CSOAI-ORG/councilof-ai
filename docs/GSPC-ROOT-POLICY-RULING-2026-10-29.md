# ROOT-POLICY RULING — the public root is a deduplicated current-state set, not an append-only log

**Ruled:** 2026-10-29 · **Evidence gathered:** 2026-10-28/29 from the estate's own builder, its own root history, and
the live root. **Status:** this is a ruling about what the published structure *is* and how it must be described. It
changes no code and moves no number.

---

## The ruling

**The public root stays a deduplicated current-state set with sticky card membership. It is not an append-only log, and
the public copy must stop implying that it is. The append-only property belongs to the signed card index and the
corrections ledger, which are separate corpora — the root is the *snapshot* those corpora are summarised into.**

The implementation already behaves this way. The gap was never in the code; it was in how the structure is described.

---

## Why, in five pieces of evidence

**1. The builder says so in its own words.** The root builder states that *"the root is a coverage SNAPSHOT, not an
append-only log"*. The leaf-union builder that assembles it uses **RFC 6962 domain separation** over the leaves it
selects — a Merkle tree over the current membership set, not a chain of history.

**2. The root's own history loses members.** Across the 69-entry root history, `card_count` moves in both directions:
`-2`, `-1`, `-3`, `-4`, `-6`. **An append-only structure cannot lose members.** A set can.

**3. Master and live disagree on membership at equal size.** The root in the repository and the root served at
`https://councilof.ai/root.json` carry the **same count (325)** but **67 different leaves**. That is a recomputed
membership set, not an appended history: if it were append-only, the live root would be a superset of the repository
root, not a different set of the same size.

**4. Sticky cards are the mechanism that stops measurement loss.** The builder's retention logic keeps a card's
membership sticky so that a measurement already published is not silently dropped when the current set is recomputed.
That is the correct trade for a *snapshot*: coverage without false accumulation.

**5. The append-only surfaces exist, and they are elsewhere.** The corrections ledger carries **58 withdrawn** and
**1,682 superseded** entries — both confirmed against live sources. Those are the append-only record. The root
summarises; the ledger remembers.

---

## What this ruling does and does not do

| | |
|---|---|
| **Does** | record the decision, so the public description of the root matches what the root does |
| **Does** | keep the existing implementation — no code change is required, and none was made |
| **Does not** | convert the root into an append-only log |
| **Does not** | change any count, merkle root, signature or leaf |
| **Does not** | move any axis to MEASURED, and confers no status on anything |

## What this ruling obliges

1. **The public copy stops implying append-only.** Where the root is described as an append-only ledger or an
   ever-growing log, that wording is wrong and must be corrected. A snapshot that drops members is not a log.
2. **The two corpora stay named separately.** The public root (324 catalogued leaves when this ruling was made) and the
   signed card index (335 declared, 335 rows — internally consistent, but a different number again) have **no id in
   common**. Neither is
   a subset of the other by construction, and neither may be presented as the other.
3. **The card index's 335 and the root's 324 are not a defect to be reconciled by fiat.** They are two different
   corpora with two different membership rules. The live verifier already reports this distinction rather than
   reconciling it.

### The ruling, demonstrated by the estate's own overnight run — 2026-10-30

The root recomputed overnight and **moved to a different merkle root at the same 326 leaves**
(`7bd83223baf71d04…` → `aab2825a63efc7c7…`, `as_of 2026-10-30T00:58:22Z`), confirmed on Bitcoin at block height **973757**
(block hash `0000000000000000000032a93db644f2235d6257ee69a75d63570b76730049b2`, block time 2026-10-30T01:02:10Z) and
served live byte-identical to master. **An append-only structure cannot change its root without adding a leaf.** A
membership set recomputed over time can, and this one did — which is what this ruling says it is. The counts in the
paragraphs above are dated readings; the shape is the ruling.

## The gap this ruling does not close — CORRECTED 2026-10-30

**This paragraph was wrong when it was published on 2026-10-29. The correction is recorded here rather than quietly
edited away.**

As published it read: *"`/state-of-claim-maintenance/` returns **404** while the live register claims **92.86%** coverage
against `due_unrun_next_read: 26`."*

**Two errors, both measured.**

1. **The live register never claimed 92.86% coverage.** No version of `register.json` carries a coverage percentage at
   all — it holds raw counts only. The **92.86%** is in the estate's 30 September convergence note
   (`_alignment/CLAIM-MAINTENANCE-CATEGORY-CONVERGENCE-20260930.md:59-60`: *"subjects with scheduled next read: 26"*,
   *"scheduled subject coverage: 92.86%"*), which derived it on 30 September from the register version then live:
   26 of 28 subjects had a scheduled next read, and 26/28 = 92.857%. That note is a working document in `_alignment/`,
   not a published estate page.
2. **The 26 was live on 2026-10-27, and not on 2026-10-29.** It is the same set of 26 subjects under a different field
   name in a later register version. The register's own history:

| register `as_of` | published | `scheduled_next_read` | `due_unrun_next_read` | `completed_scheduled_read` |
|---|---|---|---|---|
| 2026-09-25 / 2026-09-28 | 25–30 Sep | **26** | — | — |
| 2026-10-01 | 1 Oct | 0 | **26** | — |
| 2026-10-08 | 29 Oct | 0 | 0 | **21** |

The published sentence paired the note's coverage percentage with the live register's due-unrun count — two different
register versions, two different field names, one set of 26 subjects — and attributed both to a register that carried
neither.

**What the live register says today** — `https://councilof.ai/spec/claim-maintenance/register.json` → **HTTP 200**:

| field | value |
|---|---|
| `as_of` | 2026-10-08T05:40:55Z |
| `subjects_with_a_scheduled_next_read` | **0** |
| `subjects_with_a_due_unrun_next_read` | **0** |
| `subjects_with_a_completed_scheduled_read` | **21** |
| `subjects_with_due_execution_unverified` | **5** |

The register is **served**, and so is the human page at `https://councilof.ai/claim-maintenance/` → **HTTP 200**. The
path `/state-of-claim-maintenance/` still returns 404, but **no live surface names it**: the only places that named it
were the 30 September convergence note (a working document in `_alignment/`) and this docket's own documents.

**The gap that actually remains** is smaller and different. The register is live; what is missing is **report #1** — the
state table's CJ-49 row asks for a published State of Claim Maintenance report, and no such report exists. The
30 September note's *"92.86% scheduled coverage"* still contradicts the register's own totals, so on 2026-10-30 that
note was given a **dated correction** rather than a rewrite — a dated record is not rewritten, and the error is kept
visible. Neither is affected by this ruling.

**Measurement, never a certification.** This ruling describes the shape of a published structure. It decides nothing
about whether any measured claim is true, and it grants no status to any subject.
