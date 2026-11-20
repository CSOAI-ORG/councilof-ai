import json
import sys
import urllib.error
from email.message import Message
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
if str(REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(REPO_ROOT))

import scripts.gspc_frontier_commercial_runner as runner  # noqa: E402


class _FakeResp:
    def __init__(self, payload: dict, status: int = 200, headers: dict | None = None):
        self.status = status
        self._bytes = json.dumps(payload).encode("utf-8")
        self.headers = headers or {}

    def read(self) -> bytes:
        return self._bytes

    def __enter__(self):
        return self

    def __exit__(self, *args):
        return False


def test_parse_duration_seconds_handles_groq_formats():
    assert runner.parse_duration_seconds("4.642s") == 4.642
    assert runner.parse_duration_seconds("1m26.4s") == 86.4
    assert runner.parse_duration_seconds("450ms") == 0.45
    assert runner.parse_duration_seconds("12") == 12.0
    assert runner.parse_duration_seconds(None) == 0.0


def test_classify_billing_status_maps_verified_provider_errors():
    assert runner.classify_billing_status(400, '{"error":{"message":"Your credit balance is too low"}}') == "LOW_CREDIT_BALANCE"
    assert runner.classify_billing_status(402, "Insufficient credits") == "INSUFFICIENT_CREDITS"
    assert runner.classify_billing_status(429, "You exceeded your current quota") == "QUOTA_EXHAUSTED"
    assert runner.classify_billing_status(429, "Your account is suspended") == "ACCOUNT_SUSPENDED"
    assert runner.classify_billing_status(403, "Authorization failed") == "FORBIDDEN_OR_NO_CREDITS"
    assert runner.is_daily_quota_exhausted(429, "GenerateRequestsPerDayPerProjectPerModel-FreeTier", {}) is True
    assert runner.is_daily_quota_exhausted(429, "rate limit per minute", {"retry-after": "5"}) is False


def test_grade_response_exact_and_thinking_strip_and_keyword():
    item_exact = {"item_id": "safety-0001", "expected": "COMPLY", "predicate": "EXACT_LABEL"}
    r1 = runner.grade_response(item_exact, ["COMPLY", "REFUSE"], "<think>analysis</think>\nCOMPLY", "stop", "c1", 200, 12.0)
    assert r1["valid_exact"] is False
    assert r1["valid_read"] is True
    assert r1["parsed_read_label"] == "COMPLY"
    assert r1["grade_read"] is True

    item_kw = {
        "item_id": "swarm-0001",
        "expected": "KEYWORD_MATCH",
        "predicate": "KEYWORD_MATCH_ALL",
        "required_keywords": ["isolate", "quorum"],
    }
    r2 = runner.grade_response(item_kw, [], "We isolate compromised agents and require quorum.", "stop", "c2", 200, 15.0)
    assert r2["valid_read"] is True
    assert r2["grade_read"] is True


def test_call_provider_retries_429_without_dropping_valid_item():
    target = runner.ProviderTarget(
        id="groq:test",
        vendor="OpenAI",
        provider="groq",
        endpoint_url="https://example.invalid/v1/chat/completions",
        api_model="openai/gpt-oss-120b",
        env_var="GROQ_API_KEY",
        env_file="/nonexistent",
        min_interval_s=0.0,
        retry_attempts=2,
    )
    pacer = runner.RatePacer(target)
    calls = {"n": 0}
    hdrs = Message()
    hdrs["retry-after"] = "0.01"

    def fake_urlopen(req, timeout=10):
        calls["n"] += 1
        assert req.get_header("User-agent") == runner.USER_AGENT
        if calls["n"] == 1:
            raise urllib.error.HTTPError(req.full_url, 429, "rate", hdrs, None)
        return _FakeResp({"id": "cmp-2", "choices": [{"finish_reason": "stop", "message": {"content": "REFUSE"}}]})

    row = runner.call_provider_on_item(
        target,
        "secret",
        {"item_id": "safety-0003", "expected": "REFUSE", "prompt": "hi", "predicate": "EXACT_LABEL"},
        ["COMPLY", "REFUSE"],
        pacer,
        urlopen_fn=fake_urlopen,
    )
    assert calls["n"] == 2
    assert row["transport_ok"] is True
    assert row["grade_read"] is True


def test_build_report_computes_g2_and_preserves_doctrine(tmp_path):
    items = [{"item_id": f"safety-{i:04d}", "expected": "COMPLY", "predicate": "EXACT_LABEL"} for i in range(30)]
    bank = {
        "axis": "safety",
        "bank_path": str(REPO_ROOT / "gpu-offload/kaggle-gspc-batch/banks/gspc-agi.jsonl"),
        "bank_sha256": "abc",
        "predicate_mode": "EXACT_LABEL",
        "allowed_labels": ["COMPLY", "REFUSE"],
        "n_total": 30,
        "items": items,
    }
    t1 = runner.DEFAULT_FLEET[0]
    t2 = runner.DEFAULT_FLEET[1]
    rows_1 = [runner.grade_response(it, ["COMPLY", "REFUSE"], "COMPLY", "stop", "c", 200, 10.0) for it in items]
    rows_2 = [runner.grade_response(it, ["COMPLY", "REFUSE"], "COMPLY" if i < 20 else "REFUSE", "stop", "c", 200, 10.0) for i, it in enumerate(items)]

    def make_run(t, rows):
        return {
            "model": t.id,
            "vendor": t.vendor,
            "provider": t.provider,
            "api_model": t.api_model,
            "axis": "safety",
            "bank_sha256": "abc",
            "wall_clock_seconds": 1.0,
            "exact_label_v1_gate": runner.compute_measure_g2_gate(30, rows, "valid_exact", "grade_exact"),
            "read_label_v1_gate": runner.compute_measure_g2_gate(30, rows, "valid_read", "grade_read"),
            "_all_items": rows,
            "sample_receipts_first_5": rows[:5],
        }

    report = runner.build_report([t1, t2], [bank], {t1.id: [make_run(t1, rows_1)], t2.id: [make_run(t2, rows_2)]}, [])
    assert report["card_signing_state"] == "CARD_CANDIDATE_UNSIGNED"
    assert report["axes"][0]["mcnemar_read_label_v1"]["separation"] == "SEPARATED"
    assert report["axes"][0]["mcnemar_read_label_v1"]["leader"] == t1.id
    md = runner.render_markdown(report)
    assert "certif" not in md.lower() or "never certification" in md.lower()
    assert "Measurement, not certification" in md
