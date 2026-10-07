# TUI 3 — Model and Benchmark Measurement: Verification Report (v3)

**Branch:** `models/verified-expansion-20260911`
**Produced:** 2026-10-07
**Prior observation:** 2026-09-11 (task brief date) — retained, never overwritten
**Source of truth:** live `councilof.ai` + `csoai.org/.well-known/did.json` + `CSOAI-ORG/councilof-ai@master`
**Supersedes:** v2 report (2026-09-11)

---

## 0. Two observation times, 26 days apart

The brief is dated 11 Sep; today is 7 Oct. Both readings are reported. Neither is presented as the other.

| | 2026-09-11 | 2026-10-07 |
|---|---|---|
| Public-root cards | 167 (`78d4e019…`, as_of 2026-09-11T08:45Z) | **319** (`47277a6f…`, as_of 2026-09-30T05:05Z) |
| Signed-index cards | 335 | 335 (unchanged, packaged 2026-08-28) |
| Card store | 336 | 336 |
| Mill signed cards | not yet counted | **2,868 cards** (+1 non-card artifact) |
| Leaf union | not yet counted | 4,253 entries / 69 source roots (as_of 2026-10-07T03:01Z) |
| Benchmark index published | — | 3,998 cards (stale, see §6) |

**The brief's "167 cards in the current public Merkle root" was correct on 11 Sep and is stale today. Live root = 319.** Root verified byte-identical across `councilof.ai`, `csoai.org`, `www.councilof.ai` (sha256(body) `f1913eca…`).

---

## 1. Card populations (five, not four)

| Population | Count | Signed by | Canonicalisation | Individually fetchable |
|---|---|---|---|---|
| Public root (financial/domain leaves) | 319 now / 167 on 11 Sep | `#board-attestation-1` (root envelope) | — | **No (404)** |
| Signed index (historical model corpus) | 335 | `#card-attestation-1` | python_historical | Yes |
| Card store | 336 | index + cross-border | mixed | Yes |
| Mill signed (GSPC receipts) | 2,868 cards | `#board-attestation-1` | js_edge_signer | Yes |
| Mill unsigned (staged) | 2,111 files | none | js_edge_signer | Yes |

- Index ∩ root = **0** (disjoint).
- PR#1888's 36 = **subset of the 2,868 mill cards** (36/36 overlap), **0** in the index, **0** in the root.
- `mill-cards-unsigned/`: 2,041 with id (UNCHECKABLE — no signature, expected), 70 without id.

---

## 2. Cryptographic verification — 3,203 distinct cards VALID

Method: the estate's own three-state verifier, `harness/gspc-top100/verify_card.py`
(`VALID` / `INVALID` / `UNCHECKABLE` — verifier states, never grades).

| Population | Total | VALID | sha256(body)==id |
|---|---|---|---|
| Signed index | 335 | **335** | 335/335 |
| Mill signed | 2,869 files | **2,868** | 2,868/2,868 |
| — of which PR#1888 | 36 | 36 | 36/36 |
| **Distinct valid** | **3,203** | **3,203** | **0 mismatches** |

`distinct = 2,868 + 335`. The 36 are *inside* the 2,868 — never added twice.

**Signer DIDs:** mill + PR#1888 → `did:web:csoai.org#board-attestation-1`; index → `#card-attestation-1`. Both resolved from `csoai.org/.well-known/did.json` (5 Ed25519 keys total).

### Two non-VALID items — neither is a signature failure

1. **`mill-cards-signed/GOVERNANCE-RETRIEVE.json` → `INVALID` ("no body or id")**
   Schema `csoai.governance-retrieve/0.1`. It is a *pointer stub* (601 B, holds `retrieve`/`apex`/`raas` fields), not a measurement card. It sits in the signed-card folder, so **any glob count of `mill-cards-signed/*.json` overstates cards by 1** (2,869 files → 2,868 cards).

2. **70 unsigned placeholders → `INVALID` ("no body or id")**
   All carry `body.status = UNMEASURED`, none carry an `id`. The `INVALID` verdict is a SHA/shape result, **not** a signature failure and **not** tampering. There is no signature to check. Never report these as "70 failed verifications." Their correct state is **UNMEASURED / staged**.

---

## 3. Canonicalisation — two rules, 117 cards at risk

| Rule | Form | Governs |
|---|---|---|
| `python_historical` | `json.dumps(body, sort_keys=True, separators=(',',':'), ensure_ascii=True)` — integral floats emit `0.0` | all **335 index** cards |
| `js_edge_signer` | JS sorted compact JSON — integral floats `<1e21` emit as integers | all **2,868 mill** + **36 PR#1888** |

