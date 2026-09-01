# packages/aibom

AIBOM for a **MEASURED** lineage — CycloneDX 1.6 + SPDX 3.0.1 (AI profile), signed-CAPABLE.

`emit.py` reads `public/signed/card_index.json`, picks a model that already carries signed
measurement cards (default `clan-csoai-plain:latest`, 2 signed care-refusal cards), and emits:

- **CycloneDX 1.6** — a `machine-learning-model` component whose `modelCard.quantitativeAnalysis`
  carries the MEASURED per-axis accuracy read straight from the signed cards, plus the frozen
  dataset (`gspc-axis` bank, SHA-256) and the harness as components.
- **SPDX 3.0.1** — JSON-LD, `profileConformance: [core, software, ai]`, a `software_ai_AIPackage`.
- a **QUEUED card-v0** (`surface: aibom.document`) that folds `bom_sha256` (+ `spdx_sha256`) and
  references the measured card shas. `sig_ed25519: null` — GHA `#card-attestation-1` signs it.
  **NO_LAPTOP_SIGN.**

```bash
python3 packages/aibom/emit.py --write   # -> public/interop/cards/aibom/{cyclonedx,spdx3,aibom-card}.json
```

Honesty: only fields readable from the signed bytes are populated. The BOM does **not** stamp
MEASURED — the evidence is the signed cards it points at. Not a GSPC score, does not write the
board. Tests: `python3 packages/aibom/test_emit.py`.
