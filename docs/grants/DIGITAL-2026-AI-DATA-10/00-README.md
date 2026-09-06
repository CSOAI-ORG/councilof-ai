# DIGITAL-2026-AI-DATA-10 — draft pack (TUI 4)

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

**Stop. Do not submit. Do not send mail. Do not register PIC from this pane.**
Owner signs. Coordinator is whoever Tiago or Emek **confirms** — not assumed.

Call document (official):  
https://ec.europa.eu/info/funding-tenders/opportunities/docs/2021-2027/digital/wp-call/2026/call-fiche_digital-2026-ai-data-10_en.pdf  
(V1.0, 01.04.2026)

| File | What |
|---|---|
| `01-CALL-CONFIRMED.md` | Budget, rate, deadline, consortium, open-source — vs the brief |
| `02-CONCEPT-NOTE.md` | One page. Measurement, not certification, not a notified body. Empty cells empty. |
| `../FS-PILOT-CONCEPT.md` | FS measurement pilot (not this call; not Annex VII). |
| `03-EMAIL-DRAFTS.md` | Tiago / Emek / Joel / Fraunhofer SIT — Owner sends |
| `04-PIC-SME.md` | Owner actions. **This topic is 50%, not 75%.** UK eligibility **GAP**. |
| `05-JOIN-POINTS.md` | Files, not promises |
| `06-TECHNICAL-ANNEX.md` | Two pages. Named repos only. No OpenShell product in this tree. |
| `07-PARTNER-MATRIX.md` | Roles, countries, funded vs associated |

Interop DOI: existing methodology DOI is `10.5281/zenodo.21991104`. A **new** interop-report DOI is Owner after a report exists. Not minted here.
