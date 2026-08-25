# EAT · DSH · permissionless RWA attestation — alignment

> Aligns Aug 2026 compass RWA research (permissionless Memo/EAS ranking +
> Signed Attestations target-list corpus `wf-67a7e7b4…` + Attestation vs
> Tokenization options `wf-b01660de…`) with Council doctrine (Claude / product
> spine). Measurement, not certification. Scores never sold.
> CSOAI Ltd · UK **16939677**.

## One sentence each

| Term | Meaning here |
|------|----------------|
| **EAT** | **E**vidence **A**ttach **T**ransform — public artifact → unsigned→signed re-measurement play. On `/competitors` today; same grammar for RWA issuers tomorrow. |
| **DSH** | **D**ashboard **S**oftware **H**ub — signed-in `/dashboard`. Same Layer 0 / evidence destinations as Council OS. Not a second truth. |
| **Permissionless attestation** | Publish a signed measurement *about* a public issuer/contract with **no issuer consent** (XRPL Memo / provisional Credential; EAS `recipient` = contract). Unsolicited opinion, on-chain pointer. |
| **Attestation ≠ tokenization** | A signed statement (EAS / XRPL Credential / Memo hash) is **not** a token, NFT, or ownership claim. It cannot mint, transfer, or confer title. Tokenization requires a regulated issuer/legal wrapper. |

## How they fit together

```
Public artifact (issuer r-address / ERC contract / on-chain stats)
        │  EAT play
        ▼
Signed measurement card (SHA-256 + Ed25519)  ──►  Council OS surfaces
        │                                         (/competitors, /east-west, Lobby cards)
        │  same evidence
        ▼
DSH /dashboard  ──►  signed-in teams see the identical Layer 0 destinations
        │
        ▼
Optional chain pointer (Memo / EAS / provisional Credential)
        = URI + hash of the card — not a Moody’s-style “rating”
```

