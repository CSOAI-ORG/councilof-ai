# Buyer enquiry — Turnstile admission and release acceptance

**Candidate source, not activated production configuration (21 November 2026).** This change stacks above operator-retrieval #4603, receipt and real-email CTA #4598, and durable-intake parent #4405. It must be integrated through the existing protected release owner, not shipped directly from a development branch.

## Exact behavior

- The **primary customer action remains a local email draft**. Opening it is not sending it; the person must press Send in their own email app.
- **Store a copy (no email sent)** is optional. Without a configured public Turnstile sitekey, its button is disabled and a readable email fallback remains available.
- The browser only loads the third-party Turnstile widget **after the visitor explicitly chooses optional storage verification**; email-only visitors are not required to load it. The challenge uses action `contact_enquiry` and sends `turnstile_token` only with that optional POST. Successful or unsuccessful POSTs reset the challenge, because tokens are single-use (subject to propagation caveats).
- `POST /api/contact` checks the existing form validations, LEADS binding, then requires `CONTACT_TURNSTILE_SECRET` and a server-side Siteverify response proving `success === true`, exact request hostname and action `contact_enquiry` **before any KV write**.
- Missing key, missing/oversized token, wrong action or hostname, replay/denial, HTTP failure, invalid JSON, or Siteverify timeout means **no KV put**. Invalid or unconfigured challenges are explicitly classified as known pre-write rejection, not as an ambiguous storage failure.
- The challenge token and secret are **never written** into LEADS, URLs, analytics, public proof records, GitHub commits, or operator-queue responses. This branch does not send mail, read existing leads, use a paid model, or create schedules.
- Cloudflare's public docs describe eventual consistency in Turnstile token replay rejection. **Do not claim exactly-once delivery, fully blocked abuse, or idempotency.** The existing customer message remains truthful about unknown network/storage outcomes.

## Operator-held setup (do not commit credentials)

1. In the company's approved Cloudflare Turnstile account, create a sitekey scoped to the permitted production hostname `councilof.ai`. Explicitly approve any staging/preview host that must be used for acceptance.
2. Set `VITE_CONTACT_TURNSTILE_SITE_KEY` to the **public sitekey** in the repository's protected **build environment** for the existing Pages release. Verify it is present in the actual build rather than only a separate dashboard setting.
3. Set `CONTACT_TURNSTILE_SECRET` as a protected **Pages runtime secret**, never as `VITE_` or as a tracked `wrangler.jsonc` variable. Verify runtime binding on the exact Pages project and production branch.
4. Review the published privacy notice for third-party challenge processing and its legal/contractual basis. Do not send sensitive attachments or credentials through the form.
5. Install a suitable, measured Cloudflare WAF/rate-limiting rule for POST `/api/contact` to cover automated high-volume requests and budget abuse. Turnstile is a distinct control, not a replacement for an edge rate limit.
6. Preserve #4603's **separate** Cloudflare Access protection for the private operator retrieval route. Siteverify never authenticates an operator.
7. Appoint a real on-call recipient and confirm operational alert/retrieval, retention deletion, correction and response procedures before presenting stored enquiries as delivered-to-team.

## Acceptance tests with real receipts

- Hosted unit/React regression: no sitekey -> no optional POST; Siteverify success for the exact hostname/action -> one KV put and a stored-only receipt; wrong host/action, malformed, timeout, missing key/token -> zero puts. Verify token never appears in persisted JSON.
- Owner-approved staging: open `/contact/` in a browser, complete Turnstile, submit **only a consented synthetic or authorized own-company enquiry**, capture receipt ID, read exactly that record with separately authenticated private operator privileges, and compare the one stored snapshot. No real customer contact details should be inserted into GitHub logs or public URLs.
- Operator must actually acknowledge and answer the test enquiry through the approved private team process. Verify the recipient, queue visibility and retention expiry without publishing personal data.
- Release through the existing GitHub Actions master gate, including post-deploy HTTP, hydrated-browser and delayed anti-clobber readback on both apex and Pages production alias.
- Report each stage separately: committed, CI passed, owner approved, published GET, hydrated behavior, accepted operator read, human response, customer acceptance and payment. None imply the next.

Primary implementation references: [Cloudflare Turnstile Siteverify](https://developers.cloudflare.com/turnstile/get-started/server-side-validation/); [Turnstile widget rendering](https://developers.cloudflare.com/turnstile/get-started/client-side-rendering/); [Cloudflare WAF rate limits](https://developers.cloudflare.com/waf/rate-limiting-rules/).

**Release hold:** No secret, Access policy, WAF rule, private lead receiver, human rota or public deployment was installed by this source branch. Email draft remains the only publicly evidenced contact path until all operator-held gates pass.
