#!/usr/bin/env python3
"""DeepSeek model-identity probe — a receipt of what the API says it served, when.

Why: on 2026-09-14 04:00 UTC DeepSeek reroutes V4-Pro API traffic to V4.1-Flash. Every
longitudinal evaluation that calls "the same model" across that hour silently changes model.
This probe records, at each run: the model id requested, the model id the API reports back,
its system_fingerprint, usage, and the sha256 of a fixed prompt's answer — so the drift is a
measured fact with timestamps, not an allegation.

It is a receipt, not a measurement of quality. It never grades, never ranks, never says which
model is better. State is one of:
  RESPONDED        the API answered; identity fields recorded
  REFUSED_BALANCE  the API refused for balance — recorded, nothing inferred
  UNREACHABLE      network/API error — recorded, nothing inferred

Usage: DEEPSEEK_API_KEY=… python3 scripts/probes/deepseek-identity-probe.py [--out DIR]
Writes DIR/deepseek-identity-<UTC>.json (default public/interop/deepseek-identity/).
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

API = "https://api.deepseek.com"
UA = "csoai-identity-probe/0.1 (+https://councilof.ai; nicholas@csoai.org)"
# Fixed, low-entropy prompt: the answer's bytes change only if the model behind the id changes
# (or sampling does; temperature 0 and a short deterministic task keep that small).
PROMPT = "List the first five prime numbers separated by commas, then the word END."
REQUESTED = ["deepseek-v4-pro", "deepseek-flash", "deepseek-chat", "deepseek-reasoner"]


def call(path: str, body: dict | None, key: str) -> tuple[int, dict]:
    req = urllib.request.Request(
        API + path,
        data=json.dumps(body).encode() if body is not None else None,
        headers={"Authorization": f"Bearer {key}", "content-type": "application/json", "user-agent": UA},
        method="POST" if body is not None else "GET",
    )
    try:
        with urllib.request.urlopen(req, timeout=60) as r:
            return r.status, json.loads(r.read().decode())
    except urllib.error.HTTPError as e:
        try:
            return e.code, json.loads(e.read().decode())
        except Exception:  # noqa: BLE001
            return e.code, {"error": {"message": str(e)}}
    except Exception as e:  # noqa: BLE001
        return 0, {"error": {"message": str(e)}}


def main() -> int:
    key = os.environ.get("DEEPSEEK_API_KEY", "")
    if not key:
        print("DEEPSEEK_API_KEY missing", file=sys.stderr)
        return 2
    out_dir = Path(sys.argv[sys.argv.index("--out") + 1]) if "--out" in sys.argv else Path("public/interop/deepseek-identity")
    out_dir.mkdir(parents=True, exist_ok=True)
    now = datetime.now(timezone.utc).replace(microsecond=0)
    doc: dict = {
        "schema": "csoai.model-identity-probe/0.1",
        "provider": "deepseek",
        "probed_at": now.isoformat().replace("+00:00", "Z"),
        "event_under_observation": "DeepSeek: V4-Pro API traffic rerouted to V4.1-Flash from 2026-09-14T04:00:00Z (provider announcement)",
        "attests": "what the API reported it served for each requested model id at probed_at — a receipt, not a grade, not a ranking, not a quality claim",
        "prompt_sha256": hashlib.sha256(PROMPT.encode()).hexdigest(),
        "models_listed": None,
        "probes": [],
    }
    status, models = call("/models", None, key)
    doc["models_listed"] = {"http": status, "ids": [m.get("id") for m in models.get("data", [])] if isinstance(models, dict) else None}
    for rid in REQUESTED:
        t0 = time.time()
        status, resp = call("/chat/completions", {"model": rid, "messages": [{"role": "user", "content": PROMPT}], "max_tokens": 32, "temperature": 0}, key)
        rec: dict = {"requested_model": rid, "http": status, "latency_ms": int((time.time() - t0) * 1000)}
        err = (resp.get("error") or {}) if isinstance(resp, dict) else {}
        if status == 200 and resp.get("choices"):
            text = (resp["choices"][0].get("message") or {}).get("content") or ""
            rec.update({
                "state": "RESPONDED",
                "reported_model": resp.get("model"),
                "system_fingerprint": resp.get("system_fingerprint"),
                "usage": resp.get("usage"),
                "answer_sha256": hashlib.sha256(text.encode()).hexdigest(),
                "answer_chars": len(text),
                "identity_matches_request": (resp.get("model") == rid) if resp.get("model") else None,
            })
        elif "balance" in json.dumps(err).lower():
            rec.update({"state": "REFUSED_BALANCE", "error": err.get("message")})
        else:
            rec.update({"state": "UNREACHABLE", "error": err.get("message") or f"http {status}"})
        doc["probes"].append(rec)
    fn = out_dir / f"deepseek-identity-{now.strftime('%Y%m%dT%H%M%SZ')}.json"
    fn.write_text(json.dumps(doc, indent=2) + "\n")
    print(f"wrote {fn}")
    for p in doc["probes"]:
        print(f"  {p['requested_model']:<18} {p['state']:<16} reported={p.get('reported_model')} fp={p.get('system_fingerprint')} sha={str(p.get('answer_sha256'))[:12]}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
