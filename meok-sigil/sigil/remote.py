"""
SIGIL Remote Attestation Bridge
=================================
Connects local SIGIL protocol to csoai.org for signed,
blockchain-anchored attestations.

Usage:
    from sigil.remote import CSOAIBridge
    
    bridge = CSOAIBridge()
    attestation_id = bridge.attest("V|jarvis|ad6d|+|0.82")
    result = bridge.verify(attestation_id)
"""

import hashlib
import json
import os
import urllib.request
import urllib.parse
from typing import Optional, Dict, Any


class CSOAIBridge:
    """Remote attestation bridge to csoai.org SIGIL API."""

    def __init__(self, base_url: str = None, api_key: str = None):
        self.base_url = (base_url or os.getenv("CSOAI_BASE_URL", "https://csoai.org")).rstrip("/")
        self.api_key = api_key or os.getenv("CSOAI_API_KEY", "")

    def _fetch(self, path: str, data: dict = None) -> dict:
        """GET or POST to csoai.org API."""
        url = f"{self.base_url}{path}"
        headers = {
            "Accept": "application/json",
            "User-Agent": "sigil-remote/0.1.0",
        }
        if self.api_key:
            headers["X-CSOAI-Key"] = self.api_key

        if data is not None:
            body = json.dumps(data).encode("utf-8")
            headers["Content-Type"] = "application/json"
            req = urllib.request.Request(url, data=body, headers=headers, method="POST")
        else:
            req = urllib.request.Request(url, headers=headers, method="GET")

        try:
            with urllib.request.urlopen(req, timeout=30) as resp:
                return json.loads(resp.read().decode("utf-8"))
        except urllib.error.HTTPError as e:
            body = e.read().decode("utf-8") if e.fp else ""
            raise SIGILRemoteError(f"[{e.code}] {body}") from e
        except Exception as e:
            raise SIGILRemoteError(f"Request failed: {e}") from e

    def attest(self, line: str) -> str:
        """Send a SIGIL line to csoai.org for signed attestation.
        
        Returns the attestation ID that can be used for later verification.
        """
        from sigil import digest
        d = digest(line)
        result = self._fetch("/api/sigil/attest", {
            "digest": d,
            "line": line,
            "timestamp": self._now(),
        })
        return result.get("attestation_id", result.get("id", "unknown"))

    def verify(self, attestation_id: str) -> Dict[str, Any]:
        """Verify a previously created attestation by ID."""
        return self._fetch(f"/api/sigil/verify?id={urllib.parse.quote(attestation_id)}")

    def verify_digest(self, line: str) -> Dict[str, Any]:
        """Verify a SIGIL line by its digest (no attestation ID needed)."""
        from sigil import digest
        d = digest(line)
        return self._fetch(f"/api/sigil/verify?digest={urllib.parse.quote(d)}")

    def get_certificate(self, cert_id: str) -> Dict[str, Any]:
        """Fetch a SIGIL certificate by its certificate ID."""
        return self._fetch(f"/api/sigil/verify.json?cert_id={urllib.parse.quote(cert_id)}")

    def status(self) -> Dict[str, Any]:
        """Check the health of the remote attestation service."""
        try:
            return self._fetch("/api/sigil/verify.json")
        except SIGILRemoteError:
            return {"status": "degraded", "reachable": False}

    @staticmethod
    def _now() -> str:
        from datetime import datetime, timezone
        return datetime.now(timezone.utc).isoformat()


class SIGILRemoteError(Exception):
    """Raised when the remote attestation service fails."""
    pass


# Convenience one-shot functions
def attest(line: str, base_url: str = None, api_key: str = None) -> str:
    """One-shot attestation. Returns attestation ID."""
    return CSOAIBridge(base_url, api_key).attest(line)


def verify(attestation_id: str, base_url: str = None, api_key: str = None) -> Dict[str, Any]:
    """One-shot verification by attestation ID."""
    return CSOAIBridge(base_url, api_key).verify(attestation_id)
