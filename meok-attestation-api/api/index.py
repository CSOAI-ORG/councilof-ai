"""
MEOK Attestation API — Vercel serverless function
==================================================
Public signing + verification surface for MEOK compliance attestations.

Routes (single-file dispatched via the path):
  GET  /                     — docs + health
  POST /sign                 — issue a signed attestation (requires api_key)
  POST /verify               — verify a full cert payload
  GET  /verify/<cert_id>     — HTML verify page (human-readable)
  GET  /v/<cert_id>          — alias for /verify/<cert_id>
  GET  /health               — liveness

The signing key lives ONLY on the server (MEOK_ATTESTATION_KEY env var). Clients
never see it. Every cert comes with a signature_sha256_hmac that any third party
can cross-check by POSTing back to /verify with the full cert.

Pricing alignment: Starter £29/mo; Pro £79/mo; Enterprise £1499/mo; 48h Gap Analysis £5000.
"""

from __future__ import annotations

import base64
import hashlib
import hmac
import html as _html
import json
import os
import secrets
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime, timedelta, timezone
from http.server import BaseHTTPRequestHandler
from typing import Any, Optional


# ── Server-side signing key (NEVER share this) ─────────────────────────
# V-01 FIX: REQUIRE the key at module load. NO dev-placeholder fallback.
# A missing env var must FAIL LOUDLY at boot, not silently sign with a guessable
# key. This kept the dev-placeholder forgeable by anyone who could read source.
_SIGNING_KEY_ENV = os.environ.get("MEOK_ATTESTATION_KEY", "")
if not _SIGNING_KEY_ENV:
    # Allow boot in CI / local-dev with a clearly tagged ephemeral key,
    # but mark it so it can NEVER be confused with a production signature.
    if os.environ.get("MEOK_ALLOW_EPHEMERAL_SIGNING_KEY") == "1":
        _SIGNING_KEY = hashlib.sha256(("EPHEMERAL-" + secrets.token_hex(16)).encode()).digest()
        _SIGNING_KEY_KID = "ephemeral-dev"
    else:
        # Hard fail at module load. Vercel will surface this as a 500 + log.
        raise RuntimeError(
            "MEOK_ATTESTATION_KEY environment variable is required. "
            "Set in Vercel project settings, or set MEOK_ALLOW_EPHEMERAL_SIGNING_KEY=1 "
            "for dev (signatures will not survive process restart)."
        )
else:
    _SIGNING_KEY = _SIGNING_KEY_ENV.encode("utf-8")
    _SIGNING_KEY_KID = os.environ.get("MEOK_ATTESTATION_KID", "v1")

_VERIFY_BASE = os.environ.get("MEOK_VERIFY_URL", "https://meok-attestation-api.vercel.app/verify")

# V-01 FIX (continued): pepper must also be set explicitly. The fallback
# `b"meok-pepper-rotate"` was identical across deploys → API keys were
# predictable for any email if the source was leaked.
_API_KEY_PEPPER_ENV = os.environ.get("MEOK_API_KEY_PEPPER", "")
if not _API_KEY_PEPPER_ENV:
    if os.environ.get("MEOK_ALLOW_EPHEMERAL_SIGNING_KEY") == "1":
        _API_KEY_PEPPER = ("EPHEMERAL-" + secrets.token_hex(16)).encode("utf-8")
    else:
        raise RuntimeError("MEOK_API_KEY_PEPPER environment variable is required.")
else:
    _API_KEY_PEPPER = _API_KEY_PEPPER_ENV.encode("utf-8")

# Pro tier keys (dev — production will live in a secrets store + lookup service).
# Each starts "meok_" and is 32 hex chars. Accept any key in MEOK_PRO_KEYS (CSV).
_PRO_API_KEYS = set(
    k.strip() for k in os.environ.get("MEOK_PRO_KEYS", "").split(",") if k.strip()
)
# MASTER key always allowed (Nick's own use). Rotate periodically.
_MASTER_KEY = os.environ.get("MEOK_MASTER_API_KEY", "")

# Stripe webhook signing secret (used to verify POSTs to /webhook).
_STRIPE_WEBHOOK_SECRET = os.environ.get("STRIPE_WEBHOOK_SECRET", "")

# V-03 FIX: Stripe live secret key for /provision session_id verification.
# Without this, /provision falls back to master-key-only mode (no self-serve).
_STRIPE_SECRET_KEY = os.environ.get("STRIPE_SECRET_KEY", "")

# ── PAYG (pay-per-call) configuration ────────────────────────────────────
# Pay-per-call billing via MEOK_PAYG_KEY. Stripe is the database: customer
# metadata holds the token + balance. See _payg_* helpers below.
_PAYG_RATE_GBP = float(os.environ.get("MEOK_PAYG_RATE_GBP", "0.05"))
_PAYG_TOPUP_URL = os.environ.get("MEOK_PAYG_TOPUP_URL", "https://councilof.ai/payg")
_PAYG_NOTIFY_EMAIL = os.environ.get("MEOK_NOTIFY_EMAIL", "nicholas@meok.ai")
_RESEND_API_KEY = os.environ.get("RESEND_API_KEY", "")

# V-03 FIX: gate self-serve /provision on real Stripe session verification.
# ALWAYS REQUIRED. The legacy email-only fallback (Path 2) has been removed.
# _PROVISION_REQUIRE_SESSION is always True; env var MEOK_PROVISION_REQUIRE_SESSION_ID ignored.
_PROVISION_REQUIRE_SESSION = True  # Force-secure — legacy bypass removed.


# ── Deterministic API key derivation ───────────────────────────────────
# Any customer with a valid (email, session_id) pair can retrieve their key by
# POSTing to /provision. Keys are HMAC-derived from (email, tier) + pepper so
# they're stable across deploys without needing a DB.
def derive_api_key(email: str, tier: str = "pro") -> str:
    """Deterministic Pro-tier key: meok_pro_<24 hex>. Regenerates identically
    as long as _API_KEY_PEPPER env var is unchanged."""
    norm = f"{email.strip().lower()}|{tier.lower()}"
    h = hmac.new(_API_KEY_PEPPER, norm.encode("utf-8"), hashlib.sha256).hexdigest()
    return f"meok_{tier.lower()}_{h[:24]}"


# Recognise a derived key as valid for its tier
def derived_key_valid(api_key: str, email: str, tier: str = "pro") -> bool:
    return hmac.compare_digest(api_key or "", derive_api_key(email, tier))


# ── Crypto helpers ─────────────────────────────────────────────────────
def _canonical_payload(payload: dict[str, Any]) -> bytes:
    """Deterministic JSON for stable signatures."""
    return json.dumps(payload, sort_keys=True, separators=(",", ":")).encode("utf-8")


def _sign_bytes(data: bytes) -> str:
    return hmac.new(_SIGNING_KEY, data, hashlib.sha256).hexdigest()


def _is_valid_email(email: str) -> bool:
    """Cheap email syntax check. Real validation happens at signup time elsewhere."""
    if not email or len(email) > 254:
        return False
    parts = email.split("@")
    return len(parts) == 2 and "." in parts[1] and len(parts[0]) > 0


# ── Post-purchase welcome email via Resend (no-op if RESEND_API_KEY unset) ──
_RESEND_API_KEY = os.environ.get("RESEND_API_KEY", "")
_MEOK_FROM_EMAIL = os.environ.get("MEOK_FROM_EMAIL", "MEOK AI Labs <hello@meok.ai>")

