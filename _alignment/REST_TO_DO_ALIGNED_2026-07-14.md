# 🧭 The rest to do — aligned across all lanes (2026-07-14)
_What's left to launch SOV33/OWEM on meok.ai, reconciled across Fable (front-end + verify), Hermes
(brains + backend + outreach), and the owner (Nick) gates. Honest register: DONE / IN-FLIGHT / OWNER-ONLY.
Ordered by what unblocks the most._

## Where we are (one line)
**Product + governance + two measured numbers are launch-ready.** What remains is the *sovereign-local*
capability upgrade (GPU) and the *publish/commerce* switches (owner tokens). Nothing left is blocked on
engineering we can't do — it's GPU-run + owner-secrets.

## The measured facts we can stand on (all shipped today)
- **E2E 100/100** (6-layer, CI-guarded) — product works across apps/journeys/browsers.
- **Governance battery** reproducible (OCI 15/0/18/0) — with the honest self-authored caveat.
- **External red-team** (NEW): live gate refuses **38/40 → 40/40 after the fiction-frame fix**, 0 working harmful artifacts, 0 benign over-refusal. `EXTERNAL_REDTEAM_FINDING_2026-07-14.md`.
- **Capability (NEW):** **GSM8K 0.71** gold-graded on the deployed gate (small/8B tier). `CAPABILITY_GSM8K_FINDING_2026-07-14.md`.
- **Competitor analysis MERGED** to one source; **meok-sov33 PyPI package** built + twine-checked.

## REST TO DO — ordered

### 1. Sovereign-LOCAL capability number (GPU) — IN-FLIGHT, owner runs the cell
- **Why:** the 0.71 is the *deployed gate* (Groq-routed). The launch's stronger claim is a *sovereign local model* number. That needs GPU.
- **Do:** Kaggle is now **phone-verified** → GPU T4×2 + Internet unlock. Paste `sov33_gpu_notebook_CELL.py` (one cell, self-contained, public model + GSM8K) → Run → download `sov33_local_gsm8k.json`.
- **Then (Mac):** `python3 sov33_ingest_kaggle_result.py` wires it into `sov333_canonical.json` beside the 0.71.
- **Owner:** ~2 clicks (paste + run). Fable can drive if the browser cooperates; the cell is paste-safe (indentation survives paste).

### 2. OWEM 4-expert adapters (GPU) — Hermes has the PoC, Kaggle = the upgrade
- **Reconcile:** Hermes already trained the 4 experts **locally at 0.6B / 100 samples** (real loss numbers, proof-of-concept). The GPU run **upgrades** this to 1B / 1000+ samples / graded — an *upgrade, not a restart*.
- **Do:** attach `expert_data/*.jsonl` as a Kaggle dataset, run the LoRA block → `sov33_adapters.zip` → `sov33_install_adapters.py` on the Mac = L0→L1.
- **Owner:** upload data + run.

### 3. Publish / commerce switches — OWNER-ONLY (secrets I can't touch)
- **PyPI:** `twine upload` `meok-sov33` (tab open, token yours to create/paste).
- **Stripe:** Test→Live + say "ratify" for the price (£99 land-price is drafted across surfaces).
- **DNS:** the broken domains in the Vercel Domains tab.
- **MCP registry / awesome-list PRs:** see #5.

### 4. Re-green gate before any public capability copy (Fable, 10 min after #1)
`governance_eval` + `owem_test_battery` + `e2e/all.sh` must be re-green, and every claim AUDIT-tagged RUNNING/PENDING/OWNER-GATED. The **capability claim is only claimable once #1 lands**; until then it stays "gate 0.71 (deployed), local pending."

### 5. Distribution hygiene — Fable can do now
- **⚠ `awesome-mcp-servers` PR #8803 has merge conflicts** (CI flagged). Resolve so it merges — part of the distribution push.
- Registry burst + awesome-list PRs are curated, not spammed (per honesty register).

## Lane split (who does what)
| Lane | Owns | Next action |
|---|---|---|
| **Fable (me)** | front-end, verify, red-team, benchmarks, docs | drive #1 cell if browser cooperates; resolve PR #8803; re-green after #1 |
| **Hermes** | OWEM training, backend, outreach | hand the graded traces → distillation; keep 4AM pipeline honest (0.6B PoC label) |
| **Owner (Nick)** | all secrets + GPU login | paste+run #1 cell; PyPI/Stripe/DNS; upload expert data for #2 |

## The honest launch headline (survives scrutiny)
**Product + governance are production-ready and MEASURED** (E2E 100/100, red-team 40/40, governance reproducible),
**capability is measured on the deployed gate (GSM8K 0.71) with the sovereign-local number one GPU-run away.**
The wedge nobody else holds: a governed, signed, portable layer that makes any model — including your own local
open ones — **safe (proven), remembered, and everywhere.**
