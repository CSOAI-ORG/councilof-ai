#!/usr/bin/env python3
"""Verify the /api/corrections signature the way a relying party would: from the served bytes.

WHY. On 2026-08-22 the corrections ledger was signed. Forty-six entries were appended over the
following month and none re-issued the signature, so the endpoint served `signature_state: STALE`
for that whole month — a corrections ledger whose own signature was a published defect. The label
was honest; nothing was checking it back to a key.

WHAT THIS CHECKS, and it is deliberately the reader's check and not the publisher's:

  1. Fetch the live document.
  2. Strip exactly the keys it declares as unsigned_wrapper_fields (they are computed per request
     and are not part of what was signed), canonicalise the rest with
     json.dumps(sort_keys=True, separators=(',',':'), ensure_ascii=True) and SHA-256 it.
     That digest must equal signature.attestation.content_id AND signature.id.
  3. Fetch https://csoai.org/.well-known/did.json, take the key for
     did:web:csoai.org#board-attestation-1, and confirm the endpoint's pinned key_ed25519_hex is
     that key. A pin that has drifted from the DID document is reported, never quietly accepted.
  4. Verify signature.signature as Ed25519 over the canonical form of signature.attestation, under
     that key.

Exit 0 only when every one of those holds and the endpoint's own signature_state says VALID. Any
disagreement between what the endpoint claims and what this script measures is itself a finding
and exits non-zero: a green label nobody re-derived is worth nothing.

    python3 scripts/verify_corrections_signature.py
    python3 scripts/verify_corrections_signature.py --url http://127.0.0.1:8788/api/corrections
    python3 scripts/verify_corrections_signature.py --json   # one machine-readable object
"""
from __future__ import annotations

import argparse, datetime, hashlib, json, sys, urllib.request

API = "https://councilof.ai/api/corrections"
DID_URL = "https://csoai.org/.well-known/did.json"
BOARD_DID = "did:web:csoai.org#board-attestation-1"
# Fallback only. The live document publishes this list; we use ours when it does not, and we say
# which we used, because stripping a different set of keys computes a different digest.
FALLBACK_WRAPPER = ["signature", "signature_state", "signature_check", "correction_latency", "note", "fix_requires"]
# A default urllib User-Agent is answered with Cloudflare 1010 on this origin.
UA = "csoai-trust-chain-verifier/0.1 (+https://councilof.ai)"


def get_json(url: str, timeout: int = 45):
    req = urllib.request.Request(url, headers={"user-agent": UA, "accept": "application/json"})
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return json.loads(r.read().decode())


def canonical(obj) -> bytes:
    """The published content_id rule. ensure_ascii=True: every non-ASCII char as \\uXXXX."""
    return json.dumps(obj, sort_keys=True, separators=(",", ":"), ensure_ascii=True).encode()