def _send_welcome_email(email: str, tier: str, api_key: str, mcp_slug: str = "", session_id: str = "") -> bool:
    """Fires a Day-0 welcome email via Resend HTTP API.

    Returns True on send, False on any error (logged, never raises). If
    RESEND_API_KEY is unset, no-ops cleanly so dev / local works.

    Day 3 + Day 10 follow-ups require a scheduled-task store — see
    REVENUE_NEXT_LEVEL_2026-05-16.md §3 for the deferred plan.
    """
    if not _RESEND_API_KEY:
        print(f"[EMAIL-NOOP] no RESEND_API_KEY set; would have emailed {email}")
        return False
    if not _is_valid_email(email):
        print(f"[EMAIL-SKIP] invalid email: {email!r}")
        return False

    mcp_display = mcp_slug or "MEOK MCPs"
    install_line = f"uvx {mcp_slug}-mcp" if mcp_slug else "npx meok-setup --pack all"
    receipt_session = (session_id or "")[:40]

    subject = f"Welcome to MEOK AI Labs — your {tier.title()} signing key is ready"
    text_body = f"""Hi,

Welcome to MEOK AI Labs! Your subscription to {mcp_display} is active.

— Your {tier.title()}-tier HMAC signing key —
{api_key}

— Install —
{install_line}

— First signed attestation —
Set MEOK_PRO_KEY=<your key> in your environment, then call any sign_* tool.
Every attestation lands in your tamper-evident audit log automatically.

— Free trial —
You're on the 14-day free trial. Card won't be charged until day 15.
Cancel anytime from your Stripe receipt email — no questions.

— Need help? —
Reply to this email or hit hello@meok.ai. Real human response within 24h.

— What's next —
1. Install the MCP using the snippet above
2. Run your first signed audit
3. We'll check in on day 3 with quick wins

Thanks for backing this.
Nick + the MEOK AI Labs team
https://meok.ai

Session ref: {receipt_session}
"""
    payload = json.dumps({
        "from": _MEOK_FROM_EMAIL,
        "to": [email],
        "subject": subject,
        "text": text_body,
        "tags": [
            {"name": "type", "value": "welcome_day_0"},
            {"name": "tier", "value": tier.lower()},
            {"name": "mcp_slug", "value": mcp_slug or "unknown"},
        ],
    }).encode("utf-8")

    req = urllib.request.Request(
        "https://api.resend.com/emails",
        data=payload,
        method="POST",
        headers={
            "Authorization": f"Bearer {_RESEND_API_KEY}",
            "Content-Type": "application/json",
        },
    )
    try:
        with urllib.request.urlopen(req, timeout=8) as resp:
            ok = 200 <= resp.status < 300
            if ok:
                print(f"[EMAIL-SENT] welcome to {email} (tier={tier}, mcp={mcp_slug})")
            else:
                print(f"[EMAIL-FAIL] status={resp.status} email={email}")
            return ok
    except urllib.error.HTTPError as e:
        print(f"[EMAIL-FAIL] HTTPError {e.code}: {e.read()[:200]!r} email={email}")
        return False
    except Exception as e:
        print(f"[EMAIL-FAIL] {type(e).__name__}: {e} email={email}")
        return False


def _capture_free_tier_lead(email: str, regulation: str = "", entity: str = "") -> None:
    """Log free-tier signups so Nick can grep Vercel logs for leads.

    Vercel surfaces print() output in the project's Logs view. This is the
    minimum-viable lead capture: every free-tier /sign call produces a
    structured log line tagged [FREE_TIER_LEAD] that we can query later.

    For real CRM integration, swap this body for a POST to a Slack webhook,
    Notion page, Airtable row, or Stripe customer-creation call.
    """
    print(
        f"[FREE_TIER_LEAD] email={email} regulation={regulation} entity={entity} "
        f"ts={datetime.now(timezone.utc).isoformat()}"
    )


def _check_api_key(api_key: str, email: str = "") -> tuple[bool, str, str]:
    """Returns (allowed, message, resolved_tier).

    V-07 FIX: tier is RESOLVED server-side from the key itself, never trusted
    from request body. Previously a Pro key could sign a cert claiming tier=
    enterprise because we passed body['tier'] straight through to the payload.

    Tier resolution order:
      master key → 'enterprise' (Nick / internal)
      explicit allowlist key in MEOK_PRO_KEYS env → 'pro'
      derived key matching email + 'enterprise' → 'enterprise'
      derived key matching email + 'pro' → 'pro'
      email-only (valid format, no api_key) → 'free' (lead-capture path)
      otherwise reject
    """
    if not api_key:
        # FREE TIER PATH: allow if a valid email is provided. The /sign handler
        # will produce a tier='free' attestation and capture the lead via
        # _capture_free_tier_lead(). No api_key issued here — Pro features
        # (custom verify domain, full HMAC trust marker) still require checkout.
        if email and _is_valid_email(email):
            return True, "OK (free-tier lead-capture path)", "free"
        return False, (
            "Missing email. Free tier: pass {email: 'you@company.com'} for instant "
            "signed attestation (lead-capture). Pro tier (\u00a379/mo): pass {api_key, email} "
            "for verifiable attestations on a custom domain. "
            "Pro checkout: https://buy.stripe.com/14A4gB3K4eUWgYR56o8k836"
        ), ""
    if _MASTER_KEY and hmac.compare_digest(api_key, _MASTER_KEY):
        return True, "OK (master)", "enterprise"
    if api_key in _PRO_API_KEYS:
        return True, "OK (allowlist pro)", "pro"
    # Check enterprise BEFORE pro (more privileged — but caller still must
    # provide a matching email which only customer knows)
    if email and derived_key_valid(api_key, email, tier="enterprise"):
        return True, "OK (derived enterprise)", "enterprise"
    if email and derived_key_valid(api_key, email, tier="pro"):
        return True, "OK (derived pro)", "pro"
    return False, "Invalid or unknown api_key. Contact hello@meok.ai or subscribe at https://buy.stripe.com/14A4gB3K4eUWgYR56o8k836", ""


# ── Stripe webhook signature verification (stdlib-only) ────────────────
def _verify_stripe_signature(payload: bytes, sig_header: str, secret: str) -> bool:
    """Mirror of stripe.Webhook.construct_event signature check — stdlib only.
    sig_header format: 't=TIMESTAMP,v1=SIGNATURE,...'. We accept the event if
    ANY v1 signature matches HMAC-SHA256(secret, f'{t}.{payload}').

    V-02 FIX: NO fail-open. Missing secret OR missing header → reject.
    Previously returned True if secret unset — meant a dropped env var would
    accept any forged webhook, including bogus checkout.session.completed
    events that would provision API keys for arbitrary emails.
    """
    if not secret:
        # Hard reject. If you genuinely need to test webhooks without a secret,
        # set MEOK_ALLOW_UNSIGNED_WEBHOOK=1 explicitly (dev only).
        if os.environ.get("MEOK_ALLOW_UNSIGNED_WEBHOOK") == "1":
            return True
        return False
    if not sig_header:
        return False
    parts = {}
    for kv in sig_header.split(","):
        if "=" in kv:
            k, v = kv.split("=", 1)
            parts.setdefault(k.strip(), []).append(v.strip())
    ts = (parts.get("t") or [""])[0]
    if not ts:
        return False
    # Reject ancient timestamps (replay protection — Stripe uses ±5min default).
    try:
        ts_int = int(ts)
        import time as _time
        if abs(_time.time() - ts_int) > 300:
            return False
    except (ValueError, TypeError):
        return False
    sigs = parts.get("v1") or []
    if not sigs:
        return False
    signed_payload = f"{ts}.".encode("utf-8") + payload
    expected = hmac.new(secret.encode("utf-8"), signed_payload, hashlib.sha256).hexdigest()
    return any(hmac.compare_digest(expected, s) for s in sigs)


# ── Stripe price-ID → tier mapping ─────────────────────────────────────
# Map Stripe price_id or product name → tier. Extend as new products ship.
_PRICE_TIER_MAP = {
    # Live price_ids (extend as new products ship). Override at runtime via
    # MEOK_PRICE_TIER_OVERRIDES env var (JSON dict) for emergencies.
    "price_pro_199": "pro",
    "price_team_499": "pro",
    "price_enterprise_1499": "enterprise",
    "price_assessment_5000": "pro",  # one-time buyers get 1-year pro as bundled value
    # 2026-04-26 new ladder
    "price_1TQNegQvIueK5Xpb4JMCREn5": "pro",  # £29 Starter (over-grant pro for now; tighten later)
    "price_1TQNeiQvIueK5XpbFB6iSl7P": "pro",  # £79 Pro
}
# Allow ops-time price → tier overrides via env (JSON). Last-write-wins.
try:
    _OVERRIDES = json.loads(os.environ.get("MEOK_PRICE_TIER_OVERRIDES", "") or "{}")
    if isinstance(_OVERRIDES, dict):
        _PRICE_TIER_MAP.update({str(k): str(v) for k, v in _OVERRIDES.items()})
except Exception:
    pass
_PRODUCT_NAME_TIER_MAP = {
    "MEOK Compliance Pro": "pro",
    "MEOK Pro": "pro",
    "Compliance Trinity Bundle": "pro",
    "MEOK Enterprise": "enterprise",
    "MEOK Enterprise Pack": "enterprise",
    "Enterprise Assessment": "pro",
    "Premium Enterprise Assessment": "enterprise",
    "EU AI Act Compliance Kit": "pro",
}


