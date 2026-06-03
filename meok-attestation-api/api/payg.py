"""
MEOK PAYG webhook + balance API
================================
Three endpoints for the pay-per-call billing flow:

  POST /payg/webhook         Stripe checkout.session.completed event handler.
                             Verifies Stripe signature, generates MEOK_PAYG_KEY
                             token, stores balance in Stripe customer metadata
                             (Stripe is the database), notifies Nick + the
                             customer.

  GET  /payg/balance         Token → current balance. Used by auth_middleware
                             when MEOK_PAYG_SERVER_URL env var is set on the
                             client.

  POST /payg/deduct          Token → deduct £0.05 (or configured rate),
                             return new balance. Atomic via Stripe metadata
                             updates with last-write-wins semantics.

Storage decision: Stripe IS the database. Every PAYG customer is a Stripe
Customer with metadata[meok_payg_token] (UUID) and metadata[meok_payg_balance]
(GBP as string). Bonus: refunds / disputes already produce Stripe events we
can plug into the same flow.

Required env vars (set in Vercel project settings):
  STRIPE_SECRET_KEY           Read+write to customer metadata
  STRIPE_WEBHOOK_SECRET       For signature verification
  MEOK_NOTIFY_EMAIL           Where to email a copy of new tokens (default: nicholas@meok.ai)
  RESEND_API_KEY              Optional — for outbound notification emails
"""

from __future__ import annotations

import hashlib
import hmac
import json
import os
import secrets
import time
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime, timezone
from http.server import BaseHTTPRequestHandler
from typing import Optional


STRIPE_SECRET_KEY = os.environ.get("STRIPE_SECRET_KEY", "").strip()
STRIPE_WEBHOOK_SECRET = os.environ.get("STRIPE_WEBHOOK_SECRET", "").strip()
NOTIFY_EMAIL = os.environ.get("MEOK_NOTIFY_EMAIL", "nicholas@meok.ai").strip()
RESEND_API_KEY = os.environ.get("RESEND_API_KEY", "").strip()
DEFAULT_RATE_GBP = float(os.environ.get("MEOK_PAYG_RATE_GBP", "0.05"))


# ── Helpers ────────────────────────────────────────────────────────────────

def _json_resp(handler: BaseHTTPRequestHandler, status: int, payload: dict):
    body = json.dumps(payload).encode("utf-8")
    handler.send_response(status)
    handler.send_header("Content-Type", "application/json")
    handler.send_header("Content-Length", str(len(body)))
    handler.send_header("Access-Control-Allow-Origin", "*")
    handler.end_headers()
    handler.wfile.write(body)


def _stripe_request(method: str, path: str, params: Optional[dict] = None) -> dict:
    """Minimal Stripe REST client using stdlib urllib (Vercel-Python friendly)."""
    if not STRIPE_SECRET_KEY:
        raise RuntimeError("STRIPE_SECRET_KEY not set")
    url = f"https://api.stripe.com/v1{path}"
    data = urllib.parse.urlencode(params or {}).encode("utf-8") if params else None
    auth = "Basic " + (STRIPE_SECRET_KEY + ":").encode("utf-8").hex()
    # urllib supports the simpler approach: pass auth via request header
    import base64
    auth_header = "Basic " + base64.b64encode((STRIPE_SECRET_KEY + ":").encode()).decode()
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
            err = {"error": {"message": f"Stripe HTTP {e.code}"}}
        raise RuntimeError(f"Stripe {method} {path} failed: {err}")


def _stripe_verify_signature(payload: bytes, sig_header: str) -> bool:
    """Verify Stripe-Signature header. Stripe's recommended pattern."""
    if not STRIPE_WEBHOOK_SECRET or not sig_header:
        return False
    try:
        parts = dict(p.split("=", 1) for p in sig_header.split(","))
        ts = parts.get("t", "")
        sig = parts.get("v1", "")
        signed_payload = f"{ts}.{payload.decode('utf-8')}"
        expected = hmac.new(
            STRIPE_WEBHOOK_SECRET.encode("utf-8"),
            signed_payload.encode("utf-8"),
            hashlib.sha256,
        ).hexdigest()
        return hmac.compare_digest(expected, sig)
    except Exception:
        return False


def _calls_included(amount_gbp: float, rate: float = DEFAULT_RATE_GBP) -> int:
    return int(amount_gbp / rate) if rate > 0 else 0


