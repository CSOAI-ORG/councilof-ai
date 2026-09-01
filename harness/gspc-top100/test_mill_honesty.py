#!/usr/bin/env python3
"""Hub-queue mill honesty: MEASURED only with VALID card; empty is not 0; skips logged."""
from __future__ import annotations

import json
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
from mill_hub_queue import mill, pick_emptiest, stage_unsigned  # noqa: E402
from verify_card import canonical_body_bytes, verify_signed_card  # noqa: E402


def test_pick_emptiest_skips_measured() -> None:
    rows = [
        {"rank": 1, "id": "a/measured", "status": "MEASURED", "card_id": "abc"},
        {"rank": 2, "id": "b/empty", "status": "UNMEASURED", "card_id": ""},
        {"rank": 3, "id": "c/empty", "status": "UNMEASURED", "card_id": ""},
    ]
    picked = pick_emptiest(rows, 10)
    ids = [r["id"] for r in picked]
    assert "a/measured" not in ids
    assert ids == ["b/empty", "c/empty"]


def test_unsigned_card_is_uncheckable_not_measured() -> None:
    wrap = stage_unsigned("unit/model", "governance", hits=8, n=10, reason="n<30 unquotable")
    assert wrap["signature"] is None
    assert wrap["body"]["status"] == "UNMEASURED"
    assert wrap["body"]["accuracy"] != 0 or wrap["body"]["n"] == 0
    assert "SOVOS" not in json.dumps(wrap).upper()
    raw = canonical_body_bytes(wrap["body"])
    import hashlib

    assert hashlib.sha256(raw).hexdigest() == wrap["id"]
    verdict, reason = verify_signed_card(json.dumps(wrap).encode(), b"\x00" * 32)
    assert verdict in ("UNCHECKABLE", "INVALID")
    assert verdict != "VALID"


def test_mill_dry_skip_log_no_measured_flip(tmp_path: Path | None = None) -> None:
    out = (tmp_path or (HERE / "_mill_test_out"))
    if out.exists() and tmp_path is None:
        import shutil

        shutil.rmtree(out, ignore_errors=True)
    q = HERE / "_mill_test_queue.jsonl"
    q.write_text(
        json.dumps({"rank": 1, "id": "org/empty-a", "status": "UNMEASURED", "card_id": ""})
        + "\n"
        + json.dumps({"rank": 2, "id": "org/empty-b", "status": "UNMEASURED", "card_id": ""})
        + "\n"
        + json.dumps({"rank": 3, "id": "org/done", "status": "MEASURED", "card_id": "deadbeef"})
        + "\n"
    )
    rep = mill(q, out, pick_n=100, grade_n=2, dry=True)
    assert rep["measured_flips"] == 0
    assert rep["queue_n"] == 3
    assert len(rep["skips"]) >= 2
    skip_ids = {s["id"] for s in rep["skips"]}
    assert "org/empty-a" in skip_ids
    assert "org/done" not in skip_ids
    for s in rep["skips"]:
        assert s.get("reason") not in ("0", 0)
    q.unlink(missing_ok=True)


def test_live_hub_queue_not_2410_measured() -> None:
    """If a hub-queue parquet is in cwd/scratch, assert n_measured != 2410 unless 2410 cards."""
    candidates = [
        Path.cwd() / "queue.parquet",
        Path("/var/folders/jg/ttg144b97wj695sn123wlmsc0000gn/T/grok-goal-677b9a4cb37b/implementer/queue.parquet"),
    ]
    pq = next((p for p in candidates if p.is_file()), None)
    if pq is None:
        return
    import pandas as pd

    df = pd.read_parquet(pq)
    n = len(df)
    n_m = int((df["status"] == "MEASURED").sum()) if "status" in df.columns else 0
    assert n_m < n or n_m == 0 or (
        n_m == n and df["card_id"].astype(str).str.len().min() > 8
    )
    assert not (n == 2410 and n_m == 2410)


if __name__ == "__main__":
    test_pick_emptiest_skips_measured()
    test_unsigned_card_is_uncheckable_not_measured()
    test_mill_dry_skip_log_no_measured_flip()
    test_live_hub_queue_not_2410_measured()
    print("PASS mill honesty")
