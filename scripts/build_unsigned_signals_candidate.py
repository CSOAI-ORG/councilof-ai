#!/usr/bin/env python3
import argparse
import hashlib
import json
import sys
import urllib.request
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
import emit_signals as es

def fetch_bytes(url: str) -> bytes:
    req = urllib.request.Request(url, headers={"User-Agent":"CSOAI-layer0-candidate/0.1"})
    with urllib.request.urlopen(req, timeout=30) as r:
        return r.read()

def load_local_or_public(path: str, url: str):
    p=Path(path)
    if p.exists():
        b=p.read_bytes()
        return b, f"file:{path}"
    b=fetch_bytes(url)
    return b, url

def main():
    ap=argparse.ArgumentParser()
    ap.add_argument("--out", required=True)
    ap.add_argument("--source-commit", required=True)
    ap.add_argument("--leaderboard", default="public/arena/elo_reference.json")
    ap.add_argument("--leaderboard-url", default="https://councilof.ai/arena/elo_reference.json")
    args=ap.parse_args()

    out=Path(args.out)
    out.mkdir(parents=True, exist_ok=True)

    reg_bytes=fetch_bytes(es.REGISTER_URL)
    board_bytes=fetch_bytes(es.BOARD_URL)
    root_bytes=fetch_bytes("https://councilof.ai/root.json")
    lb_bytes, lb_source=load_local_or_public(args.leaderboard,args.leaderboard_url)

    reg=json.loads(reg_bytes)
    board=json.loads(board_bytes)
    root=json.loads(root_bytes)
    lb=json.loads(lb_bytes)

    by_slug=es.board_rows_by_slug(board)
    if not by_slug:
        raise SystemExit("GATE: current board has no model-comparison separation authority")

    generated="UNSIGNED-CANDIDATE"

    rows=[]
    full=[]
    for a in reg.get("axes",[]):
        axis=a["axis"]
        b=es.board_row_for(axis,by_slug)
        if b is None:
            raise SystemExit(f"GATE: register axis {axis} has no board row")
        body=es.derive_signal(a,(lb.get("per_axis") or {}).get(axis,[]),lb,generated,None,b)
        cid=hashlib.sha256(es.assert_ascii(body,f"unsigned signal {axis}")).hexdigest()
        body["candidate_content_id"]=cid
        body["candidate_unsigned"]=True
        full.append(body)
        rows.append({
            "axis":axis,
            "status":body["status"],
            "elo_leader":body["elo_leader"],
            "elo_top":body["elo_top"]["model"] if body["elo_top"] else None,
            "elo_separation":body["elo_separation"],
            "board_axis":body["separation_authority"]["board_axis"],
            "board_separation":body["separation_authority"]["board_separation"],
            "board_leader":body["separation_authority"]["board_leader"],
            "candidate_content_id":cid,
        })

    index={
      "schema":"csoai.signals-candidate/0.1",
      "status":"UNSIGNED_NOT_PUBLISHED",
      "generated_marker":generated,
      "source_commit":args.source_commit,
      "register_sha256":hashlib.sha256(reg_bytes).hexdigest(),
      "board_sha256":hashlib.sha256(board_bytes).hexdigest(),
      "leaderboard_source":lb_source,
      "leaderboard_sha256":hashlib.sha256(lb_bytes).hexdigest(),
      "elo_source_content_id":lb.get("content_id"),
      "signals":rows,
    }
    index_bytes=json.dumps(index,indent=1,ensure_ascii=False,sort_keys=True).encode()+b"\n"
    (out/"_index.candidate.json").write_bytes(index_bytes)
    (out/"signals.candidate.json").write_text(json.dumps(full,indent=1,ensure_ascii=False,sort_keys=True)+"\n")

    binding={
      "schema":"csoai.layer0-signals-root-binding/0.1",
      "status":"CANDIDATE_NOT_EFFECTIVE",
      "source_commit":args.source_commit,
      "root":{
        "sha256":hashlib.sha256(root_bytes).hexdigest(),
        "merkle_root":root.get("merkle_root"),
        "card_count":root.get("card_count"),
        "as_of":root.get("as_of"),
      },
      "signals":{
        "index_sha256":hashlib.sha256(index_bytes).hexdigest(),
        "count":len(rows),
        "generated_marker":generated,
        "register_sha256":hashlib.sha256(reg_bytes).hexdigest(),
        "board_sha256":hashlib.sha256(board_bytes).hexdigest(),
        "leaderboard_sha256":hashlib.sha256(lb_bytes).hexdigest(),
      },
      "authority":{
        "signed":False,
        "published":False,
        "production_effect":False,
        "requires_owner_authorization_for_sign_publish_anchor":True,
      },
    }
    binding_bytes=json.dumps(binding,indent=1,ensure_ascii=False,sort_keys=True).encode()+b"\n"
    (out/"binding.candidate.json").write_bytes(binding_bytes)
    print(json.dumps({
      "state":"PASS_UNSIGNED_CANDIDATE",
      "signals":len(rows),
      "signals_index_sha256":hashlib.sha256(index_bytes).hexdigest(),
      "binding_sha256":hashlib.sha256(binding_bytes).hexdigest(),
      "root_sha256":binding["root"]["sha256"],
      "root_merkle":binding["root"]["merkle_root"],
      "root_card_count":binding["root"]["card_count"],
      "generated_marker":generated,
      "leaderboard_source":lb_source,
    },sort_keys=True))

if __name__=="__main__":
    main()
