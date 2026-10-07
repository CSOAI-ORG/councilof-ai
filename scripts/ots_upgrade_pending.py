#!/usr/bin/env python3
"""Upgrade the public OTS proofs that are still calendar-pending, on the GitHub path.

WHY THIS EXISTS (A-G4, 7 Oct 2026). A byte scan of master found 707 proofs: 689 carry a Bitcoin
attestation and 18 are pending-only, the oldest committed on 17 Sep. Six of the 18 are card-root
proofs (card-root-ots-upgrade.yml maintains those). Nothing maintained the other twelve: the only
upgrader was an Oracle job that ssh'd to a dead pod and wrote to the frozen canon, and the
single-writer ruling of 6 Oct means the pod does not publish anyway. ots-upgrade.yml runs this
daily and keeps one PR.

WHAT IT TOUCHES. Tracked proofs under public/ whose bytes parse and carry only pending
attestations, excluding the two families with their own maintainers:
  public/interop/card-root-*.ots   (card-root-ots-upgrade.yml)
  public/interop/root-*.json.ots   (public-root-candidate-upgrade.yml)
Each is upgraded in place by scripts/ots-upgrade.py, which rewrites a file only when the upgraded
proof carries a Bitcoin attestation. A proof that is still pending is never rewritten.

BOUND PROOFS. Some files commit to a proof's exact bytes, so before upgrading, every candidate's
sha256 is searched for in all tracked files (hex, base64 and SRI forms, the OTS manifest excepted:
it is rebuilt from the bytes in the same change). Upgrading a bound proof without its binding would
silently break the binding, so:
  * a proof bound ONLY by files in REDERIVABLE below is upgraded, and its bindings are re-derived in
    the same change by --rederive (run after ots_block_check.py, whose result anchors.json records);
  * a proof bound by anything else is skipped and reported as BOUND: its producer has to re-derive
    the binding.
A REDERIVABLE file is used only while it is unsigned and unstamped: no sibling .ots/.sig/.jws, no
"signed": true, and its own bytes named by no other tracked file. Otherwise its proof is BOUND.
On master on 7 Oct the three bound proofs were exactly these: measurement-capsules/v0.2/index.json.ots
(anchors.json), measurement-capsules/v0.2/self_parity/record.json.ots (mechanism/vc.json, produced
by scripts/mechanism/capsule-vc.mjs) and press/2026-09-17-can-you-check-their-work.r2.md.ots
(interop/ots-exact-bindings-v1.json, checked by root-witness-release-gate.py).

    python3 scripts/ots_upgrade_pending.py --report out.json --stage-dir DIR   # upgrade, copy for the check
    python3 scripts/ots_upgrade_pending.py --report out.json --dry-run         # list only, no network
    python3 scripts/ots_upgrade_pending.py --rederive --report out.json --block-check check.json

Exit 0 on a completed run (a still-pending proof is not an error); 2 on a refusal.
"""
from __future__ import annotations

import argparse
import base64
import datetime
import hashlib
import io
import json
import pathlib
import re
import shutil
import subprocess
import sys

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
from ots_manifest_rebuild import classify  # noqa: E402

OWN_MAINTAINER = (
    re.compile(r"public/interop/card-root-[^/]*\.ots\Z"),
    re.compile(r"public/interop/root-[^/]*\.json\.ots\Z"),
)
MANIFEST = "public/interop/ots/manifest.json"
REDERIVABLE = {
    "public/interop/ots-exact-bindings-v1.json": "exact_bindings",
    "public/mechanism/vc.json": "capsule_vc",
    "public/measurement-capsules/v0.2/anchors.json": "capsule_anchors",
}


def sha(raw: bytes) -> str:
    return hashlib.sha256(raw).hexdigest()


def tracked_proofs(repo: pathlib.Path) -> list[str]:
    out = subprocess.check_output(["git", "ls-files", "-z", "--", "public/*.ots", "public/**/*.ots"], cwd=repo)
    return sorted({p for p in out.decode().split("\0") if p})


