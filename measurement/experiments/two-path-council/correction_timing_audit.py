#!/usr/bin/env python3
# SPDX-License-Identifier: Apache-2.0
"""Read-only longitudinal coverage audit for GSPC's source-maintained corrections.

The source is NOT append-only and a record date is NOT publication date.
Exact correction latency is only calculated for two complete timezone-aware
timestamps and remains unverified without independent deployment evidence.
"""
from __future__ import annotations
import argparse
import datetime as dt
import hashlib
import json
import re
import urllib.request
from collections import Counter

SOURCE="https://councilof.ai/api/corrections"
SCHEMA="csoai.correction-timing-observer/0.1"
DAY=re.compile(r"^\d{4}-\d{2}-\d{2}$")


def canonical(v):
    return json.dumps(v,sort_keys=True,separators=(",",":"),ensure_ascii=False).encode()

def sha(raw):
    return hashlib.sha256(raw).hexdigest()

def parse_date_kind(value):
    if value=="UNRECORDED" or value is None or value=="":
        return "UNRECORDED",None
    if not isinstance(value,str):
        return "INVALID",None
    if DAY.fullmatch(value):
        try:
            return "DAY_ONLY",dt.date.fromisoformat(value)
        except ValueError:
            return "INVALID",None
    try:
        parsed=dt.datetime.fromisoformat(value.replace("Z","+00:00"))
    except ValueError:
        return "INVALID",None
    if parsed.tzinfo is None or parsed.utcoffset() is None:
        return "INVALID",None
    return "INSTANT",parsed.astimezone(dt.timezone.utc)


def reanalyse(source):
    if not isinstance(source,dict) or source.get("schema")!="csoai.corrections/0.1" or not isinstance(source.get("corrections"),list):
        raise ValueError("wrong public corrections schema")
    rows=source["corrections"]
    ids=set()
    kinds={"detected_at":Counter(),"published_at":Counter()}
    invalid_ids=[]
    invalid_record_dates=[]
    latencies=[]
    timing_evidence_present=0
    inconsistent_dates=[]
    report_date_order_violations=0
    earlier_date=None
    for r in rows:
        if not isinstance(r,dict):
            raise ValueError("invalid correction record")
        rid=r.get("id")
        if not isinstance(rid,str) or not rid or rid in ids:
            invalid_ids.append(str(rid)[:80])
        else:ids.add(rid)
        row_date=r.get("date")
        if not isinstance(row_date,str) or not DAY.fullmatch(row_date):
            invalid_record_dates.append(rid)
            parsed_date=None
        else:
            try:parsed_date=dt.date.fromisoformat(row_date)
            except ValueError:parsed_date=None;invalid_record_dates.append(rid)
        if parsed_date is not None and earlier_date is not None and parsed_date>earlier_date:
            report_date_order_violations+=1
        if parsed_date is not None:earlier_date=parsed_date
        times={}
        for key in kinds:
            kind,val=parse_date_kind(r.get(key))
            kinds[key][kind]+=1
            times[key]=(kind,val)
        if r.get("timing_evidence"):
            timing_evidence_present+=1
        det,pub=times["detected_at"],times["published_at"]
        if det[0]=="INSTANT" and pub[0]=="INSTANT":
            lag=(pub[1]-det[1]).total_seconds()
            if lag<0:inconsistent_dates.append(rid)
            else:latencies.append(lag)
        elif det[0] in ("INSTANT","DAY_ONLY") and pub[0] in ("INSTANT","DAY_ONLY"):
            # Date-only order can prove a reversed calendar day without giving exact hours.
            a=det[1].date() if det[0]=="INSTANT" else det[1]
            b=pub[1].date() if pub[0]=="INSTANT" else pub[1]
            if b<a:inconsistent_dates.append(rid)
    out={
        "schema":SCHEMA,"state":"PUBLIC_SOURCE_TIMING_REANALYSIS",
        "source_schema":source["schema"],
        "n_corrections":len(rows),
        "timestamp_coverage":{k:dict(sorted(v.items())) for k,v in kinds.items()},
        "n_timing_evidence_fields_nonempty":timing_evidence_present,
        "n_exact_timing_pairs_with_nonnegative_latency":len(latencies),
        "exact_latency_seconds":sorted(latencies),
        "n_reverse_calendar_or_instant_order":len(inconsistent_dates),
        "reversed_record_ids":sorted(inconsistent_dates),
        "n_source_row_order_violations":report_date_order_violations,
        "duplicate_or_invalid_ids":sorted(invalid_ids),
        "invalid_record_dates":sorted(invalid_record_dates),
        "no_append_only_proof":True,
        "effect_of_correction_on_users":"NOT_MEASURED",
        "limitations":[
            "Publisher-maintained corrections are not authenticated independent append-only events",
            "detected_at and published_at are source declarations and must be checked against real evidence",
            "A date-only event is not treated as a precise timestamp",
            "An unknown publication time cannot be replaced with the record date or retrieval time",
            "Only source-included full instants produce descriptive latency; no product-level SLA is inferred",
            "Do not infer model evolution, human harm or correction reception from this ledger",
        ]
    }
    out["report_sha256"]=sha(canonical(out))
    return out


def fetch():
    req=urllib.request.Request(SOURCE,headers={"User-Agent":"CSOAI-correction-timing-study/0.1"})
    with urllib.request.urlopen(req,timeout=20) as r:
        if r.status!=200 or not r.headers.get("Content-Type","").startswith("application/json"):
            raise ValueError("invalid endpoint response")
        raw=r.read(1_000_001)
    if len(raw)>1_000_000:raise ValueError("source exceeds bounded read")
    return raw

def main():
    p=argparse.ArgumentParser(description=__doc__)
    p.add_argument("--public",action="store_true")
    a=p.parse_args()
    if not a.public:p.error("only read-only public audit is enabled")
    raw=fetch()
    output=reanalyse(json.loads(raw))
    output.pop("report_sha256")
    output["source_bytes_sha256"]=sha(raw)
    output["report_sha256"]=sha(canonical(output))
    print(json.dumps(output,indent=2,sort_keys=True))

if __name__=="__main__":
    main()
