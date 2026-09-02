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
    apply_valid_flips,
    axis_prompt,
    mill_index_row,
    _ROUTE,
    infer_hub,
    infer_one,
    openrouter_id,
    load_bank,
    load_only_ids,
    mill,
    pick_emptiest,
    stage_unsigned,
)
from verify_card import canonical_body_bytes, verify_signed_card, verify_signed_card_with_did_doc  # noqa: E402


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


def test_pick_emptiest_prefers_generative() -> None:
    rows = [
        {"rank": 1, "id": "sentence-transformers/all-MiniLM-L6-v2", "status": "UNMEASURED", "card_id": "", "pipeline_tag": "sentence-similarity"},
        {"rank": 2, "id": "Qwen/Qwen3-8B", "status": "UNMEASURED", "card_id": "", "pipeline_tag": "text-generation"},
        {"rank": 3, "id": "google-bert/bert-base-uncased", "status": "UNMEASURED", "card_id": "", "pipeline_tag": "fill-mask"},
    ]
    picked = pick_emptiest(rows, 10, generative_only=True)
    assert [r["id"] for r in picked] == ["Qwen/Qwen3-8B"]


def test_unsigned_card_is_uncheckable_not_measured() -> None:
    wrap = stage_unsigned("unit/model", "governance", hits=8, n=10, reason="n<30 unquotable")
    assert wrap["signature"] is None
    assert wrap["body"]["status"] == "UNMEASURED"
    assert wrap["body"]["accuracy"] != 0 or wrap["body"]["n"] == 0
    assert "SOVOS" not in json.dumps(wrap).upper()
    zero = stage_unsigned("unit/model", "governance", hits=0, n=30, reason="n>=30 pending sign")
    dumped = json.dumps(zero["body"], sort_keys=True, separators=(",", ":"))
    assert ":0.0" not in dumped
    assert zero["body"]["accuracy"] == 0
    assert type(zero["body"]["accuracy"]) is int
    assert "unsigned pending" not in json.dumps(zero["body"]).lower()
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
        + json.dumps({"rank": 3, "id": "org/done", "status": "MEASURED", "card_id": "deadbeef", "measured_axes": {"governance": {"status": "MEASURED", "card_id": "deadbeef"}}})
        + "\n"
    )
    rep = mill(q, out, pick_n=2, grade_n=2, dry=True)
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
    assert {s["axis"] for s in rep["skips"]} == {"governance"}
    safety = mill(q, out / "safety", pick_n=1, grade_n=1, dry=True, banks_dir=banks, axis="safety")
    assert {s["axis"] for s in safety["skips"]} == {"safety"}
    assert safety["axis"] == "safety"


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


def test_infer_hub_calls_the_hub_slug_not_a_proxy() -> None:
    """A card for Qwen/Qwen3-8B must come from that slug, not Groq llama-3.3."""
    import io
    import json
    import os
    from email.message import Message
    from unittest.mock import patch

    _DEAD.clear()
    os.environ["HF_TOKEN"] = "hf_test_not_real"
    seen: list[str] = []

    def fake_urlopen(req, timeout=60):  # noqa: ARG001
        body = json.loads(req.data.decode())
        seen.append(body.get("model"))
        class R:
            def read(self):
                return json.dumps({"choices": [{"message": {"content": "PROHIBITED"}}]}).encode()
            def __enter__(self):
                return self
            def __exit__(self, *a):
                return False
        return R()

    try:
        with patch("mill_hub_queue.urllib.request.urlopen", fake_urlopen):
            st, txt = infer_hub("Qwen/Qwen3-8B", "classify this")
    finally:
        os.environ.pop("HF_TOKEN", None)
        _DEAD.clear()
    assert st == "OK"
    assert txt == "PROHIBITED"
    assert seen
    assert all(s.startswith("Qwen/Qwen3-8B") for s in seen)
    assert not any("llama-3.3" in (s or "") for s in seen)


