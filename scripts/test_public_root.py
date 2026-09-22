#!/usr/bin/env python3
"""Shipped public-root adapters + live GETs. XRPL 16 reader. SWIFT 17 UNMEASURED notices."""
from __future__ import annotations

import json
import sys
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))
from adapters import genai_mil_notices, swift_notices, xrpl  # noqa: E402

UA = {"User-Agent": "csoai-test-public-root/0"}


def _get(url: str) -> tuple[int, dict]:
    req = urllib.request.Request(url, headers=UA)
    with urllib.request.urlopen(req, timeout=25) as r:
        return r.status, json.loads(r.read())


def test_xrpl_locked_16_and_live_reader() -> None:
    assert len(xrpl.LOCKED_16) == 16
    symbols = [row["symbol"] for row in xrpl.LOCKED_16]
    assert len(set(symbols)) == 16
    blob = json.dumps(xrpl.LOCKED_16).lower()
    assert "represented tvl" not in blob
    assert "tvl" not in blob
    st, body = _get("https://councilof.ai/api/xrpl")
    assert st == 200
    assert body.get("kind") == "reader"
    assert body.get("writes_board") is False
    assert body.get("n") == 16
    note = json.dumps(body).lower()
    assert "writes_board" in note
    assert body.get("writes_board") is not True


def test_swift_17_unmeasured_notices() -> None:
    out = swift_notices.collect()
    leaves = out["leaves"]
    assert len(leaves) == 17
    assert len(swift_notices.COHORT_17) == 17
    sidecar = out["sidecar"]
    assert sidecar.get("cohort_are_clients") is False
    assert sidecar.get("gpi_firehose") is False
    assert sidecar.get("settlement_still_off_chain") is True
    banks = []
    for leaf in leaves:
        payload = leaf["payload"]
        assert payload.get("settlement_still_off_chain") is True
        assert payload.get("status") == "UNMEASURED"
        assert payload.get("not_a_client") is True
        assert payload.get("url_sha256") == swift_notices.PRESS_SHA256
        assert swift_notices.SWIFT_PRESS in leaf["source_urls"]
        banks.append(payload.get("bank"))
        text = json.dumps(leaf).lower()
        assert "gpi firehose" not in text or "not a gpi" in text
        assert "client" in text  # "not a client" / TARGETS-not-clients
    assert len(set(banks)) == 17
    assert "ANZ" in banks
    assert "Wells Fargo" in banks
    assert sidecar.get("swift_partnered") is False


def test_envelope_preimage_under_3kb() -> None:
    from publish_public_root import (
        PAYLOAD_CAP,
        canonical_bytes,
        envelope_preimage,
    )

    fake = {
        "kind": "csoai.public-root/v1",
        "schema": "https://councilof.ai/schema/public-root-v1.json",
        "as_of": "2026-09-01T01:48:00Z",
        "merkle_root": "4a9a5036b7e82b682e0908062e6b43043e3b16f02d1e4694b73607ad565ac69c",
        "card_count": 43,
        "did_intended": "did:web:csoai.org#board-attestation-1",
        "card_sha256": ["ab"] * 43,
        "note": "noise not in preimage",
    }
    pre = envelope_preimage(fake)
    raw = canonical_bytes(pre)
    assert set(pre) == {
        "kind",
        "schema",
        "as_of",
        "merkle_root",
        "card_count",
        "did_intended",
    }
    assert "card_sha256" not in pre
    assert len(raw) <= PAYLOAD_CAP
    assert len(raw) < 512


def test_genai_mil_7_unmeasured_notices() -> None:
    out = genai_mil_notices.collect()
    leaves = out["leaves"]
    assert len(leaves) == 7
    sidecar = out["sidecar"]
    assert sidecar.get("deployments_uncheckable") is True
    assert sidecar.get("model_behaviour_unsigned") is True
    assert sidecar.get("public_models_measured") is False
    subjects = []
    for leaf in leaves:
        payload = leaf["payload"]
        assert leaf["surface"] == "public.notice"
        # Facts, never a grade: every leaf is UNMEASURED or a MAPPING.
        assert payload.get("status") in ("UNMEASURED", "MAPPING")
        # Every leaf is honest about what it did NOT measure.
        assert leaf.get("unmeasured")
        assert leaf["source_urls"]
        subjects.append(leaf["subject"])
        text = json.dumps(leaf).lower()
        # No certification language anywhere in these facts.
        assert "certified" not in text or "not certified" in text or "not a cert" in text
    joined = " ".join(subjects).lower()
    assert "genai.mil" in joined
    assert "fedramp" in joined
    assert "crosswalk" in joined
    # Public frontier models are UNMEASURED here (owner-step grading).
    assert any("unmeasured" in s.lower() for s in subjects)


