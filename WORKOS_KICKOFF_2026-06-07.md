# WorkOS Kickoff — MEOK OAuth 2.1 + MCP Auth (RFC 8707) Integration

**Status:** Spike complete (`OAUTH_BUILD_VS_BUY_SPIKE_2026-06-07.md` recommended WorkOS).
**Owner:** Nick (account creation + production keys).
**Scope:** 7-day kickoff — fully integrated dev + staging by end of week.

## TL;DR

Pick WorkOS because:
- $125/mo flat fee (predictable; no per-MAU surprise)
- Explicit MCP support (RFC 8707 Resource Indicators)
- SSO + SCIM + Magic Link + AuditLogs in one product
- Drop-in OIDC + SAML at no extra cost (Auth0 charges for SAML)
- Free tier covers up to 1M MAU on Magic Link auth

## Pre-requisites (Nick does these)

- [ ] Sign up at https://workos.com/signup using nicholas@meok.ai
- [ ] Add CSOAI LTD as the organisation (use Companies House 16939677 as the legal entity)
- [ ] In Dashboard → Developer → Add the following redirect URIs:
  - `http://localhost:3000/callback` (dev)
  - `https://haulage.app/callback`
  - `https://meok-attestation-api.vercel.app/callback`
  - `https://meok.ai/callback`
- [ ] Generate API key → drop into Vercel envs as `WORKOS_API_KEY` + `WORKOS_CLIENT_ID`
- [ ] Pick Magic Link as the default auth method (zero friction, no password recovery flows)
- [ ] (Optional) Add Google + GitHub as social connections

## Day-by-day plan

### Day 1 — Account + env

- Nick completes account creation + API key dropping
- Add envs to Vercel:
  ```bash
  vercel env add WORKOS_API_KEY production
  vercel env add WORKOS_CLIENT_ID production
  vercel env add WORKOS_COOKIE_PASSWORD production    # generate via openssl rand -base64 32
  ```
- Test API key with `curl -H "Authorization: Bearer $WORKOS_API_KEY" https://api.workos.com/user_management/users`

### Day 2 — Backend wiring (Python)

In `meok-attestation-api/api/_auth.py`:

```python
"""WorkOS auth helper. Validates Authorization: Bearer <session_token>."""
import os
import json
import urllib.request

WORKOS_API_KEY = os.environ.get("WORKOS_API_KEY", "")
WORKOS_BASE = "https://api.workos.com"


def authenticate_with_session(session_token: str) -> dict | None:
    """Return user dict or None. Used in BaseHTTPRequestHandler do_POST/do_GET."""
    if not session_token or not WORKOS_API_KEY:
        return None
    req = urllib.request.Request(
        f"{WORKOS_BASE}/user_management/authenticate",
        data=json.dumps({"client_id": os.environ["WORKOS_CLIENT_ID"], "session_token": session_token}).encode("utf-8"),
        headers={
            "Authorization": f"Bearer {WORKOS_API_KEY}",
            "Content-Type": "application/json",
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=5) as r:
            data = json.loads(r.read().decode("utf-8"))
            return data.get("user")
    except Exception:
        return None


def is_authenticated(handler) -> bool:
    """Convenience for handlers. Pulls Authorization header."""
    bearer = handler.headers.get("Authorization", "")
    if not bearer.lower().startswith("bearer "):
        return False
    token = bearer.split(" ", 1)[1].strip()
    user = authenticate_with_session(token)
    if not user:
        return False
    # Stash user on the handler so downstream code can read it
    handler._workos_user = user
    return True
```

Wire it into `api/index.py` for the protected endpoints (`/api/admin/*`, etc.). Public read endpoints (`/health`, `/verify`, `/openapi.json`, `/catalogue.json`) stay anonymous.

### Day 3 — Frontend wiring (React)

In `haulage-deploy/src/hooks/useAuth.ts`:

```typescript
import { useEffect, useState } from "react";

const API = "https://meok-attestation-api.vercel.app";

export function useAuth() {
  const [user, setUser] = useState<{ email: string; first_name?: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("meok_session");
    if (!token) {
      setLoading(false);
      return;
    }
    fetch(`${API}/api/auth/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => (r.ok ? r.json() : null))
      .then((u) => setUser(u))
      .finally(() => setLoading(false));
  }, []);

  const login = (email: string) => {
    // WorkOS Magic Link
    fetch(`${API}/api/auth/magic-link`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
  };

  const logout = () => {
    localStorage.removeItem("meok_session");
    setUser(null);
  };

  return { user, loading, login, logout };
}
```

### Day 4 — MCP RFC 8707 Resource Indicators

Each MCP server announces itself as a Resource. Update each MCP's manifest:

```json
{
  "name": "meok-tacho-audit-mcp",
  "auth": {
    "type": "oauth2.1",
    "resource_indicator": "https://meok-attestation-api.vercel.app/mcp/tacho-audit",
    "issuer": "https://api.workos.com",
    "scopes_supported": ["tacho.read", "tacho.write", "audit.sign"]
  }
}
```

WorkOS will issue tokens with `aud=<resource_indicator>` per RFC 8707. The MCP server validates the audience claim before honouring the request.

### Day 5 — SCIM provisioning for fleet customers

When a fleet customer signs up at `/signup?plan=fleet`:

1. Webhook fires → `api/_workos_provision.py` creates a WorkOS Organization
2. Customer's IdP (Okta / Azure AD / Google Workspace) gets a SCIM endpoint pointing at `https://api.workos.com/scim/v2/{org_id}`
3. Drivers + admins auto-provisioned + de-provisioned from MEOK as IdP changes

