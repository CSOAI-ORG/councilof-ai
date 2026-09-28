#!/usr/bin/env python3
"""Build the measurement.disclosure_lag capsule for the May 2026 Gemini cyber-evaluation access to three outside systems.

Second record in the disclosure-lag series (the first: build_capsule.py, the June 2026 Medicare statistics portal record).
Same method: every date carries its sources, every interval is computed here from the dates and never typed, a month-only
date yields a range and never a midpoint, and a date no source states is UNMEASURED.

Usage:
  build_capsule_gemini_evaluation.py SNAPSHOTS.json OUT.json [EVIDENCE_DIR]

SNAPSHOTS.json: 2026-09-gemini-evaluation.snapshots.json (url, access time, HTTP status, bytes and sha256 of each source
response). EVIDENCE_DIR, when given, holds the captured bytes as S<n>.bin: each file must hash to its manifest sha256 and
every quote must appear verbatim in its visible text, or the build fails. The captures are not published (third-party pages).
"""
import datetime as dt, hashlib, html, json, os, re, sys

import rfc8785

SNAP = {s["id"]: s for s in json.load(open(sys.argv[1]))}
OUT = sys.argv[2]
EVIDENCE = sys.argv[3] if len(sys.argv) > 3 else None

# Source metadata as printed on each page (publisher, title, publication time as the page states it).
SOURCES = {
    "S1": ("The Wall Street Journal", "Gemini Hacked Three Companies in First Known Breakout by Google's AI",
           "2026-09-18T22:10:00Z (page metadata)", "PRESS_FIRST_REPORT"),
    "S2": ("Reuters (via Yahoo Finance)", "Gemini hacked three companies in first known breakout by Google's AI, WSJ reports",
           "2026-09-18T22:48:42Z (page metadata)", "PRESS"),
    "S3": ("CNBC", "Google's Gemini becomes latest AI model to break out and hack computer systems",
           "2026-09-19T00:50:13Z (page metadata)", "PRESS"),
    "S4": ("NBC News", "Google says its AI model gained unauthorized access to three outside systems",
           "Sept. 18, 2026, 9:37 PM EDT (2026-09-19T01:37Z)", "PRESS"),
    "S5": ("CNN Business", "Gemini hacked three companies in first known breakout by Google's AI",
           "Sep 19, 2026, 8:44 AM ET", "PRESS"),
    "S6": ("TechCrunch", "Google's Gemini is the latest AI model to hack other companies",
           "10:30 AM PDT, September 19, 2026", "PRESS"),
    "S7": ("The Next Web", "Irregular told four AI labs in late July that their models had breached systems during its tests",
           "September 19, 2026, 7:58 am UTC", "PRESS"),
    "S8": ("SecurityWeek", "Google Confirms Gemini AI Breached Three Firms", "2026-09-21T07:20:46Z (page metadata)", "PRESS"),
    "S9": ("ABC News (Australia)", "Gemini hacked three companies in first known breakout by Google's AI",
           "Sat 19 Sep 2026 at 2:37pm AEST", "PRESS"),
    "S10": ("Irregular (the testing firm)", "Addressing Recent Incidents: Ongoing Findings and Path Forward",
            "August 14, 2026", "TESTING_FIRM"),
}
USE = [f"S{i}" for i in range(1, 11)]


def src(i):
    pub, title, printed, kind = SOURCES[i]
    n = SNAP[i]
    return {"id": i, "url": n["url"], "publisher": pub, "title": title, "published_as_printed": printed,
            "accessed_utc": n["snapshot_at"], "http_status": n["http_status"],
            "response_sha256": n["sha256"] if n["bytes"] else None, "response_bytes": n["bytes"], "kind": kind}