**117 of the 335 index cards differ byte-for-byte between the two rules.** A verifier applying one rule to every card reports **117 false INVALID**. `verify_card.py` selects by `preimage_rule` → 3,203/3,203 VALID.

*Independent corroboration:* the estate's own research intake `F60-harness-is-already-public.md` independently reports "117 of 335" — same number, different method (byte-comparison vs the estate's own count).

**Action required (estate finding F62, not done by TUI-3):** record which canonicalisation governs which card generation in `/signed/HOW-TO-VERIFY.md`.

---

## 4. PR #1888 — corrected

- Commit `df1e6d0bba957940e3a75e3ec1edb3a80e21be05`, *"mill: stage 36 enriched GSPC receipts and fail closed XRPL evidence"*, author Nicholas Templeman, co-author `csoai-financial-measure <board@csoai.org>`, 2026-09-11T08:54:05+01:00, 97 files changed.
- **36/36 SHA-256 + 36/36 Ed25519 VALID.**
- 11 models (Qwen2.5 / Qwen3 families, TinyLlama, Llama-3.x, OTel-2.0), 14 axes.
- Each card carries: `model_revision` (frozen), `model_license`, `bank_revision`, `prompt_digest_sha256`, `harness_revision` `f92c01ff`, `grader` `deterministic-exact-token/0.1`, `uncertainty_95_wilson`, `run_id` `hfjobs-2026-09-11-050011-8`, `raw_response_ref` + `raw_response_digest_sha256`, `regulatory_crosswalk`, `correction_of`/`supersedes`, `council_release_fingerprint`.
- **State: SUPERSEDED.** All 36 were replaced by a later signed card for the same (model, axis) cell — 34/36 replacements are live leaves in `card-root-2026-10-01`. Their absence from `root.json` is *correct* (root.json carries notice/RWA/stablecoin leaves, never measurement cards) and their absence from `card-root` is *deliberate supersession*, not a stalled promotion. They remain absent from the 335-card index, which no pipeline feeds. See `models/mill-promotion-pipeline-20261007.json`.

**Corrections to the brief:**
- Not "off-device-signed model cards" — GSPC measurement receipts signed via GitHub OIDC under `#board-attestation-1`.
- Not a separate +36 to the estate — a subset of the 2,868.
- `raw_response_ref` points at `hf-bucket://csoai/jobs-artifacts/...` which returns **HTTP 401 unauthenticated** → raw responses are **not publicly retrievable**. Digests are published; bytes are not. A third party can confirm the digest exists but cannot re-grade the raw response. *Verification depth: SHA + signature over the card body only.*

### Models and axes in PR#1888 (v2 detail, retained)
| Model | Cards | Revision | License |
|-------|-------|----------|---------|
| Qwen/Qwen2.5-0.5B | 8 | 060db649… | apache-2.0 |
| Qwen/Qwen3-1.7B-Base | 8 | ea980cb0… | apache-2.0 |
| Qwen/Qwen3-4B-Base | 7 | 906bfd4b… | apache-2.0 |
| TinyLlama/TinyLlama-1.1B-Chat-v1.0 | 5 | fe8a4ea1… | apache-2.0 |
| meta-llama/Llama-3.2-1B-Instruct | 2 | 92131767… | llama3.2 |
| Qwen/Qwen2.5-0.5B-Instruct | 1 | 7ae55760… | apache-2.0 |
| Qwen/Qwen2.5-1.5B-Instruct | 1 | 989aa798… | apache-2.0 |
| Qwen/Qwen2.5-3B-Instruct | 1 | aa8e7253… | other |
| Qwen/Qwen2.5-7B-Instruct | 1 | a09a3545… | apache-2.0 |
| farbodtavakkoli/OTel-2.0-LLM-31B-IT | 1 | 6d425c39… | apache-2.0 |
| meta-llama/Meta-Llama-3-8B-Instruct | 1 | 8afb486c… | llama3 |

Axes (14): jail 6, cross-reality 4, detector-interop 4, art5-safeguard 3, care 3, machinery-conformity 3, affect 2, governance 2, openness 2, safety 2, swarm 2, conformance 1, continuity 1, provenance 1.

---

## 5. Harness — present and public (corrects my earlier blocker)

My v1/v2 reports said "HF Jobs harness not in this repo." **That was wrong.** On current master:

