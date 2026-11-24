#!/usr/bin/env python3
"""Cost sheet for the silent-change watch (protocol 1). Prints the markdown tables.

Calls: items x K x batches. Money: tokens x an ASSUMED price tier. The tiers are assumptions to
show the shape of the spend, not provider quotes; no provider price was read.
"""
import json
from pathlib import Path

P_DIR = Path(__file__).resolve().parent.parent.parent / "docs/research/silent-change"
P = json.loads((Path(__file__).resolve().parent.parent.parent / "docs/research/silent-change/protocol.json").read_text())
ITEMS = len(P["items"]["lanes"]) * P["items"]["items_per_lane"]
K = P["repeats_k"]
CALLS_PER_BATCH = ITEMS * K
IN_TOK = 150            # axis prompt + item, estimated
OUT_TOK = 32            # max_tokens; a reasoning model that bills hidden thinking is the next line
OUT_TOK_REASONING = 600  # assumption for a model that bills hidden reasoning tokens
TIERS = {"low (0.15 in / 0.60 out per 1M tokens)": (0.15, 0.60),
         "mid (1 in / 4 out per 1M tokens)": (1.0, 4.0),
         "high (5 in / 25 out per 1M tokens)": (5.0, 25.0)}


def usd(calls, tin, tout, pin, pout):
    return calls * (tin * pin + tout * pout) / 1e6


def main():
    print("Per batch: %d items x %d repeats = %d calls." % (ITEMS, K, CALLS_PER_BATCH))
    print("\n### Paid watch, one batch per model per day\n")
    print("| models | calls per day | calls per 30 days | USD per 30 days, " + " | ".join(TIERS) + " |")
    print("|---|---|---|" + "---|" * len(TIERS))
    for m in (5, 10, 20):
        c = m * CALLS_PER_BATCH
        cells = [usd(c * 30, IN_TOK, OUT_TOK, *t) for t in TIERS.values()]
        print("| %d | %d | %d | " % (m, c, c * 30) + " | ".join("%.0f" % x for x in cells) + " |")
    print("\nIf every model bills hidden reasoning (%d output tokens a call assumed), USD per 30 days:\n" % OUT_TOK_REASONING)
    print("| models | " + " | ".join(TIERS) + " |")
    print("|---|" + "---|" * len(TIERS))
    for m in (5, 10, 20):
        c = m * CALLS_PER_BATCH * 30
        print("| %d | " % m + " | ".join("%.0f" % usd(c, IN_TOK, OUT_TOK_REASONING, *t) for t in TIERS.values()) + " |")
    conds = P["addendum_2"]["conditions_as_run"]
    batches = sum(c.get("trials", c.get("batches", 1)) for c in conds.values())
    print("\n### Open-model calibration (once, on free GitHub-hosted runners, addendum 2)\n")
    print("%d batches x %d calls = %d calls." % (batches, CALLS_PER_BATCH, batches * CALLS_PER_BATCH))
    pins = json.loads((P_DIR / "calibration-pins.json").read_text())
    n = {}
    for c in conds.values():
        n[c["file"]] = n.get(c["file"], 0) + c.get("trials", c.get("batches", 1))
    tot = 0
    for f, cnt in sorted(n.items()):
        h = cnt * pins["plan"]["est_seconds_per_batch"][f] / 3600
        tot += h
        print("- %s: %d batches, planned %.1f runner hours (planning constant, about 6 x the laptop rehearsal)" % (f, cnt, h))
    print("- total planned: about %.0f runner hours, split into jobs of about an hour; free for a public repository (unverified for this plan)." % tot)

main()
