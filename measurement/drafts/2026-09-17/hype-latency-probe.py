#!/usr/bin/env python3
"""RCCL/0.1 — Regulatory Claim-to-Calendar Latency: the official-source side.

Companion to card-regulatory-claim-calendar-latency-instrument-unsigned.json.

This performs steps R1 and R3 of the instrument for the SEC: fetch the pinned
calendar of record and docket of record, extract every scheduled item, and test
an asserted subject against the published titles ONLY.

It deliberately does NOT decide the verdict for you when the answer is not clean.
It reports NOT_ON_CALENDAR, CORROBORATED, or UNCHECKABLE with the condition code,
and it never guesses what a Closed Meeting is about.

The claim side (admissibility A1-A5) needs a captured post artifact and is not
automated here — pass the claim's UTC post time with --claim-post to compute
L_reach, and omit it to have L_reach reported as UNDEFINED rather than zero.

Usage:
    python3 hype-latency-probe.py --subject crypto --asserted-date 2026-09-17
    python3 hype-latency-probe.py --subject crypto --asserted-date 2026-09-17 \
        --claim-post 2026-09-16T14:00:00Z

Exit codes: 0 probe completed (any verdict), 2 a source of record was unreachable.
"""
import argparse
import datetime as dt
import html
import json
import re
import sys
import urllib.request

# Sources pinned BEFORE observation. Changing these changes the instrument, not
# just the run — see step_2_official_source_of_record in the card.
SOURCES = {
    "SEC": {
        "calendar_of_record": "https://www.sec.gov/newsroom/meetings-events",
        "docket_of_record": "https://www.sec.gov/rules-regulations/rulemaking-activity",
    }
}
UA = "CSOAI-measure/0.1 (+https://councilof.ai; nicholas@csoai.org)"
MONTHS = {m: i for i, m in enumerate(
    ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"], 1)}


def now():
    return dt.datetime.now(dt.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def fetch(url):
    """Return (text, http_status, effective_url, fetched_at). Never raises on HTTP error."""
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    ts = now()
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            return r.read().decode("utf-8", "replace"), r.status, r.geturl(), ts
    except Exception as e:  # noqa: BLE001 - failure state is data, not an exception to hide
        return None, getattr(e, "code", None), url, ts


def visible_lines(raw):
    t = re.sub(r"(?is)<script.*?</script>", " ", raw)
    t = re.sub(r"(?is)<style.*?</style>", " ", t)
    t = re.sub(r"(?s)<[^>]+>", "\n", t)
    return [l.strip() for l in html.unescape(t).split("\n") if l.strip()]


def parse_calendar(lines, year):
    """Extract scheduled items. The page renders each as: Mon / DD / time / type / title."""
    items = []
    for i, l in enumerate(lines):
        if l in MONTHS and i + 3 < len(lines) and re.fullmatch(r"\d{1,2}", lines[i + 1] or ""):
            time_s, type_s = lines[i + 2], lines[i + 3]
            if not re.match(r"^\d{1,2}:\d{2}\s*(AM|PM)", time_s):
                continue
            title = lines[i + 4] if i + 4 < len(lines) else ""
            items.append({
                "date": f"{year}-{MONTHS[l]:02d}-{int(lines[i + 1]):02d}",
                "time": time_s, "type": type_s, "title": title,
            })
    return items


def classify(items, subject, asserted_date):
    """R2/R4. Title-only matching. Closed sessions raise U1 rather than being read into."""
    on_date = [x for x in items if x["date"] == asserted_date]
    pat = re.compile(subject, re.I)
    matched = [x for x in on_date if pat.search(x["title"])]
    closed = [x for x in on_date if re.search(r"(?i)closed meeting", x["title"])]
    if matched:
        return "CORROBORATED", None, matched, closed
    if closed:
        # The calendar shows no matching title, and also shows an item with no
        # published subject at all. Both facts are reported; neither is suppressed.
        return "NOT_ON_CALENDAR", "U1_closed_session", [], closed
    return "NOT_ON_CALENDAR", None, [], []


def find_docket_rows(lines, subject):
    pat = re.compile(subject, re.I)
    out = []
    for i, l in enumerate(lines):
        if pat.search(l) and not re.search(r"(?i)task force", l):
            out.append(" | ".join(lines[max(0, i - 3):i + 4]))
    return out[:10]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--regulator", default="SEC", choices=sorted(SOURCES))
    ap.add_argument("--subject", required=True, help="regex tested against published titles only")
    ap.add_argument("--asserted-date", required=True, help="YYYY-MM-DD, resolved from the claim's own timestamp")
    ap.add_argument("--claim-post", default=None, help="claim publication time, UTC ISO8601")
    a = ap.parse_args()

    src = SOURCES[a.regulator]
    obs = {"instrument": "RCCL/0.1", "regulator": a.regulator, "probed_at": now(),
           "subject_pattern": a.subject, "asserted_date": a.asserted_date}

    cal_raw, cal_status, cal_eff, cal_ts = fetch(src["calendar_of_record"])
    obs["calendar_of_record"] = {"url": src["calendar_of_record"], "effective_url": cal_eff,
                                 "http": cal_status, "fetched_at": cal_ts}
    if cal_raw is None or cal_status != 200:
        # U4: a failed fetch is recorded as a failure, never inferred past.
        obs["verdict"] = "UNCHECKABLE"
        obs["uncheckable_condition"] = "U4_source_unreachable"
        print(json.dumps(obs, indent=2))
        return 2

    items = parse_calendar(visible_lines(cal_raw), int(a.asserted_date[:4]))
    verdict, cond, matched, closed = classify(items, a.subject, a.asserted_date)
    obs["calendar_of_record"]["items_scheduled"] = items
    obs["calendar_of_record"]["matching_items"] = matched
    obs["verdict"] = verdict
    if cond:
        obs["uncheckable_condition"] = cond
        obs["uncheckable_detail"] = (
            "A closed session is scheduled on the asserted date and publishes no agenda, so a claim "
            "referring to it can be neither confirmed nor refuted from public sources: "
            + json.dumps(closed))

    doc_raw, doc_status, doc_eff, doc_ts = fetch(src["docket_of_record"])
    obs["docket_of_record"] = {"url": src["docket_of_record"], "effective_url": doc_eff,
                               "http": doc_status, "fetched_at": doc_ts}
    if doc_raw and doc_status == 200:
        obs["docket_of_record"]["candidate_rows"] = find_docket_rows(visible_lines(doc_raw), a.subject)
    else:
        obs["docket_of_record"]["state"] = "FETCH_FAILED"

    # step_4. UNDEFINED is emitted as the string UNDEFINED. Never 0, never null-as-zero.
    if a.claim_post:
        t0 = dt.datetime.fromisoformat(a.claim_post.replace("Z", "+00:00"))
        t1 = dt.datetime.fromisoformat(a.asserted_date + "T00:00:00+00:00")
        obs["L_reach_hours"] = round((t1 - t0).total_seconds() / 3600, 2)
    else:
        obs["L_reach_hours"] = "UNDEFINED"
        obs["L_reach_note"] = "no claim post timestamp supplied (admissibility A2 not met)"

    obs["L_official_hours"] = "UNDEFINED" if verdict != "CORROBORATED" else "SEE_CALENDAR_ITEM"
    obs["L_official_note"] = ("No matching official item; per the instrument this is UNDEFINED and MUST "
                              "NOT be recorded as 0 or aggregated into any distribution.")
    obs["attestation"] = {"signed": False, "note": "probe output is an observation stub, not a signed card"}
    print(json.dumps(obs, indent=2))
    return 0


if __name__ == "__main__":
    sys.exit(main())
