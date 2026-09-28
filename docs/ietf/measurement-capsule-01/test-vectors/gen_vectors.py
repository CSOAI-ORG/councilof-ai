#!/usr/bin/env python3
"""Test vectors for draft-templeman-scitt-measurement-capsule-01 (work in progress).

Everything here is synthetic. Subjects are under .example, source digests are SHA-256 of
labelled placeholder strings, and the signing key is the RFC 8032 section 7.1 TEST 1 key,
whose secret half is published in that RFC. Anything signed with it proves nothing.

Dependencies: Python 3.9+ standard library and `cryptography` (Ed25519 only). The CBOR
encoder, the JCS serialiser (restricted to the value types these vectors use) and the
RFC 9162 Merkle code are written out below so that the independent checker
(check_vectors.py, which uses cbor2, pycose and rfc8785 instead) shares no code with them.

    python3 gen_vectors.py            # writes vectors.json next to this file
    python3 gen_vectors.py --check    # regenerates in memory, compares byte for byte
"""
import hashlib
import json
import os
import sys

from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PrivateKey

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "vectors.json")

# RFC 8032 section 7.1, TEST 1. Published test key: never trust anything it signs.
TEST_SK = bytes.fromhex("9d61b19deffd5a60ba844af492ec2cc44449c5697b326919703bac031cae7f60")
TEST_PK = "d75a980182b10ab7d54bfed3c964073a0ee172f3daa62325af021a68f707511a"
KID = "did:web:measurer.example#test-key-1"
ISS = "did:web:measurer.example"
IAT = 1790000000  # fixed so the vectors are reproducible (2026-09-21T14:13:20Z)

AUTHORITY_NONE = "NONE: measurement only; this capsule grants and records no execution authority"
CT_CAPSULE = "application/vnd.csoai.measurement-capsule+json"
CT_BATCH = "application/vnd.csoai.measurement-capsule-batch+json"


