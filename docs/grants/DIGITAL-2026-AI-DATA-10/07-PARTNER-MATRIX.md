# Partner matrix (draft — nobody has signed)

> **Measured facts, each naming the endpoint or file that returns it.** Re-fetch before sending.
>
> - **Buyer's-eye x402 census (measured artefact).** 316 conformant hosts paid for real: **100 DELIVERED**,
>   **213 REFUSED**, 2 NO_CHALLENGE, 1 MISMATCH. **13 hosts recorded an on-chain settlement and still
>   delivered nothing** (0.193 USDC), each row carrying its tx hash so a reader can check the chain.
>   Dataset: <https://huggingface.co/datasets/csoai/x402-settlement-census> — `summary-2026-09-06.json`.
>   *One purchase per host, one moment: a single refusal is not a pattern. 1.3398 USDC spent, all of it ours.*
> - **Revenue.** `/api/revenue` → `one_number.all_time` = **0** distinct non-self payers, status **MEASURED**.
>   Separately `settled_usdc.count` is **`null`, status UNMEASURED** — null is not zero, and neither is
>   revenue. Self-settlements (5) and zero-value settlements (4) are recorded and are never payers.
> - **Hub cells.** `/api/hub-cards` → `counts`. These are **third-party models on the Hub, never our own
>   coverage** — the endpoint says so in its own `population` field.

| Entity | Country | PIC | Role | Beneficiary? | Notes |
|---|---|---|---|---|---|
| CSOAI Ltd | UK | **none yet** | Measurement, cards, MCP, OS | **Unknown** until DEP UK association confirmed | Owner registers PIC. If UK out of DEP → associated partner, **€0** |
| Tiago Pinto vehicle | PT | **none yet** | Coordinator candidate; OTS time-anchor | Eligible if PT legal entity | Ask in email 1. Not assumed. |
| Conarium / Emek | TR | **none yet** | Second receipt rule | Check TR association to DEP SO2 | LoI requested. No format merge. |
| Certisyn / Joel | US | n/a typical | Standards advisor (VRO **map**) | Associated partner | **No DEP funds.** No VRO implementation claim. |
| Fraunhofer SIT | DE | likely exists | SCITT/RFC 9943 research | Eligible | Ask. Not a TS we run. |

**Minimum funded consortium:** 3 independent beneficiaries, 3 eligible countries.  
If UK cannot fund: need **PT + DE + one more eligible** (not US).

**Funding rate:** 50% lump sum for all on this topic. SME size does not raise it here.

**DOI:** methodology `10.5281/zenodo.21991104` (existing). Interop-report DOI: **not minted**. Owner after a report exists.

**Stop.** No submission until Tiago or Emek **confirms coordination in writing**.
