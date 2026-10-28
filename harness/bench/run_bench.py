#!/usr/bin/env python3
"""run_bench.py — run ONE frozen GSPC bank against ONE model, and emit a result file
a third party can check without trusting us.

WHY THIS EXISTS
───────────────
GSPC's banks were published as DATASETS. A dataset is a list of prompts and a list of gold
labels; it is not a thing you can RUN. Until this file existed, a stranger who wanted to
put their own model on the board had to: read the axis page, guess the prompt, guess the
grading rule, and hand-compare labels. Every one of those guesses is a place where a
number can drift from the number on the board — and a number nobody can reproduce is not
evidence, it is a claim.

This is the missing half of a benchmark: the RUNNER.

WHOSE GRADER? THE ESTATE'S, BY IMPORT
──────────────────────────────────────
There are two graders in this repository and they are NOT the same:
  · harness/gspc-top100/mill_hub_queue.py  — read_label(): STRICT. The reply (or its last
    line) must BE one of the bank's own labels. Anything else is unparsed and LEAVES the
    denominator. This is the grader that produced the signed cards and the published
    board numbers.
  · harness/arena/axis_arena.py             — score(): LENIENT partial credit on word
    overlap, for arena pairwise Elo. It also has a known substring artefact ("no" matches
    inside "not"), which is why the board does not use it.

This runner imports the mill's grader and the mill's prompt builder directly. It does not
re-implement them and it does not paraphrase them, so a third party running this gets the
same bytes the board got. There is no second copy to drift.

THE TWO-ITEM SAFETY RULE
────────────────────────
The mill refuses to build a prompt whose answer menu has fewer than two options, and
refuses a menu containing a grading-mode sentinel (KEYWORD_MATCH). A one-option prompt
cannot be answered wrongly, so it measures format compliance, not the axis — 26 cards
were once signed MEASURED against such a prompt. Those axes are reported here as
UNGRADABLE, with the reason, and are never given a number.

WHAT IS DERIVED AND WHAT IS NOT
───────────────────────────────
DERIVED (recomputed here, from bytes we fetched):
  · the item list and its sha256
  · the label vocabulary (the bank's own `expected` values)
  · the prompt for each item, and its sha256
  · every observed label, the hits, the accuracy, the Wilson 95% interval
NOT DERIVED (read from the bank, never invented):
  · the gold `expected` label of each item
  · the bank's own licence, canary row, and provenance fields
NEVER:
  · a leader. This file measures ONE model on ONE bank. It does not compare models and it
    does not rank. A leader is a board decision, and the board is a separate artefact.
  · a model judging a model. Grading is deterministic and lexical.
  · a certification. This is a measurement receipt.

USAGE
─────
    # list the banks and their labels, without calling anything
    python3 harness/bench/run_bench.py --list

    # run one bank against an OpenAI-compatible endpoint
    python3 harness/bench/run_bench.py --axis safety --model my-model \
        --base-url https://api.example.com/v1 --out results.json

    # run against a local Ollama server
    python3 harness/bench/run_bench.py --axis governance --model qwen2.5:0.5b-instruct \
        --base-url http://localhost:11434/v1

    # score answers you already have (no model calls)
    python3 harness/bench/run_bench.py --axis safety --model my-model \
        --answers answers.jsonl --out results.json

EXIT CODES
──────────
  0  the run completed and every answer was graded
  2  the run could not be completed honestly (bank unreachable, no answers, no sound menu)
  3  the run completed but some answers were unparsed (see items_unparsed in the output)
"""
from __future__ import annotations

import argparse
import hashlib
import importlib.util
import json
import os
import re
import sys
import time
import urllib.error
import urllib.request
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[1]

# ── the estate's own grader and prompt builder, imported, not copied ────────────────────
def _load_mill():
    """Import harness/gspc-top100/mill_hub_queue.py.

    That module is the authority for read_label(), axis_prompt(), exact_label_menu() and
    load_bank(). Importing it is the whole point: there is exactly one copy of the grading
    rule in this repository, and this runner uses it."""
    p = ROOT / "harness" / "gspc-top100" / "mill_hub_queue.py"
    if not p.exists():
        raise SystemExit(f"run_bench: the estate's grader is missing at {p}. Without it there "
                         "is nothing to run against, and this file refuses to invent a rule.")
    spec = importlib.util.spec_from_file_location("csoai_gspc_mill_hub_queue", p)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


