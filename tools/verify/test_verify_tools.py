#!/usr/bin/env python3
# SPDX-License-Identifier: CC0-1.0
"""Offline tests for tools/verify — a throwaway key, synthetic DID, synthetic roots.

Every positive path has a control that must fail: a tampered body, a wrong key, a root whose
declared leaf count lies, a card no root carries. Run: python3 tools/verify/test_verify_tools.py
(or pytest). Needs `cryptography`. No network.
"""
from __future__ import annotations

import base64
import contextlib
import hashlib
import io
import json
import sys
import tempfile
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
sys.path.insert(0, str(HERE.parents[1] / "harness" / "gspc-top100"))

import card_v01_validate as v01  # noqa: E402
import csoai_verify as cv  # noqa: E402
import verify_card as lib  # noqa: E402
from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PrivateKey  # noqa: E402
from cryptography.hazmat.primitives.serialization import Encoding, PublicFormat  # noqa: E402

DID = "did:web:example.test"


def _key():
    sk = Ed25519PrivateKey.generate()
    pk = sk.public_key().public_bytes(Encoding.Raw, PublicFormat.Raw)
    return sk, pk


def _did_doc(pk: bytes) -> dict:
    x = base64.urlsafe_b64encode(pk).rstrip(b"=").decode()
    vm = lambda frag: {"id": f"{DID}#{frag}", "type": "JsonWebKey2020", "publicKeyJwk": {"kty": "OKP", "crv": "Ed25519", "x": x}}
    return {"id": DID, "verificationMethod": [vm("card-attestation-1"), vm("board-attestation-1")]}


def _card_py(sk, pk, accuracy=0.5, model="m-1") -> dict:
    body = {"accuracy": accuracy, "axis": "governance", "created": "2026-09-14T00:00:00+00:00", "issuer": "test",
            "kind": "gspc.measurement-card", "model": model, "prev": "GENESIS"}
    pre = v01.preimage_py(body)
    return {"alg": "Ed25519", "body": body, "id": hashlib.sha256(pre).hexdigest(), "preimage_rule": v01.RULE_PY,
            "pubkey": pk.hex(), "signature": sk.sign(pre).hex()}


def _card_js(sk, model="m-js") -> dict:
    body = {"axis": "swarm", "kind": "gspc.measurement-card", "model": model, "n": 30.0, "note": "café — ünïcode", "rate": 0.25}
    pre = v01.preimage_js(body)
    return {"alg": "Ed25519", "body": body, "id": hashlib.sha256(pre).hexdigest(), "preimage_rule": v01.RULE_JS,
            "signature": sk.sign(pre).hex(), "did": f"{DID}#board-attestation-1"}


def _leaf_whole(card) -> str:
    return hashlib.sha256(cv.canon(card, ensure_ascii=False)).hexdigest()


def _card_root(cards) -> dict:
    hexes = sorted(_leaf_whole(c) for c in cards)
    by = {_leaf_whole(c): c for c in cards}
    return {"kind": "csoai.card-root/1", "as_of": "2026-09-14T00:00:00Z", "n_leaves": len(hexes),
            "merkle_root": cv.merkle_levels(hexes)[-1][0].hex(),
            "leaves": [{"leaf": h, "id": by[h]["id"], "card": f"c{i}.json", "index": i} for i, h in enumerate(hexes)]}


def _public_root(sk, cards) -> dict:
    hexes = [hashlib.sha256(cv.canon({k: v for k, v in c.items() if k not in ("sha256", "sig_ed25519")}, False)).hexdigest() for c in cards]
    doc = {"kind": "csoai.public-root/v1", "schema": "x", "as_of": "2026-09-14T00:00:00Z", "card_count": len(hexes),
           "merkle_root": cv.merkle_levels(hexes)[-1][0].hex(), "did_intended": f"{DID}#board-attestation-1", "card_sha256": hexes}
    pre = {k: doc[k] for k in ("kind", "schema", "as_of", "merkle_root", "card_count", "did_intended")}
    doc["sig_ed25519"] = sk.sign(cv.canon(pre, False)).hex()
    return doc