EVENTS = [
    {"event": "incident_date", "label": "REPORTED", "date": "2026-05", "granularity": "month",
     "statement": "The model's access to the three outside systems happened in May 2026, per Google's statement as reported by the press.",
     "quotes": [["S1", "occurred in May as part of a test run by the company Irregular"],
                ["S4", "in May its AI model gained unauthorized access to three outside systems"],
                ["S3", "Google said the incident happened in May"]],
     "note": "Month only. No source read gives a day, and no Google publication about this incident was found."},
    {"event": "vendor_notified", "label": "REPORTED", "date": "2026-07", "granularity": "month (stated as 'late July')",
     "statement": "The testing firm told Google in late July 2026, per Google and the testing firm's spokesperson as reported by the press.",
     "quotes": [["S3", "it was notified by Irregular in late July"],
                ["S3", "All relevant labs were notified in late July"],
                ["S8", "Irregular notified Google at the end of July"],
                ["S4", "did not learn about the intrusions until July"]],
     "note": "'Late July' is not narrowed to days here: the intervals use the whole month, so they are wider than 'late July' "
             "would make them, never narrower. The testing firm's own post (S10) names no customer and gives no date for its notice to Google."},
    {"event": "affected_entities_notified", "label": "UNMEASURED", "date": None, "granularity": None,
     "statement": "Google and the testing firm say the three affected organisations were told; no source read gives the date.",
     "quotes": [["S3", "affected entities were contacted as part of the investigation"],
                ["S8", "We ensured the three entities were made aware"]],
     "note": "The affected organisations are not named in any source read."},
    {"event": "authorities_notified", "label": "UNMEASURED", "date": None, "granularity": None,
     "statement": "Google says it told federal authorities; no source read gives the date or names the authority.",
     "quotes": [["S4", "told federal authorities about the hacks"],
                ["S8", "notified federal authorities and the three affected companies"]],
     "note": None},
    {"event": "testing_firm_post", "label": "PRIMARY", "date": "2026-08-14", "granularity": "day",
     "statement": "The testing firm published an account of the underlying evaluation-environment issue; it names no customer and no model.",
     "quotes": [["S10", "all subsequent public disclosures refer to the same underlying issue"]],
     "note": "Not treated as public disclosure of this incident: it does not name Google or Gemini (see 'Where sources differ')."},
    {"event": "press_inquiry", "label": "UNMEASURED", "date": None, "granularity": None,
     "statement": "The press reports that the confirmation followed an inquiry from the Wall Street Journal; no source read dates the inquiry.",
     "quotes": [["S6", "did not confirm them publicly until Friday, after the WSJ reached out"]],
     "note": "Recorded as reported. This record draws no inference from the sequence."},
    {"event": "public_disclosure", "label": "REPORTED", "date": "2026-09-18", "granularity": "day (US date; also the UTC date)",
     "statement": "The first public record naming Google: the Wall Street Journal's report of Friday 18 September 2026, with Google's confirmation the same day.",
     "quotes": [["S1", "The hacks, which the company confirmed on Friday"],
                ["S4", "The intrusions were reported earlier Friday by The Wall Street Journal"],
                ["S2", "the Wall Street Journal reported on Friday"],
                ["S3", "The Wall Street Journal first reported the security incident."]],
     "note": "Friday = 2026-09-18. The report's page metadata gives 2026-09-18T22:10:00Z (18:10 EDT), so the US and UTC dates agree."},
    {"event": "earliest_press_report_read", "label": "REPORTED", "date": "2026-09-18T22:10Z", "granularity": "minute",
     "statement": "Earliest report among the pages read: the Wall Street Journal, 2026-09-18T22:10:00Z by its page metadata.",
     "quotes": [["S1", "Gemini Hacked Three Companies in First Known Breakout by Google's AI"]],
     "note": "Time from the page's datePublished metadata, not its visible text. Only among pages read."},
    {"event": "vendor_public_statement", "label": "REPORTED", "date": "2026-09-18", "granularity": "day",
     "statement": "Google's statement reached the public through the press; no Google publication about this incident was found.",
     "quotes": [["S3", "Google said on Friday that its Gemini model had hacked three other companies"]],
     "note": "Statements by Google's vice president of security engineering were given to several outlets (S3, S4, S8)."},
    {"event": "activity_stopped", "label": "UNMEASURED", "date": None, "granularity": None,
     "statement": "Google says the model stopped in each of the three cases; no source read states when.",
     "quotes": [["S3", "In all three of these instances, the model stopped."]], "note": None},
]

