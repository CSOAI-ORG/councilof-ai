#!/usr/bin/env python3
"""serving-fidelity-worker-v0.3 -- GSPC serving-fidelity cells (Measure rulings 16+17 Oct 2026; v0.3: length=TRUNCATED, strict one-number ANSWER line, markdown/echo cleanup, max_tokens 2048).

Scores two sub-banks of the frozen serving-fidelity bank as SEPARATE cells, each exactly 30 items, never padded:
  gsm8k-30  (sub_bank "a-closed-form")  numeric answer, parsed from the last "ANSWER:" line
  bfcl-30   (sub_bank "b-tool-call")    one tool call via the Ollama `tools` field, AST-matched to frozen BFCL gold

Shared G2 invariants: serial (one request at a time), temperature 0, seed 0, NUM_PARALLEL=1 asserted from env;
model manifest digest pinned and checked before AND after the run; frozen bank (and BFCL gold) sha256 checked
before the first prompt -- mismatch refuses the run; run_of_record / duplicate_of recorded; score_scale "fraction";
G2 gate: n_valid >= 30, (unparsed+truncated) <= 10%, transport <= 5%, score not exactly 0 or 1 (else HOLD_FOR_REVIEW).

Loopback Ollama only. Never signs, publishes, or writes the board. Output is UNSIGNED.
Every item row records: raw_response_sha256, parse_status (ok|unparsed|truncated|transport), method_sha256,
bank_sha256, model_digest, worker_version.
"""
from __future__ import annotations

import argparse, hashlib, json, os, re, sys, time, urllib.error, urllib.request, uuid
from datetime import datetime, timezone
from decimal import Decimal, InvalidOperation
from pathlib import Path

WORKER_VERSION = "serving-fidelity-worker-v0.3"
RUN_SCHEMA = "csoai.serving-fidelity-run/0.3"
ITEM_SCHEMA = "csoai.serving-fidelity-item/0.3"
BFCL_SCHEMA_MAPPING = {"dict": "object", "float": "number", "tuple": "array"}
BFCL_UPSTREAM = {"repo": "ShishirPatil/gorilla", "file": "berkeley-function-call-leaderboard/bfcl_eval/data/possible_answer/BFCL_v4_simple_python.json", "commit": "f7cf7359b7ac615a0b294831c5ba2bc95ee4a000", "licence": "Apache-2.0"}
GSM8K_PARSE_ORDER = ["done_reason=length -> TRUNCATED (regardless of content)", "clean: strip * _ ` and leading whitespace per line; drop lines containing 'End with a line:'",
                     "last line starting ANSWER: -> exactly one number (optional $ , %), trailing text without digits allowed; a second number -> UNPARSED",
                     "else last \\boxed{...}", "else UNPARSED (bare trailing number is UNPARSED)"]
SUB_BANKS = {"gsm8k-30": "a-closed-form", "bfcl-30": "b-tool-call"}
CELL_N = 30
GSM8K_SUFFIX = "End with a line: ANSWER: <number>"
GSM8K_MAX_TOKENS = 2048  # v0.3: uniform across models and both sub-banks
BFCL_MAX_TOKENS = 2048
TIMEOUT_S = 300
LOOPBACK = ("127.0.0.1", "localhost", "::1")


def method_sha256() -> str:
    return hashlib.sha256(Path(__file__).read_bytes()).hexdigest()


def sha256_file(p: Path) -> str:
    return hashlib.sha256(p.read_bytes()).hexdigest()


def sha256_text(s: str) -> str:
    return hashlib.sha256(s.encode("utf-8")).hexdigest()


def now() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


class Refuse(SystemExit):
    pass


# ---------------------------------------------------------------- bank


def load_cell_items(bank: Path, sub_bank_cell: str) -> list[dict]:
    rows = [json.loads(l) for l in bank.read_text(encoding="utf-8").splitlines() if l.strip()]
    want = SUB_BANKS[sub_bank_cell]
    items = [r for r in rows if r.get("sub_bank") == want]
    if len(items) != CELL_N:  # exactly 30, never padded
        raise Refuse(f"REFUSE: sub-bank {sub_bank_cell} has {len(items)} items, need exactly {CELL_N}")
    if len({r["id"] for r in items}) != CELL_N:
        raise Refuse("REFUSE: duplicate item ids in sub-bank")
    return sorted(items, key=lambda r: r["id"])


# ---------------------------------------------------------------- GSM8K

