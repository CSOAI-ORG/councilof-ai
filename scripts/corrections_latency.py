#!/usr/bin/env python3
# SPDX-License-Identifier: Apache-2.0
"""Corrections timing evidence audit — source-declared bounds, never invented publication.

The corrections endpoint added detected_at / published_at / detected_window in
September 2026. Historical descriptions of a single-date-only schema are
obsolete. This reader independently derives count, timing coverage, exact
intervals and date/window bounds. The published fields still need external
deployment readback; a Git timestamp, Ed25519 signature, OTS anchor, Rekor
entry, or this consumer's own GET time cannot fill a missing published_at.

Run: python3 scripts/corrections_latency.py
     python3 scripts/corrections_latency.py --file response.json

Read-only advisory measurement. It does not certify, sign or mutate records.
"""
from __future__ import annotations

import argparse
import json
import re
import statistics
import sys
import urllib.request
from collections import Counter
from datetime import date, datetime, timezone

UA={"User-Agent":"csoai-corrections-latency/2 (+https://councilof.ai)"}
LIVE="https://councilof.ai/api/corrections"
REQUIRED=("id","date","what_was_wrong","how_caught","fix","status")
EVIDENCE_RE=re.compile(r"(#\d{3,5}\b|\b[0-9a-f]{40}\b|0x[0-9a-f]{16,64}|\b[0-9a-f]{7,12}\b.*commit)",re.I)
DAY=re.compile(r"^\d{4}-\d{2}-\d{2}$")


def load(args)->dict:
    if args.file:
        with open(args.file,encoding="utf-8") as f:return json.load(f)
    req=urllib.request.Request(LIVE,headers=UA)
    with urllib.request.urlopen(req,timeout=30) as r:
        if r.status!=200:
            raise ValueError("corrections endpoint not HTTP 200")
        return json.load(r)


def instant(v):
    if not isinstance(v,str) or "T" not in v:return None
    try:x=datetime.fromisoformat(v.replace("Z","+00:00"))
    except ValueError:return None
    if x.tzinfo is None or x.utcoffset() is None:return None
    return x.astimezone(timezone.utc)


def day(v):
    if not isinstance(v,str) or not DAY.fullmatch(v):return None
    try:return date.fromisoformat(v)
    except ValueError:return None


def time_to_correct(e):
    """Replicate published rule using evidence-bounded timestamps, without filling absent data."""
    P=instant(e.get("published_at"))
    if P is None:return {"kind":"UNMEASURED","reason":"published_at is unknown"}
    D=instant(e.get("detected_at"))
    if D is not None:
        seconds=(P-D).total_seconds()
        if seconds<0:return {"kind":"INVALID_ORDER","seconds":seconds}
        return {"kind":"EXACT","seconds":seconds}
    w=e.get("detected_window") or {}
    if not isinstance(w,dict):w={}
    candidate_date=day(e.get("detected_at"))
    start_of_day=(datetime.combine(candidate_date,datetime.min.time(),tzinfo=timezone.utc)
                  if candidate_date else None)
    end_of_day=(start_of_day.replace(hour=0)+__import__("datetime").timedelta(days=1)
                if start_of_day else None)
    earliest=[x for x in [start_of_day,instant(w.get("not_before"))] if x is not None]
    latest=[x for x in [end_of_day,instant(w.get("not_after"))] if x is not None]
    if not earliest:return {"kind":"UNMEASURED","reason":"no first-hand earliest detection time"}
    lo=max(earliest)
    hi=min(latest) if latest else None
    seconds=(P-lo).total_seconds()
    if seconds<0:return {"kind":"INVALID_ORDER","seconds":seconds}
    value={"kind":"UPPER_BOUND","seconds":seconds}
    if hi is not None and hi<=P:value["lower_bound_seconds"]=(P-hi).total_seconds()
    return value


