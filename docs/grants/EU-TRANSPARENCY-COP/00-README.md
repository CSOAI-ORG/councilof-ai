# EU Transparency Code of Practice — TUI 4 draft

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

**Do not send.** Owner (director of CSOAI Ltd) signs the DOCX and mails it. TUI 4 does not send as Council.

Public one-pager (must be true before mail): `/transparency-cop`

Official:
- How to sign: https://digital-strategy.ec.europa.eu/en/library/how-sign-code-practice-transparency-ai-generated-content
- FAQ: https://digital-strategy.ec.europa.eu/en/faqs/signing-code-practice-transparency-ai-generated-content
- Mail: CNECT-AIOFFICE-CODE-OF-PRACTICE-TRANSPARENCY@ec.europa.eu
- Form: https://ec.europa.eu/newsroom/dae/redirection/document/129548 (DOCX)

Initial-list deadline **27 July 2026 18:00 CEST has passed**. FAQ: you may still sign after that date; you will not be on the July 2026 initial list. Art 50(2)/(4)/(5) applied from 2 August 2026.

| File | What |
|---|---|
| `TUI1-PASS.md` | Click 1 locked: 2-of-3. No SIGNED until ceremony. |
| `ONE-PAGER-LIVE-VS-PLANNED.md` | What is live vs planned. Owner does not send until this is true. |
| `FORM-DRAFT.md` | Role: marking / provenance / detection **tool** provider. C2PA planned. |

GPAI Code of Practice is a **different** instrument. We do not sign that.
