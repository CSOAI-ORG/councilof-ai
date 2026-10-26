#!/usr/bin/env python3
"""Local spend ledger for HF Inference Providers billed to the csoai org.

Why a ledger: Hugging Face exposes no endpoint that returns an org's prepaid
credit balance. huggingface_hub has none (only get_zero_gpu_quota), and the
documented billing API returns USAGE, not balance:
  GET /api/organizations/{org}/billing/usage/inference?startDate=&endDate=
(needs a billing-read token; rows lag up to ~2 h). Run 38846917865 guessed
/billing/balance and /billing; both raised HTTPError and the run fell to smoke.

So spend is counted here. Every call is priced from the router's own price
list (GET https://router.huggingface.co/v1/models -> providers[].pricing,
USD per 1M input/output tokens). A call whose price is unknown is never
sent (fail closed). The running total lives in the Hub dataset
csoai/hub-queue at ledger/hf-inference-spend.json and is written by CI with
the HF_TOKEN secret only.

Cap: Nick 04:27 BST 16 Oct approved the $96.60 prepaid credit, stopping with
$5 left -> cumulative spend since 2026-10-16 00:00 BST may reach $91.60.

Pure helpers + a tiny CLI used by .github/workflows/hf-inference-mill.yml:
  reserve  <ledger.json> <run_id>     -> prints budget, writes reservation
  settle   <ledger.json> <run_id> <shard spend JSONs...>
"""
from __future__ import annotations

import json
import math
import sys
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

CAP_USD = 91.60
CREDIT_USD = 96.60
SINCE = "2026-10-15T23:00:00Z"  # 16 Oct 00:00 BST
RUN_CAP_USD = 10.0  # one hourly run may reserve at most this much
SHARDS = 20
MODELS_URL = "https://router.huggingface.co/v1/models"
LEDGER_REPO = "csoai/hub-queue"
LEDGER_PATH = "ledger/hf-inference-spend.json"
KIND = "csoai.hf-inference-spend-ledger/0.1"


def now() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def empty_ledger() -> dict:
    return {
        "kind": KIND,
        "org": "csoai",
        "since": SINCE,
        "credit_usd": CREDIT_USD,
        "cap_usd": CAP_USD,
        # Smoke shards ran before this ledger existed (5 models x n=1 per run).
        # Count a conservative allowance so they are not forgotten.
        "spent_usd": 0.25,
        "reserved": {},
        "by_day": {"2026-10-16": 0.25},
        "runs": [{"run_id": "pre-ledger-smoke", "spent_usd": 0.25, "note": "allowance, upper bound"}],
        "price_source": MODELS_URL,
        "not_a_balance": "local count; HF exposes usage, not balance",
    }


def committed(ledger: dict) -> float:
    """Spent plus every open reservation. Open reservations count in full."""
    return float(ledger.get("spent_usd", 0.0)) + sum(float(v) for v in (ledger.get("reserved") or {}).values())


def remaining(ledger: dict) -> float:
    return round(CAP_USD - committed(ledger), 6)


# ---------- pricing ----------

def load_prices(raw: dict | None = None) -> dict:
    """{model_id: {provider: (in_per_m, out_per_m) or None}} from /v1/models."""
    if raw is None:
        req = urllib.request.Request(MODELS_URL, headers={"User-Agent": "csoai-spend-ledger"})
        with urllib.request.urlopen(req, timeout=30) as r:
            raw = json.loads(r.read())
    out: dict = {}
    for m in raw.get("data") or []:
        mp = out.setdefault(m.get("id"), {})
        for p in m.get("providers") or []:
            if p.get("status") not in (None, "live"):
                continue
            pr = p.get("pricing") or {}
            i, o = pr.get("input"), pr.get("output")
            ok = isinstance(i, (int, float)) and isinstance(o, (int, float)) and i >= 0 and o >= 0
            mp[p.get("provider")] = (float(i), float(o)) if ok else None
    return out


def price_for(prices: dict, router_name: str) -> tuple[float, float] | None:
    """Price for "slug:provider" or a bare slug. Bare = router chooses, so the
    most expensive live provider applies and every one must be priced."""
    slug, _, prov = router_name.partition(":")
    mp = prices.get(slug)
    if not mp:
        return None
    if prov:
        return mp.get(prov)
    vals = list(mp.values())
    if not vals or any(v is None for v in vals):
        return None
    return (max(v[0] for v in vals), max(v[1] for v in vals))


