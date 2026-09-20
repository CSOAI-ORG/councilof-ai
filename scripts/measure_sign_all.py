#!/usr/bin/env python3
"""One operator command for the universal CSOAI measurement/signing factory.

Default mode is safe: rebuild every dated cohort, build the estate hierarchy,
verify every byte/row/root, and emit a run receipt. It does not sign or publish
unless explicit flags are supplied.

Domain-specific instruments remain domain-specific. Their OUTPUT contract is
universal: exact evidence bytes -> atomic hashes -> cohort manifest/Merkle ->
compact admission leaf -> ONE public-root signer -> estate root -> witnesses.
"""
from __future__ import annotations
import argparse, datetime, glob, json, pathlib, subprocess, sys
from lib.measurement_bundle import build, canonical_bytes, sha256_bytes
from verify_measurement_bundle import verify_manifest
from adapters import measurement_cohorts

ROOT=pathlib.Path(__file__).resolve().parents[1]

def write_bundle(spec_path:pathlib.Path,date:str)->dict:
    spec=json.loads(spec_path.read_text(encoding="utf-8"))
    manifest,compact=build(spec,ROOT)
    name=spec_path.stem
    out=ROOT/"public/interop/cohorts"/date/name
    out.mkdir(parents=True,exist_ok=True)
    (out/"measurement-manifest.json").write_text(
        json.dumps(manifest,indent=2,ensure_ascii=False)+"\n"
    )
    (out/"unsigned-cohort-card.json").write_text(
        json.dumps({
            "body":compact,
            "signature":None,
            "did":"did:web:csoai.org#board-attestation-1"
        },indent=2,ensure_ascii=False)+"\n"
    )
    return {
        "name":name,
        "cohort_id":manifest["cohort_id"],
        "atomic_count":manifest["atomic_count"],
        "manifest_sha256":manifest["manifest_sha256"],
        "compact_sha256":sha256_bytes(canonical_bytes(compact)),
    }

def build_estate(date:str,children:list[dict])->dict:
    spec_path=ROOT/"measurement/cohort-specs"/date/"estate-global.json"
    if spec_path.exists():
        spec=json.loads(spec_path.read_text())
    else:
        spec={
            "cohort_id":f"csoai-estate-measurement-index-{date}",
            "subject_kind":"estate_measurement_index",
            "axis":"universal_measurement_fabric",            "as_of":date,
            "status":"PARTIAL_MEASURED",
            "method":"Hierarchical commitment over independently recomputable measurement-cohort manifests.",
            "unmeasured":[],
        }
    paths=[
        f"public/interop/cohorts/{date}/{x['name']}/measurement-manifest.json"
        for x in children
    ]
    atomic=sum(int(x["atomic_count"]) for x in children)
    spec["n"]=atomic
    spec["population"]={
        "child_cohorts":len(paths),
        "atomic_observations_bound":atomic,
    }
    spec["dispositions"]={
        "COHORTS_BOUND":len(paths),
        "ATOMIC_OBSERVATIONS_BOUND":atomic,
    }
    spec["evidence"]=[
        {"path":p,"role":"cohort_manifest","cohort_manifest":True}
        for p in paths
    ]
    spec_path.parent.mkdir(parents=True,exist_ok=True)
    spec_path.write_text(json.dumps(spec,indent=2)+"\n")
    return write_bundle(spec_path,date)

def main()->int:
    ap=argparse.ArgumentParser()
    ap.add_argument("--date",required=True)
    ap.add_argument("--sign-exports",action="store_true")
    ap.add_argument("--root-dry-run",action="store_true")
    ap.add_argument("--publish-root",action="store_true")
    ns=ap.parse_args()

    spec_dir=ROOT/"measurement/cohort-specs"/ns.date
    specs=sorted(
        pathlib.Path(p)
        for p in glob.glob(str(spec_dir/"*.json"))
        if pathlib.Path(p).name!="estate-global.json"
    )
    if not specs:
        raise SystemExit(f"no cohort specs for {ns.date}")

    children=[write_bundle(p,ns.date) for p in specs]
    estate=build_estate(ns.date,children)

    estate_manifest=ROOT/f"public/interop/cohorts/{ns.date}/estate-global/measurement-manifest.json"
    receipt=verify_manifest(estate_manifest,ROOT)
    adapter=measurement_cohorts.collect(ROOT)
    if not receipt["ok"] or adapter["sidecar"].get("n_skipped"):
        raise SystemExit(json.dumps({
            "verify":receipt,
            "adapter":adapter["sidecar"]
        },indent=2))

    signed=[]
    if ns.sign_exports:
        for item in children+[estate]:
            c=ROOT/f"public/interop/cohorts/{ns.date}/{item['name']}/unsigned-cohort-card.json"
            r=subprocess.run(
                [sys.executable,str(ROOT/"scripts/sign_measurement_bundle.py"),str(c)],
                cwd=ROOT,text=True,capture_output=True
            )
            signed.append({
                "cohort":item["cohort_id"],
                "returncode":r.returncode,
                "stdout":r.stdout[-1000:],
                "stderr":r.stderr[-1000:],
            })
            if r.returncode:
                raise SystemExit(json.dumps(signed[-1],indent=2))

    root_run=None
    if ns.root_dry_run or ns.publish_root:
        cmd=[sys.executable,str(ROOT/"scripts/publish_public_root.py")]
        if ns.root_dry_run and not ns.publish_root:
            cmd.append("--dry-run")
        rr=subprocess.run(cmd,cwd=ROOT,text=True,capture_output=True)
        root_run={
            "command":cmd,
            "returncode":rr.returncode,
            "stdout_tail":rr.stdout[-4000:],
            "stderr_tail":rr.stderr[-4000:],
        }

    now=datetime.datetime.now(datetime.timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    out={
      "schema":"csoai.measure-sign-factory-run/1",
      "run_at":now,
      "date":ns.date,
      "cohorts":children,
      "estate":estate,
      "verification":{
          "ok":receipt["ok"],
          "child_cohorts":receipt["child_cohort_count"],
          "atomic_observations_bound":sum(
              int(x["atomic_count"]) for x in children
          ),
      },
      "root_adapter":adapter["sidecar"],
      "signed_exports":signed,
      "root_run":root_run,
      "state":"VERIFIED" if not root_run else (
          "ROOT_STEP_OK" if root_run["returncode"]==0 else "ROOT_STEP_BLOCKED"
      ),
    }
    rp=ROOT/"measurement/factory/runs"/f"{now}.json"
    rp.parent.mkdir(parents=True,exist_ok=True)
    rp.write_text(json.dumps(out,indent=2,ensure_ascii=False)+"\n")
    print(json.dumps(out,indent=2,ensure_ascii=False))
    return 0 if not root_run or root_run["returncode"]==0 else root_run["returncode"]

if __name__=="__main__":
    raise SystemExit(main())
