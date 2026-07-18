# 🐝🐉 MEOK Hives → 100/100 by 4 July 2026 — with Nemesis integration

**Date:** 2026-06-15 · **Horizon:** 19 days (→ 4 Jul) · **Author:** Claude (Hermes bridge DOWN — see Gate 0) · **Goal:** every hive AAA+++ / 100/100, Nemesis blueprint folded in where it's cheap + high-value NOW.

---

## 0. Honesty box — Nemesis is a north-star, not a July-4 deliverable
`SOV3_OLM_EMERGENCE_BLUEPRINT` (Nemesis) is a **3–5 year, $3–7M** custom-OLM programme (Mamba-3 + MoE + GWT/FEP consciousness + 33-agent BFT, custom pre-training). **None of the custom-training phases happen by 4 July.** What DOES happen by 4 July: the operational hive work to 100/100 **plus the 4 cheap, high-leverage slices of Nemesis we can bank now** (§2). Anyone who says we'll "ship Nemesis" in 19 days is wrong — we ship the *hive* and *seed* Nemesis.

## 1. Where we actually are (verified on disk 2026-06-15)
- **Funnel hive:** ONE master generator (`build_hive_conversion_pages.py`, 18 domains) — index/pricing/signup/partner/enterprise + interactive MCP demo. 13/18 deployed. (HIVE_MASTER.md)
- **Brain hive:** King(SOV3 router)→28 Queens(meok-one engine/hive)→Honeycomb(SOV3 mem). King+Queen now have console commands. **CRITICAL GAP: 0 `stack.yml` exist** in `~/hive-staging/` → queens have no per-hive config. `gen-hive.py` exists (`meok-compliance-gateway/scripts/`) but was never run to populate hive-staging.
- **proofof.ai** LIVE (MCP catalogue/attestation hub). **openpatent.ai DOWN (000)** despite full `openpatent-hive/` built. **haulage group** LIVE but sprawled (grabhire/muckaway/planthire each have -app + -site + -deploy triplicates).
- **GCP VM `meok-backend`** RUNNING (e2-standard-4, europe-west2-a, 35.242.143.249) = queen/council inference box.
- **Nemesis insights #21–28 are NOT yet openpatent disclosures** (net-new IP opportunity).

## 2. What we BANK from Nemesis by 4 July (the cheap high-value slices)
| # | Nemesis slice | Action by Jul 4 | Why now |
|---|---|---|---|
| N1 | **8 insights (#21–28) → openpatent.ai disclosures** | Draft 8 patent-style disclosure pages, publish to the (revived) openpatent hive | Revives openpatent.ai with REAL IP; the insights are already written; pure upside |
| N2 | **Architecture validation** | Document that the existing King/Queen/BFT hive IS small-scale Nemesis: queen `sovereign_council` = BFT-router (Insight 2); honeycomb = GWT workspace (3.1); SIGIL Ed25519 = signed audit (4.2) | Confirms we're already on the Nemesis path — no rebuild |
| N3 | **Signed honey audit** | Add Ed25519/HMAC signing to each queen→honeycomb "honey" deposit | EU AI Act Art 12 evidence; ties to proofof.ai; ~1 day |
| N4 | **VM backbone spike** | Stand up ONE open hybrid backbone (Nemotron-H / Jamba-mini via vLLM or Ollama) on `meok-backend` as a queen inference option | Nemesis Phase-1 wk-1, the only training-adjacent thing achievable in 19 days; proves the path |

Everything else in Nemesis (custom pre-train, FEP/somatic, turbo-coding, BitNet, TEE) = **Phase 2-4, post-July, parked in the blueprint.**

## 3. The to-July-4 programme
### Gate 0 (Day 1) — restore the dual-agent loop
- **Fix Hermes bridge:** SOV3 `hermes_ask` 401s (calls OpenAI with no key). Reroute it to the local M3 (the `oauth_minimax` aux fix already landed) or add the key. Until fixed, "with Hermes" can't happen.

### Phase A — Foundation (Days 1–4, Jun 15–18) — unblocks "all within hives"
- **A1** Run/adapt `gen-hive.py` → generate `stack.yml` for all hives into `~/hive-staging/<slug>-hive/` (queen schema: tools/palette/scope/tier/roster). Verify `meok-queen <hive>` loads each.
- **A2** Wire queens → GCP VM inference (OpenRouter/VM councils); confirm `meok-king --fan` routes + convenes on the VM, not the Mac.
- **A3** Fix **openpatent.ai** (000): deploy `openpatent-hive/services/landing-site` → restore the domain.
- **A4** Gate 0 (Hermes) done in parallel.

### Phase B — Every hive to 100/100 (Days 5–17, Jun 19 – Jul 1)
Per hive, the 100/100 checklist (re-runnable via `hive-e2e-audit.py`):
1. Funnel: index/pricing/signup/partner/enterprise + MCP demo (master — mostly done)
2. Queen `stack.yml` present + loads + answers on VM
3. Stripe/signup wired (Nick gate: live key)
4. Live deploy 200 on all paths
- **B1** Consolidate **haulage group** sprawl: pick canonical per domain (-app vs -site vs -deploy), archive the rest; one queen each for grabhire/muckaway/planthire under the haulage umbrella.
- **B2** **proofof.ai**: make it the signed-attestation front for N3 (queen honey → proofof verify).
- **B3** **openpatent.ai**: seed the 8 Nemesis disclosures (N1) + its 6 existing MCPs as a queen.
- **B4** Sweep remaining hives (compliance/governance/agri/verticals/productivity) to checklist.

### Phase C — Verify + AAA+++ seal (Days 18–19, Jul 2–4)
- Re-run `hive-e2e-audit.py` → target 100/100 (from 42 baseline); fix the long tail.
- N3 signed audit live; N4 VM backbone answering one queen end-to-end.
- Hand Nick the gate list (Stripe live, DNS, Vercel cleanup, merge+deploy).

## 4. Gates only Nick can clear
Stripe live key · DNS (openpatent.ai, pokerhud, socialmediamanager, apex repoints) · Vercel project cleanup · merge `meok-e2e-polish-jun15` → deploy · OpenRouter/VM budget for N4.

## 5. Single highest-leverage move for revenue before Jul 4
**Stripe live key + the funnel→checkout wire across the 18 master hives.** Everything else is reach; this is the one that turns 100/100 funnels into £. (Nick gate.)
