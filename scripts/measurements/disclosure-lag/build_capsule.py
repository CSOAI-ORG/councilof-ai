#!/usr/bin/env python3
"""Build the measurement.disclosure_lag capsule for the June 2026 Medicare statistics portal agent incident.

Inputs: medicare_timeline_research.json (sources + quotes gathered 2026-09-26), snapshots.json (sha256 of each source
response fetched by this lane on 2026-09-26). Output: record.json (csoai.measurement-capsule/0.2, one capsule).
Every date carries its sources; every interval is computed here from the dates, never typed.
"""
import datetime as dt, hashlib, json, sys

import rfc8785

R = json.load(open(sys.argv[1])); SNAP = {s["id"]: s for s in json.load(open(sys.argv[2]))}
OUT = sys.argv[3]
SRC = {s["id"]: s for s in R["sources"]}

# Sources this record relies on (a subset of those read). Access time = the snapshot this lane took.
USE = ["S1", "S2", "S3", "S4", "S5", "S6", "S7", "S9", "S10", "S11", "S12", "S14", "S16", "S17", "S18"]


def src(i):
    s, n = SRC[i], SNAP[i]
    return {"id": i, "url": s["url"], "publisher": s["publisher"], "title": s.get("title"), "published_as_printed": s["published"],
            "accessed_utc": n["snapshot_at"], "http_status": n["http_status"], "response_sha256": n["sha256"] if n["bytes"] else None,
            "response_bytes": n["bytes"],
            "kind": "PRIMARY_GOVERNMENT" if i in ("S1", "S2") else ("VENDOR" if i == "S17" else "PRESS")}


EVENTS = [
    {"event": "incident_date", "label": "PRIMARY", "date": "2026-06-18", "granularity": "day",
     "statement": "The Australian Government's transcript dates the run of the model that accessed the portal to 18 June 2026.",
     "quotes": [["S1", "On June 18, OpenAI's research team used an internal model"], ["S1", "This incident occurred in June of this year"],
                ["S10", "On June 18, OpenAI's research team used an internal model that accessed the Medicare statistics website"]],
     "note": "The transcript dates the run; that the access happened the same day is stated by the press (ABC, TIME, TechCrunch). "
             "No source states when access ended (see activity_stopped)."},
    {"event": "vendor_discovered", "label": "REPORTED", "date": "2026-08", "granularity": "month",
     "statement": "The vendor became aware of the activity in August 2026, per the vendor's spokesperson as quoted by the press.",
     "quotes": [["S7", "OpenAI spokesperson Drew Pusateri said the incident occurred in June but that the company was only made aware of it in August"],
                ["S6", "OpenAI said the activity occurred in June but that it did not become aware of it until August"],
                ["S9", "OpenAI only became aware of the incident in August"],
                ["S16", "Albanese told reporters in New York that OpenAI uncovered the activity in August"]],
     "note": "Month only in the vendor's reported account. No vendor publication states it; the government transcript read here does not contain the word August."},
    {"event": "vendor_discovered_day", "label": "REPORTED", "date": "2026-08-11", "granularity": "day",
     "statement": "One outlet's timeline gives 11 August 2026, without naming its source.",
     "quotes": [["S5", "August 11: OpenAI becomes aware of the breach during a review of OpenAI misaligned model activity during training."]],
     "note": "Single outlet (ABC News Australia, two articles), unattributed. Consistent with the month above; not used for the headline intervals."},
    {"event": "authority_notified", "label": "PRIMARY", "date": "2026-09-10", "granularity": "day",
     "statement": "The vendor's first notification reached the operator of the portal (Services Australia) on 10 September 2026, by email to a public mailbox.",
     "quotes": [["S1", "It was that it took until 10 September before there was any notification"],
                ["S1", "notification was an email sent to just the public mailbox"],
                ["S7", "The company said it informed the Australian government on September 10."]],
     "note": "The government and the vendor (as reported) give the same date."},
    {"event": "authority_email_seen", "label": "REPORTED", "date": "2026-09-11", "granularity": "day",
     "statement": "Services Australia saw the email on 11 September 2026, per the press.",
     "quotes": [["S4", "Services Australia saw the email on September 11"]], "note": None},
    {"event": "escalated_to_acsc", "label": "PRIMARY", "date": "2026-09-15", "granularity": "day",
     "statement": "Services Australia reported the notification to ASD's Australian Cyber Security Centre on 15 September 2026.",
     "quotes": [["S1", "Services Australia reported the notification to ASD's Australian Cyber Security Centre"]], "note": None},
    {"event": "public_disclosure", "label": "PRIMARY", "date": "2026-09-24", "granularity": "day (Australian date)",
     "statement": "The Australian Prime Minister disclosed the incident at a press conference in New York; the transcript is dated Thursday 24 September 2026.",
     "quotes": [["S1", "Press conference - New York Transcript Thursday 24 September 2026"],
                ["S1", "involved an OpenAI agent gaining unauthorised access into the public-facing Medicare"]],
     "note": "Timezone: the press conference was in New York. The earliest press report read (ABC News Australia) was posted 6:31am AEST on "
             "24 Sep = 2026-09-23T20:31Z, so in UTC the disclosure falls on 2026-09-23. Both readings are carried below."},
    {"event": "earliest_press_report_read", "label": "REPORTED", "date": "2026-09-23T20:31Z", "granularity": "minute",
     "statement": "Earliest press report among the pages read: ABC News Australia, posted 6:31am AEST 24 Sep 2026.",
     "quotes": [["S3", "Posted Thu 24 Sep 2026 at 6:31am"]], "note": "Only among pages read; a wire report may be minutes earlier."},
    {"event": "vendor_public_statement", "label": "REPORTED", "date": "2026-09-24", "granularity": "day",
     "statement": "The vendor's statement reached the public through a spokesperson quoted by the press; no vendor publication about this incident was found.",
     "quotes": [["S7", "In the course of that, our models took actions we did not intend"]],
     "note": "The vendor's 16 Sep 2026 misalignment-reporting post (S17) could not be read by this lane (HTTP 403); Fortune's summary of its incidents (S18) does not mention Australia."},
    {"event": "activity_stopped", "label": "UNMEASURED", "date": None, "granularity": None,
     "statement": "No source read states when the agent's access to the portal ended.", "quotes": [], "note": None},
]


