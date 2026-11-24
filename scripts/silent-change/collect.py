#!/usr/bin/env python3
"""Silent-change detector: item selection and repeated collection (protocol 1).

Reuses ci/frontier-runner.py (bank fetch) and harness/gspc-top100/mill_hub_queue.py
(axis_prompt, read_label). One request per repeat, all calls of a batch shuffled together.
Stdlib only. Never prints a credential. Items of a private set are never written to output.
"""
from __future__ import annotations

import hashlib
import importlib.util
import json
import random
import sys
import time
import urllib.error
import urllib.request
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent.parent
sys.path.insert(0, str(HERE))
sys.path.insert(0, str(ROOT / "harness" / "gspc-top100"))
import detector  # noqa: E402


def item_sort_key(lane: str, item: str) -> str:
    return hashlib.sha256((lane + "\0" + item).encode("utf-8")).hexdigest()


def select_items(bank: list, lane: str, n: int) -> list:
    """Protocol rule: smallest sha256(lane NUL item_text) first. bank = [(item_text, gold), ...]."""
    return sorted(bank, key=lambda p: item_sort_key(lane, p[0]))[:n]


def item_id(lane: str, item: str) -> str:
    return lane + ":" + item_sort_key(lane, item)[:16]


def items_commitment(ids: list) -> str:
    return hashlib.sha256("\n".join(sorted(ids)).encode("utf-8")).hexdigest()


def load_public_items(protocol: dict) -> tuple[list, dict]:
    """[(item_id, prompt)], plus {lane: bank_file_sha256}. Network: reads the public frozen banks."""
    spec = importlib.util.spec_from_file_location("frontier_runner", ROOT / "ci" / "frontier-runner.py")
    fr = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(fr)
    from mill_hub_queue import axis_prompt, read_label  # noqa: E402
    items, shas, labels_by_lane = [], {}, {}
    n = protocol["items"]["items_per_lane"]
    for lane in protocol["items"]["lanes"]:
        bank, _path, labels, menu, file_sha = fr.fetch_lane_bank(lane)
        shas[lane] = file_sha
        labels_by_lane[lane] = labels
        for text, _gold in select_items(bank, lane, n):
            items.append((item_id(lane, text), axis_prompt(lane, text, menu), lane))
    return items, shas, labels_by_lane


def read_answer(text: str, labels: list) -> str:
    from mill_hub_queue import read_label  # noqa: E402
    got = read_label(text or "", labels)
    return got if got else "UNPARSED"


# --- transports: each is send(prompt, cfg) -> text; cfg carries model, system, temperature -----------

def _post(url: str, payload: dict, headers: dict, timeout: int = 120) -> dict:
    req = urllib.request.Request(url, data=json.dumps(payload).encode("utf-8"), method="POST",
                                 headers=dict(headers, **{"Content-Type": "application/json",
                                                          "User-Agent": "csoai-silent-change/1"}))
    last = None
    for attempt in range(3):
        try:
            with urllib.request.urlopen(req, timeout=timeout) as r:
                return json.loads(r.read().decode("utf-8"))
        except urllib.error.HTTPError as e:
            if e.code in (401, 402, 403):
                raise PermissionError("HTTP %d" % e.code)
            last = "HTTP %d" % e.code
        except (urllib.error.URLError, TimeoutError, OSError) as e:
            last = str(e)[:100]
        time.sleep(2 * (attempt + 1))
    raise ConnectionError(last or "network error")


def openai_compat_send(base_url: str, api_key: str = ""):
    """OpenAI-compatible chat endpoint: OpenAI, DeepSeek, xAI, Mistral, OpenRouter, Ollama, llama-server."""
    def send(prompt: str, cfg: dict) -> str:
        msgs = ([{"role": "system", "content": cfg["system"]}] if cfg.get("system") else []) + \
               [{"role": "user", "content": prompt}]
        body = {"model": cfg["model"], "messages": msgs, "temperature": cfg.get("temperature", 0),
                "max_tokens": cfg.get("max_tokens", 32)}
        body.update(cfg.get("extra_body") or {})   # e.g. llama-server's cache_prompt; never set for hosted models
        hdr = {"Authorization": "Bearer " + api_key} if api_key else {}
        d = _post(base_url.rstrip("/") + "/chat/completions", body, hdr)
        return d["choices"][0]["message"].get("content") or ""
    return send


def anthropic_send(api_key: str):
    def send(prompt: str, cfg: dict) -> str:
        body = {"model": cfg["model"], "max_tokens": cfg.get("max_tokens", 32),
                "temperature": cfg.get("temperature", 0),
                "messages": [{"role": "user", "content": prompt}]}
        if cfg.get("system"):
            body["system"] = cfg["system"]
        d = _post("https://api.anthropic.com/v1/messages", body,
                  {"x-api-key": api_key, "anthropic-version": "2023-06-01"})
        return "".join(b.get("text", "") for b in d.get("content", []) if b.get("type") == "text")
    return send


# --- one batch ------------------------------------------------------------------------------------------

def run_batch(items: list, labels_by_lane: dict, send, cfg: dict, k: int, order_seed: int,
              clock=time.time) -> dict:
    """items: [(item_id, prompt, lane)]. Returns {answers, raw_sha256, errors}. Calls are shuffled."""
    calls = [(i, r) for i in range(len(items)) for r in range(k)]
    random.Random(order_seed).shuffle(calls)
    answers = {it[0]: [None] * k for it in items}
    raw = {it[0]: [None] * k for it in items}
    errors = 0
    for idx, rep in calls:
        iid, prompt, lane = items[idx]
        try:
            text = send(prompt, cfg)
        except PermissionError:
            raise
        except Exception:
            errors += 1
            text = None
        answers[iid][rep] = read_answer(text, labels_by_lane[lane]) if text is not None else "ERROR"
        raw[iid][rep] = hashlib.sha256((text or "").encode("utf-8")).hexdigest()
    return {"answers": answers, "raw_sha256": raw, "transport_errors": errors}


def batch_digest(answers: dict) -> str:
    return hashlib.sha256(json.dumps(answers, sort_keys=True, separators=(",", ":")).encode("utf-8")).hexdigest()