_ANSWER_LINE_RE = re.compile(r"^ANSWER:(.*)$")
_ONE_NUMBER_RE = re.compile(r"^\s*(-?\$?-?\d[\d,]*(?:\.\d+)?)\s*%?(.*)$")
_ECHO = "End with a line:"


def normalize_number(s: str):
    """Strip commas, $, % and whitespace; decimal match. Integers come back as int."""
    t = re.sub(r"[,\$%\s]", "", s or "")
    t = t.rstrip(".")
    if not t:
        return None
    try:
        d = Decimal(t)
    except InvalidOperation:
        return None
    if not d.is_finite():
        return None
    if d == d.to_integral_value():
        return int(d)
    return d


def clean_lines(content: str) -> list[str]:
    """v0.3 (b): per line strip markdown emphasis (* _) and backticks, then leading whitespace; drop prompt-echo lines."""
    out = []
    for line in (content or "").splitlines():
        c = re.sub(r"[*_`]", "", line).lstrip()
        if _ECHO in c:
            continue
        out.append(c)
    return out


def parse_answer_value(rest: str):
    """v0.3 (c): exactly ONE number (optional $, commas, %); trailing text allowed only if it has no other digits."""
    m = _ONE_NUMBER_RE.match(rest)
    if not m or re.search(r"\d", m.group(2)):
        return None
    return normalize_number(m.group(1))


_BOXED_RE = re.compile(r"\\boxed\{([^{}]*)\}")


def parse_gsm8k(content: str, done_reason: str | None):
    """-> (parse_status, parsed_value, parsed_via). v0.3: length = TRUNCATED first; then last cleaned ANSWER: line; else last \\boxed{...}; else UNPARSED."""
    if done_reason == "length":  # (a) regardless of content
        return "truncated", None, None
    lines = clean_lines(content)
    answers = [m.group(1) for m in (_ANSWER_LINE_RE.match(l) for l in lines) if m]
    if answers:
        v = parse_answer_value(answers[-1])
        return ("ok", v, "answer_line") if v is not None else ("unparsed", None, "answer_line")
    boxed = _BOXED_RE.findall("\n".join(lines))
    if boxed:
        v = normalize_number(boxed[-1])
        return ("ok", v, "boxed") if v is not None else ("unparsed", None, "boxed")
    return "unparsed", None, None


def grade_gsm8k(parsed, gold: str) -> bool:
    g = normalize_number(str(gold))
    if g is None:
        raise Refuse(f"REFUSE: unparseable gold {gold!r}")
    return Decimal(str(parsed)) == Decimal(str(g))


# ---------------------------------------------------------------- BFCL

_TYPE_MAP = {**BFCL_SCHEMA_MAPPING}


def to_ollama_schema(node):
    """BFCL's documented OpenAI-style type mapping (dict->object, float->number, tuple->array). Deterministic, no other edits."""
    if isinstance(node, dict):
        out = {}
        for k, v in node.items():
            if k == "type" and isinstance(v, str):
                out[k] = _TYPE_MAP.get(v, v)
            else:
                out[k] = to_ollama_schema(v)
        return out
    if isinstance(node, list):
        return [to_ollama_schema(x) for x in node]
    return node


def bfcl_tools(functions: list[dict]) -> list[dict]:
    return [{"type": "function", "function": {"name": f["name"], "description": f.get("description", ""),
             "parameters": to_ollama_schema(f.get("parameters", {}))}} for f in functions]


def _first_json_object(text: str):
    t = (text or "").strip()
    t = re.sub(r"^```(?:json)?\s*|\s*```$", "", t)
    start = t.find("{")
    while start != -1:
        try:
            obj, _ = json.JSONDecoder().raw_decode(t[start:])
            if isinstance(obj, dict):
                return obj
        except ValueError:
            pass
        start = t.find("{", start + 1)
    return None


def extract_call(message: dict, done_reason: str | None):
    """-> (parse_status, call|None, source). Exactly one tool_call required; >1 is a parsed, wrong attempt.
    v0.3 (a): done_reason=length -> TRUNCATED regardless of tool_calls/content."""
    if done_reason == "length":
        return "truncated", None, None
    tcs = message.get("tool_calls") or []
    if tcs:
        if len(tcs) != 1:
            return "ok", {"name": None, "arguments": None, "n_calls": len(tcs)}, "tool_calls"
        fn = tcs[0].get("function", {})
        args = fn.get("arguments")
        if isinstance(args, str):
            try:
                args = json.loads(args)
            except ValueError:
                args = None
        return "ok", {"name": fn.get("name"), "arguments": args, "n_calls": 1}, "tool_calls"
    obj = _first_json_object(message.get("content", ""))
    if obj is not None:  # one attempt, parsed from content
        name = obj.get("name")
        args = obj.get("arguments", obj.get("parameters"))
        if isinstance(args, str):
            try:
                args = json.loads(args)
            except ValueError:
                args = None
        return "ok", {"name": name, "arguments": args, "n_calls": 1}, "content_json"
    return "unparsed", None, None


