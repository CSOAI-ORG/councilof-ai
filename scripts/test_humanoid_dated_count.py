#!/usr/bin/env python3
"""Controls for DATED_COUNT_RE — the humanoid dated-deployment-count detector.

The defect: sanctuary.ai was graded PASS (a published, dated deployment count)
on the strength of a press byline, "Sanctuary AI #1 Robotics Story of April 2026".
The pattern saw "1 Robot" and "2026" within forty characters and asked nothing
else. The page publishes no robot count. The false PASS was live in the run
artifact while the SIGNED card for the same axis correctly said false.

Every case is paired: the detector must FIRE on a real disclosure and NOT FIRE on
a headline. A detector that only ever says yes is the defect, not the fix.
"""
import pathlib, re, sys
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
from gspc_financial_facts import has_dated_deployment_count as fires

SHOULD_FIRE = [
    ("plain dated deployment",      "In 2026 we deployed 120 robots across three sites."),
    ("deploy then count then year", "deployed 45 units in 2025"),
    ("fleet of, with a year",       "By 2026 a fleet of 300 humanoids was in operation."),
    ("operational phrasing",        "2026: 12 robots now in operation at the plant."),
    ("shipped",                     "We shipped 7 robots in 2025."),
]
SHOULD_FIRE += [
    ("year, then deploy, then count", "In 2026 we deployed 120 robots across three sites."),
    ("count first, deploy after",    "120 robots were deployed in 2026."),
]

SHOULD_NOT_FIRE = [
    ("THE REAL REGRESSION: rank headline", "Sanctuary AI #1 Robotics Story of April 2026"),
    ("rank with No.",                "No. 1 Robotics Story of April 2026"),
    ("rank with the word number",    "number 1 robotics company of 2026"),
    ("'Robotics' is not 'robots'",   "In 2026 the 1 Robotics Story of the year"),
    ("count with no deployment verb","In 2026 we built 50 robots in the lab."),
    ("year and word, no count",      "Our robots are deploying now, 2026."),
    ("marketing with no number",     "Deploying Now. 2026."),
    ("count, no year",               "deployed 40 robots"),
]

def main():
    fails = []
    print("MUST FIRE:")
    for name, text in SHOULD_FIRE:
        ok = fires(text)
        print(f"  {'ok  ' if ok else 'FAIL'} {name:38} {text[:52]!r}")
        if not ok: fails.append(f"did not fire: {name}")
    print("\nMUST NOT FIRE:")
    for name, text in SHOULD_NOT_FIRE:
        ok = not fires(text)
        print(f"  {'ok  ' if ok else 'FAIL'} {name:38} {text[:52]!r}")
        if not ok: fails.append(f"falsely fired: {name}")

    # against the real page, if a local copy exists
    live = pathlib.Path("/tmp/sanc.html")
    if live.exists():
        hit = fires(live.read_text(errors="replace"))
        print(f"\n  {'ok  ' if not hit else 'FAIL'} live sanctuary.ai page -> "
              f"{'no dated deployment count (correct)' if not hit else 'STILL FALSELY MATCHES'}")
        if hit: fails.append("still matches the real sanctuary.ai page")

    print(f"\n{len(SHOULD_FIRE)+len(SHOULD_NOT_FIRE)-len(fails)}/"
          f"{len(SHOULD_FIRE)+len(SHOULD_NOT_FIRE)} pass")
    if fails:
        print("FAILURES:"); [print("   -", f) for f in fails]; return 1
    print("The detector fires on real disclosures and refuses headlines.")
    return 0

if __name__ == "__main__":
    sys.exit(main())