**DSH rule (OWNERSHIP #80 / agent-runbook):** DSH = same evidence as OS.  
An RWA attestation that lands in OS must be reachable from DSH without a parallel scoreboard.

**EAT rules (from `competitorDatabase` — apply unchanged to RWA):**

1. Public artifact first — cite URL, explorer, or API response  
2. Unsigned → signed play — show the re-measurement path  
3. Estate tool — name the CSOAI instrument that closes the gap  
4. Licence-sweep before reuse  
5. UNMEASURED is honest — never invent a score  
6. Measurement-not-accusation — cite facts; corrections register is symmetric  
7. Scores never sold  

## Compass research → EAT grammar

Permissionless rails (viable, largely unoccupied):

| Rail | Permission | Honest framing |
|------|------------|----------------|
| XRPL Memo (~1 KB on *our* tx) | None | Self-signed hash pointer tagging issuer r-address + currency |
| XRPL XLS-70 Credential | Issuer alone creates; subject acceptance optional | **Provisional until accepted** = honest “unsolicited opinion” |
| EAS `attest()` (EVM) | Recipient passive | Own schema; recipient = token contract; off-chain free, on-chain indexed |

**Not competitors to copy:** Moody’s Token Integration, S&P on-chain, Chainlink ACE, Credora — all **issuer-cooperation**. Our wedge is unsolicited, signed, public-artifact measurement.

### Corpus size (opportunity map — not MEASURED AUM)

| Universe | Scale (cite source) | Implication for EAT |
|----------|---------------------|---------------------|
| XRPL tokenized RWA | ~42 assets (Blockworks, State of XRP Q2 2026); headline ~$4.46B; **distributed** ~$386.1M | Enumerate named instruments with r-addresses; **weight indexes to distributed**, not issuer-held lines (e.g. JMWH) |
| EVM / multi-chain | Hundreds of contracts: Ondo Stocks 438+, Securitize 130+, Backed 60+; flagship funds (BUIDL, BENJI, …) | Seed flagships now; catalog clusters Stage 3+ (full Ondo ticker→hash list is not one public registry) |
| Independent verification gap | IOSCO FR/17/2025; OECD Policy Paper 75; “self-attestation” PoR problem; EU AI Act GPAI CoP (independent evaluators) | Structural opening for **unsolicited** signed measurement — not issuer-cooperation products |

Total-RWA headlines conflict (RWA.xyz vs CoinGecko) — **cite the source** when quoting either. No invented revenue.

### Target tiers (EAT rows — not yet MEASURED)

Composite priority (prestige × discoverability × feasibility × strategic tie):

1. Aviva Investors USD Liquidity Fund (XRPL) — CBI/UCITS; Licuido/Ripple stack  
2. BlackRock BUIDL (Ethereum `0x7712…2aec`) — max prestige EAS recipient  
3. Ondo OUSG (XRPL `rHuiXX…` + Ethereum) — dual-chain Stage-2 ref  
4. Franklin Templeton BENJI (Ethereum `0x3DDc…dc9`)  
5. Guggenheim/Zeconomy DCP (XRPL) — Moody’s P-1 → independent second opinion  
6. Apollo ACRED (Ethereum `0x1741…27B`)  
7. Archax × abrdn MMF (XRPL `rKCu4…`)  
8. Justoken JMWH (XRPL) — **demonstrative EAT**: represented ≫ distributed  
9. SocGen-FORGE EURCV · Schuman EURØP · OpenEden TBL · Braza USDB/BBRL · RLUSD  
10. Ctrl Alt / Dubai Land Department · GateHub XAU · Kyobo pilot · SBI START (adjacent)  

EVM catalog clusters (breadth later): Ondo Stocks, Securitize DS, Backed bTokens/xStocks, private-credit pools.  

Machine seed: `client/src/data/rwaAttestationTargets.ts` (unsigned stubs; re-verify explorers before any attach).  
Compass: `wf-98f085ad-…` (ranking) + `wf-67a7e7b4-…` (target-list corpus + GTM synthesis).

### Unsigned → signed play (per target)

```
public_artifact:  XRPScan / Etherscan / RWA.xyz page for issuer or contract
estate_tool:      arena-probe + card-issuance (+ ClaimGuard-row on public claims)
unsigned_to_signed_play:
  1. Freeze public facts (holders, volume, wrapper, rating claims) with dated hashes
  2. Issue csoai.measurement-card / cross-border-card as appropriate
  3. Attach chain pointer: XRPL Memo (v1) or EAS off-chain (EVM); Credentials later
  4. Surface card on OS + DSH; never sell the grade
```

## Legal / product posture (Claude-aligned)

### Messaging lock (attestation vs tokenization) — non-negotiable

From compass `wf-b01660de…` (load-bearing: EAS docs, xrpl.org Credentials, SEC staff Jan 2026 tokenized-securities statement, Peirce Jul 2025):

- **Never** describe an attestation as “tokenizing” an asset or conferring ownership/claim rights.  
- Attestations are **opinions/measurements** that ride *alongside* an asset or already-tokenized instrument.  
- XRPL Credentials: creatable without permission; **no effect until CredentialAccept**; about an *account meeting a criterion* — not title.  
- EAS: “attestations differ from tokens or NFTs”; digital signatures on structured data.  
- Securities law: on-chain format does not change the legal nature of a security; only the issuer/owner (via SPV/trust/fund + regulated stack) can mint ownership instruments.  
- Marketing that implies otherwise → unregistered-securities and false-statement / trade-libel exposure.

### Framing

- Position as **compliance / behaviour measurement attestations**, **not** “credit ratings” (EU CRA / SEC NRSRO risk).  
- Do **not** imply issuer endorsement or participation.  
- No investment advice / solicitation language.  
- Regulated securities (BUIDL, BENJI, OUSG, Aviva, …): commentary-style measurement; counsel before scale.  
- Lower sensitivity: public stablecoins, commodity pilots — still factual and sourced.  
- JMWH: strongest *demo* of why independent measurement matters; frame as measurement of public on-chain facts, not disparagement.

### Strategic options (not Stage-1 productization)

| Option | What it is | Near-term |
|--------|------------|-----------|
| **A — White-label attestation licensing** | License engine + AG-UI cards (“Powered by Council OS / GSPC”); enterprise + per-attestation + seats; GSPC still signs or countersigns | **Preferred path** — stays in opinion/measurement lane |
| **B — Tokenization-as-a-service via partner** | Attestation + UX on top of Tokeny / Securitize / Archax / Fireblocks / Ownera; **they** are issuer/TA of record | Only after ≥2–3 design partners + inbound demand; Stripe-model layer |
| **C — Become regulated issuer** | Broker-dealer + transfer agent (+ ATS) / EU MiFID / UK DSS | **Out of scope** near-term; conditional only if partner economics demonstrably bottleneck |

Pricing precedents (order-of-magnitude, third-party estimates — **not** our quotes or MEASURED revenue): Chainalysis ~$25K–$300K/yr enterprise; ~$10K/seat; self-serve API low end ~$49–$249/mo. Scores never sold — meter the **signed verdict / API / seats**, never a grade.

## Stage gates (do not jump)

| Stage | Scope | Exit |
|-------|--------|------|
| **1 (now)** | EAT on `/competitors` (52); RWA stubs + doctrine; DSH parity; OS spine; **no mainnet RWA attach** | Cards + doctrine live |
| **2** | Testnet: XRPL Devnet Memo + EAS Sepolia/Base off-chain schema; three refs: **OUSG, BUIDL, JMWH** | Independent verify of testnet pointers |
| **3** | Mainnet top 10; Memo-first XRPL; EAS off-chain scale, on-chain for marquee | Dispute = earned media + methodology defense |
| **Later** | Catalog breadth (Ondo Stocks / Securitize / Backed); bond-tokenization + insurer + audit *pilots* only after citation | CRA/counsel check; scores never sold |

**GTM (compass synthesis — doctrine-compatible):**

1. **Free reference layer** — unsolicited attestations as “DeFiLlama for compliance”; Lobby lookup by r-address / contract.  
2. **Paid index/API** — only after third parties *cite* the corpus; monetize the feed, **never the grade**.  
3. **Bridge** — bond-tokenization verification gap (IOSCO/OECD/ECB framing); insurer underwriting input; Big Four continuous-assurance *input* (not a Big Four product).  
4. **COBOL engagements** — trust on-ramp via data-lineage artefacts (SOX/Basel/DORA/Solvency II); **out of Stage 1 productization**.

**Out of Stage 1 (unchanged):** CobolBridge SKU, XRPL bond *issuance*, becoming a regulated issuer/TA, invented AUM/revenue as MEASURED, mainnet RWA attach, insurer/Big Four paid pilots before reference-layer proof, any marketing that equates attestation with tokenization or ownership.

## DSH parity checklist for RWA cards

When a card ships:

- [ ] Openable from Council OS Lobby (tool card / East-West / Competitors-adjacent surface)  
- [ ] Same card reachable from `/dashboard` (DSH sidebar or measurement hub)  
- [ ] Verify path loginless (`/gspc-verify` or pack verify)  
- [ ] Chain pointer (if any) is optional; card stands offline  
- [ ] Grammar pill: MEASURED / UNMEASURED / provisional — never “rated”  

## Thresholds that change the plan

- EU CRA / NRSRO scrutiny → harden “measurement attestation” language; counsel before EU scale  
- XRPL issuer filters on third-party Credentials → stay on **Memos**  
- Incumbent launches unsolicited on-chain attestation → accelerate first-mover breadth  

## Caveats (from corpus — keep in product copy)

- Represented vs distributed XRPL value — do not index on issuer-held headline lines.  
- Re-verify every r-address / contract on XRPScan / Etherscan before attach; aggregator FX is approximate.  
- No verbatim bank mandate for independent verification located — case rests on IOSCO/OECD/ECB + vendor sources (bias possible).  
- Unsolicited attestation on regulated securities → counsel before risk-negative publish (CRA/NRSRO/market-abuse).  
- Opportunity-mapping ≠ execution or investment advice.

## Sources

- Compass: permissionless XRPL Credential/Memo + EAS ranking (`wf-98f085ad-…`); Signed Attestations target-list corpus (`wf-67a7e7b4-…`); Attestation vs Tokenization options (`wf-b01660de-…`, Aug 2026)  
- Primary posture anchors: EAS docs (attestations ≠ tokens/NFTs); xrpl.org Credentials (no effect until accept); SEC staff Statement on Tokenized Securities (28 Jan 2026 — staff views, not law); Peirce Jul 2025 tokenization statement  
- Repo: `competitorDatabase` EAT rules; `client/src/data/rwaAttestationTargets.ts`; `docs/agent-runbook.md` DSH; `docs/COUNCIL_OS_PRODUCT.md`  
- Doctrine: measurement ≠ certification; scores never sold; regulators free forever; attestation ≠ tokenization ≠ ownership  
