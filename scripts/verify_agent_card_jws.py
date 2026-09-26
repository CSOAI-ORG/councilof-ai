#!/usr/bin/env python3
"""Independent verifier for A2A AgentCard signatures (A2A specification §8.4.3).

Written WITHOUT importing the signer (scripts/adapters/agent_card_jws.py): its own JCS, its own
field-presence table, its own key resolution. A signer and a verifier that share code share bugs;
two implementations that agree on the payload are evidence, one implementation agreeing with
itself is not. functions/api/agent-card-jws.test.ts is a third (Node crypto) implementation.

§8.4.3, step by step, as implemented below:
  1. extract each signature from `signatures`
  2. resolve the key by `kid` in the did:web document (must also be in assertionMethod)
  3. remove properties holding default values (proto3 field presence, §5.7 / §8.4.1)
  4. exclude `signatures`
  5. canonicalise with RFC 8785 (JCS)
  6. verify Ed25519 over ASCII(protected || "." || b64u(payload))

Usage:
  python3 scripts/verify_agent_card_jws.py                       # committed card vs committed did.json
  python3 scripts/verify_agent_card_jws.py --card URL|PATH --did URL|PATH [--require-kid KID]
  python3 scripts/verify_agent_card_jws.py --tamper-control      # also prove a 1-byte edit FAILS
  python3 scripts/verify_agent_card_jws.py --parity https://councilof.ai https://csoai.org
        # fetch /.well-known/agent-card.json (and agent.json) from both origins; byte-compare; verify
Exit: 0 VALID (and parity OK) · 1 INVALID · 2 UNSIGNED · 3 PARITY MISMATCH · 4 control failed
"""
from __future__ import annotations

import base64
import json
import sys
import urllib.request
from pathlib import Path

from cryptography.exceptions import InvalidSignature
from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PublicKey

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_CARD = ROOT / "public" / ".well-known" / "agent-card.json"
DEFAULT_DID = ROOT / "public" / ".well-known" / "did.json"
UA = "csoai-agent-card-verify/1 (+https://councilof.ai)"

# specification/a2a.proto @ a2aproject/A2A 72b3761b. REQ = REQUIRED, OPT = `optional`,
# MSG = singular message (has presence), PLAIN = no presence (default value -> omitted).
REQ, OPT, MSG, PLAIN = "REQ", "OPT", "MSG", "PLAIN"
FIELDS = {
    "AgentCard": dict(name=(REQ,), description=(REQ,), supportedInterfaces=(REQ, "AgentInterface"),
                      provider=(MSG, "AgentProvider"), version=(REQ,), documentationUrl=(OPT,),
                      capabilities=(REQ, "AgentCapabilities"), securitySchemes=(PLAIN, "?"),
                      securityRequirements=(PLAIN, "?"), defaultInputModes=(REQ,),
                      defaultOutputModes=(REQ,), skills=(REQ, "AgentSkill"), signatures=(PLAIN,),
                      iconUrl=(OPT,)),
    "AgentProvider": dict(url=(REQ,), organization=(REQ,)),
    "AgentCapabilities": dict(streaming=(OPT,), pushNotifications=(OPT,),
                              extensions=(PLAIN, "AgentExtension"), extendedAgentCard=(OPT,)),
    "AgentExtension": dict(uri=(PLAIN,), description=(PLAIN,), required=(PLAIN,), params=(MSG,)),
    "AgentSkill": dict(id=(REQ,), name=(REQ,), description=(REQ,), tags=(REQ,), examples=(PLAIN,),
                       inputModes=(PLAIN,), outputModes=(PLAIN,), securityRequirements=(PLAIN, "?")),
    "AgentInterface": dict(url=(REQ,), protocolBinding=(REQ,), tenant=(PLAIN,), protocolVersion=(REQ,)),
}
PROTO_DEFAULTS = ("", False, [], {})


def is_proto_default(v) -> bool:
    if isinstance(v, bool):
        return v is False
    if isinstance(v, int):
        return v == 0
    return any(type(v) is type(d) and v == d for d in PROTO_DEFAULTS)


def remove_defaults(node, msg: str):
    spec = FIELDS[msg]
    kept = {}
    for key, val in node.items():
        if key not in spec:          # unrecognised: kept as served (JSON-native verification)
            kept[key] = val
            continue
        presence = spec[key][0]
        child = spec[key][1] if len(spec[key]) > 1 else None
        if presence == PLAIN and is_proto_default(val):
            continue
        if child == "?":
            raise NotImplementedError(f"{key}: security-scheme default removal not implemented")
        if child and isinstance(val, dict):
            val = remove_defaults(val, child)
        elif child and isinstance(val, list):
            val = [remove_defaults(x, child) if isinstance(x, dict) else x for x in val]
        kept[key] = val
    return kept


def _jcs_str(s: str) -> str:
    out = ['"']
    for ch in s:
        o = ord(ch)
        if ch == '"':
            out.append('\\"')
        elif ch == "\\":
            out.append("\\\\")
        elif o < 0x20:
            out.append({8: "\\b", 9: "\\t", 10: "\\n", 12: "\\f", 13: "\\r"}.get(o, "\\u%04x" % o))
        else:
            out.append(ch)
    out.append('"')
    return "".join(out)