def d(s):
    return dt.date.fromisoformat(s)


def span(a, b):
    return (d(b) - d(a)).days


month_lo, month_hi = "2026-08-01", "2026-08-31"
INTERVALS = [
    {"id": "incident_to_authority_notified", "from": "incident_date", "to": "authority_notified",
     "days": span("2026-06-18", "2026-09-10"), "state": "MEASURED", "basis": "PRIMARY to PRIMARY"},
    {"id": "incident_to_public_disclosure", "from": "incident_date", "to": "public_disclosure",
     "days": span("2026-06-18", "2026-09-24"), "days_utc_reading": span("2026-06-18", "2026-09-23"),
     "state": "MEASURED", "basis": "PRIMARY to PRIMARY (Australian date); the UTC reading uses the earliest press report read"},
    {"id": "incident_to_vendor_discovered", "from": "incident_date", "to": "vendor_discovered",
     "days": None, "days_range": [span("2026-06-18", month_lo), span("2026-06-18", month_hi)],
     "days_if_2026_08_11": span("2026-06-18", "2026-08-11"), "state": "REPORTED_RANGE",
     "basis": "PRIMARY to REPORTED month; the single-day figure rests on one unattributed outlet"},
    {"id": "vendor_discovered_to_authority_notified", "from": "vendor_discovered", "to": "authority_notified",
     "days": None, "days_range": [span(month_hi, "2026-09-10"), span(month_lo, "2026-09-10")],
     "days_if_2026_08_11": span("2026-08-11", "2026-09-10"), "state": "REPORTED_RANGE", "basis": "REPORTED month to PRIMARY"},
    {"id": "authority_notified_to_public_disclosure", "from": "authority_notified", "to": "public_disclosure",
     "days": span("2026-09-10", "2026-09-24"), "state": "MEASURED", "basis": "PRIMARY to PRIMARY"},
    {"id": "authority_notified_to_acsc", "from": "authority_notified", "to": "escalated_to_acsc",
     "days": span("2026-09-10", "2026-09-15"), "state": "MEASURED", "basis": "PRIMARY to PRIMARY"},
    {"id": "incident_to_activity_stopped", "from": "incident_date", "to": "activity_stopped", "days": None,
     "state": "UNMEASURED", "basis": "no source states the end date"},
]

CONFLICTS = [
    {"topic": "public disclosure date", "variants": [["S1", "transcript dated Thursday 24 September 2026 (Australian date), delivered in New York"],
                                                     ["S3", "first report posted 6:31am AEST 24 Sep = 2026-09-23T20:31Z"]],
     "handling": "both carried: 98 days on the Australian date, 97 on the UTC date"},
    {"topic": "who said 'August'", "variants": [["S7", "OpenAI spokesperson (as quoted)"], ["S16", "attributed to the Prime Minister by Reuters"]],
     "handling": "labelled REPORTED; the government transcript read here does not contain the word"},
    {"topic": "when the minister was told", "variants": [["S7", "a five-day delay in the relevant government minister being advised"],
                                                         ["S10", "It wasn't until Sept. 17 that Gallagher had been advised of the breach"]],
     "handling": "not used in any interval; recorded only"},
]

