"""
csoai_server.py — the csoai.org public-facing attestation endpoint.

A stdlib HTTPServer (zero deps) that exposes:
  GET  /health, /horus, /hives, /log, /log/summary, /verify
  GET  /attest/<id>, /attest/verify/<hash>
  GET  /frameworks, /art50, /search
  POST /attest, /attest/bootstrap, /checkout
  GET  /             — HTML dashboard
"""
from __future__ import annotations

import datetime
import hashlib
import json
import os
import sys
import time
import urllib.parse
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

sys.path.insert(0, "/Users/nicholas/clawd")
from sov3_hive.core.federation import Federation, AttestationKind
from sov3_hive.integrations.frameworks import all_frameworks, frameworks_live_count, REGISTRY_NEW_14


FEDERATION = Federation(
    log_path="/Users/nicholas/clawd/sov3-hive/data/csoai_attestations.jsonl",
    use_real_hives=True,
)
try:
    FEDERATION.probe_all()
except Exception:
    pass

PUBLIC_DIR = Path("/Users/nicholas/clawd/sov3-hive/public")
LOG_PATH = "/Users/nicholas/clawd/sov3-hive/data/csoai_attestations.jsonl"


# ---- Stripe checkout (L0-E: revenue unlocker) ----

STRIPE_PRO_ARTICLE_50 = "https://buy.stripe.com/test-art50-kit"
STRIPE_PRO_MONTHLY = "https://buy.stripe.com/test-pro-monthly"
STRIPE_ENTERPRISE = "https://buy.stripe.com/test-enterprise"


def _kind_from_string(s: str) -> Optional[AttestationKind]:
    s = (s or "").lower().strip()
    for k in AttestationKind:
        if k.value == s:
            return k
    return None


