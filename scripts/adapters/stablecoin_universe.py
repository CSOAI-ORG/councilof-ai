"""Compact public-root leaf for the frozen full stablecoin discovery index.

The leaf commits to the complete normalized index by SHA-256. It does not turn
registry metadata into independent on-chain measurements.
"""
from __future__ import annotations

import hashlib
import json
from pathlib import Path
from typing import Any

REL = Path("public/interop/stablecoin-universe-2026-09/index.json")
PUBLIC_URL = "https://councilof.ai/interop/stablecoin-universe-2026-09/index.json"


def collect(repo_root: Path) -> dict[str, Any]:
    path = repo_root / REL
    if not path.is_file():
        return {"leaves": [], "sidecar": {"status": "ABSENT", "path": str(REL)}}
    raw = path.read_bytes()
    try:
        index = json.loads(raw)
    except Exception as exc:
        return {"leaves": [], "sidecar": {"status": "INVALID", "reason": type(exc).__name__}}

    required = ("observed_at", "source", "source_sha256", "asset_count", "chain_count", "deployment_count")
    if any(key not in index for key in required) or len(index.get("assets") or []) != index.get("asset_count"):
        return {"leaves": [], "sidecar": {"status": "INVALID", "reason": "index contract"}}

    digest = hashlib.sha256(raw).hexdigest()
    leaf = {
        "surface": "public.notice",
        "subject": "stablecoin universe discovery index",
        "as_of": index["observed_at"],
        "source_urls": [str(index["source"]), PUBLIC_URL],
        "payload": {
            "kind": "csoai.stablecoin-index.commitment/v1",
            "state": "INDEXED",
            "release_id": "stablecoin-universe-2026-09",
            "index_sha256": digest,
            "source_sha256": index["source_sha256"],
            "assets": index["asset_count"],
            "chains": index["chain_count"],
            "deployments": index["deployment_count"],
            "deep_measured_assets": 1,
            "deep_measured_subjects": ["RLUSD"],
            "not_a_risk_score": True,
            "not_all_deep_measured": True,
        },
        "unmeasured": ["424 asset families not independently deep-measured in this release"],
        "tags": ["stablecoin", "discovery-index", "full-spread"],
    }
    return {
        "leaves": [leaf],
        "sidecar": {"status": "INDEXED", "index_sha256": digest, "assets": index["asset_count"]},
    }