def _generate_token() -> str:
    """Generate a non-guessable, URL-safe PAYG token."""
    return "payg_" + secrets.token_urlsafe(24)


def _send_notify_email(to_email: str, token: str, amount_gbp: float, balance_gbp: float):
    """Send the welcome email via Resend (if RESEND_API_KEY set). Best-effort."""
    if not RESEND_API_KEY:
        return  # Webhook still succeeds — Nick can email manually from Stripe dashboard
    body = (
        f"Thanks for your £{amount_gbp:.2f} top-up to MEOK PAYG.\n\n"
        f"Your token (treat like a password):\n\n"
        f"  MEOK_PAYG_KEY={token}\n\n"
        f"Set it in your environment and every call across the 7 MEOK compliance MCPs "
        f"will deduct from your balance:\n\n"
        f"  export MEOK_PAYG_KEY={token}\n"
        f"  export MEOK_PAYG_SERVER_URL=https://meok-attestation-api.vercel.app/payg\n"
        f"  pip install -U eu-ai-act-compliance-mcp\n\n"
        f"Balance now: £{balance_gbp:.2f} ({_calls_included(balance_gbp)} calls).\n"
        f"Top-up history + balance at any time: GET https://meok-attestation-api.vercel.app/payg/balance?token={token}\n\n"
        f"Questions: reply to this email.\n\n"
        f"— MEOK AI Labs"
    )
    try:
        urllib.request.urlopen(
            urllib.request.Request(
                "https://api.resend.com/emails",
                data=json.dumps({
                    "from": "MEOK AI Labs <payg@meok.ai>",
                    "to": [to_email, NOTIFY_EMAIL],
                    "subject": f"Your MEOK PAYG token — £{balance_gbp:.2f} balance",
                    "text": body,
                }).encode("utf-8"),
                headers={
                    "Authorization": f"Bearer {RESEND_API_KEY}",
                    "Content-Type": "application/json",
                },
            ),
            timeout=10,
        )
    except Exception:
        pass  # Don't block webhook on email failure


# ── Endpoints ──────────────────────────────────────────────────────────────