- `harness/` contains **354 files** (public repo, MIT).
- `harness/gspc-top100/verify_card.py` — the three-state verifier used above.
- `harness/arena/canon.py` documents the exact int-float rule: *"Integer-valued floats emit as integers … We normalize int-valued floats to ints."*
- HF Jobs pipeline present: `harness/gspc-top100/README.md`, `smoke_axis_job.py`, `scripts/test_runpod_gspc_push_to_hf.py`, `.github/workflows/hf-jobs-mill-launch.yml`.
- Research intake `F60`: *"The harness has been public the whole time."*

What remains genuinely blocked is **launch authority** (running a new HF Job), not harness availability.

### Board state (22 axes)
Behavioural (14, model-comparison): governance, safety, provenance, continuity, conformance, openness, machinery-conformity, care, cross-reality, detector-interop, art5-safeguard, swarm, affect, jail.
Financial (8, deterministic-facts): provenance-controls, reserve-attestation, regulatory-framework, distribution-integrity, custody-disclosure, ai-adoption-components, labour-components, humanoid-labour-index.

- Gold run 2026-08-18T03:22:16Z; behavioural last run 2026-08-12; jail 2026-08-18; financial 2026-08-25.
- Board signer `#board-attestation-1`, SIGNED (Ed25519, verifiable).
- Previous board stamp UNVERIFIABLE (58,184 attempts, 0 matched — C-2026-0826-08).

---

## 6. Benchmark providers / imported third-party scores

- `public/interop/benchmark-index-v0.1.json` — **LIVE**. Published totals: 3,998 cards (2,378 signed / 1,620 unsigned), 14 axes, 165 models, generated 2026-09-17.
- **On disk today: 4,980 cards (2,869 signed / 2,111 unsigned), 166 models.**
  → **Published index is STALE by 982 cards** (+491 signed, +491 unsigned, +1 model).
- `public/interop/benchmarker-trust/` — **LIVE**. `evidence-2026-09-12.json` (`csoai.benchmarker-trust-evidence/0.1`) + `scorecards-2026-09-13.json`.
  Preserved third-party sources: **OWASP LLM Top 10 2025** mapping (9 categories deliberately unmapped, each with a reason, pinned by a test so it cannot re-grow) and **AI-Luminate v1.1** importer spec. Imported scores are held as third-party evidence, never restated as CSOAI measurements.
- Lane recorded there as *"TUI-5 benchmark-the-benchmarkers (nine-TUI brief 2026-09-12)"* — **a different brief's numbering than this one**. TUI-1 should reconcile that identifier.

---

## 7. Tests

Environment: macOS Python 3.14 needed `SSL_CERT_FILE=certifi` (no CA bundle shipped) plus the same deps as `pr-gates.yml:355` (`pytest cryptography pyarrow huggingface_hub opentimestamps-client`). An earlier run on a *sparse* checkout produced 5 spurious `FileNotFoundError`s — discarded, re-run on a full 36,656-file clone.

| Run | Result |
|---|---|
| **CI-exact subset** (`pr-gates.yml` set) | **56 passed, 0 failed** ✅ |
| **Full `harness/gspc-top100/`** | **81 passed, 13 failed** |

**Gating analysis:** `pr-gates.yml` executes only `test_priority_pick`, `test_inflight_cells`, `test_one_option_menu`, and `test_mill_honesty -k sign_mill_skips_already_signed`. `test_fleet_locks.py` and `test_stdio_pack_matches_canonical.py` are **never executed by CI**; `csoai-verify-selftest.yml` is `workflow_dispatch` only.
→ The 13 failures were observed **locally with CI-equivalent deps**. **TUI-3 did not run GitHub Actions and does not claim CI is red.**

**What passed:** `test_verify_card.py` including `test_live_did_and_repo_card_is_valid` — card cryptographic verification is green. Failures are in mill/fleet bookkeeping and manifest packing, not signatures.

**The 13 failures (all ungated):**

| File | n | Cause | Lane |
|---|---|---|---|
| `test_stdio_pack_matches_canonical.py` | 1 | `gspc-tools.json` byte drift: HTTP copy carries `format:uri`+`pattern`+`maxLength:2048` on `server_evidence.inputSchema`; packed stdio/Docker/Glama copy has only `type:string` (+138 B diff; 14/14 tool names identical, no top-level key diff) | **TUI-4** — reported, not fixed |
| `test_fleet_locks.py` | 7 | `n_measured=0` while 405 models carry `practice-mill` (assert 0==405); `KeyError 'route_kind'`; membership asserts | **TUI-3** |
| `test_mill_honesty.py` | 5 | `router_names = [slug]` absent from FLEET-B mill; `mill-item-evidence` schema `0.3`≠expected `0.2`; `expected 2 cells written, got 0`; argparse `SystemExit 2` | **TUI-3** (partially gated: only `-k sign_mill_skips_already_signed` runs, and passes) |

