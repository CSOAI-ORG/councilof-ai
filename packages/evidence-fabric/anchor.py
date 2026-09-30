#!/usr/bin/env python3
# SPDX-License-Identifier: Apache-2.0
"""Log a board-signed record (csoai.signed-run/0.1) in the public Rekor transparency log.

    python3 anchor.py rekor SIGNED.json --did did.json --out SIGNED.rekor.json
    python3 anchor.py ots-upgrade PROOF.ots [...]     upgrade pending OpenTimestamps proofs in place (additive; the file
                                                     digest must not change); prints each proof's state

Same entry shape as scripts/witness_public_root.py (the producer of Rekor 2981565650): kind `rekord`, the data is
the exact signed preimage (canonical payload bytes), the signature is the board's Ed25519 signature, and the
public key is the #board-attestation-1 key from the DID document, as PEM. Rekor checks the signature over the
data before it logs the entry, so an entry exists only for a signature that verifies. A 409 (already logged)
fetches the existing entry. Network failure is UNCHECKABLE, never a fake witness.
"""
import argparse, base64, json, os, re, sys, urllib.error, urllib.request

REKOR = "https://rekor.sigstore.dev"
UA = {"User-Agent": "csoai-evidence-fabric/0.1", "Content-Type": "application/json", "Accept": "application/json"}


def canon(o):
    return json.dumps(o, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode()


def pem_from_did(did, kid):
    from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PublicKey
    from cryptography.hazmat.primitives import serialization
    frag = kid.split("#")[-1]
    m = next(m for m in did["verificationMethod"] if m["id"].endswith("#" + frag))
    x = m["publicKeyJwk"]["x"]
    k = Ed25519PublicKey.from_public_bytes(base64.urlsafe_b64decode(x + "=" * (-len(x) % 4)))
    return k.public_bytes(serialization.Encoding.PEM, serialization.PublicFormat.SubjectPublicKeyInfo)


def rekord(preimage, sig, pem):
    body = {"apiVersion": "0.0.1", "kind": "rekord", "spec": {
        "data": {"content": base64.b64encode(preimage).decode()},
        "signature": {"format": "x509", "content": base64.b64encode(sig).decode(),
                      "publicKey": {"content": base64.b64encode(pem).decode()}}}}
    req = urllib.request.Request(f"{REKOR}/api/v1/log/entries", data=json.dumps(body).encode(), headers=UA, method="POST")
    try:
        with urllib.request.urlopen(req, timeout=60) as r:
            out = json.loads(r.read()); new = True
    except urllib.error.HTTPError as err:
        text = err.read().decode("utf-8", "replace")
        m = re.search(r"[0-9a-f]{64,80}", text + " " + (err.headers.get("Location") or "")) if err.code == 409 else None
        if not m:
            return {"status": "UNCHECKABLE", "reason": f"rekor HTTP {err.code}: {text[:160]}"}
        with urllib.request.urlopen(urllib.request.Request(f"{REKOR}/api/v1/log/entries/{m.group(0)}", headers=UA), timeout=60) as r:
            out = json.loads(r.read()); new = False
    except Exception as ex:
        return {"status": "UNCHECKABLE", "reason": f"rekor unreachable: {ex}"[:200]}
    uuid = next(iter(out)); e = out[uuid]
    return {"status": "LOGGED", "uuid": uuid, "logIndex": e.get("logIndex"), "integratedTime": e.get("integratedTime"),
            "logID": e.get("logID"), "new": new, "entry": out}


def ots_upgrade(paths):
    import io
    from opentimestamps.calendar import RemoteCalendar
    from opentimestamps.core.notary import BitcoinBlockHeaderAttestation, PendingAttestation
    from opentimestamps.core.serialize import StreamDeserializationContext, StreamSerializationContext
    from opentimestamps.core.timestamp import DetachedTimestampFile

    def walk(t):
        out = [(t, a) for a in t.attestations]
        for sub in t.ops.values():
            out += walk(sub)
        return out
    res = {}
    for p in paths:
        dtf = DetachedTimestampFile.deserialize(StreamDeserializationContext(io.BytesIO(open(p, "rb").read())))
        dig = dtf.file_digest
        btc = lambda: sorted({a.height for _, a in walk(dtf.timestamp) if isinstance(a, BitcoinBlockHeaderAttestation)})
        if not btc():
            for sub, a in walk(dtf.timestamp):
                if isinstance(a, PendingAttestation):
                    try:
                        sub.merge(RemoteCalendar(a.uri.decode() if isinstance(a.uri, bytes) else a.uri).get_timestamp(sub.msg))
                    except Exception:
                        pass
            if btc() and dtf.file_digest == dig:
                buf = io.BytesIO(); dtf.serialize(StreamSerializationContext(buf))
                open(p + ".tmp", "wb").write(buf.getvalue()); os.replace(p + ".tmp", p)
        res[p] = f"bitcoin:{','.join(map(str, btc()))}" if btc() else "pending"
    return res


def main(argv=None):
    ap = argparse.ArgumentParser()
    ap.add_argument("cmd", choices=["rekor", "ots-upgrade"]); ap.add_argument("signed", nargs="+"); ap.add_argument("--did"); ap.add_argument("--out")
    a = ap.parse_args(argv)
    if a.cmd == "ots-upgrade":
        print(json.dumps(ots_upgrade(a.signed), indent=1)); return 0
    a.signed = a.signed[0]
    s = json.load(open(a.signed)); did = json.load(open(a.did))
    res = rekord(canon(s["payload"]), bytes.fromhex(s["signature"]["sig_ed25519"]), pem_from_did(did, s["signature"]["did"]))
    json.dump(res, open(a.out, "w"), indent=1)
    print(json.dumps({k: v for k, v in res.items() if k != "entry"}, indent=1))
    return 0 if res["status"] == "LOGGED" else 3


if __name__ == "__main__":
    sys.exit(main())
