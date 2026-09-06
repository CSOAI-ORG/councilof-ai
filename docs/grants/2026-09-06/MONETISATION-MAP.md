# Monetisation map — public-goods funding rails, 06 Sep 2026

Owner: Nick Templeman, CSOAI Ltd (UK 16939677), nicholas@csoai.org. Read-only web pass on 06 Sep 2026;
every cell cites a URL read today or a file in this repo (`EVIDENCE-LOG-2026-09-06.md`, E1–E34).
Nothing was submitted, signed, minted or spent. **Revenue one_number is 0** (no wallet we do not
control has ever paid a non-zero amount; the 05 Sep packs' "1 distinct non-self payer" line is
superseded and must not be reused). The x402 rail's first non-zero settle was a self-settlement
(`docs/product/SETTLED-DOORS-2026-09-06.md`, tx 0xac49241b…1c91, 0.02 USDC, Base); the buyer-side
census is 316 hosts / 100 delivered / 213 refused / 1.34 USDC spent (PR #1589).

Doctrine applied to every row: measurement, not certification; nothing here claims MEASURED,
certified or contracted; hub cells are third-party models, never "our coverage"; no prices, tiers
or processor names on any public surface (the hypercert outputs are linted for this).

## The table (ranked by money ÷ effort — a judgement, stated as one)

Fit 1–5 = how much of what the rail funds we can honestly evidence today. "Owner" = a password
account, an identity check, a wallet key or money; OAuth buttons are agent-operable.

| # | Rail | Open now? | Money type | Fit | Evidence pack | Owner click path | Lane steps | Deadline |
|---|---|---|---|---|---|---|---|---|
| 1 | **Sovereign Tech Fund** (DE) | **YES, rolling** (E19, E22) | EUR work commission, >€50k min | 4 — verifier libs + public-root + I-D are "base technology"; prevalence is the weak criterion (0 dependents, E9) | `../2026-09-05/sovereign-tech-fund.md` + `sovereign-tech-fund.md` (delta) | create account at apply.sovereign.tech (native, no OAuth seen); rewrite in own voice; submit | keep FACTS fresh (`facts.sh`); refresh pack numbers before paste | none; ~10 weeks to reply |
| 2 | **Transformative AI Fund** (EA Funds) | **YES, always open** (E30) | USD grant $10k–150k | 3 — funds "infrastructure" and "demonstration projects" for AI risk; our refusal/marking/provenance measurement is evaluation infrastructure, not catastrophic-risk research — say so | `ai-safety-funders.md` | paperform at funds.effectivealtruism.org (owner identity) | none | none |
| 3 | **GitHub Secure Open Source Fund** | **YES, rolling** (E28) | USD $10k ($6k+$2k+$2k) | 3 — maintainer, licence, UK is a Sponsors region; "community adoption" is weak (138 npm / 198 PyPI downloads, 0 dependents); 15 h programme time | `github-secure-open-source-fund.md` | Microsoft Forms application (owner) | OpenSSF badge project (HUNT §A) strengthens it | none |
| 4 | **NLnet / NGI Zero** | YES, call open (memory + `../nlnet-2026-11.md`) | EUR grant €5k–50k | 4 — open standards, interop, verifiable measurement | `../nlnet-2026-11.md` (unchanged; consistent) | web form nlnet.nl/propose; rewrite in own voice; answer the AI-disclosure field honestly | none | **3 Nov 2026 12:00 CET** |
| 5 | **Base Builder Rewards** (Talent) | league status for Sept 2026 **unverified** (E16, E31: only 2025 league pages found) | weekly ETH, tiered | 2 — GitHub activity counts only for "public crypto repositories"; Builder Score for CSOAI-ORG unknown | `base-builder-rewards.md` | Basename (gas) + Talent account + Human Checkmark (ID) — all owner | none until the owner decides | weekly |
| 6 | **Manifund** | YES, rolling (E29) | USD $0–500k, regrantor-driven | 2 — a public project page; money only if a regrantor picks it | `ai-safety-funders.md` | create project page (account) | none | none |
| 7 | **Hypercerts** | YES — AT-Protocol records, **no chain, no fee** (E5, E6) | none directly; evidence funders read | 3 as evidence | `hypercerts.md` + `hypercerts/*.json` (5 produced, validated) | certified.app account (or any Bluesky handle) → post via hypercerts-scaffold.vercel.app | `--check` in CI; regenerate when inputs move | none |
| 8 | **Drips** | project auto-exists, **unclaimed**, 0 support (E14) | streamed tokens, only if listed on a Drip List | 2 enabler | `drips-oso-karma-gap.md` | claim = GitHub verify + mainnet tx (gas) | none | none |
| 9 | **Karma GAP** | YES, free profile (E13: none exists) | none; prerequisite for several rounds | enabler | `drips-oso-karma-gap.md` | wallet sign-in, create project | none | none |
| 10 | **Open Source Observer** (oss-directory) | **not indexed** (E12) | none; metrics feed for Retro/Deep Funding | enabler | `oso-directory.draft.yaml` | **ruling**: PR to another org's repo | validate YAML in their tooling before any PR | none |
| 11 | **Base Builder Grants** | retroactive, nomination-only; **form URL not found today** (E26, E32) | ETH 1–5 | 2 — "shipped on Base": our doors settle on Base, no contract deployed | — | nomination form (unlocated) | probe for the form weekly | rolling |
| 12 | **Giveth** | YES, create project (E15, E27) | crypto donations; GIVbacks needs verification | 2 — "public good, not personal gain"; a Ltd can apply | — | wallet sign-in; GIVbacks application | none | QF rounds ad hoc |
| 13 | **Octant v2** (Golem) | docs JS-gated today (E17, E33) — unverified | ETH staking-yield grants | 2 | — | none until readable | re-probe with a browser | unknown |
| 14 | **EF ESP** | process page live; grant sub-pages 404 (E18, E24) | ETH grant | 2 — Ethereum relevance is thin (EAS staged, x402 on Base) | — | inquiry form when located | none | rolling, 3–6 wk review |
| 15 | **Alpha-Omega** | window **1–31 Oct 2026** (E25) | USD $50–100k | 1 — security criticality we cannot show | — | Google Form in October | none | 31 Oct 2026 |
| 16 | **Arbitrum Questbook** domain allocators | YES (E34) | ARB, milestone | 1 — nothing on Arbitrum | — | — | — | rolling |
| 17 | **Gitcoin** | **NO round** (E1, E23: forum is "Transition Stewards", Governor upgrade, treasury social contract) | — | 0 now (eligibility itself passes, 05 Sep) | `../2026-09-05/gitcoin.md` | none | watch gov.gitcoin.co + gitcoin.co/campaigns | — |
| 18 | **Optimism Retro Funding** | **NO door.** Atlas shuts 18 Sep 2026; banner names no successor; Grants Council dissolved; airdrop allocation → "Strategic Ecosystem Fund" for OP Mainnet/Enterprise (E2, E3, E20, E21) | — | 0 | `optimism-retro-funding.md` | export from Atlas before 18 Sep (ask 37) | watch `gov.optimism.io/latest.json` | 18 Sep 2026 (shutdown) |
| 19 | **Deep Funding** | entry is the Ethereum dependency graph, not a form (E8) | — | 0 — 0 dependents (E9, E10) | — | none | become depended-on first | — |
| 20 | **Protocol Guild** | ongoing, Ethereum L1 core contributors only (E1) | — | 0 | — | — | — | — |
| 21 | **CDP Builder Grants / credits** | no 2026 round listed (E26) | USD | 1 | — | — | — | — |
| 22 | **STA Standards network / Fellowship** | closed 19 May / 6 Apr 2026 (E19) | EUR | 4 if it reopens | — | — | calendar 2027 call | — |
| 23 | Base Ecosystem Fund / Base Batches | open (E32) | **equity investment** | out of scope for a public-goods map; owner decision | — | — | — | — |

## This week (≤8 rows)

| # | Do | Who | Proof it happened |
|---|---|---|---|
| W1 | Merge this PR; run `python3 scripts/grants/hypercert_metadata_from_cards.py --check` in CI | governor / lane | check job green |
| W2 | STF: create the apply.sovereign.tech account, rewrite `sovereign-tech-fund.md` in own voice, submit | owner | confirmation email to nicholas@csoai.org |
| W3 | TAIF: submit the paperform with the `ai-safety-funders.md` answers | owner | confirmation email |
| W4 | GitHub SOSF: submit the Microsoft Form | owner | confirmation email |
| W5 | Decide the OSO ruling (PR to `opensource-observer/oss-directory` yes/no) | owner | ruling line in OWNER-ASKS |
| W6 | Karma GAP profile + Drips claim (two wallet signatures, one gas tx) | owner | gap.karmahq.xyz project URL; Drips `ClaimedProjectData` |
| W7 | Hypercerts: decide whether to post the 5 records (certified.app account) | owner | AT-URIs recorded in `hypercerts/README.md` |
| W8 | NLnet: calendar 3 Nov; start the own-voice rewrite | owner | draft in `docs/grants/nlnet-2026-11.md` history |

## What is NOT claimed anywhere in these packs
- That any card, root or dataset is certified, contracted, or "legal evidence".
- That any revenue exists: one_number is 0; the only non-zero settle is ours.
- That third-party hub cells are "our coverage".
- That any rail above has accepted, shortlisted or invited us.