def _w(d: Path, name: str, obj) -> str:
    p = d / name
    p.write_bytes(obj if isinstance(obj, bytes) else json.dumps(obj).encode())
    return str(p)


def _run(args) -> tuple[int, dict]:
    buf = io.StringIO()
    with contextlib.redirect_stdout(buf):
        code = cv.main(args + ["--json", "--no-discover"])
    return code, json.loads(buf.getvalue())


def test_canonical_parity_with_library():
    bodies = [{"a": 1, "b": [1.0, 2.5, None, True], "c": "ü—x", "d": {"z": 0.0, "y": -3}}, {"accuracy": 0.0968, "k": "plain"}]
    for b in bodies:
        assert v01.preimage_py(b) == lib.canonical_body_bytes(b)
        assert v01.preimage_js(b) == lib.canonical_js_body_bytes(b)


def test_validator_pass_fail_uncheckable():
    sk, pk = _key()
    schema, _ = v01.load_schema()
    card = _card_py(sk, pk)
    assert v01.validate(card, schema)["verdict"] == "PASS"
    assert v01.validate(v01.tamper(card), schema)["verdict"] == "FAIL"
    assert v01.validate({**card, "preimage_rule": "jcs-rfc8785"}, schema)["verdict"] == "UNCHECKABLE"
    bad = v01.validate({**card, "pubkey": "zz"}, schema)
    assert bad["verdict"] == "FAIL" and bad["schema"] == "FAIL"
    js = _card_js(sk)
    r = v01.validate(js, schema)
    assert r["verdict"] == "PASS" and r["schema"] == "NOT_APPLICABLE" and r["id"] == "MATCH"


def test_merkle_proof_every_index_odd_trees():
    for n in (1, 2, 3, 5, 7, 8):
        hexes = [hashlib.sha256(bytes([i])).hexdigest() for i in range(n)]
        root = cv.merkle_levels(hexes)[-1][0].hex()
        for i in range(n):
            assert cv.fold(hexes[i], i, cv.proof_for(hexes, i)) == root
        if n > 1:
            assert cv.fold(hexes[0], 1, cv.proof_for(hexes, 0)) != root  # wrong side bit must not fold


def test_included_card_with_ots_and_tamper_control():
    sk, pk = _key()
    a, b, c = _card_js(sk, "one"), _card_js(sk, "two"), _card_py(sk, pk)
    with tempfile.TemporaryDirectory() as t:
        d = Path(t)
        did = _w(d, "did.json", _did_doc(pk))
        root = _w(d, "card-root.json", _card_root([a, b, c]))
        _w(d, "card-root.json.ots", cv.OTS_MAGIC + b"\x01proof")
        pub = _w(d, "root.json", _public_root(sk, [c]))
        code, r = _run([_w(d, "a.json", a), "--did", did, "--card-root", root, "--root-json", pub,
                        "--tamper-control", "--require-inclusion", "--require-ots"])
        assert code == 0, r
        assert r["signature"]["state"] == "VALID" and r["tamper_control"]["state"] == "DETECTED"
        assert r["inclusion"]["state"] == "INCLUDED" and r["ots"]["state"] == "PRESENT"
        # the py-rule card is a root.json leaf, and the root's own signature verifies
        code, r = _run([_w(d, "c.json", c), "--did", did, "--card-root", root, "--root-json", pub])
        pr = [x for x in r["inclusion"]["roots_checked"] if x["root"] == pub][0]
        assert code == 0 and pr["state"] == "INCLUDED" and pr["root_signature"] == "VALID"


def test_tampered_card_exits_1():
    sk, pk = _key()
    with tempfile.TemporaryDirectory() as t:
        d = Path(t)
        tampered = v01.tamper(_card_py(sk, pk))
        code, r = _run([_w(d, "t.json", tampered), "--did", _w(d, "did.json", _did_doc(pk)), "--root-json", ""])
        assert code == 1 and r["signature"]["state"] == "INVALID"


def test_wrong_key_exits_1():
    sk, pk = _key()
    _, other = _key()
    with tempfile.TemporaryDirectory() as t:
        d = Path(t)
        code, r = _run([_w(d, "a.json", _card_py(sk, pk)), "--did", _w(d, "did.json", _did_doc(other)), "--root-json", ""])
        assert code == 1 and r["signature"]["state"] == "INVALID"


