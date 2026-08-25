---
name: refuse-measured-labour
description: Refuse inventing MEASURED scores for labour / AI-economy indices. Load when asked to score, grade, fill, or "complete" AI-economy, human-labour, or humanoid-labour indices; when inventing TVL/ARR/wage/displacement as MEASURED; or when fusing labour series into GSPC cells.
---

# Refuse inventing MEASURED labour / AI-economy scores

## Binding doctrine

- Measurement, not certification. Scores never sold.  
- Labour / AI-economy indices are a **contextual firewall** — never SHA-256 / Ed25519 GSPC grading inputs.  
- Surfaces: `/indices`, `/indices/:slug`, `GET /api/indices`, `GET /api/indices/:slug`.  
- Canon: `docs/SOVOS/INDEX-METHOD-0.1.md` · `docs/EAT_PLAYBOOK.md` · `docs/RUNPOD_POLICY.md` · `client/src/data/labourIndices.ts`.

## Hard refuse

When asked to invent, fill, soft-grade, or “preview” MEASURED values for:

- `ai-economy`  
- `human-labour`  
- `humanoid-labour`  

…or to invent TVL, ARR, wage %, displacement %, TAM as **MEASURED**:

1. **Stop.** Do not invent numbers.  
2. State the register: **UNMEASURED** (or **REPORTED** only with dated, linked citations — never signed as ours).  
3. Point to `/indices` and `measured_score: null` on the API.  
4. Remind: RunPod / Oracle GPU does **not** authorize labour MEASURED invention.

## Allowed instead

- Keep or polish UNMEASURED copy and empty fixtures.  
- Capture dated **REPORTED** citations (no scores fused into GSPC).  
- Advance INDEX-METHOD drafts and fixtures under `scripts/index-fixtures/`.  
- Ship DSH = OS parity so empty indices appear the same in Lobby and `/dashboard/measurement`.

## Never

- Soft “preview grades” on DSH only.  
- Fusing labour series into GSPC cells.  
- Claiming mainnet MEASURED labour indices without owner bank freeze + usable n (+ custody/counsel if securities-adjacent).
