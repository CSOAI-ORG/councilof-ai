# Hugging Face dataset plan — CSOAI honesty dumps

**Status:** PLAN · stub first, MEASURED only when signed  
**Target org (intended):** `csoai` on Hugging Face  
**Canon:** `docs/SOVOS/INDEX-METHOD-0.1.md` · `docs/EAT_PLAYBOOK.md` · `docs/RUNPOD_POLICY.md`

## Datasets (ordered)

| ID (proposed) | Content | Register |
|---------------|---------|----------|
| `csoai/gspc-measured-snapshot` | Existing GSPC axis cards / board dumps | MEASURED (when signed) |
| `csoai/labour-economy-unmeasured` | Three indices + method pointer + null scores | **UNMEASURED** |
| `csoai/rwa-corpus-reported` | Public issuer/contract artifacts for EAT | REPORTED (no fake grades) |
| `csoai/east-west-sample-packs` | Crosswalk sample packs already public | as labeled |

## `labour-economy-unmeasured` stub shape

```json
{
  "schema": "csoai.labour-economy-index/0.1",
  "indices": [
    { "slug": "ai-economy", "status": "UNMEASURED", "measured_score": null, "fused_into_gspc": false },
    { "slug": "human-labour", "status": "UNMEASURED", "measured_score": null, "fused_into_gspc": false },
    { "slug": "humanoid-labour", "status": "UNMEASURED", "measured_score": null, "fused_into_gspc": false }
  ],
  "method": "docs/SOVOS/INDEX-METHOD-0.1.md",
  "api": "GET /api/indices"
}
```

## README doctrine (must ship with every dump)

- Measurement, not certification.  
- UNMEASURED is honest — absence is not zero.  
- Labour/economy indices are a **contextual firewall** — never SHA-256/Ed25519 GSPC inputs.  
- Do not invent TVL, ARR, wage %, displacement %, or TAM as MEASURED.  
- Kaggle mirrors (if any) are **REPORTED only** until a bank is frozen.

## Upload gates

1. Local fixture under `scripts/index-fixtures/` matches API honesty shape.  
2. HF README cites INDEX-METHOD-0.1.  
3. No column named `score` with invented floats for UNMEASURED rows.  
4. Owner HF token / org access — ops, not invented here.

Live probe until HF upload: `curl -sS https://councilof.ai/api/indices` (404 on prod until branch merges to `master`).
