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


def test_apply_mill_persists_route_kind_so_nonchat_retry_is_once() -> None:
    """Without route_kind on the lock, millable retries embed rows forever.
    A green land that omits the field protects nothing."""
    import sys
    sys.path.insert(0, str(ROOT / "scripts"))
    from mill_lock_update import apply_mill  # noqa: E402
    from mill_window import millable_slugs  # noqa: E402

    lock = {
        "n_measured": 0,
        "models": [
            {
                "slug": "sentence-transformers/all-MiniLM-L6-v2",
                "pipeline_tag": "sentence-similarity",
                "status": "UNCHECKABLE",
            }
        ],
    }
    assert "sentence-transformers/all-MiniLM-L6-v2" in millable_slugs(lock["models"])
    mill = {
        "as_of": "2026-09-06T21:00:00Z",
        "rows": [
            {
                "slug": "sentence-transformers/all-MiniLM-L6-v2",
                "status": "UNCHECKABLE",
                "route_kind": "similarity",
                "pipeline_tag": "sentence-similarity",
                "reason": "HTTP 400 embeddings not served",
                "providers_live": [],
            }
        ],
    }
    out = apply_mill(lock, mill)
    assert out["models"][0]["route_kind"] == "similarity"
    assert out["n_measured"] == 0
    assert "sentence-transformers/all-MiniLM-L6-v2" not in millable_slugs(out["models"])


def test_apply_mill_does_not_persist_429_as_uncheckable() -> None:
    import sys
    sys.path.insert(0, str(ROOT / "scripts"))
    from mill_lock_update import apply_mill  # noqa: E402
    lock = {"n_measured": 0, "models": [{"slug": "a/x", "status": "UNMEASURED"}]}
    mill = {
        "as_of": "2026-09-06T18:00:00Z",
        "rows": [{"slug": "a/x", "status": "UNCHECKABLE", "reason": "HTTP 429 Too Many Requests"}],
    }
    out = apply_mill(lock, mill)
    assert out["models"][0]["status"] == "UNMEASURED"
    assert out["n_measured"] == 0


def test_rebuild_keeps_practice_mill_and_prefers_chat() -> None:
    """Mixed-download UNCHECKABLE cannot 200. Filling with provider-hosted
    chat-like slugs must not drop already-counted practice-mill."""
    import sys
    sys.path.insert(0, str(ROOT / "scripts"))
    from mill_lock_update import rebuild_provider_hosted_lock  # noqa: E402

    lock = {
        "kind": "csoai.fleet-lock/0.1",
        "n_measured": 2,
        "n_locked": 4,
        "writes_board": False,
        "models": [
            {"slug": "a/ok", "status": "practice-mill", "pipeline_tag": "sentence-similarity"},
            {"slug": "b/ok", "status": "practice-mill", "pipeline_tag": "text-generation"},
            {"slug": "c/dead", "status": "UNCHECKABLE", "pipeline_tag": "text-to-image"},
            {"slug": "d/dead", "status": "UNCHECKABLE", "pipeline_tag": "automatic-speech-recognition"},
        ],
    }
    candidates = [
        {"id": "img/one", "downloads": 9, "pipeline_tag": "text-to-image"},
        {"id": "chat/two", "downloads": 8, "pipeline_tag": "text-generation", "providers": ["featherless-ai"]},
        {"id": "a/ok", "downloads": 99, "pipeline_tag": "sentence-similarity"},
        {"id": "vlm/three", "downloads": 7, "pipeline_tag": "image-text-to-text"},
    ]
    out = rebuild_provider_hosted_lock(lock, candidates, n=4)
    slugs = [m["slug"] for m in out["models"]]
    assert out["n_locked"] == 4
    assert out["n_measured"] == 2
    assert "a/ok" in slugs and "b/ok" in slugs
    assert slugs[2] == "chat/two"
    assert slugs[3] == "vlm/three"
    assert out["models"][2].get("providers_live") == ["featherless-ai"]
    assert "c/dead" not in slugs
    assert all(m["status"] == "practice-mill" for m in out["models"][:2])
    assert all(m["status"] == "UNMEASURED" for m in out["models"][2:])


def test_stamp_zero_provider_does_not_invent_n_measured() -> None:
    """Leftover UNMEASURED with empty Hub mapping are recorded, not scored."""
    import sys
    sys.path.insert(0, str(ROOT / "scripts"))
    from mill_lock_update import stamp_zero_providers  # noqa: E402

    lock = {
        "n_measured": 2,
        "models": [
            {"slug": "a/ok", "status": "practice-mill"},
            {"slug": "a2/ok", "status": "practice-mill"},
            {"slug": "b/empty", "status": "UNMEASURED"},
            {"slug": "c/live", "status": "UNMEASURED"},
        ],
    }

    def fetch(slug: str):
        return ["featherless-ai"] if slug == "c/live" else []

    out = stamp_zero_providers(lock, fetch, "2026-09-06T18:00:00Z")
    assert out["n_measured"] == 2
    assert out["models"][0]["status"] == "practice-mill"
    assert out["models"][1]["status"] == "practice-mill"
    assert out["models"][2]["unmeasured_reason"] == "no live Inference Provider"
    assert out["models"][2]["providers_live"] == []
    assert out["models"][2]["status"] == "UNMEASURED"
    assert out["models"][3]["providers_live"] == ["featherless-ai"]
    assert "unmeasured_reason" not in out["models"][3]
    assert out["n_unmeasured_zero_provider"] == 1
    assert out["n_unmeasured_with_live_provider"] == 1


