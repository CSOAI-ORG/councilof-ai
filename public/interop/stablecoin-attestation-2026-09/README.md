# stablecoin-attestation-2026-09 — unsigned cadence densify pack

**Surface:** regulatory-exposure (unsigned) · **Status:** PROBED / UNCHECKABLE · **`writes_board: false`** · **`sig_ed25519: null`**

Doctrine: densify **stated cadence / examiner / quote** beside GENIUS monthly attestation text + MiCA Art 54.
**Never** say under-reserved / non-compliant. **No conclusion field.**

## GENIUS monthly (verbatim, P.L. 119-27 §4(a)(3))

> A permitted payment stablecoin issuer shall, each month, have the information disclosed in the previous month-end report required under paragraph (1)(D) examined by a registered public accounting firm. Each month, the Chief Executive Officer and Chief Financial Officer of a permitted payment stablecoin issuer shall submit a certification as to the accuracy of the monthly report to, as applicable, the primary Federal payment stablecoin regulator of the permitted payment stablecoin issuer; or the State payment stablecoin regulator of the permitted payment stablecoin issuer.

## MiCA Art 54 (verbatim)

> Funds received by issuers of e-money tokens in exchange for e-money tokens and safeguarded in accordance with Article 7(1) of Directive 2009/110/EC shall comply with the following: (a) at least 30 % of the funds received is always deposited in separate accounts in credit institutions; (b) the remaining funds received are invested in secure, low-risk assets that qualify as highly liquid financial instruments with minimal market risk, credit risk and concentration risk, in accordance with Article 38(1) of this Regulation, and are denominated in the same official currency as the one referenced by the e-money token.

## Cards

| Issuer | Tokens | Status | Stated cadence | Examiner (as stated) | Card |
| --- | --- | --- | --- | --- | --- |
| Ripple / Standard Custody (RLUSD) | RLUSD | PROBED | monthly | Deloitte (independent third-party accounting firm / US CPA per docs) | [`card-rlusd-ripple-unsigned.json`](./card-rlusd-ripple-unsigned.json) |
| Circle (USDC / EURC) | USDC, EURC | PROBED | monthly (USDC third-party assurance); weekly reserve holdings disclosure stated for USDC | Big Four accounting firm (page); Deloitte & Touche LLP named as Circle’s independent auditor | [`card-circle-usdc-eurc-unsigned.json`](./card-circle-usdc-eurc-unsigned.json) |
| Ondo Finance (OUSG) | OUSG | PROBED | page states daily 3rd-party administrator financial reporting; Attestation Reports linked on page | 3rd-party administrator (named on page as publishing daily reporting); attestation reports linked | [`card-ousg-ondo-unsigned.json`](./card-ousg-ondo-unsigned.json) |
| Braza (USDB / BBRL) | USDB, BBRL | PROBED | page states independently audited on a monthly basis; transparency dashboard described as finalizing | top-tier audit firm (page); Big Four review described as underway | [`card-braza-usdb-bbrl-unsigned.json`](./card-braza-usdb-bbrl-unsigned.json) |
| Société Générale-FORGE (EURCV / CoinVertible) | EURCV | PROBED | daily public reserve composition/valuation disclosure (page) | page emphasizes daily public disclosure on Societe Generale-Forge website (attestation firm not named in retrieved product copy) | [`card-sg-forge-eurcv-unsigned.json`](./card-sg-forge-eurcv-unsigned.json) |
| Quantoz (EURQ / USDQ) | EURQ, USDQ | PROBED | transparency dashboard stated (continuous visibility); reserve status overview dated June 30th, 2026 on transparency page | transparent auditing stated; registered public accounting firm for monthly GENIUS-style exam not named on retrieved pages | [`card-quantoz-eurq-usdq-unsigned.json`](./card-quantoz-eurq-usdq-unsigned.json) |
| GateHub | USD.gh, EUR.gh | UNCHECKABLE | — | — | [`card-gatehub-unsigned.json`](./card-gatehub-unsigned.json) |
| Schuman Financial (EURØP) | EURØP | PROBED | quarterly | KPMG | [`card-schuman-europ-unsigned.json`](./card-schuman-europ-unsigned.json) |
| Republic of Palau (PSC) | PSC | UNCHECKABLE | — | — | [`card-palau-psc-unsigned.json`](./card-palau-psc-unsigned.json) |

### RLUSD note

docs.ripple.com cites **monthly / Deloitte**. Cards note attestations are **retrospective point-in-time**
(named Report Dates), not a continuous real-time reserve feed.

### UNCHECKABLE

- **GateHub:** SPA shell; no server-rendered attestation text in retrieved HTML.
- **Palau PSC:** no public attestation page located (stablecoin.pw empty; palaugov captcha).

Retrieval ISO date: **2026-09-02**. Reader concludes.
