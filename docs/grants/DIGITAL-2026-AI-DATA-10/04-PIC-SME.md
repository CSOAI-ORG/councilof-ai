# PIC registration and SME rate — Owner only

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

TUI 4 does not register PICs. Portal: Funding & Tenders Participant Register.

## Rate (this topic)

**50% lump sum.** The brief’s “75% if SME” is **wrong for DIGITAL-2026-AI-DATA-10-COMPLIANCE**. Do not tell partners 75%. Co-funding is **half**, not a quarter, unless a different topic is chosen.

## SME status (size)

EU Rec. 2003/361: < 250 headcount **and** (turnover ≤ €50m **or** balance sheet ≤ €43m). Linked enterprises count.

CSOAI Ltd (UK 16939677) is **likely** an SME on size if independent and below those ceilings. **Owner must self-assess with accounts.** Newly established: bona fide estimate. This pane has no turnover file.

SME status does **not** raise the rate on this fiche.

## UK as beneficiary — GAP / likely blocker

Eligible beneficiaries: EU MS, EEA, **Digital Europe associated countries**.

Horizon Europe association of the UK is **not** Digital Europe association. Secondary lists (e.g. EUACC, Dec 2025 participating-country list) **do not name the UK**. If that holds, CSOAI Ltd can only be an **associated partner** — **no EU funding**.

**Owner action:** check the live “List of participating countries in Digital Europe” on the Funding & Tenders Portal **before** promising Tiago a funded UK beneficiary.

Without a UK association, the three-country minimum must be filled by **other** eligible legal entities (PT + DE + one more).

## PIC order

1. CSOAI Ltd — register anyway (needed even as associated partner).
2. Tiago’s PT legal entity — after he agrees to be in.
3. Emek’s entity — after association check (TR).
4. Fraunhofer SIT — they likely already have a PIC.
5. Certisyn — associated partner PIC if they join.

Each validation can take days. No PIC → cannot be a named **beneficiary**.