def digest_forms(d: bytes) -> list[str]:
    b64 = base64.b64encode(d).decode()
    return [d.hex(), b64, "sha256-" + b64, base64.urlsafe_b64encode(d).decode().rstrip("=")]


def binding_forms(raw: bytes) -> list[str]:
    return digest_forms(hashlib.sha256(raw).digest())


def named_by(repo: pathlib.Path, d: bytes, path: str) -> list[str]:
    """Tracked files (other than `path` itself and the OTS manifest) that name sha256 digest `d`."""
    hits: set[str] = set()
    for form in digest_forms(d):
        r = subprocess.run(["git", "grep", "-l", "-F", "-e", form, "--", ".",
                            f":(exclude){MANIFEST}", f":(exclude){path}"],
                           cwd=repo, capture_output=True, text=True)
        hits.update(line for line in r.stdout.splitlines() if line)
    return sorted(hits)


def bound_by(repo: pathlib.Path, raw: bytes, path: str) -> list[str]:
    """Tracked files (other than `path` itself and the OTS manifest) that name these exact bytes."""
    return named_by(repo, hashlib.sha256(raw).digest(), path)


def rederivable(repo: pathlib.Path, binding: str) -> str | None:
    """Why `binding` may NOT be re-derived here, or None when it may."""
    if binding not in REDERIVABLE:
        return "no known producer here"
    p = repo / binding
    for suffix in (".ots", ".sig", ".jws"):
        if (repo / (binding + suffix)).exists():
            return f"it is stamped or signed ({binding}{suffix})"
    try:
        doc = json.loads(p.read_text())
    except (OSError, ValueError) as exc:
        return f"unreadable: {exc}"
    if isinstance(doc, dict) and (doc.get("signed") is True or "proof" in doc or "signature" in doc):
        return "it carries a signature"
    if bound_by(repo, p.read_bytes(), binding):
        return "its own bytes are named by another file"
    return None


def plan(repo: pathlib.Path) -> dict:
    pending, bound, skipped_own, rederive = [], {}, [], {}
    for rel in tracked_proofs(repo):
        if any(rx.fullmatch(rel) for rx in OWN_MAINTAINER):
            if classify(repo / rel)[0] == "PENDING":
                skipped_own.append(rel)
            continue
        if classify(repo / rel)[0] != "PENDING":
            continue
        hits = bound_by(repo, (repo / rel).read_bytes(), rel)
        if not hits:
            pending.append(rel)
        elif all(rederivable(repo, h) is None for h in hits):
            pending.append(rel)
            rederive[rel] = hits
        else:
            bound[rel] = {h: (rederivable(repo, h) or "re-derivable") for h in hits}
    return {"candidates": pending, "bound": bound, "own_maintainer": skipped_own, "rederive": rederive}


# --- re-derivers: each rewrites one binding so it names the upgraded proof bytes, or raises ----------

def _dump_like(path: pathlib.Path, doc) -> str:
    """Re-serialise `doc` exactly as the file is formatted now (refuse a file we cannot round-trip)."""
    raw = path.read_text()
    for indent in (1, 2, 4):
        for ascii_ in (True, False):
            if json.dumps(json.loads(raw), indent=indent, ensure_ascii=ascii_) + "\n" == raw:
                return json.dumps(doc, indent=indent, ensure_ascii=ascii_) + "\n"
    raise ValueError(f"{path} is not in a JSON layout this re-deriver can reproduce byte for byte")


def exact_bindings(repo, binding, proof, old_sha, new_raw, ctx):
    p = repo / binding
    doc = json.loads(p.read_text())
    key = proof.removeprefix("public/")
    row = (doc.get("bindings") or {}).get(key)
    if not row or row.get("proof_sha256") != old_sha:
        raise ValueError(f"{binding} has no row {key!r} naming proof_sha256 {old_sha[:16]}…")
    # Only the proof digest changes. The row's target and digest stay: an upgraded proof commits to the
    # same file digest, and root-witness-release-gate.py re-checks proof against target after this.
    row["proof_sha256"] = sha(new_raw)
    p.write_text(_dump_like(p, doc))


