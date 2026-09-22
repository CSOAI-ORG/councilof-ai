#!/usr/bin/env python3
"""Shared plumbing for the claim-measurement harnesses.

Every fetch in this package is keyless: no Authorization header, no API key, no query
parameter carrying a secret, no paid plan. `get()` refuses to send one, so a harness
cannot quietly acquire a credential and still call itself permissionless. Anything that
turns out to need a key is recorded by `needs_payment()` and dropped from the measurement.

Nothing here decides whether a claim is true. A harness returns what it read, the window
it read over, the denominator it read against, and the source URLs with access dates.
"""
from __future__ import annotations

import hashlib
import json
import time
import urllib.error
import urllib.request
from datetime import datetime, timezone
from typing import Any

UA = "Mozilla/5.0 (X11; Linux x86_64) csoai-claim-watch/0.1 (+https://councilof.ai/claims)"

#: Header names a keyless harness must never send.
FORBIDDEN_HEADERS = ("authorization", "x-api-key", "api-key", "cookie", "x-auth-token", "proxy-authorization")


class CredentialRefused(RuntimeError):
    """Raised when a harness tries to authenticate. Keyless is a property, not a promise."""


def now_iso() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def today() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%d")


def sha256_hex(b: bytes) -> str:
    return hashlib.sha256(b).hexdigest()


def canonical_bytes(obj: Any) -> bytes:
    """The estate's one canonical form (functions/_lib/cardSign.ts canonicalBytes)."""
    return json.dumps(obj, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode("utf-8")


def get(url: str, *, headers: dict[str, str] | None = None, timeout: int = 45,
        data: bytes | None = None, retries: int = 2) -> dict[str, Any]:
    """One keyless HTTP request. Never raises on a transport/HTTP error: the failure is data.

    Returns {ok, status, url, body (bytes), sha256, accessed_utc, reason}. A 402 is returned
    like any other status so the caller can record it as `needs_payment` and drop the source.
    """
    hdrs = {"User-Agent": UA, "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Accept-Language": "en-GB,en;q=0.9", "Accept-Encoding": "identity",
            "Upgrade-Insecure-Requests": "1"}
    for k, v in (headers or {}).items():
        if k.lower() in FORBIDDEN_HEADERS:
            raise CredentialRefused(f"{k}: this harness is keyless by construction")
        hdrs[k] = v
    last = ""
    for attempt in range(retries + 1):
        req = urllib.request.Request(url, data=data, headers=hdrs, method="POST" if data else "GET")
        try:
            with urllib.request.urlopen(req, timeout=timeout) as r:
                body = r.read()
                return {"ok": True, "status": r.status, "url": url, "final_url": r.geturl(),
                        "body": body, "bytes": len(body), "sha256": sha256_hex(body),
                        "accessed_utc": now_iso(), "reason": None}
        except urllib.error.HTTPError as e:
            body = e.read() if e.fp else b""
            return {"ok": False, "status": e.code, "url": url, "final_url": url,
                    "body": body, "bytes": len(body), "sha256": sha256_hex(body),
                    "accessed_utc": now_iso(), "reason": f"HTTP {e.code}"}
        except Exception as e:  # transport: DNS, TLS, timeout
            last = f"{type(e).__name__}"
            if attempt < retries:
                time.sleep(1.5 * (attempt + 1))
    return {"ok": False, "status": None, "url": url, "final_url": url, "body": b"", "bytes": 0,
            "sha256": sha256_hex(b""), "accessed_utc": now_iso(), "reason": last or "unreachable"}


def get_json(url: str, **kw) -> tuple[dict[str, Any], Any]:
    r = get(url, **kw)
    if not r["ok"]:
        return r, None
    try:
        return r, json.loads(r["body"].decode("utf-8", "replace"))
    except Exception as e:
        r = dict(r, ok=False, reason=f"not JSON ({type(e).__name__})")
        return r, None


def rpc(endpoint: str, method: str, params: list, *, timeout: int = 45) -> tuple[dict[str, Any], Any]:
    """One keyless JSON-RPC call to a public node."""
    body = json.dumps({"jsonrpc": "2.0", "id": 1, "method": method, "params": params}).encode()
    r = get(endpoint, headers={"Content-Type": "application/json"}, data=body, timeout=timeout)
    if not r["ok"]:
        return r, None
    try:
        out = json.loads(r["body"].decode())
    except Exception as e:
        return dict(r, ok=False, reason=f"not JSON ({type(e).__name__})"), None
    if "error" in out:
        return dict(r, ok=False, reason=f"rpc error {out['error'].get('code')}: {str(out['error'].get('message'))[:80]}"), None
    return r, out.get("result")


def needs_payment(r: dict[str, Any]) -> bool:
    """HTTP 402, or a body that says the plan is paid. Such a source is dropped, never worked around."""
    if r.get("status") == 402:
        return True
    body = (r.get("body") or b"")[:400].decode("utf-8", "replace").lower()
    return "upgrade to the paid" in body or "subscription" in body and r.get("status") in (401, 403)


def source(r: dict[str, Any], note: str = "") -> dict[str, Any]:
    """The citation record for one fetch: url, status, byte digest, access time."""
    s = {"url": r["url"], "status": r["status"], "accessed_utc": r["accessed_utc"],
         "response_bytes": r["bytes"], "response_sha256": r["sha256"]}
    if r.get("final_url") and r["final_url"] != r["url"]:
        s["final_url"] = r["final_url"]
    if not r["ok"]:
        s["reason"] = r["reason"]
    if note:
        s["note"] = note
    return s


def json_roundtrip_stable(value: Any) -> Any:
    """Normalise a value so parsing the published JSON and re-serialising reproduces its bytes.

    A float that happens to be integral — 0.0, 100.0 — is written by Python as `0.0` and by every
    JSON parser that has only one number type (JavaScript's, and therefore the door's) as `0`. A
    digest or a Merkle leaf computed over the re-serialised form then disagrees with the published
    one, and the artifact reports itself as not reproducible. The fix belongs at the point the
    bytes are written, not in each reader: emit the integer.

    Also rejects the values JSON has no representation for, rather than writing `NaN` or
    `Infinity`, which parse in Python and are invalid JSON everywhere else.
    """
    import math
    if isinstance(value, bool):
        return value
    if isinstance(value, float):
        if math.isnan(value) or math.isinf(value):
            raise ValueError(f"{value!r} has no JSON representation; a measurement must not emit one")
        return int(value) if value == int(value) else value
    if isinstance(value, dict):
        return {k: json_roundtrip_stable(v) for k, v in value.items()}
    if isinstance(value, (list, tuple)):
        return [json_roundtrip_stable(v) for v in value]
    return value


def visible_text(html_bytes: bytes) -> str:
    """Script/style stripped, tags removed, entities unescaped, whitespace collapsed.

    The grader reads what a reader sees, not raw markup: a phrase that only exists inside a
    <script> JSON blob is not a statement on the page.
    """
    import html as _html
    import re
    s = html_bytes.decode("utf-8", "replace")
    s = re.sub(r"(?is)<(script|style|noscript)\b.*?</\1>", " ", s)
    s = re.sub(r"(?s)<[^>]+>", " ", s)
    return re.sub(r"\s+", " ", _html.unescape(s)).strip()
