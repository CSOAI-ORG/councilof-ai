# White-label OEM outreach — 5 compliance SaaS vendors

**Goal:** license `meok-attestation-api` as an embedded sign/verify primitive at £500-£2,000/mo per partner.

**Context (from audit):** Vanta/Drata sit at $7.5K-$25K/yr per *end customer* — the embedded signing primitive isn't something they build in-house. None of them currently sell signed compliance attestation infra as a B2B backend. There is a real gap.

**One-paragraph offer (re-use across all 5):**
> MEOK ships an open-source HMAC-signed attestation API your platform can embed. Every cert your tenants generate gets a public verify URL their auditors can curl — proof your platform did the check. £500/mo for 10K certs/mo · £2K/mo unlimited + multi-tenant isolation · 7-day pilot, no contract, white-label. Live demo + sample SDK in <24h.

**Send from:** `nicholas@csoai.org`
**Subject line A/B:**
- A: "Embedded compliance attestation primitive — 7-day pilot for {Company}"
- B: "Auditor-verifiable certificates for your customers — £500/mo embedded layer"

---

## 1. Filigran (filigran.io)
**Why them:** OpenCTI / OpenAEV maker — open-source-first, Series A May 2024 ($35M). Compliance attestation is adjacent to their threat-intel surface; they're already used to signed evidence trails.
**Send to:** `contact@filigran.io` + LinkedIn DM `samuel-hassine` (CEO).

```
Subject: Embedded compliance attestation primitive — 7-day pilot for Filigran

Hi Samuel,

Quick one. I run MEOK AI Labs (UK, solo) and ship signed compliance attestations
as an open-source MCP. Every cert your platform issues gets a public verify URL
auditors can curl back — provable, not promised.

OpenCTI users sit on a goldmine of evidence trails. Layering HMAC-signed
attestation on top would make every connector run audit-grade.

7-day no-contract pilot. £500/mo for 10K certs, £2K/mo unlimited. Live API:
https://meok-attestation-api.vercel.app/

Worth 20 min next week?

— Nicholas
nicholas@csoai.org
csoai.org · meok.ai
```

---

## 2. Trustcloud.ai
**Why them:** GRC platform, raised $15M Series A 2023. Their TrustOS layer would benefit from signed evidence-of-control attestations.
**Send to:** `partnerships@trustcloud.ai` + LinkedIn `johnnyleeio` (founder).

```
Subject: Auditor-verifiable certificates for TrustCloud customers — £500/mo embedded

Hi Johnny,

I run MEOK AI Labs. We ship signed compliance attestation infra as an embedded
primitive — every "control verified" event in TrustOS could ship with an
HMAC-signed cert + public verify URL auditors can curl.

Removes the "trust me" gap from your evidence trail. 7-day pilot, no contract.

Demo: https://meok-attestation-api.vercel.app/sign (live API)

10 minutes Friday?

— Nicholas
csoai.org
```

---

## 3. Sprinto (sprinto.com)
**Why them:** Mid-market GRC, $20M Series B Aug 2023. Bangalore + US team, focused on continuous compliance. Their evidence collection layer is where this slots in.
**Send to:** `partnerships@sprinto.com` + LinkedIn DM `girish-redekar` (CEO).

```
Subject: Embedded attestation API — Sprinto evidence layer

Girish,

We ship an open-source attestation API: customers sign+verify compliance events
cryptographically, every cert has a public verify URL.

Sprinto's evidence-collection layer would gain a tamper-evident receipt for every
control check — at £500/mo for 10K certs/mo embedded. Cheaper than internal
build, faster than audit log + KMS roll-your-own.

7-day pilot. No contract. Live in 24h.

— Nicholas
nicholas@csoai.org · meok.ai
```

---

## 4. MetaCompliance / Matproof
**Why them:** Northern Ireland compliance firm, EU/UK focus, well-positioned for EU AI Act + DORA + NIS2. Likely buys before building.
**Send to:** `info@metacompliance.com` + Robert O'Brien (CEO) on LinkedIn.

```
Subject: EU AI Act / DORA attestation primitive — embedded for MetaCompliance

Hi Robert,

We ship signed-attestation infrastructure as an open-source MCP — DORA, NIS2,
EU AI Act, GDPR all already wired with Article references and crosswalks.

If MetaCompliance customers want a "we verified this control" stamp their
auditors can verify cryptographically (instead of trusting the dashboard),
that's £500-£2,000/mo embedded into your platform.

7-day pilot. White-label. No contract.

Demo: https://meok-attestation-api.vercel.app

— Nicholas
csoai.org · meok.ai
```

---

## 5. Strike Graph
**Why them:** YC-backed compliance automation, US-focused, raised Series B 2022. They're competing with Drata at the SMB tier and need differentiation.
**Send to:** `partners@strikegraph.com` + LinkedIn DM `justin-beals` (CEO).

```
Subject: Differentiator vs Drata — auditor-verifiable certificates layer

Justin,

Strike Graph customers get a dashboard saying "compliant." Drata customers get
the same dashboard. The differentiator we're shipping: every control event
gets an HMAC-signed cert with a public verify URL — auditors can independently
curl-verify without logging into your platform.

Embedded as an OEM API: £500/mo for 10K certs, £2K/mo unlimited.

7-day pilot. White-label. Open-source verify side so your customers can
self-audit in air-gapped environments.

— Nicholas
csoai.org · meok.ai
```

---

## Send schedule

- **Today (Mon 27 Apr):** Send all 5 emails. Time investment: 30 mins.
- **Wed 29 Apr:** LinkedIn DM follow-ups for any non-responders.
- **Mon 4 May:** Second-touch email — short, "anything I can clarify?"
- **Mon 11 May:** Drop the dead leads, double down on responders.

## Response handling

- **Reply asking for more info →** send the 1-pager + book Cal.com triage.
- **Reply "not now" →** add to 90-day re-engage list, reply with thanks.
- **Reply "we built our own" →** "great, OSS our verify spec? happy to align."
- **No reply by 14 days →** dead, drop.

## Realistic outcome

Per audit: 1 of 5 replies = 20% conversion, 25% chance to close → **5% chance of one £2K/mo deal in next 30 days**. Even one closed deal moves the floor case to break-even.

Cost: 30 min to send. EV: ~£24K/yr.
