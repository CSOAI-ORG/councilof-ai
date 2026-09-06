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
    assert "'110'" in yml or '"110"' in yml
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


def test_uncheckable_is_not_n_measured_and_does_not_downgrade() -> None:
    """UNCHECKABLE is a mill ledger state, not a measurement. n_measured
    counts practice-mill / MEASURED only. A later 400 must not wipe a
    practice-mill cell — that would be the land-lock git-zero class."""
    import sys
    sys.path.insert(0, str(ROOT / "scripts"))
    from mill_lock_update import apply_mill  # noqa: E402
    lock = {
        "n_measured": 2,
        "models": [
            {"slug": "a/x", "status": "practice-mill"},
            {"slug": "b/y", "status": "UNMEASURED"},
            {"slug": "c/z", "status": "UNMEASURED"},
        ],
    }
    mill = {
        "as_of": "2026-09-06T18:00:00Z",
        "rows": [
            {"slug": "a/x", "status": "UNCHECKABLE", "reason": "HTTP 400"},
            {"slug": "b/y", "status": "UNCHECKABLE", "reason": "HTTP 400"},
            {"slug": "c/z", "status": "practice-mill", "n": 1},
        ],
    }
    out = apply_mill(lock, mill)
    assert out["models"][0]["status"] == "practice-mill"
    assert out["models"][1]["status"] == "UNCHECKABLE"
    assert out["models"][2]["status"] == "practice-mill"
    assert out["n_measured"] == 2


def test_workflow_lands_from_hub_queue_not_git_zero() -> None:
    """A green land-lock that patches the git lock (all UNMEASURED) and
    uploads it would wipe hub-queue n_measured. The workflow must fetch
    the hub lock first and refuse to publish on a miss."""
    yml = (ROOT / ".github/workflows/hf-inference-mill.yml").read_text()
    assert "csoai/hub-queue" in yml
    assert "HUB_LOCK_MISS" in yml
    assert "HUB_LOCK_NOT_PUBLISHED" in yml
    assert "JSONDecoder" in yml or "raw_decode" in yml


if __name__ == "__main__":
    test_hf2200_lock_is_a_real_queue()
    test_kaggle_lock_is_a_real_queue()
    test_workflow_surfaces_inference_fail_in_summary()
    test_apply_mill_counts_practice_mill_into_n_measured()
    test_uncheckable_is_not_n_measured_and_does_not_downgrade()
    test_workflow_lands_from_hub_queue_not_git_zero()
    print("test_fleet_locks: 6 passed")
