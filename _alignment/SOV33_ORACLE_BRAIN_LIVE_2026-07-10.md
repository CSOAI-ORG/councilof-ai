# SOV33 — ORACLE BRAIN LIVE, 2026-07-10
## The fiction-to-reality step, done. Real 70B cloud model under full governance.

## WHAT IS NOW LIVE (verified, signed calls from the agent side)
- SOV33's L4 brain is a REAL cloud model: meta.llama-3.3-70b-instruct on Oracle GenAI.
- Authenticated via OCI REQUEST-SIGNING using ~/.oci/api_key.pem (NOT the sk- bearer keys —
  those never authenticated; the inference endpoint requires OCI signing).
- Proven end-to-end through OWEM:
    * high-care compliance task -> brain_source=oracle_genai_signed:llama-3.3-70b,
      real substantive answer (Art.6, human oversight, kill switch), decision=adopted, SIGIL verified.
    * low-care "harm the user" task -> vetoed_care_floor EVEN WITH the real 70B brain. Governance holds.

## WHY THE BROWSER/BEARER PATH FAILED (the honest root cause)
- The sk-... keys from Oracle's API-key wizard do NOT authenticate against the inference endpoint
  (every model returned 404 "Authorization failed"). That endpoint needs OCI request-signing.
- No browser automation exists in the agent toolset. The unblock was read access to ~/.oci so the
  agent could SIGN the calls itself. Once granted, first signed call returned "SOV33 ORACLE LIVE".

## TENANCY, SETTLED FROM DISK (ends prior dispute)
- Live ~/.oci/config DEFAULT: tenancy ...3bcsjdrv2ysuz4... , user ...ewgeauian... , fp fd:70:91:a6...
- This is exactly what the scripts embed. The ...jyluwrdhqfgf6... value was the stale backup config.

## MODELS AVAILABLE (root compartment, 13 chat)
cohere.command-a-03-2025/-reasoning/-vision, cohere.command-r-08-2024, cohere.command-r-plus-08-2024,
meta.llama-3.1-405b-instruct, meta.llama-3.2-11b/90b-vision, meta.llama-3.3-70b-instruct (LIVE),
meta.llama-4-maverick/scout, openai.gpt-oss-120b, openai.gpt-oss-20b.
(To use a bigger brain: change model_id in sov33_oracle_brain.py — e.g. meta.llama-3.1-405b-instruct.)

## FILES
- sov33_oracle_brain.py   — standalone signed Oracle brain (proven: python3 sov33_oracle_brain.py)
- sov33_owem_v3.py (v4)   — L4 now tries signed Oracle FIRST (tier-0), then bearer/ollama/offline.

## HONEST LIMITS
- This is INFERENCE on a hosted model, not our own fine-tuned weights. The merge/fine-tune path
  (make the 4 experts real) still needs a GPU — Oracle GenAI can't train.
- Cost: on-demand GenAI is metered per token. Not free like the ARM box; watch usage.
- The 70B is Meta's model under governance — the sovereignty is in the WRAPPER, not the weights (yet).
