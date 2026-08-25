# RunPod policy — what GPU is for (and is not)

**Status:** OPERATING · RunPod capacity is real; scope stays honest.  
**Canon:** `docs/EAT_PLAYBOOK.md` · `docs/STACK_HONESTY.md` · `docs/SOVOS/INDEX-METHOD-0.1.md` · `ops/runpod-bootstrap.sh`

Measurement, not certification. Scores never sold. DSH = OS.

## Allowed on RunPod

| Job class | Why GPU helps |
|-----------|----------------|
| GSPC / model-axis evaluation harness | Inference + batch grading on frozen banks |
| Arena / Council Space contest rounds | Model-vs-model evidence volume |
| Vision / humanoid / machinery-conformity probes | Heavy multimodal runs |
| HF / Kaggle dump packaging of **already MEASURED** cards | Throughput after signature |

## Banned on RunPod

| Job class | Why |
|-----------|-----|
| RWA attestation churn (XRPL Memo / EAS / credential mint loops) | Attestation is custody + publisher CPU — GPU does **not** speed honest contract reads or Ed25519 sign |
| Inventing MEASURED labour / AI-economy scores | Indices stay UNMEASURED until INDEX-METHOD freezes a bank + usable n |
| Selling or soft-grading “preview” scores for dashboards | HO.2 — grades never sold; DSH ≠ softer truth |
| Demo-play publish to mainnet | Publisher fail-closed until custody + counsel |

## Operator checklist

1. Name the instrument / bank frozen ID in the job env.  
2. If the output is a measurement card, it must verify on `/gspc-verify` offline.  
3. If the job touches labour/economy series → write **REPORTED citations or UNMEASURED manifests only** — never invent TVL/ARR/wage %.  
4. Log `CSOAI_KEY_CUSTODY` absence as fail-closed for any `--publish`.  
5. Prefer CPU/archive workers for public-artifact refresh and adapter crawls.

## Template note (job README)

```
# Do NOT use this pod for RWA attestation churn or labour MEASURED invention.
# GPU = model axes / arena / multimodal probes only.
```

Owner gates (custody, securities counsel, mainnet) are unchanged by RunPod availability.
