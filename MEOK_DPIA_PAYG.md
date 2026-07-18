# MEOK AI Labs — DPIA for the PAYG billing flow

**Required by:** GDPR Article 35 + EDPB harmonised template (14 April 2026)
**Scope:** The pay-per-call (PAYG) billing endpoints `/payg/webhook`, `/payg/balance`, `/payg/deduct`, `/payg/trial`, `/payg/admin` on https://meok-attestation-api.vercel.app
**Last reviewed:** 2026-06-07
**Owner:** Nicholas Templeman (nicholas@meok.ai)

---

## 1. Description of the processing

A customer who tops up their PAYG balance (or activates the free £0.50 trial) is identified by an email address and issued a non-guessable token (`MEOK_PAYG_KEY`). Token + balance + timestamps live in **Stripe customer metadata** — Stripe is the single source of truth. Every MCP tool call posts the token to `/payg/deduct`, which atomically reduces the balance.

## 2. Personal data inventory

| Field | Source | Purpose | Stored where | Retention |
|---|---|---|---|---|
| Email | Stripe Checkout `customer_email` | Billing relationship + welcome email + trial dedupe | Stripe customer metadata | Stripe DPA (7 years for accounting) |
| PAYG token | Server-side `secrets.token_urlsafe(24)` | API authenticator (192 bits entropy) | Stripe customer metadata + customer's `MEOK_PAYG_KEY` env var | While customer is active |
| Balance + timestamps | Computed by `/payg/webhook` and `/payg/deduct` | Account state | Stripe customer metadata | Same as above |

**No MEOK-side database.** No logs of (email, token) pairs. The Resend welcome email (when `RESEND_API_KEY` is set) is fire-and-forget — Resend retains per its terms, not MEOK.

## 3. Legal basis

**Article 6(1)(b) GDPR — contract necessity.** The customer is in a contractual relationship with MEOK for PAYG billing. Email is required to dedupe trials + deliver the welcome email containing their token.

For the trial flow specifically, the customer affirms consent by POSTing `/payg/trial` with their own email.

## 4. Necessity + proportionality

- **Email is the minimum necessary identifier.** Stripe Checkout collects email by default; we don't request more.
- **No profile fields** (name, address, phone, IP) are stored MEOK-side. Stripe holds those per its terms.
- **Token, not email, is the in-band auth** — the customer doesn't transmit their email to the MCP server on each call. Reduces exposure.

## 5. Risks to data subjects

| Risk | Likelihood | Severity | Mitigation |
|---|---|---|---|
| Email leak via Vercel function logs | Low | Medium | Vercel logs default to 1-day retention; `/payg/*` responses never echo full email — token prefix `payg_xxxxxxxxxxxx…` only |
| Token brute-force | Negligible | High | 192 bits of entropy via `secrets.token_urlsafe(24)` |
| `/payg/admin` enumeration of customers | Low | Medium | Gated on `MEOK_PAYG_ADMIN_KEY`; returns 503 if env var unset |
| Cross-border transfer (Stripe US) | Already in place | Low | Stripe DPA + EU SCCs; unchanged from any existing Stripe customer |
| Data-subject rights requests | Standard | Low | `nicholas@meok.ai` → Stripe Customer deletion via dashboard within 7 days |

## 6. Data-subject rights — operationalisation

- **Right of access (Art 15)** — email `nicholas@meok.ai`; we return their Stripe customer metadata + token prefix.
- **Right to erasure (Art 17)** — Stripe customer deletion via dashboard. Email + token wiped. Customer's MCP installs immediately lose access.
- **Right to portability (Art 20)** — JSON export of customer metadata on request.
- **Right to object (Art 21)** — customer can stop topping up. Existing balance burns down to zero per original contract.

## 7. Outcomes

DPIA accepted. **No high residual risk identified.** No consultation with the supervisory authority required (Article 36).

## 8. Verification

Signed via meok-attestation-api. Cert ID: `meok-dpia-payg-2026-06-07`.