# ── PAYG (pay-per-call) helpers ─────────────────────────────────────────
# Storage = Stripe customer metadata. No external DB. Idempotent.
# metadata[meok_payg_token]   — UUID-shaped token (lives in env as MEOK_PAYG_KEY on the client)
# metadata[meok_payg_balance] — GBP remaining, as string
# metadata[meok_payg_last_*]  — audit fields

def _stripe_api_request(method: str, path: str, params: Optional[dict] = None) -> dict:
    """Stdlib-only Stripe REST client. Same shape as the helper in api/payg.py
    but inlined so this file doesn't depend on Vercel routing reaching payg.py."""
    if not _STRIPE_SECRET_KEY:
        raise RuntimeError("STRIPE_SECRET_KEY not set")
    url = f"https://api.stripe.com/v1{path}"
    data = urllib.parse.urlencode(params or {}).encode("utf-8") if params else None
    auth_header = "Basic " + base64.b64encode((_STRIPE_SECRET_KEY + ":").encode()).decode()
    req = urllib.request.Request(
        url,
        data=data,
        method=method.upper(),
        headers={
            "Authorization": auth_header,
            "Content-Type": "application/x-www-form-urlencoded" if data else "application/json",
        },
    )
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            return json.loads(resp.read())
    except urllib.error.HTTPError as e:
        try:
            err = json.loads(e.read())
        except Exception:
            err = {"error": {"message": f"HTTP {e.code}"}}
        raise RuntimeError(f"Stripe {method} {path}: {err}")


def _payg_calls_included(amount_gbp: float, rate: float = None) -> int:
    rate = rate or _PAYG_RATE_GBP
    return int(amount_gbp / rate) if rate > 0 else 0


def _payg_generate_token() -> str:
    return "payg_" + secrets.token_urlsafe(24)


def _payg_send_welcome(to_email: str, token: str, amount_gbp: float, balance_gbp: float) -> bool:
    """Best-effort welcome via Resend. Webhook still succeeds if this fails."""
    if not _RESEND_API_KEY or not to_email:
        return False
    body = (
        f"Thanks for your £{amount_gbp:.2f} top-up to MEOK PAYG.\n\n"
        f"Your token (treat like a password):\n\n"
        f"  MEOK_PAYG_KEY={token}\n\n"
        f"Set it in your environment and every call across the 7 MEOK compliance MCPs "
        f"will deduct from your balance:\n\n"
        f"  export MEOK_PAYG_KEY={token}\n"
        f"  export MEOK_PAYG_SERVER_URL=https://meok-attestation-api.vercel.app/payg\n"
        f"  pip install -U eu-ai-act-compliance-mcp\n\n"
        f"Balance now: £{balance_gbp:.2f} ({_payg_calls_included(balance_gbp)} calls).\n"
        f"Check anytime: GET https://meok-attestation-api.vercel.app/payg/balance?token={token}\n\n"
        f"Questions: reply to this email.\n— MEOK AI Labs"
    )
    try:
        urllib.request.urlopen(
            urllib.request.Request(
                "https://api.resend.com/emails",
                data=json.dumps({
                    "from": "MEOK AI Labs <payg@meok.ai>",
                    "to": [to_email, _PAYG_NOTIFY_EMAIL],
                    "subject": f"Your MEOK PAYG token — £{balance_gbp:.2f} balance",
                    "text": body,
                }).encode("utf-8"),
                headers={
                    "Authorization": f"Bearer {_RESEND_API_KEY}",
                    "Content-Type": "application/json",
                },
            ),
            timeout=10,
        )
        return True
    except Exception:
        return False


def _payg_lookup_customer_by_token(token: str) -> Optional[dict]:
    if not token:
        return None
    try:
        resp = _stripe_api_request(
            "GET",
            f"/customers/search?query=metadata['meok_payg_token']:'{token}'",
        )
        customers = resp.get("data", [])
        return customers[0] if customers else None
    except Exception:
        return None


def _extract_tier_from_checkout(session: dict) -> str:
    # Prefer line_items.price.id, fallback to description / product name
    line_items = (session.get("line_items") or {}).get("data", [])
    for item in line_items:
        price_id = (item.get("price") or {}).get("id") or ""
        if price_id in _PRICE_TIER_MAP:
            return _PRICE_TIER_MAP[price_id]
        desc = item.get("description") or ""
        for name, tier in _PRODUCT_NAME_TIER_MAP.items():
            if name.lower() in desc.lower():
                return tier
    return "pro"  # default


