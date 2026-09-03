# 23 — XRPL Grants (unified application / AI Fund) (FORM, not email)

segment: B — XRPL issued-asset disclosure switchboard (reader + monthly signed deltas) + the agent rail that reads it
status: DRAFT — HOLD until endpoint 200 · nothing submitted

**Door:** https://xrplgrants.org/ (read 2026-09-02): tracks Brazil Fund, AI Fund, Onchain Finance, Japan/Korea, global accelerators (Brinc HFIP, Tenity SFIIP); priorities "DeFi, RWA, Payments, Trade Finance"; "Additional new programming to be announced in October 2026"; info@xrplgrants.org. Forms (search 2026-09-02, xrplgrants.org): unified application https://submit.xrplgrants.org/submit/30143c5a-0fec-46bd-ae04-a7a9a407545d/unified-application-xrpl-grants-xrpl-accelerator (considered for all programmes); AI Fund form https://submit.xrplgrants.org/submit/5fdbb7d9-57ee-4005-a309-8308c4ba2b46/xrpl-grants-ai-fund-application ("If AI is not a central component of your project, please return to the main application"); award range as published in the FAQ, "for projects up to 12 months". Field names not read — UNVERIFIED.
**Owner gate:** grant in XRP/USD = trading income at sterling value (accountant). Ripple/RLUSD is a measured subject on our reader — never described as a client.

## Form answers (drafted — unified application; AI Fund only if the agent rail is the centre)

- **Project:** XRPL issued-asset disclosure switchboard — signed, witnessed, free to verify
- **What is live:** `GET https://councilof.ai/api/xrpl` reads 16 xrpl.fi identity-verified issued assets (AccountRoot flags, `gateway_balances`, two-way `xrp-ledger.toml` check); five deterministic-fact axes run over it on the public board; hourly signed leaves in a witnessed root since 31 Aug 2026; the toml-gap notices (https://councilof.ai/interop/xrpl-toml-gap-2026-09/).
- **What the grant builds:** (1) monthly signed `delta` leaves per issuer — supply, flags, `home_domain`, toml state, disclosure cadence observed beside the statute text the issuer cites — published free; (2) the provable-history slice (`/archive/xrpl/<asset>`) with Rekor/OTS witness and a recompute recipe; (3) an MCP/x402 door so agents can fetch a signed reading and learn the signed form (AI-Fund angle) — the live read stays free.
- **Who benefits:** every issuer on the ledger gets a free, dated, third-party record of its own disclosure state (issuers are subjects, never charged); integrators, auditors' evidence files and insurers get a citable history; the ledger gets a public good that makes "declared domain ↔ toml ↔ flags" mismatches visible as facts, never as verdicts.
- **Milestones:** M1 monthly delta set for all 16 + new issuers on discovery; M2 archive slice + witness + DOI; M3 agent rail live with one third-party settlement published.
- **Team / entity:** Nicholas Templeman, CSOAI LTD (UK 16939677), Apache-2.0.
- **Never on the form:** oracle, risk, rating, proof of reserves, discrepancy, "RLUSD/Ripple partner".
