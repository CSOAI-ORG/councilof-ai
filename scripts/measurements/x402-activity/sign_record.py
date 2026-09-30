#!/usr/bin/env python3
"""Board-sign one record via POST /api/board-sign (pod caller token), verify locally, run 3 altered-preimage controls, OTS-stamp.

    python3 sign_record.py RECORD.json --artifact-path PATH --extra EXTRA.json [--token-file ~/.secrets/board-sign-pod-token]

Writes RECORD.signed.json (csoai.signed-run/0.1), RECORD.json.ots and RECORD.ots.json beside the record.
The token is read from the file inside this process and never printed, logged or written anywhere.
"""
import argparse, base64, hashlib, json, os, sys, urllib.error, urllib.request

sys.path.insert(0, os.path.expanduser("~/lanes/flywheel"))
from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PublicKey

DID = "did:web:csoai.org#board-attestation-1"
UA = "Mozilla/5.0 csoai-pod-signer (measurement-pages-20260926)"


def canon(o):
    return json.dumps(o, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode()


def did_key():
    doc = json.load(urllib.request.urlopen(urllib.request.Request("https://csoai.org/.well-known/did.json", headers={"User-Agent": UA}), timeout=30))
    for m in doc["verificationMethod"]:
        if m["id"].endswith("#board-attestation-1"):
            x = m["publicKeyJwk"]["x"]
            return x, Ed25519PublicKey.from_public_bytes(base64.urlsafe_b64decode(x + "=" * (-len(x) % 4)))
    raise SystemExit("board-attestation-1 not in did.json")


def verifies(pub, signed, artifact):
    pay, sg = signed["payload"], signed["signature"]
    if hashlib.sha256(canon(pay)).hexdigest() != sg["payload_sha256"] or pay["artifact"]["sha256"] != hashlib.sha256(artifact).hexdigest():
        return False
    try:
        pub.verify(bytes.fromhex(sg["sig_ed25519"]), canon(pay)); return True
    except Exception:
        return False


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("record"); ap.add_argument("--artifact-path", required=True); ap.add_argument("--extra", required=True)
    ap.add_argument("--token-file", default=os.path.expanduser("~/.secrets/board-sign-pod-token"))
    ap.add_argument("--endpoint", default="https://councilof.ai/api/board-sign")
    a = ap.parse_args()
    raw = open(a.record, "rb").read(); doc = json.loads(raw)
    payload = {"schema": "csoai.signed-artifact/0.1", "signer": f"{DID} via POST /api/board-sign (pod caller token)",
               "not_a_grade": ("The signature proves these bytes were signed by the board key on the date below; it does not prove any claim "
                               "inside beyond what the record's own sources and instruments show."),
               "artifact": {"path": a.artifact_path, "sha256": hashlib.sha256(raw).hexdigest(), "schema": doc["schema"], "as_of": doc["as_of"]},
               **json.load(open(a.extra))}
    if len(canon(payload)) > 3072:
        raise SystemExit(f"payload {len(canon(payload))} bytes > 3072")
    with open(a.token_file) as f:
        tok = f.read().strip()
    req = urllib.request.Request(a.endpoint, data=json.dumps({"payload": payload}).encode(), method="POST",
                                 headers={"authorization": f"Bearer {tok}", "content-type": "application/json", "User-Agent": UA})
    del tok
    try:
        resp = json.load(urllib.request.urlopen(req, timeout=60))
    except urllib.error.HTTPError as e:
        raise SystemExit(f"board-sign HTTP {e.code}")
    if resp.get("payload_sha256") != hashlib.sha256(canon(payload)).hexdigest():
        raise SystemExit("preimage mismatch: returned payload_sha256 != local digest")
    signed = {"schema": "csoai.signed-run/0.1", "payload": payload,
              "signature": {"did": resp.get("did", DID), "alg": "Ed25519", "sig_ed25519": resp["sig_ed25519"],
                            "payload_sha256": resp["payload_sha256"], "signer_auth": resp.get("signer_auth"), "signed_at": resp.get("signed_at"),
                            "canonical": "JSON, keys sorted, no whitespace, UTF-8, non-ASCII unescaped"}}
    x, pub = did_key()
    ok = verifies(pub, signed, raw)
    c = {}
    c["trailing byte appended to the record"] = "rejected (control holds)" if not verifies(pub, signed, raw + b"\n") else "ACCEPTED (control FAILED)"
    alt = json.loads(json.dumps(signed)); alt["payload"]["artifact"]["sha256"] = "0" * 64
    alt["signature"]["payload_sha256"] = hashlib.sha256(canon(alt["payload"])).hexdigest()
    c["artifact sha256 altered in the payload"] = "rejected (control holds)" if not verifies(pub, alt, raw) else "ACCEPTED (control FAILED)"
    alt = json.loads(json.dumps(signed)); b = bytearray(bytes.fromhex(alt["signature"]["sig_ed25519"])); b[0] ^= 1
    alt["signature"]["sig_ed25519"] = b.hex()
    c["signature bit flipped"] = "rejected (control holds)" if not verifies(pub, alt, raw) else "ACCEPTED (control FAILED)"
    if not ok or any("FAILED" in v for v in c.values()):
        raise SystemExit(f"local verification failed: ok={ok} controls={c}")
    signed["local_verification"] = {"did_document": "https://csoai.org/.well-known/did.json", "key_x": x, "result": "VERIFIES",
                                    "altered_preimage_controls": c}
    signed["verify"] = ("canonicalise payload (JSON, keys sorted, no whitespace, UTF-8); sha256 must equal signature.payload_sha256; "
                        "payload.artifact.sha256 must equal sha256 of the record's bytes; verify sig_ed25519 (hex) with the "
                        "#board-attestation-1 Ed25519 key in https://csoai.org/.well-known/did.json")
    base = a.record[:-5] if a.record.endswith(".json") else a.record
    with open(base + ".signed.json", "w") as f:
        f.write(json.dumps(signed, indent=1, ensure_ascii=False) + "\n")
    import fwlib
    side = fwlib.ots_stamp(a.record, a.record + ".ots", base + ".ots.json")
    print(json.dumps({"signed": base + ".signed.json", "artifact_sha256": payload["artifact"]["sha256"], "payload_sha256": resp["payload_sha256"],
                      "signed_at": resp.get("signed_at"), "signer_auth": resp.get("signer_auth"), "result": "VERIFIES", "controls": c,
                      "ots": {"calendars_accepted": len(side["calendars_accepted"]), "state": side["state"]}}, indent=1))


if __name__ == "__main__":
    main()
