#!/usr/bin/env python3
# SPDX-License-Identifier: MIT
"""Read-only triage of the existing corpus registry and dated freeze outcomes.
No network, legal decision, new publication, or text admission."""
import collections,hashlib,json,pathlib,urllib.parse
ROOT=pathlib.Path(__file__).resolve().parents[2]
BASE=ROOT/"public/interop"
def digest(b):return hashlib.sha256(b).hexdigest()
def build(raw,audit_raw,manifest_raw):
    manifest=json.loads(manifest_raw);audit=json.loads(audit_raw)
    if digest(raw)!=manifest["files"]["public/interop/corpus-v3/registry.jsonl"]:raise ValueError("registry pin")
    records=[json.loads(l) for l in raw.splitlines() if l.strip()]
    reg={r["instrument_id"]:r for r in records}
    if len(reg)!=len(records):raise ValueError("duplicate registry")
    obs=audit["instruments"]
    if len({r["instrument_id"] for r in obs})!=len(obs):raise ValueError("duplicate observation")
    live={r["instrument_id"] for r in records if r["status"] in audit["live_statuses"]}
    if live!={r["instrument_id"] for r in obs}:raise ValueError("population mismatch")
    queue=[]
    for a in obs:
        r=reg[a["instrument_id"]]
        if any(a[k]!=r[k] for k in ("status","freeze_mode","jurisdiction","kind")):raise ValueError("revision mismatch")
        if a["limit_of"]!="our build":continue
        licence=(r.get("text_licence") or "").casefold()
        url=r.get("official_url");u=urllib.parse.urlsplit(url or "")
        route=bool(u.scheme=="https" and u.hostname and not u.username and not u.password)
        restricted="all rights reserved" in licence
        if restricted:stage="IDENTIFIERS_ONLY_RIGHTS_RESTRICTED"
        elif not route:stage="LOCATE_OFFICIAL_DOCUMENT"
        else:stage="VERIFY_DOCUMENT_STATUS_AND_RIGHTS"
        queue.append({"instrument_id":r["instrument_id"],"jurisdiction":r["jurisdiction"],"kind":r["kind"],
          "official_route":url if route else None,"recorded_licence":r.get("text_licence"),"recorded_reason":a["class"],
          "stage":stage,"text_admitted":False})
    if len(queue)!=audit["by_limit"]["our build"]:raise ValueError("queue count")
    queue.sort(key=lambda x:(x["stage"],x["instrument_id"]))
    frozen=[reg[i] for i in live if reg[i]["freeze_mode"]=="FULL_TEXT"]
    return {"schema":"csoai.corpus-recovery-research/0.1","state":"REVIEW_QUEUE_ONLY",
      "registry_sha256":digest(raw),"audit_sha256":digest(audit_raw),"manifest_sha256":digest(manifest_raw),
      "corpus_root":manifest["corpus_root"],"live_rows":len(live),
      "live_full_text_hash_coverage":len(frozen),"live_public_text_instruments":sum(r["text_published"] is True for r in frozen),
      "live_full_text_withheld":sum(r["text_published"] is False for r in frozen),
      "queue_count":len(queue),"recorded_https_routes":sum(bool(r["official_route"]) for r in queue),
      "stages":dict(collections.Counter(r["stage"] for r in queue)),"queue":queue,
      "source_truth_verified":False,"rights_verified":False,"new_texts_admitted":0}
def main():
    raw=(BASE/"corpus-v3/registry.jsonl").read_bytes()
    audit=(BASE/"insights/corpus-freeze-outcomes-2026-11-22.json").read_bytes()
    manifest=(BASE/"corpus-v3/manifest.json").read_bytes()
    r=build(raw,audit,manifest)
    try:build(raw+b" ",audit,manifest)
    except ValueError:pass
    else:raise AssertionError("changed registry accepted")
    assert all(not x["text_admitted"] for x in r["queue"])
    print("RECOVERY_RESULT "+json.dumps(r,sort_keys=True,allow_nan=False))
if __name__=="__main__":main()
