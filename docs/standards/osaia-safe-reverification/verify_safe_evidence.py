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


def check_approval_dependency(record, dep_id, actual_uri, approval_bytes):
    """Check one retained SHA-256 approval link; no authority or truth verdict.

    The caller supplies already-read bytes and their declared retrieval URI.
    This function performs no I/O. It does not replace either record's schema
    validation, authenticate a key/principal, validate approval semantics,
    establish transport origin or change a claim state. Local support limits
    are 128 dependencies and 128 KiB of approval bytes; exceeding them means
    unsupported by this check, not schema-invalid or a claim-state change.
    Supported input encoding is UTF-8 without a byte-order mark.
    """
    safe_fields = {
        "profile", "record_id", "issuer", "issued_at", "supersedes", "finding",
        "claim", "dependencies", "test", "negative_control", "result",
        "remediation", "signature", "watch", "limits",
    }
    safe_required = {
        "profile", "record_id", "issuer", "issued_at", "finding", "claim",
        "dependencies", "test", "negative_control", "result", "watch", "limits",
    }
    if (type(record) is not dict or set(record) - safe_fields
            or safe_required - set(record)
            or record.get("profile") != "safe-reverification/0.1-draft"):
        raise ValueError("unsupported SAFE record body")
    if (type(dep_id) is not str or not dep_id.strip()
            or type(actual_uri) is not str or not actual_uri.strip()
            or type(approval_bytes) is not bytes
            or not 0 < len(approval_bytes) <= 131072):
        raise ValueError("dependency id, retrieval URI and bounded retained bytes required")
    dependencies = record["dependencies"]
    if (type(dependencies) is not list or len(dependencies) > 128
            or any(type(d) is not dict for d in dependencies)):
        raise ValueError("bounded dependencies must be record objects")
    matching = [d for d in dependencies if d.get("dep_id") == dep_id]
    if len(matching) != 1:
        raise ValueError("one unambiguous approval dependency required")
    dependency = matching[0]
    dep_fields = {"dep_id", "kind", "state", "name", "version", "digest", "uri",
                  "observed_at", "otel"}
    if (set(dependency) - dep_fields or dependency.get("kind") != "approval"
            or dependency.get("state") != "PINNED"
            or type(dependency.get("uri")) is not str
            or dependency["uri"] != actual_uri):
        raise ValueError("approval dependency is unpinned or URI differs")
    expected = dependency.get("digest")
    if (type(expected) is not dict or set(expected) != {"alg", "value"}
            or expected["alg"] != "sha256" or type(expected["value"]) is not str
            or len(expected["value"]) != 64
            or any(c not in "0123456789abcdef" for c in expected["value"])):
        raise ValueError("strict SHA-256 approval digest required")
    if sha(approval_bytes) != expected["value"]:
        raise ValueError("approval bytes differ from the dependency digest")

    def unique(pairs):
        result = {}
        for key, value in pairs:
            if key in result:
                raise ValueError("duplicate approval JSON key")
            result[key] = value
        return result

    def finite(_):
        raise ValueError("non-finite approval JSON")
    approval = json.loads(approval_bytes.decode("utf-8"),
                          object_pairs_hook=unique, parse_constant=finite)
    hitl_fields = {"profile", "record_id", "issued_at", "request", "authority",
                   "invocation", "effect", "verification", "claim_maintenance",
                   "provenance", "limits"}
    hitl_required = {"profile", "record_id", "issued_at", "request", "authority",
                     "invocation", "effect", "verification", "limits"}
    if (type(approval) is not dict or set(approval) - hitl_fields
            or hitl_required - set(approval)
            or approval.get("profile") != "csoai.hitl-authority-effect/0.1"
            or any(type(approval[key]) is not dict for key in
                   ("request", "authority", "invocation", "effect", "verification"))
            or any(type(approval[key]) is not str or not approval[key].strip()
                   for key in ("record_id", "issued_at"))
            or type(approval["limits"]) is not list or not approval["limits"]
            or any(type(limit) is not str or not limit.strip() for limit in approval["limits"])):
        raise ValueError("unsupported retained HITL record body")
    return "BYTE_INTEGRITY_MATCH"

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