def test_live_root_envelope() -> None:
    st, root = _get("https://councilof.ai/root.json")
    assert st == 200
    assert root.get("did_intended")
    assert root.get("merkle_root")
    # `assert root.get("card_count")` was a truthiness check — it passed for ANY
    # non-zero count, including one that disagreed with the leaves it shipped with.
    # That mattered: with odd-node duplication (CVE-2012-2459) a 142-leaf and a
    # 144-leaf set hash to the same merkle_root, and card_count is the only signed
    # field that tells them apart. Demonstrated against the live root 2026-09-04.
    leaves = root.get("card_sha256")
    assert isinstance(leaves, list), "root must ship the leaf list it commits to"
    assert root["card_count"] == len(leaves), (
        f'card_count={root["card_count"]} but {len(leaves)} leaves — the signed count '
        "no longer binds the tree, so the root admits a second leaf set"
    )
    sig = root.get("sig_ed25519")
    if sig:
        assert isinstance(sig, str) and len(sig) >= 64
        assert root.get("sig_preimage")
    else:
        note = (root.get("note") or "").lower()
        assert "unsigned" in note or "not ed25519-signed" in note


if __name__ == "__main__":
    test_xrpl_locked_16_and_live_reader()
    test_swift_17_unmeasured_notices()
    test_genai_mil_7_unmeasured_notices()
    test_envelope_preimage_under_3kb()
    test_live_root_envelope()
    print("PASS public-root XRPL16 + SWIFT17 + GenAI.mil7 UNMEASURED notices + envelope preimage")


def test_count_check_can_actually_fail() -> None:
    """Prove the guard above is not vacuous.

    A check that has never been seen to fail is not evidence. This builds the exact
    forgery — the live leaf list plus two duplicated tail leaves, which recomputes to
    an identical merkle_root — and asserts the count check rejects it.
    """
    import hashlib

    def mroot(leaf_hexes: list[str]) -> str:
        lvl = [bytes.fromhex(h) for h in leaf_hexes]
        while len(lvl) > 1:
            lvl = [
                hashlib.sha256(lvl[i] + (lvl[i + 1] if i + 1 < len(lvl) else lvl[i])).digest()
                for i in range(0, len(lvl), 2)
            ]
        return lvl[0].hex()

    # Deterministic leg: the smallest tree that exhibits the collision. This does not
    # depend on today's card count, so the proof never silently stops proving.
    A, B, C = (hashlib.sha256(x).hexdigest() for x in (b"A", b"B", b"C"))
    assert mroot([A, B, C]) == mroot([A, B, C, C]), (
        "this tree shape is supposed to be duplication-collidable; if this stops "
        "holding, the node rule changed and node_definition/tree_caveat are now wrong"
    )
    assert len([A, B, C]) != len([A, B, C, C])  # only the count separates them

    # Live leg: the same collision on the published root. How many duplicated tail
    # leaves it takes depends on the binary structure of the count (2 at 142 leaves,
    # 4 at 140), so search rather than hardcode.
    st, root = _get("https://councilof.ai/root.json")
    assert st == 200
    leaves = root["card_sha256"]
    base = mroot(leaves)
    assert base == root["merkle_root"], "node_definition no longer reproduces the root"

    colliding = [k for k in range(1, 33) if mroot(leaves + leaves[-k:]) == base]
    assert colliding, (
        f"no tail-duplication collision found at {len(leaves)} leaves for k<=32. "
        "That is luck, not safety — the shape is still collidable. Keep the count check."
    )
    forged = leaves + leaves[-colliding[0] :]
    assert mroot(forged) == base                    # the forgery is real
    assert root["card_count"] != len(forged)        # and the count is what catches it


def test_kinds_index_counts_every_leaf_and_types_nothing() -> None:
    import importlib.util
    spec = importlib.util.spec_from_file_location("pub", ROOT / "scripts" / "publish_public_root.py")
    pub = importlib.util.module_from_spec(spec)
    assert spec and spec.loader
    spec.loader.exec_module(pub)
    cards = [
        {"payload": {"kind": "csoai.wrapper.parity/0.1", "state": "PROBED"}},
        {"payload": {"kind": "csoai.wrapper.parity/0.1", "state": "DISCOVERED"}},
        {"payload": {"kind": "csoai.eater.xrpl-issuer/0.1", "state": "PROBED"}},
        {"payload": {}},
    ]
    idx = pub.kinds_index(cards, as_of="2026-09-13T16:15:20Z", merkle_root="51cc")
    assert idx["card_count"] == 4
    assert sum(idx["by_kind"].values()) == 4
    assert idx["by_kind"]["csoai.wrapper.parity/0.1"] == 2
    assert idx["by_kind"]["?"] == 1
    assert idx["by_kind_state"]["csoai.wrapper.parity/0.1|PROBED"] == 1
    assert "MEASURED" not in json.dumps(idx["by_kind"])


# --- pod caller token path (2026-09-22) -------------------------------------------------
# The board signer accepts a second bearer beside GitHub OIDC. These tests prove the
# publisher (a) sends that bearer to BOARD_SIGN_URL and accepts a signature only when the
# signer's payload_sha256 equals the local canonical digest, and (b) fails CLOSED with no
# network call when neither a key, OIDC nor a pod token is configured.

