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
import hashlib, json, pathlib, re, sys
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
from gspc_financial_facts import has_dated_deployment_count as fires
from gspc_financial_facts import find_dated_deployment_count, visible_text

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
    total = [len(SHOULD_FIRE) + len(SHOULD_NOT_FIRE)]
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

    # THE REGRESSION FIXTURE. This was /tmp/sanc.html, which meant the one control
    # taken from the real page silently skipped wherever /tmp had been cleared --
    # including CI. The bytes now live in the repo with their provenance, so the
    # control either runs or fails; it can no longer quietly not happen.
    fixtures = pathlib.Path(__file__).resolve().parent / "fixtures" / "humanoid"
    live = fixtures / "sanctuary-ai-2026-09-17-excerpt.html"
    if not live.exists():
        fails.append(f"regression fixture missing: {live}")
    else:
        prov = json.loads((fixtures / "provenance.json").read_text())
        body = live.read_text(encoding="utf-8")
        print("\nREAL BYTES (%s, fetched %s):" % (prov["url"], prov["fetched_utc"]))
        checks = [
            ("fixture is the bytes provenance.json names",
             hashlib.sha256(body.encode()).hexdigest() == prov["excerpt_sha256"]),
            # A control is only a control if the defect reproduces on it.
            ("the ORIGINAL pattern still fires on them",
             bool(re.search(r"\b(20\d{2}).{0,80}\b(\d{1,5})\s+(robots?|units?|humanoids?)\b"
                            r"|\b(\d{1,5})\s+(robots?|units?|humanoids?).{0,40}\b(20\d{2})\b",
                            body, re.I))),
            ("the real sanctuary.ai bytes do not fire", not fires(body)),
            ("and publish no count in their visible text",
             find_dated_deployment_count(body) is None),
            ("visible_text drops the markup", "<span" not in visible_text(body)),
        ]
        for name, ok in checks:
            print(f"  {'ok  ' if ok else 'FAIL'} {name}")
            if not ok: fails.append(name)
        total[0] += len(checks)

    # THREE LEAKS the window predicate still had, measured 2026-09-17. Each is a
    # claim that is not visible prose, or a model name that only looks like a count.
    print("\nVISIBLE TEXT ONLY (markup is not a published claim):")
    leaks = [
        ("a claim only in a JSON-LD <script>",
         '<script type="application/ld+json">{"d":"we deployed 250 robots in 2026"}</script>'),
        ("a claim only in an HTML comment",
         "<!-- TODO: in 2026 we deployed 500 robots -->"),
        ("a model designator, the live agilityrobotics.com shape",
         "Press Release September 17, 2026 Agility Unveils Digit 5 Humanoid Robot. Deploy Digit"),
    ]
    for name, text in leaks:
        ok = find_dated_deployment_count(text) is None
        print(f"  {'ok  ' if ok else 'FAIL'} {name}")
        if not ok: fails.append(f"leaked: {name}")
    total[0] += len(leaks)

    # ... and the predicate is still not wired to no. A PASS must carry its quote,
    # or a reader cannot re-read it on the page -- which is how the false PASS
    # survived ten days.
    print("\nSTILL SAYS YES, AND SHOWS ITS WORKING:")
    got = find_dated_deployment_count("<p>In March 2026 Agility delivered 40 robots to GXO.</p>")
    quote_checks = [
        ("a genuine dated deployment count is found", got is not None),
        ("it carries the count it read", bool(got) and got["count_phrase"] == "40 robots"),
        ("it carries the sentence it read it from", bool(got) and "delivered" in got["quote"]),
    ]
    for name, ok in quote_checks:
        print(f"  {'ok  ' if ok else 'FAIL'} {name}")
        if not ok: fails.append(name)
    total[0] += len(quote_checks)

    print(f"\n{total[0]-len(fails)}/{total[0]} pass")
    if fails:
        print("FAILURES:"); [print("   -", f) for f in fails]; return 1
    print("Fires on real disclosures, refuses headlines and markup, and shows its working.")
    return 0

if __name__ == "__main__":
    sys.exit(main())