def analyse(ledger,as_of=None):
    if not isinstance(ledger,dict) or ledger.get("schema")!="csoai.corrections/0.1":
        raise ValueError("unexpected public corrections schema")
    entries=ledger.get("corrections")
    if not isinstance(entries,list):
        raise ValueError("missing correction list")
    if as_of is None:as_of=datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    ids=[e.get("id") for e in entries]
    dates=[e.get("date") for e in entries if e.get("date")]
    parsed=[x for v in dates if (x:=day(v)) is not None]
    weeks=Counter(f"{d.isocalendar().year}-W{d.isocalendar().week:02d}" for d in parsed)
    states=Counter()
    for e in entries:
        s=(e.get("status") or "").upper()
        states["CORRECTED*" if s.startswith("CORRECTED") else
               ("RECORDED*" if s.startswith("RECORDED") else "OTHER")]+=1
    sig=ledger.get("signature_state")
    periods=[time_to_correct(e) for e in entries]
    kinds=Counter(x["kind"] for x in periods)
    exact=sorted(x["seconds"] for x in periods if x["kind"]=="EXACT")
    reported=ledger.get("correction_latency") or {}
    if not isinstance(reported,dict):reported={}
    derived={"exact":kinds["EXACT"],"upper_bound":kinds["UPPER_BOUND"],"unmeasured":kinds["UNMEASURED"]}
    remote={k:reported.get(k) for k in derived}
    compare="NOT_PROVIDED" if all(v is None for v in remote.values()) else (
        "CONSISTENT" if remote==derived else "DIVERGENT")
    conventional_median=statistics.median(exact) if exact else None
    endpoint_median=reported.get("median_seconds_exact")
    median_compare=("NOT_PROVIDED" if endpoint_median is None else
                    "CONSISTENT" if endpoint_median==conventional_median else "DIVERGENT")
    tally=Counter("INSTANT" if instant(e.get("detected_at")) else
                  "DAY_ONLY" if day(e.get("detected_at")) else "UNRECORDED"
                  for e in entries)
    unknown_publication=sum(1 for e in entries if instant(e.get("published_at")) is None)
    report={
       "kind":"csoai.corrections-latency/0.2",
       "as_of":as_of,
       "source":LIVE,
       "entries":len(entries),
       "signature_state_source_reported":sig,
       "signature_independently_verified":False,
       "cadence":{
          "first_record":min(dates) if dates else None,
          "latest_record":max(dates) if dates else None,
          "entries_per_week":dict(sorted(weeks.items())),
       },
       "status_classes":dict(states),
       "status_field_absent":sum(not e.get("status") for e in entries),
       "evidence_bearing_entries":sum(bool(EVIDENCE_RE.search((e.get("fix") or "")+" "+(e.get("how_caught") or ""))) for e in entries),
       "consistency":{
          "duplicate_ids":sorted(i for i,n in Counter(ids).items() if n>1) or "none",
          "non_iso_dates":len(dates)-len(parsed),
          "entries_newer_than_previous_row (ledger is newest-first; >0 = order violation)":sum(b>a for a,b in zip(parsed,parsed[1:])),
          "entries_missing_required_fields":[{"id":e.get("id"),"missing":[f for f in REQUIRED if not e.get(f)]} for e in entries if any(not e.get(f) for f in REQUIRED)] or "none",
       },
       "correction_latency":{
          "state":"PARTIAL_SOURCE_DECLARED_TIMING" if exact or kinds["UPPER_BOUND"] else "UNMEASURED",
          "count_exact_source_declared":kinds["EXACT"],
          "count_upper_bound_source_declared":kinds["UPPER_BOUND"],
          "count_unmeasured":kinds["UNMEASURED"],
          "count_invalid_time_order":kinds["INVALID_ORDER"],
          "detected_at_coverage":dict(sorted(tally.items())),
          "published_at_unrecorded_or_invalid":unknown_publication,
          "median_seconds_exact_conventional":conventional_median,
          "median_seconds_exact_source_reported":endpoint_median,
          "median_source_comparison":median_compare,
          "source_interval_counts":remote,
          "recomputed_interval_counts":derived,
          "source_interval_count_comparison":compare,
          "time_to_correct_meaning":"publisher-declared detection to publisher-declared public correction time; not defect introduction to repair",
          "independent_deployment_evidence":"NOT_VERIFIED",
          "ots_and_rekor_per_correction_inclusion":"NOT_VERIFIED",
          "no_backfill":True,
       },
       "scope":"advisory field and arithmetic verification; neither signer authentication nor correction publication",
    }
    return report


def main():
    ap=argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("--file",help="read saved endpoint JSON instead of live fetch")
    a=ap.parse_args()
    try:
        data=load(a)
        result=analyse(data)
        result["source"]=a.file or LIVE
    except Exception as exc:
        result={"kind":"csoai.corrections-latency/0.2","state":"UNCHECKABLE",
                "reason":f"{type(exc).__name__}: {str(exc)[:140]}"}
    print(json.dumps(result,indent=2,ensure_ascii=False))
    return 0 if result.get("state")!="UNCHECKABLE" else 2


if __name__=="__main__":
    sys.exit(main())
