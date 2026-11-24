#!/usr/bin/env python3
# SPDX-License-Identifier: Apache-2.0
"""Date and qualify the historical ORB-III card without modifying frozen rows."""
from __future__ import annotations
import argparse, hashlib, json, os, subprocess, sys, tempfile, urllib.request
from pathlib import Path

REPO="csoai/hitl-academy-orb3"
URL="https://huggingface.co/datasets/"+REPO
B=chr(96)
HEADER="# HITL Academy — Level 3 · 3-Around-1 Temporal Sentinel ("+B+"ORB-III"+B+")"
LEGACY="- **Fluid (t_N):** 3-Around-1 Bidirectional Triad = 100.0% (32/32, McNemar p=9.54e-7) (CID "+B+"dc8cee6781b6d02f"+B+")"
GATE="Passing a module **unlocks the oversight decision path for that axis** — you cannot sign a"
MARKER="## Research correction — 23 November 2026"
NOTICE="""## Research correction — 23 November 2026

**Historical council performance claim qualified.** The 26 October 2026
3-around-1 study recorded 32/32 across 20 source-authored ledger queries
and 12 local Ollama tasks. This remains a historical rule-execution record,
not a blinded independent council accuracy result. In those twelve model
tasks, the model-only synthesiser achieved 9/12 and the deterministic centre
referee 12/12. The referee-visible metadata directly carried the correct
answer choice in 12/12 tasks. Forcing all model seats wrong still produced
12/12 correct choices; removing the answer-bearing metadata reduced that
counterfactual to 0/12. The original reported p-value cannot repair this
answer-key exposure. No genuine independent twelve-principal BFT quorum,
novel held-out accuracy, or human-authorised external action was tested.

**Human authority qualified.** Course/XP completion may set a software
learning-gate flag; it does not independently establish the reviewer's
identity, consent, current competence, appointment, human decision or
authority to execute an external action. Those remain separate governance
and verified effect-receipt obligations.

Historical signed result bytes and frozen learning rows remain unchanged.
This dated card qualification supersedes the earlier interpretation, not
the archived data. Source audit:
https://github.com/CSOAI-ORG/councilof-ai/blob/master/measurement/experiments/two-path-council/HISTORICAL-3AROUND1-AUDIT-2026-11-23.md
Correction tracking:
https://github.com/CSOAI-ORG/councilof-ai/issues/4737

"""

def sha(x):return hashlib.sha256(x).hexdigest()

def render(card):
    if not isinstance(card,str) or len(card)>100_000:
        raise ValueError("missing or excessive README")
    if MARKER in card:
        if "answer-bearing metadata" not in card or "not a blinded independent" not in card:
            raise ValueError("existing notice incomplete")
        return card
    if card.count(HEADER)!=1 or card.count(LEGACY)!=1 or card.count(GATE)!=1:
        raise ValueError("live card differs from expected history; refuse")
    revised=card.replace(HEADER+"\n",HEADER+"\n\n"+NOTICE,1)
    revised=revised.replace(LEGACY,
        "- **Fluid (t_N), historic source-specific claim:** reported 32/32"
        " (McNemar p=9.54e-7); **not an independent blinded council accuracy"
        " measurement**. See the dated source audit above.",1)
    revised=revised.replace(
        "Passing a module **unlocks the oversight decision path for that axis** — you cannot sign a\n"
        "human-oversight decision on an axis you have not been briefed on.",
        "Course completion can set a learning-path gate in the original software."
        " This alone does not establish an appointed human reviewer or permission"
        " to authorise an external oversight action.",1)
    if MARKER not in revised or LEGACY in revised or GATE in revised:
        raise ValueError("qualification failed")
    return revised

def privacy(root,p):
    subprocess.run([sys.executable,str(root/"scripts/privacy/publication_gate.py"),
         "--label","orb3-historical-card-correction",str(p)],check=True,cwd=root)

def publish(root):
    if os.getenv("GITHUB_REF")!="refs/heads/master" or os.getenv("GITHUB_EVENT_NAME") not in ("push","workflow_dispatch"):
        raise RuntimeError("protected master workflow only")
    token=os.getenv("HF_TOKEN","").strip()
    if not token:raise RuntimeError("HF write credential not available in protected job")
    source=root/"docs/corrections/ORBIII-HISTORICAL-COUNCIL-LIMITATION-2026-11-23.md"
    if not source.is_file() or any(x not in source.read_text() for x in ["9/12","12/12","0/12","answer-bearing","human authority"]):
        raise RuntimeError("source-reviewed correction absent")
    from huggingface_hub import HfApi, hf_hub_download, CommitOperationAdd
    api=HfApi(token=token)
    before=api.repo_info(repo_id=REPO,repo_type="dataset").sha
    if not before or len(before)!=40:raise RuntimeError("missing immutable HF source revision")
    old=Path(hf_hub_download(repo_id=REPO,filename="README.md",repo_type="dataset",
        revision=before,token=token,force_download=True)).read_text()
    new=render(old)
    if new==old:
        print(json.dumps({"state":"ALREADY_CORRECTED","source_revision":before}))
        return
    with tempfile.TemporaryDirectory(prefix="orb3-source-correction-") as t:
        p=Path(t)/"README.md";p.write_text(new,encoding="utf-8")
        privacy(root,p)
        result=api.create_commit(repo_id=REPO,repo_type="dataset",
            operations=[CommitOperationAdd(path_in_repo="README.md",path_or_fileobj=str(p))],
            parent_commit=before,commit_message="docs: qualify historical ORB-III 3-around-1 council metric")
        after=result.oid
        if not after or len(after)!=40:raise RuntimeError("HF commit identity absent")
        served=Path(hf_hub_download(repo_id=REPO,filename="README.md",repo_type="dataset",
                     revision=after,token=token,force_download=True)).read_bytes()
        if served!=p.read_bytes():raise RuntimeError("exact HF readback differs")
        print(json.dumps({"state":"EXACT_BYTES_VERIFIED","source_revision":before,
           "new_revision":after,"card_url":URL,"readme_sha256":sha(served),
           "frozen_dataset_rows_modified":False},sort_keys=True))

def main():
    a=argparse.ArgumentParser()
    a.add_argument("--check",action="store_true")
    a.add_argument("--publish",action="store_true")
    args=a.parse_args()
    if args.check==args.publish:a.error("choose exactly one operation")
    root=Path(__file__).resolve().parents[2]
    if args.check:
        request=urllib.request.Request(URL+"/resolve/main/README.md",
           headers={"User-Agent":"csoai-source-correction-preview/0.1","Cache-Control":"no-cache"})
        with urllib.request.urlopen(request,timeout=25) as r:
            if r.status!=200 or not r.headers.get("content-type","").startswith(("text/","application/octet-stream")):
                raise ValueError("public source README unavailable")
            raw=r.read(100_001)
        if len(raw)>100_000:raise ValueError("public README exceeds limit")
        output=render(raw.decode("utf-8"))
        with tempfile.TemporaryDirectory() as t:
            p=Path(t)/"README.md";p.write_text(output,encoding="utf-8")
            privacy(root,p)
            print(json.dumps({"state":"PREVIEW_ONLY","sha256":sha(output.encode()),"bytes":len(output.encode())}))
    else:publish(root)

if __name__=="__main__":
    main()
