# Restricted buyer-enquiry review — release acceptance (21 November 2026)

This is a **candidate**, not an activated private inbox, alert, customer CRM, security certification, or deployed endpoint. It extends draft contact-intake #4405 and reviewed receipt correction #4598; it must not land independently of the parent release's privacy and security approval.

## Why this exists

The currently public contact page has an honest email-draft fallback. Storing a copy in the site's LEADS KV is not delivery to a human: the returned `notification_state` is `NOT_SENT`. A durable form is commercially useless if nobody can privately retrieve, monitor and answer submissions. This branch adds a separate read-only *operator review* path that is disabled by default.

## Candidate contract

`GET /api/private/contact-review`:
- Without a configured LEADS binding, Access issuer, Access application's exact AUD and operator allowlist, return 503. No public list or fallback access.
- Without a **verified** `Cf-Access-Jwt-Assertion` from the configured issuer, return 401; a token for another Access app fails. Also require that signed `email` belongs to the explicit allowlist; otherwise 403.
- With an authorized operator, list **only** up to 15 contact-key pointers, not lead contents. A properly encoded `?key=contact:<ISO>:<UUID>` returns one explicitly whitelisted contact record. A malformed record returns 422; a missing record returns 404, never fabricated zero.
- No write, delete, automatic notifications, third-party forwarding, wallet, payment, or sender identity inference. Responses are `no-store`, `noindex`. Personal data must never appear in public CI logs, PR comments, analytics, or screenshots.

## Operator-held Cloudflare configuration before any public release

1. In the existing Cloudflare Zero Trust account, create an Access application matching **only** `/api/private/contact-review*` on the production hostname; require named approved staff identities, MFA and a short session. Preserve existing site and API access. The Access application must also protect the Pages preview host or the token check must remain as its independent deny-by-default layer.
2. Install these **real, owner-chosen** settings in the protected deployment (do not commit values to Git):
   - `LEADS_OPERATOR_ACCESS_ISSUER`: the literal trusted `https://<team>.cloudflareaccess.com` issuer.
   - `LEADS_OPERATOR_ACCESS_AUD`: exact Access application audience tag.
   - `LEADS_OPERATOR_EMAILS`: reviewed comma-separated staff email allowlist (no public or customer addresses).
   - `LEADS`: already configured existing KV namespace. No new namespace or copying data to another host.
3. Approve and install WAF/rate limits and/or verified Turnstile for the **public POST** `/api/contact`; the existing CSRF, input limits and honeypot are not enough on their own. Verify Cloudflare's rule applies to both apex and preview entry points.
4. Record a private operator rota/notification mechanism with an identified owner, monitoring coverage, access revocation and privacy rights workflow. **No notifier or scheduler is implemented by this PR**. Until there is a real rota or alert, continue to present email as the working contact path.
5. The privacy/retention owner must approve 30-day KV expiry, deletion/correction operations, processor data access, access-log retention and lawful processing. Existing LEADS records outside `contact:` are not exposed or modified.

## Acceptance matrix — exactly what must be tested

- **Anonymous:** no Access, forged header, tampered JWT, wrong issuer, wrong AUD, expired assertion, disallowed email, missing configuration. All denied with no LEADS list/get.
- **Authorized operator:** Access policy allows only authorized identities. Listing uses `prefix=contact:`; result contains opaque names only. Exact-key detail reads one record; malformed and missing keys remain distinguished. Confirm no data appears in browser cache, analytics, logs or `/api/lead` public response.
- **Customer-owned synthetic or consented test:** submit from the real deployed contact page; verify the returned UUID and private KV entry match exactly, and confirm the operator can privately retrieve and respond via the approved team process. Do not submit a test person or pretend to be a customer.
- **Negative controls:** blocked public origin, invalid body, excessive input, bot honeypot, false-positive `stored:true`, lost network response after possible KV write, expired entry. Retrying an unknown write without an idempotency plan is not approved.
- **Release:** protect branch, verify required CI and Cloudflare deployment through the single GH Actions publisher. Then verify live apex, approved preview, and delayed anti-clobber checks. Do not claim production acceptance on CI alone.
- **Commercial outcome:** track source/recipient/consent, accepted SOW, delivered artifact, independently reviewed receipt, invoicing, settlement and repeat paid acceptance independently. A `stored:true` receipt is not a customer, notification or sale.

References: Cloudflare's official [Access JWT validation](https://developers.cloudflare.com/cloudflare-one/access-controls/applications/http-apps/authorization-cookie/validating-json/) specifies RS256 signature, trusted issuer and application audience validation. Configured Access policy and staff eligibility remain a *human operator* decision.

**Current release state:** source candidate only. Until all owner-held controls and a real private retrieval are accepted, do not advertise a reliably monitored submission or move the optional storage button ahead of the genuine email draft.
