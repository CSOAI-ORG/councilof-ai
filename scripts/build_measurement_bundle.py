#!/usr/bin/env python3
from __future__ import annotations
import argparse, json
from pathlib import Path
from lib.measurement_bundle import build, canonical_bytes, sha256_bytes

def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("spec")
    ap.add_argument("--root", default=".")
    ap.add_argument("--out-dir", required=True)
    ns = ap.parse_args()
    root = Path(ns.root).resolve()
    spec = json.loads((root / ns.spec).read_text(encoding="utf-8"))
    manifest, compact = build(spec, root)
    out = (root / ns.out_dir).resolve()
    out.mkdir(parents=True, exist_ok=True)
    manifest_p = out / "measurement-manifest.json"
    compact_p = out / "unsigned-cohort-card.json"
    manifest_p.write_text(json.dumps(manifest, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    compact_p.write_text(json.dumps({"body": compact, "signature": None, "did": "did:web:csoai.org#board-attestation-1"}, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(json.dumps({
        "state":"BUILT_UNSIGNED",
        "manifest":str(manifest_p.relative_to(root)),
        "manifest_sha256":manifest["manifest_sha256"],
        "atomic_count":manifest["atomic_count"],
        "atomic_merkle_root":manifest["atomic_merkle_root"],
        "compact_bytes":len(canonical_bytes(compact)),
        "compact_sha256":sha256_bytes(canonical_bytes(compact)),
    }, indent=2))
    return 0
if __name__ == "__main__":
    raise SystemExit(main())
