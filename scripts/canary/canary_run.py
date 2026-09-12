#!/usr/bin/env python3
"""SILENT-ROUTE CANARY (brief G3.6) — THIN harness.

Sends a fixed canary prompt set to major model endpoints, sha256-hashes the
exact output text per prompt, derives a daily digest per endpoint, and
appends one JSONL row per endpoint-day to the baseline.

Drift detection compares today's digest against the most recent prior
HASHED row for the same endpoint. On change it appends a THIN dry-run
record. Drift means exactly one thing: "the canary output hash changed."
Interpretation stays human. Nothing here is signed or published.

Stdlib only. Never raises on endpoint failure: unavailable credentials and
call errors are recorded, not thrown.
"""

import argparse
import hashlib
import json
import os
import sys
import time
import urllib.error
import urllib.request
from datetime import date, datetime, timezone

HERE = os.path.dirname(os.path.abspath(__file__))
CONFIG_PATH = os.path.join(HERE, "canary_config.json")
OUT_DIR = os.path.abspath(
    os.path.join(HERE, "..", "..", "public", "interop", "silent-route-canary-2026-09")
)
BASELINE_PATH = os.path.join(OUT_DIR, "baseline.jsonl")
DRIFT_PATH = os.path.join(OUT_DIR, "drift-dryrun.jsonl")

THIN = "THIN"
REQUEST_TIMEOUT_S = 45
PROBE_TIMEOUT_S = 2


def sha256_hex(text):
    return hashlib.sha256(text.encode("utf-8")).hexdigest()


def daily_digest(prompt_hashes):
    """sha256 of the sorted prompt-hash concatenation (hex, lexical, no sep)."""
    concat = "".join(sorted(prompt_hashes.values()))
    return sha256_hex(concat)


def load_config():
    with open(CONFIG_PATH, "r", encoding="utf-8") as f:
        cfg = json.load(f)
    if cfg.get("schema") != "csoai.silent-route-canary-config/0.1":
        raise ValueError("unexpected config schema: %r" % cfg.get("schema"))
    return cfg


def resolve_key(endpoint):
    """Return the API key value if present, else None. Never prints values."""
    for name in (endpoint.get("env_key"), endpoint.get("env_key_fallback")):
        if name and os.environ.get(name):
            return os.environ[name]
    return None


def http_json(url, payload=None, headers=None, timeout=REQUEST_TIMEOUT_S):
    req = urllib.request.Request(url)
    for k, v in (headers or {}).items():
        req.add_header(k, v)
    data = None
    if payload is not None:
        req.add_header("Content-Type", "application/json")
        data = json.dumps(payload).encode("utf-8")
    with urllib.request.urlopen(req, data=data, timeout=timeout) as resp:
        return json.loads(resp.read().decode("utf-8"))


def probe_up(url):
    try:
        with urllib.request.urlopen(url, timeout=PROBE_TIMEOUT_S) as resp:
            return 200 <= resp.status < 500
    except Exception:
        return False


def call_openai_chat(endpoint, key, prompt_text):
    url = endpoint["base_url"].rstrip("/") + "/chat/completions"
    payload = {
        "model": endpoint["model"],
        "messages": [{"role": "user", "content": prompt_text}],
        "temperature": 0,
        "max_tokens": 64,
    }
    headers = {"Authorization": "Bearer " + key}
    body = http_json(url, payload, headers)
    return body["choices"][0]["message"]["content"]


def call_anthropic(endpoint, key, prompt_text):
    url = endpoint["base_url"].rstrip("/") + "/v1/messages"
    payload = {
        "model": endpoint["model"],
        "max_tokens": 64,
        "temperature": 0,
        "messages": [{"role": "user", "content": prompt_text}],
    }
    headers = {
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
    }
    body = http_json(url, payload, headers)
    return "".join(
        block.get("text", "") for block in body.get("content", []) if block.get("type") == "text"
    )


def call_endpoint(endpoint, key, prompt_text):
    style = endpoint.get("style", "openai-chat")
    if style == "anthropic-messages":
        return call_anthropic(endpoint, key, prompt_text)
    return call_openai_chat(endpoint, key, prompt_text)


