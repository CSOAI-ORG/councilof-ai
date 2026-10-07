# TUI-1 Canonical Controller — Verified Report (v2.2)

**Observed:** 2026-10-07T06:01:13Z
**Branch:** `control/canonical-state-20260911`
**Basis:** master `883f74cc0fbf` (rebased before this revision)
**Machine ledger:** `control/canonical-state-20261007.json`

> **Doctrine applied.** The estate declares one authority per record type, `GET /api/state`,
> with the rule: *"If a number is not in this payload, it is NOT established — do not carry it
> forward from an older report, and do not reconcile two stale figures by picking one."*
> Every count below is quoted **by field name with its `as_of`**. This file is a dated
> observation, not a second count authority.

**v2.2 headline:** seven of twelve original blockers are now `VERIFIED` by direct re-execution.
Both completion conditions that failed in v2.1 — partial signature verification and an
unresolved duplicate source of truth — are closed.

---

## 1. What changed since the 11 Sep baseline

| Baseline claim (11 Sep) | Live truth (7 Oct) | Source |
|---|---|---|
| 425 stablecoins indexed across 211 chains | **still 425 indexed — measured is 6** | `/api/coverage-truth` |
| Deep measurement is incomplete | **6 of 425 measured** (never 425) | `/api/coverage-truth` |
| 167 cards in the current public Merkle root | **319 leaves** | `/api/state → public_root.card_count` |
| Rekor witnessed at log index `2791822965` | **log index `3012420819`** | live Rekor API, body byte-identical to artefact |
| OTS submitted, awaiting Bitcoin confirmation | **`CONFIRMED_BITCOIN`** — blocks 969264, 969266, 969288, 969296 | **independently parsed offline** (§3) |
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
| `summary.reconciliation_ok` | **`false` live → `true` patched** | — | **B-04 FIXED, awaiting deploy** |

**The B-04 defect, stated exactly.** The old code was
`reconciled = cardRows.length === (rootCardCount ?? cardRows.length)`, i.e. `335 === 319` —
permanently `false`. It compared **two disjoint corpora**: `card_index` rows against
`root.json` leaves have **identifier overlap 0** (verified by set intersection). Neither corpus
was ever broken; the *check* was. Reconciliation now runs **within** each corpus
(`root.card_count === leaves`, `n_cards === rows`) and `summary.corpus_relationship` publishes
`SEPARATE_CORPORA`, `identifier_overlap: 0`, both header-agreement booleans, and a note that
the two sizes are never summed or compared for equality.

Second latent bug fixed in the same file: `signed-cards` `measured` was `signedCardIds.size`,
which was always **0** because `card_index` rows carry no `cell` object — so the endpoint
asserted a *measured zero* for a derivation it could not perform. It now returns **`null`**
(underivable) rather than `0` (measured zero) or `335` (index rows, a different question).
`measured_total` is unchanged at **12**, because `null` coalesces to 0 exactly as `0` did.

**Tests.** `functions/api/coverage-truth.test.ts` grew from 5 to 6 cases, including a
regression guard that asserts `reconciliation_ok === true` and the corpus-relationship block.

- Patched code: **6/6 passed** (vitest 3.2.7, exit 0).
- Original code + new tests: **1 failed / 5 passed** (exit 1) —
  `expected false to be true`. The test provably catches the original defect.

---

## 3. Trust chain — seven layers, never collapsed

