#!/usr/bin/env python3
"""cose_wrap_selftest.py — hermetic, pytest-free selftest for the COSE dual-issue lane.

Run:  uv run --with cbor2 --with cryptography python3 scripts/cose_wrap_selftest.py
 (or: pip install cbor2 cryptography && python3 scripts/cose_wrap_selftest.py)

WHY HERMETIC. No network, no production key, no writes outside a temp dir. A CI gate
that needs the board key is a gate that cannot run on a PR, and a wrap lane that can
only be checked by the signer is the Sep-4 quarantine incident waiting to repeat:
the retired generator produced self-consistent-looking envelopes that were not
COSE_Sign1, and nothing caught it because nothing independent ever decoded them.

Cases:
  (a) build with a test key -> verify pinned to the expected pubkey -> VALID
  (b) tampered payload -> INVALID
  (c) determinism: build twice -> byte-identical envelopes
  (d) wrong alg in the protected header -> INVALID (never silently re-interpreted)
  (e) committed vectors match freshly-built output from the committed test-only key,
      and carry the expected three-state verdicts (UNCHECKABLE against the
      production pin set, VALID with an expected key, INVALID when tampered)
  (f) thumbprint-kid resolution maps each published identity's RFC 9679 thumbprint
      back to its did:web id — no private key needed for the mapping check

Exit 0 only if every case passes; a summary is printed either way.
"""
from __future__ import annotations

import base64
import hashlib
import json
import sys
import tempfile
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent
sys.path.insert(0, str(HERE))

import cbor2  # noqa: E402

import cose_wrap  # noqa: E402
import cose_verify  # noqa: E402

from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PrivateKey  # noqa: E402
from cryptography.hazmat.primitives.serialization import (  # noqa: E402
    Encoding,
    PublicFormat,
    load_der_private_key,
)

VECTORS = ROOT / "test" / "vectors" / "cose-wrap"

FAILURES: list[str] = []


def check(name: str, ok: bool, detail: str = "") -> None:
    print(f"  {'PASS' if ok else 'FAIL'}  {name}" + (f" — {detail}" if detail else ""))
    if not ok:
        FAILURES.append(f"{name}: {detail}")


def raw_pub(key) -> bytes:
    return key.public_key().public_bytes(Encoding.Raw, PublicFormat.Raw)


