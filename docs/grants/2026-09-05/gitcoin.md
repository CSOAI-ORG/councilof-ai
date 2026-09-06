# Gitcoin — mechanisms / Gitcoin Grants rounds — 2026-09-05

Target: https://gitcoin.co/mechanisms · Rounds: https://gitcoin.co/campaigns · Governance: https://gov.gitcoin.co · Facts: `FACTS-2026-09-05.json`

## Status

| | |
|---|---|
| What the target page is | **A taxonomy, not a door.** `/mechanisms` catalogues 78 funding mechanisms (quadratic funding, retro funding, bounties, conviction voting…) with a "Submit a Mechanism" button. It lists no rounds and takes no applications. |
| Open round now | **NONE.** `/campaigns` lists Gitcoin Grants 20–24; the newest is **GG24** (Oct 2025, with the "Public Goods Tooling Development Round" running Oct 2025 – Mar 2026, retrospective posted 2026-05-27). **GG25 was planned for Q2 2026** ("Gitcoin 2026 Strategy — TL;DR", 2026-01-12) and the only GG25 threads are "Early thinking on GG25" (2025-11-25) and a **withdrawn** Octant matching proposal; no GG25 round announcement exists. Since July 2026 the forum is about **"Transition Stewards"** (meeting notes 2026-07-21 → 2026-08-28), a Governor upgrade (2026-08-08) and "Social contract of the gitcoin public goods treasury [2020 – 2026]" (2026-08-31) — a DAO in transition, not in a round. `grants.gitcoin.co` does not resolve in DNS (2026-09-05). |
| Deadline | none; watch https://gov.gitcoin.co/c/proposals and https://gitcoin.co/campaigns for a GG25/26 announcement |
| Eligibility (general, still published) | OSS rounds: at least 3 of — first commit > 90 days ago; a commit in the last 30 days; activity on > 20 days in the last 90; fully open source with permissive licences; lawful. |
| Our eligibility, by bytes | repo created 2026-02-10 (> 90 days) ✓ · pushed 2026-09-05 (< 30 days) ✓ · **51 distinct commit days in the last 90** (GitHub API, 2026-09-05) ✓ · licence file MIT, packages Apache-2.0 ✓ — **qualifies on all four** |
| Sign-in when a round opens | **Wallet** (SIWE) on whichever allocation app the round uses — GG24 used **Gardens** (app.gardens.fund, conviction voting; proposals drafted first in Charmverse) and **Giveth** (OSS QF). No password, no OAuth. Payout address = the estate's Base address. The GG24 tooling round also required a **Karma GAP** project page for milestones. |
| Amount | GG24 tooling round: $123,800 total; Growth pool proposals $5,000–$13,000, Pilot pool $1,000–$3,500 (retrospective, t/25276). Crypto-denominated (token receipt — flagged, not a doctrine breach). |
| Fit | **NOT-FIT NOW — no open round.** Would fit an OSS / infra / "AI agents and infra" or "x402" round (both named as GG25 "frontier metas" by the founder on 2025-11-25) the day one opens. |

## Project profile — complete text in the canonical Gitcoin field order

(Gitcoin's project profile has been stable across Grants Stack, Gardens and Giveth: name · tagline · description · website · GitHub · Twitter · payout address · funding sources · team · round-specific eligibility. Every figure from `FACTS-2026-09-05.json`.)

**Project name** — Council of AI — GSPC signed measurement board
**Tagline** — Signed, recomputable measurement of AI-model behaviour; free to verify, paid per artefact over x402.
**Description** —
Council of AI (CSOAI Ltd, UK 16939677) is an independent AI-governance measurement body. We publish measurement cards about what AI models actually do — refusals, marking of generated content, behaviour under regulated obligations — across 22 axes. The live board reads "22 axes measured · 14 model fleets · 3 public leader scores · 8 fact runs · TIE is TIE · not a certificate." (https://councilof.ai/api/gspc, 2026-09-05).

Every card is Ed25519-signed under did:web:csoai.org, every card hash is a leaf in a public Merkle root (168 cards, root.json as of 2026-09-05T16:02:38Z), the root is witnessed in a public transparency log, and every mistake is in a public CC-BY corrections record (46 entries). Anyone can verify a card offline with our open-source verifier — `pip install csoai-gspc` or the MCP server `csoai-gspc-mcp` — or over MCP at https://councilof.ai/mcp.

What the round would fund: the public-good part — the verifier libraries, the root format's v2 (RFC 6962 domain separation), conformance vectors and a second independent implementation, key rotation and a security audit. Not funded: the measurement banks, the site, or the paid doors.

Public goods stance: the board and verification are free forever and CC-BY-4.0. Agents pay per artefact over x402 on Base (1 distinct non-self payer all-time — https://councilof.ai/api/revenue; we publish the real number, null never 0). We do not tokenize, certify, or sell rankings.

Method: DOI 10.5281/zenodo.21991104. Snapshot: DOI 10.5281/zenodo.22344048. Standards: IETF draft-templeman-scitt-framing-space-00; A2A issue #2150.
**Website** — https://councilof.ai
**GitHub** — https://github.com/CSOAI-ORG/councilof-ai (org: https://github.com/CSOAI-ORG)
**Twitter / Farcaster** — none (leave blank)
**Payout address (Base)** — 0x212686404A7D1E1fD88F35eD6200c3aF7A78ae31 (the estate `payTo`, read from https://councilof.ai/.well-known/x402.json)
**Funding sources to date** — none; self-funded by the sole director. Prior applications drafted, none funded (docs/grants/grants.csv).
**Team** — Nicholas Templeman, sole maintainer (nicholas@csoai.org; ORCID 0009-0001-3869-1068)
**Open-source evidence (round eligibility)** — first commit 2026-02-10; last push 2026-09-05; 51 distinct commit days in the last 90; LICENSE file MIT, published packages Apache-2.0.
**Karma GAP milestones (if required)** — M1 public-root v2 schema + dual roots; M2 conformance corpus; M3 second verifier implementation; M4 key-rotation rehearsal; M5 audit report published.

## Owner line

Nothing to submit today. When a GG25/26 OSS or "AI agents / x402" round is announced, an agent can file it: sign-in is wallet-only, so the estate wallet (owner's key) signs once in the browser; the text above is ready.
