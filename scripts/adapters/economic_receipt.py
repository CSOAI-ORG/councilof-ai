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

# Existing board axis identities. These are editorial research routes, not
# measurements of the target axis, appointments or proof of legal coverage.
ROUTES = {
    "anthropic": ("ai-adoption-components", "labour-components"),
    "IT.NET.USER.ZS": ("ai-adoption-components",),
    "SL.UEM.TOTL.ZS": ("labour-components",),
    "oecd-ai": ("ai-adoption-components",),
    "ons-unemployment": ("labour-components",),
    "imf-growth": ("ai-adoption-components",),
    "fred-unemployment": ("labour-components",),
}
ROLES = {"ai-adoption-components": "statistical-series reviewer",
         "labour-components": "labour statistics reviewer"}
QUESTIONS = {
    "anthropic": "Check observed Claude usage definitions, cohort and permitted reuse; do not infer workforce displacement.",
    "IT.NET.USER.ZS": "Check digital-access context and missing periods; not an AI-adoption measure.",
    "SL.UEM.TOTL.ZS": "Check modelled ILO unemployment definition and comparability; no AI causation.",
    "oecd-ai": "Check enterprise population, observation flags and series breaks before time comparisons.",
    "ons-unemployment": "Check age, frequency, seasonal adjustment and release vintage.",
    "imf-growth": "Check data vintage and estimate status; macroeconomic context, not AI uptake.",
    "fred-unemployment": "Check monthly BLS series coverage and missing observations before comparison.",
}


def review_candidates(source, env, rows):
    # Raw-response headers may change without changing observations. Bind the
    # candidate identity to the parsed semantics, including values and flags,
    # but do not disclose those values in this metadata-only output.
    semantic_rows = sorted(
        ({k: v for k, v in row.items() if k not in {"source_sha256", "state"}} for row in rows),
        key=ce.canonical_bytes,
    )
    digest = ce.sha256_hex(ce.canonical_bytes(semantic_rows))
    result = []
    for axis in ROUTES[source]:
        identity = ce.sha256_hex(ce.canonical_bytes([source, axis, digest]))
        result.append({"candidate_id": identity, "source_id": source,
            "axis": axis, "reviewer_role": ROLES[axis], "reviewer": None,
            "source_sha256": env["artifact"]["sha256"], "semantic_sha256": digest,
            "observed_at": env["observed_at"], "question": QUESTIONS[source],
            "state": "AWAITING_HUMAN_REVIEW", "measurement_state": "UNMEASURED",
            "classification": "SOURCE_QUALIFICATION_REVIEW_CANDIDATE",
            "confirmed_change": False, "rights_review": "REQUIRED",
            "execute_authorized": False, "publication_authorized": False,
            "signed": False, "writes_board": False})
    return result



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
    candidates={s:[] for s in ALL_IDS}
    if core_dir is not None:
        try:
            core=ec.qualify(core_dir)
            for env in core["envelopes"]:
                # Identify by the envelope subject, not manifest order.
                source=env["subject"]["id"].split(":")[0]
                if source not in CORE_IDS:
                    raise ValueError("unexpected core source")
                components=[x for x in core["component_candidates"] if x["source_id"]==source]
                rows[source]=summary(source,env,components)
                candidates[source]=review_candidates(source,env,components)
        except Exception:
            for source in CORE_IDS:
                rows[source]=held(source)
                candidates[source]=[]
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
                    candidates[source]=review_candidates(source,replay["envelope"],replay["component_candidates"])
                except Exception:
                    rows[source]=held(source)
                    candidates[source]=[]
        except Exception:
            for source in ctx.SOURCES:
                rows[source]=held(source)
                candidates[source]=[]
    items=list(rows.values())
    n=sum(r["state"]=="PROBED" for r in items)
    pending=[c for source in ALL_IDS for c in candidates[source]]
    if len({c["candidate_id"] for c in pending})!=len(pending):
        raise ValueError("duplicate review candidate")
    result={"schema":"csoai.economic-source-qualification-receipt/0.2",
            "scope":"Metadata only; raw capture replay performed locally; no data redistribution, inference or board admission.",
            "sources":items,"expected_sources":len(items),"probed_sources":n,
            "uncheckable_sources":len(items)-n,"writes_board":False,"signed":False,
            "candidate_state":"UNMEASURED",
            "review_candidates":pending,"review_candidates_count":len(pending),
            "review_queue_submitted":False}
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
    print(f"Economic qualification receipt: {result['probed_sources']}/{result['expected_sources']} sources PROBED; {result['uncheckable_sources']} UNCHECKABLE; {result['review_candidates_count']} review candidates prepared; no board update.")
    return 0


if __name__=="__main__":
    raise SystemExit(main())
