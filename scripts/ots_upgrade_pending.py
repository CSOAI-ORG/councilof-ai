#!/usr/bin/env python3
"""Upgrade the public OTS proofs that are still calendar-pending, on the GitHub path.

WHY THIS EXISTS (A-G4, 7 Oct 2026). A byte scan of master found 707 proofs: 689 carry a Bitcoin
attestation and 18 are pending-only, the oldest committed on 17 Sep. Six of the 18 are card-root
proofs (card-root-ots-upgrade.yml maintains those). Nothing maintained the other twelve: the only
upgrader was an Oracle job that ssh'd to a dead pod and wrote to the frozen canon, and the
single-writer ruling of 6 Oct means the pod does not publish anyway. ots-upgrade.yml runs this
daily and opens a PR.

WHAT IT TOUCHES. Tracked proofs under public/ whose bytes parse and carry only pending
attestations, excluding the two families with their own maintainers:
  public/interop/card-root-*.ots   (card-root-ots-upgrade.yml)
  public/interop/root-*.json.ots   (public-root-candidate-upgrade.yml)
Each is upgraded in place by scripts/ots-upgrade.py, which rewrites a file only when the upgraded
proof carries a Bitcoin attestation. A proof that is still pending is never rewritten.

BOUND PROOFS ARE LEFT ALONE. Some files commit to a proof's exact bytes: anchors.json names
index.json.ots by sha256, and ots-exact-bindings-v1.json names a press proof. Upgrading such a
proof would silently break that binding, and the binding file is often itself signed or stamped.
So before upgrading, every candidate's sha256 is searched for in all tracked files (hex, base64 and
SRI forms, the manifest excepted). A bound proof is skipped and reported as BOUND: its producer
has to re-derive the binding in the same change.

    python3 scripts/ots_upgrade_pending.py --report out.json            # upgrade in place
    python3 scripts/ots_upgrade_pending.py --report out.json --dry-run  # list only, no network

Exit 0 always on a completed run (a still-pending proof is not an error); 2 on a refusal.
"""
from __future__ import annotations

import argparse
import base64
import datetime
import hashlib
import json
import pathlib
import re
import subprocess
import sys

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
from ots_manifest_rebuild import classify  # noqa: E402

OWN_MAINTAINER = (
    re.compile(r"public/interop/card-root-[^/]*\.ots\Z"),
    re.compile(r"public/interop/root-[^/]*\.json\.ots\Z"),
)
MANIFEST = "public/interop/ots/manifest.json"


def tracked_proofs(repo: pathlib.Path) -> list[str]:
    out = subprocess.check_output(["git", "ls-files", "-z", "--", "public/*.ots", "public/**/*.ots"], cwd=repo)
    return sorted({p for p in out.decode().split("\0") if p})


def binding_forms(raw: bytes) -> list[str]:
    d = hashlib.sha256(raw).digest()
    b64 = base64.b64encode(d).decode()
    return [d.hex(), b64, "sha256-" + b64, base64.urlsafe_b64encode(d).decode().rstrip("=")]


def bound_by(repo: pathlib.Path, raw: bytes, proof: str) -> list[str]:
    """Tracked files (other than the proof and the OTS manifest) that name these exact proof bytes."""
    hits: set[str] = set()
    for form in binding_forms(raw):
        r = subprocess.run(["git", "grep", "-l", "-F", "-e", form, "--", ".",
                            f":(exclude){MANIFEST}", f":(exclude){proof}"],
                           cwd=repo, capture_output=True, text=True)
        hits.update(line for line in r.stdout.splitlines() if line)
    return sorted(hits)


def plan(repo: pathlib.Path) -> dict:
    pending, bound, skipped_own = [], {}, []
    for rel in tracked_proofs(repo):
        if any(rx.fullmatch(rel) for rx in OWN_MAINTAINER):
            if classify(repo / rel)[0] == "PENDING":
                skipped_own.append(rel)
            continue
        if classify(repo / rel)[0] != "PENDING":
            continue
        hits = bound_by(repo, (repo / rel).read_bytes(), rel)
        if hits:
            bound[rel] = hits
        else:
            pending.append(rel)
    return {"candidates": pending, "bound": bound, "own_maintainer": skipped_own}


def main(argv=None) -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--repo", default=".", type=pathlib.Path)
    ap.add_argument("--report", required=True, type=pathlib.Path)
    ap.add_argument("--dry-run", action="store_true")
    a = ap.parse_args(argv)
    repo = a.repo.resolve()
    p = plan(repo)
    before = {rel: (repo / rel).read_bytes() for rel in p["candidates"]}
    if p["candidates"] and not a.dry_run:
        # exit 1 from ots-upgrade.py means "still pending everywhere", which is not an error here
        subprocess.run([sys.executable, str(repo / "scripts" / "ots-upgrade.py"), *p["candidates"]], cwd=repo, check=False)
    upgraded, still_pending = [], []
    for rel, raw in before.items():
        now = (repo / rel).read_bytes()
        if now == raw:
            still_pending.append(rel)
        elif classify(repo / rel)[0] == "BITCOIN":
            upgraded.append(rel)
        else:  # rewritten but not a Bitcoin proof: never publish that; put the bytes back
            (repo / rel).write_bytes(raw)
            still_pending.append(rel)
    report = {
        "schema": "csoai.ots-upgrade-pending/1",
        "ran_at": datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "dry_run": a.dry_run,
        "upgraded": upgraded,
        "still_pending": still_pending,
        "bound_skipped": p["bound"],
        "own_maintainer_skipped": p["own_maintainer"],
        "chain_verified": False,
        "limit": ("An upgraded proof carries a Bitcoin attestation tag parsed by python-opentimestamps. This step "
                  "runs no Bitcoin node; ots_block_check.py compares each new attestation with two public "
                  "block explorers before the PR opens."),
    }
    a.report.write_text(json.dumps(report, indent=2) + "\n")
    print(f"upgraded={len(upgraded)} still_pending={len(still_pending)} bound_skipped={len(p['bound'])} "
          f"own_maintainer_skipped={len(p['own_maintainer'])}")
    for rel, hits in p["bound"].items():
        print(f"  BOUND {rel} <- {', '.join(hits)} (its producer must re-derive the binding)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
