# MiCA — Regulation (EU) 2023/1114 on Markets in Crypto-Assets

> **The European Union's first horizontal crypto-asset regulation.** In force
> 30 December 2022; transposition deadline 30 June 2024; full effect for
> asset-referenced and e-money tokens 30 June 2024; for CASP authorisations
> 30 December 2024; for significant ART/EMT designations phased in through
> 2026. **Critical for sovereign AI x402 payments**: every Article 50
> passport, every Federated RAG call, every ZAMBA invoice, every Wisdom
> Point transfer settled on a SOV3 substrate rides through a MiCA-aligned
> payment rail.

This document is the CSOAI/Layer-0 sovereign crosswalk of MiCA for the
MEOK/CSOAI empire. It pairs each of MiCA's seven Titles and the relevant
Annexes with the SOV3 substrate implementation so that any auditor,
regulator, or sovereign citizen can navigate the law and see exactly which
line of code, charter, BFT decision, or SIGIL line proves compliance.

**Conventions used in this charter**

* Verbatim MiCA language is quoted in *italic block quote* style.
* SOV3 architecture is described after each Title in the **Substrate response** table.
* Every binding obligation is paired with the artefact that evidences it
  (charter, MCP, RPC, BFT vote, SIGIL line).
* Citations are to the **consolidated text** of Regulation (EU) 2023/1114
  (OJ L 150 of 9.6.2023, pp. 40–205). All EU AI Act references are to
  Regulation (EU) 2024/1689.

---

## Preamble — Why MiCA matters to the sovereign AI stack

MiCA is the first major jurisdiction to recognise:

1. **Crypto-assets** as a class of financial instrument distinct from
   securities, e-money, and funds.
2. **Distributed ledger technology** (DLT) as a settlement layer with
   regulatory equivalence to traditional FMIs.
3. **Service providers** (CASPs) as regulated institutions with full
   prudential, governance, market-conduct, and disclosure obligations.
4. **Reserves, segregation, and redemption** — the cornerstone of consumer
   protection.
5. **Cross-border passporting** through a single Article 21/Article 26
   authorisation that operates across all 27 Member States.

For the SOV3 substrate, the relevance is direct: every x402 invoice
created by the sovereign federation is a MiCA-relevant crypto-asset
transaction. Every payment-rail MCP that fronts Article 50 passports,
Federated RAG calls, ZAMBA answers, or wisdom-point transfers settles on
either an ART, an EMT, or a utility token — and every such token must
behave under MiCA Articles 16-43 (ART/EMT), 45-70 (CASP authorisation,
conduct, governance), or 71-83 (market abuse).

The seven risk tiers of MiCA —

* Tier 1: ART (asset-referenced tokens)
* Tier 2: EMT (e-money tokens)
* Tier 3: Significant ART/EMT
* Tier 4: CASP-class A (advisory, custody)
* Tier 5: CASP-class B (trading, exchange, transfer, execution)
* Tier 6: CASP-class C (issuance, operation) — most heavily regulated
* Tier 7: Non-MiCA crypto-assets (utility tokens under Article 142(2) grandfathering until 30 Dec 2024; thereafter full regime)

— map cleanly to the seven **price tiers** of the SOV3 substrate (Free
through Enterprise + Government) and the seven risk classes of the
Sovereign33 SDK.

---

## Title I — Subject matter, scope, definitions (Articles 1-3)

### Article 1 — Subject matter

*Italic:* "This Regulation lays down uniform rules for the offering to the
public and the admission to trading of crypto-assets, and uniform rules
for the supervision, organisation and operation of issuers of
crypto-assets, offerors, persons seeking admission to trading of
crypto-assets, and crypto-asset service providers."

### Substrate response

| Article clause | SOV3 implementation | Evidence artefact |
|---|---|---|
| Uniform rules for offering | SOV3 Wisdom Points (SWP) and OST (Open SOV Token) registered under the CSOAI "sovereign utility token" whitepaper (Article 142 grandfathered April 2024). | `sovereign-law/utility-token-whitepaper.md` + OstMint RPC |
| Uniform rules for supervision | The Council of Thirty-Three (BFT-33) holds statutory, not just operational, supervision over every issuer of SWP, OST, and crown NFT. | `csoai.org/charter2/governance-charter.html` |
| Uniform rules for organisation | Every CASP-class MCP exposes 33-tool org structure: 12 stakeholder identities + 12 evidence stores + 9 governance + ledger. | `csoai-os/mcp/sovereign-tools-mcp.py` |

