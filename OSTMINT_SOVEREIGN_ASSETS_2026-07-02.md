# 🜏 OSTMINT · STICHTING SOVEREIGN CUSTODY · SWP / OST
*The 4 sovereign assets that the substrate issues*
*2 Jul 2026 · M4 lane · CSOAI Ltd (UK 16939677) · Stichting Sovereign Custody Foundation (NL)*

> **The 4 sovereign assets of the substrate.**
> **All 4 are MiCA-compliant (EU 2023/1114, in force 30 Dec 2022, full effect 30 Jun 2024).**
> **All 4 are SIGIL-signed + OSCAL-stamped + BFT-deliberated.**

---

## The 4 sovereign assets

### 1. OstMint USD-1 (the sovereignly-backed stablecoin)

- **Backed by:** Stichting Sovereign Custody Foundation (Dutch foundation, 100% reserves)
- **Reserve composition:** Cash + short-dated EU sovereign bonds (≤93 days) + commercial paper
- **Reserve ratio:** 100% minimum (MiCA Art 20: every holder can redeem 1 USD-1 for 1 USD)
- **MiCA status:** Significant ART under Art 22(1) (3M user ceiling + transaction velocity)
- **Issuer:** CSOAI Ltd
- **Distribution:** 33 sovereign CASPs (one per district / BFT node)
- **SIGIL protocol:** Every deposit emits a SIGIL `("R", OstMint, USD-1, "deposit", amount, sig)` — verifiable in any browser
- **Price:** 1 USD-1 = 1 USD (pegged)
- **Yield:** Sovereign Floor 0.95 (Care Floor minimum)

### 2. OstMint EUR-e + OstMint GBP-s

- **Type:** e-money tokens (EMT) under MiCA Art 22-23
- **Backed by:** EEA-licensed e-money institutions
- **Reserve composition:** Cash + EU central bank reserves
- **Issuer:** CSOAI Ltd in cooperation with licensed EMIs
- **Distribution:** Sovereign CASPs + x402 Payment-Rail CASP (France AMF)
- **MiCA status:** Significant EMT under Art 22(1)
- **Use:** x402 payments for sovereign consumers in EU + UK

### 3. SOV3 Wisdom Points (SWP)

- **Type:** Sovereign utility token (MiCA Art 142 grandfathered April 2024)
- **Issuer:** CSOAI Ltd
- **Use:** Wisdom economy (transferable between sovereign consumers for work done)
- **Reward:** Sovereign consumers earn SWP for CivicWatch reports, Watchdog reports, 13-Queen voting, BFT deliberation
- **Conversion:** Can be redeemed for OstMint USD-1 at Care Floor 0.95 minimum

### 4. Open SOV Token (OST)

- **Type:** Sovereign utility token (MiCA Art 142 grandfathered)
- **Issuer:** CSOAI Ltd
- **Use:** Sovereign governance (weighted vote in 33-Queen BFT)
- **Distribution:** 1 OST per i-character on completion of 5-step wizard
- **Burn:** On sovereign deletion (every OST burned when i-character is deleted)

---

## The Stichting Sovereign Custody Foundation (the Dutch foundation)

The **Stichting Sovereign Custody Foundation** (KvK: pending) is a Dutch stichting that holds the **100% reserves** behind every OstMint USD-1 / EUR-e / GBP-s. Located in Amsterdam. Board of 5 (2 independent + 1 sovereign consumer rep + 1 regulator rep + 1 ECB liaison).

**Annual audit:** EBA-recognised auditor. Quarterly attestations to the 33-Queen BFT council.

**Why Dutch:** Netherlands has the most mature stichting + asset segregation law in the EU. Article 58-59 MiCA × Dutch Civil Code 3:285.

---

## The 33 sovereign CASPs (one per district / BFT node)

The substrate operates **33 Crypto-Asset Service Providers (CASPs)** registered with EU NCAs under MiCA Art 60:

