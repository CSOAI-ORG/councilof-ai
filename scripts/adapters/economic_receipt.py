"""Metadata-only receipt for the existing daily economic qualification.

Replays retained bytes before recording source hashes and counts. Never emits
provider response text, economic values, a board measurement, or a signature.
A failed/missing batch is explicit; no invented zeros or false current state.
"""
from __future__ import annotations
import argparse
import json
from pathlib import Path
from adapters import connector_envelope as ce
from adapters import economic_components as ec
from adapters import economic_context as ctx

CORE_IDS = ["anthropic", *ec.INDICATORS]
ALL_IDS = CORE_IDS + list(ctx.SOURCES)


def held(source):
    return {"source_id":source,"state":"UNCHECKABLE","source_sha256":None,
            "observed_at":None,"periods":[],"candidate_count":None,"null_count":None}


def summary(source, env, rows):
    if ce.validate(env) or env["lifecycle_state"]!="PROBED" or env["measurement"] is not None:
        raise ValueError("invalid source envelope")
    digest=env["artifact"]["sha256"]
    if not rows or any(x["state"]!="UNMEASURED" or x["source_id"]!=source or
                       x["source_sha256"]!=digest for x in rows):
        raise ValueError("invalid component identity")
    periods=sorted({x["period"] for x in rows})
    return {"source_id":source,"state":"PROBED","source_sha256":digest,
            "observed_at":env["observed_at"],"periods":periods,
            "candidate_count":len(rows),"null_count":sum(x["value"] is None for x in rows)}


def build(core_dir, context_dir):
    rows={s:held(s) for s in ALL_IDS}
    if core_dir is not None:
        try:
            core=ec.qualify(core_dir)
            for env in core["envelopes"]:
                # Identify by the envelope subject, not manifest order.
                source=env["subject"]["id"].split(":")[0]
                if source not in CORE_IDS:
                    raise ValueError("unexpected core source")
                rows[source]=summary(source,env,[x for x in core["component_candidates"] if x["source_id"]==source])
        except Exception:
            for source in CORE_IDS:rows[source]=held(source)
    if context_dir is not None:
        try:
            folder=Path(context_dir)
            saved=ec.decode((folder/"qualification.json").read_bytes())
            indexed={}
            for item in saved["sources"]:
                source=item["source"]
                if source not in ctx.SOURCES or source in indexed:
                    raise ValueError("unexpected context source")
                indexed[source]=item
            if set(indexed)!=set(ctx.SOURCES):
                raise ValueError("incomplete context source roster")
            for source,item in indexed.items():
                if item["state"]!="PROBED":
                    continue
                try:
                    raw=(folder/(source+".raw")).read_bytes()
                    replay=ctx.qualify(source,raw,item["envelope"]["observed_at"])
                    if replay!=item:raise ValueError("context replay mismatch")
                    rows[source]=summary(source,replay["envelope"],replay["component_candidates"])
                except Exception:
                    rows[source]=held(source)
        except Exception:
            for source in ctx.SOURCES:rows[source]=held(source)
    items=list(rows.values())
    n=sum(r["state"]=="PROBED" for r in items)
    result={"schema":"csoai.economic-source-qualification-receipt/0.1",
            "scope":"Metadata only; raw capture replay performed locally; no data redistribution, inference or board admission.",
            "sources":items,"expected_sources":len(items),"probed_sources":n,
            "uncheckable_sources":len(items)-n,"writes_board":False,"signed":False,
            "candidate_state":"UNMEASURED"}
    return result


def main():
    p=argparse.ArgumentParser(description=__doc__)
    p.add_argument("--core",type=Path)
    p.add_argument("--context",type=Path)
    p.add_argument("--out",type=Path,required=True)
    args=p.parse_args()
    result=build(args.core,args.context)
    with args.out.open("x",encoding="utf-8") as f:
        json.dump(result,f,indent=2,allow_nan=False)
        f.write("\n")
    print(f"Economic qualification receipt: {result['probed_sources']}/{result['expected_sources']} sources PROBED; {result['uncheckable_sources']} UNCHECKABLE; no board update.")
    return 0


if __name__=="__main__":
    raise SystemExit(main())
