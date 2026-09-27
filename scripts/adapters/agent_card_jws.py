#!/usr/bin/env python3
"""Producer of the A2A AgentCard signature (A2A specification §8.4) — signing input, and signing.

An estate that signs its measurement cards and leaves its own agent card unsigned has left its
cheapest signature unmade. AgentCardSignature is proto field 13 — optional.

The rule (A2A specification §8.4.1 / §8.4.2 / §8.4.3, a2aproject/A2A @ 72b3761b):
  * EXCLUDE the `signatures` field from the signed content (circular dependency)
  * respect protobuf field presence (§5.7) and REMOVE DEFAULT VALUES before canonicalising:
      REQUIRED field          -> always kept, even when it holds the default
      `optional` field        -> kept when present (explicitly set), even at its default
      plain field             -> omitted when it holds the proto default ("" / false / 0 / [] / {})
    e.g. AgentExtension.required is a plain bool, so `"required": false` is NOT in the payload.
    A verifier following §8.4.3 step 3 removes it too; signing without the removal produces a
    signature no conforming verifier reproduces.
  * canonicalise with JCS (RFC 8785)
  * JWS (RFC 7515): signature over ASCII(b64u(protected) || "." || b64u(payload)); protected
    header carries alg, typ "JOSE", kid.

THE KEY IS SCOPED BY PURPOSE. This script signs only with a key whose public half is the one the
DID document publishes for the requested kid, and only for kids allowed to sign a site/agent card.
The board keys (#board-attestation-1, #gspc-board-22axis-2026) and the pod chain key
(#estate-chain-1) are refused by name: a signature is a statement about WHO vouches for WHAT, and
the board key vouching for the agent card would be a statement nobody made.

THE PORTABILITY TRAP (unchanged): our card carries keys that are not in specification/a2a.proto
(catalogUrl, doi, explicitly_not). A verifier that reconstructs the card THROUGH the proto drops
them and fails the signature; a JSON-native verifier canonicalising the served bytes passes it.
They are listed in the signing-input file so the choice stays deliberate.

Run:
  python3 scripts/adapters/agent_card_jws.py                         # emit the signing input
  python3 scripts/adapters/agent_card_jws.py --sign --key-file PATH  # sign with #card-attestation-2
        [--kid did:web:csoai.org#card-attestation-1]                 # another allowed card key
  CARD_ATTESTATION_KEY_FILE=PATH python3 scripts/adapters/agent_card_jws.py --sign
The key file may be a PKCS#8 PEM, or a 32-byte Ed25519 seed as raw bytes / hex / base64. It is read,
never printed, never copied. Independent check afterwards: scripts/verify_agent_card_jws.py.
"""
from __future__ import annotations

import base64
import hashlib
import json
import os
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
CARD = ROOT / "public" / ".well-known" / "agent-card.json"
ALIAS = ROOT / "public" / ".well-known" / "agent.json"
DID = ROOT / "public" / ".well-known" / "did.json"
OUT = ROOT / "public" / "interop" / "agent-card-jws-input.json"

KID = "did:web:csoai.org#card-attestation-2"
# Keys the DID document scopes to site/agent-card artifacts, named by DID fragment — never matched by
# pattern. #site-release-1 signed the previous csoai.org card (v0.1.0). #card-attestation-1 is the
# original card key; its private half is not held on Oracle or the pods, so the card could not be
# signed with it. #card-attestation-2 was added 2026-09-27 (owner-approved rotation, "rotate card
# key"); its private half is held on one ops host only and the card is signed there.
# #card-attestation-1 is NOT revoked — the 335 signed cards in public/signed/card_index.json verify
# under it. Nothing else signs the agent card.
ALLOWED_KIDS = {
    "did:web:csoai.org#card-attestation-2",
    "did:web:csoai.org#card-attestation-1",
    "did:web:csoai.org#site-release-1",
}
REFUSED_KIDS = {
    "did:web:csoai.org#board-attestation-1": "signs the public board snapshot, not the agent card",
    "did:web:csoai.org#gspc-board-22axis-2026": "the 2026-09-02 board-freeze key (all three additive shares on one host; the split was never performed, C-2026-0925-01)",
    "did:web:csoai.org#estate-chain-1": "signs pod measurement chains",
}