def test_restore_original_membership_drops_injected_slugs() -> None:
    """1030 on a substituted lock is not the HF2200 thousands bar.
    Restore keeps the original 2200 slugs in order and overlays
    practice-mill only for those slugs."""
    import sys
    sys.path.insert(0, str(ROOT / "scripts"))
    from mill_lock_update import restore_original_membership  # noqa: E402

    original = {
        "n_measured": 0,
        "n_locked": 4,
        "n_target": 4,
        "writes_board": False,
        "enters_board_means": False,
        "models": [
            {"slug": "orig/a", "status": "UNMEASURED", "pipeline_tag": "text-generation"},
            {"slug": "orig/b", "status": "UNMEASURED", "pipeline_tag": "text-generation"},
            {"slug": "orig/c", "status": "UNMEASURED", "pipeline_tag": "feature-extraction"},
            {"slug": "orig/d", "status": "UNMEASURED", "pipeline_tag": "text-generation"},
        ],
    }
    overlay_sub = {
        "n_measured": 3,
        "models": [
            {"slug": "orig/a", "status": "practice-mill", "n": 1},
            {"slug": "injected/warm", "status": "practice-mill", "n": 1},
            {"slug": "orig/b", "status": "UNCHECKABLE", "reason": "HTTP 400"},
            {"slug": "orig/a", "status": "UNCHECKABLE", "reason": "should not downgrade"},
        ],
    }
    out = restore_original_membership(original, [overlay_sub])
    slugs = [m["slug"] for m in out["models"]]
    assert slugs == ["orig/a", "orig/b", "orig/c", "orig/d"]
    assert "injected/warm" not in slugs
    assert out["n_locked"] == 4
    assert out["n_measured"] == 1
    assert out["models"][0]["status"] == "practice-mill"
    assert out["models"][1]["status"] == "UNCHECKABLE"
    assert out["models"][2]["status"] == "UNMEASURED"
    assert out["membership"] == "hf2200-download-ranked"


def test_restore_persists_route_kind_and_nonchat_reason() -> None:
    """apply_mill wrote route_kind; restore then rebuilt from git original
    and dropped it, so millable stayed 449. What would make this fail:
    overlay UNCHECKABLE MiniLM coming back without route_kind."""
    import sys
    sys.path.insert(0, str(ROOT / "scripts"))
    from mill_lock_update import restore_original_membership  # noqa: E402
    from mill_window import millable_slugs  # noqa: E402

    original = {
        "n_locked": 2,
        "writes_board": False,
        "enters_board_means": False,
        "models": [
            {"slug": "nomic-ai/nomic-embed-text-v1.5", "status": "UNMEASURED", "pipeline_tag": "sentence-similarity"},
            {"slug": "orig/b", "status": "UNMEASURED", "pipeline_tag": "text-generation"},
        ],
    }
    overlay = {
        "models": [
            {
                "slug": "nomic-ai/nomic-embed-text-v1.5",
                "status": "UNCHECKABLE",
                "pipeline_tag": "sentence-similarity",
                "route_kind": "similarity",
                "reason": 'HTTP 400 {"error":"Model not supported by provider hf-inference"}',
                "last_mill": "2026-09-06T20:29:00Z",
            }
        ]
    }
    out = restore_original_membership(original, [overlay])
    row = out["models"][0]
    assert row["status"] == "UNCHECKABLE"
    assert row["route_kind"] == "similarity"
    assert row["last_mill"] == "2026-09-06T20:29:00Z"
    assert "hf-inference" in (row.get("reason") or "")
    overlay["models"][0]["providers_live"] = []
    out = restore_original_membership(original, [overlay])
    assert out["models"][0]["providers_live"] == []
    assert "nomic-ai/nomic-embed-text-v1.5" not in millable_slugs(out["models"])


def test_workflow_lands_from_hub_queue_not_git_zero() -> None:
    """A green land-lock that patches the git lock (all UNMEASURED) and
    uploads it would wipe hub-queue n_measured. The workflow must fetch
    the hub lock first and refuse to publish on a miss."""
    yml = (ROOT / ".github/workflows/hf-inference-mill.yml").read_text()
    assert "csoai/hub-queue" in yml
    assert "HUB_LOCK_MISS" in yml
    assert "HUB_LOCK_NOT_PUBLISHED" in yml
    assert "JSONDecoder" in yml or "raw_decode" in yml
    assert "HF2200.original.json" in yml
    assert "MEMBERSHIP_DRIFT" in yml
    assert "restore_original_membership" in (ROOT / "scripts" / "mill_lock_update.py").read_text()


if __name__ == "__main__":
    test_hf2200_lock_is_a_real_queue()
    test_kaggle_lock_is_a_real_queue()
    test_workflow_surfaces_inference_fail_in_summary()
    test_apply_mill_counts_practice_mill_into_n_measured()
    test_uncheckable_is_not_n_measured_and_does_not_downgrade()
    test_apply_mill_persists_route_kind_so_nonchat_retry_is_once()
    test_apply_mill_does_not_persist_429_as_uncheckable()
    test_rebuild_keeps_practice_mill_and_prefers_chat()
    test_stamp_zero_provider_does_not_invent_n_measured()
    test_restore_original_membership_drops_injected_slugs()
    test_restore_persists_route_kind_and_nonchat_reason()
    test_workflow_lands_from_hub_queue_not_git_zero()
    print("test_fleet_locks: 12 passed")