_SIGNER_ENV = (
    "ACTIONS_ID_TOKEN_REQUEST_URL",
    "ACTIONS_ID_TOKEN_REQUEST_TOKEN",
    "BOARD_SIGN_KEY_PKCS8_B64",
    "BOARD_SIGN_POD_TOKEN",
    "BOARD_SIGN_POD_TOKEN_FILE",
)


class _FakeResp:
    def __init__(self, body: dict) -> None:
        self._b = json.dumps(body).encode("utf-8")

    def read(self) -> bytes:
        return self._b

    def __enter__(self):
        return self

    def __exit__(self, *exc):
        return False


def _pub_module():
    import publish_public_root as pub  # scripts/ is on sys.path above
    return pub


def test_pod_token_path_signs_and_binds_digest() -> None:
    import hashlib
    import os
    import tempfile
    from unittest import mock

    pub = _pub_module()
    payload = {"kind": "csoai.public-root/v1", "card_count": 3, "as_of": "2026-09-22T00:00:00Z"}
    digest = hashlib.sha256(pub.canonical_bytes(payload)).hexdigest()
    tokfile = Path(tempfile.mkdtemp()) / "tok"
    tokfile.write_text("unit-test-token-not-real\n", encoding="utf-8")
    seen: dict = {}

    def fake_urlopen(req, timeout=0):
        seen["auth"] = req.get_header("Authorization")
        seen["url"] = req.full_url
        seen["body"] = json.loads(req.data)
        return _FakeResp({"did": pub.DID, "sig_ed25519": "ab" * 32, "payload_sha256": digest, "signer_auth": "pod-token"})

    env = {"BOARD_SIGN_POD_TOKEN_FILE": str(tokfile), "BOARD_SIGN_URL": "https://signer.test/api/board-sign"}
    with mock.patch.dict(os.environ, env), mock.patch.object(pub.urllib.request, "urlopen", fake_urlopen):
        for k in _SIGNER_ENV:
            if k != "BOARD_SIGN_POD_TOKEN_FILE":
                os.environ.pop(k, None)
        assert pub.pod_token_available()
        assert pub.signer_available()
        assert not pub.oidc_available()
        assert pub.signer_path() == "pod-token"
        assert pub.sign_payload(payload, None) == "ab" * 32
    assert seen["auth"] == "Bearer unit-test-token-not-real"
    assert seen["url"] == env["BOARD_SIGN_URL"]
    assert seen["body"] == {"payload": payload}

    # Control: a signer whose payload_sha256 names OTHER bytes is refused, so a signature
    # over a differently-canonicalised preimage can never be attached to a leaf.
    def wrong_digest(req, timeout=0):
        return _FakeResp({"sig_ed25519": "ab" * 32, "payload_sha256": "0" * 64})

    with mock.patch.dict(os.environ, env), mock.patch.object(pub.urllib.request, "urlopen", wrong_digest):
        for k in _SIGNER_ENV:
            if k != "BOARD_SIGN_POD_TOKEN_FILE":
                os.environ.pop(k, None)
        assert pub.sign_via_pod_token(payload) is None
        try:
            pub.sign_payload(payload, None)
        except RuntimeError:
            pass
        else:
            raise AssertionError("accepted a signature whose attested digest is not the preimage digest")


def test_pod_token_absent_fails_closed_without_network() -> None:
    import os
    import tempfile
    from unittest import mock

    pub = _pub_module()
    payload = {"kind": "csoai.public-root/v1", "card_count": 3}

    def never(req, timeout=0):
        raise AssertionError("signer contacted with no credential configured")

    # (1) nothing configured at all
    with mock.patch.dict(os.environ, {}), mock.patch.object(pub.urllib.request, "urlopen", never):
        for k in _SIGNER_ENV:
            os.environ.pop(k, None)
        assert not pub.pod_token_available()
        assert not pub.signer_available()
        assert pub.signer_path() == "none"
        assert pub.sign_via_pod_token(payload) is None
        try:
            pub.sign_payload(payload, None)
        except RuntimeError:
            pass
        else:
            raise AssertionError("signed with no signer")

    # (2) a token FILE that is named but missing, and (3) one that is empty — both ABSENT
    missing = str(Path(tempfile.mkdtemp()) / "does-not-exist")
    empty = Path(tempfile.mkdtemp()) / "empty"
    empty.write_text("\n", encoding="utf-8")
    for path in (missing, str(empty)):
        with mock.patch.dict(os.environ, {"BOARD_SIGN_POD_TOKEN_FILE": path}), mock.patch.object(pub.urllib.request, "urlopen", never):
            for k in _SIGNER_ENV:
                if k != "BOARD_SIGN_POD_TOKEN_FILE":
                    os.environ.pop(k, None)
            assert not pub.pod_token_available(), path
            assert not pub.signer_available(), path
            try:
                pub.sign_payload(payload, None)
            except RuntimeError:
                pass
            else:
                raise AssertionError(f"signed with an absent token file: {path}")
