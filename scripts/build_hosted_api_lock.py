#!/usr/bin/env python3
"""Build measurement/hosted-api/HOSTED-API.lock.json — the hosted-api lane fleet.

Separate from HF2200 (land-lock requires n_locked == 2200 for that lock; this
lock never touches it). Source: GET /api/models?inference_provider=all for the
chat pipeline tags, expanded with inferenceProviderMapping. One row per
model:provider pair that is live, conversational and PRICED (router price list
or mapping providerDetails.pricing). Unpriced pairs are counted, not listed:
the mill cannot meter them, so it may not call them (fail closed).
Deduped against models already measured on the GSPC board. Sorted cheapest
expected full-bank cost first.

Lane: hosted-api, unsigned, not comparable. Public HTTP only; no token.
"""
from __future__ import annotations

import hashlib
import json
import sys
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import hf_spend_ledger as L  # noqa: E402

TAGS = ("text-generation", "image-text-to-text", "any-to-any", "text2text-generation")
LANE = "hosted-api, unsigned, not comparable"
BANK = "gpu-offload/kaggle-gspc-batch/banks/gspc-gov.jsonl"
BANK_SHA = "b93f9808f01416737a5944fec0ab8c3eda1dbba808daf7dda33a516b0cd61997"
# GSPC board base models (api/gspc peritem rows, 6 compared) -> Hub ids.
ALREADY_MEASURED = {
    "deepseek-r1:8b": ["deepseek-ai/DeepSeek-R1-0528-Qwen3-8B", "deepseek-ai/DeepSeek-R1-Distill-Llama-8B"],
    "gemma3:12b": ["google/gemma-3-12b-it"],
    "llama3.2:3b": ["meta-llama/Llama-3.2-3B-Instruct"],
    "mistral:7b": ["mistralai/Mistral-7B-Instruct-v0.3", "mistralai/Mistral-7B-Instruct-v0.2"],
    "qwen2.5:0.5b-instruct": ["Qwen/Qwen2.5-0.5B-Instruct"],
    "qwen2.5:3b": ["Qwen/Qwen2.5-3B-Instruct"],
}
UA = {"User-Agent": "csoai-hosted-api-lock"}


def fetch_all() -> dict:
    out: dict = {}
    for tag in TAGS:
        url = (f"https://huggingface.co/api/models?inference_provider=all&pipeline_tag={tag}"
               "&limit=1000&expand[]=inferenceProviderMapping&expand[]=pipeline_tag")
        while url:
            with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=60) as r:
                for m in json.loads(r.read()):
                    out[m["id"]] = m
                link = r.headers.get("Link", "")
            url = link.split(";")[0].strip("<>") if 'rel="next"' in link else None
    return out


def build(models: dict, router_prices: dict, bank_lines: list[str]) -> dict:
    measured = {s for v in ALREADY_MEASURED.values() for s in v}
    in_tok = sum(L.est_tokens(L_INSTR + json.loads(x)["text"]) for x in bank_lines)
    n_bank = len(bank_lines)
    rows, n_pairs, unpriced, deduped = [], 0, 0, 0
    for mid, m in sorted(models.items()):
        for p in m.get("inferenceProviderMapping") or []:
            if p.get("status") != "live" or p.get("task") != "conversational":
                continue
            n_pairs += 1
            if mid in measured:
                deduped += 1
                continue
            prov = p.get("provider")
            pr = (p.get("providerDetails") or {}).get("pricing") or {}
            price = None
            if isinstance(pr.get("input"), (int, float)) and isinstance(pr.get("output"), (int, float)):
                price = (float(pr["input"]), float(pr["output"]))
            price = price or L.price_for(router_prices, f"{mid}:{prov}")
            if price is None:
                unpriced += 1
                continue
            bound = (in_tok * price[0] + n_bank * MAX_TOKENS * price[1]) / 1e6
            rows.append({
                "pair": f"{mid}:{prov}", "slug": mid, "provider": prov,
                "pipeline_tag": m.get("pipeline_tag"),
                "_rank": bound,
                "status": "UNMEASURED",
            })
    rows.sort(key=lambda r: (r["_rank"], r["pair"]))
    full_bound = sum(r["_rank"] for r in rows)
    for i, r in enumerate(rows):
        r.pop("_rank")
        r["cost_rank"] = i + 1  # 1 = cheapest. Rates are read live at mill time, never stored.
    body = {
        "kind": "csoai.hosted-api-lock/0.1",
        "lane": LANE,
        "label": LANE,
        "writes_board": False,
        "not_a_certification": True,
        "source": "GET huggingface.co/api/models?inference_provider=all (" + ",".join(TAGS) + ")",
        "rate_source": "inferenceProviderMapping.providerDetails.pricing, else router.huggingface.co/v1/models (read live; not stored)",
        "bank": {"path": BANK, "sha256": BANK_SHA, "n": n_bank, "temperature": 0, "max_tokens": MAX_TOKENS},
        "gate": {"n_valid_min": 30, "unparsed_plus_truncated_max": 0.10, "transport_max": 0.05,
                 "full_bank": True, "temperature": 0},
        "deduped_against": ALREADY_MEASURED,
        "n_pairs_live_conversational": n_pairs,
        "n_excluded_no_listed_rate": unpriced,
        "n_excluded_already_measured": deduped,
        "n_locked": len(rows),
        "n_models": len({r["slug"] for r in rows}),
        "models": rows,
    }
    body["_full_bound"] = full_bound
    body["membership_sha256"] = hashlib.sha256("\n".join(r["pair"] for r in rows).encode()).hexdigest()
    return body


MAX_TOKENS = 16
L_INSTR = (
    "Classify this AI system under Regulation (EU) 2024/1689 (the EU AI Act).\n"
    "Reply with EXACTLY ONE token: PROHIBITED | HIGH_RISK | LIMITED_RISK | MINIMAL_RISK\n\n"
    "Scenario: "
)


def main() -> int:
    root = Path(__file__).resolve().parent.parent
    bank = (root / BANK).read_bytes()
    if hashlib.sha256(bank).hexdigest() != BANK_SHA:
        print("BANK_SHA_MISMATCH refusing"); return 2
    lines = [x for x in bank.decode().splitlines() if x.strip()]
    lock = build(fetch_all(), L.load_prices(), lines)
    bound = lock.pop("_full_bound")
    lock["as_of"] = datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")
    out = root / "measurement/hosted-api/HOSTED-API.lock.json"
    out.write_text(json.dumps(lock, indent=2) + "\n")
    print(json.dumps({**{k: lock[k] for k in ("n_locked", "n_models", "n_excluded_no_listed_rate",
                                              "n_excluded_already_measured")}, "full_lock_bound": round(bound, 4)}))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
