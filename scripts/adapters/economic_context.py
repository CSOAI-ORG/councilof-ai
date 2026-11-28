"""Additional public economic context adapters; same connector contract, no board writes.

Each source succeeds or fails independently. Raw captures stay local. These are
candidate observations, not a combined economic index or a causal analysis.
"""
from __future__ import annotations
import argparse
import csv
import io
import json
import math
import subprocess
from datetime import datetime, timezone
from pathlib import Path
from adapters import connector_envelope as ce
from adapters.economic_components import decode, numeric, COUNTRIES

SOURCES = {
    "oecd-ai": "https://sdmx.oecd.org/public/rest/data/OECD.STI.DEP,DSD_ICT_B@DF_BUSINESSES,1.0/OECD.A.G14_B.PT_ENT._T.S_GE10?startPeriod=2020&endPeriod=2025&dimensionAtObservation=AllDimensions",
    "ons-unemployment": "https://api.beta.ons.gov.uk/v1/data?uri=/employmentandlabourmarket/peoplenotinwork/unemployment/timeseries/mgsx/lms",
    "imf-growth": "https://www.imf.org/external/datamapper/api/v1/NGDP_RPCH/GBR/USA/DEU/FRA/JPN/CAN?periods=2023,2024,2025",
    "fred-unemployment": "https://fred.stlouisfed.org/graph/fredgraph.csv?id=UNRATE&cosd=2025-01-01&coed=2025-12-31",
}
MAX_BYTES = 1_000_000


def row(region, period, metric, value, definition, **extra):
    return {"region":region,"period":period,"metric":metric,"value":value,
            "unit":"%","definition":definition,"state":"UNMEASURED",**extra}


def oecd(raw):
    d=decode(raw)
    dims=d["structure"]["dimensions"]["observation"]
    expect={"REF_AREA":"OECD","FREQ":"A","MEASURE":"G14_B","UNIT_MEASURE":"PT_ENT",
            "ACTIVITY":"_T","SIZE_CLASS":"S_GE10"}
    names=[x["id"] for x in dims]
    if len(names)!=7 or set(names)!=set(expect)|{"TIME_PERIOD"}:
        raise ValueError("unexpected OECD dimensions")
    attrs=d["structure"]["attributes"]["observation"]
    attrnames=[x["id"] for x in attrs]
    if len(attrnames)!=len(set(attrnames)) or not {"OBS_STATUS","UNIT_MULT"}<=set(attrnames):
        raise ValueError("missing OECD attributes")
    if len(d["dataSets"])!=1:
        raise ValueError("unexpected OECD datasets")
    out={}
    for key, values in d["dataSets"][0]["observations"].items():
        indexes=key.split(":")
        if len(indexes)!=len(dims) or not all(i.isdigit() for i in indexes) or len(values)!=len(attrs)+1:
            raise ValueError("bad observation key")
        labels={a["id"]:a["values"][int(i)]["id"] for a,i in zip(dims,indexes)}
        if any(labels[k]!=v for k,v in expect.items()):
            raise ValueError("wrong OECD series")
        year=labels["TIME_PERIOD"]
        if year not in {str(y) for y in range(2020,2026)} or year in out:
            raise ValueError("invalid OECD period")
        def attribute(name):
            i=attrnames.index(name); pos=values[i+1]
            if pos is None:return None
            if type(pos) is not int or pos<0:raise ValueError("bad OECD attribute")
            return attrs[i]["values"][pos]["id"]
        if attribute("UNIT_MULT")!="0":raise ValueError("unexpected multiplier")
        status=attribute("OBS_STATUS")
        out[year]=row("OECD",year,"G14_B",numeric(values[0],100),
            "Enterprises with 10+ employees using AI, all activities",
            source_status=status,series_break=status=="B")
    if not out:raise ValueError("empty OECD observations")
    return [out.get(y,row("OECD",y,"G14_B",None,"Enterprises with 10+ employees using AI, all activities",source_status=None,series_break=None))
            for y in map(str,range(2020,2026))]


def ons(raw):
    d=decode(raw); desc=d["description"]
    if desc["cdid"]!="MGSX" or desc["datasetId"]!="LMS" or desc["unit"]!="%" or "seasonally adjusted" not in desc["title"].lower():
        raise ValueError("wrong ONS series")
    out={}
    for x in d["years"]:
        if x["year"] not in {"2023","2024","2025"}:continue
        y=x["year"]
        if x["date"]!=y or y in out:raise ValueError("duplicate or wrong ONS period")
        v=None if x["value"] in ("","..",None) else numeric(float(x["value"]),100)
        out[y]=row("GBR",y,"MGSX",v,"ONS unemployment rate age 16+, seasonally adjusted annual series",
                   release_date=desc["releaseDate"])
    if not out:raise ValueError("no ONS annual data")
    return [out.get(y,row("GBR",y,"MGSX",None,"ONS unemployment rate age 16+, seasonally adjusted annual series",release_date=desc["releaseDate"])) for y in ("2023","2024","2025")]


