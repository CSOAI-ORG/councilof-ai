#!/usr/bin/env python3
"""
forecast_scenarios.py — test the predictive small→large loop in different scenarios.

Two passes:
  A. forecast() on PARTIAL inputs (as if the user is mid-type) across 5 scenario classes —
     does the small model predict the right intent + complexity, and route correctly?
  B. compare() small-only vs large-only on full prompts — real latencies + agreement, so we
     can see WHEN the small model is good enough (route='small' = skip the large = speed).

Run where models are reachable (the VM has OPENROUTER_API_KEY):
    ssh meok-backend 'cd /opt/meok-one && python3 tools/forecast_scenarios.py'
"""
import sys, os, time
sys.path.insert(0, os.path.normpath(os.path.join(os.path.dirname(__file__), "..")))
from meok_one import forecast as fc   # noqa: E402

TIER = os.environ.get("MEOK_TIER", "pro")

# partial inputs (mid-type) -> what we EXPECT the router to do
PARTIALS = [
    ("hey good mor",                         "greeting",    "trivial→small"),
    ("whats the capital of fra",             "fact lookup", "trivial/moderate"),
    ("help me plan a 3 day trip to tok",     "planning",    "complex→large"),
    ("write a python function that sorts",   "coding",      "complex→large"),
    ("transfer 500 to my landl",             "money/safety","complex→large"),
]

# full prompts for the small-vs-large head-to-head
FULL = [
    "Say hello in one short sentence.",
    "What is the capital of France? One word.",
    "Outline a 3-day Tokyo itinerary with one bullet per day.",
    "Explain why distributed consensus needs a quorum, in 2 sentences.",
]


def main():
    print("=" * 72)
    print(f"PREDICTIVE small→large — scenario test  (tier={TIER})")
    print("=" * 72)

    print("\nA) FORECAST from partial input (mid-type)\n" + "-" * 72)
    routed_small = 0
    for partial, expect_intent, expect_route in PARTIALS:
        r = fc.forecast(partial, tier=TIER)
        routed_small += (r["route"] == "small")
        print(f"  · “{partial}”")
        print(f"      → completion : {r['completion'][:64]}")
        print(f"      → intent     : {r['intent']:<22} complexity: {r['complexity']:<9} "
              f"route: {r['route'].upper():<6} ({r['ms']}ms, {r.get('backend')})")
        if r.get("answer"):
            print(f"      → small answered: {str(r['answer'])[:64]}")
        print(f"      (expected ~ {expect_intent} / {expect_route})")
    print(f"\n  routed to SMALL (council not woken): {routed_small}/{len(PARTIALS)}")

    print("\nB) SMALL vs LARGE head-to-head (full prompts)\n" + "-" * 72)
    sm_ms, lg_ms, agrees = [], [], []
    for p in FULL:
        c = fc.compare(p, tier=TIER)
        s, l = c["small"], c["large"]
        sm_ms.append(s["ms"]); lg_ms.append(l["ms"]); agrees.append(c["agreement"])
        print(f"  · {p[:54]}")
        print(f"      small {s['model']:<34} {s['ms']:>6}ms  ok={s['ok']}")
        print(f"      large {l['model']:<34} {l['ms']:>6}ms  ok={l['ok']}")
        print(f"      speedup(small) ×{c['speedup_small_vs_large']}   agreement={c['agreement']}")

    def avg(xs):
        return int(sum(xs) / len(xs)) if xs else 0
    print("\n" + "=" * 72)
    print(f"SUMMARY: small avg {avg(sm_ms)}ms · large avg {avg(lg_ms)}ms · "
          f"avg speedup ×{round(avg(lg_ms)/max(1,avg(sm_ms)),2)} · "
          f"avg agreement {round(sum(agrees)/len(agrees),3) if agrees else 0}")
    print("Read: where complexity=trivial the small model answers alone (route=SMALL) — that is")
    print("the perceived-latency win. Where it routes LARGE, the council still does the work.")
    print("=" * 72)


if __name__ == "__main__":
    main()
