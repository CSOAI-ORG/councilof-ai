"""Make listed csoai HF repos private. Never deletes. Reads back visibility."""
import os, sys
from huggingface_hub import HfApi
ORG = "csoai"
api = HfApi(token=os.environ.get("HF_TOKEN"))
dry = os.environ.get("DRY_RUN", "true") == "true"
rows = [l.split() for l in open("scripts/hf/retire-private-list.txt") if l.strip()]
assert len(rows) == 35, len(rows)
bad = 0
for kind, name in rows:
    rid = f"{ORG}/{name}"
    if not dry:
        api.update_repo_settings(rid, repo_type=kind, private=True)
    info = api.repo_info(rid, repo_type=kind)
    print(f"{kind}\t{rid}\tprivate={info.private}")
    if not dry and not info.private:
        bad += 1
print(f"done dry_run={dry} n={len(rows)} not_private={bad}")
sys.exit(1 if bad else 0)
