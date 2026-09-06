# Call confirmation — DIGITAL-2026-AI-DATA-10-COMPLIANCE

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

Source: official call fiche V1.0 01.04.2026 (not a blog).

| Item | Brief asked | Official | Verdict |
|---|---|---|---|
| Call budget | €8.5 million | **EUR 8 500 000** (section 3) | Confirmed |
| Per project | €2–5 million | **EUR 2 000 000 to 5 000 000** (section 10 / project budget) | Confirmed |
| Funding rate | 50%, **75% if SME** | **Lump Sum Grants — 50% funding rate** (section 2). No SME 75% on this topic. 75% appears on *other* DEP SME-support topics. | **50% only. 75% is false for this fiche.** |
| Deadline | 1 Oct 17:00 Brussels | **1 October 2026 – 17:00:00 CEST (Brussels)** | Confirmed |
| Open source | mandate | “Proposers **must** ensure that the systems developed are **open source**, interoperable with existing government data systems…” Also: collaborate with open-source such as Simpl. | Confirmed |
| Consortium | 3 entities, 3 countries | **minimum 3 independent applicants (beneficiaries; not affiliated entities) from 3 different eligible countries** | Confirmed |
| Type | — | Lump sum. Multi-beneficiary **mandatory**. Supply-chain restrictions apply (WP Appendix 4). | Note |
| Sectors named | (bank chatbot) | **Agriculture, environment, manufacturing, healthcare, energy.** Finance / banking chatbot is **not** in the sector list. | **Fit risk.** |
| Eligible countries | — | EU MS + EEA + **countries associated to Digital Europe** (separate list). Associated partners get **no** EU funding. | See PIC-SME |

Associated partners, subcontractors, in-kind third parties may join without being beneficiaries (section 6) — they are not the three-country minimum.
