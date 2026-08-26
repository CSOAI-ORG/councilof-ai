#!/usr/bin/env python3
"""deadline_radar.py — deterministic GPU-free white-label deadline/exposure radar.

Mines a genuinely-new white-label finding from the LIVE signed regulation feed (20
deadlines across 14 jurisdictions/instruments). It ranks every deadline by two objective
axes the white-label "sort every compliance problem + fine exposure before anyone is
contacted" promise needs:
  - URGENCY  : days until the deadline (sooner = more urgent), clamped to the horizon.
  - SEVERITY : a deterministic ordinal parsed from the published penalty tier
               (7%/€35M=5, 3%/€15M=4, 2.5%/CRA=3, USD-fixed=2, no-fixed-cap=1, other=1).
The radar orders by urgency and shows severity + the penalty tier verbatim.

Honesty: derived strictly from the published, cited `penalty_exposure` strings + dates.
Severity is a deterministic ORDINAL ranking of published maxima — NOT a fine prediction,
NOT legal opinion, NOT advice. Dates are read verbatim from the feed (not assumed).

Usage: python3 deadline_radar.py [--json]
"""
import argparse, json, sys, urllib.request
from datetime import date, datetime

REG = "https://councilof.ai/api/regulation"

def get(url):
    return json.loads(urllib.request.urlopen(urllib.request.Request(
        url, headers={"User-Agent": "csoai-deadline-radar/0.1"}), timeout=20).read())

def severity(pe):
    p = pe.lower()
    if "7%" in p or "35,000,000" in p:
        return 5
    if "3%" in p or "15,000,000" in p:
        return 4
    if "2.5%" in p or "cyber" in p:
        return 3
    if "$" in p or "usd" in p or "krw" in p:
        return 2
    if "no" in p and ("cap" in p or "statutory" in p):
        return 1
    return 1

def parse_date(s):
    try:
        return datetime.strptime(s, "%Y-%m-%d").date()
    except Exception:
        return None

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--json", action="store_true")
    a = ap.parse_args()
    r = get(REG)
    today = date.today()
    rows = []
    for dl in r.get("deadlines", []):
        d = parse_date(dl.get("date", ""))
        if d is None:
            continue
        urgency = max(0, (d - today).days)
        sev = severity(dl.get("penalty_exposure", ""))
        rows.append({
            "deadline": dl.get("date"),
            "instrument": dl.get("instrument"),
            "basis": (dl.get("basis") or dl.get("what") or "")[:90],
            "days_until": urgency,
            "severity": sev,     # 1..5 deterministic ordinal of published max
            "penalty_exposure": dl.get("penalty_exposure"),
        })
    rows.sort(key=lambda r: (r["days_until"], -r["severity"]))

    body = {
        "schema": "csoai.white-label-deadline-radar/0.1",
        "source": REG,
        "as_of": today.isoformat(),
        "n_deadlines": len(rows),
        "doctrine": ("Deterministic deadline/exposure radar from the signed regulation "
                     "feed. Measurement, not certification. NOT legal opinion, NOT a fine "
                     "prediction, NOT advice. severity is a deterministic ordinal (1-5) over "
                     "PUBLISHED statutary maxima; dates read verbatim from the feed."),
        "radar": rows,
        "summary": {"urgent_365": sum(1 for r in rows if r["days_until"] <= 365),
                    "severe_4plus": sum(1 for r in rows if r["severity"] >= 4)},
    }

    if a.json:
        print(json.dumps(body, indent=1, ensure_ascii=False))
        return

    print(f"deadline/exposure radar | as_of={today} | {len(rows)} deadlines (urgent<=365d: "
          f"{body['summary']['urgent_365']}, severity>=4: {body['summary']['severe_4plus']})")
    for r in rows[:14]:
        print(f"  {r['days_until']:>5}d  S{r['severity']}  {r['instrument'][:28]:<28} {r['penalty_exposure'][:42]}")

if __name__ == "__main__":
    main()