def _coerce(v, typ):
    t = _TYPE_MAP.get(typ, typ)
    if t == "integer":
        if isinstance(v, bool):
            return v
        if isinstance(v, (int, float)) and float(v).is_integer():
            return int(v)
        if isinstance(v, str):
            try:
                f = float(v)
                return int(f) if f.is_integer() else v
            except ValueError:
                return v
    if t == "number":
        if isinstance(v, bool):
            return v
        if isinstance(v, (int, float)):
            return float(v)
        if isinstance(v, str):
            try:
                return float(v)
            except ValueError:
                return v
    if t == "boolean" and isinstance(v, str) and v.lower() in ("true", "false"):
        return v.lower() == "true"
    return v


def _value_match(v, gold, schema) -> bool:
    typ = (schema or {}).get("type")
    t = _TYPE_MAP.get(typ, typ)
    if t == "array" or isinstance(gold, list):
        if not isinstance(v, list) or not isinstance(gold, list) or len(v) != len(gold):
            return False
        item_schema = (schema or {}).get("items", {})
        unordered = bool((schema or {}).get("unordered"))
        if unordered:
            rest = list(gold)
            for x in v:
                hit = next((i for i, g in enumerate(rest) if _value_match(x, g, item_schema)), None)
                if hit is None:
                    return False
                rest.pop(hit)
            return True
        return all(_value_match(x, g, item_schema) for x, g in zip(v, gold))
    if t == "object" or isinstance(gold, dict):
        if not isinstance(v, dict) or not isinstance(gold, dict):
            return False
        props = (schema or {}).get("properties", {})
        for k, gv in gold.items():  # nested gold: {key: [acceptable...]}
            acc = gv if isinstance(gv, list) else [gv]
            if k not in v:
                if "" in acc:
                    continue
                return False
            if not any(_value_match(v[k], a, props.get(k, {})) for a in acc if a != ""):
                return False
        return all(k in gold for k in v)
    cv, cg = _coerce(v, typ), _coerce(gold, typ)
    if isinstance(cv, str) or isinstance(cg, str):
        return isinstance(cv, str) and isinstance(cg, str) and cv == cg  # case-sensitive
    if isinstance(cv, bool) or isinstance(cg, bool):
        return type(cv) is type(cg) and cv == cg
    if isinstance(cv, (int, float)) and isinstance(cg, (int, float)):
        return float(cv) == float(cg)
    return cv == cg


def grade_bfcl(call: dict, functions: list[dict], gold: dict) -> tuple[bool, str]:
    """AST rules. gold = {"ground_truth": [{fname: {param: [acceptable values; "" = may omit]}}]}"""
    if call.get("n_calls") != 1:
        return False, "not_exactly_one_call"
    (gname, gparams), = gold["ground_truth"][0].items()
    if call.get("name") != gname:
        return False, "wrong_function"
    args = call.get("arguments")
    if not isinstance(args, dict):
        return False, "args_not_object"
    fdef = next(f for f in functions if f["name"] == gname)
    params = fdef.get("parameters", {})
    props = params.get("properties", {})
    for r in params.get("required", []):
        if r not in args:
            return False, f"missing_required:{r}"
    for k in args:
        if k not in gparams:
            return False, f"unexpected_arg:{k}"
    for k, acc in gparams.items():
        if k not in args:
            if "" in acc:
                continue
            return False, f"missing_arg:{k}"
        if not any(_value_match(args[k], a, props.get(k, {})) for a in acc if a != ""):
            return False, f"value_mismatch:{k}"
    return True, "match"


# ---------------------------------------------------------------- ollama


class NotApplicable(Exception):
    pass


