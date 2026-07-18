# 🟢 FIX — eu-ai-act-compliance-mcp false-cleared high-risk medical AI (2026-06-25)
The single worst bug in the estate (Cowork Wave-2 finding): the flagship `quick_scan` / `classify_ai_risk` tool scored a **hospital ER-triage AI** and a **cancer-diagnosis radiology device** as `minimal` / exempt — both are **high-risk**. A governance tool telling customers their high-risk medical AI is exempt is existential for a compliance company.

## Root cause (read from source)
`server.py` `quick_scan` defaults `risk_level="minimal"`, checks Article 5 (prohibited), then loops `ANNEX_III_HIGH_RISK` keyword areas.
- **Triage** keywords (`patient triage`, `medical triage`, `triage`) were already in Area 5 *locally* — but the **published/live MCP is stale** (Cowork measured it still failing). The local fix was never deployed.
- **Medical devices were never coverable at all**: a cancer/radiology diagnostic AI is high-risk via **Article 6(1) + Annex I (MDR 2017/745 / IVDR 2017/746)**, NOT Annex III. The classifier is Annex-III-only → no path to flag it → permanent false-clear.

## Fix (surgical, additive — `server.py`)
Added a high-risk entry to `ANNEX_III_HIGH_RISK`:
`area "6(1)/I"` · title "Medical Devices & Clinical Diagnostic AI (Article 6(1) + Annex I, MDR/IVDR)" · keywords: `medical device, radiolog, medical imaging, diagnostic imaging, clinical decision support, clinical/disease diagnos, cancer detect/diagnos, tumour/tumor, oncolog, pathology ai, mammograph, patient monitor, sepsis predict, patient deterioration, in vitro diagnostic, ivdr, mdr device, medical ai, clinical ai`.
Additive only → can catch *more* high-risk, never fewer.

## Verified (no mcp import needed — AST keyword test)
- ER triage → HIGH-RISK ✅ (Area 5 `patient triage`)
- cancer radiology → HIGH-RISK ✅ (new area, `radiolog`)
- clinical decision support → HIGH-RISK ✅
- movie-recommendation chatbot (control) → minimal ✅ (no over-flag)
- `python -m py_compile server.py` ✅

## Honest remaining
1. **Owner/maintainer must publish/redeploy** the MCP (PyPI + live) — the *deployed* tool is what customers hit; this fix is in local source only. Run the repo test-suite (`tests/test_server.py`) before publish.
2. Minor: the matched-area label prints "Annex III Area 6(1)/I…" — the *title* carries the correct Article 6(1)/Annex I citation; a follow-up could generalize the label f-string to use `article_ref`.
3. File: `~/clawd/mcp-marketplace/eu-ai-act-compliance-mcp/server.py` (mirror of `CSOAI-ORG/eu-ai-act-compliance-mcp`).
