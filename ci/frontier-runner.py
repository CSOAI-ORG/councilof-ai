#!/usr/bin/env python3
"""GSPC continuous measurement engine - frontier runner.

Fetches the governance-lane gold bank from the public HF dataset
csoai/gspc-master, classifies items into EU AI Act risk tiers via
frontier provider APIs (credentials supplied through environment
variables), scores predictions against gold, and writes:

  rows.jsonl     one row per (model, item) measurement
  summary.json   per-model accuracy, Wilson CI, unparsed count, status

Stdlib only. Never prints credential values.

Provider status semantics:
  LIVE               - provider authenticated and returned measurements
  BLOCKED_CREDENTIAL - credential missing/invalid/unfunded (401/402/403),
                       or provider disabled mid-run by such a response
  UNREACHABLE        - network-level failure for every item

Partial results are honest results: a blocked provider never aborts the run.
"""

import argparse
import datetime
import hashlib
import json
import math
import os
import re
import sys
import time
import urllib.error
import urllib.request

REPO_ID = "csoai/gspc-master"
LANE = "governance"
LABELS = ["PROHIBITED", "HIGH_RISK", "LIMITED_RISK", "MINIMAL_RISK"]
Z95 = 1.959963984540054
UA = "gspc-continuous-engine/1.0 (CSOAI-ORG/gspc-board)"

PROMPT_TEMPLATE = (
    "Classify the AI system described below into exactly one EU AI Act risk tier.\n"
    "Allowed labels: PROHIBITED, HIGH_RISK, LIMITED_RISK, MINIMAL_RISK.\n"
    "Reply with the label and nothing else.\n"
    "\n"
    "Scenario: {scenario}"
)

THINK_RE = re.compile(r"<think>.*?</think>", re.S)

# Bank source, tried in order. per-item-rows/ is the canonical per-lane
# directory; fleets/gov-*.rows.jsonl is the per-lane governance fallback.
BANK_LISTING_URLS = [
    "https://huggingface.co/api/datasets/%s/tree/main/per-item-rows" % REPO_ID,
    "https://huggingface.co/api/datasets/%s/tree/main/fleets" % REPO_ID,
]
BANK_RAW_URL = "https://huggingface.co/datasets/%s/resolve/main/{path}" % REPO_ID