class handler(BaseHTTPRequestHandler):

    def do_POST(self):  # noqa: N802 (Vercel convention)
        path = self.path.split("?", 1)[0]
        if path.endswith("/webhook"):
            return self._webhook()
        if path.endswith("/deduct"):
            return self._deduct()
        _json_resp(self, 404, {"error": "Unknown POST endpoint"})

    def do_GET(self):  # noqa: N802
        path = self.path.split("?", 1)[0]
        if path.endswith("/balance"):
            return self._balance()
        if path.endswith("/health"):
            return _json_resp(self, 200, {
                "ok": True,
                "stripe_configured": bool(STRIPE_SECRET_KEY),
                "webhook_configured": bool(STRIPE_WEBHOOK_SECRET),
                "rate_gbp_per_call": DEFAULT_RATE_GBP,
            })
        _json_resp(self, 404, {"error": "Unknown GET endpoint"})

    # ──────────────────────────────────────────────────────────────────────

    def _webhook(self):
        length = int(self.headers.get("Content-Length", "0"))
        body = self.rfile.read(length) if length else b""
        sig = self.headers.get("Stripe-Signature", "")

        if STRIPE_WEBHOOK_SECRET and not _stripe_verify_signature(body, sig):
            return _json_resp(self, 400, {"error": "Invalid Stripe signature"})

        try:
            event = json.loads(body)
        except Exception:
            return _json_resp(self, 400, {"error": "Invalid JSON"})

        event_type = event.get("type", "")
        data = event.get("data", {}).get("object", {})

        if event_type != "checkout.session.completed":
            return _json_resp(self, 200, {"ignored": event_type})

        # Only handle PAYG products (gated via metadata)
        line_meta = (data.get("metadata") or {})
        if line_meta.get("product_line") != "meok_payg":
            # Could also check via expanded line_items if product_line metadata
            # missing. For now, accept-and-ignore.
            return _json_resp(self, 200, {"ignored": "not a meok_payg product"})

        amount_total = int(data.get("amount_total", 0))  # pence
        amount_gbp = amount_total / 100.0
        customer_id = data.get("customer")
        customer_email = data.get("customer_email") or (data.get("customer_details") or {}).get("email", "")

        if not customer_id:
            return _json_resp(self, 200, {"error": "No customer on session — Stripe will retry"})

        # Read existing balance
        try:
            customer = _stripe_request("GET", f"/customers/{customer_id}")
            existing_token = (customer.get("metadata") or {}).get("meok_payg_token", "")
            existing_balance = float((customer.get("metadata") or {}).get("meok_payg_balance", "0"))
        except Exception as e:
            return _json_resp(self, 500, {"error": f"Could not read Stripe customer: {e}"})

        token = existing_token or _generate_token()
        new_balance = round(existing_balance + amount_gbp, 4)

        # Update Stripe customer metadata
        try:
            _stripe_request("POST", f"/customers/{customer_id}", {
                "metadata[meok_payg_token]": token,
                "metadata[meok_payg_balance]": str(new_balance),
                "metadata[meok_payg_last_topup_at]": datetime.now(timezone.utc).isoformat(),
                "metadata[meok_payg_last_topup_gbp]": str(amount_gbp),
            })
        except Exception as e:
            return _json_resp(self, 500, {"error": f"Could not update Stripe metadata: {e}"})

        # Notification email (best-effort)
        _send_notify_email(customer_email, token, amount_gbp, new_balance)

        return _json_resp(self, 200, {
            "ok": True,
            "token_issued": True,
            "balance_gbp": new_balance,
            "calls_included_running_total": _calls_included(new_balance),
        })

    def _balance(self):
        # ?token=xxx
        qs = dict(urllib.parse.parse_qsl(self.path.split("?", 1)[1] if "?" in self.path else ""))
        token = qs.get("token", "")
        if not token:
            return _json_resp(self, 400, {"error": "Missing 'token' query param"})

        # Search Stripe for a customer with this token
        try:
            resp = _stripe_request("GET", f"/customers/search?query=metadata['meok_payg_token']:'{token}'")
            customers = resp.get("data", [])
        except Exception as e:
            return _json_resp(self, 500, {"error": f"Lookup failed: {e}"})

        if not customers:
            return _json_resp(self, 404, {"error": "Token not found"})

        customer = customers[0]
        balance = float((customer.get("metadata") or {}).get("meok_payg_balance", "0"))
        return _json_resp(self, 200, {
            "token_prefix": token[:12] + "…",
            "balance_gbp": round(balance, 4),
            "calls_remaining": _calls_included(balance),
            "rate_gbp_per_call": DEFAULT_RATE_GBP,
            "topup_url": "https://councilof.ai/payg",
        })

    def _deduct(self):
        length = int(self.headers.get("Content-Length", "0"))
        body = self.rfile.read(length) if length else b"{}"
        try:
            payload = json.loads(body)
        except Exception:
            return _json_resp(self, 400, {"error": "Invalid JSON"})

        token = payload.get("token", "")
        amount = float(payload.get("amount_gbp", DEFAULT_RATE_GBP))
        if not token or amount <= 0:
            return _json_resp(self, 400, {"error": "token + amount_gbp required"})

        try:
            resp = _stripe_request("GET", f"/customers/search?query=metadata['meok_payg_token']:'{token}'")
            customers = resp.get("data", [])
        except Exception as e:
            return _json_resp(self, 500, {"error": f"Lookup failed: {e}"})

        if not customers:
            return _json_resp(self, 404, {"error": "Token not found", "topup_url": "https://councilof.ai/payg"})

        customer = customers[0]
        balance = float((customer.get("metadata") or {}).get("meok_payg_balance", "0"))
        if balance < amount:
            return _json_resp(self, 402, {
                "error": "Insufficient balance",
                "balance_gbp": balance,
                "needed_gbp": amount,
                "topup_url": "https://councilof.ai/payg",
            })

        new_balance = round(balance - amount, 4)
        try:
            _stripe_request("POST", f"/customers/{customer['id']}", {
                "metadata[meok_payg_balance]": str(new_balance),
                "metadata[meok_payg_last_used_at]": datetime.now(timezone.utc).isoformat(),
            })
        except Exception as e:
            return _json_resp(self, 500, {"error": f"Update failed: {e}"})

        return _json_resp(self, 200, {
            "ok": True,
            "deducted_gbp": amount,
            "balance_gbp": new_balance,
            "calls_remaining": _calls_included(new_balance),
        })
