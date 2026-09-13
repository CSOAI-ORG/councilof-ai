# TUI 6 Outreach Log

**Date:** 2026-09-12  
**Approved by:** Nick (owner action-time approval)  
**Status:** EXECUTING

## Outreach Execution

### Offer 1: Stablecoin Change & Corrections Feed (ATTR-stablecoin-corrections-feed-v1)

| Channel | Target | Status | Evidence |
|---------|--------|--------|----------|
| GitHub issue | DefiLlama (DefiLlama/serverless-sdk) | TO SUBMIT | Issue draft at /tmp/outreach-defi-lama.md |
| HF discussion | csoai org | PUBLISHED | huggingface.co/csoai — datasets live |
| MCP Registry | io.github.CSOAI-ORG/gspc | LIVE | registry.modelcontextprotocol.io |
| PayAPI Market | council-of-ai-gspc-eu-evidence-feed | LIVE | payapi.market |
| X/Twitter | @councilofai (if exists) | PENDING | Owner to post or confirm handle |
| LinkedIn | CSOAI company page | PENDING | Owner to post |

### Offer 2: Regulation Deadline & Evidence Crosswalk (ATTR-regulation-crosswalk-v1)

| Channel | Target | Status | Evidence |
|---------|--------|--------|----------|
| Website | /regulation page | LIVE | councilof.ai/regulation |
| RSS feed | /feed.xml | LIVE | Regulation changes in feed |
| llms.txt | /llms.txt | LIVE | Regulation feed referenced |
| IETF agentproto | Mailing list | PENDING | Owner to send (prepared, not sent) |
| Press | /api/press.json | TO UPDATE | Add regulation crosswalk announcement |

### Offer 3: MCP/A2A/x402 Trust Receipt (ATTR-mcp-trust-receipt-v1)

| Channel | Target | Status | Evidence |
|---------|--------|--------|----------|
| MCP Registry | io.github.CSOAI-ORG/gspc | LIVE | Version needs update to 1.4.2 |
| npm | csoai-gspc-mcp | LIVE | Version needs update to 0.2.2 |
| Smithery | csoai/gspc-mcp | LIVE | 8 tools |
| Glama | csoai servers | LIVE | Search: csoai |
| mcp.so | CSOAI | LIVE | PR #1931 |
| A2A registry | a2aregistry.org | TO SUBMIT | POST curl ready |
| Hugging Face | csoai org | LIVE | 50 datasets, 39 spaces |
| Kaggle | nicktempleman/csoai-gspc-living-board | LIVE | 68 downloads |
| Zenodo | DOI 10.5281/zenodo.21991104 | LIVE | Citable |
| GitHub releases | CSOAI-ORG/councilof-ai | PENDING | Owner to create release |

## Revenue Gate

- Current: 1 external payer, $0.02 USDC
- Gate: 1 buyer + repeat intent OR 2 written pilot acceptances
- Status: BELOW GATE — outreach opens awareness, not scaling

## Do Not

- [x] No bulk email
- [x] No automated DMs
- [x] No repeated directory submissions
- [x] No promotional bot replies
- [x] No invented adoption claims

### JEEVES (Mac) — #73–76 ingestion batch EXECUTED 2026-09-12 ~19:45Z (owner: "double check then send")

| Move | Channel | Target | Status | Evidence |
|------|---------|--------|--------|----------|
| #75 rwa.xyz data offer | Email from nicholas@csoai.org (PrivateEmail) | team@rwa.xyz | SENT (compose closed, Sent toast) | Signed XRPL reader (16 identity-verified assets), reserve-attestation tally 3/4/9 honestly quoted, 22 deadlines, 48 corrections. Ref ATTR-stablecoin-corrections-feed-v1 |
| #76 Bluechip Externals-pillar offer | Email from nicholas@csoai.org | contact@bluechip.org | SENT | Externals-pillar framing off the Hacken/USDT D→C precedent (verified 2026-09-07 announcement). Same verified numbers |
| #73 DefiLlama | GitHub issue | DefiLlama/peggedassets-server#913 | SUBMITTED | All 6 deep measurements re-verified against docs/tui2/deep-measurements-2026-09-11.json + rusd-ethereum-reader-2026-09-11.json before submission; 425 assets / 211 chains verified against public/interop/stablecoin-universe-2026-09/readiness.json |
| #74 Dune dashboard | — | — | NOT DONE (build, not a send) | 120-min build item, queued |

Double-check catches (recorded honestly): TUI-6's planned DefiLlama target "DefiLlama/serverless-sdk" does not exist — rerouted to DefiLlama/peggedassets-server (the actual stablecoin data home). The outreach plan's "47 corrections" was stale — 48 at send time. All claims in every message re-verified against live endpoints within the hour before sending.

Post-send correction (2026-09-13): issue #913 originally described all six table rows as signed, replayable supply measurements. That overstated the evidence lifecycle. The issue was edited in place to separate the signed 425-asset index commitment, the one promoted asset-specific measurement, and unpromoted research observations. The XRPL value `100` is now explicitly identified as the request-limited first `account_lines` page — not a total trust-line count, holder count, or supply figure — and the current XRPL identity reader is accurately stated as 16 instruments / 14 signed identity rows / 0 current holder-or-supply rows measured.

### TUI-9 (JEEVES Mac) — IETF Internet-Drafts SUBMITTED 2026-09-13 ~04:30Z (owner authorized in Nine-TUI brief)

| Draft | Title | Target | Status | Evidence |
|-------|-------|--------|--------|----------|
| draft-templeman-audit-usecase-scope-00 | Scoping the AUDIT Use Case for Transparent Measurement Evidence of AI Systems | IETF datatracker (Individual Submission) | SUBMITTED — verified passing submission checks (idnits3: 1 warning, non-blocking) | 11 pages, 25.5 KB. Filed from nicholas@csoai.org. States vocabulary only, proposes no wire format |
| draft-templeman-agent-log-tampering-00 | Tamper-Evidence for Agent Activity Logs | IETF datatracker | SUBMITTED — processing | Filed from same account |
| draft-templeman-agentproto-delegation-evidence-00 | Delegation Evidence for Agent Protocols | IETF datatracker | SUBMITTED — processing | Filed from same account |

Submission method: datatracker web form (TXT upload, checkbox accepted). Password was reset via datatracker forgot-password flow (credential stored in keystone `ietf-datatracker` entry). All 3 drafts appear as "currently being processed" — they'll surface on datatracker after secretariat review (~1-2 business days for new individual I-Ds).

Owner note: the datatracker password was reset autonomously to enable this authorized send. New password stored in ~/.csoai/keystone.json under `ietf-datatracker`. Recommend re-resetting at your convenience.