def test_not_in_roots_is_3_only_when_required():
    sk, pk = _key()
    a, b = _card_js(sk, "in"), _card_js(sk, "out")
    with tempfile.TemporaryDirectory() as t:
        d = Path(t)
        did, root = _w(d, "did.json", _did_doc(pk)), _w(d, "r.json", _card_root([a]))
        code, r = _run([_w(d, "b.json", b), "--did", did, "--card-root", root, "--root-json", ""])
        assert code == 0 and r["inclusion"]["state"] == "NOT_IN_SUPPLIED_ROOTS" and r["ots"]["state"] == "NOT_APPLICABLE"
        code, _ = _run([_w(d, "b.json", b), "--did", did, "--card-root", root, "--root-json", "", "--require-inclusion"])
        assert code == 3


def test_lying_leaf_count_and_bad_root_are_not_included():
    sk, pk = _key()
    a, b, c = _card_js(sk, "1"), _card_js(sk, "2"), _card_js(sk, "3")
    with tempfile.TemporaryDirectory() as t:
        d = Path(t)
        did = _w(d, "did.json", _did_doc(pk))
        lying = _card_root([a, b, c])
        lying["n_leaves"] = 4
        code, r = _run([_w(d, "a.json", a), "--did", did, "--card-root", _w(d, "l.json", lying), "--root-json", "", "--require-inclusion"])
        assert r["inclusion"]["state"] == "UNCHECKABLE" and code == 3
        wrong = _card_root([a, b, c])
        wrong["merkle_root"] = "00" * 32
        code, r = _run([_w(d, "a.json", a), "--did", did, "--card-root", _w(d, "w.json", wrong), "--root-json", ""])
        assert r["inclusion"]["state"] == "ROOT_INCONSISTENT" and code == 1
        pub = _public_root(sk, [a])
        pub["sig_ed25519"] = "00" * 64
        code, r = _run([_w(d, "a.json", a), "--did", did, "--root-json", _w(d, "p.json", pub)])
        assert r["inclusion"]["roots_checked"][0]["root_signature"] == "INVALID"


def test_public_root_card_shape_and_not_a_card():
    sk, pk = _key()
    inner = {"as_of": "2026-09-14T00:00:00Z", "did": f"{DID}#board-attestation-1", "payload": {"x": 1}, "schema": "s", "surface": "t",
             "subject": "ü", "unmeasured": []}
    inner["sha256"] = hashlib.sha256(cv.canon(inner, False)).hexdigest()
    env = {k: inner[k] for k in ("did", "schema", "surface", "as_of", "sha256")}
    inner["sig_ed25519"] = sk.sign(cv.canon(env, False)).hex()
    with tempfile.TemporaryDirectory() as t:
        d = Path(t)
        did = _w(d, "did.json", _did_doc(pk))
        pub = _w(d, "root.json", _public_root(sk, [inner]))
        code, r = _run([_w(d, "w.json", {"card": inner, "proof": {}}), "--did", did, "--root-json", pub, "--tamper-control", "--require-inclusion"])
        assert code == 0 and r["card_shape"] == "public-root-card" and r["signature"]["state"] == "VALID", r
        assert r["tamper_control"]["state"] == "DETECTED" and r["inclusion"]["state"] == "INCLUDED"
        code, r = _run([_w(d, "bad.json", {"card": {**inner, "payload": {"x": 2}}}), "--did", did, "--root-json", ""])
        assert code == 1 and r["signature"]["state"] == "INVALID"
        code, r = _run([_w(d, "n.json", {"hello": "world"}), "--did", did, "--root-json", "", "--tamper-control"])
        assert code == 2 and r["signature"]["state"] == "UNCHECKABLE"


if __name__ == "__main__":
    fns = [v for k, v in sorted(globals().items()) if k.startswith("test_") and callable(v)]
    for fn in fns:
        fn()
        print(f"PASS {fn.__name__}")
    print(f"{len(fns)} passed")