# ── A2A field presence (specification/a2a.proto @ 72b3761b, JSON names) ────────────────────────
# R = REQUIRED, O = proto3 `optional` (presence tracked), P = plain (no presence: default omitted),
# M = singular message (presence tracked). Second element: nested message type, if any.
PRESENCE = {
    "AgentCard": {
        "name": ("R", None), "description": ("R", None),
        "supportedInterfaces": ("R", "AgentInterface"), "provider": ("M", "AgentProvider"),
        "version": ("R", None), "documentationUrl": ("O", None),
        "capabilities": ("R", "AgentCapabilities"), "securitySchemes": ("P", "OPAQUE"),
        "securityRequirements": ("P", "OPAQUE"), "defaultInputModes": ("R", None),
        "defaultOutputModes": ("R", None), "skills": ("R", "AgentSkill"),
        "signatures": ("P", None), "iconUrl": ("O", None),
    },
    "AgentProvider": {"url": ("R", None), "organization": ("R", None)},
    "AgentCapabilities": {
        "streaming": ("O", None), "pushNotifications": ("O", None),
        "extensions": ("P", "AgentExtension"), "extendedAgentCard": ("O", None),
    },
    "AgentExtension": {
        "uri": ("P", None), "description": ("P", None), "required": ("P", None),
        "params": ("M", None),
    },
    "AgentSkill": {
        "id": ("R", None), "name": ("R", None), "description": ("R", None), "tags": ("R", None),
        "examples": ("P", None), "inputModes": ("P", None), "outputModes": ("P", None),
        "securityRequirements": ("P", "OPAQUE"),
    },
    "AgentInterface": {
        "url": ("R", None), "protocolBinding": ("R", None), "tenant": ("P", None),
        "protocolVersion": ("R", None),
    },
}


def _is_default(v) -> bool:
    return v is False or v == "" or v == [] or v == {} or (type(v) is int and v == 0)


def strip_defaults(obj: dict, typ: str = "AgentCard", path: str = "", removed: list | None = None) -> dict:
    """§8.4.1 rule 1 / §8.4.3 step 3. Unknown (non-proto) keys are kept verbatim."""
    removed = [] if removed is None else removed
    table = PRESENCE[typ]
    out = {}
    for k, v in obj.items():
        here = f"{path}.{k}" if path else k
        if k not in table:
            out[k] = v
            continue
        kind, sub = table[k]
        if kind == "P" and _is_default(v):
            removed.append(here)
            continue
        if sub == "OPAQUE":
            # SecurityScheme / SecurityRequirement presence rules are not implemented here; refuse
            # rather than sign a canonical form a conforming verifier might not reproduce.
            raise NotImplementedError(f"{here}: default removal for security schemes not implemented")
        if sub and isinstance(v, dict):
            v = strip_defaults(v, sub, here, removed)
        elif sub and isinstance(v, list):
            v = [strip_defaults(e, sub, f"{here}[{i}]", removed) if isinstance(e, dict) else e
                 for i, e in enumerate(v)]
        out[k] = v
    return out