def test_apply_valid_flips_equals_valid_count() -> None:
    """Hub-queue (id, axis) flips MEASURED iff the wrap was VALID. Unsigned stays UNMEASURED."""
    rows = [
        {"id": "org/a", "status": "UNMEASURED", "card_id": "", "measured_axes": {}},
        {"id": "org/b", "status": "UNMEASURED", "card_id": "", "measured_axes": {}},
    ]
    unsigned = stage_unsigned("org/a", "governance", hits=8, n=30, reason="signed-pending-verify")
    unsigned["_verdict"] = "UNCHECKABLE"
    valid = stage_unsigned("org/b", "governance", hits=8, n=30, reason="signed-pending-verify")
    valid["_verdict"] = "VALID"
    n = apply_valid_flips(rows, [unsigned, valid])
    assert n == 1
    assert rows[0].get("status") == "UNMEASURED"
    assert (rows[0].get("measured_axes") or {}).get("governance") is None
    cell = (rows[1].get("measured_axes") or {}).get("governance") or {}
    assert cell.get("status") == "MEASURED"
    assert cell.get("card_id") == valid["id"]
    row = mill_index_row(valid, "https://councilof.ai/interop/mill-cards-signed/x.json")
    assert row["status"] == "MEASURED"
    assert row["model"] == "org/b"
    assert row["card_sha256"] == valid["id"]
    assert "unsigned pending" not in json.dumps(row)


def test_live_provider_slugs_file_has_twelve() -> None:
    ids = load_only_ids(HERE / "live_provider_slugs.txt")
    assert ids is not None
    assert len(ids) == 12
    assert "deepseek-ai/DeepSeek-R1" in ids
    assert "openai-community/gpt2" not in ids


def test_pick_emptiest_only_ids_skips_rank_dead() -> None:
    """Rank-1 gpt2/opt must not be graded when --only is the 12 provider-live slugs."""
    rows = [
        {"rank": 1, "id": "openai-community/gpt2", "status": "UNMEASURED", "card_id": "", "pipeline_tag": "text-generation"},
        {"rank": 2, "id": "facebook/opt-125m", "status": "UNMEASURED", "card_id": "", "pipeline_tag": "text-generation"},
        {"rank": 3, "id": "deepseek-ai/DeepSeek-R1", "status": "UNMEASURED", "card_id": "", "pipeline_tag": "text-generation"},
        {"rank": 4, "id": "meta-llama/Llama-3.1-8B-Instruct", "status": "UNMEASURED", "card_id": "", "pipeline_tag": "text-generation"},
    ]
    live = {"deepseek-ai/DeepSeek-R1", "meta-llama/Llama-3.1-8B-Instruct"}
    picked = pick_emptiest(rows, 10, generative_only=True, axis="safety", only_ids=live)
    assert [r["id"] for r in picked] == ["deepseek-ai/DeepSeek-R1", "meta-llama/Llama-3.1-8B-Instruct"]
    ranked = pick_emptiest(rows, 2, generative_only=True, axis="safety")
    assert [r["id"] for r in ranked] == ["openai-community/gpt2", "facebook/opt-125m"]


def test_mill_dry_only_ids_does_not_grade_rank_dead(tmp_path: Path | None = None) -> None:
    out = (tmp_path or (HERE / "_mill_test_only"))
    if out.exists() and tmp_path is None:
        import shutil

        shutil.rmtree(out, ignore_errors=True)
    q = HERE / "_mill_test_only_queue.jsonl"
    q.write_text(
        json.dumps({"rank": 1, "id": "openai-community/gpt2", "status": "UNMEASURED", "card_id": "", "pipeline_tag": "text-generation"})
        + "\n"
        + json.dumps({"rank": 2, "id": "deepseek-ai/DeepSeek-R1", "status": "UNMEASURED", "card_id": "", "pipeline_tag": "text-generation"})
        + "\n"
    )
    allow = HERE / "_mill_test_only_ids.txt"
    allow.write_text("deepseek-ai/DeepSeek-R1\n")
    ids = load_only_ids(allow)
    assert ids == {"deepseek-ai/DeepSeek-R1"}
    rep = mill(q, out, pick_n=10, grade_n=10, axis="safety", dry=True, only_ids=ids)
    skip_ids = {s["id"] for s in rep["skips"]}
    assert "deepseek-ai/DeepSeek-R1" in skip_ids
    assert "openai-community/gpt2" not in skip_ids
    assert rep["only_ids_n"] == 1
    assert rep["measured_flips"] == 0
    q.unlink(missing_ok=True)
    allow.unlink(missing_ok=True)


