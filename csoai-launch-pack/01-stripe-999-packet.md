# Step 1 · Stripe live → one real £999 sale (packet)

**Your action (5 min in Stripe):** flip live mode + create one Payment Link, send it to one buyer. I can't create it for you (needs your live Stripe account) — everything you paste is below.

## The product (confirm/edit before selling)
**DEFONEOS Signed Assurance Starter — £999 (one-off)**
> A signed, offline-verifiable **AI System Card + NIST OSCAL** for one AI system, plus a hosted verify page. The independent assurance artifact the Turing/CETaS gap named — you hand a buyer/auditor a receipt they can check with no server.

**What they get (all real, already built):**
- 1× signed **AI System Card** (JSP 936 / EU AI Act shape) for their system — `defoneos_system_card`
- 1× signed **NIST OSCAL 1.1.2 component-definition** of their governance posture — `defoneos_oscal`
- The **verify page** so anyone confirms it offline (`defoneos.vercel.app/verify.html`)
- The **defoneos-sign MCP** so their own agents can re-sign outputs
- Honest line (keep it): **assurance, not certification** — attestation of declared posture, cryptographically signed.

## Stripe steps (live)
1. Stripe Dashboard → toggle **View test data → OFF** (live).
2. **Products → Add product** → name `DEFONEOS Signed Assurance Starter`, price `£999.00` GBP, **One-off**.
3. **Payment Links → New** → select that product → enable **card**, collect **name + email + company** (custom field: "AI system to assure"). Turn on **VAT/tax** if registered. Save.
4. Copy the link (looks like `https://buy.stripe.com/xxxx`).
5. (Optional) **Webhook** to your node for auto-fulfilment: endpoint `https://<node>/stripe`, event `checkout.session.completed`. Not required for the first manual sale.

## The send-email (paste, edit the [brackets])
> **Subject:** Your signed AI assurance artifact — DEFONEOS
>
> Hi [name],
>
> As discussed — here's the £999 **Signed Assurance Starter**. You get a cryptographically-signed **AI System Card** and **NIST OSCAL** posture for [their system], plus a verify page an auditor checks offline, with no server to trust. It's the independent assurance primitive the Alan Turing Institute flagged as missing in AI governance.
>
> Pay here: **[Stripe link]**
>
> The moment it clears I turn your inputs into the signed artifacts (24h). Want to see a live example first? 60-second walkthrough: defoneos.vercel.app/verify.html
>
> — Nicholas · CSOAI Ltd (UK 16939677)

## Fulfilment (after payment — ~20 min, all built)
1. From their intake, run the MCP (or dome): `defoneos_system_card` + `defoneos_oscal` for their system.
2. Send the two signed JSON files + the `verify.html?receipt=…` link.
3. Log the sale. First revenue booked.

## Honesty flags
- The £999 scope above is my draft — **confirm it's what you want to sell** before sending.
- Everything the buyer receives is a real, tested artifact (24/24 MCP tests, cross-lib verified). No overpromising: it's signed *attestation of declared posture*, not accreditation — say that up front; it's the honest differentiator, not a weakness.