def capsule_vc(repo, binding, proof, old_sha, new_raw, ctx):
    # Its producer reads record.json.ots from disk and writes the SRI digests; run it, then its check.
    for args in ([], ["--check"]):
        r = subprocess.run(["node", "scripts/mechanism/capsule-vc.mjs", *args], cwd=repo, capture_output=True, text=True)
        if r.returncode != 0:
            raise ValueError(f"capsule-vc.mjs {' '.join(args)} exited {r.returncode}: {(r.stderr or r.stdout)[-400:]}")


def capsule_anchors(repo, binding, proof, old_sha, new_raw, ctx):
    p = repo / binding
    doc = json.loads(p.read_text())
    o = doc.get("opentimestamps") or {}
    if o.get("proof_sha256") != old_sha:
        raise ValueError(f"{binding} opentimestamps.proof_sha256 does not name {old_sha[:16]}…")
    staged = ctx["staged_as"].get(proof)
    rows = [r for r in ctx["block_check"].get("rows", []) if staged and pathlib.Path(r["path"]).name == staged]
    if not rows or any(r.get("state") != "MATCHES_BLOCK_HEADER" for r in rows):
        raise ValueError(f"not every Bitcoin attestation in {proof} was checked as MATCHES_BLOCK_HEADER: "
                         f"{[r.get('state') for r in rows] or 'no rows'}")
    heights = sorted({int(r["block_height"]) for r in rows})
    sources = ctx["block_check"].get("sources") or []
    # The state this file already uses for an attested index; each height carries OUR check's result,
    # under our check's own name. No block hash is written: the check compares merkle roots only.
    o.update({
        "proof_sha256": sha(new_raw),
        "state": "BITCOIN_ATTESTED",
        "bitcoin_block_heights": heights,
        "bitcoin": [{"height": h, "header_check": "MATCHES_BLOCK_HEADER", "checked_against": sources} for h in heights],
        "state_read_at": ctx["block_check"].get("ran_at"),
        "state_read_by": ("ots-upgrade.yml: scripts/ots_upgrade_pending.py upgraded the proof and "
                          "scripts/ots_block_check.py compared each attestation's digest with the block merkle "
                          "root two public explorers report; no Bitcoin node ran"),
    })
    doc["opentimestamps"] = o
    p.write_text(_dump_like(p, doc))


REDERIVERS = {"exact_bindings": exact_bindings, "capsule_vc": capsule_vc, "capsule_anchors": capsule_anchors}


def upgrade(repo: pathlib.Path, a) -> dict:
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
    staged_as = {}
    if a.stage_dir:
        a.stage_dir.mkdir(parents=True, exist_ok=True)
        for i, rel in enumerate(upgraded):
            staged_as[rel] = f"{i:03d}-{pathlib.Path(rel).name}"
            shutil.copy(repo / rel, a.stage_dir / staged_as[rel])
    return {
        "schema": "csoai.ots-upgrade-pending/2",
        "ran_at": datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "dry_run": a.dry_run,
        "upgraded": upgraded,
        "still_pending": still_pending,
        "bound_skipped": {k: sorted(v) for k, v in p["bound"].items()},
        "bound_skipped_why": p["bound"],
        "rederive": {rel: {"old_sha256": sha(before[rel]), "bindings": p["rederive"][rel]}
                     for rel in upgraded if rel in p["rederive"]},
        "rederive_pending": sorted(rel for rel in p["rederive"] if rel not in upgraded),
        "staged_as": staged_as,
        "own_maintainer_skipped": p["own_maintainer"],
        "chain_verified": False,
        "limit": ("An upgraded proof carries a Bitcoin attestation tag parsed by python-opentimestamps. This step "
                  "runs no Bitcoin node; ots_block_check.py compares each new attestation with two public "
                  "block explorers before the PR opens."),
    }