# ── V-03 FIX: real Stripe session verification for /provision ──────────
def verify_stripe_session(session_id: str) -> tuple[bool, str, str, str]:
    """Hit the live Stripe API to verify a checkout session is paid + complete.

    Returns: (ok, customer_email, tier, message)
        ok=True           → caller may issue the API key
        customer_email    → authoritative email from Stripe (NOT request body)
        tier              → resolved from line_items.price.id via _PRICE_TIER_MAP
        message           → human-readable status / error

    Network call uses stdlib urllib (no third-party dep). 5-second timeout.
    """
    if not _STRIPE_SECRET_KEY:
        return False, "", "", "Stripe verification unavailable (server misconfigured)."
    if not session_id or not session_id.startswith("cs_"):
        return False, "", "", "session_id must start with 'cs_' (Stripe checkout session)."

    url = (
        "https://api.stripe.com/v1/checkout/sessions/"
        + urllib.parse.quote(session_id, safe="")
        + "?expand[]=line_items"
    )
    auth_b64 = base64.b64encode(f"{_STRIPE_SECRET_KEY}:".encode("utf-8")).decode("ascii")
    req = urllib.request.Request(
        url,
        method="GET",
        headers={
            "Authorization": f"Basic {auth_b64}",
            "Stripe-Version": "2024-06-20",
            "User-Agent": "meok-attestation-api/1.0",
        },
    )
    try:
        with urllib.request.urlopen(req, timeout=5) as r:
            session = json.loads(r.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        body = ""
        try:
            body = e.read().decode("utf-8")[:200]
        except Exception:
            pass
        if e.code == 404:
            return False, "", "", f"Stripe session not found: {session_id[:16]}…"
        return False, "", "", f"Stripe lookup failed: HTTP {e.code} {body}"
    except Exception as e:
        return False, "", "", f"Stripe lookup error: {type(e).__name__}: {e}"

    # The session must be COMPLETE and PAID. expired / open / unpaid → reject.
    status = session.get("status") or ""
    payment_status = session.get("payment_status") or ""
    if status != "complete":
        return False, "", "", f"Session not complete (status={status!r}). Cannot provision."
    if payment_status not in ("paid", "no_payment_required"):
        return False, "", "", f"Session not paid (payment_status={payment_status!r}). Cannot provision."

    cust_email = (
        (session.get("customer_details") or {}).get("email")
        or session.get("customer_email")
        or ""
    )
    if not cust_email:
        return False, "", "", "Session has no customer email. Cannot provision."

    tier = _extract_tier_from_checkout(session)
    return True, cust_email.strip().lower(), tier, "OK"


def sign_attestation(
    regulation: str,
    entity: str,
    score: float,
    findings: list[str],
    articles_audited: Optional[list[str]] = None,
    tier: str = "pro",
    auditor_notes: str = "",
) -> dict[str, Any]:
    now = datetime.now(timezone.utc)
    expires = now + timedelta(days=365)

    # For free tier, the assessment carries an UNVERIFIED marker to devalue it
    raw_assessment = (
        "COMPLIANT" if score >= 70 else "PARTIAL" if score >= 40 else "NON_COMPLIANT"
    )
    assessment = (
        f"{raw_assessment} (UNVERIFIED — free tier)" if tier == "free" else raw_assessment
    )

    payload = {
        "regulation": regulation,
        "entity": entity,
        "score_percent": round(float(score), 2),
        "assessment": assessment,
        "findings": findings or [],
        "articles_audited": articles_audited or [],
        "issued_utc": now.isoformat(),
        "expires_utc": expires.isoformat(),
        "tier": tier,
        "issuer": "MEOK AI Labs",
        "issuer_url": "https://meok.ai",
        "auditor_notes": auditor_notes,
        "legal_notice": (
            "This attestation is an automated self-assessment. It does not substitute "
            "for a competent-authority determination, accredited third-party audit, or "
            "legal counsel. MEOK AI Labs provides no warranty of regulatory correctness."
        ),
    }

    canonical = _canonical_payload(payload)
    signature = _sign_bytes(canonical)

    # cert_id is derived from regulation prefix + first 12 hex of signature
    reg_prefix = "".join(c for c in regulation.upper() if c.isalnum())[:6] or "MEOK"
    cert_id = f"MEOK-{reg_prefix}-{signature[:12].upper()}"

    # Free tier: no verify_url (replaced with upgrade prompt), add limitation fields
    if tier == "free":
        return {
            "⚠️ FREE_TIER_NOTICE": (
                "This attestation is UNVERIFIED and cannot be shared with auditors. "
                "Upgrade to Pro for verifiable signatures your compliance team accepts."
            ),
            "free_tier_limit": "3 attestations per day",
            "attestations_today": 1,
            "upgrade_reason": (
                "Pro tier removes daily limits + adds verifiable signatures your auditor accepts"
            ),
            "cert_id": cert_id,
            "issued_utc": now.isoformat(),
            "expires_utc": expires.isoformat(),
            "payload": canonical.decode("utf-8"),
            "signature_sha256_hmac": signature,
            "verify_url_UNAVAILABLE": (
                "Public verify URLs are a Pro feature. Upgrade: "
                "https://buy.stripe.com/14A4gB3K4eUWgYR56o8k836"
            ),
            "assessment": assessment,
            "score_percent": payload["score_percent"],
            "regulation": regulation,
            "entity": entity,
            "tier": "free",
            "issuer": "MEOK AI Labs",
            "renewal_prompt": (
                f"This attestation expires {expires.strftime('%d %b %Y')}. Re-run the audit "
                "before then to keep continuous compliance evidence."
            ),
            "what_to_do_with_this": [
                "This free-tier cert has NO public verify URL — auditors cannot independently validate it",
                "Upgrade to Pro (£79/mo) for verifiable attestations: https://buy.stripe.com/14A4gB3K4eUWgYR56o8k836",
                "Enterprise (£1,499/mo) adds co-branded PDFs + webhook pushes to your Trust Center",
            ],
        }

    return {
        "cert_id": cert_id,
        "issued_utc": now.isoformat(),
        "expires_utc": expires.isoformat(),
        "payload": canonical.decode("utf-8"),
        "signature_sha256_hmac": signature,
        "verify_url": f"{_VERIFY_BASE}/{cert_id}",
        "assessment": assessment,
        "score_percent": payload["score_percent"],
        "regulation": regulation,
        "entity": entity,
        "tier": tier,
        "issuer": "MEOK AI Labs",
        "share_prompt": (
            f"Share this cert with your auditor at {_VERIFY_BASE}/{cert_id} — they can "
            "verify signature validity without contacting MEOK."
        ),
        "renewal_prompt": (
            f"This attestation expires {expires.strftime('%d %b %Y')}. Re-run the audit "
            "before then to keep continuous compliance evidence."
        ),
        "what_to_do_with_this": [
            "Share the verify_url with your auditor, board, or procurement team",
            "The HMAC signature is cryptographically binding — any tampering invalidates it",
            "Certificates expire 365 days from issue. Re-run the audit before expiry to maintain continuous evidence",
            "Enterprise tier unlocks co-branded PDFs + webhook pushes to your Trust Center",
        ],
    }


def verify_attestation(cert: dict[str, Any]) -> tuple[bool, str]:
    payload_str = cert.get("payload")
    sig = cert.get("signature_sha256_hmac")
    if not payload_str or not sig:
        return False, "Missing payload or signature"
    try:
        expected = _sign_bytes(payload_str.encode("utf-8"))
    except Exception as e:
        return False, f"Signature recomputation failed: {e}"
    if not hmac.compare_digest(expected, sig):
        return False, "Signature mismatch — cert tampered or wrong signing key"
    try:
        payload = json.loads(payload_str)
        expires = datetime.fromisoformat(payload["expires_utc"])
        if datetime.now(timezone.utc) > expires:
            return False, f"Cert expired on {payload['expires_utc']}"
    except Exception:
        return True, "Signature valid (expiry not checked — payload malformed)"
    return True, "Signature valid"


# ── HTML templates for verify page ─────────────────────────────────────
def _catalogue_html() -> str:
    """The public marketing / catalogue page for the MEOK compliance MCP product line.
    Schema.org JSON-LD for AI crawlers + AEO/SEO. Big CTAs for the 3 Stripe tiers."""
    mcps = [
        ("EU AI Act", "eu-ai-act-compliance-mcp", "Regulation (EU) 2024/1689 — 2 Aug 2026 enforcement, €35M / 7% penalty ceiling", True),
        ("DORA", "dora-compliance-mcp", "Regulation (EU) 2022/2554 — LIVE since 17 Jan 2025, 1% daily turnover for CTPPs", True),
        ("NIS2", "nis2-compliance-mcp", "Directive (EU) 2022/2555 — 160k entities across 18 sectors, €10M / 2% penalty", True),
        ("CRA", "cra-compliance-mcp", "Regulation (EU) 2024/2847 — 11 Dec 2027 full enforcement, €15M / 2.5% ceiling", True),
        ("CSRD", "csrd-compliance-mcp", "Directive (EU) 2022/2464 — 12 ESRS standards, double-materiality, iXBRL", True),
        ("AI-BOM", "ai-bom-mcp", "CycloneDX ML-BOM 1.6 + SPDX 3.0 + EU AI Act Annex IV + NIST AI RMF", True),
        ("UK AI Regulation", "uk-ai-bill-compliance-mcp", "White Paper five principles + AI Bill frontier-model readiness", True),
        ("DORA × NIS2", "dora-nis2-crosswalk-mcp", "Dual-compliance crosswalk for EU banks + insurers + CTPPs", True),
        ("AI Incident Reporting", "ai-incident-reporting-mcp", "One incident → EU AI Act Art 73 + DORA + NIS2 + GDPR + ISO 42001 + UK AISI clocks in parallel", True),
        ("Gods Eye", "gods-eye-geospatial-mcp", "Civilian open-source geospatial awareness + Care Membrane ethics gate", True),
        ("GDPR", "gdpr-compliance-mcp", "Art 30 processing records, Art 33 breach notification, DPIA + SCCs + IDTA", False),
        ("HIPAA", "hipaa-compliance-mcp", "Privacy/Security/Breach Notification Rule + BAA checker + PHI detector", False),
        ("SOC 2", "soc2-compliance-mcp", "Trust Services Criteria — Security, Availability, Confidentiality, PI, Privacy", False),
        ("ISO/IEC 42001", "iso-42001-compliance-mcp", "AI management system — 10 clauses + Annex A controls + AIMS roadmap", False),
        ("NIST AI RMF", "nist-rmf-ai-mcp", "Govern / Map / Measure / Manage + playbook alignment + profile generator", False),
    ]
    rows = "\n".join(
        f"        <tr><td><strong>{reg}</strong></td><td><code>pip install {pkg}</code></td>"
        f"<td>{desc}</td>"
        f"<td>{'✅' if signed else '—'}</td>"
        f'<td><a href="https://pypi.org/project/{pkg}/">PyPI</a></td></tr>'
        for reg, pkg, desc, signed in mcps
    )
    jsonld = {
        "@context": "https://schema.org",
        "@graph": [
            {
                "@type": "Organization",
                "@id": "https://meok.ai/#org",
                "name": "MEOK AI Labs",
                "url": "https://meok.ai",
                "email": "hello@meok.ai",
                "sameAs": ["https://github.com/CSOAI-ORG", "https://pypi.org/user/MEOK_AI_Labs/"],
            },
            {
                "@type": "WebSite",
                "name": "MEOK Attestation API",
                "url": "https://meok-attestation-api.vercel.app/",
                "description": "HMAC-signed compliance attestations for EU AI Act, DORA, NIS2, CRA, CSRD, and more.",
                "publisher": {"@id": "https://meok.ai/#org"},
            },
            {
                "@type": "SoftwareApplication",
                "name": "MEOK AI Labs Compliance MCP Suite",
                "applicationCategory": "BusinessApplication",
                "operatingSystem": "Cross-platform (Python)",
                "offers": [
                    {"@type": "Offer", "name": "Pro", "price": "199", "priceCurrency": "GBP",
                     "url": "https://buy.stripe.com/14A4gB3K4eUWgYR56o8k836",
                     "priceSpecification": {"@type": "UnitPriceSpecification", "billingIncrement": 1, "unitCode": "MON"}},
                    {"@type": "Offer", "name": "Enterprise", "price": "1499", "priceCurrency": "GBP",
                     "url": "https://buy.stripe.com/4gM9AV80kaEG0ZT42k8k837"},
                    {"@type": "Offer", "name": "48h Assessment", "price": "5000", "priceCurrency": "GBP",
                     "url": "https://buy.stripe.com/4gM7sN2G0bIKeQJfL28k833"},
                ],
                "publisher": {"@id": "https://meok.ai/#org"},
            },
        ],
    }
    return f"""<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>MEOK Compliance MCP Catalogue — Signed EU AI Act, DORA, NIS2, CRA, CSRD Attestations</title>
<meta name="description" content="15 Python MCP servers that audit AI systems + compliance posture against EU AI Act, DORA, NIS2, CRA, CSRD, GDPR, HIPAA, SOC 2, ISO 42001, UK AI Regulation. Each emits HMAC-signed attestations with public verify URLs. Pro £199/mo.">
<meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1">
<meta property="og:title" content="MEOK Compliance MCP Catalogue — Signed EU Compliance Attestations">
<meta property="og:description" content="15 Python MCPs for EU AI Act, DORA, NIS2, CRA, CSRD, UK AI. HMAC-signed attestations with public verify URLs.">
<meta property="og:type" content="website">
<meta property="og:url" content="https://meok-attestation-api.vercel.app/catalogue">
<link rel="canonical" href="https://meok-attestation-api.vercel.app/catalogue">
<script type="application/ld+json">{json.dumps(jsonld, ensure_ascii=False)}</script>
<style>
  body{{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:960px;margin:0 auto;padding:2rem 1rem;color:#111;line-height:1.55;}}
  h1{{font-size:2.25rem;margin:0 0 .25rem;letter-spacing:-.02em;}}
  h2{{font-size:1.5rem;margin-top:2.5rem;border-bottom:2px solid #e5e7eb;padding-bottom:.25rem;}}
  h3{{font-size:1.1rem;margin-top:1.5rem;}}
  .lead{{font-size:1.15rem;color:#4b5563;margin:0 0 2rem;}}
  .tiers{{display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:1rem;margin:2rem 0;}}
  .tier{{border:1px solid #e5e7eb;border-radius:.75rem;padding:1.25rem;background:#f9fafb;}}
  .tier h3{{margin-top:0;}}
  .price{{font-size:1.75rem;font-weight:700;color:#111;}}
  .tier.highlight{{border-color:#111;background:#fff;box-shadow:0 4px 12px rgba(0,0,0,.06);}}
  .tier.highlight .price{{color:#0057FF;}}
  .cta{{display:inline-block;background:#111;color:#fff;padding:.6rem 1.25rem;border-radius:.5rem;text-decoration:none;font-weight:600;margin-top:.75rem;}}
  .cta.pro{{background:#0057FF;}}
  .cta:hover{{opacity:.9;}}
  table{{width:100%;border-collapse:collapse;margin:1rem 0;font-size:.95rem;}}
  th,td{{text-align:left;padding:.6rem .75rem;border-bottom:1px solid #e5e7eb;vertical-align:top;}}
  th{{background:#f3f4f6;font-weight:600;}}
  code{{background:#f3f4f6;padding:.1rem .35rem;border-radius:.25rem;font-size:.88em;}}
  pre{{background:#f3f4f6;padding:1rem;border-radius:.5rem;overflow-x:auto;font-size:.88rem;}}
  .badge{{display:inline-block;background:#d1fae5;color:#065f46;padding:.15rem .5rem;border-radius:.25rem;font-size:.75rem;font-weight:600;margin-left:.4rem;}}
  .flow{{counter-reset:step;}}
  .flow .step{{counter-increment:step;padding:.5rem 0 .5rem 2.5rem;position:relative;}}
  .flow .step::before{{content:counter(step);position:absolute;left:0;top:.5rem;width:1.75rem;height:1.75rem;border-radius:50%;background:#111;color:#fff;font-weight:700;display:flex;align-items:center;justify-content:center;font-size:.9rem;}}
  footer{{margin-top:3rem;padding-top:1.5rem;border-top:1px solid #e5e7eb;color:#6b7280;font-size:.85rem;}}
</style>
</head>
<body>

<h1>MEOK Compliance MCP Catalogue</h1>
<p class="lead">15 Python MCP servers that audit AI systems + compliance posture against EU AI Act, DORA, NIS2, CRA, CSRD, UK AI Regulation and more. Every Pro-tier audit emits a HMAC-signed attestation your auditor validates at a public URL <strong>without contacting MEOK</strong>.</p>

<h2>Pricing</h2>
<div class="tiers">
  <div class="tier">
    <h3>Free</h3>
    <div class="price">£0</div>
    <p>10 calls/day per MCP. Use every tool. No signed attestations.</p>
    <p><code>pip install &lt;any-mcp&gt;</code></p>
  </div>
  <div class="tier highlight">
    <h3>Pro <span class="badge">most popular</span></h3>
    <div class="price">£199/mo</div>
    <p>Unlimited + HMAC-signed attestations + public verify URLs + priority support.</p>
    <a class="cta pro" href="https://buy.stripe.com/14A4gB3K4eUWgYR56o8k836">Subscribe</a>
  </div>
  <div class="tier">
    <h3>Enterprise</h3>
    <div class="price">£1,499/mo</div>
    <p>Multi-tenant, co-branded PDFs, Trust Center webhooks, custom Care Membrane policies.</p>
    <a class="cta" href="https://buy.stripe.com/4gM9AV80kaEG0ZT42k8k837">Subscribe</a>
  </div>
  <div class="tier">
    <h3>48h Assessment</h3>
    <div class="price">£5,000</div>
    <p>One-time bespoke audit + signed deliverable — written article-by-article report.</p>
    <a class="cta" href="https://buy.stripe.com/4gM7sN2G0bIKeQJfL28k833">Book</a>
  </div>
</div>

<h2>How signed attestations work</h2>
<div class="flow">
  <div class="step">Subscribe to Pro at Stripe — key provisioned via webhook.</div>
  <div class="step">Retrieve your key: <code>curl -X POST https://meok-attestation-api.vercel.app/provision -d '{{"email":"you@example.com","tier":"pro"}}'</code></div>
  <div class="step">Pass api_key + email to any MEOK MCP's attestation tool (e.g. <code>get_dora_certificate</code>).</div>
  <div class="step">Tool returns: <code>cert_id</code> + <code>signature_sha256_hmac</code> + public <code>verify_url</code> + 365-day validity.</div>
  <div class="step">Share verify_url with your auditor — they validate at <code>https://meok-attestation-api.vercel.app/verify/&lt;cert_id&gt;</code> without backend access.</div>
  <div class="step">Independent verifier: <code>pip install meok-attestation-verify</code></div>
</div>

<h2>Full catalogue</h2>
<table>
  <thead>
    <tr><th>Regulation</th><th>Install</th><th>Coverage</th><th>Signed attestation</th><th>Source</th></tr>
  </thead>
  <tbody>
{rows}
  </tbody>
</table>

<h2>For consultancies</h2>
<p>I'm looking for 3 GRC consultancies to pilot a white-label partnership. Your brand on the deliverable. £5k assessments you price at your own rate. Revenue share on Pro subscriptions. No exclusivity, no minimum. Email <a href="mailto:hello@meok.ai">hello@meok.ai</a>.</p>

<footer>
  <p>© 2026 MEOK AI Labs — <a href="https://meok.ai">meok.ai</a> — <a href="https://github.com/CSOAI-ORG">GitHub</a> — <a href="https://pypi.org/user/MEOK_AI_Labs/">PyPI</a></p>
  <p>Attestation infra: <a href="https://meok-attestation-api.vercel.app/llms.txt">llms.txt</a> · <a href="https://meok-attestation-api.vercel.app/">API docs</a></p>
</footer>

</body>
</html>"""


def _verify_html(cert_id: str, result: Optional[dict[str, Any]] = None) -> str:
    if result is None:
        # cert_id only — we don't persist, so explain how to verify.
        body = f"""
        <h1>Verify a MEOK attestation</h1>
        <p>Cert ID: <code>{_html.escape(cert_id)}</code></p>
        <p>MEOK does not store signed certificates server-side (privacy preserving).
        To verify, POST the full cert JSON (including <code>payload</code> and
        <code>signature_sha256_hmac</code>) to <code>/verify</code>.</p>
        <p>Or verify locally:</p>
        <pre>pip install meok-attestation-verify
meok-attestation-verify &lt; cert.json</pre>
        <p>Questions: <a href="mailto:hello@meok.ai">hello@meok.ai</a></p>
        """
    else:
        valid = result.get("valid")
        status_class = "ok" if valid else "bad"
        status_word = "VALID" if valid else "INVALID"
        body = f"""
        <h1>MEOK Attestation — {_html.escape(cert_id)}</h1>
        <p class="status {status_class}">{status_word}</p>
        <p>{_html.escape(result.get("message", ""))}</p>
        <h2>Cert details</h2>
        <pre>{_html.escape(json.dumps(result.get("cert", {}), indent=2))}</pre>
        """
    return (
        "<!doctype html><html><head><meta charset=utf-8>"
        "<title>MEOK Attestation Verify</title>"
        "<meta name=robots content=noindex>"
        "<style>body{font-family:system-ui,sans-serif;max-width:720px;margin:2rem auto;padding:0 1rem;color:#111;}"
        ".status{font-size:2rem;font-weight:700;padding:.75rem 1rem;border-radius:.5rem;display:inline-block}"
        ".ok{background:#d1fae5;color:#065f46}.bad{background:#fee2e2;color:#991b1b}"
        "pre{background:#f3f4f6;padding:1rem;border-radius:.5rem;overflow-x:auto}"
        "code{background:#f3f4f6;padding:.1rem .3rem;border-radius:.25rem}</style>"
        f"</head><body>{body}"
        "<hr><p><small>Issued by <a href=\"https://meok.ai\">MEOK AI Labs</a>. "
        "Every cert ID is signed with HMAC-SHA256. Key rotation policy: quarterly.</small></p>"
        "</body></html>"
    )


# ── Vercel serverless handler ──────────────────────────────────────────
class handler(BaseHTTPRequestHandler):
    def _json(self, status: int, body: dict[str, Any]) -> None:
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET,POST,OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type,X-API-Key")
        self.end_headers()
        self.wfile.write(json.dumps(body).encode())

    def _html(self, status: int, body: str) -> None:
        self.send_response(status)
        self.send_header("Content-Type", "text/html; charset=utf-8")
        self.end_headers()
        self.wfile.write(body.encode())

    def do_OPTIONS(self) -> None:
        self._json(204, {})

    def do_GET(self) -> None:
        path = (self.path or "/").split("?", 1)[0]
        if path == "/health":
            return self._json(200, {"ok": True, "service": "meok-attestation-api"})
        if path == "/robots.txt":
            self.send_response(200)
            self.send_header("Content-Type", "text/plain")
            self.end_headers()
            self.wfile.write(
                b"User-agent: *\n"
                b"Allow: /\n"
                b"Disallow: /sign\n"
                b"Disallow: /provision\n"
                b"Disallow: /webhook\n"
                b"Sitemap: https://meok-attestation-api.vercel.app/sitemap.xml\n"
            )
            return
        if path == "/llms.txt":
            self.send_response(200)
            self.send_header("Content-Type", "text/plain; charset=utf-8")
            self.end_headers()
            self.wfile.write((
                "# MEOK Attestation API\n\n"
                "> Public signing + verification surface for MEOK AI Labs compliance attestations.\n\n"
                "## What this API does\n\n"
                "MEOK AI Labs issues HMAC-SHA256 signed attestations for EU compliance regimes "
                "(DORA, NIS2, CRA, EU AI Act, CSRD, AI-BOM, GDPR, UK AI Bill, HIPAA, SOC 2, "
                "ISO 42001, NIST AI RMF). Each attestation carries a public verify URL that "
                "auditors, boards, and procurement teams can validate without MEOK backend access.\n\n"
                "## Endpoints\n\n"
                "- POST /sign — sign an attestation (Pro tier, api_key + email required)\n"
                "- POST /verify — verify a signed cert\n"
                "- GET /verify/<cert_id> — human-readable verify page\n"
                "- POST /provision — customer self-serve key retrieval by email\n"
                "- POST /webhook — Stripe checkout.session.completed handler\n"
                "- GET /catalogue — HTML marketing page with all MCPs + pricing\n"
                "- GET /health — liveness\n\n"
                "## Pricing\n\n"
                "- Pro: £199/mo — https://buy.stripe.com/14A4gB3K4eUWgYR56o8k836\n"
                "- Enterprise: £1,499/mo — https://buy.stripe.com/4gM9AV80kaEG0ZT42k8k837\n"
                "- One-time assessment: £5,000 — https://buy.stripe.com/4gM7sN2G0bIKeQJfL28k833\n\n"
                "## Verify locally\n\n"
                "pip install meok-attestation-verify\n"
                "meok-attestation-verify cert.json\n\n"
                "## Docs\n\n"
                "- MEOK AI Labs: https://meok.ai\n"
                "- PyPI packages: https://pypi.org/user/MEOK_AI_Labs/\n"
                "- GitHub org: https://github.com/CSOAI-ORG\n"
                "- Contact: hello@meok.ai\n"
            ).encode())
            return
        if path in ("/catalogue", "/buy", "/pricing"):
            self.send_response(200)
            self.send_header("Content-Type", "text/html; charset=utf-8")
            self.end_headers()
            self.wfile.write(_catalogue_html().encode())
            return
        if path == "/":
            accept = (self.headers.get("Accept") or "").lower()
            if "text/html" in accept or "*/*" in accept and "application/json" not in accept:
                # Browser — serve marketing catalogue
                self.send_response(200)
                self.send_header("Content-Type", "text/html; charset=utf-8")
                self.end_headers()
                self.wfile.write(_catalogue_html().encode())
                return
            return self._json(200, {
                "service": "MEOK Attestation API",
                "version": "1.1.0",
                "issuer": "MEOK AI Labs",
                "catalogue_html": "https://meok-attestation-api.vercel.app/catalogue",
                "endpoints": {
                    "POST /sign": "Issue a signed attestation (api_key required). Body: {api_key, email, regulation, entity, score, findings[], articles_audited[], tier?}",
                    "POST /verify": "Verify a cert (public). Body: full cert JSON",
                    "GET /verify/<cert_id>": "Human-readable verify page",
                    "POST /provision": "Customer self-serve key retrieval by email. Body: {email, tier}",
                    "POST /webhook": "Stripe checkout.session.completed handler",
                    "GET /catalogue": "HTML marketing page + full MCP list + pricing",
                    "GET /llms.txt": "AI-crawler friendly docs",
                    "GET /robots.txt": "Crawler policy",
                    "GET /health": "Liveness",
                },
                "pricing": {
                    "pro_per_month": "£199 — https://buy.stripe.com/14A4gB3K4eUWgYR56o8k836",
                    "enterprise_per_month": "£1499 — https://buy.stripe.com/4gM9AV80kaEG0ZT42k8k837",
                    "one_time_assessment": "£5000 — https://buy.stripe.com/4gM7sN2G0bIKeQJfL28k833",
                },
                "verify_tool": "pip install meok-attestation-verify",
                "github_org": "https://github.com/CSOAI-ORG",
                "pypi_user": "https://pypi.org/user/MEOK_AI_Labs/",
            })
        if path.startswith("/verify/") or path.startswith("/v/"):
            cert_id = path.split("/", 2)[-1] or ""
            return self._html(200, _verify_html(cert_id))

        # ── PAYG GET endpoints ──
        if path in ("/payg/health", "/api/payg/health"):
            return self._json(200, {
                "ok": True,
                "service": "meok-payg",
                "stripe_configured": bool(_STRIPE_SECRET_KEY),
                "webhook_configured": bool(_STRIPE_WEBHOOK_SECRET),
                "rate_gbp_per_call": _PAYG_RATE_GBP,
                "topup_url": _PAYG_TOPUP_URL,
            })
        if path in ("/payg/admin", "/api/payg/admin"):
            qs = dict(urllib.parse.parse_qsl(self.path.split("?", 1)[1] if "?" in self.path else ""))
            admin_key = qs.get("admin_key", "") or self.headers.get("X-Admin-Key", "")
            expected = os.environ.get("MEOK_PAYG_ADMIN_KEY", "")
            if not expected:
                return self._json(503, {"error": "MEOK_PAYG_ADMIN_KEY env var not set on the server"})
            if not hmac.compare_digest(admin_key, expected):
                return self._json(401, {"error": "Bad admin key"})
            # Aggregate stats via Stripe customer search.
            try:
                resp = _stripe_api_request(
                    "GET",
                    "/customers/search?query=metadata['meok_payg_token']:'payg_*'&limit=100",
                )
            except Exception as e:
                # Stripe's search query syntax doesn't support wildcards inside
                # the value; fall back to listing recent customers and filtering.
                try:
                    resp = _stripe_api_request("GET", "/customers?limit=100")
                except Exception as e2:
                    return self._json(500, {"error": f"Stripe list failed: {e2}"})
            customers = resp.get("data", [])
            total_balance = 0.0
            active_tokens = 0
            for c in customers:
                md = c.get("metadata") or {}
                if md.get("meok_payg_token"):
                    active_tokens += 1
                    try:
                        total_balance += float(md.get("meok_payg_balance", "0"))
                    except (TypeError, ValueError):
                        pass
            return self._json(200, {
                "ok": True,
                "active_payg_tokens": active_tokens,
                "total_outstanding_balance_gbp": round(total_balance, 4),
                "calls_remaining_total": _payg_calls_included(total_balance),
                "rate_gbp_per_call": _PAYG_RATE_GBP,
                "topup_url": _PAYG_TOPUP_URL,
                "note": "Stats restricted to the first 100 customers returned by Stripe — paginate via Stripe API for full picture.",
            })
        if path in ("/payg/balance", "/api/payg/balance"):
            qs = dict(urllib.parse.parse_qsl(self.path.split("?", 1)[1] if "?" in self.path else ""))
            token = qs.get("token", "")
            if not token:
                return self._json(400, {"error": "Missing 'token' query param"})
            customer = _payg_lookup_customer_by_token(token)
            if not customer:
                return self._json(404, {"error": "Token not found", "topup_url": _PAYG_TOPUP_URL})
            balance = float((customer.get("metadata") or {}).get("meok_payg_balance", "0"))
            return self._json(200, {
                "token_prefix": token[:12] + "…",
                "balance_gbp": round(balance, 4),
                "calls_remaining": _payg_calls_included(balance),
                "rate_gbp_per_call": _PAYG_RATE_GBP,
                "topup_url": _PAYG_TOPUP_URL,
            })

        return self._json(404, {"error": "Not found", "path": path})

    def do_POST(self) -> None:
        path = (self.path or "/").split("?", 1)[0]
        length = int(self.headers.get("Content-Length", 0))
        raw = self.rfile.read(length) if length else b"{}"

        # /webhook needs raw body for Stripe signature verification — parse only after.
        if path == "/webhook":
            sig_header = self.headers.get("Stripe-Signature", "")
            if not _verify_stripe_signature(raw, sig_header, _STRIPE_WEBHOOK_SECRET):
                return self._json(400, {"error": "Invalid Stripe signature"})
            try:
                event = json.loads(raw) if raw else {}
            except json.JSONDecodeError:
                return self._json(400, {"error": "Invalid JSON"})
            event_type = event.get("type", "")
            handled = False
            if event_type == "checkout.session.completed":
                session = event.get("data", {}).get("object", {}) or {}
                email = (session.get("customer_details") or {}).get("email") or session.get("customer_email") or ""
                tier = _extract_tier_from_checkout(session)
                # Pull mcp_slug from payment-link metadata (set by monetisation sweep)
                pl_meta = (session.get("metadata") or {})
                mcp_slug = pl_meta.get("mcp_slug", "")
                session_id = session.get("id", "")
                if email:
                    api_key = derive_api_key(email, tier)
                    # Log for Vercel logs (Nick can grep). Never return the key in response body
                    # since webhook responses go back to Stripe.
                    print(f"[PROVISIONED] email={email} tier={tier} key={api_key} session={session_id} mcp_slug={mcp_slug}")
                    # Fire Day-0 welcome email (no-op if RESEND_API_KEY unset)
                    _send_welcome_email(email=email, tier=tier, api_key=api_key, mcp_slug=mcp_slug, session_id=session_id)
                    handled = True
            return self._json(200, {"received": True, "handled": handled, "event_type": event_type})

        if path == "/provision":
            # V-03 FIX: customer self-serve now requires a valid Stripe checkout
            # session_id. Without that, anyone who knows a customer's email could
            # claim their key. The session is verified by hitting the live Stripe
            # API (status=complete + payment_status=paid). The authoritative email
            # + tier come from Stripe — request body values are ignored.
            #
            # Two break-glass paths remain:
            #   1. Master key in X-Master-Key header → can provision for any email
            #      (Nick uses this for support recovery).
            #   2. MEOK_PROVISION_REQUIRE_SESSION_ID=0 env → falls back to
            #      email-only legacy mode. ONLY for emergency / testing.
            try:
                body = json.loads(raw) if raw else {}
            except json.JSONDecodeError:
                return self._json(400, {"error": "Invalid JSON"})

            session_id = (body.get("session_id") or "").strip()
            master_hdr = self.headers.get("X-Master-Key", "") or body.get("master_key", "")

            # Path 1: master key bypass (support recovery)
            if _MASTER_KEY and master_hdr and hmac.compare_digest(master_hdr, _MASTER_KEY):
                email = (body.get("email") or "").strip().lower()
                tier = (body.get("tier") or "pro").strip().lower()
                if not email or "@" not in email:
                    return self._json(400, {"error": "email required for master-key provision"})
                if tier not in ("pro", "enterprise"):
                    return self._json(400, {"error": "tier must be 'pro' or 'enterprise'"})
                key = derive_api_key(email, tier)
                return self._json(200, {
                    "email": email,
                    "tier": tier,
                    "api_key": key,
                    "via": "master_key",
                    "note": "Provisioned via master-key recovery path. Store this api_key securely.",
                })

            # Path 2: legacy email-only mode — REMOVED (security: allowed key claims without payment)
            # This path was always gated on _PROVISION_REQUIRE_SESSION=False (env var MEOK_PROVISION_REQUIRE_SESSION_ID=0).
            # It is now unconditionally rejected. All provisioning requires Stripe session verification.

            # Path 3 (default + secure): require real Stripe session_id verification
            if not session_id:
                return self._json(400, {
                    "error": (
                        "session_id required. Pass the cs_live_… or cs_test_… ID from your "
                        "Stripe checkout success URL. If you've lost it, email "
                        "hello@meok.ai from the address on the subscription."
                    ),
                    "example": {"session_id": "cs_live_a1xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"},
                })

            ok, cust_email, tier, msg = verify_stripe_session(session_id)
            if not ok:
                # 402 Payment Required is the closest stdlib code for "we couldn't
                # confirm you paid" — clients should retry with a paid session_id.
                return self._json(402, {"error": msg, "session_id": session_id[:20] + "…"})

            # Optional: cross-check the body email matches Stripe email. If the
            # caller passed a body email that disagrees with Stripe, we trust
            # Stripe but note the mismatch in the response.
            body_email = (body.get("email") or "").strip().lower()
            email_mismatch = bool(body_email) and body_email != cust_email

            key = derive_api_key(cust_email, tier)
            return self._json(200, {
                "email": cust_email,
                "tier": tier,
                "api_key": key,
                "via": "stripe_session_verified",
                "session_id": session_id[:20] + "…",
                "note": "Pass this api_key + your email to any MEOK MCP's attestation tool. Store it securely.",
                **({"email_mismatch_warning": f"Body email {body_email!r} differs from Stripe email; using Stripe email."} if email_mismatch else {}),
            })

        try:
            body = json.loads(raw) if raw else {}
        except json.JSONDecodeError:
            return self._json(400, {"error": "Invalid JSON body"})

        if path == "/sign":
            api_key = body.get("api_key") or self.headers.get("X-API-Key", "")
            email = body.get("email", "")
            ok, msg, resolved_tier = _check_api_key(api_key, email=email)
            if not ok:
                return self._json(401, {"error": msg})

            regulation = body.get("regulation") or ""
            entity = body.get("entity") or ""
            if not regulation or not entity:
                return self._json(400, {"error": "'regulation' and 'entity' are required."})
            try:
                score = float(body.get("score", 0))
            except Exception:
                return self._json(400, {"error": "'score' must be a number."})
            findings = body.get("findings") or []
            if isinstance(findings, str):
                findings = [f.strip() for f in findings.split(",") if f.strip()]
            articles = body.get("articles_audited") or []
            if isinstance(articles, str):
                articles = [a.strip() for a in articles.split(",") if a.strip()]
            # V-07 FIX: tier comes from server-side key resolution, NOT request body.
            # Previously a Pro key could sign certs claiming tier=enterprise.
            tier = resolved_tier
            auditor_notes = body.get("auditor_notes") or ""

            # FREE-TIER LEAD CAPTURE: every email-only request gets logged so
            # Nick can grep Vercel logs for compliance buyers in the funnel.
            if tier == "free":
                _capture_free_tier_lead(email, regulation=regulation, entity=entity)

            cert = sign_attestation(
                regulation=regulation,
                entity=entity,
                score=score,
                findings=findings,
                articles_audited=articles,
                tier=tier,
                auditor_notes=auditor_notes,
            )

            # FREE-TIER UPGRADE NUDGE: the sign_attestation function already
            # returns a degraded response for free tier (no verify_url, UNVERIFIED
            # marker, limit fields). Add the meok_upgrade block for MCP consumption.
            if tier == "free":
                cert["meok_tier"] = "free"
                cert["meok_upgrade"] = {
                    "headline": (
                        "You've used 1 of 3 free daily attestations. This cert is UNVERIFIED "
                        "and has no public verify URL. Upgrade to Pro for auditor-ready certs."
                    ),
                    "pro_tier_79_mo": "https://buy.stripe.com/14A4gB3K4eUWgYR56o8k836",
                    "enterprise_tier_1499_mo": "https://buy.stripe.com/4gM9AV80kaEG0ZT42k8k837",
                    "what_pro_unlocks": [
                        "Public verify URL your auditor checks independently",
                        "Your own HMAC signing key (independent verification chain)",
                        "No 'UNVERIFIED' marker on the cert",
                        "Unlimited attestations (no daily cap)",
                        "Email + Slack support",
                    ],
                    "post_sign_question": (
                        "Was this useful? Reply to hello@meok.ai with one "
                        "sentence on what you'd want next — every reply gets read."
                    ),
                }

            return self._json(200, cert)

        if path == "/verify":
            cert = body if body.get("payload") else body.get("cert") or {}
            ok, msg = verify_attestation(cert)
            return self._json(200, {
                "valid": ok,
                "message": msg,
                "cert_id": cert.get("cert_id"),
                "verify_url": cert.get("verify_url"),
            })

        # ── PAYG POST endpoints ──
        if path in ("/payg/webhook", "/api/payg/webhook"):
            sig_header = self.headers.get("Stripe-Signature", "")
            if not _verify_stripe_signature(raw, sig_header, _STRIPE_WEBHOOK_SECRET):
                return self._json(400, {"error": "Invalid Stripe signature"})
            try:
                event = json.loads(raw) if raw else {}
            except json.JSONDecodeError:
                return self._json(400, {"error": "Invalid JSON"})

            if event.get("type") != "checkout.session.completed":
                return self._json(200, {"ignored": event.get("type", "")})

            session = (event.get("data") or {}).get("object", {}) or {}
            meta = session.get("metadata") or {}
            if meta.get("product_line") != "meok_payg":
                return self._json(200, {"ignored": "not a meok_payg product"})

            amount_total = int(session.get("amount_total", 0))
            amount_gbp = amount_total / 100.0
            customer_id = session.get("customer")
            customer_email = session.get("customer_email") or (session.get("customer_details") or {}).get("email", "")

            if not customer_id:
                return self._json(200, {"error": "No customer on session — Stripe will retry"})

            try:
                customer = _stripe_api_request("GET", f"/customers/{customer_id}")
            except Exception as e:
                return self._json(500, {"error": f"Stripe lookup failed: {e}"})

            existing_token = (customer.get("metadata") or {}).get("meok_payg_token", "")
            existing_balance = float((customer.get("metadata") or {}).get("meok_payg_balance", "0"))
            token = existing_token or _payg_generate_token()
            new_balance = round(existing_balance + amount_gbp, 4)

            try:
                _stripe_api_request("POST", f"/customers/{customer_id}", {
                    "metadata[meok_payg_token]": token,
                    "metadata[meok_payg_balance]": str(new_balance),
                    "metadata[meok_payg_last_topup_at]": datetime.now(timezone.utc).isoformat(),
                    "metadata[meok_payg_last_topup_gbp]": str(amount_gbp),
                })
            except Exception as e:
                return self._json(500, {"error": f"Could not update Stripe metadata: {e}"})

            sent = _payg_send_welcome(customer_email, token, amount_gbp, new_balance)
            return self._json(200, {
                "ok": True,
                "token_issued": True,
                "balance_gbp": new_balance,
                "calls_included_running_total": _payg_calls_included(new_balance),
                "email_sent": sent,
            })

        if path in ("/payg/trial", "/api/payg/trial"):
            # Free £0.50 trial credit. One per email — dedupe via Stripe Customer.
            try:
                payload = json.loads(raw) if raw else {}
            except json.JSONDecodeError:
                return self._json(400, {"error": "Invalid JSON"})

            email = (payload.get("email") or "").strip().lower()
            if not email or "@" not in email or "." not in email.split("@")[-1]:
                return self._json(400, {"error": "Valid 'email' required"})

            trial_amount = float(os.environ.get("MEOK_PAYG_TRIAL_GBP", "0.50"))

            # Look up existing customer by email (Stripe stores it on Customer)
            try:
                resp = _stripe_api_request(
                    "GET",
                    f"/customers/search?query=email:'{email}'",
                )
            except Exception as e:
                return self._json(500, {"error": f"Stripe lookup failed: {e}"})

            customers = resp.get("data", [])
            existing = customers[0] if customers else None

            if existing:
                meta = existing.get("metadata") or {}
                if meta.get("meok_payg_trial_claimed") == "true":
                    # Already claimed — return their existing token but no credit
                    return self._json(409, {
                        "error": "Trial already claimed for this email",
                        "existing_token_prefix": (meta.get("meok_payg_token", "") or "")[:12] + "…",
                        "topup_url": _PAYG_TOPUP_URL,
                    })
                customer_id = existing["id"]
                token = meta.get("meok_payg_token") or _payg_generate_token()
                new_balance = round(
                    float(meta.get("meok_payg_balance", "0")) + trial_amount, 4
                )
            else:
                # New Stripe Customer — create one
                try:
                    customer = _stripe_api_request(
                        "POST", "/customers", {"email": email}
                    )
                except Exception as e:
                    return self._json(500, {"error": f"Could not create Stripe customer: {e}"})
                customer_id = customer["id"]
                token = _payg_generate_token()
                new_balance = round(trial_amount, 4)

            try:
                _stripe_api_request("POST", f"/customers/{customer_id}", {
                    "metadata[meok_payg_token]": token,
                    "metadata[meok_payg_balance]": str(new_balance),
                    "metadata[meok_payg_trial_claimed]": "true",
                    "metadata[meok_payg_trial_at]": datetime.now(timezone.utc).isoformat(),
                    "metadata[meok_payg_trial_gbp]": str(trial_amount),
                })
            except Exception as e:
                return self._json(500, {"error": f"Could not update Stripe metadata: {e}"})

            # Best-effort welcome email
            sent = _payg_send_welcome(email, token, trial_amount, new_balance)
            return self._json(200, {
                "ok": True,
                "trial_issued": True,
                "trial_amount_gbp": trial_amount,
                "balance_gbp": new_balance,
                "calls_included": _payg_calls_included(new_balance),
                "token": token,  # included in response since trial flow needs it returned
                "email": email,
                "email_sent": sent,
                "next_step": (
                    f"export MEOK_PAYG_KEY={token} && "
                    f"export MEOK_PAYG_SERVER_URL=https://meok-attestation-api.vercel.app/payg && "
                    f"pip install -U eu-ai-act-compliance-mcp"
                ),
            })

        if path in ("/payg/deduct", "/api/payg/deduct"):
            try:
                payload = json.loads(raw) if raw else {}
            except json.JSONDecodeError:
                return self._json(400, {"error": "Invalid JSON"})

            token = payload.get("token", "")
            amount = float(payload.get("amount_gbp", _PAYG_RATE_GBP))
            if not token or amount <= 0:
                return self._json(400, {"error": "token + amount_gbp required"})

            customer = _payg_lookup_customer_by_token(token)
            if not customer:
                return self._json(404, {"error": "Token not found", "topup_url": _PAYG_TOPUP_URL})

            balance = float((customer.get("metadata") or {}).get("meok_payg_balance", "0"))
            if balance < amount:
                return self._json(402, {
                    "error": "Insufficient balance",
                    "balance_gbp": balance,
                    "needed_gbp": amount,
                    "topup_url": _PAYG_TOPUP_URL,
                })

            new_balance = round(balance - amount, 4)
            try:
                _stripe_api_request("POST", f"/customers/{customer['id']}", {
                    "metadata[meok_payg_balance]": str(new_balance),
                    "metadata[meok_payg_last_used_at]": datetime.now(timezone.utc).isoformat(),
                })
            except Exception as e:
                return self._json(500, {"error": f"Stripe update failed: {e}"})

            return self._json(200, {
                "ok": True,
                "deducted_gbp": amount,
                "balance_gbp": new_balance,
                "calls_remaining": _payg_calls_included(new_balance),
            })

        return self._json(404, {"error": "Not found", "path": path})