def jcs(v) -> str:
    """RFC 8785, written out by hand (not json.dumps) so it is not the signer's canonicaliser."""
    if v is None:
        return "null"
    if v is True:
        return "true"
    if v is False:
        return "false"
    if isinstance(v, int):
        return str(v)
    if isinstance(v, float):
        raise ValueError("float: ES6 number serialisation not implemented")
    if isinstance(v, str):
        return _jcs_str(v)
    if isinstance(v, list):
        return "[" + ",".join(jcs(x) for x in v) + "]"
    if isinstance(v, dict):
        keys = sorted(v, key=lambda k: k.encode("utf-16-be"))   # RFC 8785 §3.2.3: UTF-16 code units
        return "{" + ",".join(_jcs_str(k) + ":" + jcs(v[k]) for k in keys) + "}"
    raise TypeError(type(v))


def b64u_enc(b: bytes) -> str:
    return base64.urlsafe_b64encode(b).rstrip(b"=").decode("ascii")


def b64u_dec(s: str) -> bytes:
    return base64.urlsafe_b64decode(s + "=" * (-len(s) % 4))


def canonical_payload(card: dict) -> bytes:
    body = {k: v for k, v in card.items() if k != "signatures"}
    return jcs(remove_defaults(body, "AgentCard")).encode("utf-8")


def fetch(src: str) -> bytes:
    if src.startswith("https://") or src.startswith("http://"):
        req = urllib.request.Request(src, headers={"User-Agent": UA, "Cache-Control": "no-cache"})
        with urllib.request.urlopen(req, timeout=25) as r:
            return r.read()
    return Path(src).read_bytes()


def resolve_key(did: dict, kid: str) -> Ed25519PublicKey:
    if kid not in (did.get("assertionMethod") or []):
        raise LookupError(f"{kid} not in assertionMethod")
    for vm in did.get("verificationMethod") or []:
        if vm.get("id") == kid:
            jwk = vm.get("publicKeyJwk") or {}
            if (jwk.get("kty"), jwk.get("crv")) != ("OKP", "Ed25519"):
                raise LookupError(f"{kid} is not Ed25519")
            return Ed25519PublicKey.from_public_bytes(b64u_dec(jwk["x"]))
    raise LookupError(f"{kid} not in verificationMethod")


def verify_card_bytes(card_bytes: bytes, did: dict, require_kid: str | None = None) -> dict:
    card = json.loads(card_bytes)
    sigs = card.get("signatures") or []
    if not sigs:
        return {"state": "UNSIGNED", "signatures": 0, "valid": []}
    payload_b64 = b64u_enc(canonical_payload(card))
    results = []
    for i, s in enumerate(sigs):
        r = {"index": i}
        try:
            hdr = json.loads(b64u_dec(s["protected"]))
            r["kid"] = hdr.get("kid")
            if hdr.get("alg") != "EdDSA":
                raise ValueError(f"alg {hdr.get('alg')!r} (only EdDSA is resolvable in this DID)")
            if require_kid and hdr.get("kid") != require_kid:
                raise ValueError(f"kid {hdr.get('kid')} is not the required {require_kid}")
            key = resolve_key(did, hdr["kid"])
            key.verify(b64u_dec(s["signature"]), (s["protected"] + "." + payload_b64).encode("ascii"))
            r["ok"] = True
        except (InvalidSignature, ValueError, LookupError, KeyError) as e:
            r["ok"] = False
            r["why"] = "signature does not verify" if isinstance(e, InvalidSignature) else str(e)
        results.append(r)
    ok = [r for r in results if r["ok"]]
    return {"state": "VALID" if ok else "INVALID", "signatures": len(sigs), "results": results}


def tamper_one_byte(card_bytes: bytes) -> bytes:
    """Flip one byte inside the signed content (the `description` value), keeping valid JSON."""
    marker = b'"description": "'
    i = card_bytes.index(marker) + len(marker)
    b = bytearray(card_bytes)
    b[i] = ord("X") if b[i] != ord("X") else ord("Y")
    return bytes(b)


def arg(argv: list[str], flag: str, default=None):
    return argv[argv.index(flag) + 1] if flag in argv else default


def main(argv: list[str]) -> int:
    require_kid = arg(argv, "--require-kid")
    if "--parity" in argv:
        a, b = argv[argv.index("--parity") + 1: argv.index("--parity") + 3]
        did_src = arg(argv, "--did", "https://csoai.org/.well-known/did.json")
        did = json.loads(fetch(did_src))
        report, code = {"did": did_src, "origins": [a, b]}, 0
        for path in ("/.well-known/agent-card.json", "/.well-known/agent.json"):
            x, y = fetch(a.rstrip("/") + path), fetch(b.rstrip("/") + path)
            same = x == y
            report[path] = {"byte_identical": same, "bytes": [len(x), len(y)],
                            "verify": [verify_card_bytes(x, did, require_kid)["state"],
                                       verify_card_bytes(y, did, require_kid)["state"]]}
            if not same:
                code = 3
            elif report[path]["verify"][0] != "VALID":
                code = code or (2 if report[path]["verify"][0] == "UNSIGNED" else 1)
        print(json.dumps(report, indent=2))
        return code

    card_src = arg(argv, "--card", str(DEFAULT_CARD))
    did_src = arg(argv, "--did", str(DEFAULT_DID))
    card_bytes, did = fetch(card_src), json.loads(fetch(did_src))
    res = verify_card_bytes(card_bytes, did, require_kid)
    res.update(card=card_src, did=did_src)
    code = {"VALID": 0, "INVALID": 1, "UNSIGNED": 2}[res["state"]]
    if "--tamper-control" in argv and res["state"] == "VALID":
        t = verify_card_bytes(tamper_one_byte(card_bytes), did, require_kid)
        res["tamper_control"] = {"one_byte_edit": "description[0]", "state": t["state"],
                                 "passed": t["state"] == "INVALID"}
        if t["state"] != "INVALID":
            code = 4
    print(json.dumps(res, indent=2))
    return code


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