def utc_now_stamp():
    now = datetime.datetime.now(datetime.timezone.utc)
    return now.strftime("%Y-%m-%dT%H-%M-%S-") + "%03dZ" % (now.microsecond // 1000)


def http_get(url, timeout=60):
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        return resp.read()


def fetch_bank():
    """Return the unique (scenario, gold) pairs of the governance lane.

    Derives pairs the same way the estate does: scan the per-lane rows,
    deduplicate on (scenario, expected).
    """
    pairs = {}
    source = None
    for listing_url in BANK_LISTING_URLS:
        try:
            listing = json.loads(http_get(listing_url).decode("utf-8"))
        except (urllib.error.URLError, ValueError):
            continue
        files = [
            e["path"]
            for e in listing
            if e.get("type") == "file"
            and e["path"].endswith(".jsonl")
            and "gov" in os.path.basename(e["path"]).lower()
        ]
        if not files:
            continue
        for path in sorted(files):
            raw = http_get(BANK_RAW_URL.format(path=path)).decode("utf-8")
            for line in raw.splitlines():
                line = line.strip()
                if not line:
                    continue
                try:
                    row = json.loads(line)
                except ValueError:
                    continue
                scenario = row.get("item") or row.get("scenario")
                gold = row.get("expected") or row.get("gold")
                if not scenario or gold not in LABELS:
                    continue
                key = (scenario, gold)
                if key in pairs:
                    if pairs[key] != key:  # pragma: no cover - gold conflict
                        continue
                pairs[key] = key
        if pairs:
            source = listing_url.rsplit("/", 1)[-1]
            break
    if not pairs:
        raise SystemExit("could not fetch governance bank from %s" % REPO_ID)
    bank = sorted(pairs.keys(), key=lambda p: (p[1], p[0]))  # stable order
    return bank, source


def build_panel(bank, limit, offset):
    """Round-robin interleave by gold tier so every pulse is tier-balanced."""
    by_gold = {g: [] for g in LABELS}
    for pair in bank:
        by_gold[pair[1]].append(pair)
    order = []
    i = 0
    while len(order) < len(bank):
        for g in LABELS:
            if i < len(by_gold[g]):
                order.append(by_gold[g][i])
        i += 1
    if offset:
        order = order[offset % len(order):] + order[: offset % len(order)]
    if limit and limit > 0:
        order = order[:limit]
    return order


def parse_label(text):
    """Strip <think> blocks, uppercase, dashes->underscores,
    last-occurrence-wins over the 4 labels. No match -> UNPARSED."""
    if not text:
        return "UNPARSED"
    t = THINK_RE.sub(" ", text)
    t = t.upper().replace("-", "_")
    best, best_idx = None, -1
    for label in LABELS:
        idx = t.rfind(label)
        if idx > best_idx:
            best, best_idx = label, idx
    return best if best is not None else "UNPARSED"


class BlockedCredential(Exception):
    pass


class Unreachable(Exception):
    pass


def post_json(url, payload, headers, timeout=90, retries=3):
    body = json.dumps(payload).encode("utf-8")
    last_err = None
    for attempt in range(retries):
        try:
            req = urllib.request.Request(
                url, data=body, method="POST",
                headers=dict(headers, **{"Content-Type": "application/json",
                                         "User-Agent": UA}),
            )
            with urllib.request.urlopen(req, timeout=timeout) as resp:
                return json.loads(resp.read().decode("utf-8"))
        except urllib.error.HTTPError as e:
            detail = ""
            try:
                detail = e.read().decode("utf-8", "replace")[:200]
            except Exception:
                pass
            if e.code in (401, 402, 403):
                raise BlockedCredential("HTTP %d" % e.code)
            if e.code == 400 and "api key" in detail.lower():
                raise BlockedCredential("HTTP 400 invalid key")
            if e.code in (429, 500, 502, 503, 504) and attempt < retries - 1:
                last_err = "HTTP %d" % e.code
                time.sleep(2 * (attempt + 1))
                continue
            raise Unreachable("HTTP %d %s" % (e.code, detail))
        except (urllib.error.URLError, TimeoutError, OSError) as e:
            last_err = str(e)[:120]
            if attempt < retries - 1:
                time.sleep(2 * (attempt + 1))
                continue
            raise Unreachable(last_err or "network error")
    raise Unreachable(last_err or "network error")


def classify(model, scenario, cred):
    prompt = PROMPT_TEMPLATE.format(scenario=scenario)
    if model == "deepseek":
        data = post_json(
            "https://api.deepseek.com/chat/completions",
            {"model": "deepseek-chat",
             "messages": [{"role": "user", "content": prompt}],
             "temperature": 0, "max_tokens": 24},
            {"Authorization": "Bearer " + cred},
        )
        return data["choices"][0]["message"]["content"]
    if model == "grok":
        data = post_json(
            "https://api.x.ai/v1/chat/completions",
            {"model": "grok-3-mini",
             "messages": [{"role": "user", "content": prompt}],
             "temperature": 0, "max_tokens": 24},
            {"Authorization": "Bearer " + cred},
        )
        return data["choices"][0]["message"]["content"]
    if model == "gemini":
        data = post_json(
            "https://generativelanguage.googleapis.com/v1beta/models/"
            "gemini-2.0-flash:generateContent?key=" + cred,
            {"contents": [{"parts": [{"text": prompt}]}]},
            {},
        )
        cands = data.get("candidates") or []
        if not cands:
            raise Unreachable("no candidates in response")
        parts = (cands[0].get("content") or {}).get("parts") or []
        return "".join(p.get("text", "") for p in parts)
    raise SystemExit("unknown model %s" % model)


PROVIDERS = {
    "deepseek": "DEEPSEEK_API_KEY",
    "gemini": "GEMINI_TOKEN",
    "grok": "GROK_TOKEN",
}


def wilson(k, n):
    if n == 0:
        return None
    p = k / n
    denom = 1 + Z95 * Z95 / n
    centre = p + Z95 * Z95 / (2 * n)
    margin = Z95 * math.sqrt(p * (1 - p) / n + Z95 * Z95 / (4 * n * n))
    return {
        "point": round(p, 4),
        "low": round(max(0.0, (centre - margin) / denom), 4),
        "high": round(min(1.0, (centre + margin) / denom), 4),
    }


def main():
    ap = argparse.ArgumentParser(description="GSPC frontier pulse runner")
    ap.add_argument("--limit", type=int, default=30,
                    help="items per pulse (0 = full bank)")
    ap.add_argument("--offset", type=int, default=0,
                    help="rotational offset into the tier-balanced panel")
    ap.add_argument("--out-dir", default="out")
    ap.add_argument("--run-id", default=None)
    args = ap.parse_args()

    run_id = args.run_id or utc_now_stamp()
    started = utc_now_stamp()

    bank, source = fetch_bank()
    panel = build_panel(bank, args.limit, args.offset)
    bank_digest = hashlib.sha256(
        ("\n".join("%s\t%s" % p for p in bank)).encode("utf-8")).hexdigest()[:16]
    print("[bank] %d unique scenario+gold pairs (lane=%s, source=%s, digest=%s)"
          % (len(bank), LANE, source, bank_digest), flush=True)
    print("[panel] %d items this pulse (offset=%d)" % (len(panel), args.offset),
          flush=True)

    os.makedirs(args.out_dir, exist_ok=True)
    rows_path = os.path.join(args.out_dir, "rows.jsonl")
    summary_path = os.path.join(args.out_dir, "summary.json")

    providers_summary = {}
    with open(rows_path, "w", encoding="utf-8") as rows_f:
        for model, env_name in PROVIDERS.items():
            cred = os.environ.get(env_name, "").strip()
            if not cred:
                providers_summary[model] = {
                    "status": "BLOCKED_CREDENTIAL",
                    "reason": "%s not set" % env_name,
                    "n": 0, "correct": 0, "unparsed": 0, "accuracy": None,
                    "wilson95": None,
                }
                print("[model:%s] BLOCKED_CREDENTIAL (%s not set)"
                      % (model, env_name), flush=True)
                continue

            n = correct = unparsed = transport_errors = 0
            blocked_reason = None
            unreachable_all = False
            for i, (scenario, gold) in enumerate(panel):
                if blocked_reason:
                    break
                raw = None
                err = None
                try:
                    raw = classify(model, scenario, cred)
                except BlockedCredential as e:
                    blocked_reason = str(e)
                    break
                except Unreachable as e:
                    err = str(e)
                    transport_errors += 1
                n += 1
                prediction = parse_label(raw) if raw is not None else "UNPARSED"
                if prediction == "UNPARSED":
                    unparsed += 1
                is_correct = prediction == gold
                correct += int(is_correct)
                rows_f.write(json.dumps({
                    "run_id": run_id, "lane": LANE, "model": model,
                    "scenario": scenario, "gold": gold,
                    "raw": (raw or "")[:300], "prediction": prediction,
                    "correct": is_correct, "transport_error": err,
                }, ensure_ascii=False) + "\n")
                rows_f.flush()
                if (i + 1) % 10 == 0:
                    print("[model:%s] %d/%d measured" % (model, i + 1, len(panel)),
                          flush=True)

            if blocked_reason:
                status = "BLOCKED_CREDENTIAL"
                reason = blocked_reason
            elif n and transport_errors == n:
                status = "UNREACHABLE"
                reason = "all items failed transport"
            else:
                status = "LIVE"
                reason = None
            providers_summary[model] = {
                "status": status,
                "reason": reason,
                "n": n, "correct": correct, "unparsed": unparsed,
                "transport_errors": transport_errors,
                "accuracy": round(correct / n, 4) if n else None,
                "wilson95": wilson(correct, n),
            }
            print("[model:%s] %s n=%d acc=%s unparsed=%d"
                  % (model, status, n,
                     providers_summary[model]["accuracy"], unparsed), flush=True)

    summary = {
        "run_id": run_id,
        "engine": "gspc-continuous",
        "lane": LANE,
        "repo": "CSOAI-ORG/gspc-board",
        "bank": {
            "dataset": REPO_ID,
            "source_dir": source,
            "unique_pairs": len(bank),
            "sha256_16": bank_digest,
        },
        "panel": {"limit": args.limit, "offset": args.offset, "n": len(panel)},
        "started_at": started,
        "finished_at": utc_now_stamp(),
        "providers": providers_summary,
        "live_providers": sorted(
            m for m, s in providers_summary.items() if s["status"] == "LIVE"),
    }
    with open(summary_path, "w", encoding="utf-8") as f:
        json.dump(summary, f, indent=2)
    print("[done] summary -> %s" % summary_path, flush=True)

    live = summary["live_providers"]
    if not live:
        print("WARNING: no provider authenticated LIVE; pulse is structural only",
              flush=True)
    return 0


if __name__ == "__main__":
    sys.exit(main())
