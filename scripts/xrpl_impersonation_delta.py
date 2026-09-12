#!/usr/bin/env python3
"""Delta between two XRPL impersonation scan snapshots (TUI-3 overnight brief).

Compares a prior committed snapshot against a newer one and writes a dated
delta artifact into the pack: added / removed / reclassified hits, per-code
count movement, window changes. Facts only — a disappearance is "not observed
in the newer window", never a verdict.

Usage:
  python3 scripts/xrpl_impersonation_delta.py <prior.json> <new.json> [--out PATH]
"""
from __future__ import annotations

import argparse
import json
from datetime import datetime, timezone
from pathlib import Path


def _load(path: Path) -> dict:
    d = json.loads(path.read_bytes())
    if not isinstance(d, dict) or not str(d.get("schema", "")).startswith("csoai.xrpl-impersonation-scan/"):
        raise SystemExit(f"refusing: {path} is not an impersonation scan snapshot")
    return d


def _key(h: dict) -> str:
    return f"{h.get('code')}.{h.get('issuer')}"


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("prior")
    ap.add_argument("new")
    ap.add_argument("--out", default=None)
    args = ap.parse_args()

    prior, new = _load(Path(args.prior)), _load(Path(args.new))
    p_hits = {_key(h): h for h in prior.get("hits", [])}
    n_hits = {_key(h): h for h in new.get("hits", [])}

    added = [n_hits[k] for k in sorted(n_hits.keys() - p_hits.keys())]
    removed = [p_hits[k] for k in sorted(p_hits.keys() - n_hits.keys())]
    reclassified = []
    changed_supply = []
    for k in sorted(p_hits.keys() & n_hits.keys()):
        a, b = p_hits[k], n_hits[k]
        if a.get("classification") != b.get("classification"):
            reclassified.append({"id": k, "from": a.get("classification"), "to": b.get("classification")})
        if a.get("supply") != b.get("supply"):
            changed_supply.append({"id": k, "prior_supply": a.get("supply"), "new_supply": b.get("supply"),
                                   "prior_holders": a.get("holders"), "new_holders": b.get("holders")})

    delta = {
        "schema": "csoai.xrpl-impersonation-delta/0.1",
        "generated_at": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "prior": {"generated_at": prior.get("generated_at"), "window": prior.get("scan_coverage", {}).get("window"),
                  "n_scanned": prior.get("scan_coverage", {}).get("n_scanned")},
        "new": {"generated_at": new.get("generated_at"), "window": new.get("scan_coverage", {}).get("window"),
                "n_scanned": new.get("scan_coverage", {}).get("n_scanned")},
        "counts": {
            "added": len(added), "removed": len(removed),
            "reclassified": len(reclassified), "supply_changed": len(changed_supply),
        },
        "added": added,
        "removed_note": "not observed in the newer window — never a verdict",
        "removed": removed,
        "reclassified": reclassified,
        "supply_changed": changed_supply,
    }
    out = Path(args.out) if args.out else Path(
        f"public/interop/xrpl-impersonation-2026-09/delta-{delta['generated_at'][:10]}.json")
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(delta, indent=1, sort_keys=True) + "\n")
    print(f"delta -> {out}  +{len(added)} -{len(removed)} ~{len(reclassified)} reclassified, {len(changed_supply)} supply-changed")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