EV = {e["event"]: e for e in EVENTS}


def bounds(s):
    """A day is its own bounds; a month YYYY-MM spans its first to its last day."""
    if len(s) == 7:
        y, m = map(int, s.split("-"))
        first = dt.date(y, m, 1)
        last = (dt.date(y + (m == 12), m % 12 + 1, 1) - dt.timedelta(days=1))
        return first, last
    d = dt.date.fromisoformat(s[:10])
    return d, d


def interval(iid, a, b, basis):
    ea, eb = EV[a], EV[b]
    if ea["date"] is None or eb["date"] is None:
        return {"id": iid, "from": a, "to": b, "days": None, "state": "UNMEASURED", "basis": basis}
    (a0, a1), (b0, b1) = bounds(ea["date"]), bounds(eb["date"])
    both_primary = ea["label"] == "PRIMARY" and eb["label"] == "PRIMARY"
    if a0 == a1 and b0 == b1:
        return {"id": iid, "from": a, "to": b, "days": (b0 - a0).days,
                "state": "MEASURED" if both_primary else "REPORTED", "basis": basis}
    return {"id": iid, "from": a, "to": b, "days": None, "days_range": [(b0 - a1).days, (b1 - a0).days],
            "state": "MEASURED_RANGE" if both_primary else "REPORTED_RANGE", "basis": basis}


INTERVALS = [
    interval("incident_to_vendor_notified", "incident_date", "vendor_notified",
             "REPORTED month to REPORTED month ('late July' taken as the whole of July)"),
    interval("vendor_notified_to_public_disclosure", "vendor_notified", "public_disclosure",
             "REPORTED month to REPORTED day ('late July' taken as the whole of July)"),
    interval("incident_to_public_disclosure", "incident_date", "public_disclosure", "REPORTED month to REPORTED day"),
    interval("vendor_notified_to_affected_entities_notified", "vendor_notified", "affected_entities_notified",
             "no source dates the notice to the affected organisations"),
    interval("vendor_notified_to_authorities_notified", "vendor_notified", "authorities_notified",
             "no source dates the notice to federal authorities"),
    interval("press_inquiry_to_public_disclosure", "press_inquiry", "public_disclosure", "no source dates the press inquiry"),
    interval("incident_to_activity_stopped", "incident_date", "activity_stopped", "no source states when access ended"),
]

CONFLICTS = [
    {"topic": "what counts as the first public disclosure",
     "variants": [["S10", "the testing firm's post of 14 August 2026 describes the underlying issue and names no customer or model"],
                  ["S1", "the Wall Street Journal's report of 18 September 2026 is the first public record read that names Google"]],
     "handling": "public_disclosure is the first public record naming Google (18 September); the 14 August post is carried as its own event and used in no interval"},
    {"topic": "how late in July",
     "variants": [["S3", "'late July' (Google and the testing firm's spokesperson)"], ["S8", "'the end of July' (SecurityWeek's wording)"]],
     "handling": "no day is stated by anyone; the whole month is used, so the ranges are wider than either wording, never narrower"},
    {"topic": "roughly how long between notice and disclosure",
     "variants": [["S7", "one outlet gives 'about seven weeks' for Google's gap between notification and disclosure"]],
     "handling": "not used: it rests on 'late July' read as a day; the record gives the range the stated dates support"},
]

