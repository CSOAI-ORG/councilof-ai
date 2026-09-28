#!/usr/bin/env python3
"""Derive one non-additive manifest over the public evidence populations."""
from __future__ import annotations
import argparse, datetime as dt, hashlib, json, re
from pathlib import Path

def load(p): return json.loads(Path(p).read_text(encoding="utf-8"))
def sha(p): return hashlib.sha256(Path(p).read_bytes()).hexdigest()

def claim_heads(repo:Path):
    d=repo/"public"/"claims"
    files=[p for p in sorted(d.glob("claimreg-*.json")) if not p.name.endswith(".signed.json")]
    parsed={}; superseded=set()
    for p in files:
        try: j=load(p)
        except Exception: continue
        parsed[p]=j
        s=j.get("supersedes") or {}
        if isinstance(s,dict) and s.get("file"): superseded.add(str(s["file"]).split("/")[-1])
    rows=[]
    for p,j in parsed.items():
        if p.name in superseded: continue
        claims=sum(len(v.get("claims") or []) for v in (j.get("subjects") or {}).values())
        if not claims: claims=len(j.get("claims") or [])
        rows.append({"file":"/claims/"+p.name,"registry_id":j.get("registry_id"),"schema":j.get("schema"),
                     "claims":claims,"sha256":sha(p),"merkle_root":(j.get("merkle") or {}).get("root")})
    return rows

def correction_ids(repo:Path):
    text=(repo/"functions/api/corrections.ts").read_text(encoding="utf-8")
    ids=re.findall(r'\bid\s*:\s*["\'](C-[^"\']+)["\']|["\']id["\']\s*:\s*["\'](C-[^"\']+)["\']',text)
    flat=[a or b for a,b in ids]
    return list(dict.fromkeys(flat))

def build(repo:Path):
    rootp=repo/"public/root.json"; root=load(rootp)
    cardp=repo/"public/signed/card_index.json"; cards=load(cardp)
    ids=correction_ids(repo)
    return {
      "schema":"csoai.evidence-manifest/0.1",
      "derived_at_utc":dt.datetime.now(dt.timezone.utc).isoformat().replace("+00:00","Z"),
      "authority":{"board":"GET /api/gspc","corrections":"GET /api/corrections",
                   "rule":"Counts below are separate populations. They are never added or substituted for one another."},
      "populations":{
        "public_root":{"count":root.get("card_count"),"count_field":"public/root.json#card_count",
                       "merkle_root":root.get("merkle_root"),"as_of":root.get("as_of"),"sha256":sha(rootp)},
        "signed_card_index":{"count":cards.get("n_cards"),"actual_array_length":len(cards.get("cards") or []),
                             "head":cards.get("head"),"created":cards.get("created"),"sha256":sha(cardp)},
        "corrections":{"count":len(ids),"source":"functions/api/corrections.ts#LEDGER.corrections",
                       "ids_sha256":hashlib.sha256("\n".join(ids).encode()).hexdigest()},
        "claim_registry_heads":{"count":len(claim_heads(repo)),"registries":claim_heads(repo)},
      },
      "relationships":[
        "public_root.card_count is the leaf population committed by that exact root; it is not the signed-card index population.",
        "signed_card_index.count is the current indexed signed-card corpus and may legitimately differ from the public root until a later root admits it.",
        "corrections count is the source-maintained self-correction ledger; it is neither a card count nor a root leaf count.",
        "claim registry heads are independent supersession chains and remain separate from board-axis counts."
      ],
    }

def main():
    ap=argparse.ArgumentParser(); ap.add_argument("--repo",type=Path,default=Path(__file__).resolve().parents[2])
    ap.add_argument("--out",type=Path,default=None); ap.add_argument("--check",action="store_true"); a=ap.parse_args()
    repo=a.repo.resolve(); doc=build(repo)
    out=a.out or repo/"public/evidence-manifest.json"
    if a.check and out.exists():
        old=load(out); old.pop("derived_at_utc",None); doc.pop("derived_at_utc",None)
        if old!=doc: raise SystemExit("evidence manifest drift")
        print("evidence manifest matches derived sources"); return
    out.write_text(json.dumps(doc,indent=2,ensure_ascii=False)+"\n",encoding="utf-8")
    print(out)

if __name__=="__main__": main()
