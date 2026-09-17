#!/usr/bin/env python3
"""Crosswalk regulatory and assurance sources against stable goals, and refuse to lie about coverage.

WHY GOALS AND NOT SECTION NUMBERS
A crosswalk anchored to `CLARITY section 101` dies the moment the document changes. On 15 September
2026 the Senate cloture vote on CLARITY failed and the bill never reached debate. Every goal it
raises is still live, and three other sources address those same goals and remain operative. Anchor
to the goal and the stall becomes a state change on one row instead of a rewrite.

WHAT THIS EMITS, AND WHAT IT REFUSES TO EMIT
For each goal: which sources raise it, what each raises, and the verification state of each. It
publishes a goal with NO source as exactly that, never as satisfied, and it publishes a goal whose
only sources are unverified as UNVERIFIED_ONLY rather than folding it in with the rest.

WHAT THIS IS NOT
Not legal advice and not a compliance determination. A goal is a question we can gather observable
evidence against. Nothing here says what any law requires or whether anyone complies. CSOAI
measures and never certifies.

VERIFICATION STATES, which are about OUR work and not about the source's authority:
  PRIMARY_SOURCE_FETCHED                        we retrieved the primary artifact ourselves
  PRIMARY_ARTIFACT_FETCHED_DEADLINE_FROM_SECONDARY   we have the artifact; a date in the row is not in it
  REPORTED_BY_SECONDARY_SOURCES                 we have not retrieved a primary artifact
"""
import argparse, hashlib, json, pathlib, sys, datetime

VERIFICATION_STATES = {
    "PRIMARY_SOURCE_FETCHED",
    "PRIMARY_ARTIFACT_FETCHED_DEADLINE_FROM_SECONDARY",
    "REPORTED_BY_SECONDARY_SOURCES",
}
UNVERIFIED = {"REPORTED_BY_SECONDARY_SOURCES"}


def sha256b(b: bytes) -> str:
    return hashlib.sha256(b).hexdigest()


def canon(o) -> bytes:
    return json.dumps(o, sort_keys=True, separators=(",", ":"), ensure_ascii=True).encode()


def validate(goals, sources):
    """Returns a list of defects. An empty list is a claim, so every rule here must be able to fire."""
    defects = []
    goal_ids = {g["id"] for g in goals["goals"]}
    for s in sources:
        sid = s.get("source_id", "<no source_id>")
        v = s.get("verification") or {}
        state = v.get("state")
        if state not in VERIFICATION_STATES:
            defects.append(f"{sid}: verification.state {state!r} is not one of the declared states")
        if state == "PRIMARY_SOURCE_FETCHED":
            if not v.get("primary_artifact_fetched"):
                defects.append(f"{sid}: claims PRIMARY_SOURCE_FETCHED but primary_artifact_fetched is not true")
            if not v.get("url"):
                defects.append(f"{sid}: claims PRIMARY_SOURCE_FETCHED with no url to the artifact")
        if not v.get("checked_at"):
            defects.append(f"{sid}: no checked_at, so the verification has no date")
        for key in ("comment_deadline", "contribution_deadline"):
            if s.get(key) and not v.get("deadline_provenance"):
                defects.append(f"{sid}: carries {key} with no deadline_provenance saying where the date came from")
        for g in s.get("goals_touched", []):
            if g.get("goal") not in goal_ids:
                defects.append(f"{sid}: raises goal {g.get('goal')!r}, which is not in goals.json")
            if not str(g.get("what_the_source_raises", "")).strip():
                defects.append(f"{sid}: goal {g.get('goal')!r} has no what_the_source_raises")
    return defects


def crosswalk(goals, sources):
    by_goal = {}
    for g in goals["goals"]:
        rows = []
        for s in sources:
            for t in s.get("goals_touched", []):
                if t.get("goal") == g["id"]:
                    rows.append({
                        "source_id": s["source_id"],
                        "source_name": s["name"],
                        "family": s.get("family"),
                        "effective_state": s.get("effective_state"),
                        "verification_state": (s.get("verification") or {}).get("state"),
                        "what_the_source_raises": t.get("what_the_source_raises"),
                    })
        if not rows:
            coverage = "NO_SOURCE"
        elif all(r["verification_state"] in UNVERIFIED for r in rows):
            coverage = "UNVERIFIED_ONLY"
        else:
            coverage = "HAS_A_VERIFIED_SOURCE"
        by_goal[g["id"]] = {
            "question": g["question"],
            "observable": g["observable"],
            "coverage": coverage,
            "sources": rows,
        }
    return by_goal


