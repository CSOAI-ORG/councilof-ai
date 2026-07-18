# CSOAI Layer-0 · Protocol P9 — Governed Outbound (Outreach Provenance)

> **Proposed 9th Layer-0 protocol.** Extends the 8-protocol scorecard
> (`CSOAI_LAYER0_SCORECARD_2026-06-29.md`) in the same house style + score formula.
> **Thesis:** an AI SDR is an *application* (L4). But *proving an AI-initiated contact was
> authorized, compliant, and consented* is a **trust primitive** — and it's missing from
> every ungoverned SDR (Clay, Instantly, Smartlead, Lemlist). CSOAI can own the standard.

## Scorecard row (drop-in)

| # | Protocol | Scope | Test/Verify | The "100/100" Claim |
|---|---|---|---|---|
| **P9** | **Governed Outbound** | **Signed, consent-gated, auditable agent-initiated contact** | Every send → Ed25519 receipt on the SIGIL chain; opt-out + lawful-basis checked pre-send | **Category of one** — no AI-SDR proves authorization + consent + provenance of an AI-sent message |

## What it is
A protocol so that **every outbound message an AI agent sends** (email, DM, form-fill, call) carries
a verifiable receipt proving four things, checkable offline with no CSOAI account:

1. **Authorized** — signed by a `did:csoai` identity (P-identity) → "a permitted agent sent this."
2. **Policy-passed** — the PDCA policy engine + Care-Floor 0.95 cleared it pre-send (no spam, rate-limited, on-ICP).
3. **Lawful basis** — GDPR/PECR/CAN-SPAM check: consent or legitimate-interest recorded, **opt-out honored** (suppression list checked at send time).
4. **Provenanced** — the message hash + recipient-domain + timestamp are hash-chained to the SIGIL ledger (P5) and cross-anchored (Rekor).

## Composition (reuses existing L0 — not new crypto)
```
P9 = P-identity(did:csoai)  →  P3-policy(care-floor + ICP gate)
     →  Consent-ledger(lawful basis + suppression)  →  P5-SIGIL(sign + chain)  →  send
     →  Receipt{msg_hash, from_did, policy_verdict, lawful_basis, opt_out_state, prev} → verify.html
```
The only new component is the **Consent Ledger** (lawful-basis + suppression state); everything else
is existing Layer-0 wiring. That keeps P9 honest — it's an *assembly*, not a moonshot.

## Score rationale (same formula as P1–P8)
`score = scope_coverage × test_pass_rate × signature_verifiability × moat_uniqueness`
- **scope_coverage** — covers the 4 questions above across email + DM + form + voice channels.
- **signature_verifiability** — each send is Ed25519-signed + offline-verifiable (inherits P5). → 100.
- **moat_uniqueness** — Clay/Instantly/Smartlead/Lemlist send at scale but prove **none** of it; no
  competitor ships signed, consent-gated, auditable AI outreach. → 100.
- **test_pass_rate** — gated on build: a `governed_outbound_test.py` (dry-run → receipt → verify) must pass.

## Status (honest)
- **Spec: proposed.** Not yet built. The pieces exist (SIGIL P5, policy engine P3, did:csoai P-identity,
  `outreach-system/send_all.py` as the send layer) but are **not yet composed** into a signed receipt path.
- **Build = 1 module:** wrap `send_all.py` so each send emits a P9 receipt (sign msg_hash + policy verdict +
  lawful-basis + suppression check) and appends to the SIGIL chain + `csoai_leads.db`.
- **Owner-gated to go live:** real sends (Nick's SMTP/SendGrid creds), `SIGIL_SEED`, suppression-list source.

## Why it's strategic
It converts the whole outreach engine from a growth hack into a **CSOAI product/standard**:
*"the only AI outreach you can cryptographically prove was authorized, compliant, and opt-out-clean."*
Same play as every CSOAI protocol — the market builds the capability; CSOAI governs + signs it.