def run_endpoint(endpoint, prompts, today):
    """Return one baseline row for the endpoint. Never raises."""
    row = {
        "date": today,
        "endpoint_id": endpoint["id"],
        "model": endpoint.get("model"),
        "status": None,
        "prompt_hashes": {},
        "daily_digest": None,
        "latency_ms": None,
        "label": THIN,
    }

    key = resolve_key(endpoint)
    if endpoint.get("env_key") is None and endpoint.get("probe_first"):
        # Local endpoint with no credential concept: probe first.
        if not probe_up(endpoint["probe_first"]):
            row["status"] = "UNAVAILABLE"
            row["note"] = "local endpoint not answering at probe URL"
            return row
        key = "ollama"  # OpenAI-compatible shim ignores the bearer value.
    elif key is None:
        row["status"] = "UNAVAILABLE"
        row["note"] = "credential not present"
        return row

    t0 = time.monotonic()
    try:
        for p in prompts:
            text = call_endpoint(endpoint, key, p["text"])
            row["prompt_hashes"][p["id"]] = sha256_hex(text)
        row["daily_digest"] = daily_digest(row["prompt_hashes"])
        row["status"] = "HASHED"
    except Exception as exc:  # recorded, never raised
        row["status"] = "ERROR"
        row["note"] = "%s: %s" % (type(exc).__name__, str(exc)[:200])
    finally:
        row["latency_ms"] = int((time.monotonic() - t0) * 1000)
    return row


def append_jsonl(path, record):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "a", encoding="utf-8") as f:
        f.write(json.dumps(record, sort_keys=True) + "\n")


def read_jsonl(path):
    if not os.path.exists(path):
        return []
    rows = []
    with open(path, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if line:
                rows.append(json.loads(line))
    return rows


def most_recent_prior_hashed(rows, endpoint_id, today):
    prior = [
        r for r in rows
        if r.get("endpoint_id") == endpoint_id
        and r.get("status") == "HASHED"
        and r.get("date") != today
    ]
    if not prior:
        return None
    return max(prior, key=lambda r: r["date"])


def detect_drift(today_rows, today):
    """Compare each of today's HASHED rows to the most recent prior HASHED row."""
    all_rows = read_jsonl(BASELINE_PATH)
    fired = 0
    for row in today_rows:
        if row.get("status") != "HASHED":
            continue
        prev = most_recent_prior_hashed(all_rows, row["endpoint_id"], today)
        if prev is None:
            continue
        if prev.get("daily_digest") != row.get("daily_digest"):
            drift = {
                "detected_at": datetime.now(timezone.utc).isoformat(),
                "endpoint_id": row["endpoint_id"],
                "prev_date": prev["date"],
                "prev_digest": prev["daily_digest"],
                "new_digest": row["daily_digest"],
                "label": THIN,
                "note": "dry run — drift cards are not signed or published in v0",
            }
            append_jsonl(DRIFT_PATH, drift)
            fired += 1
            print("DRIFT (THIN dry-run): %s digest changed since %s"
                  % (row["endpoint_id"], prev["date"]))
    return fired


def dry_run():
    """No network. Synthesize two fake days for a fake endpoint; show drift fires."""
    fake_id = "dryrun-demo-endpoint"
    day1_hashes = {p: sha256_hex("day1-output-" + p) for p in ("a", "b", "c")}
    day2_hashes = dict(day1_hashes)
    day2_hashes["b"] = sha256_hex("day2-output-b-changed")
    d1, d2 = daily_digest(day1_hashes), daily_digest(day2_hashes)
    assert d1 != d2, "synthetic days must differ for the demo"
    drift = {
        "detected_at": datetime.now(timezone.utc).isoformat(),
        "endpoint_id": fake_id,
        "prev_date": "dryrun-day-1",
        "prev_digest": d1,
        "new_digest": d2,
        "label": THIN,
        "note": "dry run — drift cards are not signed or published in v0",
    }
    append_jsonl(DRIFT_PATH, drift)
    print("DRY RUN: drift detection fired for %s (prev %s… -> new %s…)"
          % (fake_id, d1[:12], d2[:12]))
    print("DRY RUN: record appended to %s" % os.path.relpath(DRIFT_PATH))
    return 0


def real_run():
    cfg = load_config()
    today = date.today().isoformat()
    prompts = cfg["prompts"]
    today_rows = []
    for endpoint in cfg["endpoints"]:
        row = run_endpoint(endpoint, prompts, today)
        append_jsonl(BASELINE_PATH, row)
        today_rows.append(row)
        extra = ""
        if row["status"] == "HASHED":
            extra = " digest=%s…" % row["daily_digest"][:12]
        elif row.get("note"):
            extra = " (%s)" % row["note"]
        print("%-14s %-11s%s" % (row["endpoint_id"], row["status"], extra))
    fired = detect_drift(today_rows, today)
    print("baseline rows written: %d -> %s" % (len(today_rows), os.path.relpath(BASELINE_PATH)))
    print("drift dry-run records fired today: %d" % fired)
    return 0


def main(argv=None):
    ap = argparse.ArgumentParser(description="silent-route canary (THIN)")
    ap.add_argument("--dry-run", action="store_true",
                    help="no network; synthesize two fake days to demonstrate drift firing")
    args = ap.parse_args(argv)
    if args.dry_run:
        return dry_run()
    return real_run()


if __name__ == "__main__":
    sys.exit(main())