def imf(raw):
    d=decode(raw)
    # DataMapper also returns an empty-key null sentinel on the live endpoint.
    # Permit only that exact sentinel, not a second economic series.
    series = d["values"]
    if not isinstance(series,dict) or "NGDP_RPCH" not in series or any(
        k!="NGDP_RPCH" and not (k=="" and v is None) for k,v in series.items()
    ):raise ValueError("wrong IMF indicator")
    data=d["values"]["NGDP_RPCH"]
    if not set(COUNTRIES)<=set(data):raise ValueError("missing IMF countries")
    out=[]
    for country in COUNTRIES:
        for y in ("2023","2024","2025"):
            v=data[country].get(y)
            if v is not None and (type(v) not in (int,float) or not math.isfinite(v) or v < -100):
                raise ValueError("bad GDP growth")
            out.append(row(country,y,"NGDP_RPCH",v,"IMF real GDP growth, annual percent change",
                           estimate_status="NOT_DISTINGUISHED_BY_RESPONSE"))
    return out


def fred(raw):
    reader=csv.DictReader(io.StringIO(raw.decode("utf-8-sig")))
    if reader.fieldnames!=["observation_date","UNRATE"]:raise ValueError("wrong FRED series")
    periods={f"2025-{m:02}-01" for m in range(1,13)}
    out={}
    for x in reader:
        p=x["observation_date"]
        if p not in periods or p in out or set(x)!={"observation_date","UNRATE"}:raise ValueError("wrong FRED period")
        v=None if x["UNRATE"] in ("",".") else numeric(float(x["UNRATE"]),100)
        out[p]=row("USA",p,"UNRATE",v,"BLS unemployment rate, seasonally adjusted monthly series via FRED")
    if set(out)!=periods:raise ValueError("incomplete FRED grid")
    return [out[k] for k in sorted(out)]


PARSERS={"oecd-ai":oecd,"ons-unemployment":ons,"imf-growth":imf,"fred-unemployment":fred}


def fetch(source):
    if source not in SOURCES:raise ValueError("unknown source")
    result=subprocess.run(["curl","--disable","-fsSL","--max-redirs","3","--max-time","15",
        "--max-filesize",str(MAX_BYTES),"--proto","=https","--proto-redir","=https",
        "-H","Accept: "+("text/csv" if source=="fred-unemployment" else "application/json"),
        SOURCES[source]],capture_output=True,timeout=20)
    if result.returncode or not result.stdout or len(result.stdout)>MAX_BYTES:
        raise ValueError("source fetch failed")
    return result.stdout


def qualify(source, raw, observed_at):
    if not isinstance(raw,bytes) or not raw or len(raw)>MAX_BYTES:raise ValueError("invalid source bytes")
    values=PARSERS[source](raw); digest=ce.sha256_hex(raw)
    src={"connector":source,"url":SOURCES[source]}
    subj={"kind":"economic-series","id":source,"revision":None}
    env={"schema":ce.SCHEMA,"source":src,"subject":subj,"measurement_kind":"deterministic-facts",
         "artifact":{"sha256":digest,"bytes":len(raw),"url":SOURCES[source]},"observed_at":observed_at,
         "license":"UNCHECKABLE","provenance":{"producer":"scripts/adapters/economic_context.py",
         "producer_revision":"sha256:"+ce.sha256_hex(Path(__file__).read_bytes())},
         "lifecycle_state":"PROBED","measurement":None,"error":None,"writes_board":False,
         "idempotency_key":ce.idempotency_key(src,subj,"deterministic-facts",digest)}
    if ce.validate(env):raise ValueError("invalid connector envelope")
    return {"source":source,"state":"PROBED","envelope":env,
            "component_candidates":[dict(x,source_id=source,source_sha256=digest) for x in values]}


def capture(folder, getter=fetch, clock=lambda:datetime.now(timezone.utc).isoformat().replace("+00:00","Z")):
    folder=Path(folder);folder.mkdir(mode=0o700,exist_ok=False)
    results=[]
    for source in SOURCES:
        try:
            raw=getter(source)
            if not isinstance(raw,bytes) or not raw or len(raw)>MAX_BYTES:raise ValueError("invalid source bytes")
            (folder/(source+".raw")).write_bytes(raw)
            results.append(qualify(source,raw,clock()))
        except Exception:
            results.append({"source":source,"state":"UNCHECKABLE","component_candidates":[]})
    result={"sources":results,"writes_board":False,"index_formula":False}
    (folder/"qualification.json").write_text(json.dumps(result,indent=2,allow_nan=False)+"\n")
    return result


def main():
    p=argparse.ArgumentParser(description=__doc__);p.add_argument("capture_dir",type=Path)
    result=capture(p.parse_args().capture_dir)
    for s in result["sources"]:
        rows=s["component_candidates"];print(s["source"],s["state"],"candidates",len(rows),"null",sum(r["value"] is None for r in rows))
    return 0 if all(s["state"]=="PROBED" for s in result["sources"]) else 1


if __name__=="__main__":
    raise SystemExit(main())