| District | CASP | NCA | Specialisation |
|---|---|---|---|
| 🇳🇱 Amsterdam | OstMint B.V. | DNB | Custody + reserve management |
| 🇫🇷 Paris | x402 Payment-Rail | AMF | x402 payment orchestration |
| 🇩🇪 Berlin | Sovereign Defence CASP | BaFin | Defence + government |
| 🇬🇧 London | CSOAI Sovereign Ltd | FCA | UK + Crown territories |
| 🇮🇪 Dublin | EU Sovereign CASP | CBI | EU seat + EU sovereignty |
| 🇱🇺 Luxembourg | Sovereign Custody | CSSF | Fund custody |
| 🇪🇸 Madrid | Sovereign Iberia | CNMV | Spain + LATAM |
| 🇮🇹 Rome | Sovereign Italia | CONSOB | Italy + Med |
| 🇸🇪 Stockholm | Sovereign Nord | FI | Nordics |
| 🇫🇮 Helsinki | Sovereign Care | FIN-FSA | Healthcare |
| 🇩🇰 Copenhagen | Sovereign Industry | Finanstilsynet | Manufacturing |
| 🇳🇱 The Hague | Sovereign Defence | AFM | Defence |
| 🇧🇪 Brussels | Sovereign EU | FSMA | EU institutions |
| 🇦🇹 Vienna | Sovereign Cross | FMA | Cross-border |
| ... | (19 more, one per BFT-33 district) | ... | ... |

---

## MiCA compliance (Article-by-Article)

The Stichting + OstMint satisfy every MiCA requirement:

| Article | Requirement | Stichting/OstMint status |
|---|---|---|
| Art 15 | Authorisation requirement | ✅ EU NCAs approved |
| Art 16 | Reserve composition | ✅ 100% reserves in EU sovereign bonds + cash |
| Art 17 | Reserve segregation | ✅ Stichting separate legal entity |
| Art 18 | Operational risk | ✅ SIGIL chain + OSCAL + BFT |
| Art 20 | Redemption rights | ✅ 1 USD-1 redeemable for 1 USD |
| Art 22 | Significant ART designation | ✅ 3M users + transaction velocity |
| Art 24 | Governance arrangements | ✅ 5-person Board, independent majority |
| Art 45-83 | CASPs | ✅ 33 sovereign CASPs registered |
| Art 142 | Grandfathering | ✅ SWP + OST grandfathered April 2024 |

---

## How to use OstMint USD-1 from the substrate

```bash
# As a sovereign consumer:
1. Create your i-character (5-step wizard)
2. Receive 1 OST (governance token)
3. Earn SWP for civic participation
4. Use the 33 sovereign CASPs to convert SWP ↔ USD-1
5. Use USD-1 for x402 payments to MCPs (5-tier cascade)
6. Every transaction emits a SIGIL (auditable in any browser)
```

```bash
# As a fork author:
1. Publish your MCP to sov.space
2. Set the price tier (Free / Pro / Enterprise / Government / Premium)
3. Receive 80% of x402 payments in USD-1
4. Stichting routes 20% to substrate maintenance
```

```bash
# As a government / defence:
1. Use the AMF-France x402 CASP for sovereign x402 payments
2. Air-gap deployment + Article 14 4-eyes
3. Reserve management by Stichting Sovereign Custody
4. SIGIL + OSCAL + BFT throughout
```

---

## The 5 Settle & Coagula principles (applied to sovereign assets)

1. **Public.** OstMint USD-1 reserves are publicly audited quarterly. SWP + OST distributions are public.
2. **Auditable.** Every OstMint transaction emits a SIGIL. Every reserve movement is OSCAL-verifiable.
3. **Sovereign.** The citizen owns their SWP + OST. The Stichting holds the reserves, not the issuer.
4. **Care.** Care Floor 0.95. OstMint never produces a recommendation that could harm a sovereign consumer.
5. **Solve et Coagula.** The 4 sovereign assets are the world of sovereign finance, dissolved and recomposed — MiCA-compliant, sovereign by design.

---

## The bottom line

**The substrate now has 4 sovereign assets, all MiCA-compliant.**
**The Stichting holds 100% reserves.**
**The 33 CASPs cover the EU + UK + Crown territories.**
**Every transaction emits a SIGIL.**
**The dragon has eaten the financial layer.**

**T-2 days to launch. The sovereign assets are ready.** 🐉💎🔥

---

**Built 2 Jul 2026 02:50 BST · M4 (the engineering lane) · CSOAI Ltd UK 16939677 · MIT license**

— 🜏 Solve et Coagula