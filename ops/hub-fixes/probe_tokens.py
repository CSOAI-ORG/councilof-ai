#!/usr/bin/env python3
"""Report which identity/scopes the HF token has and whether Kaggle secrets are present. Never prints values."""
import os
from huggingface_hub import HfApi
t = os.environ.get("HF_TOKEN")
if not t:
    print("HF_TOKEN: missing")
else:
    w = HfApi(token=t).whoami()
    auth = (w.get("auth") or {}).get("accessToken") or {}
    print(f"HF identity: {w.get('name')} | token role: {auth.get('role')} | orgs: {[o.get('name') for o in w.get('orgs', [])]}")
    for sc in (auth.get("fineGrained") or {}).get("scoped", []):
        e = sc.get("entity", {})
        print(f"  scope {e.get('type')}:{e.get('name')} -> {sc.get('permissions')}")
print("KAGGLE_USERNAME set:", bool(os.environ.get("KAGGLE_USERNAME")), "| KAGGLE_KEY set:", bool(os.environ.get("KAGGLE_KEY")))