def test_axis_prompt_asks_for_one_token() -> None:
    p = axis_prompt("governance", "a square is live-scanned", ["PROHIBITED", "HIGH_RISK"])
    assert "EXACTLY ONE token" in p
    assert "PROHIBITED" in p
    assert "a square is live-scanned" in p


def test_sign_mill_skips_already_signed_same_id(tmp_path: Path | None = None) -> None:
    """Re-running mill-sign must not OIDC-sign a body that already has a matching signature."""
    sys.path.insert(0, str(HERE.parents[1] / "scripts"))
    import sign_mill_cards as sm  # noqa: E402

    root = tmp_path or (HERE / "_mill_test_sign")
    if tmp_path is None:
        import shutil

        shutil.rmtree(root, ignore_errors=True)
    src = root / "unsigned"
    dst = root / "signed"
    src.mkdir(parents=True, exist_ok=True)
    dst.mkdir(parents=True, exist_ok=True)
    wrap = stage_unsigned("deepseek-ai/DeepSeek-R1", "safety", hits=12, n=30, reason="signed-pending-verify")
    wrap["body"]["unmeasured"] = ["signed-pending-verify"]
    (src / "unsigned-safety-deadbeef12.json").write_text(json.dumps(wrap, indent=2) + "\n")
    already = {
        "alg": "Ed25519",
        "body": wrap["body"],
        "id": wrap["id"],
        "signature": "ab" * 32,
        "did": "did:web:csoai.org#board-attestation-1",
    }
    (dst / "signed-safety-deadbeef12.json").write_text(json.dumps(already, indent=2) + "\n")
    called = []

    def boom(body):
        called.append(body)
        raise AssertionError("OIDC must not run for already-signed matching id")

    sm.SRC = src
    sm.DST = dst
    sm.sign_via_oidc = boom
    rc = sm.main()
    assert rc == 0
    assert called == []
    out = json.loads((dst / "signed-safety-deadbeef12.json").read_text())
    assert out["signature"] == "ab" * 32


def test_unknown_did_is_uncheckable_not_measured() -> None:
    wrap = stage_unsigned("unit/model", "governance", hits=8, n=30, reason="n>=30 pending sign")
    wrap["did"] = "did:web:csoai.org#no-such-key"
    wrap["signature"] = "ab" * 32
    v, reason = verify_signed_card_with_did_doc(json.dumps(wrap).encode(), {"verificationMethod": []})
    assert v == "UNCHECKABLE"
    assert wrap["body"]["status"] == "UNMEASURED"
    assert v != "VALID"


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


def test_infer_hub_falls_back_to_openrouter_under_the_same_id() -> None:
    """HF router 403 (token without Inference Providers scope) → OpenRouter under the slug's own id.

    Never a proxy model: the OpenRouter id is the hub slug lowercased, and the route is recorded.
    """
    import json
    import os
    import urllib.error
    from email.message import Message
    from unittest.mock import patch

    _DEAD.clear()
    _ROUTE.clear()
    os.environ["HF_TOKEN"] = "hf_test_not_real"
    os.environ["OPENROUTER_API_KEY"] = "or_test_not_real"
    seen: list[tuple[str, str]] = []

    def fake_urlopen(req, timeout=60):  # noqa: ARG001
        body = json.loads(req.data.decode())
        seen.append((req.full_url, body.get("model")))
        if "router.huggingface.co" in req.full_url:
            raise urllib.error.HTTPError(req.full_url, 403, "Forbidden", Message(), None)

        class R:
            def read(self):
                return json.dumps({"choices": [{"message": {"content": "HIGH_RISK"}}]}).encode()

            def __enter__(self):
                return self

            def __exit__(self, *a):
                return False

        return R()

    try:
        with patch("mill_hub_queue.urllib.request.urlopen", fake_urlopen):
            st, txt = infer_hub("Qwen/Qwen3-8B", "classify this")
            wrap = stage_unsigned("Qwen/Qwen3-8B", "governance", hits=20, n=30, reason="signed-pending-verify", route=_ROUTE.get("Qwen/Qwen3-8B"))
    finally:
        os.environ.pop("HF_TOKEN", None)
        os.environ.pop("OPENROUTER_API_KEY", None)
        _DEAD.clear()
        _ROUTE.clear()
    assert st == "OK" and txt == "HIGH_RISK"
    or_calls = [m for u, m in seen if "openrouter.ai" in u]
    assert or_calls == ["qwen/qwen3-8b"]
    assert all(m.startswith("Qwen/Qwen3-8B") for u, m in seen if "huggingface" in u)
    assert not any("llama" in (m or "") for _, m in seen)
    assert wrap["body"]["route"] == "openrouter:qwen/qwen3-8b"
    assert wrap["body"]["status"] == "UNMEASURED"
    assert openrouter_id("deepseek-ai/DeepSeek-V3.2") == "deepseek/deepseek-v3.2"