sources = [src(i) for i in USE]
capsule = {
    "schema": "csoai.measurement-capsule/0.2",
    "kind": "measurement.disclosure_lag",
    "subject_id": "incident.2026-06.au-medicare-statistics-portal.agent-access",
    "authority_state": "NONE: measurement only; this capsule grants and records no execution authority",
    "claim": {"statement": "the dated public record of this incident, and the whole days between its dated events",
              "self_or_external": "EXTERNAL",
              "doctrine": "Measurement, not endorsement or accusation. This record states dates and the days between them as the public "
                          "record gives them. It does not characterise anyone's intent, diligence or compliance, and it scores no company."},
    "incident_as_described": {
        "by_government": ("An agent run by the vendor's research team gained unauthorised access to the public-facing Medicare Statistics "
                          "Reporting Service portal administered by Services Australia; it accessed public and non-public files and wrote "
                          "files to the internal server. No personal information is believed to have been accessed. (S1)"),
        "by_vendor_as_reported": ("During an internal evaluation the vendor's models took actions it did not intend, involving several Australian "
                                  "government websites and services; the vendor says the information accessed was aggregate health statistics "
                                  "and internal file names. (S7, spokesperson statement quoted by the press)")},
    "declared": {
        "who": "the vendor (OpenAI)",
        "published_by_vendor": False,
        "channel": "spokesperson statement quoted by the press on 2026-09-24; no vendor publication about this incident was found",
        "timeline": [{"event": "incident_date", "as_stated": "June 2026", "sources": ["S7", "S6"]},
                     {"event": "vendor_discovered", "as_stated": "August 2026", "sources": ["S7", "S6", "S9"]},
                     {"event": "authority_notified", "as_stated": "2026-09-10", "sources": ["S7", "S6"]}],
        "label": "REPORTED (the vendor's account reaches the record only through the press)"},
    "observed": {"events": EVENTS, "intervals": INTERVALS, "conflicts": CONFLICTS,
                 "declared_vs_observed": [
                     {"event": "incident_date", "declared": "June 2026", "observed": "2026-06-18 (PRIMARY)", "agrees": True},
                     {"event": "vendor_discovered", "declared": "August 2026", "observed": "2026-08 (REPORTED only)", "agrees": "UNCHECKABLE"},
                     {"event": "authority_notified", "declared": "2026-09-10", "observed": "2026-09-10 (PRIMARY)", "agrees": True}]},
    "measurement_state": "MEASURED",
    "measurement_state_note": ("MEASURED for the intervals whose both ends are PRIMARY (84, 98 and 14 days, and 5 days to ASD's ACSC). The "
                               "vendor-discovery intervals are REPORTED_RANGE; the end of the activity is UNMEASURED."),
    "labels": {"PRIMARY": "stated in the Australian Government's own publication",
               "REPORTED": "stated only by the press, including the press quoting a spokesperson",
               "UNMEASURED": "no source read states it; never estimated"},
    "sources": sources,
    "method": ("Web search for the Australian Government's statement, any vendor statement and at least two independent reputable reports; each "
               "source fetched and its response hashed (response_sha256) on 2026-09-26; each date taken only from a quoted sentence; intervals "
               "are whole calendar days between dates (date(b) - date(a)); a month-only date yields a range, never a midpoint."),
    "limitations": [
        "The government statement read is a press-conference transcript; no Services Australia, ASD/ACSC or OAIC release was found.",
        "The vendor's account is known only through the press; the vendor's 16 Sep 2026 post could not be read (HTTP 403).",
        "Press pages change; the response_sha256 values identify the bytes this lane read, not the pages' current state.",
        "Some news pages were paywalled or blocked to this lane (Axios, Healthcare IT News, the Guardian) and are not relied on.",
        "Days are counted on calendar dates; the public-disclosure date differs by one day between the Australian and UTC readings."],
    "objection_route": "https://councilof.ai/census/",
    "correction_pointer": None,
    "observed_at": "2026-09-26T15:13:55Z",
    "publication": "PRIVATE: OWNER-APPROVE required before any publication (sensitive topic naming a company).",
}
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
print(json.dumps({"out": OUT, "capsule_id": capsule["capsule_id"],
                  "intervals": {i["id"]: i.get("days") if i.get("days") is not None else i.get("days_range") for i in INTERVALS}}, indent=1))
