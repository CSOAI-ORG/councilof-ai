# Datasheet — CSOAI Signed Measurement-Card Corpus

**Publisher:** CSOAI LTD (UK 16939677) · **Contact:** nicholas@csoai.org · **Date:** 2026-09-01
**Follows:** Gebru et al., "Datasheets for Datasets" structure. **This is a data-asset description, not a data dump.**

## Motivation
The corpus is the accumulating set of **Ed25519-signed, independently recomputable measurement cards** produced by the Council of AI board — one card per (model, governance axis) cell, each carrying value, Wilson confidence interval, sample size, method id, inputs hash, timestamp, and signature. It exists to be the **neutral, recomputable reference** for how named AI models behave against governance axes (transparency, refusal integrity, provenance, and the wider 22-axis set). See the method's public architecture: [DEFENSIVE-PUBLICATION-recomputable-cards.md](DEFENSIVE-PUBLICATION-recomputable-cards.md).

## Composition
- **Unit:** one signed card = one (model, axis) measurement cell.
- **Current size:** 335 signed cells (`n_cards == n_cells`), anchored under a single Merkle root at `/root.json`.
- **Each card carries:** `{model, axis, value∈[0,1], ci (Wilson), n, method_id, inputs_hash, ts, sig, pubkey_ref}`.
- **Board API:** `GET https://councilof.ai/api/gspc` (live) · **Signed index:** `/signed/card_index.json` · **Anchor:** `/root.json`.
- **Neutral-body rule applied:** issuer-operated models are excluded from leader positions (`EXCLUDED_OWN_MODEL`); axes without a signed leader show `NO_SIGNED_CARD`. The *measurement* is always published; only the *ranking* is neutrality-gated.

## Collection & processing
- Cards are produced by deterministic grading of measurement atoms (same atom in → same number out, verifiable offline). Grading **internals are trade secret**; the **output contract and recompute protocol are public**.
- Every card is individually signed; the set is hash-anchored into a published Merkle root, making the whole corpus tamper-evident.

## Recommended uses
1. **Vendor-neutral model comparison** for procurement and diligence.
2. **Compliance evidence** — recomputable records mappable to AI-governance obligations (transparency, risk-management, incident records).
3. **Drift monitoring** — track a model's behaviour across releases (time-series of cells).
4. **Research** — a signed, reproducible measurement baseline others can recompute and cite.

## Licensing & access tiers (RaaS, never SaaS — x402-metered, never Stripe)
- **Tier 0 — Verify (free forever):** read the board, fetch any card, recompute it. A grade is never sold; verification is free.
- **Tier 1 — Issuance:** commission a new signed card for a model/axis (metered per issuance via x402).
- **Tier 2 — Evidence bundle:** a set of cards packaged and mapped to a specific obligation (e.g. AI-Act transparency, DORA operational record, CRA filing), per filing.
- **Tier 3 — Data feed / rail licence:** licensed access to the anonymised aggregate corpus + a runtime verification rail an agent platform embeds (recurring).
- Distribution as: live API, signed JSON card, on-chain/Merkle anchor, PDF evidence pack.

## Maintenance & integrity
- The corpus grows by adding signed cells; the Merkle root is re-published on each anchor. Corrections are made in the open (a public corrections record), never by silent edits — the anchor makes silent edits detectable.

## What is NOT in this asset
- No personal data. No grader internals. No unsigned or asserted numbers — every published cell is signed and recomputable, or it is marked `UNMEASURED`.

---
*Cite as:* CSOAI LTD. "CSOAI Signed Measurement-Card Corpus — Datasheet." 2026-09-01. https://councilof.ai/docs/ip/DATASHEET-signed-card-corpus
