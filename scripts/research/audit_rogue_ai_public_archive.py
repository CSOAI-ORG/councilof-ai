#!/usr/bin/env python3
"""Read-only, exact-byte external research artifact audit.

This recomputes published ROGUE-AI table denominators from the researchers'
ARCHIVED model outputs; it does NOT execute GPT, Claude, Gemini or DeepSeek,
reproduce a security incident, attest provenance or imply author endorsement.
No third-party incident text is emitted. No job, paid API or scheduler is run.
"""
import argparse
import collections
import csv
import hashlib
import io
import json
import urllib.request
import zipfile
from datetime import datetime, timezone
from pathlib import Path

SOURCE="https://rogue-ai.surge.sh/download/rogue-ai-artifact.zip"
ARCHIVE_SHA="3643f291c8a25680a30771e7db9e339fb0ac84424db20afdd05cc11075d551da"
ARCHIVE_MAX_BYTES=7_000_000
CSV_NAME="rogue-ai-artifact/results/replications.csv"
CSV_SHA="54c036c426af169c5d6cb3be211e0e7452e38207df96a3ac0f5fd8887860d905"
LICENSE_NAME="rogue-ai-artifact/LICENSE"
ROW_COUNT=108
MODEL_COLUMNS=(
    "harm_gpt-5.6-luna",
    "harm_gpt-5.6-sol",
    "harm_claude-sonnet-4.6",
    "harm_gemini-3.5-flash",
    "harm_deepseek-v4-flash",
)
REQUIRED=("replication","simulation","category","root_cause","attacker",
          "incident_harm","control_harm","verdict","reproduced",*MODEL_COLUMNS)

def digest(b):
    return hashlib.sha256(b).hexdigest()

def check(test,message):
    if not test:raise ValueError(message)

def fraction(s):
    check(isinstance(s,str) and s.count("/")==1,"bad published session fraction")
    n,d=(int(x) for x in s.split("/"))
    check(0<=n<=d and 0<=d<=10_000,"invalid harm denominator or numerator")
    return n,d

def rate(n,d):
    return round(100*n/d,4) if d else None

def download():
    req=urllib.request.Request(SOURCE,headers={
        "User-Agent":"CSOAI-canonical-external-research-audit/0.1",
        "Accept":"application/zip"
    })
    with urllib.request.urlopen(req,timeout=25) as res:
        check(res.status==200,"upstream archive returned non-200")
        b=res.read(ARCHIVE_MAX_BYTES+1)
    check(len(b)<=ARCHIVE_MAX_BYTES,"archive exceeds bounded acquisition")
    return b

