#!/usr/bin/env python3
"""Hub-queue mill honesty: MEASURED only with VALID card; empty is not 0; skips logged."""
from __future__ import annotations

import json
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
from mill_hub_queue import (  # noqa: E402
    MODEL_AXES,
    _DEAD,
    infer_one,
    load_bank,
    mill,
    pick_emptiest,
    stage_unsigned,
)
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


def test_load_bank_reads_case_operation_and_skips_canary(tmp_path: Path | None = None) -> None:
    """The four previously empty axes used `case`/`operation`, not item/text."""
    root = tmp_path or (HERE / "_mill_test_banks")
    if root.exists() and tmp_path is None:
        import shutil

        shutil.rmtree(root, ignore_errors=True)
    root.mkdir(parents=True, exist_ok=True)
    (root / "provenance.jsonl").write_text(
        json.dumps({"_canary": "x", "_note": "drop"})
        + "\n"
        + json.dumps({"operation": "bytes copied; manifest travels", "expected": "SURVIVES"})
        + "\n"
    )
    (root / "swarm.jsonl").write_text(
        json.dumps({"case": "BFT council on injected voter", "expected": "CONSENSUS_CORRECT"}) + "\n"
    )
    (root / "machinery-conformity.jsonl").write_text(
        json.dumps({"case": "self-evolving safety component", "expected": "PART_A"}) + "\n"
    )
    (root / "detector-interop.jsonl").write_text(
        json.dumps({"case": "C2PA-signed asset", "expected": "INTEROPERABLE"}) + "\n"
    )
    (root / "governance.jsonl").write_text(
        json.dumps({"scenario": "live facial recognition on a square", "expected": "PROHIBITED"}) + "\n"
    )
    assert len(load_bank(root / "provenance.jsonl")) == 1
    assert load_bank(root / "provenance.jsonl")[0][1] == "SURVIVES"
    assert load_bank(root / "swarm.jsonl")[0][1] == "CONSENSUS_CORRECT"
    assert load_bank(root / "machinery-conformity.jsonl")[0][0].startswith("self-evolving")
    assert load_bank(root / "detector-interop.jsonl")[0][1] == "INTEROPERABLE"
    assert load_bank(root / "governance.jsonl")[0][1] == "PROHIBITED"
    fat = root / "care.jsonl"
    fat.write_text("".join(json.dumps({"text": f"item {i}", "expected": "1"}) + "\n" for i in range(30)))
    assert len(load_bank(fat)) >= 30


def test_mill_dry_with_all_14_banks_has_no_frozen_bank_skip(tmp_path: Path | None = None) -> None:
    root = tmp_path or (HERE / "_mill_test_all_banks")
    if root.exists() and tmp_path is None:
        import shutil

        shutil.rmtree(root, ignore_errors=True)
    banks = root / "banks"
    banks.mkdir(parents=True, exist_ok=True)
    for ax in MODEL_AXES:
        key = "case" if ax in ("swarm", "machinery-conformity", "detector-interop") else (
            "operation" if ax == "provenance" else "item"
        )
        banks.joinpath(f"{ax}.jsonl").write_text(json.dumps({key: f"{ax} prompt", "expected": "X"}) + "\n")
    q = root / "queue.jsonl"
    q.write_text(json.dumps({"rank": 1, "id": "org/empty-a", "status": "UNMEASURED", "card_id": ""}) + "\n")
    out = root / "out"
    rep = mill(q, out, pick_n=1, grade_n=1, dry=True, banks_dir=banks)
    assert rep["measured_flips"] == 0
    reasons = {s["reason"] for s in rep["skips"]}
    assert "UNCHECKABLE no frozen bank" not in reasons
    assert any("dry-run" in r for r in reasons)
    assert {s["axis"] for s in rep["skips"]} == set(MODEL_AXES)


def test_infer_one_uses_set_keys_not_no_free_keys() -> None:
    """When a key is set, a 403 is the skip reason — never 'no free keys'."""
    import io
    import os
    import urllib.error as urllib_error
    from email.message import Message
    from unittest.mock import patch

    _DEAD.clear()
    prior = {k: os.environ.get(k) for k in (
        "GROQ_API_KEY", "GEMINI_API_KEY", "GOOGLE_API_KEY", "NVIDIA_API_KEY",
        "OPENROUTER_API_KEY", "HF_TOKEN", "CEREBRAS_API_KEY", "TOGETHER_API_KEY",
        "MISTRAL_API_KEY", "SAMBANOVA_API_KEY", "CLOUDFLARE_API_TOKEN",
        "VERCEL_AI_GATEWAY_API_KEY", "AI_GATEWAY_API_KEY", "TOGETHER_AI_API_KEY",
        "HF_INFERENCE_TOKEN", "HUGGINGFACE_TOKEN", "HUGGINGFACE_HUB_TOKEN",
    )}
    os.environ["GROQ_API_KEY"] = "gsk_test_not_real"
    for k in prior:
        if k != "GROQ_API_KEY":
            os.environ.pop(k, None)

    def boom(*_a, **_k):
        raise urllib_error.HTTPError("https://api.groq.com/x", 403, "Forbidden", Message(), io.BytesIO())

    try:
        with patch("mill_hub_queue.urllib.request.urlopen", side_effect=boom):
            st1, txt1 = infer_one("hello", "llama-3.3-70b-versatile")
            st2, txt2 = infer_one("hello again", "llama-3.3-70b-versatile")
    finally:
        for k, v in prior.items():
            if v is None:
                os.environ.pop(k, None)
            else:
                os.environ[k] = v
        _DEAD.clear()
    assert st1 == "UNCHECKABLE"
    assert "no free keys" not in txt1
    assert "403" in txt1 or "groq" in txt1
    assert st2 == "UNCHECKABLE"
    assert "no free keys" not in txt2
    assert "dead-endpoints" in txt2 or "403" in txt2 or "groq" in txt2


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
    test_load_bank_reads_case_operation_and_skips_canary()
    test_mill_dry_with_all_14_banks_has_no_frozen_bank_skip()
    test_infer_one_uses_set_keys_not_no_free_keys()
    test_live_hub_queue_not_2410_measured()
    print("PASS mill honesty")
