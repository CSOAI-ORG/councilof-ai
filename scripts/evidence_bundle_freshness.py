#!/usr/bin/env python3
"""Evidence-bundle freshness — a weekly watchdog over the four obligation bundles.

For each obligation (article-50, article-53, dora, cra) the live bundle endpoint is
read (preview=true: nothing is paid, nothing is signed) and the NEWEST relevant
card's as_of is compared against a 14-day floor.

States, per the estate's doctrine:
  FRESH    — newest relevant card as_of within 14 days.
  EMPTY    — the obligation's bundle holds zero relevant cards. An empty bundle is a
             first-class answer, never a failure and never a zero score; it is
             reported, not penalised. A bundle that was fresh and went empty is a
             different finding (see --previous).
  STALE    — newest relevant card older than the floor. This is the only failing
             state: evidence a buyer is being pointed at, past its re-measure date.
  UNREADABLE — the endpoint could not be read. A control plane that cannot answer
             is its own finding; reported, and it fails the run (a watchdog that
             cannot see must say so rather than pass).

Exit codes: 0 all fresh/empty · 3 any STALE · 4 any UNREADABLE.
"""

import json
import sys
import urllib.request
from datetime import datetime, timezone

BUNDLES = ("article-50", "article-53", "dora", "cra")
ENDPOINT = "https://councilof.ai/api/evidence-bundle?obligation={ob}&preview=true"
FLOOR_DAYS = 14


def read_bundle(ob):
    req = urllib.request.Request(ENDPOINT.format(ob=ob), headers={"User-Agent": "csoai-watchdog/1"})
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.load(r)


def newest_as_of(payload):
    cards = payload.get("cards") or []
    dates = []
    for c in cards:
        if isinstance(c, dict):
            body = c.get("card") if isinstance(c.get("card"), dict) else c
            as_of = body.get("as_of") or c.get("as_of")
            if as_of:
                dates.append(str(as_of))
    return max(dates) if dates else None


def main():
    now = datetime.now(timezone.utc)
    findings = []
    failed = 0
    for ob in BUNDLES:
        try:
            payload = read_bundle(ob)
        except Exception as exc:  # noqa: BLE001 — transport failures are findings, not crashes
            findings.append({"obligation": ob, "state": "UNREADABLE", "error": str(exc)[:200]})
            failed = max(failed, 4)
            continue
        cards = payload.get("cards") or []
        count = payload.get("relevant_card_count")
        if not isinstance(count, (int, float)):
            count = len(cards)
        if count == 0:
            findings.append({"obligation": ob, "state": "EMPTY", "relevant": 0})
            continue
        newest = newest_as_of(payload)
        if not newest:
            findings.append({"obligation": ob, "state": "EMPTY", "relevant": count})
            continue
        age_days = (now - datetime.fromisoformat(newest.replace("Z", "+00:00"))).days
        state = "FRESH" if age_days <= FLOOR_DAYS else "STALE"
        if state == "STALE":
            failed = max(failed, 3)
        findings.append({"obligation": ob, "state": state, "newest_as_of": newest, "age_days": age_days, "relevant": count})
    print(json.dumps({"schema": "csoai.evidence-bundle-freshness/0.1", "checked_at": now.isoformat(timespec="seconds"), "floor_days": FLOOR_DAYS, "findings": findings}, indent=1))
    sys.exit(failed)


if __name__ == "__main__":
    main()
