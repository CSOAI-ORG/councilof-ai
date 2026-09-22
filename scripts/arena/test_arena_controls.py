"""test_arena_controls.py — planted controls for the ARENA -> Elo -> SIGNAL chain.

A grader that has only ever printed a leader has not been tested. Each control plants a
known outcome and asserts the chain reports it — and, for the failure cases, that it
refuses to name a leader or refuses a forged signature.

Run:  python3 -m pytest -q scripts/arena/test_arena_controls.py
"""
import base64, hashlib, json, os, subprocess, sys, tempfile
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE)); sys.path.insert(0, str(HERE.parent))
from elo_reference import build, parse_round, MIN_GAMES  # noqa: E402
from emit_signals import derive_signal  # noqa: E402
from board_sign import canonical, sha256_hex  # noqa: E402
from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PrivateKey  # noqa: E402
from cryptography.hazmat.primitives import serialization  # noqa: E402
from cryptography.exceptions import InvalidSignature  # noqa: E402

REG = {"axis": "gov", "status": "MEASURED", "scored_items": 237, "models": 19, "majority_baseline": 0.2911}


def rounds(axis, a, b, a_wins, b_wins, ties=0):
    out = []
    for i in range(a_wins):
        out.append({"round": len(out) + 1, "ts": "2026-09-22T00:00:00Z", "axis": axis,
                    a: {"score": 1.0, "elo": 0}, b: {"score": 0.0, "elo": 0}, "winner": a})
    for i in range(b_wins):
        out.append({"round": len(out) + 1, "ts": "2026-09-22T00:00:00Z", "axis": axis,
                    a: {"score": 0.0, "elo": 0}, b: {"score": 1.0, "elo": 0}, "winner": b})
    for i in range(ties):
        out.append({"round": len(out) + 1, "ts": "2026-09-22T00:00:00Z", "axis": axis,
                    a: {"score": 1.0, "elo": 0}, b: {"score": 1.0, "elo": 0}, "winner": "tie",
                    "bank_sha256": "deadbeef", "item": i, "grader": "axis_arena.score_first_label"})
    return out


def test_planted_winner_is_ranked_first_and_separated():
    body = build(rounds("gov", "alpha:7b", "beta:7b", 20, 0), [])
    rows = body["per_axis"]["gov"]
    assert rows[0]["model"] == "alpha:7b" and rows[0]["games"] == 20 and rows[0]["winrate"] == 1.0
    assert rows[1]["model"] == "beta:7b" and rows[1]["winrate"] == 0.0
    sig = derive_signal(REG, rows, body, "2026-09-22T00:00:00Z")
    assert sig["elo_separation"] == "SEPARATED" and sig["elo_leader"] == "alpha:7b"
    assert sig["status"] == "MEASURED" and sig["register"] == "MEASURED"


def test_reversed_plant_flips_the_leader():
    body = build(rounds("gov", "alpha:7b", "beta:7b", 0, 20), [])
    rows = body["per_axis"]["gov"]
    assert rows[0]["model"] == "beta:7b"
    sig = derive_signal(REG, rows, body, "t")
    assert sig["elo_leader"] == "beta:7b"


def test_even_split_is_a_tie_never_a_leader():
    body = build(rounds("gov", "alpha:7b", "beta:7b", 10, 10), [])
    sig = derive_signal(REG, body["per_axis"]["gov"], body, "t")
    assert sig["elo_separation"] == "TIE" and sig["elo_leader"] is None
    assert sig["status"] == "TIE" and sig["elo_top"] is not None


def test_thin_n_is_unmeasured():
    body = build(rounds("gov", "alpha:7b", "beta:7b", MIN_GAMES - 1, 0), [])
    assert body["per_axis"]["gov"] == []
    sig = derive_signal(REG, body["per_axis"]["gov"], body, "t")
    assert sig["status"] == "UNMEASURED" and sig["elo_leader"] is None and sig["elo_top"] is None


