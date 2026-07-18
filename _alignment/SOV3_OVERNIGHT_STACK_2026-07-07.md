# SOV3³ Overnight Stack Run — 2026-07-07 18:39

Full-force execution of the approved 7-step overnight plan: locate hooks → prepare wiring patches → backfill threat data → fix threat NN → full retrain → e2e batch → this report. **Structural: 14/14 PASS. Threat NN: FIXED.**

## Headline: the threat NN is fixed
- **Before:** trained as a `care_weight` regression → MAE 0.483 vs 0.299 baseline (**62% worse than guessing**).
- **Root cause:** wrong target. It was regressing an importance weight, not classifying threats.
- **After:** reframed as a binary classifier on **1823 real deny/breach-labelled rows** → **95.9% accuracy vs 54.9% base rate (+41 pts), F1 0.954**.
- The NN was never architecturally broken — it was fed the wrong label. Fixed with real data, no synthesis.

## Step 1-2 — server hooks + prepared patches
Found 4 live classify hooks in `sovereign-mcp-server.py`: `detect_threats` (3662, has a real `threat_detected` bool), `detect_partnership_opportunities` (3656), `predict_relationship_evolution` (3690), `analyze_care_patterns` (3696). Wrote 5 edit-ready patches (import + 4 hooks) in `WIRING_PATCHES.md`. **Prepared, NOT applied** — applying edits the running server; needs your go-ahead. Dependency has no live handler (honest gap — needs a new tool, not a hook).

## Step 3 — threat backfill (real labels only)
Mined **1823 labelled rows** from on-disk signals — no synthetic labels:
| Source | Rows | Meaning |
|---|---|---|
| town_gate | 1321 | town gate deny/breach + benign allows |
| care_episodes | 346 | benign interactions (negative) |
| threat_episodes | 62 | original threat episodes (positive) |
| creativity_episodes | 54 | benign (negative) |
| sigil | 40 | SIGIL ledger denial log entries |

Label balance: 823 threat / 1,000 benign. → `threat_backfill.csv`.

## Step 4-5 — full 9-NN retrain
| NN | n | metric | score | baseline | verdict |
|---|---|---|---|---|---|
| care | 346 | MAE | 0.162 | 0.174 | ✅ beats base |
| creativity | 215 | MAE | 0.154 | 0.145 | ❌ loses (6% worse) |
| emotion | 50 | MAE | 0.233 | 0.221 | ❌ loses (5% worse) |
| intent | 50 | MAE | 0.224 | 0.238 | ✅ beats base |
| partnership | 50 | MAE | 0.231 | 0.291 | ✅ beats base |
| relationship | 253 | MAE | 0.142 | 0.134 | ❌ loses (6% worse) |
| sentiment | 50 | MAE | 0.233 | 0.248 | ✅ beats base |
| threat(classifier v2) | 1823 | acc | 0.959 | 0.549 | ✅ beats base |
| care_town(structured) | 5040 | MAE | 0.137 | 0.172 | ✅ beats base |

**Production models persisted:** `threat_classifier_v2.joblib` (0.959 acc), `care_town_model.joblib` (0.137 MAE).
Text NNs regressing `care_weight` still tie/lose (~5-6%) — that target is near-constant for them; they need task-specific labels (which the logger's `label=` field now captures going forward).

## Step 6 — e2e structural batch v2
**14/14 PASS.** Logger, live data, 3 datasets (CSV-parsed), run-local fix, notebook, 5 new artifacts, and P7 model-load+predict (threat classifier: threat→1, benign→0) all green.

## RUNNING vs DESIGNED vs BLOCKED-on-owner
**RUNNING (verified this run):** threat classifier v2 (0.959), care_town model (0.137), episode logger, backfill pipeline, full retrain, structural batch.
**PREPARED (needs your one word):** 5 server wiring patches — apply to start live episode capture.
**BLOCKED on owner / real terminal:** local :3101 (sandbox loopback EPERM), public MCP 502 (GCP tunnel), startup applications (external accounts), dependency NN (needs a new classifier tool).

## Artifacts this run
- `threat_classifier_v2.joblib` · `care_town_model.joblib` — production models
- `threat_backfill.csv` — 1,823 real labelled rows
- `WIRING_PATCHES.md` · `_WIRING_HOOKS.md` — server wiring (prepared)
- `_e2e_batch_results_v2.json` · `_e2e_nn_retrain_v2.json` — machine-readable results

## Next (owner decisions)
1. **Apply the 5 wiring patches?** → live threat/partnership/relationship/care episode capture begins.
2. Wire the trained threat classifier into the server's `detect_threats` path (replaces the broken regressor).
3. Submit startup applications; run `./run-local.sh` in a terminal; SSH the GCP VM to clear the 502.
4. OpenPatent white paper (deferred per your sequencing — next up).