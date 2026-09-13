#!/usr/bin/env python3
"""Deduplicate the agent-interop census into canonical identities (TUI-3 lane).

Reads the canonical public dataset (csoai/agent-interop-census on HF, or a
local copy) and collapses rows to canonical (source, kind, id) identities with
all observed versions preserved. A registry row is an index entry — DISCOVERED,
never a grade; dedupe changes nothing about that.

Outputs (pack public/interop/agent-interop-canonical-2026-09/):
  canonical-register.jsonl   one line per canonical identity (versions[],
                             latest observed, repo_url, source status)
  dedupe-report.json         counts, rules, collision class examples
  card-*-unsigned.json       one staged summary atom (publisher intake)

The register is regenerable from the pinned census manifest sha256; the report
carries that pin so the derivation is reproducible. Never raises.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import sys
import urllib.request
from collections import defaultdict
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent.parent
PACK = "agent-interop-canonical-2026-09"
PACK_DIR = ROOT / "public" / "interop" / PACK
HF_BASE = "https://huggingface.co/datasets/csoai/agent-interop-census"
CENSUS_URL = f"{HF_BASE}/resolve/main/census.jsonl"
MANIFEST_URL = f"{HF_BASE}/raw/main/manifest.json"
UA = {"User-Agent": "councilof-ai-conformance/0.1"}


def _now() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def _canon(obj) -> bytes:
    return json.dumps(obj, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode("utf-8")


def _version_key(v: str) -> tuple:
    parts = []
    for p in str(v).replace("-", ".").split("."):
        parts.append((0, int(p)) if p.isdigit() else (1, p))
    return tuple(parts)


def dedupe(rows_path: Path) -> dict:
    identities: dict[tuple, dict] = {}
    by_repo: dict[str, set] = defaultdict(set)
    rows = 0
    for line in rows_path.open(encoding="utf-8"):
        r = json.loads(line)
        rows += 1
        key = (r.get("source"), r.get("kind"), r.get("id"))
        if not key[2]:
            continue
        ent = identities.get(key)
        if ent is None:
            ent = {"source": key[0], "kind": key[1], "id": key[2],
                   "versions": [], "status": r.get("status"),
                   "exposes_remote_endpoint": bool(r.get("exposes_remote_endpoint")),
                   "repo_url": r.get("repo_url")}
            identities[key] = ent
        v = r.get("version")
        if v and v not in ent["versions"]:
            ent["versions"].append(v)
        if r.get("is_latest"):
            ent["latest_observed"] = v
        if r.get("repo_url"):
            ent["repo_url"] = r["repo_url"]
            by_repo[r["repo_url"]].add((key[0], key[2]))
        if r.get("exposes_remote_endpoint"):
            ent["exposes_remote_endpoint"] = True
    for ent in identities.values():
        ent["versions"].sort(key=_version_key)
        ent["n_versions"] = len(ent["versions"])
        if "latest_observed" not in ent and ent["versions"]:
            ent["latest_observed"] = ent["versions"][-1]
    cross_source = sum(1 for v in by_repo.values() if len(v) > 1)
    multi_version = sum(1 for e in identities.values() if e["n_versions"] > 1)
    return {
        "rows": rows,
        "identities": identities,
        "n_canonical": len(identities),
        "multi_version": multi_version,
        "repo_groups": len(by_repo),
        "cross_source_links": cross_source,
    }


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--census", default=None, help="local census.jsonl (default: fetch from HF)")
    args = ap.parse_args()

    ts = _now()
    PACK_DIR.mkdir(parents=True, exist_ok=True)

    census_pin = None
    if args.census:
        rows_path = Path(args.census)
        census_pin = {"local_file": str(rows_path),
                      "sha256": hashlib.sha256(rows_path.read_bytes()).hexdigest()}
    else:
        try:
            man = json.loads(urllib.request.urlopen(
                urllib.request.Request(MANIFEST_URL, headers=UA), timeout=25).read())
            census_pin = {"dataset": "csoai/agent-interop-census", "manifest_as_of": man.get("as_of"),
                          "census_sha256": next((f["sha256"] for f in man.get("files", [])
                                                 if f.get("path") == "census.jsonl"), None)}
        except Exception as e:
            print(f"census manifest UNCHECKABLE: {type(e).__name__}")
            return 0
        rows_path = Path("/tmp/agent-interop-census.jsonl")
        if not rows_path.is_file():
            try:
                with urllib.request.urlopen(urllib.request.Request(CENSUS_URL, headers=UA), timeout=300) as r:
                    rows_path.write_bytes(r.read())
            except Exception as e:
                print(f"census download UNCHECKABLE: {type(e).__name__}")
                return 0

    result = dedupe(rows_path)

    reg_path = PACK_DIR / "canonical-register.jsonl"
    with reg_path.open("w", encoding="utf-8") as f:
        for ent in sorted(result["identities"].values(), key=lambda e: (e["source"], e["kind"], e["id"])):
            f.write(json.dumps(ent, sort_keys=True) + "\n")
    reg_sha = hashlib.sha256(reg_path.read_bytes()).hexdigest()

    examples = [e for e in result["identities"].values() if e["n_versions"] > 5][:3]
    report = {
        "schema": "csoai.agent-interop-canonical/0.1",
        "generated_at": ts,
        "census_pin": census_pin,
        "rules": [
            "canonical identity = (source, kind, id); all observed versions preserved, latest_observed from is_latest flag else max version",
            "cross-source linkage via exact repo_url only — name similarity is never merged",
            "a census row is DISCOVERED (index entry); dedupe does not grade",
        ],
        "counts": {
            "census_rows": result["rows"],
            "canonical_identities": result["n_canonical"],
            "multi_version_identities": result["multi_version"],
            "repo_url_groups": result["repo_groups"],
            "cross_source_links": result["cross_source_links"],
        },
        "collision_examples": [{"id": e["id"], "source": e["source"], "n_versions": e["n_versions"]} for e in examples],
        "register": {"path": f"canonical-register.jsonl", "sha256": reg_sha,
                     "bytes": reg_path.stat().st_size,
                     "url": f"https://councilof.ai/interop/{PACK}/canonical-register.jsonl"},
        "reproduce": "python3 scripts/census/dedupe-agent-interop.py  (fetches the pinned census)",
    }
    (PACK_DIR / "dedupe-report.json").write_text(json.dumps(report, indent=1, sort_keys=True) + "\n")

    payload = {
        "kind": "csoai.agent-interop-canonical/0.1",
        "state": "PROBED",
        "census_rows": result["rows"],
        "canonical_identities": result["n_canonical"],
        "multi_version_identities": result["multi_version"],
        "cross_source_links": result["cross_source_links"],
        "census_pin_sha256": (census_pin or {}).get("census_sha256") or (census_pin or {}).get("sha256"),
        "register_sha256": reg_sha,
        "not_a_measurement": True,
        "report": f"https://councilof.ai/interop/{PACK}/dedupe-report.json",
    }
    card = {
        "schema": "https://councilof.ai/schema/card-v0.json",
        "surface": "public.notice",
        "subject": "Agent-interop census dedupe: rows to canonical identities",
        "as_of": ts,
        "source_urls": [f"{HF_BASE}", f"https://councilof.ai/interop/{PACK}/dedupe-report.json"],
        "payload": payload,
        "sha256": hashlib.sha256(_canon(payload)).hexdigest(),
        "unmeasured": ["liveness", "conformance", "quality of any listed server"],
        "tags": ["agent-interop", "census", "dedupe", PACK],
    }
    assert len(_canon(card)) <= 3072
    (PACK_DIR / "card-agent-interop-canonical-unsigned.json").write_text(
        json.dumps(card, indent=1, sort_keys=True) + "\n")

    print(json.dumps(report["counts"], sort_keys=True))
    print(f"register sha256 {reg_sha[:16]}… ({reg_path.stat().st_size} bytes)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
