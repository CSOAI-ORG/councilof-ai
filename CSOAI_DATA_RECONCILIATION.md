# CSOAI Data Reconciliation — current state & plan

_Verified 2026-06-23 against the live production trees. The problem isn't one schema — it's that **certificates and customers are each written in 2–3 unconnected databases with incompatible IDs**, and the surface that the public actually verifies against is a fourth store._

## The four stores

| Store | Engine | Owned by surface | Holds | ID format | Env |
|---|---|---|---|---|---|
| **api.csoai.org** | MongoDB | `CSOAI-CORP/csoai-platform` (Express) | Certificates, Users, Tenants, payments, leads | `CSOAI-{TENANT}-{YEAR}-{SEQ}` | `MONGODB_URI` |
| **app.csoai.org** | MySQL (Drizzle) | `clawd/csoai-dashboard-master` | `course_certificates`, `users`, courses, referrals, Stripe | `COAI-{FRAMEWORK}-{ts}-{hex}` | `DATABASE_URL` |
| **csoai.org** (apex) | Postgres | `clawd/csoai-org-v2` (Next.js) | **only leads** (`subscribers`, `contact_submissions`) | — | `DATABASE_URL` |
| **meok-attestation-api** | SIGIL ledger | the Vercel attestation spine | the cryptographic audit/verify ledger | `WDG-…` sample | `MEOK_ATTESTATION_API_URL` |

## Why this hurts

- **Certificates fragment three ways.** A cert issued through the dashboard lands only in MySQL; one issued through the platform lands only in Mongo; **csoai.org's public `/verify` queries neither** — it hits the meok-attestation ledger. A cert valid on one surface is unverifiable on the others.
- **Customers are double-booked.** Mongo `User`/`Tenant` (keyed by `tenantId`/ObjectId) vs MySQL `users` (keyed by `int id`/openId). Same human, two unrelated rows, no shared key.
- **Payment state is split** across Mongo, MySQL, and "Stripe-only" (csoai-org-v2 writes no DB on checkout). No single subscription source of truth.
- The only column common to all is **email**.

## Recommended target: one cert authority, one identity map

**Canonical certificate authority = the meok-attestation (SIGIL) ledger.** Rationale: it's already what the public `/verify` path trusts, it's the cryptographic source of truth, and it's the moat story (signed, independently checkable). Mongo/MySQL become _issuers that write through_ to it, not parallel truths.

### Phase 1 — stop the bleeding (low risk, no migration)
1. Make **every** issue path (platform + dashboard) also POST the cert to the attestation ledger at creation, so new certs are universally verifiable from day one.
2. Point all three `/verify` UIs at the attestation ledger (csoai.org already is; dashboard currently uses `coai.manus.space`, platform uses `Certificate.verify()`).

### Phase 2 — identity map (email as join key)
3. Stand up an `identity_map(email, mongo_user_id, mysql_user_id, attestation_subject_id, stripe_customer_id)` table (host it wherever ops is simplest — Postgres on csoai-org-v2 is fine). Backfill by email.
4. De-dupe Stripe customers by email; collapse to one `stripeCustomerId` per human in the map.

### Phase 3 — backfill & converge
5. Replay historical Mongo + MySQL certs into the attestation ledger (idempotent by content hash) so old certs become verifiable too.
6. Pick **one** system of record per record-type going forward (suggest: attestation ledger = certs; Mongo = tenants/B2B; MySQL = LMS/courses) and make the others read-through caches.

## Open decisions for Nick
- Confirm the **attestation ledger as canonical cert authority** (vs consolidating onto Mongo).
- Confirm **email** is an acceptable identity join key, or whether to mint a CSOAI DID per customer as the real primary key.
- Whether the three SQL/NoSQL engines stay (federated) or collapse to one — federation is cheaper now; collapse is cleaner long-term.

_This is a plan, not a migration. Nothing here has been executed._