def test_ties_carry_no_rating_but_are_counted():
    body = build(rounds("gov", "alpha:7b", "beta:7b", 0, 0, ties=12), [])
    assert body["rounds"]["ties"] == 12 and body["rounds"]["decided"] == 0
    assert body["axis_meta"]["gov"]["ties"] == 12 and body["per_axis"]["gov"] == []
    # provenance keys on a round are never mistaken for a model
    assert body["axis_meta"]["gov"]["models_seen"] == 0


def test_provenance_keys_are_not_models():
    r = rounds("gov", "alpha:7b", "beta:7b", 1, 0)[0]
    r["bank_sha256"] = "abc"; r["answers"] = {"alpha:7b": "x"}; r["item"] = 3
    a, b, wa, wb, axis, sw = parse_round(r)
    assert {a, b} == {"alpha:7b", "beta:7b"} and axis == "gov"


def test_unmeasured_axis_on_register_never_measured_signal():
    body = build(rounds("gov", "alpha:7b", "beta:7b", 20, 0), [])
    sig = derive_signal(dict(REG, status="UNMEASURED"), body["per_axis"]["gov"], body, "t")
    assert sig["status"] == "UNMEASURED" and sig["elo_leader"] is None


def test_content_id_commits_to_body_and_signature_can_fail():
    body = build(rounds("gov", "alpha:7b", "beta:7b", 8, 2), [])
    cid = body.pop("content_id")
    assert cid == sha256_hex(canonical(body))
    sk = Ed25519PrivateKey.generate()
    sig = sk.sign(canonical(body))
    sk.public_key().verify(sig, canonical(body))
    altered = dict(body, generated="2099-01-01T00:00:00Z")
    try:
        sk.public_key().verify(sig, canonical(altered))
        assert False, "altered preimage verified — the verifier cannot fail"
    except InvalidSignature:
        pass


def test_verify_signed_accepts_board_style_and_rejects_forgery():
    """End to end through scripts/verify_signed.py with a pinned DID doc."""
    tmp = Path(tempfile.mkdtemp(prefix="arena-ctl-"))
    sk = Ed25519PrivateKey.generate()
    pub = sk.public_key().public_bytes(serialization.Encoding.Raw, serialization.PublicFormat.Raw)
    x = base64.urlsafe_b64encode(pub).decode().rstrip("=")
    did = "did:web:example.test#board-attestation-1"
    (tmp / "did.json").write_text(json.dumps({"id": "did:web:example.test", "verificationMethod": [
        {"id": did, "type": "JsonWebKey2020", "publicKeyJwk": {"kty": "OKP", "crv": "Ed25519", "x": x}}]}))
    body = build(rounds("gov", "alpha:7b", "beta:7b", 9, 1), [])
    sig_body = derive_signal(REG, body["per_axis"]["gov"], body, "2026-09-22T00:00:00Z")
    sig_body["signer"] = did
    cid = sha256_hex(canonical(sig_body))
    signed = dict(sig_body, content_id=cid, signature={
        "alg": "Ed25519", "did": did, "sig_ed25519": sk.sign(canonical(sig_body)).hex(),
        "payload_sha256": cid})
    (tmp / "ok.json").write_text(json.dumps(signed))
    forged = json.loads(json.dumps(signed)); forged["elo_leader"] = "beta:7b"
    (tmp / "forged.json").write_text(json.dumps(forged))
    ver = HERE.parent / "verify_signed.py"
    ok = subprocess.run([sys.executable, str(ver), str(tmp / "ok.json"), "--did-doc", str(tmp / "did.json")],
                        capture_output=True, text=True)
    bad = subprocess.run([sys.executable, str(ver), str(tmp / "forged.json"), "--did-doc", str(tmp / "did.json")],
                         capture_output=True, text=True)
    assert ok.returncode == 0 and "VALID" in ok.stdout, ok.stdout + ok.stderr
    assert bad.returncode == 1 and "INVALID" in bad.stdout, bad.stdout + bad.stderr
