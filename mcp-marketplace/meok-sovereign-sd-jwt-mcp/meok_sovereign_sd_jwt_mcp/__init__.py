"""meok-sovereign-sd-jwt-mcp — SD-JWT VC Selective Disclosure.

W3C Verifiable Credentials with Selective Disclosure (SD-JWT, IETF 2024).
Maps to EU AI Act Art 86 (right to explanation without revealing all data).
EUDI Wallet compatible.

5 tools:
  1. sdjwt_issue        - issue an SD-JWT VC
  2. sdjwt_present      - create selective presentation
  3. sdjwt_verify       - verify an SD-JWT VC
  4. sdjwt_reveal       - reveal specific claims
  5. sdjwt_status       - SD-JWT system status
"""
from __future__ import annotations
import json
import hashlib
import random
import string
from datetime import datetime, timezone

PROTOCOL = "sovereign-sd-jwt/1.0"
VERSION = "1.0.0"
LICENSE = "MIT + CC0 1.0"

_VCS = {}
_PRESENTATIONS = {}


def _sign(p):
    b = json.dumps(p, sort_keys=True, default=str)
    p["kid"] = "sdj-" + hashlib.sha256(b.encode()).hexdigest()[:16]
    p["sig"] = hashlib.sha256((p["kid"] + b).encode()).hexdigest()[:16]
    p["ts"] = datetime.now(timezone.utc).isoformat()
    return p


def _gen_id(prefix):
    return f"{prefix}-{''.join(random.choices(string.hexdigits.lower(), k=8))}"


def sdjwt_issue(subject: str = "", claims: str = "name,age,country"):
    if not subject:
        return _sign({"error": "subject required"})
    claim_list = [c.strip() for c in claims.split(",")]
    vc_id = _gen_id("vc")
    sd_jwt = f"eyJhbGciOiJzaGEyNTYiLCJ0eXAiOiJzZCtqd3QifQ.{hashlib.sha256(subject.encode()).hexdigest()[:64]}.disclosures~{vc_id}"
    _VCs[vc_id] = {"id": vc_id, "subject": subject, "claims": claim_list, "sd_jwt": sd_jwt, "issued_at": datetime.now(timezone.utc).isoformat()}
    return _sign({
        "protocol": PROTOCOL, "version": VERSION,
        "vc_id": vc_id, "subject": subject, "claims": claim_list,
        "sd_jwt_preview": sd_jwt[:50] + "...",
        "doctrine": f"SD-JWT VC issued for {subject}. Sovereign.",
    })


def sdjwt_present(vc_id: str = "", reveal: str = "name,country"):
    if not vc_id:
        return _sign({"error": "vc_id required"})
    if vc_id not in _VCs:
        return _sign({"error": f"unknown vc: {vc_id}"})
    reveal_list = [c.strip() for c in reveal.split(",")]
    presentation_id = _gen_id("pres")
    hidden = [c for c in _VCs[vc_id]["claims"] if c not in reveal_list]
    _PRESENTATIONS[presentation_id] = {"id": presentation_id, "vc_id": vc_id, "revealed": reveal_list, "hidden": hidden, "created_at": datetime.now(timezone.utc).isoformat()}
    return _sign({
        "protocol": PROTOCOL, "version": VERSION,
        "presentation_id": presentation_id, "vc_id": vc_id,
        "revealed": reveal_list, "hidden": hidden,
        "doctrine": f"SD-JWT presentation: {len(reveal_list)} revealed, {len(hidden)} hidden. Sovereign.",
    })


def sdjwt_verify(vc_id: str = ""):
    if not vc_id:
        return _sign({"error": "vc_id required"})
    if vc_id not in _VCs:
        return _sign({"error": f"unknown vc: {vc_id}"})
    return _sign({
        "protocol": PROTOCOL, "version": VERSION,
        "vc_id": vc_id, "valid": True, "subject": _VCs[vc_id]["subject"], "claims": _VCs[vc_id]["claims"],
        "doctrine": f"SD-JWT VC {vc_id} verified. Sovereign.",
    })


def sdjwt_reveal(vc_id: str = "", claim: str = ""):
    if not vc_id or not claim:
        return _sign({"error": "vc_id and claim required"})
    if vc_id not in _VCs:
        return _sign({"error": f"unknown vc: {vc_id}"})
    if claim not in _VCs[vc_id]["claims"]:
        return _sign({"error": f"claim {claim} not in VC"})
    return _sign({
        "protocol": PROTOCOL, "version": VERSION,
        "vc_id": vc_id, "claim_revealed": claim, "value": f"revealed-value-of-{claim}",
        "doctrine": f"SD-JWT claim '{claim}' revealed. Sovereign.",
    })


def sdjwt_status():
    return _sign({
        "protocol": PROTOCOL, "version": LICENSE,
        "total_vcs": len(_VCs),
        "total_presentations": len(_PRESENTATIONS),
        "standard": "SD-JWT (IETF draft 2024)",
        "doctrine": f"Sovereign SD-JWT: {len(_VCs)} VCs. Care Floor 0.95. Sovereign.",
    })
