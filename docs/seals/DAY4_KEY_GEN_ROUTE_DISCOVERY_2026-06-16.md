# Day 4 — MEOK_MASTER_API_KEY Generation Route Discovery

**Date:** 2026-06-16  
**Author:** Hermes subagent (Move D4-D)  
**Source repo:** `/Users/nicholas/clawd/meok-attestation-api/`  
**Live spec:** `https://meok-attestation-api.vercel.app/openapi.json` (v1.2.0, 16,397 B)  
**Status:** ✅ Discovery complete. **The runbook's `/admin` URL is wrong** — no such route exists. Real path is below.

---

## 1. The truth about `MEOK_MASTER_API_KEY`

`MEOK_MASTER_API_KEY` is **not customer-mintable**. It is a **Vercel-side environment variable** on the `meok-attestation-api` project. There is no HTTP endpoint that *generates* it.

| Claim in runbook | Reality |
|---|---|
| `meok-attestation-api.vercel.app/admin` generates the master key | **404** — handler does not exist in code or OpenAPI spec |
| `meok-attestation-api.vercel.app/admin/keys` | **404** |
| `meok-attestation-api.vercel.app/api/admin`, `/api/keys`, `/api/v1/keys` | All **404** |
| `meok-attestation-api.vercel.app/manifest.json`, `/redoc` | **404** |

The variable is read on cold-start of the single Python handler `api/index.py` at line 85:

```python
_MASTER_KEY = os.environ.get("MEOK_MASTER_API_KEY", "")
```

It is used in **two** places, both as a break-glass support path:

1. **`_check_api_key()` (line 307)** — when validating the `X-API-Key` header on `POST /sign`, a matching master key resolves the caller as `tier=enterprise`.
2. **`/provision` handler (line 1497)** — when the `X-Master-Key` request header matches the env var, `/provision` can mint a **customer** API key for any `(email, tier)` pair without requiring a Stripe session id (used for support recovery — see `api/index.py` lines 1483-1485 comment).

### Where the key actually comes from

It was provisioned once, by hand, in the Vercel dashboard for the `meok-attestation-api` project, and lives there as an encrypted env var. The `BLOCKER_INVENTORY_2026-06-15.md` line 23 says:

> `MEOK_MASTER_API_KEY` is absent from the runtime … has been the #1 red line for ≥24h

So the credential exists in Nick's possession (1Password / GCP Secret Manager / wherever he stored the original `mk_…` he pasted on Day 2). The discovery task is: **find that value, paste it into `~/clawd/.env.local`**. The HTTP route was a red herring.

---

## 2. Live route probe results (all GET, all unauth)

| URL | Code | Body | Visible route hints |
|---|---|---|---|
| `/admin` | 404 | 40 B | `{"error": "Not found", "path": "/admin"}` |
| `/admin/keys` | 404 | 45 B | same shape |
| `/keys` | 404 | 39 B | same |
| `/api/admin` | 404 | 44 B | same |
| `/api/admin/keys` | 404 | 49 B | same |
| `/api/keys` | 404 | 43 B | same |
| `/api/v1/keys` | 404 | 46 B | same |
| `/manifest.json` | 404 | 48 B | same |
| `/openapi.json` | **200** | 16,397 B | Full spec — only 17 paths, none are key-gen |
| `/docs` | **200** | 2,350 B | HTML — Swagger UI mirror of `/openapi.json` |
| `/redoc` | 404 | 40 B | — |

### All 17 routes exposed by the live API (from `/openapi.json`)