class CSOAIHandler(BaseHTTPRequestHandler):
    server_version = "CSOAI.ORG/0.1"

    def _send_json(self, status: int, body: Any) -> None:
        data = json.dumps(body, separators=(",", ":")).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(data)))
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        self.wfile.write(data)

    def _send_html(self, status: int, html: str) -> None:
        data = html.encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "text/html; charset=utf-8")
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def _send_file(self, status: int, path: Path, content_type: str) -> None:
        if not path.exists():
            self._send_json(404, {"error": "not found", "path": str(path)})
            return
        data = path.read_bytes()
        self.send_response(status)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def _read_json_body(self) -> Optional[Dict[str, Any]]:
        try:
            length = int(self.headers.get("Content-Length", 0))
        except ValueError:
            return None
        if length <= 0:
            return None
        raw = self.rfile.read(length)
        try:
            return json.loads(raw.decode("utf-8"))
        except (json.JSONDecodeError, UnicodeDecodeError):
            return None

    def log_message(self, fmt: str, *args: Any) -> None:
        pass

    # ---- routes ----

    def do_GET(self) -> None:
        u = urllib.parse.urlparse(self.path)
        path = u.path.rstrip("/")
        qs = urllib.parse.parse_qs(u.query)

        if path in ("", "/", "/index", "/index.html"):
            return self._serve_index()
        if path == "/health":
            return self._send_json(200, {"ok": True, "ts": time.time(),
                                         "version": "0.1.0"})
        if path == "/horus":
            return self._send_json(200, FEDERATION.horus.status())
        if path == "/hives":
            try:
                FEDERATION.probe_all()
            except Exception:
                pass
            status: Dict[str, Any] = {}
            for hid, k in FEDERATION.hives.items():
                if hasattr(k, "status_dict"):
                    status[hid] = k.status_dict()
                else:
                    status[hid] = k.status()
            return self._send_json(200, {"hives": list(FEDERATION.hives.keys()),
                                          "status": status})
        if path == "/log" or path == "/attest":
            limit = int(qs.get("limit", ["50"])[0])
            offset = int(qs.get("offset", ["0"])[0])
            return self._serve_log_list(limit=limit, offset=offset)
        if path.startswith("/attest/verify/"):
            h = path[len("/attest/verify/"):]
            return self._serve_verify_by_hash(h)
        if path.startswith("/attest/"):
            aid = path[len("/attest/"):]
            return self._serve_attest(aid)
        if path == "/log/summary":
            return self._send_json(200, FEDERATION.status())
        if path == "/verify":
            return self._send_json(200, {
                "chain_valid": FEDERATION.verify_chain(),
                "attestations": len(FEDERATION.log),
                "tip_hash": FEDERATION.log[-1].attestation_hash if FEDERATION.log else None,
            })
        if path == "/frameworks":
            return self._send_json(200, {
                "total": len(all_frameworks()),
                "live": frameworks_live_count(),
                "new_14_mcps": len(REGISTRY_NEW_14),
                "frameworks": [
                    {"id": f.id, "name": f.name, "jurisdiction": f.jurisdiction,
                     "status": f.status.value, "effective": f.effective,
                     "source_url": f.source_url, "notes": f.notes}
                    for f in all_frameworks()
                ],
            })
        if path == "/art50":
            return self._serve_art50()
        if path == "/search":
            return self._serve_search(qs)
        if path == "/pricing":
            return self._serve_pricing()
        if path.startswith("/assets/"):
            return self._serve_asset(path[len("/assets/"):])
        return self._send_json(404, {"error": "not found", "path": path})

    def do_POST(self) -> None:
        u = urllib.parse.urlparse(self.path)
        path = u.path.rstrip("/")
        if path == "/attest":
            return self._handle_attest()
        if path == "/attest/bootstrap":
            return self._handle_bootstrap()
        if path == "/checkout":
            return self._handle_checkout()
        return self._send_json(404, {"error": "unknown endpoint", "path": path})

    def do_OPTIONS(self) -> None:
        self.send_response(204)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()

    # ---- handlers ----

    def _handle_attest(self) -> None:
        body = self._read_json_body()
        if not body:
            return self._send_json(400, {"error": "invalid JSON body"})
        kind_str = body.get("kind", "")
        subject = body.get("subject", "")
        claim = body.get("claim", {})
        submitter = body.get("submitter", "csoai.org")
        kind = _kind_from_string(kind_str)
        if not kind:
            return self._send_json(400, {
                "error": f"unknown kind: {kind_str}",
                "valid_kinds": [k.value for k in AttestationKind],
            })
        if not subject:
            return self._send_json(400, {"error": "subject required"})
        if not isinstance(claim, dict):
            return self._send_json(400, {"error": "claim must be a JSON object"})
        a = FEDERATION.attest(kind=kind, subject=subject, claim=claim, submitter=submitter)
        return self._send_json(200, {
            "attestation_id": a.attestation_id,
            "kind": a.kind.value,
            "subject": a.subject,
            "status": a.status,
            "meta_leader": a.meta_leader,
            "meta_confidence": a.meta_confidence,
            "attestation_hash": a.attestation_hash,
            "prev_hash": a.prev_hash,
            "sigil": a.sigil.to_dict() if a.sigil else None,
        })

    def _handle_bootstrap(self) -> None:
        body = self._read_json_body()
        if not body or "claims" not in body:
            return self._send_json(400, {"error": "expected {claims: [...]}"})
        results: List[Dict[str, Any]] = []
        for entry in body["claims"]:
            kind = _kind_from_string(entry.get("kind", ""))
            if not kind:
                results.append({"error": f"unknown kind: {entry.get('kind')}"})
                continue
            try:
                a = FEDERATION.attest(
                    kind=kind, subject=entry.get("subject", ""),
                    claim=entry.get("claim", {}),
                    submitter=entry.get("submitter", "csoai.org"),
                )
                results.append({
                    "attestation_id": a.attestation_id,
                    "kind": a.kind.value, "subject": a.subject,
                    "status": a.status, "attestation_hash": a.attestation_hash,
                })
            except Exception as e:
                results.append({"error": f"{type(e).__name__}: {e}"})
        return self._send_json(200, {"results": results, "total": len(results)})

    def _handle_checkout(self) -> None:
        """
        L0-E: payment pre-check. Maps the buyer's chosen tier to a Stripe
        checkout URL. In production this would be a real Stripe Checkout
        Session create + redirect. Here we record the intent and return
        the URL. The L0-F audit anchor then attests the purchase intent
        to the chain — turning "0 charges" into a verifiable trail.
        """
        body = self._read_json_body()
        if not body:
            return self._send_json(400, {"error": "invalid JSON body"})
        tier = (body.get("tier") or "").lower()
        email = body.get("email", "")
        if tier not in ("article50", "pro", "enterprise"):
            return self._send_json(400, {
                "error": f"unknown tier: {tier}",
                "valid_tiers": ["article50", "pro", "enterprise"],
            })
        url = {
            "article50": STRIPE_PRO_ARTICLE_50,
            "pro": STRIPE_PRO_MONTHLY,
            "enterprise": STRIPE_ENTERPRISE,
        }[tier]
        prices = {
            "article50": "£999 one-time",
            "pro": "£199/month",
            "enterprise": "£1,499/month",
        }
        # record the purchase intent on the chain — the L0-F audit anchor
        intent = FEDERATION.attest(
            kind=AttestationKind.COMPETITIVE,
            subject=f"checkout-intent/{tier}",
            claim={
                "tier": tier, "price": prices[tier],
                "email_hint": bool(email),
                "checkout_url": url,
                "stripe_live": False,  # would be True with real Stripe
                "note": "purchase intent anchored to the chain; real Stripe would create Checkout Session here",
            },
            submitter=f"buyer@{email or 'anonymous'}",
        )
        return self._send_json(200, {
            "tier": tier, "price": prices[tier],
            "checkout_url": url,
            "intent_attestation": {
                "id": intent.attestation_id,
                "hash": intent.attestation_hash,
                "status": intent.status,
            },
            "next_step": "Open checkout_url in browser; payment confirmation will trigger a new attestation with stripe_session_id",
        })

    def _serve_attest(self, aid: str) -> None:
        a = FEDERATION.get(aid)
        if not a:
            return self._send_json(404, {"error": "not found", "id": aid})
        return self._send_json(200, {
            "attestation_id": a.attestation_id,
            "kind": a.kind.value, "subject": a.subject, "claim": a.claim,
            "submitter": a.submitter, "created_at": a.created_at,
            "status": a.status, "meta_leader": a.meta_leader,
            "meta_confidence": a.meta_confidence,
            "attestation_hash": a.attestation_hash, "prev_hash": a.prev_hash,
            "sigil": a.sigil.to_dict() if a.sigil else None,
        })

    def _serve_verify_by_hash(self, h: str) -> None:
        """
        Anyone with an attestation hash can verify it on the chain
        without trusting the chain operator. Returns the attestation
        + the prev_hash to show chain position + a verified-against-chain flag.
        """
        a = FEDERATION.get_by_hash(h)
        if not a:
            return self._send_json(404, {
                "verified": False, "hash": h,
                "reason": "no attestation with this hash on the chain",
            })
        # find chain position
        position = next((i for i, x in enumerate(FEDERATION.log)
                        if x.attestation_hash == h), -1)
        return self._send_json(200, {
            "verified": True,
            "attestation_id": a.attestation_id,
            "attestation_hash": a.attestation_hash,
            "kind": a.kind.value,
            "subject": a.subject,
            "submitter": a.submitter,
            "created_at": a.created_at,
            "meta_leader": a.meta_leader,
            "meta_confidence": a.meta_confidence,
            "chain_position": position,
            "chain_length": len(FEDERATION.log),
            "prev_hash": a.prev_hash,
            "next_hash": FEDERATION.log[position + 1].attestation_hash
                         if position + 1 < len(FEDERATION.log) else None,
            "sigil_signature": a.sigil.signature if a.sigil else "",
            "sigil_verified": a.sigil.verify(FEDERATION.secret) if a.sigil else False,
        })

    def _serve_log_list(self, limit: int = 50, offset: int = 0) -> None:
        items = FEDERATION.log[offset:offset + limit]
        return self._send_json(200, {
            "total": len(FEDERATION.log),
            "limit": limit, "offset": offset,
            "items": [{
                "attestation_id": a.attestation_id, "kind": a.kind.value,
                "subject": a.subject, "status": a.status,
                "meta_leader": a.meta_leader, "meta_confidence": a.meta_confidence,
                "attestation_hash": a.attestation_hash, "created_at": a.created_at,
            } for a in items],
        })

    def _serve_search(self, qs: Dict[str, List[str]]) -> None:
        text = (qs.get("q", [""])[0] or "").lower()
        kind_filter = (qs.get("kind", [""])[0] or "").lower()
        status_filter = (qs.get("status", [""])[0] or "").lower()
        try:
            limit = int(qs.get("limit", ["20"])[0])
        except ValueError:
            limit = 20
        try:
            offset = int(qs.get("offset", ["0"])[0])
        except ValueError:
            offset = 0

        results = []
        for a in FEDERATION.log:
            if kind_filter and a.kind.value != kind_filter:
                continue
            if status_filter and a.status != status_filter:
                continue
            if text:
                hay = " ".join([a.subject, a.kind.value, a.status,
                                json.dumps(a.claim, ensure_ascii=False)]).lower()
                if text not in hay:
                    continue
            results.append({
                "attestation_id": a.attestation_id, "kind": a.kind.value,
                "subject": a.subject, "status": a.status,
                "meta_leader": a.meta_leader, "meta_confidence": a.meta_confidence,
                "attestation_hash": a.attestation_hash, "created_at": a.created_at,
            })
        total = len(results)
        return self._send_json(200, {
            "total": total, "limit": limit, "offset": offset,
            "results": results[offset:offset + limit],
            "filters": {"q": text, "kind": kind_filter, "status": status_filter},
        })

    def _serve_art50(self) -> None:
        effective = datetime.datetime(2026, 8, 2, tzinfo=datetime.timezone.utc)
        now = datetime.datetime.now(datetime.timezone.utc)
        days_remaining = (effective - now).days

        cliff = []
        for a in FEDERATION.log:
            text = " ".join([a.subject,
                            json.dumps(a.claim, ensure_ascii=False)]).lower()
            if any(t in text for t in ("art-50", "art 50", "august 2", "2026-08-02", "ai act", "eu-ai-act")):
                cliff.append({
                    "attestation_id": a.attestation_id, "subject": a.subject,
                    "kind": a.kind.value, "status": a.status,
                    "attestation_hash": a.attestation_hash,
                })

        return self._send_json(200, {
            "deadline": "2026-08-02T00:00:00Z",
            "days_remaining": days_remaining,
            "tier2_penalty": "EUR 15M or 3% global turnover",
            "tier1_penalty": "EUR 35M or 7% global turnover",
            "what_article_50_requires": [
                "Disclose AI-generated content to end users",
                "Mark synthetic content (deepfakes) with machine-readable metadata",
                "Implement transparency obligations before deploying GPAI to EU users",
                "Register the system in the EU AI database before market placement",
            ],
            "deadline_for_legacy_systems": "2026-12-02",
            "deadline_for_annex_iii_high_risk": "2027-12-02",
            "chain_evidence": cliff,
            "chain_evidence_count": len(cliff),
            "frameworks_total": len(all_frameworks()),
            "frameworks_live": frameworks_live_count(),
            "cliff_product": {
                "tier": "article50",
                "price": "£999 one-time",
                "checkout_endpoint": "/checkout",
            },
        })

    def _serve_pricing(self) -> None:
        return self._send_json(200, {
            "tiers": [
                {"id": "article50",  "name": "EU AI Act Art-50 Kit",
                 "price": "£999 one-time",
                 "features": ["cliff attestation package",
                              "30-framework compliance report",
                              "signed csoai.org chain anchor",
                              "90-day priority support"]},
                {"id": "pro",        "name": "MEOK Pro",
                 "price": "£199/month",
                 "features": ["unlimited csoai.org attestations",
                              "47 MEOK MCPs at pro tier",
                              "Stripe-managed billing",
                              "API key for /v1/<slug>/<tool>"]},
                {"id": "enterprise", "name": "Enterprise",
                 "price": "£1,499/month",
                 "features": ["white-label attestation portal",
                              "on-premise HORUS deployment",
                              "SLA + named engineer",
                              "DPO + AI Act officer support"]},
            ],
            "checkout_endpoint": "/checkout",
        })

    def _serve_asset(self, name: str) -> None:
        safe = (PUBLIC_DIR / name).resolve()
        if not str(safe).startswith(str(PUBLIC_DIR.resolve())):
            return self._send_json(403, {"error": "forbidden"})
        if not safe.exists() or safe.is_dir():
            return self._send_json(404, {"error": "asset not found"})
        ctype = {
            ".html": "text/html; charset=utf-8",
            ".js": "application/javascript; charset=utf-8",
            ".css": "text/css; charset=utf-8",
            ".json": "application/json; charset=utf-8",
            ".svg": "image/svg+xml",
            ".png": "image/png",
        }.get(safe.suffix, "application/octet-stream")
        return self._send_file(200, safe, ctype)

    def _serve_index(self) -> None:
        index = PUBLIC_DIR / "index.html"
        if index.exists():
            return self._send_file(200, index, "text/html; charset=utf-8")
        return self._send_html(200, self._fallback_index_html())

    def _fallback_index_html(self) -> str:
        status = FEDERATION.status()
        return f"""<!doctype html><html><head><meta charset="utf-8"><title>csoai.org</title></head><body>
<h1>csoai.org</h1>
<p>Federation: {len(FEDERATION.hives)} hives (n=4, f=1, q=3)</p>
<p>Attestations: {status['attestations_total']} | Chain valid: {status['chain_valid']}</p>
<p>Tip: <code>{status.get('tip_hash', 'none')[:32] if status.get('tip_hash') else 'none'}</code></p>
</body></html>"""


def serve(host: str = "127.0.0.1", port: int = 8766) -> ThreadingHTTPServer:
    httpd = ThreadingHTTPServer((host, port), CSOAIHandler)
    print(f"csoai.org listening on http://{host}:{port}")
    return httpd


if __name__ == "__main__":
    port = int(os.environ.get("CSOAI_PORT", "8766"))
    host = os.environ.get("CSOAI_HOST", "127.0.0.1")
    httpd = serve(host=host, port=port)
    httpd.serve_forever()