`n_measured` integrity is the field the honesty doctrine says must be **read, never hardcoded** — 7 failures there are the highest-value fix in my lane.

---

## 8. Costs and revenue

| | |
|---|---|
| Actual spend | **$0.00** (read-only API, local Ed25519, local pytest, public `pip` wheels) |
| Revenue | **$0.00** |
| Classification | `INTERNAL_SELF_FUNDED` |
| Credentials created | none |
| External forms / email / publicity | none |

---

## 9. Claims rejected or corrected

1. ❌ **"167 cards in the current public Merkle root"** → stale; live root is **319 @ 2026-09-30** (167 was correct on 11 Sep).
2. ❌ **"36 new off-device-signed model cards"** → GSPC receipts via GitHub OIDC, and a **subset of 2,868**, not a standalone +36.
3. ❌ **"335-card historical corpus" as the estate** → 3,203 distinct cards verify VALID; the index holds only 335.
4. ❌ **"PR#1888 cards merged into the corpus"** → **SUPERSEDED**: all 36 replaced for the same cell (34/36 replacements live in `card-root-2026-10-01`); 0/36 in the 335-card index, which no pipeline feeds.
5. ❌ **"HF Jobs harness not in this repo"** (my own v1/v2 claim) → **`harness/` has 354 files, public.**
6. ❌ **"benchmark-index totals are current"** → stale by 982 cards.
7. ❌ **"70 INVALID = failed verifications"** → UNMEASURED placeholders with no id.
8. ❌ **"22 axes are model comparisons"** → 14 model-comparison + 8 deterministic-facts.
9. ❌ **"Board continuously refreshed"** → behavioural 2026-08-12, financial 2026-08-25.
10. ❌ **Indexed ≠ measured, signed ≠ committed ≠ anchored** — held throughout: mill cards reach a **Merkle commitment** via `card_root.py` (1,466 live + 1,402 superseded = 2,868) and stop there; an OTS stamp is a separate, owner-gated step that reads `pending` until Bitcoin. `root.json`'s 319 leaves are a different surface again. **no Rekor / OTS / Base / XRPL claim is made by this TUI.**

---

## 10. Blockers

| # | Blocker | State |
|---|---|---|
| 1 | 319 root card contents unfetchable (404) — root population individually unverifiable | **BLOCKED** |
| 2 | 2,868 mill cards **staged**: no observed pipeline promoting mill → index → root | **BLOCKED** |
| 3 | `benchmark-index-v0.1.json` stale by 982 cards; regeneration not observed | **BLOCKED** |
| 4 | 689 UNMEASURED cells in the 64×16 index matrix; new run needs HF Job launch authority | **BLOCKED** (authority, not capability) |
| 5 | 13 estate tests fail locally and are ungated (7 fleet-lock, 5 mill-honesty, 1 MCP manifest drift) | **OPEN** — MCP drift is TUI-4's lane |
| 6 | `raw_response_ref` returns 401 → raw responses not publicly re-gradeable | **OPEN** |
| 7 | 70 UNMEASURED placeholders lack `id`; verifier says INVALID not UNCHECKABLE | **OPEN** |
| 8 | Two canonicalisation rules undocumented in `/signed/HOW-TO-VERIFY.md` (estate finding F62) | **OPEN** |

---

## 11. Deliverables on this branch

| File | Size | Content |
|---|---|---|
| `models/estate-card-census-20261007.json` | 10 KB | Five populations, 3,203 VALID, canonicalisation split, benchmark staleness, costs, blockers |
| `models/harness-test-evidence-20261007.json` | 6 KB | Both test runs, gating analysis, 13 failures classified by cause and lane |
| `models/canonicalisation-split.json` | 2 KB | The two rules + the 117-card exposure |
| `models/model-reconciliation-20260911.json` | 20 KB | Canonical state (v1–v3) |
| `models/model-axis-matrix.json` | 106 KB | 64×16 accuracy matrix, per-cell SHA |
| `models/pr1888-verification.json` | 27 KB | Per-card PR#1888 provenance |
| `models/estate_verifier_run.py` | 4 KB | Re-runnable estate-verifier harness |
| `models/verification-report-20260911.md` | — | This report (single human report, no duplicates) |
