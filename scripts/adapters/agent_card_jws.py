#!/usr/bin/env python3
"""Prepare the A2A AgentCard for JWS signing (spec §8.4), and verify it afterwards.

An estate that signs its measurement cards and leaves its own agent card unsigned has left its
cheapest signature unmade. AgentCardSignature is proto field 13 — optional, and absent from ours.

The rule, from A2A specification §8.4.1, is exact and unforgiving:
  * canonicalise with JCS (RFC 8785)
  * EXCLUDE the `signatures` field from the signed content (circular dependency)
  * respect protobuf field-presence: optional-not-set omitted, REQUIRED always present

THE TRAP, and why this script reports rather than assumes:
our card carries keys that are not in specification/a2a.proto — protocolVersion, url, catalogUrl,
documentation, doi, explicitly_not. A verifier that reconstructs the card THROUGH the proto (any
gRPC binding) will drop unknown fields, canonicalise a smaller object, and the signature will not
verify. A JSON-native verifier that canonicalises the bytes as served will verify it fine. So the
same signed card is valid or invalid depending on the verifier's path, which is exactly the class
of ambiguity a signature is supposed to remove. This script names those fields explicitly so the
choice is made deliberately instead of discovered later.

Run:   python3 scripts/adapters/agent_card_jws.py            # emit the signing input
       python3 scripts/adapters/agent_card_jws.py --verify   # check a signature already present
"""
from __future__ import annotations
import base64, json, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
CARD = ROOT / "public" / ".well-known" / "agent-card.json"
OUT = ROOT / "public" / "interop" / "agent-card-jws-input.json"
KID = "did:web:csoai.org#card-attestation-1"

# Fields defined in specification/a2a.proto message AgentCard (JSON names).
PROTO_FIELDS = {
    "name", "description", "supportedInterfaces", "provider", "version", "documentationUrl",
    "capabilities", "securitySchemes", "securityRequirements", "defaultInputModes",
    "defaultOutputModes", "skills", "signatures", "iconUrl",
}


def jcs(obj) -> bytes:
    """RFC 8785 JSON Canonicalization Scheme.

    Python's json.dumps with sort_keys and tight separators matches JCS for the value types an
    AgentCard contains (strings, booleans, arrays, objects, and integers). It does NOT match JCS
    for floats needing ES6 shortest-round-trip formatting; an AgentCard has none, and this asserts
    that rather than trusting it.
    """
    def check(o):
        if isinstance(o, float):
            raise ValueError("float in AgentCard: JCS number formatting (ES6) is not implemented here")
        if isinstance(o, dict):
            for v in o.values(): check(v)
        elif isinstance(o, list):
            for v in o: check(v)
    check(obj)
    return json.dumps(obj, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode("utf-8")


def b64u(b: bytes) -> str:
    return base64.urlsafe_b64encode(b).decode().rstrip("=")


def signing_input(card: dict) -> tuple[bytes, dict, dict]:
    payload_obj = {k: v for k, v in card.items() if k != "signatures"}
    protected = {"alg": "EdDSA", "kid": KID, "typ": "JOSE"}
    si = b64u(jcs(protected)).encode() + b"." + b64u(jcs(payload_obj)).encode()
    return si, protected, payload_obj


def main() -> int:
    card = json.loads(CARD.read_text(encoding="utf-8"))
    si, protected, payload_obj = signing_input(card)
    non_proto = sorted(k for k in payload_obj if k not in PROTO_FIELDS)

    if "--verify" in sys.argv:
        sigs = card.get("signatures") or []
        if not sigs:
            print("  UNCHECKABLE — the card carries no signatures field"); return 1
        print(f"  {len(sigs)} signature(s) present; signing input is {len(si)} bytes")
        print("  (verification needs the published key; run against did:web:csoai.org)")
        return 0

    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps({
        "schema": "councilof.ai/agent-card-jws-input/1",
        "spec": "A2A specification §8.4 — JWS over JCS(card minus signatures)",
        "kid": KID,
        "alg": "EdDSA",
        "protected_b64u": b64u(jcs(protected)),
        "payload_b64u": b64u(jcs(payload_obj)),
        "signing_input_sha256": __import__("hashlib").sha256(si).hexdigest(),
        "signing_input_bytes": len(si),
        "non_proto_fields_included": non_proto,
        "portability_warning": (
            "These fields are not in specification/a2a.proto. A verifier that reconstructs the card "
            "through the proto will drop them, canonicalise a different object, and fail this "
            "signature. A JSON-native verifier canonicalising the served bytes will pass it. "
            "Remove them before signing if cross-binding verification matters."
        ) if non_proto else None,
        "note": "NO_LAPTOP_SIGN — signing input for GHA OIDC. The signature is not produced here.",
    }, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")

    print(f"  signing input : {len(si)} bytes, sha256 {__import__('hashlib').sha256(si).hexdigest()[:32]}…")
    print(f"  payload       : JCS over the card minus `signatures` ({len(payload_obj)} keys)")
    print(f"  wrote         : {OUT.relative_to(ROOT)}")
    if non_proto:
        print(f"\n  PORTABILITY WARNING — {len(non_proto)} non-proto fields would be signed:")
        for k in non_proto: print(f"    {k}")
        print("    A proto-path verifier drops these and the signature fails. Decide before signing.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