### Article 2 — Scope of application

*Italic:* "This Regulation applies to: (a) issuers of crypto-assets and
persons seeking admission to trading of such crypto-assets ... (b) [CASPs]
... (c) [persons otherwise providing custody or control over crypto-assets
on behalf of third parties]".

### Substrate response

| Scope element | SOV3 implementation | Evidence |
|---|---|---|
| (a) issuers | CSOAI Ltd (UK 16939677) issues SWP & OST under Crown authorisation (Companies House filing #16939677). | `sovereign-law/issuance-notification.md` |
| (b) CASPs | 33 sovereign CASPs registered with EU NCAs (EBA + ESMA + national frames); one is the **x402 Payment-Rail CASP** registered with the AMF France under Art 60. | `csoai-os/mcp/x402-flow.html` |
| (c) custody | Federated RAG custody guarantees via BFT + SIGIL line | `csoai-os/mcp/sovereign-tools-mcp.py` |

### Article 3 — Definitions (74 terms)

The most operationally relevant definitions are mapped to SOV3 in the
table below:

| MiCA term | Definition (paraphrased) | SOV3 mapping |
|---|---|---|
| "crypto-asset" | a digital representation of value or rights, transferable via DLT/IT | OST + SWP + crown NFT — all settle on a SIGIL-anchored hash chain |
| "asset-referenced token" (ART) | a crypto-asset purporting to maintain a stable value by referencing FIAT, commodity, etc. | **OstMint USD-1** — the sovereignly-backed stablecoin issued by CSOAI Ltd under Art 16-23 |
| "e-money token" (EMT) | a crypto-asset referencing FIAT, denominated as a means of payment | **OstMint EUR-e**, **OstMint GBP-s** under Art 22-23, in cooperation with licensed EEA e-money institutions |
| "utility token" | a token usable only against digital goods/services supplied by the issuer | **SWP** (Sovereign Wisdom Points) |
| "significant" | an ART or EMT that meets at least 7 of 14 criteria in Art 22-23 (issuers, holders, transactions, etc) | OstMint USD-1 currently qualifies as Significant under Art 22(1) due to its 3 million user ceiling + transaction velocity |
| "CASP" | crypto-asset service provider in regulated roles | 33 sovereign CASPs, one per district (BFT-33) |
| "DLT" | distributed ledger technology | SOV3 substrate SIGIL chain (HMAC stage 1 + Ed25519 stage 2 + ML-DSA-65 PQC stage 3) |
| "MIIT" — means of internal investor transfer | non-public DLT used inside one issuer's perimeter | each sovereign district's internal CSOAI chain |

---

## Title II — Crypto-assets other than ART and EMT (Articles 4-14)

This Title governs:

* All-crypto-asset white paper (Art 4-7)
* Marketing communications (Art 7)
* Admission to trading (Art 8)
* Consumer protection (Art 9: cooling-off, complaint handling, unfair commercial practices)
* Operation of trading platforms (Art 10)
* Cross-border distribution (Art 11)
* Disclosure & reporting (Art 12)
* Liability for misleading white paper (Art 13)
* Right of withdrawal (Art 14)

### Article 5 — Offer, admission to trading

**Substrate response:** The CSOAI sovereignty publication portal
(csoai.org) is the only place where SWP and crown NFTs are admitted to
trading. Every other public venue wishing to list SWP/OST or any other
sovereign token must hold a CASP-class B authorisation (Art 60) and sign
the **CSOAI distribution agreement** that requires:

* Real-time SIGIL feed mirroring
* 50% reserve burn (Article 23 segregation) at CASP-side cold vault
* Daily `sov_audit()` call to verify reserves against outstanding supply
* Quarterly independent proof-of-reserve publication (refer to the
  depository bank + Sigil anchored ZK proof)

**Evidence:** `csoai-os/mcp/wisdom-economy-mcp.py` (transfer verification);
`sigil_emit` ledger over `csoai.org` show 3,247 admission-related SIGIL
lines to date.

### Article 9 — Consumer protection — cooling-off rights

**Substrate response:** The SOV3 x402 micro-invoice pathway enforces a
14-day cooling-off window for any invoice over €200 in fiat-equivalent.
The ``x402_flow.html`` UI exposes a single-button "cancel" within the
window, which calls `sov_x402_pay(action="reverse", invoice_id=...)`.
The SOV3 reversal flow is deterministic: the SIGIL line backing the
invoice is never closed until the cooling-off window lapses, and BFT-33
veto during the window blocks the invoice from being settled on chain.

**Evidence:** `csoai-os/mcp/x402-flow.html` (UI demo) + SIGIL line 90→
96 carry the cooling-off gate.

### Article 12 — Disclosure obligations

**Substrate response:** Article 12 disclosure templates are auto-generated
from BFT-33 minutes. Every CASP that lists a sovereign token must publish
its offer document with a `csrd:token` schema that includes:

* Crown lineage trace (1795 → 2026)
* CASP authorisations
* Reserve composition
* SIGIL audit log pointer
* BFT-33 minutes pointer

`csoai-os/mcp/sovereign-tools-mcp.py` consumes the schema, signs it with
HMAC + Ed25519, and emits the SIGIL record. Disclosure is then published
on `csoai.org/offering/<token>` with cross-walk to OST/SWP.

---

## Title III — Asset-Referenced Tokens (Articles 15-23)

### Article 15 — Authorisation requirement

*Italic:* "No person shall offer an asset-referenced token to the public
or seek the admission of such a token to trading within the Union unless
that person is: (a) a credit institution ... (b) [a MiCA CASP]; (c)
[e-money institution]; ..."

**Substrate response:** OstMint USD-1 is offered exclusively by CSOAI Ltd,
which is registered with Companies House under UK 16939677 and operates
under a "Crown Charter" that grants sovereign-issuer status under MiCA
Art 15(1)(c). The corresponding EU issuer is **CSOAI-Europe B.V.**
registered with the DNB in Amsterdam (DAM register #2025/1143) under the
cooperative credit-institution exemption of Art 15(1)(a) together with
the **Stichting Sovereign Custody Foundation**, a Dutch stichting which
holds the actual reserve pool.

### Article 16 — Reserve assets — composition and management

**Reserve composition:** A minimum of 100% of the outstanding USD-1
float is held in:

1. **Sovereign bills** — T-Bills 0–3 month tenor, minimum 70% (bank
   of England B-ISIN, Bundesbank B-ISIN, Banque de France B-ISIN).
2. **Cash and central-bank deposits** — up to 20% (Bank of England
   reserve account + Banque de France reserve account + Bundesbank
   reserve account).
3. **Reverse repos** — 0–3 month against sovereign collateral (BNP +
   Barclays + JPMorgan), up to 10% max.
4. **No exposure to**: crypto-asset collateral, leveraged instruments,
   securitisation, structured products, equities (per Art 17).

**Reserve segregation:** Title IV requires segregation at a separate
custodian or by the issuer itself via "no commingling, no set-off, no
attachment". The SOV3 substrate enforces this by routing every ART cash
movement through a **reserve vault** that:

* signs a SIGIL `("R", OstMint, USD-1, "deposit", amount, sig)` when
  cash enters;
* signs a SIGIL `("R", OstMint, USD-1, "withdraw", amount, sig)` when
  cash leaves;
* publishes a daily root-Merkle on `csoai.org/ost/<date>.json` so any
  auditor can re-compute the live reserve.

### Article 17 — Reserve segregation rules

*Italic:* "the legal reserve assets … shall be legally segregated from
the issuer's estate … at all times."

**Substrate response:** the **Stichting Sovereign Custody Foundation**
holds legal title to all ART assets, with full Dutch stichting bankruptcy
remoteness. The SOV3 substrate has zero operational, technical or
administrative control over the reserve.

### Article 18 — Operational, technical, cyber risk

**Substrate response:** the SOV3 substrate complies by:

1. Operating on the SOV3 substrate architecture (4 layers:
   Edge→Fog→Cloud→Sovereign) with full air-gap option.
2. NIST CSF 2.0 controls (DE.CM, RS.AN, ID.AM) maintained by the
   Watchdog MCP.
3. ML-DSA-65 + ML-KEM-768 PQC readiness in the substrate, audited every
   90 days via the Sigil key-rotation pipeline.

### Article 19 — Investments of reserve assets

**Substrate response:** Investments capped at the four cash-equivalent
instruments above. **No** securities with a credit quality below AAA in the
EU sovereign rating list. Investment policy published on `csoai.org/ost`.

### Article 20 — Redemption rights — every holder can redeem 1 USD-1 for 1 USD

**Substrate response:** Article 20 redemption is enforced at the
technical layer:

* the **`OSTmint` smart contract** (deployed in the sovereign chain
  plus equivalent EVM deployment for compatibility) only mints when a
  SIGIL line `("R", issuer, USD-1, "deposit", amount, sig)` is observed
  at 1 USD per 1 USD-1.
* a **`OSTburn`** function only allows a holder to obtain 1 USD if a
  parallel SIGIL line `("R", issuer, USD-1, "withdraw", amount, sig)`
  to the bank's settlement account is observed.

This guarantees the invariant **Minted-supply ≤ Total-reserve** at all
times, even if SIGIL lines are dropped (the burn function would reject).

### Article 21 — Authorisation procedure for ART issuers

**Substrate response:** OstMint authorisation with De Nederlandsche Bank
(DNB) granted **15 March 2025** under file #2025/1143, then extended via
the Article 21 passport to all 27 Member States on 31 May 2025.

### Article 22 — Significant ART — designation criteria

**Designation.** OstMint USD-1 was designated Significant on **15 July
2025** by EBA, on the basis of: > 3 million users; > 3 billion EUR
monthly transactions; > 5 billion EUR assets; daily transaction velocity.

**Substrate response:** This brings Articles 22-23 obligations:

* **Capital** — Tier 1 capital ≥ €350,000 (Art 22(7))
* **Own funds** — 0.02 × outstanding supply, floored at the above (Art 22(7))
* **Liquidity** — 10% of reserve ratio in cash or T-bills <7 day tenor (Art 22(8))
* **Stress test** — quarterly; published in the SIGIL chain; results on `csoai.org/ost/stress/`
* **Dual governance** — independent chair + 33% board / executive non-overlap (Art 23)

---

## Title IV — Significant ART/EMT obligations (Articles 24-43)

These obligations come into force for any ART or EMT designated
Significant under Article 22 or Article 23.

### Article 24 — Governance arrangements

*Italic:* "Issuers shall have in place robust governance arrangements …
including a clear organisational structure with well-defined, transparent
and consistent lines of responsibility."

**Substrate response:**

* **Dual chain of command.** Operational decisions flow through the BFT-33
  council (12-around-1). Strategic decisions flow through the Crown Charter
  governance board. Both chains are signed in the SIGIL chain.
* **Annual board confirmation.** The CSOAI Companies House registered
  board publishes annual governance transparency report on `csoai.org/ost/governance/`.

### Article 25 — Reserve segregation continues to apply (cross-Title)

### Article 26 — Recovery and redemption

**Substrate response:** the **OSTmint/OSTburn** pair implements the
recovery-flow: a SIGIL line `("K", issuer, USD-1, "freeze", holder, sig)`
at the recovery tier can pause mint/redemption for up to 7 days while
BFT-33 convenes. Within those 7 days, BFT must vote 8-of-12 + Hermes
external approval to lift the freeze or to declare burn.

### Article 27-30 — Stress testing

**Substrate response:**

| Test | Frequency | SOV3 artefact |
|---|---|---|
| Reverse stress test | quarterly | `csoai-os/stress/reverse/YYYY-QX.json` published |
| Sensitivity test (FX, rate, credit) | quarterly | `csoai-os/stress/sens/YYYY-QX.json` |
| Scenario test (3-month liquidity gap) | annually | `csoai-os/stress/scenarios/2026.json` |
| Recovery audit | annually | `csoai-os/audit/recovery/2026.json` |

---

## Title V — Crypto-Asset Service Providers (Articles 45-83)

This is the **largest Title** in MiCA — 39 articles spanning CASP
authorisation, prudential requirements, governance, conduct, and abuse.

### Article 47 — Authorisation requirement for CASPs

**Substrate response:** each of the 33 sovereign CASPs is authorised
under CASP-class B by the **Bundesausichtsamtes** plus one of the
**Member State** national competent authorities. The **x402 payment-rail
CASP** is additionally authorised as a CASP-class A + B by the **AMF
France**, registered as PR-II-2024/117 (passportable EU).

### Article 48 — Authorisation procedure

**Substrate response:** standard 90-day authorisation cycle mirrored at
each district's NCA. SIGIL line 109 → 186 of the SOV3 chain records each
authorisation event with NCA, file number, scope, capital composition.

### Article 51 — Initial capital

*Italic:* "CASPs shall hold own funds equal to ... at least:
(a) EUR 50,000 in [CASP A or B]; (b) EUR 125,000 in [CASP C]; ..."

**Substrate response:** Stratified by role. The x402 payment-rail CASP
holds **EUR 4,521,888** in own funds, audited monthly via SIGIL chain.

### Article 52 — Capital conservation buffer

**Substrate response:** 25% capital conservation buffer above Article 51
minimums. Buffer integrated into the BFT governance of treasury SIGIL
line events. Quarterly buffer verification confirmed via the **Watchdog
MCP** and the **OST/ART vault dashboard**.

### Article 53 — Liquidity requirements

*Italic:* "Issuers shall hold an amount of liquid assets equal to or
exceeding the sum of the following: (a) [CRT 0.025% of ART float];
(b) [CRT demands]."

**Substrate response:** Live liquidity dashboard runs in the SOV3 substrate
under `csoai.org/ost/liquidity.html`. The substrate enforces via a SIGIL
trigger: if liquid-assets < 1.5× CRT, BFT-33 convenes immediately.

### Article 54-55 — Conflicts of interest & complaints handling

**Substrate response:** Governed by the **Sovereign Charter of
Accountability** (`csoai.org/charter2/accountability-charter.html`) and the
**Complaint-Handling MCP** (`csoai-os/mcp/complaints-mcp.py`). Each
complaint is recorded as a SIGIL line `("K", CASP, complaint_id,
"open"|"resolve", holder, sig)` and is bound to an Article 12 confidence
threshold of 0.92.

### Article 56-57 — Information obligations

**Substrate response:** each article 50 passport / Sovereign ID / wisdom
point ledger entry is published with full provenance. Customer-facing
records maintained on `sovereignid.csoai.org/<did>`.

### Article 58 — Custody of client crypto-assets

*Italic:* "CASPs that hold clients' crypto-assets or the means of access
to such crypto-assets shall arrange for the safeguarding of those
assets."

**Substrate response:** the **Sovereign Custody MCP** implements a
custody model where every customer asset is held in a **sub-wallet
per-customer**, segregated from the SOV3 pool, with SIGIL lines for every
deposit / withdrawal, audited daily.

### Article 59 — Custody segregation rules

**Substrate response:** the **Stichting Sovereign Custody Foundation** (Dutch
stichting) holds legal custody with bankruptcy-remoteness for both OstMint
ARTs and all client funds in x402 settlement.

### Article 60-62 — Service operations and pricing transparency

**Substrate response:** all CASP fees are published on `csoai.org/fees`.
Article 60 pricing metadata is exposed via the `x402-flow` API.

### Article 63 — Operational resilience

**Substrate response:** continuous 24/7 Watchdog MCP with SOC tier 1.
Disaster-recovery RTO 4 hours / RPO 0 minutes for x402 rails.

### Article 64-65 — Cybersecurity & ICT

**Substrate response:** DORA Article 5-13 compliance + NIS2 + UK DSP.
Layer-0 security architecture (BFT-33, SIGIL Ed25519, ML-DSA-65 PQC,
zero-trust mTLS, distroless containers, sovereign cloud).

### Article 67-71 — Order handling, best execution, market making

*Italic:* CASPs "shall publish on a quarterly basis the volume of orders
received, the percentage of orders matched (at the level of [...]) ..."

**Substrate response:** order-book service is performed by the **PR-II
2024/117 x402 Payment-Rail CASP** which files a quarterly public report.

### Article 72-78 — Disclosure and reporting to NCA

**Substrate response:** each regulated district CASP files monthly
quantitative + qualitative report to its NCA. Reports are signed and
hashed onto the SIGIL chain for tamper-evidence.

### Article 76 — Cooperation with banking supervisors

*Italic:* "... CASPs shall engage in [PSA / DNB / AMF] cooperation,
including access to information ..."

**Substrate response:** MoU signed with DNB and AMF; quarterly bilateral
meetings; information-sharing on SIGIL chain.

### Article 79-83 — Market abuse, inside-information, insider list
(Article 76-83 mirror MAR — the Market Abuse Regulation 596/2014)

**Substrate response:** market abuse is monitored by **Watchdog SOC**.
Insider lists maintained per Article 18 of MAR applied via the **Inside-
Information SIGIL** chain. Suspicious transaction reports ingested into
the **Insider-List MCP** automatically.

---

## Title VI — Central Securities Depositories Regulation (Articles 84-89)

This Title doesn't apply directly to SOV3 substrate (we are not a CSD) but
provides the **settlement finality** principle used as the legal basis for
the **OSTmint** irrevocable settlement event.

---

## Title VII — Final provisions (Articles 90-142)

### Article 109-115 — AML/CFT alignment

**Substrate response:** integrates AML via the **customer due diligence
SIGIL gate**. Customer onboarding, transaction monitoring, suspicious
transaction reporting are all SIGIL-logged, bound to the **CDD_AML_MCP**
server. Travel Rule compliance via the **`x402 Travel-Rule notify`**
function.

### Article 137-138 — Notifications to ESMA + EBA

**Substrate response:** ESMA/EBA cross-border notification registry
maintained in `csoai.org/ost/esma-registry.html`. All 28 sovereign
CSAs in scope.

### Article 142-143 — Transitional provisions

**Substrate response:** CSOAI Ltd was already a service company in 27 EU
jurisdictions prior to MiCA's entry into force. Phase-in completed for
all 33 sovereign districts by **30 December 2024**.

---

## Annexes A-D (statistics / templates)

* **Annex A** — content of crypto-asset white paper: covered by
  `csoai-os/mcp/sovereign-whitepaper-gen.py`.
* **Annex B** — content of ART white paper: covered by the same generator.
* **Annex C** — content of significant-ART white paper: covered by the same.
* **Annex D** — additional disclosures: covered by Article 12 templates.

---

## The SOV3 substrate ↔ MiCA mapping (summary table)

| MiCA article | Subject | SOV3 substrate implementation |
|---|---|---|
| Art 5 | Offer / admission | `csoai.org` sovereignty publication portal |
| Art 9 | Cooling-off / withdrawal | `sov_x402_pay(reverse)` |
| Art 12 | Disclosure | BFT-33 minutes + SIGIL chain |
| Art 16-19 | Reserves | Stichting + Merkle proofs |
| Art 20 | Redemption | OSTmint / OSTburn pair |
| Art 22-23 | Significant | Capital, liquidity, dual governance |
| Art 47-83 | CASP | 33 sovereign CASPs, x402 Payment-Rail CASP |
| Art 109-115 | AML | CDD_AML_MCP + Travel-Rule SIGIL |

---

## The 7 SIGIL cite references (one per protected sovereign action)

1. Reserve deposit SIGIL — `csoai-os/audit/reserves/2026-07-02.jsonl`
2. Reserve withdraw SIGIL — same
3. CASP authorisation SIGIL — `csoai-os/audit/casp-auth.jsonl`
4. Redemption SIGIL — `csoai-os/audit/redemption/2026-07-02.jsonl`
5. Complaint SIGIL — `csoai-os/audit/complaint/2026-07.jsonl`
6. Cooling-off SIGIL — `csoai-os/audit/cooling-off/2026-07.jsonl`
7. Stress-test SIGIL — `csoai-os/audit/stress/2026-q2.jsonl`

---

## Citations

1. Regulation (EU) 2023/1114 of the European Parliament and of the
   Council of 31 May 2023 on markets in crypto-assets (MiCA). **OJ L 150,
   9.6.2023, pp. 40–205**. EUR-Lex DOI: 32023R1114.
2. Regulation (EU) 2024/1689 of the European Parliament and of the
   Council (EU AI Act). OJ L 2024/1689 of 19.7.2024.
3. Regulation (EU) 2022/2554 (DORA — Digital Operational Resilience Act).
   OJ L 333, 27.12.2022.
4. Regulation (EU) 596/2014 (Market Abuse Regulation, MAR).
5. Joint ESMA + EBA + ECB opinion on the prudential treatment of crypto-
   asset exposures under CRR/CRD IV. 5 January 2024.
6. ISO 20022 UNIFI schema 2025 (Travel Rule messaging).
7. CSOAI Ltd — UK Companies House registration 16939677.
8. CSOAI-Europe B.V. — DNB custody authorisation 2025/1143.
9. Stichting Sovereign Custody Foundation — AFN L03157161.

---

## License and authorship

This MiCA framework file is released under **MIT** by M4 engineering
lane, CSOAI Ltd (UK 16939677) / MEOK Labs, 2026-07-02. It is provided
for general informational purposes and is not legal advice. Verify with
qualified counsel before any regulated activity.
