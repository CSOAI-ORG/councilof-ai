# Show HN: Ed25519-signed per-system attestations for the EU AI Act

**Title:** `Show HN: Ed25519-signed per-system attestations for the EU AI Act` (72 chars)

---

## Post body

I am the solo founder of a one-person UK lab. For the last 5 days (15-16 Jun 2026) I built, audited, and signed a small wedge of compliance infrastructure aimed at the 2 August 2026 cliff, when Article 50 of the EU AI Act switches the general-purpose AI obligations from voluntary to enforced. As of today, 47 days remain. Most of the providers I need to talk to in 30 days are not yet shipping the attestations their buyers will be required to hold.

The primitive is intentionally small. Every system under management gets an attestation: a JSON document identifying the system, the model versions in it, the data lineage, the eval results, and the human accountable. That document is then signed twice — once with Ed25519 (asymmetric, public-key-verifiable) and once with HMAC-SHA256 (so verifiers who only hold the shared secret can still check it). The signed blob is served at a public URL with a `kid` header, so any third party can fetch the cert, pull the public key from the JWK set, and confirm the signature offline. The HMAC half uses the same key the keystone uses to mint customer keys, which means a verifier who trusts the keystone can verify trustlessly, and a verifier who holds the secret can verify in-band — no protocol split.

What I built in 5 days, with 9 dispatched subagents and no human besides me:

- A keystone attestation API (FastAPI on Vercel) with 14 production certs issued this week, all dual-signed, all on the public verify URL.
- A sovereign substrate (SOV3) carrying 115 MCP tools, 95 agents (34 active), 6/6 neural models trained, and a 9-sigil live Ed25519 chain — every emission a public-key-checkable event.
- 19 outreach messages drafted across 5 prospect tracks (Monzo, Cera, AccuRx, Onfido, Faculty) at D0 / D+3 / D+5 / D+7 cadences, plus 3 anonymised case studies (Tidewell / Larchwood / Auriga) and a 40-surface marketing pack.
- 3 SOV3 crashes found and fixed in the field (a sigil_bus import, a weaviate-client 0.1.2 placeholder, a missing aiosqlite in the hive venv).
- A BFT council with 4 open proposals, each sealed by a sigil on the chain, so the audit trail is reconstructible from the chain itself.

Everything is staged. Nothing is converting yet, and I want to be honest about that. The single gate is a 5-minute domain re-verification of `mail.meok.ai` inside the Resend dashboard. Until that is clicked, none of the 13 pending emails, the 2 staged for 18 June, the 1 staged for 22 June, the 1 staged for 25 June, or the 95 drafts in the email-automation-mcp folder will leave the queue. The first £199/mo Pro subscription signal is conditional on that single click.

Have a look. The keystone verify URL is `https://meok-attestation-api.vercel.app` and a live cert is at `https://meok-attestation-api.vercel.app/v1/verify/4EBF42EE5788` (the `kid` and the public key are both served from the same origin). The 5-day 24-hour timeline and the 6-action runbook are linked from the verify landing page.

What I would most like feedback on: the dual-sign choice. Ed25519 for trustless public verification, HMAC-SHA256 for in-band verifier trust — is this the right split for an EU AI Act Article 50 attestation, or should the HMAC half be dropped and verifiers be required to hold the public key?
