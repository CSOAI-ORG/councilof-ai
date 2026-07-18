# Design-partner outreach — DRAFTS (2026-07-14)
_Drafted by Fable. NOT sent — sending is owner-gated (your account, your call). Honest register:
no fabricated traction, capability stated plainly, the ask is a pressure-test not a sale. Each is
~120 words — short enough to read on a phone. Pair with the proof one-pager Artifact._

Rule of thumb: one warm, specific line about *them* first; the verified number as the hook; the
ask is small (a 30-min pressure-test), not a purchase.

---

## 1 — Regulated finance (CCO / Head of Model Risk — e.g. a challenger bank)
**Subject:** A signed, offline-verifiable audit trail for AI decisions — 30-min pressure-test?

Hi {name},

Model-risk teams keep telling me the same thing: dashboards prove a model's behaviour *while a
vendor's service is up*, but nothing lets you independently validate a deployment-ready claim after
the fact. We built the missing piece — every governed AI decision is Ed25519-signed into a
tamper-evident ledger you verify offline, with the public key and nothing else.

One measured result: under a 4-of-9 adversarial takeover of the model ensemble, a naive average
degrades 3.4× while our governed aggregator holds flat at 1.0× (run live this week — happy to send the receipts).

We're not selling yet — we want 2-3 design partners to break it against a real workflow. Worth 30
minutes to see if it fits your model-risk stack?

— Nick

---

## 2 — Healthcare / social care (Head of Clinical Safety / DPO — e.g. a care provider)
**Subject:** Provable audit trail for AI in care — would 30 minutes be useful?

Hi {name},

In care, "the AI recommended it" isn't enough — you need to show *what it did, that it wasn't
altered, and that it stayed inside its guardrails*, offline and after the event, for a regulator or a
coroner. That's a signature problem, and it's what we've built: a signed, hash-chained record of
every governed decision, verifiable without trusting our servers.

It reaches the systems care actually runs on — we have signed bridges into HL7/FHIR and legacy
estates, not just a chatbot.

We're honest about the stage: bootstrapped, no paying customers yet, mid-tier model reasoning — the
value is the *verifiable governance*. Looking for a design partner to test it on one real pathway.
Open to a short call?

— Nick

---

## 3 — Defence assurance (Turing / DASA / ASGARD ecosystem — assurance lead)
**Subject:** Closing the JSP 936 vendor-claim-validation gap — signed System Card

Hi {name},

The recurring finding in UK defence-AI reviews is that there's no formal process to validate a
vendor's deployment-ready claims. We've built a signed, offline-verifiable System Card that does
exactly that: an Ed25519-signed, standards-mapped (OSCAL) record an assurer can check air-gapped,
independent of the vendor.

Measured, this week, on a live GPU: our governed aggregator holds flat (1.0× degradation) under a
4-of-9 adversarial minority where a naive ensemble degrades 3.4×. Reproduced 3×; receipts available.

To be clear on scope — this is an *assurance/audit layer that sits on top of* capability providers
(Anduril/Helsing/Palantir class), not a competing platform, and explicitly not a weapons system. We'd
value a conversation about the assurance need and where a signed card would help.

— Nick

---

## Owner actions to send (none automated by me)
- [ ] Pick real named recipients (I have categories, not verified contacts).
- [ ] Attach / link the proof one-pager Artifact (share it public from the Artifact page first).
- [ ] Send from your own account — I will not send outbound on your behalf without explicit go-ahead per message.
- [ ] Optional: I can tailor any draft to a specific named person/org once you choose targets.
