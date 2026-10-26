"""Hosted-api lane: separate lock, priced pairs only, gate as ruled."""
import hashlib
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import mill_hosted_api as M  # noqa: E402

ROOT = Path(__file__).resolve().parent.parent
LOCK = json.loads((ROOT / "measurement/hosted-api/HOSTED-API.lock.json").read_text())


def test_lock_is_separate_priced_and_cheapest_first():
    assert LOCK["kind"] == "csoai.hosted-api-lock/0.1"
    assert LOCK["label"] == "hosted-api, unsigned, not comparable"
    assert LOCK["n_locked"] == len(LOCK["models"]) != 2200
    pairs = [r["pair"] for r in LOCK["models"]]
    assert len(pairs) == len(set(pairs))
    assert [r["cost_rank"] for r in LOCK["models"]] == list(range(1, len(pairs) + 1))
    assert "usd" not in json.dumps(LOCK).lower()
    measured = {s for v in LOCK["deduped_against"].values() for s in v}
    assert not measured & {r["slug"] for r in LOCK["models"]}
    assert hashlib.sha256("\n".join(pairs).encode()).hexdigest() == LOCK["membership_sha256"]


def test_bank_frozen():
    b = (ROOT / LOCK["bank"]["path"]).read_bytes()
    assert hashlib.sha256(b).hexdigest() == LOCK["bank"]["sha256"]
    assert LOCK["bank"]["n"] >= 30 and LOCK["bank"]["temperature"] == 0


BANK = [{"expected": "HIGH_RISK"}] * 40


def ok(t, fin="stop"):
    return {"call": "OK", "raw": t, "finish": fin}


def test_gate_pass():
    g = M.grade([ok("HIGH_RISK")] * 38 + [ok("x")] * 2, BANK)
    assert g["status"] == "hosted-api-pass" and g["accuracy"] == 1.0


def test_gate_truncation_and_transport():
    g = M.grade([ok("HIGH_RISK")] * 35 + [ok("", "length")] * 5, BANK)
    assert "unparsed+truncated>10%" in g["gate_fails"]
    g = M.grade([ok("HIGH_RISK")] * 37 + [{"call": "TRANSPORT", "raw": "HTTP 500"}] * 3, BANK)
    assert g["gate_fails"] == ["transport>5%"]


def test_partial_bank_is_not_graded():
    assert M.grade([ok("HIGH_RISK")] * 39, BANK)["status"] == "INCOMPLETE"


def test_ambiguous_answer_unparsed():
    assert M.parse_token("HIGH_RISK or MINIMAL_RISK") is None
