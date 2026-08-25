# RWA ATTEST — permissionless signed attestation of tokenized real-world assets
Strategy realized (ranked target list, 2026-08-24): publish **unsolicited, Ed25519-signed verdicts**
about tokenized RWAs, referencing their **public** issuing r-address (XRPL) or contract address (EVM),
with **NO issuer consent**. Rails: XRPL Memos (lowest-friction hex) · XRPL XLS-70 Credentials
("provisional until accepted" = honest unsolicited framing) · Ethereum Attestation Service (EAS,
off-chain free/signed/immutable; recipient = token contract, no consent).

## Doctrine (bind)
- Measurement, not certification. Never endorsement / issuer participation / credit rating / investment advice.
- JL.5 — honest: `governance_measurement: UNMEASURED` until a GSPC bank exists; never a fabricated score.
- GX.2 — worker-measurement signature; the estate pod (`did:web:csoai.org#board-attestation-1`) re-signs the public attestation.
- IY Wall 2 — never forecast; verdicts state what is verifiable on-chain (address, asset, stated AUM source).

## Usage
```
python3 rwa_attest.py targets            # list the 22-target registry
python3 rwa_attest.py card <id>          # build + sign + ClaimGuard-verify a verdict card
python3 rwa_attest.py memo <id>          # XRPL Memo hex (ready to submit from our funded account)
python3 rwa_attest.py eas <id>           # EAS off-chain attestation payload (recipient = contract)
python3 rwa_attest.py batch              # gen + ClaimGuard-verify all targets -> rwa-attest-index.json
```
Targets: ousg, buidl, benji, acred, aviva, jmwh, dcp, rlusd, eurcv, archax + 12 deep-universe
adapters (usdy, ondo_stk, haml_scope, kkr_hc, vaneck, backed_nvda, backed_bib01, superstate_uscc,
circle_usyc, plume, blochome, schuman_eurp). Verified public addresses are in code; the adapters are
cataloged from research and carry `addr:pending` until RWA.xyz/Etherscan-verified.

## Execution plan (from the ranked target list)
- **Stage 1 (testnet):** XRPL Devnet Memo + CredentialCreate; EAS off-chain on Sepolia/Base. Reference impls:
  Ondo OUSG (dual-chain), BlackRock BUIDL (max prestige), Justoken JMWH (max demonstrative — the
  represented-vs-distributed gap). Gate: testnet attestations verify cleanly → mainnet.
- **Stage 2 (mainnet unsolicited):** publish signed verdicts vs Top-10; Memos (not Credentials) for XRPL v1
  (no reserve overhead); EAS off-chain for EVM, on-chain for marquee (BUIDL) for easscan.org discoverability.
- **Stage 3 (scale):** enumerate Securitize 130+ tokens + Ondo Stocks 430+ equities + Backed catalog → EAS
  programmatically; sweep XRPScan-verified RWA issuers.

## Legal risk flags (per target type)
- Regulated securities (BUIDL/BENJI/OUSG/ACRED/DCP/Aviva/Archax/SBI/Hamilton/KKR/VanEck): position as
  **compliance/measurement attestation**, NOT a credit rating; obtain securities-law counsel before EU/scale (EU CRA Reg, US NRSRO).
- More open (stablecoins RLUSD/EURCV/USDB, Dubai real estate, commodities) = lower risk.
- Justoken JMWH: powerful demonstrative but ensure factual/sourced; the 19-holder / $0-volume data is on-chain.

## Next (owner/deploy)
Re-verify every r-address (XRPScan) + contract (Etherscan) before each attest; obtain counsel; then push
via the deploy rail (XRPL submit + EAS schema/attest with the estate signing pod).

## Build plan (Stage 1-5, from the 2026-08-25 governance/custody research)
**Stage 1 — Custody (unblocks mainnet):** sign on **AWS KMS** (now supports BOTH secp256k1 + Ed25519/EdDSA,
Nov 7 2025) or **Turnkey Pro** (policy engine, both curves, $0.10 PAYG). Enforce a signing policy
(whitelisted tx types/destinations, DENY-wins), full audit log, publish key provenance via **did:web**.
Shamir/Vault cold backup (never on workstation). Self-hosted MPC upgrade later: **Coinbase cb-mpc (MIT,
both curves)** or bnb-chain/threshold tss-lib; avoid ZenGo (archived) + Silence Labs (proprietary header).

**Stage 2 — Legal (HARD GATE before any named-security verdict):** counsel brief on the SEC "Statement on
Tokenized Securities" (Jan 28 2026, third-party/unaffiliated tokenization recognized) + the CRA
unsolicited-rating disclaimer template (opinion-not-fact, not a recommendation, no suitability, as-of-date)
+ IOSCO Final Report on Tokenisation (Nov 11 2025). Get sign-off on opinion-vs-advice framing + the
unsolicited/permissionless posture + Investment Advisers Act exposure. **Do not publish a named-security
verdict until counsel clears it.**

**Stage 3 — Address gap (10 unconfirmed adapters):** get an **RWA.xyz API key** (startup discount),
pull issuer/token metadata, cross-verify via Etherscan address-ownership/token-verification + XRPScan/xrpl.fi.
Mark any still-unconfirmed as `pending` (never guess an address). Use the "Distributed vs Represented"
classification.

**Stage 4 — Standards + indexing:** align to **W3C VC 2.0** data model (EdDSA cryptosuite = XRPL Ed25519,
ECDSA = EVM secp256k1, Bitstring Status List for revocation); keep XRPL XLS-70 + EAS as transport. Deploy
the **EAS Indexing Service** (Postgres/GraphQL) for EVM + an XRPL credential-object ingest into the same
time-series store (no single EAS+XRPL indexer exists — compose one).

**Stage 5 — Front-end:** start from **CopilotKit/OpenGenerativeUI** (v2, Next 16/React 19, Tailwind 4, MCP
server included) → render attestation-verdict cards with CopilotKit v2 generative UI (`useRenderTool`);
AG-UI wire (LangGraph/CrewAI/Mastra). The Open AG-UI Demo + canvas-with-langgraph-python are references.

**Live-regulation cross-reference (RegTech):** backbone on **EUR-Lex CELLAR** (SPARQL/REST, no key),
**Federal Register** API, **eCFR**, **IOSCO/BIS** feeds — SHA-256 content-hash diffing for change
detection (GSPC already has the primitive). Reserve paid feeds (Thomson Reuters/Corlytics) for gaps.

**Contextual-signal layers (firewalled, NEVER inputs to the deterministic attestation):** cross-cite as
labeled context only — Anthropic Economic Index, ILO WP140, WEF Future of Jobs 2025, OECD AI Exposure
Measure, and (for physical-asset RWAs) Goldman/Morgan Stanley humanoid indices (projections, flagged as such).

**Stats governance:** Wilson CI + conservative separation rule + **McNemar exact paired test** (added to
card_pipeline.py) + Benjamini-Hochberg. See METHODOLOGY.md — the published, citable differentiator none of
the five competitors (Moody's TIE, S&P SSAs, Chainlink ACE, Credora/RedStone, Particula) discloses.
