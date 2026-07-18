# SOV Multi-Tab Cockpit — a tab per model (honest: LIVE vs DESIGN)
Goal: one governed cockpit, a tab per SOV model, each showing its real state.
HONEST: nothing is SERVING yet — these are SERVABLE via the runbook below (run on the Mac). 'Servable' != 'running'.
Run on the MAC (Ollama is local). Every tab talks through the governed shim (care-gate + sign).

## HONEST TAB MAP (what's real 2026-07-15)
| Tab | Model | State | How it serves |
|-----|-------|-------|---------------|
| **SOV1** | venturi/router | GOVERNANCE LAYER (not a chat model) | shown as the "gate" status bar, not a chat tab — every tab routes through it |
| **SOV3** | 0.5B dense student (Qwen2.5-0.5B-Instruct base; MoE is the SOV3 SLOT/role, not this student's arch) | ✅ SERVABLE (trained adapter eval-proven; runbook not yet run) | ollama model `sov3` (see SOV_ON_HERMES_RUNBOOK) |
| **SOV33** | MoM / dense-reasoning | ⚠️ DESIGN (no distinct weights yet) | tab present, marked "needs distinct base trained" |
| **SOV333** | OWM / world-model | ⚠️ DESIGN (JEPA toy-scale, not a chat model) | tab shows world-model state, not chat |
| **SOV4** | fusion King | ✅ SERVABLE (sov4.ask routes across available; runbook not yet run) | the main tab — routes to whatever's served, care-gated+signed |

## SERVING PLAN (light up tabs as models become real)
Each SOV<x> gets served as `ollama create sov<x>` the moment it has real distinct weights:
1. NOW: `sov3` (done via runbook) + `sov4` = router over [sov3, + any others available]. -> 2 live chat tabs.
2. WHEN CC pushes the 1.5B/3B trinity: `ollama create sov33` (1.5B dense) + a SOV333 base -> those tabs light up.
3. WHEN emergence proof passes: SOV4 routes across the 3 DIFFERENT-arch models -> the King tab becomes true fusion.

## THE COCKPIT (one page, tabs = models)
- Reuse the governed shim's /v1/models: it already lists sov333-fast/smart/frontier.
- Extend MODELS in sov_openai_shim.py to expose one id per SERVED model: sov3, sov33(when live), sov4.
- Open WebUI (or the existing cockpit html) shows each as a selectable model = a "tab".
- SOV1 is NOT a model row — it's the care-gate+sign status shown on every response (backend/care/sig fields).

## STEP (extend the shim to one-id-per-model)
# in sov_openai_shim.py MODELS dict, map each served model to its tier/route:
#   "sov3":  route to ollama model 'sov3'          (LIVE)
#   "sov4":  route via sov4.ask (fusion King)      (LIVE)
#   "sov33": route to ollama 'sov33'               (only when weights exist -> else 501 "not yet trained")
#   "sov333":world-model endpoint                  (different interface, not chat)
# Honest: a tab for a not-yet-trained model returns "model not yet trained" — never a fake answer.

## HONEST BOUNDS
- Only SOV3 (0.5B) has trained weights today. SOV4 is real as the ROUTER (routes to what's served).
- SOV33/SOV333 tabs are SCAFFOLD until they have distinct weights — they must say so, not fake answers.
- SOV1 is the gate, not a tab — showing it as a chat model would misrepresent what it is.
- All tabs run on the Mac (Ollama local); the sandbox can't serve them.
- "Working on each" = each tab has its own improve-loop (ledger->harvest->retrain->swap-if-better) once it has weights.