def selftest():
    goals = {"goals": [{"id": "only-goal", "question": "q", "observable": "o"}]}
    good = [{"source_id": "s1", "name": "n", "verification": {
        "state": "PRIMARY_SOURCE_FETCHED", "primary_artifact_fetched": True,
        "url": "https://example.invalid", "checked_at": "2026-09-17T00:00Z"},
        "goals_touched": [{"goal": "only-goal", "what_the_source_raises": "x"}]}]
    assert validate(goals, good) == [], "a well-formed source was reported as defective"
    checks = [
        ("invented goal", [{**good[0], "goals_touched": [{"goal": "not-a-goal", "what_the_source_raises": "x"}]}]),
        ("bad state", [{**good[0], "verification": {**good[0]["verification"], "state": "TOTALLY_FINE"}}]),
        ("fetched with no url", [{**good[0], "verification": {"state": "PRIMARY_SOURCE_FETCHED",
                                                              "primary_artifact_fetched": True,
                                                              "checked_at": "2026-09-17T00:00Z"}}]),
        ("deadline with no provenance", [{**good[0], "comment_deadline": "2026-10-20"}]),
        ("no checked_at", [{**good[0], "verification": {"state": "PRIMARY_SOURCE_FETCHED",
                                                        "primary_artifact_fetched": True,
                                                        "url": "https://example.invalid"}}]),
        ("empty what_the_source_raises", [{**good[0], "goals_touched": [{"goal": "only-goal", "what_the_source_raises": "  "}]}]),
    ]
    for label, bad in checks:
        assert validate(goals, bad), f"the validator did NOT catch: {label}"
    cw = crosswalk(goals, [])
    assert cw["only-goal"]["coverage"] == "NO_SOURCE", "a goal with no source was not reported as NO_SOURCE"
    unver = [{**good[0], "verification": {"state": "REPORTED_BY_SECONDARY_SOURCES", "checked_at": "2026-09-17T00:00Z"}}]
    assert crosswalk(goals, unver)["only-goal"]["coverage"] == "UNVERIFIED_ONLY", \
        "a goal covered only by an unverified source was not flagged"
    print(f"selftest OK: {len(checks)} defect rules each fire on a bad input and stay silent on a good one;")
    print("             a goal with no source reads NO_SOURCE and an unverified-only goal reads UNVERIFIED_ONLY")
    return 0


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--dir", default="measurement/crosswalk")
    ap.add_argument("--out")
    ap.add_argument("--selftest", action="store_true")
    a = ap.parse_args()
    if a.selftest:
        return selftest()

    d = pathlib.Path(a.dir)
    goals = json.loads((d / "goals.json").read_text())
    sources = [json.loads(p.read_text()) for p in sorted((d / "sources").glob("*.json"))]

    defects = validate(goals, sources)
    if defects:
        print(f"REFUSING to emit: {len(defects)} defect(s)")
        for x in defects:
            print("   " + x)
        return 2

    by_goal = crosswalk(goals, sources)
    from collections import Counter
    cov = Counter(v["coverage"] for v in by_goal.values())
    today = datetime.date.today().isoformat()
    deadlines = []
    for s in sources:
        for key in ("comment_deadline", "contribution_deadline"):
            if s.get(key):
                dd = datetime.date.fromisoformat(s[key])
                deadlines.append({
                    "source_id": s["source_id"], "kind": key, "date": s[key],
                    "days_remaining": (dd - datetime.date.today()).days,
                    "provenance": (s.get("verification") or {}).get("deadline_provenance"),
                })
    art = {
        "schema": "csoai.regulatory-crosswalk/0.1",
        "as_of": today,
        "what_this_is": ("Regulatory and assurance sources crosswalked against stable goal objects, so a "
                         "source changing state does not invalidate the map."),
        "what_this_is_not": goals["what_this_is_not"],
        "verification_states_explained": {
            "PRIMARY_SOURCE_FETCHED": "We retrieved the primary artifact ourselves.",
            "PRIMARY_ARTIFACT_FETCHED_DEADLINE_FROM_SECONDARY": "We hold the artifact, but a date on the row is not stated in it.",
            "REPORTED_BY_SECONDARY_SOURCES": "We have not retrieved a primary artifact. Anything published from such a row must say so.",
        },
        "totals": {
            "goals": len(by_goal),
            "sources": len(sources),
            "coverage": dict(sorted(cov.items())),
            "coverage_note": ("NO_SOURCE means no source in this crosswalk raises that goal. It does not mean the "
                              "goal is satisfied, and it does not mean no such source exists in the world."),
        },
        "deadlines": sorted(deadlines, key=lambda x: x["date"]),
        "sources": [{k: v for k, v in s.items() if k != "goals_touched"} for s in sources],
        "by_goal": by_goal,
    }
    art["content_digest"] = sha256b(canon({k: v for k, v in art.items() if k != "content_digest"}))
    out = a.out or f"public/interop/regulatory-crosswalk-{today}.json"
    pathlib.Path(out).write_text(json.dumps(art, indent=2) + "\n")
    print(f"goals {len(by_goal)}  sources {len(sources)}  coverage {dict(sorted(cov.items()))}")
    for x in art["deadlines"]:
        print(f"  deadline {x['date']}  {x['days_remaining']:>3}d  {x['source_id']}")
    print(f"written {out}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
