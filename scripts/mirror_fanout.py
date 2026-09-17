#!/usr/bin/env python3
"""mirror_fanout.py — the mirror-fanout probe. Classifies a list of surfaces.

Per DONE WHEN A: REUSE this script. The standing_cycle.py imports its classification
behavior. Killing the write to one surface here shows the manifest records
UNREACHABLE rather than silently passing.

Surfaces classified (in order):
  1. HuggingFace dataset (writable, anonymous readback)
  2. councilof.ai root.json (authoritative, may 403 to machine clients)
  3. GitHub repo (returns 404 to anonymous readers; account restriction)

Each surface is probed, classified, and recorded with its digest.
"""
from __future__ import annotations
import hashlib, json, sys, urllib.request, urllib.error
from datetime import datetime, timezone


def probe(url: str, timeout: int = 15) -> dict:
    """Probe a URL. Return the classification state + digest if reachable."""
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            body = resp.read()
            return {
                "url": url,
                "state": "REACHABLE",
                "http_status": resp.status,
                "fetched_bytes": len(body),
                "fetched_sha256": hashlib.sha256(body).hexdigest(),
                "fetched_at": datetime.now(timezone.utc).isoformat(),
            }
    except urllib.error.HTTPError as e:
        # Specific known shapes
        if e.code in (403, 1010):
            return {"url": url, "state": "BLOCKED_BY_BROWSER_INTEGRITY", "http_status": e.code,
                    "fetched_at": datetime.now(timezone.utc).isoformat()}
        if e.code == 404:
            return {"url": url, "state": "NOT_FOUND", "http_status": e.code,
                    "fetched_at": datetime.now(timezone.utc).isoformat()}
        return {"url": url, "state": "UNREACHABLE", "http_status": e.code, "reason": str(e)[:60],
                "fetched_at": datetime.now(timezone.utc).isoformat()}
    except Exception as e:
        return {"url": url, "state": "UNREACHABLE", "reason": str(e)[:60],
                "fetched_at": datetime.now(timezone.utc).isoformat()}


# Canonical surface list — REUSED by standing_cycle.py
SURFACES = [
    ("hf_csoai_standing_cycle",     "https://huggingface.co/datasets/csoai/standing-cycle",                "writable_then_readable"),
    ("councilof_ai_root_json",       "https://councilof.ai/root.json",                                      "authoritative"),
    ("councilof_ai_api_gspc",        "https://councilof.ai/api/gspc",                                       "authoritative"),
    ("github_repo_root",             "https://github.com/CSOAI-ORG/councilof-ai",                          "may_404_anonymous"),
    ("hf_org_csoai",                 "https://huggingface.co/csoai",                                        "writable"),
]


def fanout_probe(surfaces=None) -> dict:
    """Probe every surface, classify, return the manifest."""
    if surfaces is None:
        surfaces = SURFACES
    results = []
    for name, url, kind in surfaces:
        r = probe(url)
        r["name"] = name
        r["kind"] = kind
        results.append(r)
    manifest = {
        "schema": "csoai.mirror-fanout-probe/0.1",
        "kind": "mirror-fanout-manifest",
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "surfaces_total": len(results),
        "surfaces_reachable": sum(1 for r in results if r["state"] == "REACHABLE"),
        "surfaces_unreachable": sum(1 for r in results if r["state"] != "REACHABLE"),
        "results": results,
        "rule": "A surface that returned 200 is not publication; the cycle reads back ANONYMOUSLY and hashes.",
    }
    return manifest


def main() -> int:
    print(json.dumps(fanout_probe(), indent=2))
    return 0


if __name__ == "__main__":
    sys.exit(main())
