import importlib.util, json
from pathlib import Path

spec = importlib.util.spec_from_file_location("sfw", Path(__file__).resolve().parent / "serving_fidelity_worker.py")
w = importlib.util.module_from_spec(spec); spec.loader.exec_module(w)

FN = [{"name": "math.hypot", "parameters": {"type": "dict", "properties": {"x": {"type": "integer"}, "y": {"type": "integer"},
       "z": {"type": "integer"}, "pts": {"type": "array", "items": {"type": "integer"}}, "u": {"type": "string"}}, "required": ["x", "y"]}}]
G = {"ground_truth": [{"math.hypot": {"x": [4], "y": [5], "z": ["", 0], "pts": ["", [1, 2]], "u": ["", "cm"]}}]}


def test_gsm8k_parse():
    assert w.parse_gsm8k("work\nANSWER: $1,234.00", "stop") == ("ok", 1234)
    assert w.parse_gsm8k("ANSWER: 1\nANSWER: 18 %", "stop") == ("ok", 18)
    assert w.parse_gsm8k("ANSWER: 2.50", "stop")[1] == w.Decimal("2.50")
    assert w.parse_gsm8k("no line", "stop") == ("unparsed", None)
    assert w.parse_gsm8k("no line", "length") == ("truncated", None)
    assert w.parse_gsm8k("ANSWER: about ten", "stop") == ("unparsed", None)
    assert w.grade_gsm8k(18, "18") and not w.grade_gsm8k(17, "18")
    assert w.grade_gsm8k(w.Decimal("2.5"), "2.50")


def c(args, name="math.hypot", n=1):
    return {"name": name, "arguments": args, "n_calls": n}


def test_bfcl_ast():
    assert w.grade_bfcl(c({"x": 4, "y": "5"}), FN, G) == (True, "match")  # type-coerced
    assert w.grade_bfcl(c({"x": 4}), FN, G)[1] == "missing_required:y"
    assert w.grade_bfcl(c({"x": 4, "y": 5}, name="hypot"), FN, G)[1] == "wrong_function"
    assert w.grade_bfcl(c({"x": 4, "y": 5, "z": 1}), FN, G)[1] == "value_mismatch:z"
    assert w.grade_bfcl(c({"x": 4, "y": 5, "pts": [2, 1]}), FN, G)[1] == "value_mismatch:pts"  # order significant
    assert w.grade_bfcl(c({"x": 4, "y": 5, "u": "CM"}), FN, G)[1] == "value_mismatch:u"  # case-sensitive
    assert w.grade_bfcl(c({"x": 4, "y": 5, "q": 1}), FN, G)[1] == "unexpected_arg:q"
    assert w.grade_bfcl(c({"x": 4, "y": 5}, n=2), FN, G)[1] == "not_exactly_one_call"


def test_bfcl_extract():
    assert w.extract_call({"tool_calls": [{"function": {"name": "f", "arguments": {"a": 1}}}]}, "stop")[0] == "ok"
    assert w.extract_call({"content": '```json\n{"name":"f","arguments":{"a":1}}\n```'}, "stop")[2] == "content_json"
    assert w.extract_call({"content": "I cannot"}, "stop")[0] == "unparsed"
    assert w.extract_call({"content": "{\"name\":"}, "length")[0] == "truncated"


def test_schema_map():
    t = w.bfcl_tools(FN)[0]["function"]["parameters"]
    assert t["type"] == "object" and t["properties"]["x"]["type"] == "integer"


def test_gate():
    ok = [{"parse_status": "ok"}] * 30
    assert w.gate(ok, 0.5) == "CARD_CANDIDATE_UNSIGNED"
    assert w.gate(ok, 1.0) == "HOLD_FOR_REVIEW"
    assert w.gate(ok[:27] + [{"parse_status": "unparsed"}] * 3, 0.5) == "UNMEASURED_n_lt_30"
    assert w.gate(ok[:26] + [{"parse_status": "unparsed"}] * 4, 0.5) == "NO_RESULT_UNPARSED_GT_10PCT"
    assert w.gate(ok[:28] + [{"parse_status": "transport"}] * 2, 0.5) == "UNMEASURED_incomplete_run_TRANSPORT"


def test_cell_exactly_30(tmp_path):
    p = tmp_path / "b.jsonl"
    p.write_text("".join(json.dumps({"id": f"a{i}", "sub_bank": "a-closed-form"}) + "\n" for i in range(29)))
    try:
        w.load_cell_items(p, "gsm8k-30"); assert False
    except SystemExit as e:
        assert "exactly 30" in str(e)
