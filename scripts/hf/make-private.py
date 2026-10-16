"""Make listed csoai HF repos private. Never deletes. Reads back visibility.
DOI datasets (gspc-boards, signed-fleet-boards-v2) are excluded: HF blocks visibility changes once a DOI exists."""
import os, sys
from huggingface_hub import HfApi
ORG = "csoai"
api = HfApi(token=os.environ.get("HF_TOKEN"))
dry = os.environ.get("DRY_RUN", "true") == "true"
rows = [l.split() for l in open("scripts/hf/retire-private-list.txt") if l.strip()]
assert len(rows) == 33, len(rows)
fails = []
for kind, name in rows:
    rid = f"{ORG}/{name}"
    try:
        if not dry:
            api.update_repo_settings(rid, repo_type=kind, private=True)
        info = api.repo_info(rid, repo_type=kind)
        print(f"{kind}\t{rid}\tprivate={info.private}")
        if not dry and not info.private:
            fails.append((rid, "still public after update"))
    except Exception as e:
        msg = str(e).splitlines()[0][:200]
        print(f"{kind}\t{rid}\tERROR {msg}")
        fails.append((rid, msg))
print(f"done dry_run={dry} n={len(rows)} failures={len(fails)}")
for rid, msg in fails:
    print(f"FAIL\t{rid}\t{msg}")
sys.exit(1 if fails else 0)
