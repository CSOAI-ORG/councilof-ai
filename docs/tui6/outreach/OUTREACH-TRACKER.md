<<<<<<< HEAD

---

## New entries (Sep 13, do-all-else pass)

| # | CON ID | Contact | Org | Email / Channel | Sent | Response | FU1 Date | FU2 Date | Next Action |
|---|--------|---------|-----|-----------------|------|----------|----------|----------|-------------|
| 14 | CON-005 | AI team | Relm Insurance | nicholas@csoai.org → email | BLOCKED_SMTP | — | — | — | Reset PrivateEmail pwd, then send |
| 15 | CON-010 | Standard lead | AIUC (AIUC-1) | nicholas@csoai.org → email | BLOCKED_SMTP | — | — | — | Reset PrivateEmail pwd, then send |
| 16 | CON-005/010 | Partner team | Vanta (integration) | nicholas@csoai.org → email | BLOCKED_SMTP | — | — | — | Reset PrivateEmail pwd, then send |
| 17 | CON-010 | Benchmarking team | Epoch AI | nicholas@csoai.org → email | BLOCKED_SMTP | — | — | — | Reset PrivateEmail pwd, then send |

**Blocker:** `SMTP_PASSWORD` env rejected by PrivateEmail (535 5.7.8). Previous Sep 12 batch must have used a working pwd that has rotated. SendGrid route (`EMAIL_FROM=noreply@csoai.platform`) is `placeholder`, not provisioned.

