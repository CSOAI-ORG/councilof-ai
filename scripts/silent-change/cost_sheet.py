#!/usr/bin/env python3
"""Cost sheet for the silent-change watch (protocol 1). Prints the markdown tables.

Calls: items x K x batches. Money: tokens x an ASSUMED price tier. The tiers are assumptions to
show the shape of the spend, not provider quotes; no provider price was read.
"""
import json
from pathlib import Path

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
    conds = P["calibration"]["conditions"]
    batches = 1 + sum(c["trials"] for c in conds.values())
    print("\n### Open-model calibration (once, on free or near-free compute)\n")
    print("1 baseline + %s = %d batches x %d calls = %d calls." % (
        " + ".join("%d (%s)" % (c["trials"], k) for k, c in conds.items()), batches, CALLS_PER_BATCH, batches * CALLS_PER_BATCH))
    for label, s in (("small CPU runner, about 1.5 s a call (assumed)", 1.5), ("one GPU, about 0.15 s a call (assumed)", 0.15)):
        h = batches * CALLS_PER_BATCH * s / 3600
        print("- %s: about %.1f hours of serial calls." % (label, h))


main()