def jcs(obj) -> bytes:
    """RFC 8785 for the value types an AgentCard holds (objects, arrays, strings, bools, ints).

    Asserted, not assumed: floats (ES6 number formatting) and non-BMP object keys (UTF-16 sort
    order) are refused rather than canonicalised wrongly.
    """
    def check(o):
        if isinstance(o, float):
            raise ValueError("float in AgentCard: JCS ES6 number formatting is not implemented here")
        if isinstance(o, dict):
            for k, v in o.items():
                if any(ord(c) > 0xFFFF for c in k):
                    raise ValueError("non-BMP object key: JCS UTF-16 key order not implemented here")
                check(v)
        elif isinstance(o, list):
            for v in o:
                check(v)
    check(obj)
    return json.dumps(obj, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode("utf-8")


def b64u(b: bytes) -> str:
    return base64.urlsafe_b64encode(b).decode().rstrip("=")


def b64u_dec(s: str) -> bytes:
    return base64.urlsafe_b64decode(s + "=" * (-len(s) % 4))


def payload_obj(card: dict, removed: list | None = None) -> dict:
    return strip_defaults({k: v for k, v in card.items() if k != "signatures"}, removed=removed)


def protected_header(kid: str) -> dict:
    return {"alg": "EdDSA", "kid": kid, "typ": "JOSE"}


def signing_input(card: dict, kid: str = KID) -> tuple[bytes, dict, dict]:
    p = payload_obj(card)
    prot = protected_header(kid)
    si = b64u(jcs(prot)).encode() + b"." + b64u(jcs(p)).encode()
    return si, prot, p


def serialise(card: dict) -> str:
    """Byte-compatible with scripts/agent-card-extensions.mjs: JSON.stringify(card, null, 2) + "\\n"."""
    return json.dumps(card, indent=2, ensure_ascii=False) + "\n"


# ── signing ──────────────────────────────────────────────────────────────────────────────────
def load_private_key(path: str):
    from cryptography.hazmat.primitives import serialization
    from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PrivateKey
    raw = Path(path).read_bytes()
    if b"PRIVATE KEY" in raw:
        k = serialization.load_pem_private_key(raw, password=None)
        if not isinstance(k, Ed25519PrivateKey):
            raise SystemExit("REFUSED: key file is not an Ed25519 private key")
        return k
    if len(raw) == 32:
        return Ed25519PrivateKey.from_private_bytes(raw)
    s = raw.decode("ascii", "strict").strip()
    if re.fullmatch(r"[0-9a-fA-F]{64}", s):
        return Ed25519PrivateKey.from_private_bytes(bytes.fromhex(s))
    for dec in (lambda x: base64.b64decode(x + "=" * (-len(x) % 4)), b64u_dec):
        try:
            b = dec(s)
        except Exception:
            continue
        if len(b) == 32:
            return Ed25519PrivateKey.from_private_bytes(b)
        if len(b) == 48 and b[:16] == bytes.fromhex("302e020100300506032b657004220420"):
            return Ed25519PrivateKey.from_private_bytes(b[16:])
    raise SystemExit("REFUSED: key file format not recognised (PKCS#8 PEM or 32-byte seed)")


def did_public_x(did: dict, kid: str) -> str:
    asserted = set(did.get("assertionMethod") or [])
    for vm in did.get("verificationMethod") or []:
        if vm.get("id") == kid:
            if kid not in asserted:
                raise SystemExit(f"REFUSED: {kid} is not in the DID document's assertionMethod")
            jwk = vm.get("publicKeyJwk") or {}
            if jwk.get("kty") != "OKP" or jwk.get("crv") != "Ed25519":
                raise SystemExit(f"REFUSED: {kid} is not an Ed25519 OKP key")
            return jwk["x"]
    raise SystemExit(f"REFUSED: {kid} is not published in the DID document")


def sign_card(card: dict, sk, kid: str, did: dict) -> dict:
    """Return a copy of `card` carrying one AgentCardSignature. Refuses a key/kid mismatch."""
    from cryptography.hazmat.primitives import serialization
    if kid in REFUSED_KIDS:
        raise SystemExit(f"REFUSED: {kid} — {REFUSED_KIDS[kid]}. A key is scoped by purpose.")
    if kid not in ALLOWED_KIDS:
        raise SystemExit(f"REFUSED: {kid} is not a key scoped to sign the agent card")
    pub = sk.public_key().public_bytes(serialization.Encoding.Raw, serialization.PublicFormat.Raw)
    if b64u(pub) != did_public_x(did, kid):
        raise SystemExit(f"REFUSED: the supplied private key is not the one did.json publishes as {kid}")
    si, prot, _ = signing_input(card, kid)
    sig = sk.sign(si)
    pub_key = sk.public_key()
    pub_key.verify(sig, si)  # raises on failure — never write a signature that does not verify
    out = {k: v for k, v in card.items() if k != "signatures"}
    out["signatures"] = [{"protected": b64u(jcs(prot)), "signature": b64u(sig)}]
    return out


def write_input(card: dict, kid: str) -> None:
    removed: list = []
    p = payload_obj(card, removed)
    prot = protected_header(kid)
    si = b64u(jcs(prot)).encode() + b"." + b64u(jcs(p)).encode()
    non_proto = sorted(k for k in p if k not in PRESENCE["AgentCard"])
    sigs = card.get("signatures") or []
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps({
        "schema": "councilof.ai/agent-card-jws-input/2",
        "spec": "A2A specification §8.4 — JWS (RFC 7515) over JCS (RFC 8785) of the card minus "
                "`signatures`, after §8.4.1 default-value removal (a2aproject/A2A @ 72b3761b)",
        "kid": kid,
        "alg": "EdDSA",
        "protected_b64u": b64u(jcs(prot)),
        "payload_b64u": b64u(jcs(p)),
        "signing_input_sha256": hashlib.sha256(si).hexdigest(),
        "signing_input_bytes": len(si),
        "default_values_removed": removed,
        "non_proto_fields_included": non_proto,
        "portability_warning": (
            "These fields are not in specification/a2a.proto. A verifier that reconstructs the card "
            "through the proto will drop them, canonicalise a different object, and fail this "
            "signature. A JSON-native verifier canonicalising the served bytes will pass it. "
            "Remove them before signing if cross-binding verification matters."
        ) if non_proto else None,
        "state": "SIGNED" if sigs else "UNSIGNED",
        "note": (
            f"SIGNED — {len(sigs)} AgentCardSignature(s). Verify independently: "
            "python3 scripts/verify_agent_card_jws.py"
        ) if sigs else (
            "UNSIGNED — awaiting the private half of " + kid + ", which did.json records as held "
            "off-CI. The moment it is supplied: python3 scripts/adapters/agent_card_jws.py --sign "
            "--key-file <path>. The board key is never substituted."
        ),
    }, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


def main(argv: list[str]) -> int:
    kid = KID
    if "--kid" in argv:
        kid = argv[argv.index("--kid") + 1]
        if not kid.startswith("did:"):
            kid = "did:web:csoai.org#" + kid.lstrip("#")
    card = json.loads(CARD.read_text(encoding="utf-8"))

    if "--sign" in argv:
        key_file = argv[argv.index("--key-file") + 1] if "--key-file" in argv else os.environ.get("CARD_ATTESTATION_KEY_FILE")
        if not key_file:
            print("  REFUSED: --sign needs --key-file PATH (or CARD_ATTESTATION_KEY_FILE)")
            return 2
        did = json.loads(DID.read_text(encoding="utf-8"))
        signed = sign_card(card, load_private_key(key_file), kid, did)
        blob = serialise(signed)
        CARD.write_text(blob, encoding="utf-8")
        ALIAS.write_text(blob, encoding="utf-8")
        card = signed
        print(f"  signed with {kid}; wrote {CARD.relative_to(ROOT)} and {ALIAS.relative_to(ROOT)} (byte-identical)")
        print("  now run: python3 scripts/verify_agent_card_jws.py --tamper-control")

    write_input(card, kid)
    si, _, p = signing_input(card, kid)
    print(f"  signing input : {len(si)} bytes, sha256 {hashlib.sha256(si).hexdigest()[:32]}…")
    print(f"  payload       : JCS over the card minus `signatures`, defaults removed ({len(p)} keys)")
    print(f"  state         : {'SIGNED' if card.get('signatures') else 'UNSIGNED'}")
    print(f"  wrote         : {OUT.relative_to(ROOT)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
