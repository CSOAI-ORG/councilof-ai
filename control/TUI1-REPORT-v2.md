# TUI-1 Canonical Controller — Verified Report (v2.1)

**Observed:** 2026-10-07T04:20:55Z
**Branch:** `control/canonical-state-20260911` · **PR:** #2847
**Basis:** master `b3a44080e9be8cbc975bbc4ad44f3897385f3c43`
**Machine ledger:** `control/canonical-state-20261007.json`

> **Doctrine applied.** The estate declares one authority per record type, `GET /api/state`,
> with the rule: *"If a number is not in this payload, it is NOT established — do not carry it
> forward from an older report, and do not reconcile two stale figures by picking one."*
> Every count below is quoted **by field name with its `as_of`**. This file is a dated
> observation, not a second count authority.

---

## 1. What changed since the 11 Sep baseline

The brief's baseline is 26 days old. Four of its eight lines are now superseded:

| Baseline claim (11 Sep) | Live truth (7 Oct) | Source |
|---|---|---|
| 425 stablecoins indexed across 211 chains | **still 425 indexed — but measured is 6** | `/api/coverage-truth` |
| Deep measurement is incomplete | **6 of 425 measured** (never 425) | `/api/coverage-truth` |
| 167 cards in the current public Merkle root | **319 leaves** | `/api/state → public_root.card_count` |
| Rekor witnessed at log index `2791822965` | **log index `3012420819`** | `/interop/root-witness-latest.json` |
| OTS submitted, awaiting Bitcoin confirmation | **`CONFIRMED_BITCOIN`** — blocks 969264, 969266, 969288, 969296 | witness `ots.status` |
| Base EAS / XRPL memo incomplete | **still `NOT_YET`** (unchanged, owner-gated) | witness |
| 0.01 USDC existing-data offer to 11 Oct 2026 | **confirmed live**: `amount:"10000"` atomic on Base | live 402 challenge |
| Free door remains zero | **confirmed live**: `amount:"0"` | live 402 challenge |
| 335-card historical corpus | **still 335** (`signed_cards.count`) | `/api/state` |

Board moved **22 → 23 axes · 23 measured** (ADR-002, slot 23 effect-binding, 22 Sep).

---

## 2. Coverage — denominators and numerators

`/api/coverage-truth` (observed 7 Oct) separates four lifecycle states and **never sums them**:

| Kind | Numerator | Denominator | State |
|---|---|---|---|
| INDEXED | 1,279 | — | catalogued |
| RUNNABLE | 238 | — | probed |
| MEASURED | 12 | — | signed card body |
| SIGNED | 319 | — | live root |
| stablecoins measured | 6 | 425 indexed | **6/425 — never 425** |
| mcp-trust runnable | 238 | 500 indexed | probed |
| `summary.reconciliation_ok` | **`false`** | — | **INCOMPLETE (B-04)** |

---

## 3. Trust chain — seven layers, never collapsed

| # | Layer | State | Identifier |
|---|---|---|---|
| 1 | Card signature | `VERIFIED_BY_AUTHORITY` | Ed25519 · `d4cb0eaa…` · board `did:web:csoai.org#board-attestation-1` `9367cf59…` |
| 2 | Merkle root inclusion | `VERIFIED` | `47277a6f2034e80b…` · 319 leaves · as_of 2026-09-30T05:05:34Z |
| 3 | Rekor witness | `WITNESSED` | log index **3012420819** · uuid `108e9186…44516d84d6064121` |
| 4 | OTS submission | `CONFIRMED_BITCOIN` | proof `6ac9dd07…` · subject `f1913eca…` |
| 5 | Bitcoin confirmation | `CONFIRMED_BITCOIN` | blocks 969264 / 969266 / 969288 / 969296 · scope **PUBLIC_ROOT_BYTES_ONLY** |
| 6 | Base EAS | `NOT_YET` | no attestation matches this root sha256 · **owner-gated** |
| 7 | XRPL memo | `NOT_YET` | needs funded XRPL account · **owner-gated** |