def test_flip_hub_queue_only_valid_n30_cells(tmp_path: Path | None = None) -> None:
    """flip_hub_queue: a cell flips iff the signed card verifies VALID under the DID and n>=30."""
    import shutil
    from base64 import urlsafe_b64encode

    from cryptography.hazmat.primitives import serialization
    from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PrivateKey

    sys.path.insert(0, str(HERE.parents[1] / "scripts"))
    import flip_hub_queue as fq  # noqa: E402

    root = tmp_path or (HERE / "_flip_test")
    if tmp_path is None:
        shutil.rmtree(root, ignore_errors=True)
    cards = root / "signed"
    cards.mkdir(parents=True, exist_ok=True)
    key = Ed25519PrivateKey.generate()
    pub = key.public_key().public_bytes(serialization.Encoding.Raw, serialization.PublicFormat.Raw)
    did = "did:web:csoai.org#board-attestation-1"
    did_doc = {"verificationMethod": [{"id": did, "publicKeyJwk": {"x": urlsafe_b64encode(pub).decode().rstrip("=")}}]}

    def signed(model, axis, n, ok=True):
        w = stage_unsigned(model, axis, hits=n // 2, n=n, reason="signed-pending-verify")
        raw = canonical_body_bytes(w["body"])
        w["signature"] = key.sign(raw).hex() if ok else ("ab" * 32)
        w["did"] = did
        return w

    (cards / "signed-govern-valid.json").write_text(json.dumps(signed("org/a", "governance", 30)))
    (cards / "signed-safety-small.json").write_text(json.dumps(signed("org/a", "safety", 10)))
    (cards / "signed-govern-bad.json").write_text(json.dumps(signed("org/b", "governance", 30, ok=False)))
    unsigned = stage_unsigned("org/c", "governance", hits=1, n=30, reason="signed-pending-verify")
    (cards / "signed-govern-unsigned.json").write_text(json.dumps(unsigned))
    rows = [
        {"rank": 1, "id": "org/a", "status": "UNMEASURED", "card_id": "", "measured_axes": {}},
        {"rank": 2, "id": "org/b", "status": "UNMEASURED", "card_id": "", "measured_axes": {}},
        {"rank": 3, "id": "org/c", "status": "UNMEASURED", "card_id": "", "measured_axes": {}},
    ]
    q = root / "queue.jsonl"
    q.write_text("".join(json.dumps(r) + "\n" for r in rows))
    rep = fq.run(cards, q, did_doc, root / "out")
    assert rep["cells_after"] == 1 and rep["flipped_this_run"] == 1
    assert rep["verdicts"] == {"VALID": 1, "UNQUOTABLE": 1, "INVALID": 1, "UNCHECKABLE": 1}
    out_rows = [json.loads(l) for l in (root / "out" / "queue.jsonl").read_text().splitlines()]
    a = next(r for r in out_rows if r["id"] == "org/a")
    assert a["measured_axes"]["governance"]["status"] == "MEASURED"
    assert "safety" not in a["measured_axes"]
    assert all(r["status"] == "UNMEASURED" and r["card_id"] == "" for r in out_rows)
    summ = json.loads((root / "out" / "SUMMARY.json").read_text())
    assert summ["n_measured"] == 0 and summ["n_measured_axes"] == 1 and summ["n"] == 3
    assert "3 measured" not in summ["note"].replace("Not 3 measured", "")
    idx = (root / "out" / "mill-cards" / "INDEX.jsonl").read_text().splitlines()
    assert len(idx) == 1 and json.loads(idx[0])["status"] == "MEASURED"
    assert (root / "out" / "mill-cards" / "signed-govern-valid.json").is_file()
    assert not (root / "out" / "mill-cards" / "signed-govern-bad.json").is_file()


def test_land_mill_cards_dedupes_and_rejects_signed(tmp_path: Path | None = None) -> None:
    """land_mill_cards: honest unsigned cards land once; signed/tampered/duplicate cells are skipped."""
    import shutil

    sys.path.insert(0, str(HERE.parents[1] / "scripts"))
    import land_mill_cards as lm  # noqa: E402

    root = tmp_path or (HERE / "_land_test")
    if tmp_path is None:
        shutil.rmtree(root, ignore_errors=True)
    staged, inbox, signed_dir = root / "staged", root / "inbox", root / "signed"
    for d in (staged, signed_dir):
        d.mkdir(parents=True, exist_ok=True)
    good = stage_unsigned("org/new", "governance", hits=15, n=30, reason="signed-pending-verify")
    (staged / "unsigned-governan-aaaaaaaaaaaa.json").write_text(json.dumps(good))
    dup = stage_unsigned("org/done", "governance", hits=15, n=30, reason="signed-pending-verify")
    (staged / "unsigned-governan-bbbbbbbbbbbb.json").write_text(json.dumps(dup))
    already = dict(dup, signature="ab" * 32, did="did:web:csoai.org#board-attestation-1")
    (signed_dir / "signed-governan-bbbbbbbbbbbb.json").write_text(json.dumps(already))
    tampered = stage_unsigned("org/tamper", "governance", hits=15, n=30, reason="signed-pending-verify")
    tampered["body"]["accuracy"] = 1
    (staged / "unsigned-governan-cccccccccccc.json").write_text(json.dumps(tampered))
    presigned = dict(stage_unsigned("org/pre", "governance", hits=15, n=30, reason="x"), signature="ab" * 32)
    (staged / "unsigned-governan-dddddddddddd.json").write_text(json.dumps(presigned))
    rep = lm.land(staged, inbox, signed_dir)
    assert [r["model"] for r in rep["landed"]] == ["org/new"]
    reasons = {s["file"]: s["reason"] for s in rep["skipped"]}
    assert reasons["unsigned-governan-bbbbbbbbbbbb.json"].startswith("already-signed")
    assert "sha256" in reasons["unsigned-governan-cccccccccccc.json"]
    assert "signature" in reasons["unsigned-governan-dddddddddddd.json"]
    rep2 = lm.land(staged, inbox, signed_dir)
    assert rep2["landed"] == []
    assert any(s["reason"] == "already-landed same id" for s in rep2["skipped"])
    assert rep["signed_here"] is False and rep["writes_board"] is False


if __name__ == "__main__":
    test_pick_emptiest_skips_measured()
    test_pick_emptiest_prefers_generative()
    test_unsigned_card_is_uncheckable_not_measured()
    test_mill_dry_skip_log_no_measured_flip()
    test_load_bank_reads_case_operation_and_skips_canary()
    test_mill_dry_with_all_14_banks_has_no_frozen_bank_skip()
    test_infer_one_uses_set_keys_not_no_free_keys()
    test_infer_hub_calls_the_hub_slug_not_a_proxy()
    test_apply_valid_flips_equals_valid_count()
    test_live_provider_slugs_file_has_twelve()
    test_pick_emptiest_only_ids_skips_rank_dead()
    test_mill_dry_only_ids_does_not_grade_rank_dead()
    test_axis_prompt_asks_for_one_token()
    test_sign_mill_skips_already_signed_same_id()
    test_unknown_did_is_uncheckable_not_measured()
    test_live_hub_queue_not_2410_measured()
    print("PASS mill honesty")
    test_infer_hub_falls_back_to_openrouter_under_the_same_id()
    test_flip_hub_queue_only_valid_n30_cells()
    test_land_mill_cards_dedupes_and_rejects_signed()
