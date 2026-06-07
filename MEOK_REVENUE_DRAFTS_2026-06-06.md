# 🐉 MEOK Revenue Drafts — for Nick to fire (owner-gated; nothing here was sent/posted)

Overnight cycle 7. These are **drafts + a checklist** — posting to HN, touching Stripe, and DNS
are yours. The product is verified solid (36/36 live); this is the go-to-market ammo.

---

## A. Show HN — draft (ready to paste, honest, no overclaim)

**Title:**
`Show HN: MEOK ONE – an AI OS where every decision is signed and tamper-evident`

**URL:** `https://one.meok.ai/os`  *(or the sslip.io URL until DNS is set)*

**Body:**
> I'm a solo founder building MEOK ONE — a hosted AI "operating system" of characters that runs
> on your own LLM (Ollama) or ours. The differentiator isn't the chat; it's the **governance
> layer**: every reply passes a Byzantine-fault-tolerant "council" of safety lenses, and every
> decision is written to a **hash-chained, signed audit trail** you can read in plain English and
> independently verify (the EU AI Act Art-12 "tamper-evident logging" story, made real).
>
> It also has a worm-guard that blocks prompt-injection/self-replication (Morris-II class) at the
> agent boundary, a care-gate that always routes distress to real human support, and one-click
> **"take it local"** export (GDPR Art-20) so your characters + memory are genuinely yours.
>
> Free tier is zero-signup. Open-source local build. I'd love feedback on the provenance model —
> is signed, verifiable AI decision-logging something you'd actually want, or a compliance curio?

*(Honest caveats to keep ready for comments: mobile is PWA-only today; "council/consciousness"
are engineering constructs not literal claims; numbers I can defend — 36/36 surfaces live, signed
chain verifies, threat-NN blocks injection in tests.)*

---

## B. One-funnel conversion checklist — make ONE product convert end-to-end

Pick **one** (recommend the £9 MEOK ONE Pro *or* the EU-AI-Act compliance MCP — fastest intent).
Goal: a real test payment lands and unlocks access. Each ☐ is a concrete check.

**Path: MEOK ONE Pro (£9/mo)**
1. ☐ Land on `/os`, hit the **50-msg/day cap** → confirm the cap modal shows a Pro upsell.
2. ☐ Upsell → **Stripe checkout** opens with the correct £9 product (not a stale/shared link).
3. ☐ Pay (test mode / real card) → Stripe **success** → redirect back into the OS.
4. ☐ Webhook flips the user to Pro → all 27 characters + 2,000-msg cap unlocked in the SAME session.
5. ☐ Receipt email + the signed-attestation export available.
6. ☐ Eyeball Stripe dashboard → the payment shows (kills the £0 mystery).

**Owner-gated (yours — I can't do these):** the Stripe key roll, creating/confirming the payment
link, the live test charge, and the cap→checkout wiring sign-off.

**What I can do on your word:** wire the cap→checkout modal in `meok_one`, verify the webhook
flips the tier server-side, and add an E2E test that asserts the unlock — all health-gated on GCP.

---

## C. Distribution one-liners (ready, not sent)
- **LinkedIn:** "AI you can audit. MEOK ONE signs every decision onto a tamper-evident ledger you can verify — the EU AI Act Art-12 story, shipped. Free to try: one.meok.ai"
- **Reply-bait for HN/X:** "Most 'AI safety' is a vibe. Ours is a hash chain you can recompute."

> Next move when you're back: say the word and I take **Path B** end-to-end on GCP until a test
> payment unlocks Pro in one session. That's the needle.
