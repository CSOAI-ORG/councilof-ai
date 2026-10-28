"""v0.3 selftest (Measure rulings 17 Oct 2026). Raw responses are verbatim from SF-V02-FULL-20261017 (unsigned v0.2 runs)."""
import importlib.util, json
from pathlib import Path

HERE = Path(__file__).resolve().parent
spec = importlib.util.spec_from_file_location("sfw", HERE / "serving_fidelity_worker.py")
w = importlib.util.module_from_spec(spec); spec.loader.exec_module(w)
RAWS = [json.loads(l) for l in (HERE / "fixtures" / "sf_v03_selftest_raws.jsonl").read_text(encoding="utf-8").splitlines() if l.strip()]


def test_version_and_tokens():
    assert w.WORKER_VERSION == "serving-fidelity-worker-v0.3"
    assert w.GSM8K_MAX_TOKENS == 2048 and w.BFCL_MAX_TOKENS == 2048


def test_recorded_raws():
    assert len(RAWS) == 7
    for r in RAWS:
        st, v, _ = w.parse_gsm8k(r["content"], r["done_reason"])
        assert (st, v) == (r["expect_status"], r["expect_value"]), (r["model"], r["item_id"], st, v)


def test_mistral_five_exact():
    got = {r["item_id"]: w.parse_gsm8k(r["content"], r["done_reason"])[:2] for r in RAWS if r["model"] == "mistral:7b"}
    assert got == {"sf-a-01": ("unparsed", None), "sf-a-02": ("unparsed", None), "sf-a-03": ("truncated", None),
                   "sf-a-04": ("unparsed", None), "sf-a-05": ("ok", 10)}


def test_length_is_truncated_regardless():
    assert w.parse_gsm8k("ANSWER: 18", "length") == ("truncated", None, None)
    assert w.extract_call({"tool_calls": [{"function": {"name": "f", "arguments": {"a": 1}}}]}, "length")[0] == "truncated"
    assert w.extract_call({"content": '{"name":"f","arguments":{"a":1}}'}, "length")[0] == "truncated"


def test_markdown_and_echo():
    assert w.parse_gsm8k("**ANSWER: 20**", "stop")[:2] == ("ok", 20)
    assert w.parse_gsm8k("`ANSWER: 7`", "stop")[:2] == ("ok", 7)
    assert w.parse_gsm8k("   _ANSWER:_ 7", "stop")[:2] == ("ok", 7)
    assert w.parse_gsm8k("work\nEnd with a line: ANSWER: 540", "stop")[0] == "unparsed"  # echo ignored, no real line
    assert w.parse_gsm8k("ANSWER: 540\nEnd with a line: ANSWER: 9", "stop")[:2] == ("ok", 540)  # real last line counts


def test_one_number_rule():
    assert w.parse_gsm8k("ANSWER: $1,234.00", "stop")[:2] == ("ok", 1234)
    assert w.parse_gsm8k("ANSWER: 18 %", "stop")[:2] == ("ok", 18)
    assert w.parse_gsm8k("ANSWER: 10 cups of feed", "stop")[:2] == ("ok", 10)
    assert w.parse_gsm8k("ANSWER: 20.", "stop")[:2] == ("ok", 20)
    assert w.parse_gsm8k("ANSWER: -3", "stop")[:2] == ("ok", -3)
    assert w.parse_gsm8k("ANSWER: 3 (2 + 1 = 3)", "stop")[0] == "unparsed"
    assert w.parse_gsm8k("ANSWER: 5400 meters (3 sprints)", "stop")[0] == "unparsed"
    assert w.parse_gsm8k("ANSWER: about ten", "stop")[0] == "unparsed"
    assert w.parse_gsm8k("ANSWER: 1\nANSWER: 18", "stop")[:2] == ("ok", 18)  # last line wins


def test_boxed_fallback_unchanged():
    assert w.parse_gsm8k("so \\boxed{5} then \\boxed{$70,000}", "stop") == ("ok", 70000, "boxed")
    assert w.parse_gsm8k("no line 42", "stop") == ("unparsed", None, None)