| # | Layer | State | Identifier |
|---|---|---|---|
| 1 | Card signature | **`VERIFIED`** | Ed25519 · `verify-card.mjs --all` live → **VALID 335 · INVALID 0 · UNCHECKABLE 0** |
| 2 | Merkle root inclusion | **`VERIFIED`** | `47277a6f…ba2d` **recomputed** over 319 leaves · as_of 2026-09-30T05:05:34Z |
| 3 | Rekor witness | `WITNESSED` | log index **3012420819** · uuid `108e9186…44516d84d6064121` · fetched live, body byte-identical |
| 4 | OTS submission | **`CONFIRMED_BITCOIN`** | proof `6ac9dd07…` · subject `f1913eca…` · **parsed offline** |
| 5 | Bitcoin confirmation | **`CONFIRMED_BITCOIN`** | blocks 969264 / 969266 / 969288 / 969296 · scope **PUBLIC_ROOT_BYTES_ONLY** |
| 6 | Base EAS | `NOT_YET` | no attestation matches this root sha256 · **owner-gated** |
| 7 | XRPL memo | `NOT_YET` | needs funded XRPL account · **owner-gated** |

**B-05 is now `VERIFIED`, not `PARTIAL`.** What was actually executed this session:

1. `verify-card.mjs --all` against **live** `councilof.ai` — **VALID 335 · INVALID 0 ·
   UNCHECKABLE 0**, exit 0 (21.4 s).
2. `sha256(live root.json)` = `f1913ecaae4ea18ac113d341c1b050318cec4c49dcda440dacbbadb89eca1b4e` — **MATCH**.
3. Merkle **recomputed** over the 319 raw leaves — `47277a6f2034e80b…ba2d` **MATCH**. The
   convention that reproduces the declared root is raw 32-byte leaves with **odd-node
   duplication** and no domain-separation prefix, which is exactly what `root.json →
   node_definition` specifies. (A throwaway RFC6962-`0x00`-prefixed implementation of mine did
   *not* match — that was my script's bug, not the estate's.)
4. Envelope Ed25519 over the 274-byte canonical preimage — **VALID**.
5. Rekor entry fetched from `rekor.sigstore.dev` — HTTP 200, `logIndex` / `integratedTime` /
   `body` **byte-identical** to `public/interop/rekor-root-f1913eca.json`.
