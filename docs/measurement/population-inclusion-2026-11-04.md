# Four-Population Card & Root Inclusion Relation (2026-11-04)

**Schema:** `csoai.population-inclusion/1.0` · **Status:** `MEASURED` · **Closes:** `M2` / `W2`
**Source Authority:** [`public/root.json`](../../public/root.json), [`public/signed/card_index.json`](../../public/signed/card_index.json), [`functions/api/cards.ts`](../../functions/api/cards.ts), [`functions/api/hub-cards.ts`](../../functions/api/hub-cards.ts), [`council-os/CARD-CORPORA.md`](../../council-os/CARD-CORPORA.md)
**Doctrine Rule #5:** Two surfaces that count different corpora stay separately labelled numbers and are never summed or silently reconciled.

## 1. The Four Populations (Measured from Committed Bytes)

| Population ID | Surface / Endpoint | Source Artifact | Count | SHA-256 Digest | Verification State |
|---|---|---|---:|---|---|
| **P1 — Public-Root Merkle Leaves** | `GET /root.json` | `public/root.json` (`as_of: 2026-11-07T20:54:37Z`) | **`442`** | `735f78b96888ade0…` (Merkle `bc2b1b4e6ecda0b2…`) | `SIGNED` (`did:web:csoai.org#board-attestation-1`) |
| **P2 — Signed Card Chain Index** | `GET /signed/card_index.json` | `public/signed/card_index.json` | **`335`** | `4ff54c78dba0b15b…` | **`335/335 VALID`** (`#card-attestation-1`) |
| **P3 — `/api/cards` Composite View** | `GET /api/cards` | `card_index.json` (`335`) + `cross-border-card.signed.json` (`1`) | **`336`** | `a7cf8b473ab63230…` (East-West card) | `335` DID-anchored + `1` `UNANCHORED` inline key |
| **P4 — Hub Mill Signed Corpus** | `GET /api/hub-cards` | `public/interop/mill-cards-signed/signed-*.json` + `csoai/gspc-hub-cards` | **`3193`** signed files (`3193` unique IDs · `1682` superseded · `58` withdrawn) | `f7e12e711d0aaf7a…` | Signed under `#board-attestation-1` / `#card-attestation-1`; filtered by `SUPERSEDED.jsonl` & `WITHDRAWN.jsonl` |

## 2. Exact Set Inclusion & Disjointness Matrix

| Pair | Set Relation | Identifier Overlap | Why |
|---|---|---:|---|
| **`P1` vs `P2`** | `P1 ∩ P2 = ∅` (`SEPARATE_CORPORA`) | **`0`** | `P1` hashes the 19 adapter families in `scripts/publish_public_root.py`; `P2` indexes the `335`-card GSPC fleet chain in `public/signed/cards/`. |
| **`P2` vs `P3`** | `P2 ⊂ P3` (`P3 = P2 ∪ {cross-border-card}`) | **`335`** (`100%` of `P2`) | `GET /api/cards` prepends `public/signals/cross-border-card.signed.json` (`csoai.east-west-card/1`) to `P2` (`335 + 1 = 336`). |
| **`P1` vs `P4`** | `P1 ∩ P4 = ∅` (`SEPARATE_CORPORA`) | **`0`** | `P4` stores third-party Hugging Face Hub `(model, axis)` mill cards keyed by `sha256(canonical body)`; `P1` stores root adapter leaves. |
| **`P2` vs `P4`** | `P2 ∩ P4 = ∅` (`SEPARATE_CORPORA`) | **`0`** | `P2` measures the reference 14-axis GSPC fleet; `P4` measures third-party Hugging Face Hub models via `mill_hub_queue.py`. |

> Measurement, not certification. Anyone can re-check at https://councilof.ai/verify