def est_tokens(text: str) -> int:
    # Upper bound: no tokenizer emits more than ~1 token per 2 UTF-8 bytes on
    # English prose; +32 for chat template overhead.
    return math.ceil(len(text.encode("utf-8")) / 2) + 32


def call_cost(price: tuple[float, float], in_tok: int, out_tok: int) -> float:
    return (in_tok * price[0] + out_tok * price[1]) / 1_000_000


class ShardMeter:
    """Per-shard budget. pre() refuses unpriced or over-budget calls."""

    def __init__(self, prices: dict, budget_usd: float):
        self.prices = prices
        self.budget = max(0.0, float(budget_usd))
        self.spent = 0.0
        self.calls = 0
        self.refused_price = 0
        self.stopped = False

    def pre(self, router_name: str, prompt: str, max_tokens: int):
        price = price_for(self.prices, router_name)
        if price is None:
            self.refused_price += 1
            return None, "PRICE_UNKNOWN"
        bound = call_cost(price, est_tokens(prompt), max_tokens)
        if self.spent + bound > self.budget:
            self.stopped = True
            return None, "BUDGET_STOP"
        return price, ""

    def post(self, price, prompt: str, max_tokens: int, usage: dict | None) -> float:
        u = usage or {}
        pi, co = u.get("prompt_tokens"), u.get("completion_tokens")
        if isinstance(pi, int) and isinstance(co, int) and pi >= 0 and co >= 0:
            c = call_cost(price, pi, co)
        else:  # no usage block: charge the upper bound
            c = call_cost(price, est_tokens(prompt), max_tokens)
        self.spent += c
        self.calls += 1
        return c

    def to_json(self) -> dict:
        return {"spent_usd": round(self.spent, 6), "calls": self.calls, "budget_usd": self.budget,
                "refused_price_unknown": self.refused_price, "budget_stop": self.stopped}


# ---------- ledger ops (pure on dicts) ----------

def reserve(ledger: dict, run_id: str) -> float:
    amt = round(max(0.0, min(RUN_CAP_USD, remaining(ledger))), 6)
    if amt > 0:
        ledger.setdefault("reserved", {})[str(run_id)] = amt
    ledger["updated"] = now()
    return amt


def settle(ledger: dict, run_id: str, shard_spends: list[float], day: str | None = None) -> float:
    total = round(sum(shard_spends), 6)
    (ledger.get("reserved") or {}).pop(str(run_id), None)
    ledger["spent_usd"] = round(float(ledger.get("spent_usd", 0.0)) + total, 6)
    d = day or now()[:10]
    ledger.setdefault("by_day", {})[d] = round(float(ledger["by_day"].get(d, 0.0)) + total, 6)
    ledger.setdefault("runs", []).append({"run_id": str(run_id), "spent_usd": total, "at": now()})
    ledger["updated"] = now()
    return total


def _cli(argv: list[str]) -> int:
    cmd, path = argv[0], Path(argv[1])
    ledger = json.loads(path.read_text()) if path.exists() else empty_ledger()
    if ledger.get("kind") != KIND:
        print("LEDGER_BAD_KIND"); return 2
    if cmd == "reserve":
        amt = reserve(ledger, argv[2])
        path.write_text(json.dumps(ledger, indent=2) + "\n")
        print(json.dumps({"reserved_usd": amt, "shard_budget_usd": round(amt / SHARDS, 6),
                          "committed_usd": round(committed(ledger), 6), "cap_usd": CAP_USD}))
        return 0
    if cmd == "settle":
        spends = []
        for f in argv[3:]:
            spends.append(float(json.loads(Path(f).read_text()).get("spent_usd", 0.0)))
        # A shard with no spend file still had its slice reserved; settle()
        # releases the reservation only for what was proven. Missing shards
        # are charged their full slice (fail closed).
        res = float((ledger.get("reserved") or {}).get(argv[2], 0.0))
        missing = max(0, SHARDS - len(spends))
        spends.append(res / SHARDS * missing)
        tot = settle(ledger, argv[2], spends)
        path.write_text(json.dumps(ledger, indent=2) + "\n")
        print(json.dumps({"run_spent_usd": tot, "spent_usd": ledger["spent_usd"],
                          "remaining_usd": remaining(ledger), "missing_shards": missing}))
        return 0
    print("usage: reserve|settle"); return 2


if __name__ == "__main__":
    raise SystemExit(_cli(sys.argv[1:]))
