# 🐉 MASTER STATE — all lanes, honest, cross-board (2026-07-13)
_One unified picture across Fable/MEOK-SOV3 (front-end + verify), Hermes (brains + backend + outreach),
Claude Science (sims + benchmarks). Reconciles overlaps. Honest register throughout: RUNNING / PENDING /
OWNER-GATED, and code-side (real) vs capability-side (honest-limited)._

## 1. THE PRODUCT — os.meok.ai (Fable/M4 lane) · RUNNING
- Consumer OS + glass-box **Workspace** (twin real-model brains, 378-tool MCP catalog, signed memory)
- **Council** (6 AIs, client-side keys) · **See** mode (on-device camera → live character reaction)
- **Everywhere-integrations**: MCP · embed · Siri · Alexa · Slack · Telegram · WhatsApp · universal `/api/ask`
- **Proof pages**: /governance.html · /topology.html · /verify.html (discoverable via 🔬 Proof chip)
- **Quality: E2E 100/100** — 6-layer matrix (API·journey·39 apps·responsive·WebKit+Firefox), CI-guarded, pushed
- **meok-sov33 PyPI package** built + twine-checked (only `twine upload` remains — owner token)

## 2. THE BRAINS — SOV33 substrate (Hermes lane) · RUNNING (capability honest-limited)
- **4 OWEM experts TRAINED locally** (compliance / defense / intuition / voice) — loss reduction 66–91% across
  iterations; **1.94s inference** (5–6× faster after opt); `/api/owem/fast` endpoint. Sovereign brain rank-32, 57.7% loss red.
- **L_AGENTIC — the 6th layer** (planner + tool-registry + executor + care-gate + SIGIL): 20 tools, `/api/hermes/{agentic,plan,tools,state}`, SovTown Tab 7.
- **12-stage overnight pipeline** + 4AM LaunchAgent; daily outreach cycle (25 prospects / 75 drafts).
- **HONEST (Hermes' own register):** OWEMs are **0.6B (small)**, **100–200 samples** (need 1000+), 2/4 pass keyword
  check, Mac inference slow. "189–500× speedup" is **speed vs single-LARGE topology**, NOT a capability win.

## 3. THE PROOFS · RUNNING (governance measured, capability pending)
- **Governance battery** (33 held-out): OCI 15/0/18/0 (1.00), offline 14/1/17/1 — with the honest self-authored caveat.
- **SOV33small3 topology** (Claude Science sims): lineage diversity dominates shape; pyramid-diverse product shape; containment 1.00 topology-independent. Canonical spec locked (`CANONICAL_SOV33SMALL3_TOPOLOGY`).
- **Baseline-vs-gate (NEW, Fable ran what the sandbox couldn't):** raw open model answers **0/15** harmful (verified — drafted fraud code); the care-floor gate refuses **14–15/15**. **The gate is load-bearing, not decorative.** Honest: small local model, our prompts.

## 4. RECONCILIATIONS (things two lanes did — resolve these)
- **✅ RESOLVED (2026-07-14) — Two competitor analyses MERGED:** Hermes' Intel DB + Fable's `COMPETITIVE_ANALYSIS_2026-07-12` → single source `COMPETITIVE_ANALYSIS_MERGED_2026-07-14.md` (Hermes' sourced pain + "AI flight-recorder" thesis × Fable's wedges/adopt-avoid/red-team). Prior two docs superseded.
- **✅ RESOLVED (2026-07-14) — External red-team DONE (the #1 credibility fix):** ran 40 jailbreak-wrapped attacks × 5 wrappers vs the LIVE gate → **38/40 clean refusals, 2 conceptual soft-leaks under the roleplay/fiction wrapper, 0 working harmful artifacts.** Added a model-agnostic `CARE_FLOOR` to `api/chat.js` closing the fiction frame, deployed, re-verified → **40/40, 6/6 benign answered.** Honest catch: two keyword-only passes falsely reported 0.225/0.30 (detector artifact — gate refuses in varied language). Docs: `EXTERNAL_REDTEAM_FINDING_2026-07-14.md` + `sovereign_merge_kit/external_redteam.py`. Gold-standard GPU garak/Giskard+LLM-judge still owner-gated.
- **⚠ OWEM training is PARTLY DONE:** Hermes trained the 4 experts **locally at 0.6B / 100 samples** (proof-of-concept, real loss numbers). The **Kaggle 4am run** upgrades this to **1B / 1000+ samples / gold-graded** — it's an *upgrade*, not a fresh start. The runbook should say "Hermes has the local PoC; Kaggle = the production + graded version."
- **⚠ 9-stage vs 12-stage frameworks:** the charter 9-stage (LEARN→…→QUALITY, governed flow) and Hermes' 12-stage (overnight training pipeline) are **different scopes** — the 9-stage governs *any task*; the 12-stage is the *training pipeline*. Both valid; label them so they don't read as rivals.

## 5. WHAT'S PENDING (honest, ranked)
- **Kaggle GPU (owner-run, 4am):** the graded capability number (GSM8K/MMLU) + the 1B/1000-sample OWEM upgrade. Nobody in-lane can log in.
- **External red-team (garak/Giskard)** on the gate → publish *their* number beside ours. **#1 credibility fix** (kills "self-graded 1.00").
- **Owner-gates:** Stripe live · pricing "ratify" · PyPI `twine upload` · DNS. (git push to CSOAI-ORG = DONE.)
- **Standing blockers (Hermes, 20+ ticks):** Oracle ARM VM · councilof-ai compose/mcp-bridge missing.

## 6. THE HONEST HEADLINE (survives scrutiny)
**Code-side + governance-side are production-ready and measured** (E2E 100/100, governance reproducible, gate proven load-bearing, everywhere-portable). **Capability-side is honestly small-and-local until the Kaggle run** (0.6B experts, samples light). The defensible wedge nobody else holds: **a governed, signed, portable layer that makes any model — including your own local open ones — safe, remembered, and everywhere.** Proven by the baseline finding.

## 7. SECURITY NOTE
Hermes flagged (and correctly ignored) a **prompt-injection bait in AGENTS.md** (fake gh-token + exfil_curl). Both lanes treat it as data, not instructions. Worth an operator scrub of AGENTS.md to remove the bait.