Sample provision call:

```python
def create_org_with_scim(name: str, domain: str) -> dict:
    req = urllib.request.Request(
        f"{WORKOS_BASE}/organizations",
        data=json.dumps({
            "name": name,
            "domains": [domain],
            "allow_profiles_outside_organization": False,
        }).encode("utf-8"),
        headers={"Authorization": f"Bearer {WORKOS_API_KEY}", "Content-Type": "application/json"},
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=5) as r:
        return json.loads(r.read().decode("utf-8"))
```

### Day 6 — Audit log ingestion

WorkOS AuditLogs auto-tracks: login, logout, MFA enrolment, SSO connection events, SCIM provisioning.

Stream them into `meok-attestation-api/_audit_ledger.py`:

```python
def ingest_workos_audit_event(event: dict) -> None:
    """Sign each WorkOS audit event with our HMAC chain so customers can verify."""
    payload = {
        "source": "workos",
        "event_type": event["action"],
        "user_id": event.get("actor", {}).get("id"),
        "org_id": event.get("organization_id"),
        "timestamp": event["occurred_at"],
        "payload_hash": _hash(json.dumps(event, sort_keys=True)),
    }
    sig = sign_attestation(payload)
    write_ledger_entry(payload, sig)
```

Now MEOK customers get one verifiable audit ledger of both: MEOK API calls + identity events. Both signed by MEOK key.

### Day 7 — Production cutover

- [ ] Deploy attestation API with auth helper wired up
- [ ] Deploy haulage-deploy with useAuth + login modal
- [ ] Send test Magic Link → end-to-end login
- [ ] Update /docs/auth.html on meok.ai explaining the OAuth 2.1 + RFC 8707 + SCIM model
- [ ] Update /trust page to flip the OAuth 2.1 line from "Build-vs-buy spike scheduled" → "Live (WorkOS)"
- [ ] Update /accreditations to add WorkOS as a sub-processor (SOC 2 Type 2 + ISO 27001 — they hand us their badges)
- [ ] Update privacy + DPA pages with WorkOS DPA reference

## Cost projection (12 months)

| Item | Monthly | Annual |
|---|---|---|
| WorkOS base | $125 | $1,500 |
| MAU (target 5,000 by Q3) | $0 (under 1M Magic Link MAU free tier) | $0 |
| SAML connections | $0 (included) | $0 |
| SCIM | $0 (included) | $0 |
| AuditLogs | $0 (included) | $0 |
| **Total** | **$125** | **$1,500** |

Compare to Auth0: $240/mo + $0.023/MAU = $355/mo at 5k MAU → $4,260/yr. **WorkOS saves $2,760/year.**

## Risk register

| Risk | Mitigation |
|---|---|
| Magic Link delivery fails (corporate filters) | Add Google + GitHub OAuth as fallback |
| WorkOS price change post-launch | API has stable v1; 6-month notice in contract |
| Vendor lock-in | OIDC + SAML compliant — can migrate to Keycloak/Authentik in <2 weeks |
| GDPR data residency | WorkOS EU region available; flip in dashboard |

## Definition of done

- [x] Spike doc decision: WorkOS chosen
- [ ] Account created + API key dropped
- [ ] Backend auth helper wired
- [ ] Frontend useAuth hook
- [ ] MCP RFC 8707 resource indicators announced
- [ ] SCIM org provisioning live
- [ ] Audit log ingestion signing into MEOK chain
- [ ] /trust + /accreditations updated
- [ ] First customer-side SSO connection (live customer or test IdP)

## After kickoff

- M+1: Add Stripe customer email → WorkOS user auto-link
- M+1: PWA push-notification subscription tied to WorkOS user
- M+2: First fleet customer SAML connection (target: a logistics group >100 drivers)
- M+3: SOC 2 Type 1 letter references WorkOS as sub-processor with their attestation

## Decisions still open

1. Magic Link only vs Magic Link + password fallback — recommend Magic Link only (security + simplicity)
2. Free tier customers vs Pro/Team only — recommend gate API key issuance behind any tier including Free (free = self-serve via Magic Link, no API key by default)
3. Single org per Stripe customer vs per email — recommend per-Stripe-customer to align with billing