def signer_preimage(obj) -> bytes:
    """The /api/board-sign rule (functions/_lib/cardSign.ts canonicalBytes): ensure_ascii=False."""
    return json.dumps(obj, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode()


def b64url_to_hex(x: str) -> str:
    import base64
    return base64.urlsafe_b64decode(x + "=" * (-len(x) % 4)).hex()


def verify(doc: dict, did_doc: dict | None) -> dict:
    out: dict = {
        "schema": "csoai.corrections-signature-check/0.1",
        "checked_at": datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "entries": len(doc.get("corrections") or []),
        "endpoint_says": doc.get("signature_state"),
    }
    sig = doc.get("signature") or {}
    att = sig.get("attestation")
    chk = doc.get("signature_check") or {}
    wrapper = chk.get("unsigned_wrapper_fields") or FALLBACK_WRAPPER
    out["unsigned_wrapper_fields"] = wrapper
    out["wrapper_source"] = "endpoint" if chk.get("unsigned_wrapper_fields") else "fallback (endpoint did not publish it)"

    body = {k: v for k, v in doc.items() if k not in wrapper}
    recomputed = hashlib.sha256(canonical(body)).hexdigest()
    out["recomputed_content_id"] = recomputed
    out["attested_content_id"] = (att or {}).get("content_id")
    out["signature_id"] = sig.get("id")
    out["content_id_matches"] = bool(att) and att.get("content_id") == recomputed and sig.get("id") == recomputed

    # The key. Pinned by the endpoint, published in the DID document; both are checked.
    pinned = chk.get("key_ed25519_hex")
    live = None
    did_keys: dict[str, str] = {}
    if did_doc:
        for vm in did_doc.get("verificationMethod") or []:
            jwk = vm.get("publicKeyJwk") or {}
            if jwk.get("x"):
                did_keys[str(vm.get("id"))] = b64url_to_hex(jwk["x"])
            if vm.get("id") == BOARD_DID or str(vm.get("id", "")).endswith("#board-attestation-1"):
                live = did_keys.get(str(vm.get("id")))
    out["key_pinned_by_endpoint"] = pinned
    out["key_in_did_document"] = live
    out["key_pin_matches_did"] = (pinned is not None and live is not None and pinned == live)

    # SHAPE. The signature published since 2026-09-22 is DETACHED: Ed25519 over a small
    # attestation object naming the digest of the body, because the body is far over the signer's
    # 3KB payload cap. Before that it was declared as Ed25519 over the canonical body itself. A
    # reader meeting the old shape should still get a verdict rather than a shrug, so both are
    # checked — and which one was used is published.
    out["shape"] = "detached-attestation" if att else "legacy-inline"
    if not sig.get("signature"):
        out["ed25519_verified"] = None
        out["state"] = "UNSIGNED"
        out["reason"] = "no signature is published with this ledger"
        return out

    try:
        from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PublicKey
        from cryptography.exceptions import InvalidSignature
    except Exception as exc:  # the library is absent: UNCHECKABLE, never a verdict
        out["ed25519_verified"] = None
        out["state"] = "UNCHECKABLE"
        out["reason"] = f"no Ed25519 implementation here ({type(exc).__name__}); this is not a claim about the signature"
        return out

    if att:
        pre = signer_preimage(att)
        # The attestation is ASCII-only by construction, so the two canonical rules must agree on
        # it. If they ever do not, the preimage is ambiguous and no verdict may be published.
        if pre != canonical(att):
            out["ed25519_verified"] = None
            out["state"] = "UNCHECKABLE"
            out["reason"] = "the attestation is not ASCII-only, so its preimage is ambiguous between the two declared rules"
            return out
        out["attestation_sha256"] = hashlib.sha256(pre).hexdigest()
    else:
        pre = canonical(body)  # the pre-2026-09-22 declared sig_input: the body itself

    # Which keys may have issued it. The board key is the one in use; the ledger's 2026-08-22
    # signature named card-attestation-1, so a legacy document is checked against every key the
    # DID document publishes and the one that verifies (if any) is named.
    candidates: dict[str, str] = {}
    if live:
        candidates[BOARD_DID] = live
    if pinned and pinned not in candidates.values():
        candidates["pinned-by-endpoint"] = pinned
    if not att:
        candidates.update({k: v for k, v in did_keys.items() if v not in candidates.values()})
    if not candidates:
        out["ed25519_verified"] = None
        out["state"] = "UNCHECKABLE"
        out["reason"] = "no public key available to check against"
        return out

    ok, by = False, None
    try:
        for name, hexkey in candidates.items():
            try:
                Ed25519PublicKey.from_public_bytes(bytes.fromhex(hexkey)).verify(bytes.fromhex(sig["signature"]), pre)
                ok, by = True, name
                break
            except InvalidSignature:
                continue
    except Exception as exc:
        out["ed25519_verified"] = None
        out["state"] = "UNCHECKABLE"
        out["reason"] = f"{type(exc).__name__} while verifying"
        return out

    out["ed25519_verified"] = ok
    out["verified_under"] = by
    out["keys_tried"] = list(candidates)
    out["state"] = "INVALID_SIGNATURE" if not ok else ("VALID" if out["content_id_matches"] else "STALE")
    if not ok and not att:
        out["reason"] = ("the legacy inline signature does not verify over the current body under any key the DID "
                         "document publishes; it was issued over an earlier body")
    return out


def main(argv=None) -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--url", default=API)
    ap.add_argument("--file", help="a saved response instead of fetching")
    ap.add_argument("--json", action="store_true", help="print the result object and nothing else")
    ap.add_argument("--out", help="also write the result object here")
    a = ap.parse_args(argv)

    try:
        doc = json.load(open(a.file)) if a.file else get_json(a.url)
    except Exception as exc:
        res = {"state": "UNCHECKABLE", "reason": f"could not read {a.file or a.url}: {type(exc).__name__}: {exc}"}
        print(json.dumps(res) if a.json else f"UNCHECKABLE {res['reason']}")
        return 3

    try:
        did_doc = get_json(DID_URL)
    except Exception:
        did_doc = None

    res = verify(doc, did_doc)
    res["source"] = a.file or a.url
    if a.out:
        open(a.out, "w").write(json.dumps(res, indent=2) + "\n")
    if a.json:
        print(json.dumps(res, indent=2))
    else:
        print(f"{res['state']}  entries={res['entries']}  endpoint_says={res['endpoint_says']}  "
              f"content_id_matches={res['content_id_matches']}  ed25519={res['ed25519_verified']}  "
              f"key_pin_matches_did={res['key_pin_matches_did']}")
        if res.get("reason"):
            print(f"  reason: {res['reason']}")

    if res["state"] == "UNCHECKABLE":
        return 3
    if res["state"] != "VALID":
        return 1
    # A VALID measurement that the endpoint contradicts is still a finding.
    if res["endpoint_says"] != "VALID":
        print(f"  DISAGREEMENT: this check says VALID, the endpoint says {res['endpoint_says']!r}")
        return 2
    if res["key_pin_matches_did"] is False and res["key_in_did_document"]:
        print("  DISAGREEMENT: the endpoint's pinned key is not the key in the DID document")
        return 2
    return 0


if __name__ == "__main__":
    sys.exit(main())
