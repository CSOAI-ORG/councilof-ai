# Anthropic Claude for Startups — owner click pack

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

**Do not submit from an agent session.** Owner applies from the Claude Console.

Official: https://claude.com/programs/startups  

Public facts (page + FAQ, 2026-08): apply with a Claude **Console** org (not the consumer app), company email, website, short product description. Credits are first-party API only (not Bedrock / Vertex). Amount is not a public constant — do not type $25k unless Anthropic prints it on the form.

**Eligibility tension (leave it on the form, do not paper over it):**
- Marketing: “Venture backed? Apply for free credits and priority rate limits.”
- FAQ: “Do I need VC funding? No.”
- Third-party writeups often add “institutional equity, founded <4 years, not previously credited.”

CSOAI Ltd is a 2026 UK company. If we are **not** institutional-equity-backed, apply honestly as a measurement startup and accept Start-tier / researcher-access if that is what comes back. **Do not invent a round.**

Fallback (safety research, not the startup form): External Researcher Access — https://support.claude.com/en/articles/9125743 — ~$1,000 API credits if accepted.

## Form fields (paste)

| Field | Value |
|---|---|
| Company | CSOAI Ltd |
| Website | https://councilof.ai |
| Email | nicholas@csoai.org |
| Console org | (Owner: create/use the company org; personal Gmail org is the wrong door) |
| Founded | UK Companies House 16939677 (2026) |
| Funding | Bootstrapped / none — do not write a seed round that does not exist |
| What you are building | Signed, re-verifiable measurement of AI systems. Not a competing model lab. |

## Short description

We measure other people’s models against frozen banks and publish Ed25519 cards a stranger can verify. Claude API (if credited) is for harness glue and site agents — not as an Inspect/model-judge scorer, and not as a claim that Anthropic graded the board. Empty cells stay empty.

## Do not write

GPAI Code · we certify · Inspect scorer · model-as-judge as the grade · 2,410 stickers.