def rederive(repo: pathlib.Path, report: dict, block_check: dict) -> dict:
    """Re-derive every binding of every upgraded bound proof. A proof whose re-derivation fails is put
    back to its committed bytes with its bindings, and reported; it never ships half-bound."""
    ctx = {"staged_as": report.get("staged_as") or {}, "block_check": block_check}
    done, failed = {}, {}
    for proof, item in (report.get("rederive") or {}).items():
        old, new_raw = item["old_sha256"], (repo / proof).read_bytes()
        try:
            for binding in item["bindings"]:
                REDERIVERS[REDERIVABLE[binding]](repo, binding, proof, old, new_raw, ctx)
            new_d = hashlib.sha256(new_raw).digest()
            for binding in item["bindings"]:
                text = (repo / binding).read_text()
                if not any(f in text for f in digest_forms(new_d)):
                    raise ValueError(f"{binding} does not name the upgraded proof bytes after re-derivation")
            # git grep reads the working tree: no tracked file may still name the bytes we replaced
            still = named_by(repo, bytes.fromhex(old), proof)
            if still:
                raise ValueError(f"the replaced proof bytes are still named by {still}")
            done[proof] = item["bindings"]
        except Exception as exc:  # put the proof and its bindings back exactly as committed
            failed[proof] = f"{type(exc).__name__}: {exc}"
            reverted = set(item["bindings"])
            subprocess.run(["git", "checkout", "--", proof, *item["bindings"]], cwd=repo, check=True)
            # a proof already done that shares a reverted binding file lost its re-derivation: revert it too
            again = True
            while again:
                again = False
                for q in [q for q, bs in done.items() if reverted & set(bs)]:
                    bs = done.pop(q)
                    subprocess.run(["git", "checkout", "--", q, *bs], cwd=repo, check=True)
                    failed[q] = f"shares a binding file with a proof whose re-derivation failed ({proof})"
                    reverted |= set(bs)
                    again = True
    report["upgraded"] = [p for p in report["upgraded"] if p not in failed]
    report["still_pending"] = sorted(set(report["still_pending"]) | set(failed))
    report["rederived"] = done
    report["rederive_failed"] = failed
    return report


def main(argv=None) -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--repo", default=".", type=pathlib.Path)
    ap.add_argument("--report", required=True, type=pathlib.Path)
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument("--stage-dir", type=pathlib.Path, help="copy each upgraded proof here for ots_block_check.py")
    ap.add_argument("--rederive", action="store_true", help="re-derive the bindings recorded in --report")
    ap.add_argument("--block-check", type=pathlib.Path, help="ots_block_check.py output over --stage-dir")
    a = ap.parse_args(argv)
    repo = a.repo.resolve()
    if a.rederive:
        if not a.block_check:
            print("--rederive needs --block-check", file=sys.stderr)
            return 2
        report = rederive(repo, json.loads(a.report.read_text()), json.loads(a.block_check.read_text()))
        a.report.write_text(json.dumps(report, indent=2) + "\n")
        print(f"rederived={len(report['rederived'])} rederive_failed={len(report['rederive_failed'])}")
        for proof, why in report["rederive_failed"].items():
            print(f"  REVERTED {proof}: {why}")
        return 0
    report = upgrade(repo, a)
    a.report.write_text(json.dumps(report, indent=2) + "\n")
    print(f"upgraded={len(report['upgraded'])} still_pending={len(report['still_pending'])} "
          f"bound_skipped={len(report['bound_skipped'])} rederive={len(report['rederive'])} "
          f"own_maintainer_skipped={len(report['own_maintainer_skipped'])}")
    for rel, why in report["bound_skipped_why"].items():
        print(f"  BOUND {rel} <- {', '.join(f'{h} ({w})' for h, w in why.items())} (its producer must re-derive the binding)")
    for rel, item in report["rederive"].items():
        print(f"  REDERIVE {rel} -> {', '.join(item['bindings'])}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