def audit(raw):
    check(isinstance(raw,bytes) and len(raw)<=ARCHIVE_MAX_BYTES,"bounded archive required")
    check(digest(raw)==ARCHIVE_SHA,"original upstream archived bytes changed or spoofed")
    with zipfile.ZipFile(io.BytesIO(raw)) as archive:
        check(len(archive.infolist())<=3000,"unexpected zip entry count")
        names=archive.namelist()
        check(len(names)==len(set(names)),"duplicate zip file names")
        check(CSV_NAME in names and LICENSE_NAME in names,"source archive has missing evidence")
        csvinfo=archive.getinfo(CSV_NAME)
        check(csvinfo.file_size<=750_000,"oversized source outcome table")
        csvbytes=archive.read(CSV_NAME)
        lic=archive.read(LICENSE_NAME, pwd=None)
    check(digest(csvbytes)==CSV_SHA,"published table bytes changed")
    check(lic.startswith(b"MIT License\n") and b"Copyright (c) 2026 The authors" in lic,
          "authorship and license must remain pinned")
    rows=list(csv.DictReader(io.StringIO(csvbytes.decode("utf-8-sig"))))
    check(len(rows)==ROW_COUNT,"unmatched published experiment rows")
    check(set(REQUIRED).issubset(rows[0]),"published output schema missing")
    check(len({r["replication"] for r in rows})==ROW_COUNT,"replication IDs are not unique")
    check(all(r["reproduced"] in ("yes","no") for r in rows),"unrecognized reproduction status")
    tally=collections.Counter(r["reproduced"] for r in rows)
    verdict=collections.Counter(r["verdict"] for r in rows)
    by_verdict_status=collections.Counter(r["verdict"]+":"+r["reproduced"] for r in rows)
    check(set(verdict)=={"supported","suggestive","no control","not reproduced"},
          "unexpected published verdicts")
    model_stats={}
    for key in MODEL_COLUMNS:
        n=d=0
        for r in rows:
            a,b=fraction(r[key]);n+=a;d+=b
        model_stats[key[5:]]={"harmful_sessions":n,"recorded_sessions":d,
                               "observed_archived_rate_pct":rate(n,d)}
    cn=cd=0
    for r in rows:
        a,b=fraction(r["control_harm"]);cn+=a;cd+=b
    groups={}
    for category in sorted(set(r["category"] for r in rows)):
        selected=[r for r in rows if r["category"]==category]
        groups[category]={"replications":len(selected),
                          "reported_reproduced":sum(r["reproduced"]=="yes" for r in selected)}
    check(tally=={"yes":96,"no":12},"the authors' reproduction summary is not reconstructed")
    check(model_stats=={
      "gpt-5.6-luna":{"harmful_sessions":64,"recorded_sessions":357,"observed_archived_rate_pct":17.9272},
      "gpt-5.6-sol":{"harmful_sessions":97,"recorded_sessions":385,"observed_archived_rate_pct":25.1948},
      "claude-sonnet-4.6":{"harmful_sessions":67,"recorded_sessions":357,"observed_archived_rate_pct":18.7675},
      "gemini-3.5-flash":{"harmful_sessions":112,"recorded_sessions":357,"observed_archived_rate_pct":31.3725},
      "deepseek-v4-flash":{"harmful_sessions":117,"recorded_sessions":357,"observed_archived_rate_pct":32.7731}
    },"model session numbers no longer match published pinned archive")
    check((cn,cd)==(16,2763),"source control population changed")
    check(by_verdict_status=={
       "suggestive:yes":23,"supported:yes":32,"no control:yes":2,
       "not reproduced:yes":39,"not reproduced:no":12
    },"source final-versus-initial verdict partition changed")
    return {
        "schema":"csoai.external-paper-archived-outcome-audit/0.1",
        "realm":"ORIGINAL_AUTHORS_HISTORICAL_RECORDED_MODEL_OUTPUTS",
        "observed_source_at":datetime.now(timezone.utc).isoformat(),
        "source_url":SOURCE,
        "paper_url":"https://arxiv.org/abs/2611.26553",
        "archive_original_bytes_sha256":ARCHIVE_SHA,
        "archive_original_bytes":len(raw),
        "table_original_bytes_sha256":CSV_SHA,
        "row_count":ROW_COUNT,
        "reported_reproduced":tally["yes"],
        "reported_not_reproduced":tally["no"],
        "archived_reported_reproduction_pct":rate(tally["yes"],ROW_COUNT),
        "initial_verdict_distribution":dict(sorted(verdict.items())),
        "initial_verdict_by_final_reproduction":dict(sorted(by_verdict_status.items())),
        "authors_original_model_session_totals":model_stats,
        "authors_aggregated_control_sessions":{
            "harmful_sessions":cn,"recorded_sessions":cd,"recorded_rate_pct":rate(cn,cd)},
        "source_category_counts":groups,
        "licence_notice":"MIT License, Copyright (c) 2026 The authors; original full notice in source archive",
        "raw_incident_data_republished":False,
        "original_paper_model_sessions_reexecuted":False,
        "original_environment_state_checks_independently_reexecuted":False,
        "individual_harm_labels_independently_adjudicated":False,
        "original_authors_endorsed_csoai":False,
        "csoai_gspc_result_admitted":False,
        "meok_prevented_incident":False,
        "independent_human_recipient_accepted":False,
        "interpretation":[
          "Recounts original authors' archived outcome TABLE exactly, not original raw run transcripts.",
          "96/108 reproduced=yes does not mean 96 independently causally supported matched controls; two yes rows have 'no control'.",
          "39 rows initially marked not reproduced later show reproduced=yes; distinguish initial from later rounds.",
          "Model-session fractions are different denominators across models and cannot be used as paired cases without individual traces.",
          "No model provider called, no experiment reenacted and no incident prevented by this CSOAI audit.",
          "Use as literature and source-integrity review, not an externally endorsed GSPC safety measurement."
        ]
    }

def main():
    p=argparse.ArgumentParser()
    sources=p.add_mutually_exclusive_group(required=True)
    sources.add_argument("--archive",help="path to locally archived exact original zip")
    sources.add_argument("--download",action="store_true",help="GET the official exact zip with 7MB cap")
    p.add_argument("--output",required=True)
    args=p.parse_args()
    raw=Path(args.archive).read_bytes() if args.archive else download()
    rec=audit(raw)
    with open(args.output,"x",encoding="utf8") as f:
        json.dump(rec,f,sort_keys=True,indent=2,ensure_ascii=False);f.write("\n")
    print(json.dumps({
      "reproduced":rec["reported_reproduced"],
      "total":rec["row_count"],
      "pct":rec["archived_reported_reproduction_pct"],
      "controls":rec["authors_aggregated_control_sessions"],
      "original_models_rerun":False
    }))
if __name__=="__main__":main()
