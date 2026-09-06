# Optimism — OP Atlas "Governance Fund Missions" — 2026-09-05

> **Figures below are stamped `2026-09-05T16:02:38Z` and were correct then.**
> Four headline numbers have since moved — the root card count *falls* when cards are
> retracted. **Re-fetch before sending:** see `docs/company/LIVE-FACTS-2026-09-06.md`.

Target: https://atlas.optimism.io/missions/governance-fund-missions · Forum category: https://gov.optimism.io/c/gov-fund-missions/69 · Facts: `FACTS-2026-09-05.json`

## Status

| | |
|---|---|
| Open now | **NOT OPEN for us.** The Atlas page itself is a JavaScript shell — the server HTML contains only the title, "Governance Fund Missions authored by the Developer Advisory Board address specific challenges core to Optimism's vision and strategy." and a Privy welcome image; no mission list is rendered without a session. The governing forum thread **"Season 9 Governance Fund Missions"** (gov.optimism.io/t/10526, 2026-01-07) defines Season 9, which per "Guide to Season 9" (t/10529) ran **29 Jan – 3 Jun 2026**. On **25 Jun 2026** the Foundation posted **"Council Dissolution Proposal: Dissolve the Grants Council"** (t/10732). On **6 Aug 2026** it proposed re-designating the airdrop allocation as a "Strategic Ecosystem Fund" for OP Mainnet / OP Enterprise (t/10797). No Season 10 mission thread exists (search 2026-09-05). |
| Deadline | none published; the mission cycle that existed has ended |
| Eligibility (Season 9 text) | "Projects are eligible who have deployed their own contracts on eligible OP Chains." Success metric for both the Grants Council (3.89M OP) and the Developer Advisory Board (0.98M OP) missions: "DEX TVL for collateral-borrow pairs that exist on lending markets (e.g., Morpho, Aave)". |
| Retro Funding: Dev Tooling | ran "Feb 5th – July 31st" 2025 (t/9598); needs "a public GitHub repository with a history of public commits" and JS/Rust packages "imported by at least three verified Superchain builder projects contributing 0.01 ETH in L2 gas fees within the past 6 months". Not currently running. |
| Sign-in | **Privy**: `loginMethods: ["email", "farcaster", "wallet"]` (op-atlas `app/src/providers/PrivyAuthProvider.tsx`, read via GitHub API). **No GitHub/Google OAuth.** Email = one-time code to the mailbox (owner's inbox); wallet = the estate key (owner). GitHub is used only to *verify repo ownership* inside a project profile. |
| Amount | Season 9 budgets above, paid in OP tokens (a token receipt — flagged, not a doctrine breach; research brief `compass_artifact_wf-b0920889…`) |
| Fit | **DOES NOT FIT NOW.** We have deployed no contracts on any OP chain; our on-chain footprint is receiving USDC on Base (`payTo 0x2126…ae31`, `eip155:8453`), which is a Superchain chain but not a deployment. The mission metric is DeFi TVL. Our npm package (`csoai-gspc-mcp` 0.2.1) has no known Superchain-builder importers. |

## What would make it fit

1. An on-chain footprint on an OP chain — e.g. the compliance-pact / EAS attestation contract that `docs/ip/IP-REGISTER-2026-09-05.md` lists as STAGED ("no EAS key… nothing is minted"). Deploying the attestation schema on Base or OP Mainnet is a deployment.
2. A Retro Funding mission for dev tooling or measurement re-opening (watch https://gov.optimism.io/c/grants/retrofunding/46).
3. The profile below already created, so that a re-opened mission is a one-click apply.

## Atlas project profile — complete text, in the profile's field order

(Field order from the op-atlas project form: details → contributors → repos → contracts → grants & funding → publish. Every figure from `FACTS-2026-09-05.json`.)

**Project name** — Council of AI (GSPC measurement board)
**Description** — Independent, signed, recomputable measurement of AI-model behaviour. 22 axes on the public board ("22 axes measured · 14 model fleets · 3 public leader scores · 8 fact runs · TIE is TIE · not a certificate."), every card Ed25519-signed under did:web:csoai.org, committed to a public Merkle root (168 cards, as of 2026-09-05T16:02:38Z) and witnessed. Free verification for anyone (PyPI csoai-gspc, npm csoai-gspc-mcp, MCP at https://councilof.ai/mcp). Paid only per artefact over x402 on Base; the board and verification stay free. Measurement, not certification.
**Category** — Utility / Developer tooling (choose "Utility" if "Tooling" is absent)
**Website** — https://councilof.ai
**Farcaster / Twitter** — (none held; leave blank — do not create)
**Mirror / blog** — https://councilof.ai/honesty
**Team / contributors** — Nicholas Templeman (nicholas@csoai.org), sole maintainer
**Repos** — https://github.com/CSOAI-ORG/councilof-ai (verify ownership by committing the Atlas-issued file; licence file: MIT; packages Apache-2.0) · https://github.com/CSOAI-ORG/gspc-board
**Packages** — npm `csoai-gspc-mcp` 0.2.1 · PyPI `csoai-gspc` 0.2.20260905
**Contracts** — none deployed. (Do not list the USDC receiving address as a deployment.)
**Grants & funding** — none received; self-funded. Revenue: 1 distinct non-self x402 payer all-time (https://councilof.ai/api/revenue).
**Pricing model** — free board and verification; metered artefacts over x402 (amounts appear only in the 402 challenge, never in prose)
**Links** — methodology DOI https://doi.org/10.5281/zenodo.21991104 · snapshot DOI https://doi.org/10.5281/zenodo.22344048 · IETF draft https://datatracker.ietf.org/doc/draft-templeman-scitt-framing-space/ · A2A issue https://github.com/a2aproject/A2A/issues/2150 · Hugging Face https://huggingface.co/csoai
**Impact statement (if a mission asks)** — We measure; we do not tokenize, certify or rank for sale. Any OP received is payment for measured impact, held as treasury, and disclosed.

## Owner line

Only if you want the profile pre-created: sign in at https://atlas.optimism.io with the email one-time code (or the estate wallet), paste the profile above, and verify the repo. Nothing to submit today — no mission fits.
