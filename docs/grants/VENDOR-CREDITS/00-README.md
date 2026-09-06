# Vendor credits — fill, Nick clicks, TUI 4 does not send

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

Drafts for the three owner-click programs. **Do not submit from this pane.** No session-ask mail.

| Program | File | Owner action | Honest gap |
|---|---|---|---|
| NVIDIA Inception | `NVIDIA-INCEPTION.md` | Apply at nvidia.com/en-us/startups (~15 min). No fee, no equity. | Apply as an **AI measurement product**, never as consulting. No crypto product. |
| Anthropic Claude for Startups | `ANTHROPIC-STARTUPS.md` | Apply at claude.com/programs/startups from a **company** Console + `csoai.org` mail. | Priority-credit path may want institutional equity. Do not invent a round. Researcher-access ($1k) is a fallback. |
| Google for Startups Cloud | `GOOGLE-CLOUD-START.md` | Apply at cloud.google.com/startup. Need GCP billing ID + domain-matching mail. | **Start** tier (no VC, ~$2k) is the honest default. **Scale** ($200k / $350k AI) needs institutional equity we have not claimed. |

DIGITAL-2026 and Transparency CoP stay in their own folders. Those are not these three clicks.
