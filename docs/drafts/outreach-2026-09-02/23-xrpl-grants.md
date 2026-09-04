# 23 — XRPL Grants (unified application / AI Fund) (FORM, not email)

segment: B — XRPL issued-asset disclosure switchboard (reader + monthly signed deltas) + the agent rail that reads it
status: **GATE CLEARED 2026-09-04** — `GET /api/xrpl` returns 200. Still nothing submitted; owner gate below stands.

**Door:** https://xrplgrants.org/ (read 2026-09-02): tracks Brazil Fund, AI Fund, Onchain Finance, Japan/Korea, global accelerators (Brinc HFIP, Tenity SFIIP); priorities "DeFi, RWA, Payments, Trade Finance"; "Additional new programming to be announced in October 2026"; info@xrplgrants.org. Forms (search 2026-09-02, xrplgrants.org): unified application https://submit.xrplgrants.org/submit/30143c5a-0fec-46bd-ae04-a7a9a407545d/unified-application-xrpl-grants-xrpl-accelerator (considered for all programmes); AI Fund form https://submit.xrplgrants.org/submit/5fdbb7d9-57ee-4005-a309-8308c4ba2b46/xrpl-grants-ai-fund-application ("If AI is not a central component of your project, please return to the main application"); award range as published in the FAQ, "for projects up to 12 months". Field names not read — UNVERIFIED.
**Owner gate:** grant in XRP/USD = trading income at sterling value (accountant). Ripple/RLUSD is a measured subject on our reader — never described as a client.

## Claim verification — every number below was read from the live endpoint on 2026-09-04

The previous draft of this file overstated three things. They are corrected here, and each surviving
claim names the URL it can be re-read from. An application is a document someone will check.

| claim as previously drafted | verified state 2026-09-04 | source |
|---|---|---|
| "five deterministic-fact axes" | **four**, all MEASURED at n=16 | `/api/gspc` |
| "AccountRoot flags, `gateway_balances`" | **not served** by the public reader | `/api/xrpl` |
| "two-way `xrp-ledger.toml` check" over 16 assets | **succeeds on 4 of 16**; the other 12 carry `unmeasured: strict_two_way_toml` | `/api/xrpl` |
| "16 xrpl.fi identity-verified issued assets" | correct — 16/16, `xrpl_fi_assetCount: 16` | `/api/xrpl` |
| hourly signed leaves in a witnessed root | correct; 2 of 16 assets carry `NO_LAPTOP_SIGN` and are honestly unsigned | `/api/xrpl`, `/root.json` |

**The 12-of-16 gap is the application, not a weakness to hide.** Ten issuers are covered —
Bitstamp, Braza Bank, Circle, GateHub, Ondo Finance, Quantoz, Republic of Palau, Ripple,
Schuman Financial, Société Générale-FORGE. Only 4 assets resolve a strict bidirectional
domain ↔ `xrp-ledger.toml` match. Eight fall back to the XRPScan well-known directory and four
to the XRPLMeta registry — both third-party indexes, not the issuer's own signed declaration.
That is a real, dated, measurable disclosure gap on the ledger's largest issued assets, and
closing the measurement of it is exactly what the grant funds.

## Form answers (drafted — unified application; AI Fund only if the agent rail is the centre)

- **Project:** XRPL issued-asset disclosure switchboard — signed, witnessed, free to verify
- **What is live:** `GET https://councilof.ai/api/xrpl` reads 16 xrpl.fi identity-verified issued assets and publishes, per asset, symbol / issuer / issuer_address / kind / holders / supply / `verified_via` / `sha256` / `sig_ed25519` / an explicit `unmeasured` list. Four deterministic-fact axes run over it on the public board — reserve-attestation, regulatory-framework, distribution-integrity, custody-disclosure — each MEASURED at n=16. Hourly signed leaves in a witnessed root since 31 Aug 2026; the toml-gap notices at https://councilof.ai/interop/xrpl-toml-gap-2026-09/.
- **The finding this already produced:** only 4 of 16 assets resolve a strict two-way domain ↔ toml match; 12 are recorded `unmeasured: strict_two_way_toml` rather than passed off as verified. Nothing on the ledger publishes this today.
- **What the grant builds:** (1) monthly signed `delta` leaves per issuer — supply, flags, `home_domain`, toml state, disclosure cadence observed beside the statute text the issuer cites — published free; (2) the provable-history slice (`/archive/xrpl/<asset>`) with Rekor/OTS witness and a recompute recipe; (3) an MCP/x402 door so agents can fetch a signed reading and learn the signed form (AI-Fund angle) — the live read stays free.
- **Who benefits:** every issuer on the ledger gets a free, dated, third-party record of its own disclosure state (issuers are subjects, never charged); integrators, auditors' evidence files and insurers get a citable history; the ledger gets a public good that makes "declared domain ↔ toml ↔ flags" mismatches visible as facts, never as verdicts.
- **Milestones:** M1 monthly delta set for all 16 + new issuers on discovery; M2 archive slice + witness + DOI; M3 agent rail live with one third-party settlement published.
- **Team / entity:** Nicholas Templeman, CSOAI LTD (UK 16939677), Apache-2.0.
- **Never on the form:** oracle, risk, rating, proof of reserves, discrepancy, "RLUSD/Ripple partner".

## Re-check before submitting

    curl -s https://councilof.ai/api/xrpl | python3 -c "import json,sys; d=json.load(sys.stdin); \
      a=d['assets']; print(len(a),'assets'); \
      print(sum(1 for x in a if x['verified_via']=='Bidirectional domain match'),'strict two-way'); \
      print(sum(1 for x in a if x.get('unmeasured')),'carry an unmeasured field')"

Expected on 2026-09-04: `16 assets / 4 strict two-way / 12 carry an unmeasured field`.
If those move, fix the answers above before the form goes anywhere.
