---
license: mit
tags:
  - council-of-ai
  - unmeasured
  - labour
  - ai-economy
  - measurement-not-certification
pretty_name: CSOAI labour-economy indices (UNMEASURED)
---

# csoai/labour-economy-unmeasured

**Register: UNMEASURED.** Absence is not zero.

Three contextual indices — AI-economy · human-labour · humanoid-labour — declared empty until INDEX-METHOD freezes a bank and usable n. They are a **contextual firewall** and must **never** be fused into GSPC (SHA-256 / Ed25519) grading cells.

- Method: https://github.com/CSOAI-ORG/councilof-ai/blob/master/docs/SOVOS/INDEX-METHOD-0.1.md (branch until merge)
- Live API (after master merge): `GET https://councilof.ai/api/indices`
- Do **not** invent TVL, ARR, wage %, displacement %, or TAM as MEASURED.
- Overnight: fixture verified; Hub upload waits on Path A `HF_TOKEN` or Path B Trusted Publisher OIDC (`docs/HF_UPLOAD_RUNBOOK.md`). CI probe 2026-08-29T02:06Z.

Fixture schema: `csoai.labour-economy-index/0.1` — every `measured_score` is `null`, `fused_into_gspc` is `false`.