DECLARED = {
    "who": "the vendor (Google)",
    "published_by_vendor": False,
    "channel": "statements by a Google spokesperson and by Google's vice president of security engineering, quoted by the press on "
               "2026-09-18 and after; no Google publication about this incident was found",
    "timeline": [{"event": "incident_date", "as_stated": "May 2026", "sources": ["S3", "S4"]},
                 {"event": "vendor_notified", "as_stated": "late July 2026, by the testing firm", "sources": ["S3", "S4"]},
                 {"event": "affected_entities_notified", "as_stated": "the three entities were made aware (no date)", "sources": ["S8"]},
                 {"event": "authorities_notified", "as_stated": "federal authorities were told (no date)", "sources": ["S4", "S8"]},
                 {"event": "public_disclosure", "as_stated": "confirmed on Friday 18 September 2026", "sources": ["S1", "S3"]}],
    "stated_reason_for_timing": [["S9", "didn't consider it necessary to disclose the incidents earlier"]],
    "label": "REPORTED (the vendor's account reaches the record only through the press)",
}

DVO = [
    {"event": "incident_date", "declared": "May 2026", "observed": "2026-05 (REPORTED; no independent dated source)", "agrees": "UNCHECKABLE"},
    {"event": "vendor_notified", "declared": "late July 2026",
     "observed": "late July 2026 (REPORTED; the testing firm's spokesperson says the same)", "agrees": "consistent (both REPORTED)"},
    {"event": "public_disclosure", "declared": "Friday 18 September 2026",
     "observed": "2026-09-18T22:10Z (the report's page metadata)", "agrees": True},
]

NOT_ESTABLISHED = [
    "No finding of wrongdoing by anyone, and no rating, grade or score of Google, the testing firm or any affected organisation.",
    "Nothing about whether, when or to whom disclosure was required: the record states dates, not obligations.",
    "Nothing about intent, diligence, harm, the causes of the incident or the security of any system.",
    "The identity of the three affected organisations, which no source read names.",
    "Any comparison with other companies' disclosures of related incidents.",
]

REPLY = ("Right of reply: Google, the testing firm, any affected organisation or anyone named in a source may send a reply or a "
         "correction; a reply is linked beside this record, and a correction is dated in the corrections ledger.")

sources = [src(i) for i in USE]
measured = [i["id"] for i in INTERVALS if i["state"].startswith("MEASURED")]
capsule = {
    "schema": "csoai.measurement-capsule/0.2",
    "kind": "measurement.disclosure_lag",
    "subject_id": "incident.2026-05.gemini-cyber-evaluation.outside-system-access",
    "authority_state": "NONE: measurement only; this capsule grants and records no execution authority",
    "claim": {"statement": "the dated public record of this incident, and the whole days between its dated events",
              "self_or_external": "EXTERNAL",
              "doctrine": "Measurement, not endorsement or accusation. This record states dates and the days between them as the public "
                          "record gives them: observed continuity, no allegation implied. It does not characterise anyone's intent, "
                          "diligence or compliance, and it scores no company."},
    "incident_as_described": {
        "by_vendor_as_reported": ("During a capture-the-flag cyber evaluation run by a third-party testing firm, a Gemini model reached "
                                  "the internet and accessed protected systems of three outside organisations, once by guessing a "
                                  "password and twice with credentials found in a public repository; Google says the model stopped "
                                  "in each case. (S3, S4, S8: statements quoted by the press)"),
        "by_testing_firm": ("The testing firm says internet access was unintentionally available in one evaluation environment and "
                            "that the disclosures by several labs refer to the same underlying issue. (S10, and its spokesperson in S3)")},
    "declared": DECLARED,
    "observed": {"events": EVENTS, "intervals": INTERVALS, "conflicts": CONFLICTS, "declared_vs_observed": DVO},
    "measurement_state": "REPORTED",
    "measurement_state_note": ("No interval is MEASURED: none of the dates that bound an interval appears in a publication by Google, "
                               "the testing firm, an affected organisation or an authority. Three intervals are REPORTED_RANGE (month-level "
                               "dates from statements quoted by the press); four are UNMEASURED."),
    "not_established": NOT_ESTABLISHED,
    "right_of_reply": REPLY,
    "labels": {"PRIMARY": "stated in a publication by Google, the testing firm, an affected organisation or a public authority",
               "REPORTED": "stated only by the press, including the press quoting a spokesperson or an executive",
               "UNMEASURED": "no source read states it; never estimated"},
    "sources": sources,
    "method": ("Web search for Google's statement, the Wall Street Journal's report, any testing-firm, affected-company or regulator "
               "statement and further independent reports; each source fetched and its response hashed (response_sha256) on "
               "2026-09-28; each date taken only from a quoted sentence or, for publication times, the page's own metadata; intervals "
               "are whole calendar days between dates (date(b) - date(a)); a month-only date yields a range, never a midpoint."),
    "limitations": [
        "No Google publication about this incident was found; Google's account is known only through statements quoted by the press.",
        "The testing firm's own post (S10) predates Google's confirmation and names no customer; it dates nothing specific to Google.",
        "No affected-company or regulator statement was found; the affected organisations are unnamed in every source read.",
        "The Wall Street Journal page read shows only the opening of the report; later paragraphs were not read and are not relied on.",
        "Press pages change; the response_sha256 values identify the bytes read on 2026-09-28, not the pages' current state.",
        "Some pages were blocked to this capture (Axios, GV Wire, HTTP 403) and are not relied on."],
    "objection_route": "https://councilof.ai/census/",
    "correction_pointer": None,
    "observed_at": max(s["accessed_utc"] for s in sources),
    "publication": "PRIVATE: OWNER-APPROVE required before any publication (sensitive topic naming a company).",
}
assert not measured, measured


