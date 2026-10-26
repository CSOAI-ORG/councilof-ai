"""Ledger is fail-closed: unknown price never sent, cap never exceeded."""
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import hf_spend_ledger as L  # noqa: E402

RAW = {"data": [
    {"id": "a/m", "providers": [
        {"provider": "groq", "status": "live", "pricing": {"input": 0.1, "output": 0.2}},
        {"provider": "nebius", "status": "live", "pricing": {"input": 0.3, "output": 0.6}}]},
    {"id": "b/m", "providers": [
        {"provider": "groq", "status": "live", "pricing": {"input": 0.1, "output": 0.2}},
        {"provider": "featherless-ai", "status": "live"}]},
]}


def test_price_pair_and_bare():
    p = L.load_prices(RAW)
    assert L.price_for(p, "a/m:groq") == (0.1, 0.2)
    assert L.price_for(p, "a/m") == (0.3, 0.6)  # bare = most expensive
    assert L.price_for(p, "b/m") is None  # one provider unpriced
    assert L.price_for(p, "b/m:featherless-ai") is None
    assert L.price_for(p, "zz/unknown:groq") is None


def test_meter_refuses_unknown_and_over_budget():
    m = L.ShardMeter(L.load_prices(RAW), 0.0001)
    assert m.pre("b/m", "x", 16) == (None, "PRICE_UNKNOWN")
    price, _ = m.pre("a/m:groq", "x" * 100, 16)
    assert price == (0.1, 0.2)
    m.post(price, "x", 16, {"prompt_tokens": 1000, "completion_tokens": 0})
    assert m.pre("a/m:groq", "x" * 100, 16) == (None, "BUDGET_STOP")


def test_missing_usage_charges_upper_bound():
    m = L.ShardMeter(L.load_prices(RAW), 1.0)
    c = m.post((1.0, 1.0), "abcd", 16, None)
    assert c == (L.est_tokens("abcd") + 16) / 1e6


def test_cap_reserve_settle(tmp_path):
    led = L.empty_ledger()
    led["spent_usd"] = 90.0
    amt = L.reserve(led, "r1")
    assert abs(amt - 1.6) < 1e-9 and L.remaining(led) <= 1e-9
    assert L.reserve(led, "r2") == 0.0
    L.settle(led, "r1", [0.5], day="2026-10-16")
    assert led["spent_usd"] == 90.5 and "r1" not in led["reserved"]


def test_cli_missing_shards_charged(tmp_path):
    f = tmp_path / "l.json"
    f.write_text(json.dumps(L.empty_ledger()))
    assert L._cli(["reserve", str(f), "r"]) == 0
    s = tmp_path / "spend_s0.json"
    s.write_text(json.dumps({"spent_usd": 0.01}))
    assert L._cli(["settle", str(f), "r", str(s)]) == 0
    led = json.loads(f.read_text())
    assert abs(led["spent_usd"] - (0.25 + 0.01 + 10.0 / 20 * 19)) < 1e-6
