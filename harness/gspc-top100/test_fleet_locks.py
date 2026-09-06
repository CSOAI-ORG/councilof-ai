"""Lock shape honesty. n_measured is read, never hardcoded as a 'pass' integer."""
from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]


def test_hf2200_lock_is_a_real_queue() -> None:
    lock = json.loads((ROOT / "public/fleet/HF2200.lock.json").read_text())
    assert lock["kind"] == "csoai.fleet-lock/0.1"
    assert lock["n_locked"] == 2200
    assert len(lock["models"]) == 2200
    assert isinstance(lock["n_measured"], int)
    assert lock["enters_board_means"] is False
    assert lock["writes_board"] is False
    assert lock["status_all"] == "UNMEASURED"
    assert lock.get("queue_as_of")
    assert lock["models"][0]["status"] == "UNMEASURED"


def test_kaggle_lock_is_a_real_queue() -> None:
    lock = json.loads((ROOT / "locks/KAGGLE.lock.json").read_text())
    assert lock["n_locked"] == lock["n"] == lock["n_target"]
    assert lock["n_locked"] > 0
    assert len(lock["models"]) == lock["n_locked"]
    assert lock["status_all"] == "UNMEASURED"
    assert lock["enters_board_means"] is False
    assert lock.get("queue_as_of")
    assert all(m["status"] == "UNMEASURED" for m in lock["models"])


def test_workflow_surfaces_inference_fail_in_summary() -> None:
    yml = (ROOT / ".github/workflows/hf-inference-mill.yml").read_text()
    assert "GITHUB_STEP_SUMMARY" in yml
    assert "INFERENCE_FAIL" in yml
    assert "MILL_SHARDS" in yml
    assert "timeout-minutes: 60" in yml
    assert "matrix:" in yml
    assert "HF2200.lock.json" in yml


def test_apply_mill_counts_practice_mill_into_n_measured() -> None:
    import sys
    sys.path.insert(0, str(ROOT / "scripts"))
    from mill_lock_update import apply_mill  # noqa: E402
    lock = {
        "n_measured": 0,
        "models": [
            {"slug": "a/x", "status": "UNMEASURED"},
            {"slug": "b/y", "status": "UNMEASURED"},
        ],
    }
    mill = {"as_of": "2026-09-06T00:00:00Z", "rows": [{"slug": "a/x", "status": "practice-mill", "n": 1}]}
    out = apply_mill(lock, mill)
    assert out["n_measured"] == 1
    assert out["models"][0]["status"] == "practice-mill"
    assert out["models"][1]["status"] == "UNMEASURED"


if __name__ == "__main__":
    test_hf2200_lock_is_a_real_queue()
    test_kaggle_lock_is_a_real_queue()
    test_workflow_surfaces_inference_fail_in_summary()
    test_apply_mill_counts_practice_mill_into_n_measured()
    print("test_fleet_locks: 4 passed")