**Boundary:** the Bitcoin timestamp proves these exact `root.json` bytes existed no later than
block 969264. It does **not** prove correctness, completeness, compliance or certification, and
it does **not** anchor the 335-card index or any mill card.

**Signature verification: PARTIAL (B-05).** Verified this session: board attestation fields,
Rekor identifiers, and `ots.subject_sha256 == root.json bytes sha256`. **Not** re-executed:
`verify-card.mjs` over the 335 bodies (authority reports 335/335 valid, as_of 2026-09-29) and
independent Merkle path recomputation over 319 leaves.

---

## 4. Revenue — external separated from internal

| Class | Count | Amount |
|---|---|---|
| `EXTERNAL_CUSTOMER` | 2 distinct non-self payers | **$0.03** (30,000 atomic USDC) |
| `INTERNAL_SELF_FUNDED` | 22 self-settlements | $0 — excluded by definition |
| `ZERO_VALUE_PROBE` | 8 zero-value settlements | $0 — "paying nothing does not make a buyer" |
| `UNKNOWN` | 0 | — |

SKU-1 issuances **13 MEASURED** · SKU-2 proofs **1 MEASURED** · SKU-3 licences **null UNMEASURED**
(null, never 0). Authority caveat, verbatim: the figure *does not independently reconcile the
on-chain transfer amount or establish a customer relationship*.

---

## 5. Costs — actual spend

| Item | Amount |
|---|---|
| **Actual spend this session** | **$0.00** |
| Funding source | none — read-only HTTP GETs + GitHub API reads |
| On-chain transactions | 0 |
| Credentials created | 0 · External forms submitted = 0 · Emails sent = 0 |
| Owner-gated pending | Base EAS (~$0.01–0.05) · XRPL memo (~0.00001 XRP) · x402 settlement tests (0.01 USDC/door) · IETF dispatch |

x402: 3 free doors at `amount:"0"`, 31 paid resources at `amount:"10000"` (0.01 USDC) —
**read from live 402 challenges, not from memory**. `/api/witness` remains
`QUARANTINED_PRE_RELEASE`, `buyable:false`.

---

## 6. Directory status

`/.well-known/layer-o-presence.json` (as_of 2026-09-30T06:10:51Z): **159 surfaces —
70 MEASURED / 89 UNMEASURED**, PUBLISHED 28, QUALIFIED 51, DISCOVERED 46, UNSUPPORTED 21.

`public/interop/mcp-directories.json` (as_of 2026-09-14): mcp-registry **LISTED** ·
smithery **LISTED** · glama **LISTED** · lobehub **LISTED** · pulsemcp **UNKNOWN** ·
mcp-so **UNKNOWN** · cline **NOT_LISTED** · docker-mcp **NOT_LISTED**.
(`UNKNOWN` is a permitted state and is **not** `NOT_LISTED`.)

---

## 7. Claims rejected or corrected — 11

| ID | Surface | Was | Now |
|---|---|---|---|
| COR-01 | same branch, v2.0 `0cf59ee4b567` | OTS `STAMPED_PENDING_BITCOIN` | **`CONFIRMED_BITCOIN`** (blocks 969264+) |
| COR-02 | same | mill signed = 2,872 | 2,872 **directory basenames**; 2,868 card files; 2,810 signed−withdrawn |
| COR-03 | same | mill unsigned = 2,112 | 2,112 basenames; **2,111** card files |
| COR-04 | same | `total_signed_all_corpora = 3,207` | **REJECTED** — sums SEPARATE_CORPORA |
| COR-05 | same + report | open PRs = 5 | **10** (7 Oct 04:18Z) |
| COR-06 | same | observed_at `2026-10-07T12:00:00Z` | **04:20:55Z** — was 7h40m in its own future |
| COR-07 | same | "TUI-2…6 STALE, no PR" | TUI-6 has **3 merged** PRs (2155/2180/2202); TUI-1 #1943 merged |
| COR-08 | TUI-1 v1 (closed 11 Sep) | 22 axes, root 167, Rekor 2791822965 | 23 axes, root **319**, Rekor **3012420819** |
| COR-09 | `HERMES-EXECUTION-LEDGER-20260912.md` | 22 axes, root 169, OTS pending, 1,493 mill signed | **STALE — contradicts live** |
| COR-10 | `TUI-1-CANONICAL-STATE.json` (master root) | 22 axes, root 167, OTS pending, CR-015 insurance live | **STALE — CR-015 RETIRED** (C-2026-0902-06) |
| COR-11 | goal brief itself | Rekor 2791822965, OTS awaiting | **superseded by time** |