# ------------------------------------------------------------------ JCS (restricted)
def jcs(o) -> bytes:
    """RFC 8785 for the value types used here: objects, arrays, strings, booleans, null and
    integers of magnitude below 2^53. Floats are refused rather than serialised, so this
    cannot silently diverge from RFC 8785 section 3.2.2.3. Keys are sorted by UTF-16 code
    units, which for the ASCII keys used here equals code-point order."""
    def chk(x):
        if isinstance(x, float):
            raise ValueError("floats are out of scope for these vectors")
        if isinstance(x, int) and not isinstance(x, bool) and abs(x) >= 2 ** 53:
            raise ValueError("integer outside the I-JSON range; carry it as a string")
        if isinstance(x, dict):
            for k, v in x.items():
                if not k.isascii():
                    raise ValueError("non-ASCII key")
                chk(v)
        if isinstance(x, list):
            for v in x:
                chk(v)
    chk(o)
    return json.dumps(o, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode("utf-8")


def sha256(b: bytes) -> bytes:
    return hashlib.sha256(b).digest()


def placeholder_digest(label: str) -> str:
    return hashlib.sha256(("capsule-01 test vector placeholder: " + label).encode()).hexdigest()


# ------------------------------------------------------------------ CBOR (deterministic)
class Tag:
    def __init__(self, n, v):
        self.n, self.v = n, v


def _head(major: int, n: int) -> bytes:
    if n < 24:
        return bytes([(major << 5) | n])
    for ai, size in ((24, 1), (25, 2), (26, 4), (27, 8)):
        if n < (1 << (8 * size)):
            return bytes([(major << 5) | ai]) + n.to_bytes(size, "big")
    raise ValueError("integer too large")


def cbor(x) -> bytes:
    """RFC 8949 section 4.2.1 core deterministic encoding: shortest heads, definite lengths,
    map keys sorted by the bytewise order of their encodings."""
    if x is True:
        return b"\xf5"
    if x is False:
        return b"\xf4"
    if x is None:
        return b"\xf6"
    if isinstance(x, int):
        return _head(0, x) if x >= 0 else _head(1, -1 - x)
    if isinstance(x, bytes):
        return _head(2, len(x)) + x
    if isinstance(x, str):
        b = x.encode("utf-8")
        return _head(3, len(b)) + b
    if isinstance(x, list):
        return _head(4, len(x)) + b"".join(cbor(v) for v in x)
    if isinstance(x, dict):
        items = sorted(((cbor(k), cbor(v)) for k, v in x.items()), key=lambda kv: kv[0])
        return _head(5, len(items)) + b"".join(k + v for k, v in items)
    if isinstance(x, Tag):
        return _head(6, x.n) + cbor(x.v)
    raise TypeError(type(x))


# ------------------------------------------------------------------ RFC 9162 Merkle
def leaf_hash(d: bytes) -> bytes:
    return sha256(b"\x00" + d)


def node_hash(l: bytes, r: bytes) -> bytes:
    return sha256(b"\x01" + l + r)


def split(n: int) -> int:
    k = 1
    while k * 2 < n:
        k *= 2
    return k


def mth(D):
    if len(D) == 0:
        return sha256(b"")
    if len(D) == 1:
        return leaf_hash(D[0])
    k = split(len(D))
    return node_hash(mth(D[:k]), mth(D[k:]))


def path(m, D):
    """RFC 9162 section 2.1.3.1 PATH(m, D[n])."""
    if len(D) == 1:
        return []
    k = split(len(D))
    if m < k:
        return path(m, D[:k]) + [mth(D[k:])]
    return path(m - k, D[k:]) + [mth(D[:k])]


# ------------------------------------------------------------------ capsules
def capsule(subject, state, declared, observed, differential, limitation, sources, extra=None):
    c = {
        "schema": "csoai.measurement-capsule/0.2",
        "kind": "measurement.contract_parity",
        "subject_id": subject,
        "claim": {"statement": "the protocol version a registry entry declares for this endpoint "
                               "equals the version the endpoint returns from initialize"},
        "declared": declared,
        "observed": observed,
        "differential": differential,
        "sources": sources,
        "measurement_state": state,
        "authority_state": AUTHORITY_NONE,
        "effect_reference": None,
        "observed_at": "2026-09-25T12:00:00Z",
        "correction_pointer": None,
        "limitations": [limitation],
    }
    if extra:
        c.update(extra)
    c["capsule_id"] = sha256(jcs({k: v for k, v in c.items() if k != "capsule_id"})).hex()
    return c


def build():
    caps = [
        capsule("https://mcp-a.example/mcp", "INCONSISTENT",
                {"protocol_version": "2025-06-18", "surface": "registry"},
                {"protocol_version": "2025-11-25", "exchange": "initialize"},
                {"differs": ["protocol_version"]},
                "the registry entry and the endpoint were read 40 seconds apart from one location",
                {"registry_entry": placeholder_digest("registry entry A"),
                 "initialize_response": placeholder_digest("initialize response A")}),
        capsule("https://mcp-b.example/mcp", "CONSISTENT",
                {"protocol_version": "2025-11-25", "surface": "registry"},
                {"protocol_version": "2025-11-25", "exchange": "initialize"},
                {"differs": []},
                "agreement at one reading says nothing about later readings",
                {"registry_entry": placeholder_digest("registry entry B"),
                 "initialize_response": placeholder_digest("initialize response B")}),
        capsule("https://mcp-c.example/mcp", "UNCHECKABLE",
                {"protocol_version": "2025-11-25", "surface": "registry"},
                {"exchange": "initialize", "read": "no response within 10 seconds"},
                {"differs": None, "reason": "no observed value to compare"},
                "one attempt from one location; a later attempt may be answered",
                {"registry_entry": placeholder_digest("registry entry C"),
                 "initialize_response": None}),
        capsule("https://mcp-d.example/mcp", "CONSISTENT",
                {"protocol_version": "2025-06-18", "surface": "registry"},
                {"protocol_version": "2025-06-18", "exchange": "initialize"},
                {"differs": []},
                "agreement at one reading says nothing about later readings",
                {"registry_entry": placeholder_digest("registry entry D"),
                 "initialize_response": placeholder_digest("initialize response D")}),
        capsule("https://mcp-e.example/mcp", "INCONSISTENT",
                {"protocol_version": "2025-03-26", "surface": "registry"},
                {"protocol_version": "2025-06-18", "exchange": "initialize"},
                {"differs": ["protocol_version"]},
                "the registry entry and the endpoint were read 12 seconds apart from one location",
                {"registry_entry": placeholder_digest("registry entry E"),
                 "initialize_response": placeholder_digest("initialize response E")}),
    ]
    caps.sort(key=lambda c: c["capsule_id"])
    lines = [jcs(c) for c in caps]
    capsule_file = b"".join(l + b"\n" for l in lines)
    D = [bytes.fromhex(c["capsule_id"]) for c in caps]  # already ascending
    root = mth(D)

    states = {}
    for c in caps:
        states[c["measurement_state"]] = states.get(c["measurement_state"], 0) + 1
    record = {
        "schema": "csoai.measurement-capsule-batch/0.2",
        "as_of": "2026-09-25T12:30:00Z",
        "kind": "measurement.contract_parity",
        "n_capsules": len(caps),
        "states": states,
        "merkle_root": root.hex(),
        "merkle": "RFC 9162 section 2.1.1 Merkle Tree Hash, SHA-256, over the capsule_id values "
                  "as 32-byte strings sorted ascending",
        "capsules_file": {"sha256": sha256(capsule_file).hex(), "bytes": len(capsule_file),
                          "format": "one JCS capsule per line, LF-terminated, sorted by capsule_id"},
        "inclusion_rule": "every endpoint in the synthetic list of five; nothing excluded",
        "excluded": {},
        "authority_state": AUTHORITY_NONE,
    }
    record_jcs = jcs(record)

    sk = Ed25519PrivateKey.from_private_bytes(TEST_SK)
    assert sk.public_key().public_bytes_raw().hex() == TEST_PK

    cwt = {1: ISS, 2: record["kind"], 6: IAT}

    def sign1(protected_map, payload, detached=False):
        prot = cbor(protected_map)
        sig_structure = cbor(["Signature1", prot, b"", payload])
        sig = sk.sign(sig_structure)
        msg = cbor(Tag(18, [prot, {}, None if detached else payload, sig]))
        return prot, sig_structure, sig, msg

    # V3: attached JCS payload
    p3 = {1: -19, 3: CT_BATCH, 4: KID.encode(), 15: cwt}
    prot3, tbs3, sig3, msg3 = sign1(p3, record_jcs)
    # V4: COSE Hash Envelope (RFC 9995): payload is SHA-256 of the JCS bytes; no label 3
    p4 = {1: -19, 4: KID.encode(), 15: cwt, 258: -16, 259: CT_BATCH,
          260: "https://measurer.example/batches/contract_parity/record.json"}
    prot4, tbs4, sig4, msg4 = sign1(p4, sha256(record_jcs))

    m = 2
    audit = path(m, D)

    # ---- controls built to be rejected, each naming the rule it breaks
    bad_decision = dict(caps[0])
    bad_decision.pop("capsule_id")
    bad_decision["decision"] = "none recorded"  # the member name alone breaks the rule; the value breaks none
    bad_decision["capsule_id"] = sha256(jcs(bad_decision)).hex()

    bad_source = dict(caps[1])
    bad_source.pop("capsule_id")
    bad_source["sources"] = dict(bad_source["sources"], registry_entry="https://registry.example/v0/servers/b")
    bad_source["capsule_id"] = sha256(jcs(bad_source)).hex()

    not_jcs_line = json.dumps(caps[1], sort_keys=True, indent=1).encode()

    flipped = bytearray(msg3)
    # flip the last byte of the payload inside the COSE_Sign1 (the payload ends 65 bytes
    # before the end: 1 byte bstr head 0x58 0x40 = 2 bytes + 64 signature bytes -> offset -67)
    flipped[-67] ^= 0x01

    p_bad4 = dict(p4)
    p_bad4[3] = CT_BATCH
    prot_bad4, _, _, msg_bad4 = sign1(p_bad4, sha256(record_jcs))

    dup_D = D + [D[-1]]

    vectors = {
        "_label": "SYNTHETIC TEST VECTORS for draft-templeman-scitt-measurement-capsule-01 (work in "
                  "progress). Signed with the RFC 8032 section 7.1 TEST 1 key, whose secret is public. "
                  "Anything it signs proves nothing. Subjects are .example names; source digests are "
                  "SHA-256 of labelled placeholder strings.",
        "schema": "capsule-01.test-vectors/0.1",
        "generator": "gen_vectors.py (standard library + cryptography)",
        "test_key": {"source": "RFC 8032 section 7.1 TEST 1", "secret_hex": TEST_SK.hex(),
                     "public_hex": TEST_PK, "kid": KID},
        "V1_capsules": [{"capsule_id": c["capsule_id"], "jcs_utf8": l.decode()}
                        for c, l in zip(caps, lines)],
        "V2_batch": {
            "leaves_sorted": [d.hex() for d in D],
            "merkle_root": root.hex(),
            "capsules_file_sha256": sha256(capsule_file).hex(),
            "capsules_file_bytes": len(capsule_file),
            "record_jcs_utf8": record_jcs.decode(),
            "record_sha256": sha256(record_jcs).hex(),
            "audit_path": {"leaf_index": m, "tree_size": len(D), "leaf": D[m].hex(),
                           "path": [h.hex() for h in audit]},
        },
        "V3_cose_sign1_attached": {
            "protected_edn": "{1: -19, 3: \"%s\", 4: '%s', 15: {1: \"%s\", 2: \"%s\", 6: %d}}"
                             % (CT_BATCH, KID, ISS, record["kind"], IAT),
            "protected_hex": prot3.hex(),
            "sig_structure_hex": tbs3.hex(),
            "signature_hex": sig3.hex(),
            "cose_sign1_hex": msg3.hex(),
        },
        "V4_cose_hash_envelope": {
            "protected_edn": "{1: -19, 4: '%s', 15: {1: \"%s\", 2: \"%s\", 6: %d}, 258: -16, "
                             "259: \"%s\", 260: \"%s\"}" % (KID, ISS, record["kind"], IAT, CT_BATCH,
                                                           p4[260]),
            "payload_hex": sha256(record_jcs).hex(),
            "protected_hex": prot4.hex(),
            "sig_structure_hex": tbs4.hex(),
            "signature_hex": sig4.hex(),
            "cose_sign1_hex": msg4.hex(),
        },
        "N_controls": [
            {"id": "N1-forbidden-member", "expected": {"state": "reject", "rule": "no-authority-member"},
             "why": "a member named decision is forbidden at any depth",
             "capsule_jcs_utf8": jcs(bad_decision).decode()},
            {"id": "N2-source-not-a-digest", "expected": {"state": "reject", "rule": "sources-digest-only"},
             "why": "sources carries a URL where only digests are allowed",
             "capsule_jcs_utf8": jcs(bad_source).decode()},
            {"id": "N3-stored-line-not-jcs", "expected": {"state": "reject", "rule": "stored-bytes-are-jcs"},
             "why": "the stored line is indented JSON, so it is not the JCS bytes the identifier covers",
             "stored_line_utf8": not_jcs_line.decode()},
            {"id": "N4-payload-byte-flipped", "expected": {"state": "reject", "rule": "cose-signature"},
             "why": "one payload byte of V3 changed; the signature no longer verifies",
             "cose_sign1_hex": bytes(flipped).hex()},
            {"id": "N5-hash-envelope-with-label-3", "expected": {"state": "reject", "rule": "rfc9995-no-label-3"},
             "why": "RFC 9995: label 3 (content_type) MUST NOT be present with a hash envelope payload",
             "protected_hex": prot_bad4.hex(), "cose_sign1_hex": msg_bad4.hex()},
            {"id": "N6-duplicated-last-leaf", "expected": {"state": "reject", "rule": "leaf-set-no-duplicates"},
             "why": "the leaf list repeats its last member; its root differs from V2 and n no longer "
                    "equals n_capsules",
             "leaves": [d.hex() for d in dup_D], "root": mth(dup_D).hex()},
        ],
    }
    return (json.dumps(vectors, indent=1, ensure_ascii=False) + "\n").encode()


def main(argv):
    data = build()
    if "--check" in argv:
        cur = open(OUT, "rb").read()
        if cur != data:
            print("MISMATCH: vectors.json is not what gen_vectors.py produces")
            return 1
        print("OK: vectors.json regenerates byte for byte (%d bytes, sha256 %s)"
              % (len(data), hashlib.sha256(data).hexdigest()))
        return 0
    with open(OUT, "wb") as f:
        f.write(data)
    print("wrote %s (%d bytes, sha256 %s)" % (OUT, len(data), hashlib.sha256(data).hexdigest()))
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