def ollama_chat(url: str, body: dict):
    req = urllib.request.Request(url.rstrip("/") + "/api/chat", data=json.dumps(body).encode(), headers={"content-type": "application/json"})
    try:
        with urllib.request.urlopen(req, timeout=TIMEOUT_S) as r:
            raw = r.read().decode("utf-8")
        return raw, json.loads(raw)
    except urllib.error.HTTPError as e:
        msg = e.read().decode("utf-8", "replace")
        if "does not support tools" in msg:
            raise NotApplicable(msg)
        return None, {"_transport_error": f"HTTP {e.code}: {msg[:300]}"}
    except Exception as e:  # noqa: BLE001 -- transport failures are recorded, excluded from the denominator
        return None, {"_transport_error": repr(e)[:300]}


def model_digest(manifest: Path) -> str:
    return "sha256:" + sha256_file(manifest)


# ---------------------------------------------------------------- gate


def gate(rows: list[dict], score):
    n = CELL_N
    unp = sum(r["parse_status"] == "unparsed" for r in rows)
    trn = sum(r["parse_status"] == "truncated" for r in rows)
    tra = sum(r["parse_status"] == "transport" for r in rows) + (n - len(rows))
    valid = sum(r["parse_status"] == "ok" for r in rows)
    if tra / n > 0.05:
        return "UNMEASURED_incomplete_run_TRANSPORT"
    if (unp + trn) / n > 0.10:
        return "NO_RESULT_UNPARSED_GT_10PCT"
    if valid < 30:
        return "UNMEASURED_n_lt_30"
    if score in (0.0, 1.0):
        return "HOLD_FOR_REVIEW"
    return "CARD_CANDIDATE_UNSIGNED"


# ---------------------------------------------------------------- run


