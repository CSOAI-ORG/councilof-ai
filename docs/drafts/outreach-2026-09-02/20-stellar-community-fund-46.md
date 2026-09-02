# 20 — Stellar Community Fund #46 Build Award (FORM, not email)

segment: B — provable archive / issued-asset disclosure reader, ported to Stellar
status: DRAFT — HOLD until endpoint 200 · nothing submitted

**Door:** https://communityfund.stellar.org/awards (read 2026-09-02): SCF #46 in Submission phase, deadline **8 Nov 2026**, award ceiling as published on the page (paid in XLM), tracks Open / Integration / RFP; process = Interest Form (2 wks) → Build Award Submission (2 wks) → Prescreen & Panel Review → Community Vote (Open track) → Information Collection; tranches at MVP / Testnet / Mainnet. Handbook https://stellar.gitbook.io/scf-handbook/scf-awards/build-award (read 2026-09-02): a full submission includes "A detailed technical roadmap and milestone plan", "A breakdown of your budget across tranches", "Your current traction (on Stellar, other chains, or offchain)", "Information about your team's skills and experience"; "Strong teams ready to deliver and ship in 3–5 months"; KYC/KYB before funds; each tranche submitted within 90 days of the last payment.
**Owner gate before submitting:** grant paid in XLM is trading income at sterling value on receipt (accountant); counsel only if the programme requires holding or voting a token. State the rail honestly: "challenge-only" until `/api/x402` says live.

## Interest form (owner fills; answers drafted)

- **Project name:** Council of AI — signed issued-asset disclosure reader for Stellar
- **Track:** Open (fallback: Integration)
- **One-line:** An open-source (Apache-2.0) reader that records, hourly, the on-ledger disclosure state of Stellar issued assets — issuer account flags, `home_domain`, the two-way `stellar.toml` check, per-asset supply at a stated ledger — signs each reading (Ed25519, did:web:csoai.org), and witnesses the hourly root in Sigstore Rekor and OpenTimestamps, so anyone can verify for free what an issuer's disclosure state was at any past hour.
- **What exists today:** the same reader pattern is live for XRPL issued assets (https://councilof.ai/api/xrpl, n=16, hourly signed roots since 31 Aug 2026, witnessed at https://councilof.ai/interop/root-witness-latest.json); a Stellar leaf already reads the BENJI issuer account (https://councilof.ai/interop/benji-onchain-supply-2026-09/).
- **Why Stellar:** the largest tokenised money-market fund's primary chain is Stellar; nobody publishes an independent, signed, witnessed monthly record of per-chain supply beside the issuer's own filed figure.
- **Referred by:** (leave blank unless true)

## Build Award submission (drafted)

**Technical roadmap and milestones (three tranches, deliverables only — the owner enters amounts on the form; no amount appears in this draft):**
1. *MVP* — Stellar adapter (Horizon + `stellar.toml` two-way check) staging one signed leaf per watched asset per hour into the existing public root; roster: BENJI, USDC, EURC and the assets listed by the Stellar asset directory that publish a `stellar.toml`; free reader `GET /api/stellar`; verify free at `/gspc-verify` and `/api/proof?sha=`.
2. *Testnet* — monthly `delta` leaf set: per-asset supply at last ledger of the month beside the issuer's public filing/attestation reference (accession number or attestation URL + sha256), `difference` printed, `unmeasured[]` declared; published on `/interop/stellar-issued-assets-<YYYY-MM>/`; methodology frozen with a Zenodo DOI.
3. *Mainnet* — the windowed history slice as one signed manifest (`/archive/stellar/<asset>/index.json`), Rekor/OTS witness per root, a recompute recipe a stranger can run; MCP tool `verify_inclusion` covers Stellar leaves.

**Traction:** live XRPL reader and 22-axis board (https://councilof.ai/api/gspc); 335 signed cards; npm `csoai-gspc-mcp`; hourly witnessed roots since 31 Aug 2026.
**Team:** Nicholas Templeman (founder, CSOAI LTD, UK 16939677); harness and adapters open source at github.com/CSOAI-ORG.
**Meaningful Stellar utilisation:** every reading is of Stellar ledger state; the output is a public good for Stellar issuers (a free, dated, third-party record of their own disclosure state) — issuers are subjects, never charged.
**Words that must not appear on the form:** oracle, risk, rating, proof of reserves, compliant, certified, guarantee. A non-zero `difference` is a difference, never a discrepancy.