def visible_text(path):
    t = open(path, "rb").read().decode("utf-8", "replace")
    t = re.sub(r"<script.*?</script>", " ", t, flags=re.S)
    t = re.sub(r"<style.*?</style>", " ", t, flags=re.S)
    t = html.unescape(re.sub(r"<[^>]+>", " ", t))
    t = re.sub("[​-‏⁠-⁤﻿]", "", t)
    for a, b in (("’", "'"), ("‘", "'"), ("“", '"'), ("”", '"'), ("—", "-"), ("–", "-"), (" ", " ")):
        t = t.replace(a, b)
    return re.sub(r"\s+", " ", t)


quotes = [(q[0], q[1]) for e in EVENTS for q in e["quotes"]] + list(map(tuple, DECLARED["stated_reason_for_timing"]))
for _, q in quotes:
    assert len(q.split()) < 15, f"quote over 14 words: {q}"
if EVIDENCE:
    for i in USE:
        b = open(os.path.join(EVIDENCE, f"{i}.bin"), "rb").read()
        assert hashlib.sha256(b).hexdigest() == SNAP[i]["sha256"], f"{i}: captured bytes do not match the manifest"
    missing = [(i, q) for i, q in quotes if q not in visible_text(os.path.join(EVIDENCE, f"{i}.bin"))]
    assert not missing, f"quotes not found verbatim: {missing}"
    capsule["quote_check"] = f"{len(quotes)}/{len(quotes)} quotes found verbatim in the visible text of the captured bytes"

body = rfc8785.dumps(capsule)
capsule["capsule_id"] = hashlib.sha256(body).hexdigest()
record = {
    "schema": "csoai.measurement-capsule-batch/0.2", "as_of": capsule["observed_at"], "capsule_schema": "csoai.measurement-capsule/0.2",
    "adapter": "disclosure_lag", "kind": "measurement.disclosure_lag", "n_capsules": 1,
    "capsule_id_rule": "sha256 of the RFC 8785 (JCS) bytes of the capsule without its capsule_id field",
    "publication": capsule["publication"],
    "capsules": [capsule],
}
open(OUT, "w").write(json.dumps(record, indent=1, ensure_ascii=False) + "\n")
print(json.dumps({"out": OUT, "capsule_id": capsule["capsule_id"], "quote_check": capsule.get("quote_check"),
                  "intervals": {i["id"]: i.get("days") if i.get("days") is not None else i.get("days_range") for i in INTERVALS}}, indent=1))
