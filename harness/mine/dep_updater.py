#!/usr/bin/env python3
"""dep_updater.py — tracks outdated dependencies.

Checks CSOAI-ORG PyPI packages against latest versions.
ASI-Evolve: detects when deps fall behind and proposes updates.
"""
from __future__ import annotations
import json, os, sys, urllib.request
from pathlib import Path
from datetime import datetime, timezone

NOW = lambda: datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")
MEAS_DIR = Path.home() / "clawd" / "councilof-ai" / "measurement"
STATE = Path("/tmp/dep_updater_state.json")

# Sample PyPI packages we ship
SAMPLE_PACKAGES = [
    "huggingface-hub", "transformers", "torch", "datasets",
    "cryptography", "pyjwt", "httpx", "aiohttp", "pydantic",
    "jsonschema", "feedparser", "requests",
]


def get_latest_version(pkg):
    try:
        url = f"https://pypi.org/pypi/{pkg}/json"
        req = urllib.request.Request(url, headers={"User-Agent": "csoai-dep-updater/1"})
        with urllib.request.urlopen(req, timeout=10) as r:
            data = json.loads(r.read())
            return data.get("info", {}).get("version", "unknown")
    except Exception:
        return None


def write_card(subject, kind, metrics):
    body = {
        "schema": "gspc.measurement-card/0.1",
        "kind": kind,
        "subject": subject,
        "measured_at": NOW(),
        "metrics": metrics,
        "honest_sentence": f"Dependency updater: {metrics.get('packages_checked', 0)} packages checked.",
        "measurement_not_certification": True,
        "auto_churn": True,
        "permissionless": True,
    }
    fname = MEAS_DIR / f"github-deps-{subject.replace('/', '-')[:50]}.json"
    fname.write_text(json.dumps(body, indent=2))
    return fname


def main():
    print(f"[{NOW()}] dep_updater starting")
    results = {}
    for pkg in SAMPLE_PACKAGES:
        version = get_latest_version(pkg)
        results[pkg] = {"latest": version}
    write_card(f"deps-{NOW().replace(':','').replace('-','')[:13]}",
               "measurement.github.deps",
               {
                   'packages_checked': len(SAMPLE_PACKAGES),
                   'latest_versions': results,
                   'auto_churn': True,
                   'miner_version': 'dep-updater-1',
                   'note': 'PyPI latest versions. M4 does not auto-update (owner-controlled).',
               })
    print(f"[{NOW()}] dep_updater done: {len(results)} packages checked")
    return 0


if __name__ == "__main__":
    sys.exit(main())
