# SPDX-License-Identifier: Apache-2.0
"""Offline verification of a signed evidence batch dir (batch.json, batch.signed.json, events.jsonl). Framework-free."""
import base64, hashlib, json, os


def canon(o):
    return json.dumps(o, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode()


def verify_dir(d, did):
    from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PublicKey
    try:
        braw = open(os.path.join(d, "batch.json"), "rb").read()
        signed = json.load(open(os.path.join(d, "batch.signed.json")))
        eraw = open(os.path.join(d, "events.jsonl"), "rb").read()
        batch = json.loads(braw); pay, sg = signed["payload"], signed["signature"]
    except Exception as ex:
        return "INVALID", f"unreadable: {type(ex).__name__}", []
    if hashlib.sha256(canon(pay)).hexdigest() != sg.get("payload_sha256") or pay.get("artifact", {}).get("sha256") != hashlib.sha256(braw).hexdigest():
        return "INVALID", "digest mismatch", []
    frag = (sg.get("did") or "").split("#")[-1]
    m = next((m for m in did.get("verificationMethod", []) if m.get("id", "").endswith("#" + frag)), None)
    if not m:
        return "UNVERIFIABLE_KEY", f"key {sg.get('did')!r} not pinned", []
    x = m["publicKeyJwk"]["x"]
    try:
        Ed25519PublicKey.from_public_bytes(base64.urlsafe_b64decode(x + "=" * (-len(x) % 4))).verify(bytes.fromhex(sg["sig_ed25519"]), canon(pay))
    except Exception:
        return "INVALID", "Ed25519 signature does not verify", []
    if batch.get("events_file", {}).get("sha256") != hashlib.sha256(eraw).hexdigest():
        return "INVALID", "events differ from the signed batch", []
    evs = [json.loads(l) for l in eraw.decode().splitlines() if l.strip()]
    return "VALID", f"signed by {sg.get('did')} at {sg.get('signed_at')}", evs
