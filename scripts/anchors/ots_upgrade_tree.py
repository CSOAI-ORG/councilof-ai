#!/usr/bin/env python3
# SPDX-License-Identifier: Apache-2.0
"""Upgrade every pending OpenTimestamps proof in a git ref, without a checkout, and commit the upgraded
proofs to a LANE branch (never master). The land stays gated.

    python3 scripts/anchors/ots_upgrade_tree.py --repo MIRROR.git --ref master --scan           list proof states
    python3 scripts/anchors/ots_upgrade_tree.py --repo MIRROR.git --ref master --branch lane/ots-upgrade-auto \
            [--exclude-glob 'public/interop/root-*.json.ots'] [--push]
    (--push sends the commit to the clone's origin; without it the branch ref is written in --repo itself)

Why: scripts/ots-upgrade-loop.sh ran from a Mac launchd job and has not run since 23 Sep 2026; it also needs a
full checkout of public/. This walks the tree's blobs with git plumbing, asks each pending calendar for its
commitment (scripts/ots-upgrade.py's merge logic), and keeps a proof only if it now carries a Bitcoin block
attestation AND still commits to the same file digest. Upgrading is additive: nothing is removed.
The current public root's proof has a witness sidecar that must move with it; exclude it here and leave it
to the root pipeline (root-daily / witness_public_root.py --refresh-ots).
Exit 0 = ran (whether or not anything upgraded); 1 = a coverage check failed (nothing committed); 2 = usage.
"""
import argparse, fnmatch, io, json, subprocess, sys, time

from opentimestamps.calendar import RemoteCalendar
from opentimestamps.core.notary import BitcoinBlockHeaderAttestation, PendingAttestation
from opentimestamps.core.serialize import StreamDeserializationContext, StreamSerializationContext
from opentimestamps.core.timestamp import DetachedTimestampFile


def git(repo, *a, inp=None):
    return subprocess.run(["git", "-C", repo, *a], input=inp, capture_output=True, check=True).stdout


def cat_batch(repo, shas):
    """All blobs in one `git cat-file --batch` process (one subprocess per blob is minutes on a network FS)."""
    p = subprocess.run(["git", "-C", repo, "cat-file", "--batch"], input=("\n".join(shas) + "\n").encode(), capture_output=True, check=True)
    out, buf, i = {}, p.stdout, 0
    for sha in shas:
        nl = buf.index(b"\n", i)
        hdr = buf[i:nl].split()
        size = int(hdr[2])
        out[sha] = buf[nl + 1:nl + 1 + size]
        i = nl + 1 + size + 1
    return out


def atts(t):
    out = list(t.attestations)
    for s in t.ops.values():
        out += atts(s)
    return out


def walk_pending(t):
    out = [(t, a) for a in t.attestations if isinstance(a, PendingAttestation)]
    for s in t.ops.values():
        out += walk_pending(s)
    return out


def state(dtf):
    a = atts(dtf.timestamp)
    btc = sorted({x.height for x in a if isinstance(x, BitcoinBlockHeaderAttestation)})
    return ("BITCOIN", btc) if btc else ("PENDING", [])


def load(b):
    return DetachedTimestampFile.deserialize(StreamDeserializationContext(io.BytesIO(b)))


def dump(dtf):
    buf = io.BytesIO(); dtf.serialize(StreamSerializationContext(buf)); return buf.getvalue()


def upgrade(dtf):
    changed = False
    for sub, att in walk_pending(dtf.timestamp):
        uri = att.uri.decode() if isinstance(att.uri, bytes) else att.uri
        try:
            sub.merge(RemoteCalendar(uri).get_timestamp(sub.msg))
            changed = True
        except Exception as ex:
            print(f"    calendar {uri}: {type(ex).__name__}: {str(ex)[:80]}", file=sys.stderr)
    return changed