def main() -> int:
    print("cose_wrap selftest (hermetic; test keys only; measurement, never certification)")

    # (a) build with a test key -> verify with the expected pubkey -> VALID
    test_key = Ed25519PrivateKey.generate()
    pub = raw_pub(test_key)
    kid = cose_wrap.jwk_thumbprint(pub)
    payload = b'{"synthetic":true,"note":"selftest payload; measures nothing"}'
    envelope, protected = cose_wrap.build_cose(payload, test_key, kid)
    v = cose_verify.verify_envelope(envelope, expected_kid=kid, expected_pubkey=pub)
    check("a: build+verify with expected key", v["verdict"] == "VALID", v["reason"])

    # (b) tampered payload -> INVALID
    raw = bytearray(envelope)
    idx = raw.find(payload[:16])
    raw[idx] ^= 0x01
    v = cose_verify.verify_envelope(bytes(raw), expected_kid=kid, expected_pubkey=pub)
    check("b: tampered payload", v["verdict"] == "INVALID", v["reason"])

    # (c) determinism
    envelope2, _ = cose_wrap.build_cose(payload, test_key, kid)
    check("c: determinism", envelope == envelope2, "two builds must be byte-identical")

    # (d) wrong alg rejected
    bad_protected = cbor2.dumps({1: -7, 3: cose_wrap.CONTENT_TYPE, 4: kid})
    bad_sig_struct = cbor2.dumps(["Signature1", bad_protected, b"", payload])
    bad_env = cbor2.dumps(cbor2.CBORTag(18, [bad_protected, cbor2.dumps({}), payload, test_key.sign(bad_sig_struct)]))
    v = cose_verify.verify_envelope(bad_env, expected_pubkey=pub)
    check("d: wrong alg rejected", v["verdict"] == "INVALID" and "alg" in v["reason"], v["reason"])

    # (e) committed vectors
    expected = json.loads((VECTORS / "vector-1.expected.json").read_text(encoding="utf-8"))
    vec_key = load_der_private_key(base64.b64decode(expected["vector_key"]["pkcs8_b64"]), password=None)
    vec_kid = expected["vector_key"]["kid_thumbprint"]
    vec_x = expected["vector_key"]["x_b64url"]
    vec_card = json.loads((VECTORS / "vector-1.card.json").read_text(encoding="utf-8"))["card"]
    vec_payload = cose_wrap.canonical_bytes(vec_card)
    rebuilt, _ = cose_wrap.build_cose(vec_payload, vec_key, vec_kid)
    committed = bytes.fromhex((VECTORS / "vector-1.cose.hex").read_text().strip())
    check(
        "e1: vector-1 matches a fresh build",
        rebuilt == committed,
        f"fresh {hashlib.sha256(rebuilt).hexdigest()[:16]} vs committed {hashlib.sha256(committed).hexdigest()[:16]}",
    )
    check(
        "e2: vector payload_sha256 honest",
        hashlib.sha256(vec_payload).hexdigest() == expected["vector-1"]["payload_sha256"],
    )
    v = cose_verify.verify_envelope(committed)  # production pin set, embedded
    check(
        "e3: vector-1 vs production pin set is UNCHECKABLE",
        v["verdict"] == "UNCHECKABLE",
        v["reason"],
    )
    v = cose_verify.verify_envelope(
        committed,
        expected_kid=vec_kid,
        expected_pubkey=cose_verify.b64url_decode(vec_x),
    )
    check("e4: vector-1 with expected key is VALID", v["verdict"] == "VALID", v["reason"])
    tampered = bytes.fromhex((VECTORS / "vector-2-tampered.cose.hex").read_text().strip())
    v = cose_verify.verify_envelope(
        tampered,
        expected_kid=vec_kid,
        expected_pubkey=cose_verify.b64url_decode(vec_x),
    )
    check("e5: vector-2-tampered is INVALID", v["verdict"] == "INVALID", v["reason"])

    # (f) thumbprint-kid resolution against the four published identities (public halves only)
    by_thumb = cose_verify.thumbprint_index(cose_verify.PUBLISHED_IDENTITIES)
    ok = True
    for did, x in cose_verify.PUBLISHED_IDENTITIES.items():
        tp = cose_verify.jwk_thumbprint_b64url(x)
        pub_r, pinned, _how = cose_verify.resolve_key(tp, cose_verify.PUBLISHED_IDENTITIES)
        if pinned != did or pub_r != cose_verify.b64url_decode(x):
            ok = False
            FAILURES.append(f"f: {did} thumbprint {tp} resolved to {pinned!r}")
        if by_thumb.get(tp) != did:
            ok = False
    check("f: thumbprint-kid resolves all four published identities", ok)

    # wrap_card_file end-to-end in a temp dir (writes nothing to the repo)
    with tempfile.TemporaryDirectory() as td:
        out_dir = Path(td)
        report = cose_wrap.wrap_card_file(
            VECTORS / "vector-1.card.json",
            vec_key,
            vec_kid,
            test_key=True,
            pinned_to=None,
            out_dir=out_dir,
        )
        sidecar = json.loads((out_dir / f"{report['sha16']}.json").read_text())
        ok = (
            sidecar.get("test_key") is True
            and sidecar.get("pinned_to") is None
            and sidecar.get("kid") == vec_kid
            and sidecar.get("note") == cose_wrap.REGISTER_NOTE
            and (out_dir / f"{report['sha16']}.cose").read_bytes() == committed
        )
        check("g: wrap_card_file marks test artifacts and reproduces the vector", ok)

    print()
    if FAILURES:
        print(f"SELFTEST FAILED ({len(FAILURES)} case(s)):")
        for f in FAILURES:
            print(f"  - {f}")
        return 1
    print("SELFTEST OK — all cases passed")
    return 0


if __name__ == "__main__":
    sys.exit(main())
