# EAT · DSH · permissionless RWA attestation — alignment

> Aligns the Aug 2026 compass RWA/XRPL/EAS research with Council doctrine
> (Claude / product spine). Measurement, not certification. Scores never sold.
> CSOAI Ltd · UK **16939677**.

## One sentence each

| Term | Meaning here |
|------|----------------|
| **EAT** | **E**vidence **A**ttach **T**ransform — public artifact → unsigned→signed re-measurement play. On `/competitors` today; same grammar for RWA issuers tomorrow. |
| **DSH** | **D**ashboard **S**oftware **H**ub — signed-in `/dashboard`. Same Layer 0 / evidence destinations as Council OS. Not a second truth. |
| **Permissionless attestation** | Publish a signed measurement *about* a public issuer/contract with **no issuer consent** (XRPL Memo / provisional Credential; EAS `recipient` = contract). Unsolicited opinion, on-chain pointer. |

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

### Target tiers (EAT rows — not yet MEASURED)

Composite priority (prestige × discoverability × feasibility × strategic tie):

1. Aviva Investors USD Liquidity Fund (XRPL) — CBI/UCITS first; Licuido/Ripple stack  
2. BlackRock BUIDL (Ethereum `0x7712…2aec`) — max prestige EAS recipient  
3. Ondo OUSG (XRPL `rHuiXX…` + Ethereum) — dual-chain; JPMorgan settlement adjacency  
4. Franklin Templeton BENJI (Ethereum `0x3DDc…dc9`)  
5. Guggenheim/Zeconomy DCP (XRPL) — Moody’s P-1 already attached → independent second opinion  
6. Apollo ACRED (Ethereum `0x1741…27B`)  
7. Archax × abrdn MMF (XRPL)  
8. Justoken JMWH (XRPL) — **demonstrative EAT**: represented ≫ distributed (holders/volume on-chain)  
9. SocGen-FORGE EURCV  
10. Ctrl Alt / Dubai Land Department titles  

Full ranked lists + addresses: compass artifact `wf-98f085ad-…` (Aug 2026).  
Machine seed: `client/src/data/rwaAttestationTargets.ts` (unsigned stubs; re-verify explorers before any attach).

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

- Position as **compliance / behaviour measurement attestations**, **not** “credit ratings” (EU CRA / SEC NRSRO risk).  
- Do **not** imply issuer endorsement or participation.  
- No investment advice / solicitation language.  
- Regulated securities (BUIDL, BENJI, OUSG, Aviva, …): commentary-style measurement; counsel before scale.  
- Lower sensitivity: public stablecoins, commodity pilots — still factual and sourced.  
- JMWH: strongest *demo* of why independent measurement matters; frame as measurement of public on-chain facts, not disparagement.

## Stage gates (do not jump)

| Stage | Scope | Exit |
|-------|--------|------|
| **1 (now)** | EAT on `/competitors` (52); DSH parity; OS product spine; **no mainnet RWA attach** | Cards + doctrine live |
| **2** | Testnet: XRPL Devnet Memo + EAS Sepolia/Base off-chain schema; three refs: **OUSG, BUIDL, JMWH** | Independent verify of testnet pointers |
| **3** | Mainnet top 10; Memo-first XRPL; EAS off-chain scale, on-chain for marquee | Dispute = earned media + methodology defense |
| **Later** | ~100 EVM contracts via Securitize/Ondo Stocks/Backed catalogs | Only after CRA/counsel check |

**Out of Stage 1 (unchanged):** CobolBridge productization, XRPL bond *issuance*, invented AUM as MEASURED.

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

## Sources

- Compass: permissionless XRPL Credential/Memo + EAS RWA target ranking (Aug 2026)  
- Repo: `competitorDatabase` EAT rules; `docs/agent-runbook.md` DSH; `docs/PRODUCTION_CHECKLIST.md` OS↔DSH; `docs/COUNCIL_OS_PRODUCT.md`  
- Doctrine: measurement ≠ certification; scores never sold; regulators free forever  
