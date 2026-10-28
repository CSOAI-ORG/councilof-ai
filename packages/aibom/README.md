# packages/aibom

AIBOM for a **MEASURED** lineage — CycloneDX 1.6 + SPDX 3.0.1 (AI profile), signed-CAPABLE.

`emit.py` reads `public/signed/card_index.json`, picks a model that already carries signed
measurement cards (default `clan-csoai-plain:latest`, 2 signed care-refusal cards), **verifies
every card it references**, and emits:

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

## Verification

For each referenced card the exporter recomputes the card id from the canonical body bytes (the
card's own `preimage_rule`) and verifies the Ed25519 signature over those bytes under a **pinned**
key, then records one of three verdicts:

| verdict | meaning |
|---|---|
| `VALID` | id recomputes **and** the signature verifies under the pinned key |
| `INVALID` | the card contradicts itself, or carries a key outside the pinned set |
| `UNCHECKABLE` | the check could not be completed — **not** a failure |

Only `VALID` cards are used as evidence. An unverified card's axis is reported as unmeasured and
is never published as a metric. `UNCHECKABLE` is never `FAIL`: "could not check" is a different
claim from "forged".

The pin is read from `public/signed/verify-card.mjs` — the same published verifier a third party
runs — so this exporter cannot drift from the key the cards are actually pinned to. A card that
carries its own key proves only that the file is self-consistent, so it is `INVALID`, not `VALID`.

## The corpus it names

`csoai:evidence_corpus` states exactly what was used: the **signed-card index**
(`public/signed/card_index.json`, `n_cards`, `packaged_at`). The public-root leaf corpus and the
mill-card corpus are separate corpora; they are not used here and are not merged into this one.

Honesty: only fields readable from the signed bytes are populated. The BOM does **not** stamp
MEASURED — the evidence is the signed cards it points at, re-verified by this exporter. Not a GSPC
score, does not write the board. Tests: `python3 packages/aibom/test_emit.py`.

## Schema status of the two outputs

- **CycloneDX 1.6** — VALID against the published `bom-1.6.schema.json` (0 errors).
- **SPDX 3.0.1** — **UNCHECKABLE**, not FAIL. No JSON schema is published for the SPDX 3.0 JSON-LD
  serialisation: the entry point `v3.0.1/schemas/spdx-schema.json` is a symlink to
  `spdx-schema-2-3.json`, whose `$id` is `http://spdx.org/rdf/terms/2.3` and whose title is
  "SPDX 2.3". Validating JSON-LD against a flat 2.3 schema produces artefacts of the validation,
  not defects in the document.