COR-09/COR-10 are **not edited** — replacing a root-level ledger is an owner decision (B-01).

---

## 8. Six-TUI execution state

| TUI | Branch | PR state | Verdict |
|---|---|---|---|
| 1 Controller | `control/canonical-state-20260911` | **#2847 OPEN / MERGEABLE** | VERIFIED_WITH_CORRECTIONS |
| 2 Finance | `finance/full-spread-20260911` | #1903, #1944 closed unmerged | INCOMPLETE |
| 3 Models | `models/verified-expansion-20260911` | #1906, #1942 closed unmerged | INCOMPLETE (36 cards STAGED) |
| 4 Agents | `agents/discovery-consolidation-20260911` | #1900/#1907/#1917/#1921 closed | INCOMPLETE |
| 5 Trust | `trust/anchor-completion-20260911` | #1904 closed; sibling `-v2` at `252dfa3da2` | INCOMPLETE (layers 6–7 owner-gated) |
| 6 Growth | `growth/verified-launch-20260911` | #2155/#2180/#2202 **MERGED** 13–14 Sep | PARTIAL |

Scope items with **no artefact on master**: ISO 20022 family count (**MISSING**), AP2
implementation (**MISSING** — crosswalk only, upstream spec 404 since 24 Sep), COBOL
(**marketing landing only**, `do_not_demo:true`, no signed card).

---

## 9. Completion condition

| Requirement | State |
|---|---|
| Coverage denominators/numerators | ✅ VERIFIED |
| Live URLs | ✅ VERIFIED (13 endpoints checked; DOI = **410 GONE**) |
| Commit + PR identifiers | ✅ #2847 |
| Signature verification | ⚠️ **INCOMPLETE — PARTIAL** (B-05) |
| Root + witness identifiers | ✅ VERIFIED |
| Actual costs | ✅ $0.00 |
| External revenue separated | ✅ 2 / 22 / 8 |
| Directory status | ✅ VERIFIED |
| Unsupported claims corrected | ✅ 11 |
| **No unresolved duplicate source of truth** | ❌ **CONTRADICTED (B-01)** — two stale root ledgers |

**The six lanes are not complete.** Two completion conditions fail: signature verification is
partial, and master still carries two root-level ledgers that contradict `/api/state`.

---

## 10. Remaining blockers (12)

**B-01** CONTRADICTED · duplicate source of truth — two stale root ledgers · *owner approval to replace with `/api/state` pointers*
**B-02** BLOCKED · Base EAS `NOT_YET` · *owner approval, ~$0.01–0.05*
**B-03** BLOCKED · XRPL memo `NOT_YET` · *owner approval + funded account*
**B-04** INCOMPLETE · `coverage-truth reconciliation_ok=false` · *TUI-2*
**B-05** INCOMPLETE · signature verification PARTIAL · *run `verify-card.mjs` over 335 bodies*
**B-06** MISSING · ISO 20022 family count · *TUI-2*
**B-07** MISSING · AP2 implementation; upstream spec 404 · *TUI-4*
**B-08** INCOMPLETE · deep measurement 6/425 · *compute budget*
**B-09** BLOCKED · Zenodo DOI **HTTP 410 GONE** · *owner appeal*
**B-10** BLOCKED · five of six lanes have no open PR · *owner direction: reopen or retire*
**B-11** INCOMPLETE · COBOL marketing landing only · *never describe as measured*
**B-12** INCOMPLETE · 1,460 mill files withdrawn (58) or superseded (1,402) · *never admitted*