def main(argv=None):
    ap = argparse.ArgumentParser()
    ap.add_argument("--repo", required=True); ap.add_argument("--ref", default="master")
    ap.add_argument("--scan", action="store_true"); ap.add_argument("--branch")
    ap.add_argument("--exclude-glob", action="append", default=[]); ap.add_argument("--push", action="store_true")
    ap.add_argument("--prefix", default="public/")
    ap.add_argument("--report")
    a = ap.parse_args(argv)
    base = git(a.repo, "rev-parse", a.ref).decode().strip()
    rows = [l.split("\t") for l in git(a.repo, "ls-tree", "-r", base, "--", a.prefix).decode().splitlines()]
    proofs = [(meta.split()[2], path) for meta, path in rows if path.endswith(".ots")]
    report = {"ref": a.ref, "base": base, "at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()), "proofs": len(proofs),
              "bitcoin": 0, "pending": [], "upgraded": [], "still_pending": [], "excluded": [], "unparseable": []}
    new_blobs = {}
    blobs = cat_batch(a.repo, [sha for sha, _ in proofs])
    for sha, path in proofs:
        try:
            dtf = load(blobs[sha])
        except Exception as ex:
            report["unparseable"].append({"path": path, "why": type(ex).__name__}); continue
        st, _ = state(dtf)
        if st == "BITCOIN":
            report["bitcoin"] += 1; continue
        report["pending"].append(path)
        if any(fnmatch.fnmatch(path, g) for g in a.exclude_glob):
            report["excluded"].append(path); continue
        if a.scan:
            continue
        digest = dtf.file_digest
        if upgrade(dtf) and state(dtf)[0] == "BITCOIN":
            if dtf.file_digest != digest:
                print(f"COVERAGE CHANGED {path}: refusing", file=sys.stderr); return 1
            blob = dump(dtf)
            if load(blob).file_digest != digest:
                return 1
            new_blobs[path] = blob
            report["upgraded"].append({"path": path, "heights": state(dtf)[1]})
        else:
            report["still_pending"].append(path)
    if new_blobs and a.branch:
        idx = f"/tmp/ots-upgrade-index-{base[:9]}"
        env = {"GIT_INDEX_FILE": idx}
        import os
        e = dict(os.environ, **env)
        subprocess.run(["git", "-C", a.repo, "read-tree", base], env=e, check=True)
        for path, blob in new_blobs.items():
            h = subprocess.run(["git", "-C", a.repo, "hash-object", "-w", "--stdin"], input=blob, capture_output=True, check=True).stdout.decode().strip()
            subprocess.run(["git", "-C", a.repo, "update-index", "--cacheinfo", f"100644,{h},{path}"], env=e, check=True)
        tree = subprocess.run(["git", "-C", a.repo, "write-tree"], env=e, capture_output=True, check=True).stdout.decode().strip()
        msg = (f"ots: upgrade {len(new_blobs)} pending proof(s) to Bitcoin (additive; file digests unchanged)\n\n"
               + "\n".join(f"  {u['path']}  block {','.join(map(str, u['heights']))}" for u in report["upgraded"])
               + "\n\nProducer: scripts/anchors/ots_upgrade_tree.py over " + a.ref + " @ " + base[:9] + "\n")
        c = subprocess.run(["git", "-C", a.repo, "-c", "user.name=CSOAI", "-c", "user.email=integrator@councilof.ai",
                            "commit-tree", tree, "-p", base, "-m", msg], capture_output=True, check=True).stdout.decode().strip()
        os.unlink(idx)
        report["commit"] = c
        if a.push:
            subprocess.run(["git", "-C", a.repo, "push", "-q", "origin", f"{c}:refs/heads/{a.branch}", "--force"], check=True)
        elif a.branch:
            subprocess.run(["git", "-C", a.repo, "update-ref", f"refs/heads/{a.branch}", c], check=True)
        if a.branch:
            report["branch"] = a.branch
    summary = {k: (len(v) if isinstance(v, list) else v) for k, v in report.items()}
    print(json.dumps(summary, indent=1))
    if a.report:
        json.dump(report, open(a.report, "w"), indent=1)
    return 0


if __name__ == "__main__":
    sys.exit(main())
