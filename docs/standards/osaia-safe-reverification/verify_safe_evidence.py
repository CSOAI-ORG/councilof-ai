#!/usr/bin/env python3
"""Stranger-runnable verification recipe for the SAFE Evidence & Re-verification Profile (DRAFT).

    python3 verify_safe_evidence.py <dataset-base-url-or-local-dir> [--record record.json] [--no-ots-upgrade]

Checks, in order, and prints one line per check. Exit 0 only if every REQUIRED check holds.

  1  record bytes      sha256(record.json) == signed payload.artifact.sha256          REQUIRED
  2  payload digest    sha256(canonical(payload)) == signature.payload_sha256            REQUIRED
  3  signature         Ed25519 over canonical(payload) verifies under the key that the
                       signature's DID document publishes (fetched live, not trusted
                       from the record)                                                 REQUIRED
  4  negative controls the same check REJECTS (a) a trailing byte appended to the
                       preimage, (b) the artifact digest replaced with zeros, and
                       (c) a one-bit flip of record.json no longer matches the digest    REQUIRED
  5  timestamp proof   record.json.ots parses and binds to sha256(record.json); its
                       attestation types are reported as found. PENDING is reported as
                       PENDING, never as a Bitcoin attestation                           REPORTED
  6  timestamp upgrade optional, read-only: asks the calendars whether a pending
                       commitment has been upgraded; nothing is written                 REPORTED
  7  bitcoin anchor    optional: compares each upgraded commitment with the merkle root
                       of that block header, read from a public Esplora explorer (a
                       stated trust assumption; `ots verify` against your own node is
                       stronger)                                                        REPORTED

What a PASS here proves: these bytes are the bytes the named key signed, and (if 5/6 say so)
that they existed by some time. It does NOT prove that anything the record says is true, that
the method behind it could return a negative result, or that the signer is trustworthy.

Dependencies: python3 >= 3.9, `cryptography`. Optional: `opentimestamps` for checks 5-6.
Licence: Apache-2.0.
"""
import argparse, base64, hashlib, json, pathlib, sys, urllib.request

UA = {"user-agent": "safe-evidence-verify/0.1"}


def sha(b):
    return hashlib.sha256(b).hexdigest()


def get(base, name):
    if base.startswith("http"):
        u = base.rstrip("/") + "/" + name
        return urllib.request.urlopen(urllib.request.Request(u, headers=UA), timeout=30).read()
    return (pathlib.Path(base) / name).read_bytes()