def run(a) -> dict:
    if urllib.parse.urlparse(a.ollama_url).hostname not in LOOPBACK:
        raise Refuse("REFUSE: Ollama URL must be loopback")
    if os.environ.get("OLLAMA_NUM_PARALLEL", os.environ.get("GSPC_NUM_PARALLEL", "1")) != "1":
        raise Refuse("REFUSE: NUM_PARALLEL must be 1")
    if a.duplicate_of and a.run_of_record:
        raise Refuse("REFUSE: a duplicate_of run cannot be run_of_record")
    bank = Path(a.bank)
    bsha = sha256_file(bank)
    if bsha != a.expected_bank_sha256:
        raise Refuse(f"REFUSE: bank sha mismatch {bsha} != {a.expected_bank_sha256}")
    gold = None
    gsha = None
    if not a.gold or not a.expected_gold_sha256:
        raise Refuse("REFUSE: --gold and --expected-gold-sha256 are required (recorded on every row)")
    gsha = sha256_file(Path(a.gold))
    if gsha != a.expected_gold_sha256:
        raise Refuse(f"REFUSE: gold sha mismatch {gsha}")
    if a.cell == "bfcl-30":
        gold = {r["id"]: r for r in (json.loads(l) for l in Path(a.gold).read_text().splitlines() if l.strip())}
    mf = Path(a.model_manifest)
    dg = model_digest(mf)
    if dg != a.expected_model_digest:
        raise Refuse(f"REFUSE: model digest mismatch {dg} != {a.expected_model_digest}")
    items = load_cell_items(bank, a.cell)
    if a.limit:  # dry run only: never a run of record
        if a.run_of_record:
            raise Refuse("REFUSE: --limit (dry run) cannot be run_of_record")
        items = items[: a.limit]
    msha = method_sha256()
    run_id = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%S.%fZ") + "-" + uuid.uuid4().hex[:10]
    out = Path(a.output_dir) / run_id
    out.mkdir(parents=True, exist_ok=False)
    common = {"method_sha256": msha, "bank_sha256": bsha, "gold_sha256": a.expected_gold_sha256, "model_digest": dg, "worker_version": WORKER_VERSION,
              "bfcl_upstream_commit": BFCL_UPSTREAM["commit"], "bfcl_upstream_licence": BFCL_UPSTREAM["licence"]}
    rows, na = [], None
    opts = {"temperature": 0, "seed": 0}
    with open(out / "items.jsonl", "w") as f:
        for it in items:  # serial: one request in flight
            if a.cell == "gsm8k-30":
                body = {"model": a.model, "stream": False, "think": False,
                        "messages": [{"role": "user", "content": f"{it['question']}\n{GSM8K_SUFFIX}"}],
                        "options": {**opts, "num_predict": GSM8K_MAX_TOKENS}}
            else:
                msgs = [m for turn in it["question"] for m in turn]
                body = {"model": a.model, "stream": False, "think": False, "messages": msgs, "tools": bfcl_tools(it["function"]),
                        "options": {**opts, "num_predict": BFCL_MAX_TOKENS}}
            t0 = time.time()
            try:
                raw, resp = ollama_chat(a.ollama_url, body)
            except NotApplicable as e:
                na = str(e)[:300]
                break
            row = {"schema": ITEM_SCHEMA, "item_id": it["id"], "cell": a.cell, **common, "seconds": round(time.time() - t0, 2)}
            if raw is None:
                row.update(parse_status="transport", raw_response_sha256=None, transport_error=resp["_transport_error"], correct=None)
            else:
                msg, dr = resp.get("message", {}), resp.get("done_reason")
                row.update(raw_response_sha256=sha256_text(raw), done_reason=dr, content=msg.get("content", ""), tool_calls=msg.get("tool_calls"))
                if a.cell == "gsm8k-30":
                    ps, val, via = parse_gsm8k(msg.get("content", ""), dr)
                    row.update(parse_status=ps, parsed=str(val) if val is not None else None, parsed_via=via, gold=it["answer"],
                               correct=grade_gsm8k(val, it["answer"]) if ps == "ok" else None)
                else:
                    ps, call, src = extract_call(msg, dr)
                    row.update(parse_status=ps, parsed=call, parsed_from=src)
                    if ps == "ok":
                        ok, why = grade_bfcl(call, it["function"], gold[it["bfcl_id"]])
                        row.update(correct=ok, grade_reason=why)
                    else:
                        row.update(correct=None)
            rows.append(row)
            f.write(json.dumps(row, sort_keys=True) + "\n")
            f.flush()
    dg_after = model_digest(mf)
    run = {"schema": RUN_SCHEMA, "run_id": run_id, "cell": a.cell, "model": a.model, **common, "gold_sha256_checked": gsha,
           "bfcl_schema_mapping": BFCL_SCHEMA_MAPPING, "bfcl_upstream": BFCL_UPSTREAM, "gsm8k_parse_order": GSM8K_PARSE_ORDER,
           "model_digest_after": dg_after, "temperature": 0, "seed": 0, "num_parallel": 1, "serial": True,
           "max_tokens": GSM8K_MAX_TOKENS if a.cell == "gsm8k-30" else BFCL_MAX_TOKENS,
           "run_of_record": bool(a.run_of_record), "duplicate_of": a.duplicate_of, "dry_run": bool(a.limit),
           "score_scale": "fraction", "signed": False, "writes_board": False, "started_at": run_id[:16], "finished_at": now()}
    if na is not None:
        run.update(status="NOT_APPLICABLE", reason=na, score=None, gate="NOT_APPLICABLE")
    elif dg_after != dg:
        run.update(status="REFUSED_DIGEST_DRIFT", score=None, gate="UNMEASURED_digest_drift")
    else:
        valid = [r for r in rows if r["parse_status"] == "ok"]
        correct = sum(1 for r in valid if r["correct"])
        score = round(correct / len(valid), 4) if valid else None
        counts = {s: sum(r["parse_status"] == s for r in rows) for s in ("ok", "unparsed", "truncated", "transport")}
        run.update(status="COMPLETE", n_items=len(items), n_valid=len(valid), correct=correct, score=score, counts=counts,
                   gate=("DRY_RUN_NOT_GATED" if a.limit else gate(rows, score)))
    run["gate_eligible"] = bool(run["run_of_record"] and not run["duplicate_of"] and run["gate"] == "CARD_CANDIDATE_UNSIGNED")
    (out / "run.json").write_text(json.dumps(run, indent=1, sort_keys=True) + "\n")
    return run


def main(argv=None):
    p = argparse.ArgumentParser(description=WORKER_VERSION)
    p.add_argument("--cell", required=True, choices=sorted(SUB_BANKS))
    p.add_argument("--bank", required=True)
    p.add_argument("--expected-bank-sha256", required=True)
    p.add_argument("--gold")
    p.add_argument("--expected-gold-sha256")
    p.add_argument("--model", required=True)
    p.add_argument("--model-manifest", required=True)
    p.add_argument("--expected-model-digest", required=True)
    p.add_argument("--ollama-url", default="http://127.0.0.1:11434")
    p.add_argument("--output-dir", required=True)
    p.add_argument("--run-of-record", action="store_true")
    p.add_argument("--duplicate-of")
    p.add_argument("--limit", type=int, default=0, help="dry run only; never run_of_record")
    a = p.parse_args(argv)
    print(json.dumps(run(a), sort_keys=True))


import urllib.parse  # noqa: E402

if __name__ == "__main__":
    main()