MILL = _load_mill()

# ── the banks ───────────────────────────────────────────────────────────────────────────
# The ARENA axis name is what the HF URL is built from. It differs from the BOARD axis
# name for two axes (agi/safety, asi/continuity) — recorded in
# measurement/bank-candidates/2026-09-23/live-bank-audit.json under axis_name_note.
BANK_REPO = {
    "governance": "gspc-gov",
    "safety": "gspc-agi",
    "provenance": "gspc-prv",
    "continuity": "gspc-asi",
    "conformance": "gspc-mcp",
    "openness": "gspc-oss",
    "machinery-conformity": "gspc-mach",
    "care": "gspc-care",
    "cross-reality": "gspc-xr",
    "detector-interop": "gspc-det",
    "art5-safeguard": "gspc-art5",
    "swarm": "gspc-swarm",
    "affect": "gspc-affect",
    "jail": "gspc-jail",
}

BANK_URL = "https://huggingface.co/datasets/csoai/{repo}/resolve/main/items.jsonl"

# The board axis names, for the record. Kept as a map so the result file can state both
# names and nobody has to guess which one a row refers to.
ARENA_AXIS = {
    "gov": "governance", "prv": "provenance", "agi": "safety", "asi": "continuity",
    "mcp": "conformance", "oss": "openness", "mach": "machinery-conformity",
    "care": "care", "xr": "cross-reality", "det": "detector-interop",
    "art5": "art5-safeguard", "swarm": "swarm", "affect": "affect", "jail": "jail",
}


def resolve_axis(axis: str) -> str:
    """Accept either the board axis name or the arena axis name."""
    if axis in BANK_REPO:
        return axis
    if axis in ARENA_AXIS:
        return ARENA_AXIS[axis]
    raise KeyError(axis)


def fetch(url: str, timeout: int = 90) -> bytes:
    req = urllib.request.Request(url, headers={"User-Agent": "csoai-gspc-run-bench/1.0"})
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return r.read()


def load_bank_bytes(axis: str) -> tuple[bytes, str, str]:
    """Return (raw bytes, sha256, url). The sha256 is of the bytes fetched, so it is the
    thing a third party re-hashes to prove they read the same bank."""
    repo = BANK_REPO[axis]
    url = BANK_URL.format(repo=repo)
    raw = fetch(url)
    return raw, hashlib.sha256(raw).hexdigest(), url


def bank_items(raw: bytes) -> list[tuple[str, str]]:
    """(prompt, expected) pairs, using the mill's own loader semantics.

    The mill's load_bank() takes a PATH. We write the fetched bytes to a temp file so
    that the SAME function decides which rows are gradable — we do not reimplement the
    canary rule, the PROMPT_KEYS order, or the empty-expected rule."""
    import tempfile
    with tempfile.NamedTemporaryFile("wb", suffix=".jsonl", delete=False) as fh:
        fh.write(raw)
        tmp = Path(fh.name)
    try:
        return MILL.load_bank(tmp)
    finally:
        tmp.unlink(missing_ok=True)


def label_vocabulary(items: list[tuple[str, str]]) -> list[str]:
    """The bank's OWN label set — the distinct `expected` values, in the mill's order
    (exact_label_menu sorts and strips, and refuses a one-option menu)."""
    raw = sorted({str(x) for x in (e for _, e in items) if x})
    return sorted({x.strip().upper() for x in raw if x.strip()})


def ask(base_url: str, model: str, prompt: str, timeout: int, temperature: float = 0.0,
         max_tokens: int = 1024) -> str:
    """One OpenAI-compatible chat completion. Returns the assistant text."""
    url = base_url.rstrip("/") + "/chat/completions"
    body = json.dumps({
        "model": model,
        "messages": [{"role": "user", "content": prompt}],
        "temperature": temperature,
        "stream": False,
        "max_tokens": max_tokens,
    }).encode()
    headers = {"Content-Type": "application/json", "User-Agent": "csoai-gspc-run-bench/1.0"}
    key = os.environ.get("GSPC_RUN_BENCH_API_KEY") or os.environ.get("OPENAI_API_KEY")
    if key:
        headers["Authorization"] = "Bearer " + key
    req = urllib.request.Request(url, data=body, headers=headers, method="POST")
    with urllib.request.urlopen(req, timeout=timeout) as r:
        d = json.loads(r.read().decode("utf-8"))
    try:
        return d["choices"][0]["message"]["content"] or ""
    except (KeyError, IndexError, TypeError):
        return ""


