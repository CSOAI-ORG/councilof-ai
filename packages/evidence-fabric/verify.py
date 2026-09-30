#!/usr/bin/env python3
# SPDX-License-Identifier: Apache-2.0
"""Offline verifier for a signed evidence batch (csoai.signed-run/0.1 over a csoai.evidence-batch/0.1 record).

    python3 verify.py BATCH.json BATCH.signed.json EVENTS.jsonl --did did.json      -> VALID | INVALID | UNVERIFIABLE_KEY
    python3 verify.py ... --tamper-control      also flips one byte of each input and requires INVALID for every one

Checks, in order (any failure stops with the reason):
 1. sha256(canonical payload) == signature.payload_sha256   (canonical: JSON, keys sorted, no whitespace, UTF-8)
 2. payload.artifact.sha256 == sha256(BATCH.json bytes)
 3. the key named by signature.did is in the DID document; else UNVERIFIABLE_KEY (never VALID)
 4. Ed25519 signature over the canonical payload verifies with that key
 5. BATCH.events_file.sha256 == sha256(EVENTS.jsonl bytes), and every event_id recomputes and matches the list
Exit 0 VALID, 1 INVALID, 3 UNVERIFIABLE_KEY, 2 input error. A VALID result shows who signed these bytes and
that they are unchanged. It does not show that any claim inside is true.
"""
import argparse, base64, hashlib, json, os, sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import event as E  # noqa: E402


def canon(o):
    return json.dumps(o, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode()


def key_from_did(did_doc, kid):
    frag = kid.split("#", 1)[-1] if "#" in kid else None
    for m in did_doc.get("verificationMethod", []):
        if frag and m.get("id", "").endswith("#" + frag):
            jwk = m.get("publicKeyJwk") or {}
            if jwk.get("crv") == "Ed25519" and jwk.get("x"):
                return base64.urlsafe_b64decode(jwk["x"] + "=" * (-len(jwk["x"]) % 4))
    return None


def verify_bytes(batch_raw, signed_raw, events_raw, did_doc):
    try:
        from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PublicKey
        from cryptography.exceptions import InvalidSignature
    except ImportError:
        return "UNCHECKABLE", "python cryptography not installed"
    try:
        signed = json.loads(signed_raw)
        batch = json.loads(batch_raw)
        pay, sg = signed["payload"], signed["signature"]
    except Exception as ex:  # malformed input is INVALID, not an error to hide
        return "INVALID", f"unparseable input: {type(ex).__name__}"
    if hashlib.sha256(canon(pay)).hexdigest() != sg.get("payload_sha256"):
        return "INVALID", "payload digest differs from signature.payload_sha256"
    if pay.get("artifact", {}).get("sha256") != hashlib.sha256(batch_raw).hexdigest():
        return "INVALID", "batch bytes differ from payload.artifact.sha256"
    kid = sg.get("did") or ""
    raw_key = key_from_did(did_doc, kid)
    if raw_key is None:
        return "UNVERIFIABLE_KEY", f"key {kid!r} not in the DID document"
    try:
        Ed25519PublicKey.from_public_bytes(raw_key).verify(bytes.fromhex(sg["sig_ed25519"]), canon(pay))
    except (InvalidSignature, ValueError):
        return "INVALID", "Ed25519 signature does not verify"
    ef = batch.get("events_file", {})
    if ef.get("sha256") != hashlib.sha256(events_raw).hexdigest():
        return "INVALID", "events file bytes differ from the signed batch"
    try:
        evs = [json.loads(l) for l in events_raw.decode("utf-8").splitlines() if l.strip()]
    except Exception:
        return "INVALID", "events file unparseable"
    ids = [E.compute_event_id(ev) for ev in evs]
    if ids != [ev.get("event_id") for ev in evs] or ids != batch.get("event_ids"):
        return "INVALID", "an event_id does not recompute or the list differs"
    return "VALID", f"{len(evs)} events; signed by {kid} at {sg.get('signed_at')}"


EXIT = {"VALID": 0, "INVALID": 1, "UNVERIFIABLE_KEY": 3, "UNCHECKABLE": 3}


def flip(b, i=None):
    b = bytearray(b)
    i = len(b) // 2 if i is None else i
    b[i] ^= 0x01
    return bytes(b)


def main(argv=None):
    ap = argparse.ArgumentParser()
    ap.add_argument("batch"); ap.add_argument("signed"); ap.add_argument("events")
    ap.add_argument("--did", required=True, help="a saved copy of https://csoai.org/.well-known/did.json")
    ap.add_argument("--tamper-control", action="store_true")
    a = ap.parse_args(argv)
    try:
        b, s, e = (open(p, "rb").read() for p in (a.batch, a.signed, a.events))
        did = json.load(open(a.did))
    except OSError as ex:
        print(f"ERROR {ex}"); return 2
    state, why = verify_bytes(b, s, e, did)
    out = {"result": state, "reason": why}
    if a.tamper_control:
        sj = json.loads(s); h = sj["signature"]["sig_ed25519"]
        sj["signature"]["sig_ed25519"] = ("0" if h[0] != "0" else "1") + h[1:]
        c = {"batch byte flipped": verify_bytes(flip(b), s, e, did)[0],
             "signature first nibble changed": verify_bytes(b, json.dumps(sj).encode(), e, did)[0],
             "events byte flipped": verify_bytes(b, s, flip(e), did)[0]}
        out["tamper_controls"] = c
        if any(v == "VALID" for v in c.values()):
            out["result"] = "INVALID"; out["reason"] = "a tamper control was accepted: the verifier does not discriminate"
    print(json.dumps(out, indent=1))
    return EXIT[out["result"]]


if __name__ == "__main__":
    sys.exit(main())
