# Top-Down Alignment Reconciliation — 15 Aug 2026

**Purpose:** One page that reconciles the two parallel signing spines and the
duplicated governance artifacts so no lane drifts. Written by JEEVES (Mac
lane) after absorbing the pod lane's Block A/B completion report.

---

## 1. The two signing spines — now reconciled

| Layer | Where | Key | Scope | Status |
|---|---|---|---|---|
| **OMS key-based PKI** | Pod `SOVOS/keys/oms-signing-ed25519` | OMS ceremony key | Model artifacts — 13 Modelfiles signed + verified VALID | ✅ LIVE (pod lane) |
| **Sigil chain** | Mac `~/.sovereign/sigil_ed25519.key` | Estate Ed25519 key | Measurement cards — 1,201 sigils chained | ✅ LIVE (Mac lane) |

**Decision (aligned):** two keys, two scopes, no merge.
- OMS signs **artifacts** (models, manifests) — standards-track (model-signing 1.1.1).
- Sigil signs **measurements** (cards, receipts) — legacy estate chain, forwards-compatible.
- `inspect_sigil_bridge.py` signs measurements with the Sigil key; when run on
  the pod it CAN adopt the OMS key via env override (`SOV_DIR` already supported).
- No key is shared between lanes. No keyless OIDC (neutrality doctrine).

## 2. Duplicated artifacts — canonical copies decided

| Artifact | Mac copy (this repo) | Pod copy (SOVOS) | Canonical |
|---|---|---|---|
| DPIA | `council-os/DPIA_CSOAI_Aug2026.md` | SOVOS governance bundle | **Pod** (execution copy; Mac is mirror) |
| Singapore AI Verify pack | `council-os/SINGAPORE_AI_VERIFY_PACK.md` | AI Verify dossier v1 | **Pod** (application dossier) |
| Framework-signing MCP | `council-os/framework_sign_mcp.py` | — | **Mac** (only copy; port to pod on demand) |
| sigil_inspect / bridge | `council-os/` | csoai_scorer_signer (pod) | **Pod** (in-harness scorer signer) |
| GNN synthesis | `council-os/gnn_synthesis.py` | — | **Mac** (only copy) |
| AgentSociety binding plan | `council-os/AGENTSOCIETY_BINDING_PLAN.md` | replay_instrument (pod, paired lineage) | **Pod** (implementation) |
| Human arena bridge | — | `human_solver_bridge.py` (pod) | **Pod** (only copy) |

Rule: **when the pod has an execution copy, the pod is canonical.** Mac copies
are design mirrors and the public-surface deploy source. Never edit both.

## 3. Block A/B — absorbed status (no re-work)

- Block A 6/6 ✅ (honey 2,693 signed · OMS PKI · Inspect spine · migration 55/55 · consent clean)
- Block B 5/5 ✅ (SCITT 40.8µs/517B · DPIA · human arena · replay instrument · scoreboard 249 cells)
- Plus: AI Verify dossier, daily index 57.49 @ 23:30 UTC, Oracle micros cron, Twenty CRM, policies bundle (12 docs)

## 4. What THIS lane owns (no overlap)

- `councilof.ai/sov-os` — the workspace UI (sidebar, games arcade, training panel, layout v2 + sanitizer)
- `council-town.pages.dev` — Council Town game client (separate CF Pages project)
- `/sov-space/` — 13-axis globe (drift fixed 6→13)
- Forks on Mac: `agentsociety`, `meltingpot`, `lm-eval`, `openrlhf` (licence-verified)
- `council-os/` Mac-origin modules: framework_sign_mcp, gnn_synthesis, sigil_inspect

## 5. Open owner gates (unchanged, honest)

1. Stripe keys sync / npm 2FA / SMITHERY — revenue wall
2. Convex login — Council Town game backend
3. Prolific spend £400–500 + DPIA sign-off — human arena launch
4. AI Verify EOI send (IMDA channel + fee confirm)
5. arXiv submission (endorsement, expires 27 Aug)

## 6. Next eats (my lane, terminal-gated)

1. Land pending commit (`inspect_sigil_bridge.py` + gitignore ledger) — files ready on disk
2. Re-pull fresh boards (7 axes MEASURED Aug-15, 22 models) → refresh OS training panel data if schema allows
3. Council Town branding pass (estate logos/copy in ai-town client before Convex gate clears)
4. Games registry: draft slots 2–6 purpose statements (measurement-games slate)