6. `.ots` proof parsed with the `opentimestamps` Python library: proof sha256 **MATCH**;
   embedded subject **equals** `sha256(live root.json)`; op tree walked **314 nodes, 0
   lineage errors**, proving every leaf is reachable from the subject through its own ops;
   leaves = **4 × `BitcoinBlockHeaderAttestation` at heights 969264, 969266, 969288, 969296**
   (exactly the estate's claim) plus 4 calendar `PendingAttestation` leaves
   (bob/btc/alice.btc.calendar.opentimestamps.org, btc.calendar.catallaxy.com,
   finney.calendar.eternitywall.com).

**Boundary:** the Bitcoin timestamp proves these exact `root.json` bytes existed no later than
block 969264. It does **not** prove correctness, completeness, compliance or certification, and
it does **not** anchor the 335-card index or any mill card. Layer 4 and layer 5 are reported
separately and are not collapsed into one "anchored".

**Parsing caveat, stated honestly:** the `.ots` file carries a 23-byte ASCII preamble
(`\0OpenTimestamps\0\0Proof\0`) before the standard OTS magic, so a naive
`Timestamp.deserialize` over the whole file yields an `UnknownAttestation` with an ASCII tag
and *looks* like an unconfirmed proof. Parsing must begin at the magic offset (byte 23) with the
32-byte subject supplied as `initial_msg`. Anyone re-verifying should do the same, or the
estate should publish this parsing note beside the proof.

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
on-chain transfer amount or establish a customer relationship*. **Internal settlements are never
revenue.**

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

## 7. Claims rejected or corrected — 15

| ID | Surface | Was | Now |
|---|---|---|---|
| COR-01 | same branch, v2.0 `0cf59ee4b567` | OTS `STAMPED_PENDING_BITCOIN` | **`CONFIRMED_BITCOIN`** (blocks 969264+) |
| COR-02 | same | mill signed = 2,872 | 2,872 **directory basenames**; 2,868 card files; 2,810 signed−withdrawn |
| COR-03 | same | mill unsigned = 2,112 | 2,112 basenames; **2,111** card files |
| COR-04 | same | `total_signed_all_corpora = 3,207` | **REJECTED** — sums SEPARATE_CORPORA |
| COR-05 | same + report | open PRs = 5 | **12 open** (7 Oct 04:18Z) |
| COR-06 | same | observed_at `2026-10-07T12:00:00Z` | **04:20:55Z** — was 7h40m in its own future |
| COR-07 | same | "TUI-2…6 STALE, no PR" | **all six lanes have merged PRs** (#2847/48/49/50/51/53) |
| COR-08 | TUI-1 v1 (closed 11 Sep) | 22 axes, root 167, Rekor 2791822965 | 23 axes, root **319**, Rekor **3012420819** |
| COR-09 | `HERMES-EXECUTION-LEDGER-20260912.md` | 22 axes, root 169, OTS pending | **SUPERSEDED banner added** (B-01 fixed) |
| COR-10 | `TUI-1-CANONICAL-STATE.json` (master root) | 22 axes, root 167, OTS pending, CR-015 live | **rewritten as count-free POINTER** (B-01 fixed) |
| COR-11 | goal brief itself | Rekor 2791822965, OTS awaiting | **superseded by time** |
| **COR-12** | `docs/grants/README.md` artefact table | merkle `e4cc26d1…`, sha `74797e30…`, 303 cards, 22 axes, Rekor 2791822965, `STAMPED_PENDING_BITCOIN`, `$0.00`, `chain.json → length` (no such field), MCP 354 (external registry) | **replaced with live values + real sources; two unsourced rows removed** |
| **COR-13** | `docs/trust/ANCHOR-PREPARATION.md` | anchored `62a1931b…` / 167 cards as if current | **STALE-VALUES banner** with current root `f1913eca…` / 319 cards |
| **COR-14** | `README.md` tagline | "22 axes · 3 public leader scores · 8 fact runs" | **still wrong — B-13 raised**, generator-owned, not hand-edited |
| **COR-15** | `README.md` DOI badge | links `10.5281/zenodo.21991104` | **still dead — B-14 raised** (410), generator-owned |

---

## 8. Six-TUI execution state

| TUI | Branch | PR state | Verdict |
|---|---|---|---|
| 1 Controller | `control/canonical-state-20260911` | #2847 merged; this revision follows | **VERIFIED** |
| 2 Finance | `finance/full-spread-20260911` | #2848 **MERGED** 7 Oct 04:58 | MERGED |
| 3 Models | `models/verified-expansion-20260911` | #2853 **MERGED** 7 Oct 04:58 | MERGED |
| 4 Agents | `agents/discovery-consolidation-20260911` | #2850 **MERGED** 7 Oct 04:58 | MERGED |
| 5 Trust | `trust/tui5-signing-roots-anchoring-20261007` | #2851 **MERGED** 7 Oct 04:58 | MERGED (layers 6–7 owner-gated) |
| 6 Growth | `growth/verified-launch-20260911` | #2849 **MERGED** 7 Oct 04:57 | MERGED |

Scope items:
- **ISO 20022 family count — RESOLVED (B-06).** The artefact existed in the sibling estate
  (`an internal sibling repository of this estate (name withheld: internal codename)`, blob `b98cd3d7`, 2,549 B): **7 families / 25 message types /
  implemented 0**. Harvested to `public/interop/iso-20022-families.json` with
  `measurement_state: CATALOGUED`, `signature_state: UNSIGNED`, `merkle_root_inclusion:
  NOT_IN_PUBLIC_ROOT`, all anchors `NOT_WITNESSED`, and full provenance. **The source card is
  unsigned — the family count is catalogued, never measured, never anchored.**
- **AP2 — claim corrected (B-07).** The upstream spec is **not** 404:
  `https://ap2-protocol.org/ap2/specification/` returns **HTTP 200** (67,738 B) naming a
  Checkout Mandate and a Payment Mandate. What is genuinely missing is an AP2 *implementation*
  and an AP2 *signed card* in this estate.
- **COBOL — already honest (B-11).** Live `/cobolbridge` states "mill not MEASURED yet",
  "marketing landing (not a mill, not MEASURED)", "do not demo it as a live mill",
  "We do not certify." No false claim found to correct.

---

## 9. Completion condition

| Requirement | State |
|---|---|
| Coverage denominators/numerators | ✅ **VERIFIED** (incl. B-04 fix, 6/6 tests) |
| Live URLs | ✅ **VERIFIED** (endpoints re-probed 7 Oct; DOI = **410 GONE → B-09**) |
| Commit + PR identifiers | ✅ this revision |
| Signature verification | ✅ **VERIFIED** — 335/335, merkle, envelope, Rekor, OTS all re-executed |
| Root + witness identifiers | ✅ **VERIFIED** (OTS parsed offline, 4 block heights matched) |
| Actual costs | ✅ **$0.00** |
| External revenue separated | ✅ 2 / 22 / 8 |
| Directory status | ✅ **VERIFIED** |
| Unsupported claims corrected | ✅ **15** |
| **No unresolved duplicate source of truth** | ✅ **VERIFIED** — pointer + two SUPERSEDED banners |

**Both previously-failing conditions are now met.** Four blockers remain and all four are
outside this lane's authority: two paid on-chain transactions (owner signature), one compute
budget, one external Zenodo appeal. Two newly-raised contradictions (B-13, B-14) sit in the
generator-owned, pinned `README.md` and require the generator to be re-run rather than a hand
edit.

---

## 10. Remaining blockers (14)

| ID | State | Blocker | Needs |
|---|---|---|---|
| B-01 | **VERIFIED** | duplicate source of truth → pointer + 2 SUPERSEDED banners | done 7 Oct |
| B-02 | **BLOCKED** | Base EAS `NOT_YET` | **owner approval, ~$0.01–0.05** |
| B-03 | **BLOCKED** | XRPL memo `NOT_YET` | **owner approval + funded account** |
| B-04 | **VERIFIED** | `reconciliation_ok=false` → code fix + 6/6 tests | done; needs deploy |
| B-05 | **VERIFIED** | signature verification PARTIAL → re-executed | done 7 Oct |
| B-06 | **VERIFIED** | ISO 20022 family count MISSING → harvested, CATALOGUED/UNSIGNED | done 7 Oct |
| B-07 | **INCOMPLETE** | AP2 implementation missing (**spec is live, not 404**) | TUI-4 |
| B-08 | **INCOMPLETE** | deep measurement **6/425** | **compute budget** |
| B-09 | **BLOCKED** | Zenodo DOIs **HTTP 410 GONE** (both re-verified) | **owner appeal** |
| B-10 | **VERIFIED** | "five of six lanes have no PR" → **all six merged** | done 7 Oct |
| B-11 | **VERIFIED** | COBOL "never describe as measured" → live page already honest | done 7 Oct |
| B-12 | **VERIFIED** | 1,460 **rows** → **1,453 distinct files** (overlap 7) | done 7 Oct |
| B-13 | **CONTRADICTED** | README tagline 22/3/8 vs live 23/9/9 | re-run `org-readme.py` + re-pin |
| B-14 | **CONTRADICTED** | README DOI badge links a 410 target | owner appeal (B-09), then regenerate |

**State counts:** 7 VERIFIED · 3 BLOCKED · 2 INCOMPLETE · 2 CONTRADICTED = 14.

**Rejection discipline applied throughout:** `INDEXED`, `DISCOVERED`, `STAGED` and `UNMEASURED`
were never reported as `MEASURED`; `submitted` was never reported as `anchored`; internal
settlements were never reported as revenue; model behaviour was never reported as safety
certification. The 6/425 deep-measurement figure, the CATALOGUED/UNSIGNED ISO 20022 family count
and the `$0.03` external-revenue figure are quoted exactly as their authorities state them, with
uncertainty and scope intact.
