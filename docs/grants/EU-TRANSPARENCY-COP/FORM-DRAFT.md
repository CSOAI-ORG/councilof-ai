# Signatory form — draft answers (Owner fills DOCX)

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

Not sent. Director of CSOAI Ltd signs. Mail after the one-pager is true.

Source: Commission signatory form (DOCX 129548) + FAQ 29 July 2026.

## Identity

- **Legal name:** CSOAI Ltd  
- **Place of establishment:** United Kingdom (Companies House 16939677)  
- **Role on form:** Technology provider of marking / provenance / detection solutions  
  (FAQ bullet: tools for marking, provenance, watermarking and/or detection of AI-generated or manipulated content, placed on the EU market **free of charge**.)  
- **Not:** provider of generative AI systems; **not** GPAI model provider; **not** Section 2 deployer.  
- **Signatory:** director / senior executive with authority to bind CSOAI Ltd.  
- **Product URL:** https://councilof.ai/gspc-verify  
- **Board:** https://councilof.ai/api/gspc  

## Sections

| Section | Tick? |
|---|---|
| Section 1 (marking + detection, Art 50(2) world) | **Only if** the form’s tool-provider commitments are limited to tools we ship (Ed25519 provenance + verify). If Section 1 as a whole requires machine-readable marks on **generative media we produce**, **leave unticked** until TUI 3 lands C2PA (CR-012). |
| Section 2 (deepfake / public-interest text labelling) | **No.** We are not that deployer. |
| GPAI Code of Practice | **No.** Different instrument. |

## Product description (paste)

Council of AI (CSOAI Ltd) places on the EU market, free of charge, a **measurement provenance and verification tool**: Ed25519-signed measurement cards and in-browser verification at https://councilof.ai/gspc-verify (three states: VALID, INVALID, UNCHECKABLE). We are not a general-purpose AI model provider. We do not publish deepfakes or AI-generated news.

**Live:** signed cards, public verify, live board with UNMEASURED cells shown empty.

**Planned, not shipped:** C2PA / Content Authenticity conformance (claims register CR-012). HMAC-signed text receipts are a different product and are not C2PA.

We bind ourselves only to the detection/provenance/verify tool that is actually live. We do not claim machine-readable Art 50(2) media marking until CR-012 is live.

## Cover mail (Owner sends, not TUI)

Subject: CSOAI Ltd — Transparency CoP signatory form (detection / provenance / verify tool)

We submit the signatory form as a **technology provider of marking and detection solutions**. Free EU-market tool: https://councilof.ai/gspc-verify. We are not a GPAI provider and we do not sign Section 2. C2PA conformance is planned (CR-012), not shipped; Ed25519 card provenance is live.

[Director name]  
CSOAI Ltd  
nicholas@csoai.org