| Method | Path | Purpose |
|---|---|---|
| GET  | `/` | Root — HTML docs + catalogue |
| GET  | `/health` | Liveness probe (also returns `kid`) |
| GET  | `/openapi.json` | The spec itself |
| GET  | `/docs` | Swagger-UI HTML |
| GET  | `/robots.txt`, `/llms.txt` | SEO / crawler surface |
| GET  | `/pubkey` | **Ed25519 public key** (kid = `d4cb0eaa`) |
| POST | `/sign` | Issue signed attestation (auth required) |
| POST | `/verify` | Verify a signed cert (public, no auth) |
| GET  | `/verify/{cert_id}` | HTML verify page |
| GET  | `/v/{cert_id}` | Short alias for `/verify/{cert_id}` |
| POST | `/provision` | **Mint customer API key** (Stripe session OR `X-Master-Key`) |
| GET  | `/api/audit` | Append-only signed audit ledger |
| GET  | `/api/webhooks/list` | List webhooks for an API key |
| POST | `/api/webhooks/subscribe` | Subscribe a webhook URL |
| POST | `/api/webhooks/unsubscribe` | Disable a webhook |
| POST | `/acp` | Agent Communication Protocol (Move #9) |
| POST | `/webhook`, `/payg/webhook` | Stripe-signed webhooks |
| GET  | `/payg/balance` | PAYG balance lookup |

**Zero** admin/key-gen/mint-token routes. The only path that mints customer API keys is **`POST /provision`**, and it requires either a verified paid Stripe Checkout Session id OR the `MEOK_MASTER_API_KEY` value as the `X-Master-Key` request header.

---

## 3. Curl one-liner to mint a new customer key (using the master key)

**Use case:** Nick has the `MEOK_MASTER_API_KEY` value in 1Password and wants to mint a key for himself (or a support-recovery customer) **without** needing a fresh Stripe checkout.

```bash
curl -s -X POST https://meok-attestation-api.vercel.app/provision \
  -H "Content-Type: application/json" \
  -H "X-Master-Key: $MEOK_MASTER_API_KEY" \
  -d '{"email":"nicholas@meok.ai","tier":"pro"}'
```

**Expected response (200):**

```json
{
  "email": "nicholas@meok.ai",
  "tier": "pro",
  "api_key": "meok_pro_<24 hex chars>",
  "via": "master_key",
  "note": "Provisioned via master-key recovery path. Store this api_key securely."
}
```

**Key derivation** (from `api/index.py` lines 112-117) — the key is **deterministic**:

```python
def derive_api_key(email, tier="pro"):
    norm = f"{email.strip().lower()}|{tier.strip().lower()}"
    h = hmac.new(_API_KEY_PEPPER, norm.encode("utf-8"), hashlib.sha256).hexdigest()
    return f"meok_{tier}_{h[:24]}"
```

So for the same `(email, tier)` pair + the same `MEOK_API_KEY_PEPPER` env var (set on the Vercel project), the same key is returned every time. This is by design — keys survive deploys without a DB.

**Alternative mint path (Stripe-backed, customer self-serve):**

```bash
curl -s -X POST https://meok-attestation-api.vercel.app/provision \
  -H "Content-Type: application/json" \
  -d '{"session_id":"cs_live_…from_checkout_success_url"}'
```

This does **not** require the master key — it verifies the session with Stripe (`status=complete` + `payment_status=paid`) and mints the key from Stripe's authoritative email + tier.

---

## 4. Curl to verify the new key works

Two verification layers:

### (a) The new API key is accepted by `/sign` (Pro-tier smoke test)

```bash
NEW_KEY="meok_pro_…pasted from /provision response…"
curl -s -X POST https://meok-attestation-api.vercel.app/sign \
  -H "Content-Type: application/json" \
  -d "{
    \"api_key\":\"$NEW_KEY\",
    \"email\":\"nicholas@meok.ai\",
    \"regulation\":\"EU-AI-Act\",
    \"entity\":\"acme-test\",
    \"score\":99.5,
    \"findings\":[\"smoke-test\"],
    \"articles_audited\":[\"Art.9\"]
  }"
```

**Expected (200):** cert with `cert_id`, `signature_sha256_hmac`, `signature_ed25519`, `signing_pubkey_id: "d4cb0eaa"`, `pubkey_url: "https://meok-attestation-api.vercel.app/pubkey"`.

### (b) The signed cert is verifiable end-to-end (public, no auth)

```bash
curl -s -X POST https://meok-attestation-api.vercel.app/verify \
  -H "Content-Type: application/json" \
  -d @<(curl -s -X POST https://meok-attestation-api.vercel.app/sign \
        -H "Content-Type: application/json" \
        -d "{\"api_key\":\"$NEW_KEY\",\"email\":\"nicholas@meok.ai\",\"regulation\":\"EU-AI-Act\",\"entity\":\"acme-test\",\"score\":99.5,\"findings\":[\"smoke\"],\"articles_audited\":[\"Art.9\"]}")
```

**Expected (200):** `{"valid": true, "kid": "v1", "ed25519_valid": true, ...}`

### (c) The HTML verify page works (no auth, auditor-friendly)

```bash
curl -s -I "https://meok-attestation-api.vercel.app/verify/<cert_id_from_sign_response>"
```

**Expected:** `HTTP/2 200`, `content-type: text/html; charset=utf-8`.

---

## 5. Current public-key fingerprint / kid (algorithm reference)

Captured live from `https://meok-attestation-api.vercel.app/pubkey` and `/health` on **2026-06-15 14:02 UTC**:

| Field | Value | Source |
|---|---|---|
| **HMAC-SHA256 kid** | `v1` | `/health` returns `kid` field; `MEOK_ATTESTATION_KID` env var defaults to `"v1"` |
| **Ed25519 identity** | `d4cb0eaa` | Hard-coded in `api/index.py` line 140 (`_ED25519_IDENTITY`); also in `/pubkey` response |
| **Ed25519 pubkey (hex)** | `4bbb8e375683dd84aa3dac3b2b1036f2c6ef074384148b380efb95029eb91815` | `MEOK_PUBKEY_HEX` env var; live at `/pubkey` |
| **Algorithm** | Ed25519 (asymmetric, offline-verifiable) + HMAC-SHA256 (server-side, requires trust) | `api/_crypto.py` + `api/index.py` line 132 |
| **Service version** | 1.2.0 | `/health.version` |
| **ed25519 enabled** | `true` | `/health.ed25519` |

**Quick fingerprint confirmation:**

```bash
curl -s https://meok-attestation-api.vercel.app/pubkey
# Expected: {"alg":"Ed25519","identity":"d4cb0eaa","pubkey_hex":"4bbb8e375683dd84aa3dac3b2b1036f2c6ef074384148b380efb95029eb91815",...}

curl -s https://meok-attestation-api.vercel.app/health
# Expected: {"ok":true,"status":"ok","service":"meok-attestation-api","kid":"v1","version":"1.2.0","ed25519":true}
```

If either of those returns a different `kid` or `pubkey_hex` than above, **the signing key has been rotated** and any pre-rotation signed certs need to be re-issued. (Old certs stay verifiable for HMAC because the canonical payload + new HMAC key will not match — but Ed25519-signed certs are still verifiable offline against the **old** pubkey if you have it cached.)

---

## 6. What Nick should actually do (corrected Day-4 Action 2)

The runbooks (`DAY2_HUMAN_GATE_RUNBOOK_2026-06-15.md` line 39, `DAY6_ALIGN_REPORT_2026-06-15.md` line 48, `RUNBOOK_5MIN_HUMAN_GATE_2026-06-15.md` line 87) all claim the key is at `…/admin`. **It is not.** Replace those instructions with:

### Correct procedure

1. **Locate the value** in 1Password (search `MEOK_MASTER_API_KEY` or `meok-attestation-api master`). Per `BLOCKER_INVENTORY_2026-06-15.md` it was originally `mk_…`-prefixed.
2. **Open `~/clawd/.env.local`** and append the line (preserves the existing `EMAIL_*` / `RESEND_API_KEY` etc.):
   ```bash
   echo "MEOK_MASTER_API_KEY=mk_xxxxxxxxxxxxxxxxxxxx" >> ~/clawd/.env.local
   ```
3. **Sanity-check it's in place:**
   ```bash
   grep '^MEOK_MASTER_API_KEY' ~/clawd/.env.local | sed 's/=.*/=<REDACTED>/'
   # Expected: MEOK_MASTER_API_KEY=<REDACTED>
   ```
4. **Live confirm the Vercel env matches** (so the local copy is also usable for keystone signing calls that go through the sovereign-temple):
   ```bash
   vercel env pull --environment=production --yes
   grep '^MEOK_MASTER_API_KEY' .env.production.local | sed 's/=.*/=<REDACTED>/'
   ```
5. **Run the smoke test** (mint a fresh pro key for himself, sign a cert, verify the cert):
   ```bash
   NEW_KEY=$(curl -s -X POST https://meok-attestation-api.vercel.app/provision \
     -H "Content-Type: application/json" \
     -H "X-Master-Key: $MEOK_MASTER_API_KEY" \
     -d '{"email":"nicholas@meok.ai","tier":"pro"}' | jq -r .api_key)
   echo "Minted: $NEW_KEY"
   # Paste it into ~/clawd/.env.local as MEOK_API_KEY_PRO=...
   ```
6. **Mark Action 2 done** in the Day-3 pre-flight; the "PARTIAL" status flips to ✅.

### What this **does not** require

- ❌ No new Vercel deploy (`meok/AGENTS.md` warns deploys are blocked by edge WAF `x-vercel-mitigated: deny` for 24-48h post-2026-06-13).
- ❌ No new code changes — the `/provision` handler is already live in production v1.2.0.
- ❌ No new secrets — the master key already lives in Vercel; we are only synchronising the local copy.

### What this **does** unlock

Per `BLOCKER_INVENTORY_2026-06-15.md` line 23 + `DAY3_LAYER4_SOV3_AUDIT_2026-06-16.md` line 95:
- Pro-tier keystone signing (£199/mo tier)
- 4 paywalled MCP tools (DORA audit, UK AI Bill sign, Annex IV docs, full audit report)
- Stripe live wire (`openpatent-revenue-cron` sigil line 16, `sigil-chain-integrity-2026-06-14.md`)
- Self-serve / support-recovery customer key minting via the master key path

---

## 7. Probe source files (read-only, no modifications)

- `api/index.py` lines 1-180 (env loading + key derivation)
- `api/index.py` lines 1040-1110 (GET handlers for `/health`, `/pubkey`, `/openapi.json`, `/docs`, `/robots.txt`)
- `api/index.py` lines 1476-1549 (`/provision` POST handler, 3 paths)
- `api/index.py` lines 1556-1625 (`/sign` POST handler, validates api_key via `_check_api_key` at line 305-318)
- `api/_crypto.py` (Ed25519 signing primitive, 26-60)
- `api/_openapi_data.py` (the live spec source)
- `vercel.json` (rewrite rules — all dynamic paths route to `api/index.py`)
- `openapi.json` (16,397 B local copy matches live spec)

---

## TL;DR (for Nick)

- **The `/admin` URL in every runbook is wrong.** That endpoint does not exist.
- **The `MEOK_MASTER_API_KEY` is a Vercel env var, not customer-mintable.** Find it in 1Password, paste it into `~/clawd/.env.local`.
- **The mint route IS `POST /provision`** — it returns a deterministic `meok_<tier>_<24hex>` key derived from `(email, tier) + MEOK_API_KEY_PEPPER`. Call it with `X-Master-Key: $MEOK_MASTER_API_KEY` for break-glass support, or with a `session_id` from a paid Stripe checkout for self-serve.
- **Verify the new key by `POST /sign` then `POST /verify`** (full cert round-trip).
- **Current signing keys are stable: `kid: v1`, ed25519 identity `d4cb0eaa`, ed25519 pubkey `4bbb8e375683dd84aa3dac3b2b1036f2c6ef074384148b380efb95029eb91815`** — confirmed live 2026-06-15 14:02 UTC.
