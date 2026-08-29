# HF labour / AI-economy index honesty (overnight note)

**Live estate:** `GET /api/indices` and `/indices` declare **UNMEASURED** (`measured_score: null`). Labour/economy rows are a **contextual firewall** — never SHA-256/Ed25519 GSPC grading inputs (INDEX-METHOD-0.1).

**Hub observation (2026-08-26):** `csoai/rwa-attest` hosts `ai-economy-index.v0.1.json` and `human-labour-index.v0.1.json` labeled `MEASURED-INDEX-v0.1` with REPORTED public-series components (Eurostat / World Bank). That branding must not be read as:

- a GSPC cell grade, or
- permission to invent MEASURED labour/economy product scores on Council OS / DSH, or
- an INDEX-METHOD bank freeze.

Until INDEX-METHOD freezes a bank and counsel clears product language, the public product surface stays **UNMEASURED**. Hub stub live: [`csoai/labour-economy-unmeasured`](https://huggingface.co/datasets/csoai/labour-economy-unmeasured) (#139/#253 ✅).

Corrections path: append to `/api/corrections` if Hub copy overclaims; never silent-edit signed artefacts.
