#!/usr/bin/env python3
"""Publish OUT to a NEW public Hugging Face dataset. Refuses if the repo already exists."""
import os, sys, urllib.request, urllib.error
from huggingface_hub import HfApi
out, repo = sys.argv[1], sys.argv[2]
api = HfApi(token=open(os.path.expanduser("~/.secrets/hf_token")).read().strip())
exists = api.repo_exists(repo, repo_type="dataset")   # authenticated: sees private repos too
if exists and "--update" not in sys.argv:
    sys.exit("REFUSED: %s already exists" % repo)
api.create_repo(repo, repo_type="dataset", private=False, exist_ok="--update" in sys.argv)
ci = api.upload_folder(folder_path=out, repo_id=repo, repo_type="dataset",
                       commit_message="evidence index v0.1: signed (board-attestation-1), OTS pending, verify.py")
info = api.dataset_info(repo)
print("commit", ci.oid if hasattr(ci, "oid") else ci, "sha", info.sha, "private", info.private, "files", len(info.siblings or []))