def canonical(obj):
    # Key-sorted, no whitespace, UTF-8. Equal to JSON.stringify of a key-sorted object for
    # payloads without floats; payloads carrying floats MUST state their number encoding.
    return json.dumps(obj, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode()


def did_web_key(did_url):
    # did:web:example.org#frag  ->  https://example.org/.well-known/did.json
    did, frag = did_url.split("#", 1)
    host = did[len("did:web:"):].replace(":", "/")
    path = "/.well-known/did.json" if "/" not in host else "/did.json"
    doc = json.load(urllib.request.urlopen(urllib.request.Request("https://" + host + path, headers=UA), timeout=30))
    for m in doc.get("verificationMethod", []):
        if m["id"].endswith("#" + frag):
            jwk = m["publicKeyJwk"]
            assert jwk.get("kty") == "OKP" and jwk.get("crv") == "Ed25519", jwk
            return base64.urlsafe_b64decode(jwk["x"] + "=" * (-len(jwk["x"]) % 4)), "https://" + host + path
    raise SystemExit(f"key {did_url} not in DID document")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("base")
    ap.add_argument("--record", default="record.json")
    ap.add_argument("--no-ots-upgrade", action="store_true")
    ap.add_argument("--explorer", default="https://blockstream.info/api",
                    help="Esplora-compatible API used to read block headers for check 7; '' disables it")
    a = ap.parse_args()
    from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PublicKey
    from cryptography.exceptions import InvalidSignature

    stem = a.record[:-len(".json")]
    raw = get(a.base, a.record)
    signed = json.loads(get(a.base, stem + ".signed.json"))
    p, s = signed["payload"], signed["signature"]
    ok = True

    def line(n, name, holds, detail, required=True):
        nonlocal ok
        ok = ok and (holds or not required)
        print(f"{n}  {name:<18} {'HOLDS' if holds else ('FAILS' if required else 'NOT HELD')}  {detail}")

    line(1, "record bytes", sha(raw) == p["artifact"]["sha256"], f"sha256={sha(raw)}")
    canon = canonical(p)
    line(2, "payload digest", sha(canon) == s["payload_sha256"], f"payload_sha256={sha(canon)}")
    key, did_doc = did_web_key(s["did"])
    pk = Ed25519PublicKey.from_public_bytes(key)
    sig = bytes.fromhex(s["sig_ed25519"])

    def verifies(msg):
        try:
            pk.verify(sig, msg); return True
        except InvalidSignature:
            return False

    line(3, "signature", verifies(canon), f"{s['did']} via {did_doc}; signed_at={s.get('signed_at')}")
    flipped = bytearray(raw); flipped[len(flipped) // 2] ^= 1
    controls = {
        "trailing byte appended": not verifies(canon + b" "),
        "artifact digest zeroed": not verifies(canon.replace(p["artifact"]["sha256"].encode(), b"0" * 64)),
        "one bit flipped in record": sha(bytes(flipped)) != p["artifact"]["sha256"],
    }
    line(4, "negative controls", all(controls.values()),
         "; ".join(f"{k}: {'rejected' if v else 'ACCEPTED'}" for k, v in controls.items()))

    try:
        from opentimestamps.core.timestamp import DetachedTimestampFile
        from opentimestamps.core.serialize import BytesDeserializationContext
    except ImportError:
        line(5, "timestamp proof", False, "UNMEASURED: opentimestamps not installed", required=False)
        print("RESULT", "PASS" if ok else "FAIL", "(origin and integrity only; not a statement about truth)")
        return 0 if ok else 1
    try:
        proof = DetachedTimestampFile.deserialize(BytesDeserializationContext(get(a.base, a.record + ".ots")))
    except Exception as e:
        line(5, "timestamp proof", False, f"UNMEASURED: no parseable {a.record}.ots ({type(e).__name__})", required=False)
        proof = None
    if proof is not None:
        atts = sorted({type(x[1]).__name__ for x in proof.timestamp.all_attestations()})
        binds = proof.file_digest == hashlib.sha256(raw).digest()
        state = "BITCOIN_ATTESTATION_PRESENT" if "BitcoinBlockHeaderAttestation" in atts else "PENDING_CALENDAR_COMMITMENT"
        line(5, "timestamp proof", binds, f"binds={binds} attestations={atts} state={state}", required=False)
        if not a.no_ots_upgrade and state != "BITCOIN_ATTESTATION_PRESENT":
            from opentimestamps.calendar import RemoteCalendar
            from opentimestamps.core.notary import PendingAttestation, BitcoinBlockHeaderAttestation
            found = []
            for msg, att in proof.timestamp.all_attestations():
                if isinstance(att, PendingAttestation):
                    try:
                        up = RemoteCalendar(att.uri).get_timestamp(msg, timeout=20)
                        for msg2, att2 in up.all_attestations():
                            if isinstance(att2, BitcoinBlockHeaderAttestation):
                                found.append((att.uri, att2.height, msg2))
                    except Exception as e:
                        found.append((att.uri, f"pending ({type(e).__name__})", None))
            heights = sorted({h for _, h, _ in found if isinstance(h, int)})
            detail = (f"calendar offers Bitcoin block height(s) {heights}"
                      if heights else "still pending at every calendar asked")
            line(6, "timestamp upgrade", bool(heights), detail, required=False)
            if heights and a.explorer:
                # Trust assumption, stated: the block header is read from a public explorer, not a
                # local full node. A merkle-root match against an explorer is weaker than `ots verify`
                # against your own bitcoind.
                res = []
                for _, h, m in found:
                    if not isinstance(h, int):
                        continue
                    bh = urllib.request.urlopen(urllib.request.Request(f"{a.explorer}/block-height/{h}", headers=UA), timeout=30).read().decode().strip()
                    blk = json.load(urllib.request.urlopen(urllib.request.Request(f"{a.explorer}/block/{bh}", headers=UA), timeout=30))
                    res.append((h, m[::-1].hex() == blk["merkle_root"]))
                line(7, "bitcoin anchor", bool(res) and all(r for _, r in res),
                     "; ".join(f"height {h}: merkle root {'MATCHES' if r else 'DIFFERS'}" for h, r in res) + f" (header read from {a.explorer})",
                     required=False)
    print("RESULT", "PASS" if ok else "FAIL", "(origin and integrity only; not a statement about truth)")
    return 0 if ok else 1


if __name__ == "__main__":
    sys.exit(main())