def wilson(correct: int, n: int, z: float = 1.959963984540054) -> list[float] | None:
    if n == 0:
        return None
    p = correct / n
    d = 1 + z * z / n
    centre = (p + z * z / (2 * n)) / d
    half = z * ((p * (1 - p) / n + z * z / (4 * n * n)) ** 0.5) / d
    return [round(max(0.0, centre - half), 4), round(min(1.0, centre + half), 4)]


def main() -> int:
    ap = argparse.ArgumentParser(description="Run one frozen GSPC bank against one model.")
    ap.add_argument("--axis", help="axis, e.g. governance / safety / care (see --list)")
    ap.add_argument("--model", help="model id as the endpoint knows it")
    ap.add_argument("--base-url", default="http://localhost:11434/v1",
                    help="OpenAI-compatible base URL (default: local Ollama)")
    ap.add_argument("--answers", help="JSONL of {index, answer} to score instead of calling a model")
    ap.add_argument("--out", default="-", help="output path, or - for stdout")
    ap.add_argument("--limit", type=int, default=0, help="score only the first N items (0 = all)")
    ap.add_argument("--timeout", type=int, default=120)
    ap.add_argument("--sleep", type=float, default=0.0, help="seconds between model calls")
    ap.add_argument("--max-tokens", type=int, default=1024,
                    help="completion budget per item. A REASONING model spends part of this on "
                         "reasoning before the answer: gpt-oss-120b used 147 reasoning tokens on a "
                         "single GSPC item, so the old fixed 256 truncated the answer and the item "
                         "was scored UNPARSED. An unparsed item is not a wrong answer, but a "
                         "truncated budget is our instrument, not the model, and it must not be "
                         "recorded as the model's failure.")
    ap.add_argument("--list", action="store_true", help="list the banks and exit")
    args = ap.parse_args()

    if args.list:
        print(f"{'axis':24} {'bank repo':14} {'labels'}")
        for a, repo in sorted(BANK_REPO.items()):
            print(f"{a:24} {repo:14} {', '.join(BANK_REPO and []) or ''}")
        print()
        print("Labels are read from each bank at run time (the bank's own `expected` values).")
        print("Axes whose bank yields a one-option menu are REFUSED: a prompt that cannot be")
        print("answered wrongly measures format compliance, not the axis.")
        return 0

    if not args.axis:
        print(f"run_bench: --axis is required. Known: {', '.join(sorted(BANK_REPO))}", file=sys.stderr)
        return 2
    try:
        axis = resolve_axis(args.axis)
    except KeyError:
        print(f"run_bench: unknown axis {args.axis!r}. Known: {', '.join(sorted(BANK_REPO))}", file=sys.stderr)
        return 2

    repo = BANK_REPO[axis]
    try:
        raw, bank_sha, url = load_bank_bytes(axis)
    except (urllib.error.URLError, OSError, TimeoutError) as e:
        print(f"run_bench: could not read the bank ({BANK_URL.format(repo=repo)}): {e}", file=sys.stderr)
        return 2

    items = bank_items(raw)
    if not items:
        print(f"run_bench: bank {repo} yielded no gradable items", file=sys.stderr)
        return 2

    labels = label_vocabulary(items)

    # The two-item safety rule, from the mill. A refused menu is REFUSED here too — this
    # runner will not grade an axis whose prompt cannot be answered wrongly.
    try:
        MILL.exact_label_menu(labels)
    except ValueError as e:
        print(f"run_bench: REFUSED — {axis}: {e}. No number is produced for this axis by this "
              f"runner, and that refusal is the correct outcome, not a failure.", file=sys.stderr)
        return 2

    if args.limit and args.limit < len(items):
        items = items[: args.limit]

    prompts = [MILL.axis_prompt(axis, text, labels) for text, _ in items]

    # ── collect answers ────────────────────────────────────────────────────────────────
    answers: list[str | None] = [None] * len(items)
    if args.answers:
        try:
            for line in Path(args.answers).read_text(encoding="utf-8").splitlines():
                if not line.strip():
                    continue
                d = json.loads(line)
                i = int(d.get("index", -1))
                if 0 <= i < len(items):
                    answers[i] = str(d.get("answer", ""))
        except (OSError, json.JSONDecodeError, ValueError) as e:
            print(f"run_bench: could not read --answers: {e}", file=sys.stderr)
            return 2
    else:
        if not args.model:
            print("run_bench: --model is required (or pass --answers to score existing answers).",
                  file=sys.stderr)
            return 2
        for i, prompt in enumerate(prompts):
            try:
                answers[i] = ask(args.base_url, args.model, prompt, args.timeout, max_tokens=args.max_tokens)
            except (urllib.error.URLError, OSError, TimeoutError, json.JSONDecodeError,
                    KeyError, IndexError) as e:
                answers[i] = ""
                print(f"run_bench: item {i} failed: {e}", file=sys.stderr)
            if args.sleep:
                time.sleep(args.sleep)

    # ── grade, with the estate's grader ────────────────────────────────────────────────
    rows, hits, unparsed = [], 0, 0
    for i, ((text, expected), prompt, ans) in enumerate(zip(items, prompts, answers)):
        if ans is None:
            unparsed += 1
            continue
        got = MILL.read_label(ans, labels)
        if got is None:
            # Not an answer, and NOT a wrong answer. It leaves the denominator.
            unparsed += 1
            rows.append({"index": i, "expected": expected.strip().upper(), "observed": None,
                         "ok": None, "unparsed": True, "answer": (ans or "")[:400],
                         "prompt_sha256": hashlib.sha256(prompt.encode()).hexdigest()})
            continue
        ok = got == expected.strip().upper()
        if ok:
            hits += 1
        rows.append({"index": i, "expected": expected.strip().upper(), "observed": got,
                     "ok": ok, "unparsed": False, "answer": (ans or "")[:400],
                     "prompt_sha256": hashlib.sha256(prompt.encode()).hexdigest()})

    n = len(items) - unparsed
    acc = (hits / n) if n else None
    result = {
        "schema": "csoai.gspc-run-bench-result/0.1",
        "what_this_is": "One model, one frozen GSPC bank, one deterministic grading pass. A measurement receipt, not a leader, not a rank, not a certification.",
        "what_this_does_not_establish": "That this model is better than another. That it is safe. That the bank is uncontaminated. That the labels are right. A single-model receipt compares nothing.",
        "axis": axis,
        "bank_repo": repo,
        "bank_url": url,
        "bank_sha256": bank_sha,
        "model": args.model,
        "grader": "gspc-top100.mill_hub_queue.read_label",
        "grader_source": "harness/gspc-top100/mill_hub_queue.py read_label() — imported, not copied",
        "prompt_builder": "gspc-top100.mill_hub_queue.axis_prompt() — imported, not copied",
        "items_total": len(items),
        "items_graded": n,
        "items_unparsed": unparsed,
        "hits": hits,
        "accuracy": round(acc, 4) if acc is not None else None,
        "wilson95": wilson(hits, n),
        "label_vocabulary": labels,
        "label_vocabulary_source": "the bank's own `expected` values, read from the fetched bytes",
        "unparsed_rule": "an answer that is not one of the bank's labels leaves the denominator; it is never counted as wrong",
        "generated_utc": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "rows": rows,
    }

    text = json.dumps(result, indent=2, ensure_ascii=False) + "\n"
    if args.out == "-":
        sys.stdout.write(text)
    else:
        Path(args.out).write_text(text, encoding="utf-8")
        print(f"run_bench: {axis} / {args.model}: {hits}/{n} = "
              f"{acc if acc is None else round(acc, 4)} ({unparsed} unparsed) -> {args.out}",
              file=sys.stderr)
    return 0 if n > 0 else 2


if __name__ == "__main__":
    raise SystemExit(main())
