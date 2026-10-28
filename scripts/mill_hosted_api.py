#!/usr/bin/env python3
"""Hosted-api lane mill: one row per model:provider pair from HOSTED-API.lock.

Full frozen governance bank (sha-checked), T=0, serial, pinned provider
("slug:provider"). Every call is metered by hf_spend_ledger (unknown price ->
not sent; shard budget -> stop). Gate (Measure ruling, same as G2):
  n_valid >= 30, (unparsed + truncated) / n <= 10%, transport / n <= 5%,
  full bank answered at T=0. A pair stopped by budget is INCOMPLETE, not graded.
Label: hosted-api, unsigned, not comparable. Never a board write.
"""
from __future__ import annotations

import hashlib
import json
import os
import sys
import time
import urllib.error
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import hf_spend_ledger as L  # noqa: E402
from build_hosted_api_lock import L_INSTR as INSTR, MAX_TOKENS, LANE  # noqa: E402

ROUTER = "https://router.huggingface.co/v1/chat/completions"
TOKENS = ("PROHIBITED", "HIGH_RISK", "LIMITED_RISK", "MINIMAL_RISK")


def parse_token(text: str) -> str | None:
    up = text.upper().replace("-", "_").replace(" ", "_")
    hits = [t for t in TOKENS if t in up]
    return hits[0] if len(hits) == 1 else None


def call(tok: str, meter: L.ShardMeter, name: str, prompt: str) -> dict:
    price, why = meter.pre(name, prompt, MAX_TOKENS)
    if price is None:
        return {"call": why}
    body = json.dumps({"model": name, "messages": [{"role": "user", "content": prompt}],
                       "max_tokens": MAX_TOKENS, "temperature": 0}).encode()
    req = urllib.request.Request(ROUTER, data=body, method="POST", headers={
        "Authorization": f"Bearer {tok}", "Content-Type": "application/json",
        "User-Agent": "csoai-hosted-api-mill", "X-HF-Bill-To": os.environ.get("HF_BILL_TO", "csoai")})
    try:
        with urllib.request.urlopen(req, timeout=60) as r:
            raw = r.read()
        d, _ = json.JSONDecoder().raw_decode(raw.decode("utf-8", "replace").lstrip())
    except urllib.error.HTTPError as e:
        return {"call": "TRANSPORT", "raw": f"HTTP {e.code} {e.read()[:160].decode('utf-8', 'replace')}"}
    except Exception as e:
        meter.post(price, prompt, MAX_TOKENS, None)  # may still bill
        return {"call": "TRANSPORT", "raw": type(e).__name__}
    meter.post(price, prompt, MAX_TOKENS, d.get("usage"))
    ch = (d.get("choices") or [{}])[0]
    txt = ((ch.get("message") or {}).get("content") or "").strip()
    return {"call": "OK", "raw": txt[:80], "finish": ch.get("finish_reason")}


def grade(answers: list[dict], bank: list[dict]) -> dict:
    n = len(bank)
    transport = sum(1 for a in answers if a["call"] == "TRANSPORT")
    ok = [(a, b) for a, b in zip(answers, bank) if a["call"] == "OK"]
    preds = [(parse_token(a["raw"]), a, b) for a, b in ok]
    valid = [(p, b) for p, a, b in preds if p]
    truncated = sum(1 for p, a, _ in preds if not p and a.get("finish") == "length")
    unparsed = sum(1 for p, a, _ in preds if not p and a.get("finish") != "length")
    hits = sum(1 for p, b in valid if p == b["expected"])
    complete = len(answers) == n and all(a["call"] in ("OK", "TRANSPORT") for a in answers)
    g = {"n": n, "n_answered": len(answers), "n_valid": len(valid), "hits": hits,
         "unparsed": unparsed, "truncated": truncated, "transport": transport}
    if not complete:
        g["status"] = "INCOMPLETE"
        g["gate"] = "not graded: bank not fully answered (budget stop or unknown price)"
        return g
    fails = []
    if len(valid) < 30:
        fails.append("n_valid<30")
    if (unparsed + truncated) / n > 0.10:
        fails.append("unparsed+truncated>10%")
    if transport / n > 0.05:
        fails.append("transport>5%")
    g["status"] = "hosted-api-gate-fail" if fails else "hosted-api-pass"
    g["gate_fails"] = fails
    if not fails:
        g["accuracy"] = round(hits / len(valid), 4)
    return g


def main() -> int:
    root = Path(__file__).resolve().parent.parent
    lock = json.loads((root / "measurement/hosted-api/HOSTED-API.lock.json").read_text())
    bank_bytes = (root / lock["bank"]["path"]).read_bytes()
    if hashlib.sha256(bank_bytes).hexdigest() != lock["bank"]["sha256"]:
        print("BANK_SHA_MISMATCH refusing"); return 2
    bank = [json.loads(x) for x in bank_bytes.decode().splitlines() if x.strip()]
    tok = (os.environ.get("HF_INFERENCE_TOKEN") or "").strip()
    budget = os.environ.get("MILL_SHARD_BUDGET_USD")
    shard, shards = int(os.environ.get("MILL_SHARD", "0")), int(os.environ.get("MILL_SHARDS", "1"))
    out = Path(os.environ.get("MILL_OUT", "mill-out")); out.mkdir(parents=True, exist_ok=True)
    spend_file = out / f"spend_s{shard}.json"
    if not tok or not budget:
        print("NO_BUDGET_OR_TOKEN no billed call"); return 0
    meter = L.ShardMeter(L.load_prices(), float(budget))
    spend_file.write_text(json.dumps(meter.to_json()) + "\n")
    done = set()
    dp = os.environ.get("HOSTED_DONE")
    if dp and Path(dp).exists():
        done = {k for k, v in json.loads(Path(dp).read_text()).get("rows", {}).items()
                if v.get("status") in ("hosted-api-pass", "hosted-api-gate-fail")}
    todo = [r for i, r in enumerate(lock["models"]) if i % shards == shard and r["pair"] not in done]
    todo = todo[: int(os.environ.get("MILL_LIMIT", "10"))]
    print(f"HOSTED shard={shard}/{shards} todo={len(todo)} done_before={len(done)} budget={budget}", flush=True)
    rows = []
    for r in todo:
        answers = []
        for item in bank:  # serial, full bank, T=0
            a = call(tok, meter, r["pair"], INSTR + item["text"])
            if a["call"] in ("PRICE_UNKNOWN", "BUDGET_STOP"):
                break
            answers.append(a)
            spend_file.write_text(json.dumps(meter.to_json()) + "\n")
            time.sleep(0.1)
        g = grade(answers, bank)
        row = {"pair": r["pair"], "slug": r["slug"], "provider": r["provider"], "lane": LANE,
               "label": LANE, "signed": False, "comparable": False, "axis": "governance",
               "bank_sha256": lock["bank"]["sha256"], "temperature": 0, **g,
               "as_of": datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")}
        rows.append(row)
        print(r["pair"], g["status"], g.get("accuracy"), g.get("gate_fails"), flush=True)
        if meter.stopped:
            print("BUDGET_STOP shard slice exhausted", flush=True)
            break
    spend_file.write_text(json.dumps(meter.to_json()) + "\n")
    (out / f"hosted_s{shard}.json").write_text(json.dumps({
        "kind": "csoai.hosted-api-mill/0.1", "lane": LANE, "writes_board": False,
        "not_a_certification": True, "shard": shard, "rows": rows, "spend": meter.to_json()}, indent=2) + "\n")
    print("SPEND", json.dumps(meter.to_json()), flush=True)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