**5 drafts awaiting owner browser action (no email available):**
- 01-armilla.md (Become a Partner form)
- 03-munich-re-aisure.md (form only, page 403'd)
- 05-enzai.md (form only)
- 07-drata.md (partner portal only)
- 08-credo-ai.md (Become a Partner form)
=======
# Outreach Tracker

**Created:** 2026-09-13
**Branch:** growth/outreach-tracking-20260913
**Revenue gate:** 1 repeat buyer OR 5 distinct payers in 30 days (current: 1 payer, 0.02 USDC)

---

## Follow-Up Cadence

| Step | Timing | Action | Stop condition |
|------|--------|--------|----------------|
| Send | Day 0 | Original outreach | — |
| Follow-up 1 | +3 business days | Short value-add nudge | Reply received |
| Follow-up 2 | +7 business days | Final reference with new data point | Reply received |
| Close | +10 business days | Mark NO_RESPONSE, move on | No reply after 2 touches |

**Business days for September 2026:** Send date 12 Sep (Fri) → FU1 = 17 Sep (Wed) · FU2 = 23 Sep (Tue).

---

## Sent Emails — Tracking Table

| # | CON ID | Contact | Org | Email / Channel | Sent | Response | FU1 Date | FU2 Date | Next Action |
|---|--------|---------|-----|-----------------|------|----------|----------|----------|-------------|
| 1 | CON-002 | Compliance team | Chainalysis | nicholas@csoai.org → email | 2026-09-12 | NO_RESPONSE | 2026-09-17 | 2026-09-23 | FU1 template (stablecoin on-chain evidence) |
| 2 | CON-001 | Compliance team | Circle | nicholas@csoai.org → email | 2026-09-12 | NO_RESPONSE | 2026-09-17 | 2026-09-23 | FU1 template (RLUSD/USDC trust-line data) |
| 3 | CON-002 | Compliance team | Tether | nicholas@csoai.org → email | 2026-09-12 | NO_RESPONSE | 2026-09-17 | 2026-09-23 | FU1 template (USDT on-chain attestation) |
| 4 | CON-004 | Market data team | CoinGecko | nicholas@csoai.org → email | 2026-09-12 | NO_RESPONSE | 2026-09-17 | 2026-09-23 | FU1 template (signed correction feed) |
| 5 | CON-008 | Dataset users | HuggingFace | nicholas@csoai.org → email | 2026-09-12 | NO_RESPONSE | 2026-09-17 | 2026-09-23 | FU1 template (dataset downloads milestone) |
| 6 | — | Stablecoin team | DefiLlama | GitHub issue #913 | 2026-09-12 | NO_RESPONSE | 2026-09-17 | 2026-09-23 | FU1 via GitHub comment (425-asset index update) |
| 7 | CON-009 | AI RMF team | NIST | nicholas@csoai.org → email | 2026-09-12 | NO_RESPONSE | 2026-09-17 | 2026-09-23 | FU1 template (NIST AI RMF crosswalk update) |
| 8 | CON-014 | Governance team | Anthropic | nicholas@csoai.org → email | 2026-09-12 | NO_RESPONSE | 2026-09-17 | 2026-09-23 | FU1 template (22-axis measurement evidence) |
| 9 | — | Innovation team | FCA | nicholas@csoai.org → email | 2026-09-12 | NO_RESPONSE | 2026-09-17 | 2026-09-23 | FU1 template (EU AI Act crosswalk) |
| 10 | CON-011 | MCP registry | MCP.so | nicholas@csoai.org → email | 2026-09-12 | NO_RESPONSE | 2026-09-17 | 2026-09-23 | FU1 template (MCP server v1.4.2 update) |
| 11 | — | Data team | rwa.xyz | nicholas@csoai.org → email | 2026-09-12 | NO_RESPONSE | 2026-09-17 | 2026-09-23 | FU1 template (signed XRPL reader) |
| 12 | — | Externals team | Bluechip | nicholas@csoai.org → email | 2026-09-12 | NO_RESPONSE | 2026-09-17 | 2026-09-23 | FU1 template (Hacken USDT precedent) |
| 13 | — | Delegation evidence | IETF datatracker | datatracker web form | 2026-09-13 | NO_RESPONSE | 2026-09-18 | 2026-09-24 | Wait for secretariat processing (~1-2 biz days) |

---

## All 15 Contacts — Status Overview

| CON ID | Sector | Target Org | State | Offer | Channel | Last Action | Notes |
|--------|--------|------------|-------|-------|---------|-------------|-------|
| CON-001 | Stablecoin risk | Circle (RLUSD) | EMAIL_SENT | OFFER-001 + OFFER-002 | Email | 2026-09-12 | RLUSD XRPL hook |
| CON-002 | Stablecoin risk | Chainalysis / Tether | EMAIL_SENT | OFFER-001 | Email | 2026-09-12 | USDC/USDT/DAI on-chain |
| CON-003 | Tokenized funds | BlackRock/BENJI | PREPARED | OFFER-002 | Email | — | BENJI treasury index ready |
| CON-004 | Financial data | CoinGecko | EMAIL_SENT | OFFER-001 + OFFER-006 | Email | 2026-09-12 | Signed correction feed |
| CON-005 | Insurance | PI/cyber underwriter | PREPARED | OFFER-002 | Email | — | 22-axis evidence ready |
| CON-006 | Standards | BSI ART/1 | PREPARED | OFFER-002 | Email | — | EU AI Act crosswalk |
| CON-007 | Standards | IETF SCITT | PREPARED | OFFER-003 | Email | — | SCITT framing space draft |
| CON-008 | Open data | HuggingFace | EMAIL_SENT | OFFER-FREE | HF message | 2026-09-12 | 100 datasets, 25K downloads |
| CON-009 | Research | NIST | EMAIL_SENT | OFFER-002 | Email | 2026-09-12 | NIST AI RMF crosswalk |
| CON-010 | Audit | Big 4 AI audit | PREPARED | OFFER-005 | Email | — | Signed measurement cards |
| CON-011 | MCP platform | MCP.so / Registry | EMAIL_SENT | OFFER-003 | GitHub/email | 2026-09-12 | v1.4.2, 12 tools |
| CON-012 | x402 facilitator | x402 foundation | PREPARED | OFFER-003 | GitHub | — | 9 resources, Base mainnet |
| CON-013 | A2A platform | A2A protocol team | PREPARED | OFFER-003 | GitHub | — | Agent Card v1.1.0 |
| CON-014 | AI platform | Anthropic | EMAIL_SENT | OFFER-004 | Email | 2026-09-12 | 22-axis measurement |
| CON-015 | Financial infra | SWIFT/ISO 20022 | PREPARED | OFFER-002 | Email | — | 26-institution census |

**Summary:** 13 sent (EMAIL_SENT) / 2 still PREPARED (CON-003, CON-005) / 5 still PREPARED not-yet-sent (CON-003, CON-005, CON-006, CON-007, CON-010, CON-012, CON-013, CON-015)

---

## Status Definitions

| Status | Meaning |

---

## New entries (Sep 13, do-all-else pass)

| # | CON ID | Contact | Org | Email / Channel | Sent | Response | FU1 Date | FU2 Date | Next Action |
|---|--------|---------|-----|-----------------|------|----------|----------|----------|-------------|
| 14 | CON-005 | AI team | Relm Insurance | nicholas@csoai.org → email | BLOCKED_SMTP | — | — | — | Reset PrivateEmail pwd, then send |
| 15 | CON-010 | Standard lead | AIUC (AIUC-1) | nicholas@csoai.org → email | BLOCKED_SMTP | — | — | — | Reset PrivateEmail pwd, then send |
| 16 | CON-005/010 | Partner team | Vanta (integration) | nicholas@csoai.org → email | BLOCKED_SMTP | — | — | — | Reset PrivateEmail pwd, then send |
| 17 | CON-010 | Benchmarking team | Epoch AI | nicholas@csoai.org → email | BLOCKED_SMTP | — | — | — | Reset PrivateEmail pwd, then send |

**Blocker:** `SMTP_PASSWORD` env rejected by PrivateEmail (535 5.7.8). Previous Sep 12 batch must have used a working pwd that has rotated. SendGrid route (`EMAIL_FROM=noreply@csoai.platform`) is `placeholder`, not provisioned.

**5 drafts awaiting owner browser action (no email available):**
- 01-armilla.md (Become a Partner form)
- 03-munich-re-aisure.md (form only, page 403'd)
- 05-enzai.md (form only — playwright-tested, not submitted)
- 07-drata.md (partner portal only)
- 08-credo-ai.md (Become a Partner form)
