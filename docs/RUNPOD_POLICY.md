# RunPod / GPU policy — honest compute

**Binding:** GPU / RunPod is for **model axes only**. It does **not** accelerate RWA / contract attestation churn, and it must **never** invent labour or AI-economy **MEASURED** scores.

Attestation scale is I/O (archive RPC, explorers, public artifacts) + deterministic CPU grading. See `docs/EAT_PLAYBOOK.md` (DSH · RunPod · Oracle · Kaggle · Cursor) and `docs/SOVOS/INDEX-METHOD-0.1.md` (method before score).

## Allowed

- GSPC / engine-axis jobs that actually call a model (inference, eval harness, probe banks)
- Training or eval workloads that are already model-bound and labeled MEASURED / DESIGN / REPORTED honestly
- AG-UI wire hosts (`AGUI_WIRE_URL`) when the pod is serving model SSE — not for inventing grades
- Explicit owner-approved experiments labeled **DESIGN** or **REPORTED** (never silent MEASURED)

## Forbidden

- Using RunPod / GPU to “speed up” Memo / EAS / XRPL attestation publishing or contract churn
- Inventing labour / AI-economy **MEASURED** scores (`measured_score`) on GPU
- Silent fill of **UNMEASURED** cells (zeros, averages, scraped TVL/ARR dressed as ours)
- Selling grades from any GPU run (HO.2 — meter access/runs/seats only)
- Treating GPU latency or token spend as evidence of measurement quality

## Labour & economy indices

AI-economy · human-labour · humanoid-labour ship as **UNMEASURED** (`GET /api/indices`, hub `/indices`).
`measured_score` stays `null` until INDEX-METHOD + frozen bank. GPU cannot promote them.

## Accelerator for attestation

Parallel **CPU** workers + archive RPC + public-artifact adapters — not GPU.
RWA clean plays remain Stage gates (custody + counsel) per `docs/EAT_PLAYBOOK.md`.

## Canon

- `docs/EAT_PLAYBOOK.md`
- `docs/SOVOS/INDEX-METHOD-0.1.md`
- `docs/EAT_DSH_ALIGNMENT.md`
- `docs/ESTATE_CROSSWALK.md`
- Moves: `docs/NEXT_300_MOVES.md` #143, #257–258, #289
