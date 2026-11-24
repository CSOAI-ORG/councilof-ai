#!/usr/bin/env python3
# SPDX-License-Identifier: Apache-2.0
# SPDX-FileCopyrightText: 2026 CSOAI
"""The daily measurement-capsule index on GitHub Actions (.github/workflows/capsule-index-daily.yml).

capsule-daily.sh wrote the day's chained index on oracle-micro-2 (cron 08:05Z) and a pod laid it out for the site.
Both stopped: the index host's disks are full and the pods are gone. The last chained day is 2026-11-04 (seq 28).
This script does the same day on a runner with the same code (venturi_capsule.py index / sign / ots / verify,
chain.py verify-chain / chain-head / anchors / publish-hf, scripts/measurement_capsule_layout.py):

  1. chain   : every day of the public chain (HF csoai/evidence-index measurement-index/<date>/) into BULK, flat,
               then verify-chain (CHAIN_INTACT or stop). The head is the newest day there, never the site's copy.
  2. carry   : the batches the head index names, restored byte for byte from the published site tree
               (public/measurement-capsules/v0.2/<slug>/) at BULK/<the dir name the head names>; each record must
               hash to the head's record_sha256, or stop (HEAD_BATCH_NOT_ON_SITE: the site copy is behind the chain).
  3. pending : no adapter source is produced on a runner yet, so every adapter is carried and says why in
               pending_source; index freshness then reads NOT_UPDATED for the daily adapters (last_good_date = their
               batch date), CARRIED for the others. Nothing is rebuilt, nothing is dated today but the index itself.
  4. index   : DATE's chained index (prev = the head; gap_days and missing_dates declared). --dry-run stops here,
               after laying the unsigned index out in a scratch dir to prove the layout.
  5. sign    : board-sign by the job's OIDC token (--token github-oidc), OTS calendar commitment, verify, verify-chain
               again with the new day; on Sundays the weekly chain head (signed, OTS, Rekor/XRPL drafts PREPARED only).
  6. publish : anchors.json, then the day's files to HF csoai/evidence-index (create-only; needs the owner's approval
               record), then the site layout under --site (index, anchors, batches, endpoint shards, index.html).

Exit 0 with one JSON line: state DONE | ALREADY_DONE | DRY_RUN. Exit 1: state FAILED step=... (nothing half-published
on the site: the site tree is written last). Never prints a token.
"""
import argparse, datetime, hashlib, importlib.util, json, os, pathlib, re, shutil, subprocess, sys

HERE = pathlib.Path(__file__).resolve().parent
REPO = HERE.parent.parent
HF_REPO = "csoai/evidence-index"
HF_PREFIX = "measurement-index"
INDEX_NAME = "measurement-index-v0.2-{}.json"
# capsule-daily.sh ORDER (the plan order); mill_cross_runtime has no daily source and never gets a pending line there
ORDER = ["self_parity", "tool_drift", "cross_ledger", "public_signals", "contract_parity", "a2a_card", "mill_cross_runtime",
         "operations", "claim_watch", "busabase", "meok"]
# Where each adapter's source record was produced (fleet/jobs.yaml, capsule-daily.sh). Stated in the signed index.
WHERE = {
    "self_parity": "the operator's scheduled host (self-parity, cron 05:10Z)",
    "tool_drift": "a RunPod pod (the tool-drift probe), with its earlier observations on the operator's scheduled host",
    "cross_ledger": "the operator's scheduled host (xl-daily, cron 04:20Z)",
    "public_signals": "the operator's scheduled host with network reads on a RunPod backup pod",
    "contract_parity": "the operator's scheduled host (a signed census record, weekly)",
    "a2a_card": "the operator's scheduled host (a signed census record, weekly)",
    "operations": "the operator's scheduled host (a harvest that reads the RunPod build pod's deploy logs)",
    "claim_watch": "the operator's scheduled host (claim-watch receipts, cron 07:50Z)",
    "busabase": "the RunPod build pod (a snapshot record)",
    "meok": "the RunPod build pod (a snapshot record)",
}
BATCH_FILES = ("record.json", "record.signed.json", "record.json.ots")


class Stop(Exception):
    def __init__(self, step, why):
        super().__init__(f"{step}: {why}")
        self.step, self.why = step, why


def sha_file(p):
    return hashlib.sha256(pathlib.Path(p).read_bytes()).hexdigest()


def load_layout():
    spec = importlib.util.spec_from_file_location("measurement_capsule_layout", REPO / "scripts" / "measurement_capsule_layout.py")
    m = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(m)
    return m


def vc(*args, capture=True):
    """venturi_capsule.py CLI, run from this directory exactly as capsule-daily.sh runs it (PYTHONPATH = the package)."""
    env = dict(os.environ, PYTHONPATH=str(HERE), PYTHONDONTWRITEBYTECODE="1")
    r = subprocess.run([sys.executable, str(HERE / "venturi_capsule.py"), *args], cwd=HERE, env=env,
                       capture_output=capture, text=True)
    if capture:
        sys.stderr.write(r.stdout[-4000:] + r.stderr[-4000:])
    return r


def last_json(text):
    for line in reversed((text or "").strip().splitlines()):
        try:
            return json.loads(line)
        except ValueError:
            continue
    return None


def index_days(bulk):
    out = {}
    for p in pathlib.Path(bulk).glob("measurement-index-v0.2-????-??-??.json"):
        out[p.name[len("measurement-index-v0.2-"):-len(".json")]] = p
    return dict(sorted(out.items()))


# ---------------------------------------------------------------- 1. chain
def fetch_chain(bulk, cache):
    """Every dated day folder of the public chain, flattened into BULK (the README's own recipe). Returns the day list."""
    from huggingface_hub import snapshot_download
    root = pathlib.Path(snapshot_download(HF_REPO, repo_type="dataset", allow_patterns=[f"{HF_PREFIX}/20??-??-??/*"],
                                          local_dir=str(cache)))
    days = sorted(p.name for p in (root / HF_PREFIX).iterdir() if p.is_dir())
    if not days:
        raise Stop("chain", f"no day folders under {HF_REPO}/{HF_PREFIX}")
    for d in days:
        for f in sorted((root / HF_PREFIX / d).iterdir()):
            dst = pathlib.Path(bulk) / f.name
            if dst.exists() and dst.read_bytes() != f.read_bytes():
                raise Stop("chain", f"two different files named {f.name} in the chain")
            shutil.copyfile(f, dst)
    return days


def verify_chain(bulk, out_json):
    r = vc("verify-chain", "--dir", str(bulk), "--summary", "--json-out", str(out_json))
    rep = json.loads(pathlib.Path(out_json).read_text()) if pathlib.Path(out_json).exists() else {}
    if r.returncode != 0 or rep.get("result") != "CHAIN_INTACT":
        raise Stop("verify-chain", f"{rep.get('result')} errors={(rep.get('errors') or [])[:5]}")
    return rep


# ---------------------------------------------------------------- 2. carry
# Batches the chain head names that never reached the site tree (built on oracle-micro-2 after the last site
# publication): packages/venturi-capsule/seed/<dir name>/, byte for byte as the index host held them. Once a layout
# carries a seed batch onto the site, the site copy is used and the seed is no longer read.
SEED = HERE / "seed"


def restore_batches(head_doc, bulk, site_v02, layout):
    """Copy every batch the head index names from the site tree (or the seed) into BULK/<dir name>. Returns the dirs."""
    dirs = []
    for b in head_doc["batches"]:
        slug = layout.batch_slug(head_doc["batches"], b)
        name = pathlib.Path(b["dir"]).name
        dst = pathlib.Path(bulk) / name
        src = None
        for cand in (pathlib.Path(site_v02) / slug, SEED / name):
            if (cand / "record.json").exists() and sha_file(cand / "record.json") == b["record_sha256"]:
                src = cand
                break
        if src is None:
            raise Stop("carry", f"HEAD_BATCH_NOT_ON_SITE {slug}: neither the site nor the seed holds the record the chain head "
                                f"names (record_sha256 {b['record_sha256'][:16]})")
        rec = json.loads((src / "record.json").read_bytes())
        dst.mkdir(parents=True, exist_ok=True)
        for n in BATCH_FILES + (rec["capsules_file"]["path"],):
            if (src / n).exists():
                shutil.copyfile(src / n, dst / n)
        if sha_file(dst / rec["capsules_file"]["path"]) != rec["capsules_file"]["sha256"]:
            raise Stop("carry", f"CAPSULES_FILE_NOT_PINNED {slug}")
        dirs.append(dst)
    return dirs


BATCH_DIR_RE = re.compile(r"^measurement-capsules-v0\.2-(\d{4}-\d{2}-\d{2})-(.+)$")


def pending_lines(head_doc):
    """One pending_source line per carried adapter (capsule-daily's wording: ADAPTER_daily_source=why; the DATE batch is
    carried). Siblings (e.g. mill_cross_runtime-batch2) and mill_cross_runtime itself get none, as in capsule-daily."""
    newest = {}
    for b in head_doc["batches"]:
        m = BATCH_DIR_RE.match(pathlib.Path(b["dir"]).name)
        if not m:
            raise Stop("plan", f"batch dir {b['dir']} does not carry a date")
        if m.group(2).split(".r")[0] != b["adapter"]:
            continue  # a sibling batch of the adapter, carried beside the main one
        newest[b["adapter"]] = max(newest.get(b["adapter"], ""), m.group(1))
    out = []
    for a in ORDER:
        if a not in newest or a == "mill_cross_runtime":
            continue
        d = newest[a]
        out.append(f"{a}_daily_source=NOT_UPDATED: no {a} source newer than the one in the {d} batch is available to this "
                   f"run; this index was built on GitHub Actions and the source is produced on {WHERE[a]}; the {d} batch is carried")
    unknown = sorted(set(newest) - set(ORDER))
    if unknown:
        raise Stop("plan", f"adapters with no stated source host: {unknown}")
    return out


# ---------------------------------------------------------------- 6. site layout
def lay_out(bulk, date, site, anchors=None, scratch=None):
    """capsule-publish-daily.sh's replace step: DATE's index laid out by measurement_capsule_layout.py, then swapped
    into SITE (old batch dirs, shards and index sidecars removed; publication/ records kept), plus index.html."""
    site = pathlib.Path(site)
    tmp = pathlib.Path(scratch or (pathlib.Path(bulk) / ".layout-tmp")) / f"layout-{date}"
    if tmp.exists():
        shutil.rmtree(tmp)
    tmp.mkdir(parents=True)
    if (site / "latest.json").exists():
        shutil.copyfile(site / "latest.json", tmp / "latest.json")  # keeps the versions list
    idx = pathlib.Path(bulk) / INDEX_NAME.format(date)
    args = [sys.executable, str(REPO / "scripts" / "measurement_capsule_layout.py"), "--index", str(idx), "--out", str(tmp)]
    homes = {pathlib.Path(b["dir"]).parent for b in json.loads(idx.read_bytes())["batches"]}
    here = pathlib.Path(bulk).resolve()
    if homes != {here}:  # the index was written where BULK had another path: re-root its batch dirs (same dir name)
        if len(homes) != 1 or next(iter(homes)).name != here.name:
            raise Stop("layout", f"the index names batch dirs under {sorted(map(str, homes))}, not under {here}")
        args += ["--source-root", str(here.parent)]
    if anchors:
        args += ["--anchors", str(anchors)]
    r = subprocess.run(args, capture_output=True, text=True)
    if r.returncode != 0:
        raise Stop("layout", (r.stderr or r.stdout).strip()[-400:])
    new = tmp / "v0.2"
    for n in ("rekor-entry", "rekor-receipt"):  # the index's own Rekor files, when the chain has them for this day
        s = pathlib.Path(bulk) / f"measurement-index-v0.2-{date}.{n}.json"
        if s.exists():
            shutil.copyfile(s, new / f"index.{n}.json")
    sys.path.insert(0, str(REPO / "scripts"))
    import measurement_capsule_page as page
    (new / "index.html").write_text(page.render(new, site / "v0.2" / "publication"))
    v = site / "v0.2"
    v.mkdir(parents=True, exist_ok=True)
    for p in sorted(v.iterdir()):
        if p.is_dir() and (p / "leaves.json").exists():
            shutil.rmtree(p)
    if (v / "endpoints").exists():
        shutil.rmtree(v / "endpoints")
    for n in ("index.json", "index.signed.json", "index.json.ots", "anchors.json", "index.rekor-entry.json",
              "index.rekor-receipt.json", "index.html"):
        if (v / n).exists():
            (v / n).unlink()
    for p in sorted(new.iterdir()):
        (shutil.copytree if p.is_dir() else shutil.copyfile)(p, v / p.name)
    shutil.copyfile(tmp / "latest.json", site / "latest.json")
    shutil.rmtree(tmp)
    return last_json(r.stdout) or json.loads(r.stdout)


# ---------------------------------------------------------------- run
def run(a):
    D = a.date or datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%d")
    bulk, work, site = pathlib.Path(a.bulk), pathlib.Path(a.work), pathlib.Path(a.site)
    bulk.mkdir(parents=True, exist_ok=True); work.mkdir(parents=True, exist_ok=True)
    layout = load_layout()
    res = {"date": D, "dry_run": a.dry_run}
    if not a.no_fetch:
        res["chain_days_fetched"] = len(fetch_chain(bulk, work / "hf"))
    days = index_days(bulk)
    if not days:
        raise Stop("chain", f"no daily index in {bulk}")
    head = list(days)[-1]
    res["head"] = head
    if head > D:
        raise Stop("index", f"CHAIN_LATER_DAY_EXISTS: the chain's head is {head}, after {D}")
    if head == D:  # the day is on the chain already: done, unless the site copy is behind it (a run that stopped late)
        site_day = json.loads((site / "latest.json").read_text()).get("index_date") if (site / "latest.json").exists() else None
        if site_day == D or a.dry_run:
            res.update(state="ALREADY_DONE", why=f"the chain holds an index for {D} and the site shows {site_day}; a day is written once")
            return res
        verify_chain(bulk, work / f"chain-verify-{D}.json")
        restore_batches(json.loads(days[D].read_bytes()), bulk, site / "v0.2", layout)
        anchors = work / f"anchors-{D}.json"
        r = vc("anchors", "--date", D, "--dir", str(bulk), "--out", str(anchors))
        if r.returncode != 0:
            raise Stop("anchors", (r.stderr or r.stdout).strip()[-400:])
        res.update(state="LAID_OUT", why=f"the chain held {D} but the site showed {site_day}", site=lay_out(bulk, D, site, anchors, work))
        return res
    pre = verify_chain(bulk, work / f"chain-verify-pre-{D}.json")
    res["chain_before"] = {k: pre.get(k) for k in ("result", "chain_length", "gap_days_declared")}
    head_doc = json.loads(days[head].read_bytes())
    dirs = restore_batches(head_doc, bulk, site / "v0.2", layout)
    pend = pending_lines(head_doc)
    stage = work / f"idx-{D}"
    if stage.exists():
        shutil.rmtree(stage)
    stage.mkdir()
    sf = stage / INDEX_NAME.format(D)
    r = vc("index", "--file", str(sf), "--date", D, "--index-dir", str(bulk), "--prev", "auto",
           "--batches", *[str(d) for d in dirs], "--pending", *pend)
    if r.returncode != 0:
        raise Stop("index", (r.stderr or r.stdout).strip()[-400:])
    doc = json.loads(sf.read_bytes())
    res.update(index={k: doc.get(k) for k in ("date", "as_of", "chain_seq", "prev_date", "gap_days", "n_capsules_total", "index_root")},
               batches=len(doc["batches"]), not_updated=doc["freshness"]["not_updated"],
               publication=(doc.get("publication") or {}).get("state", "PRIVATE (no approval record on this runner)"))
    if a.dry_run:
        r = subprocess.run([sys.executable, str(REPO / "scripts" / "measurement_capsule_layout.py"), "--index", str(sf),
                            "--out", str(work / "dry-layout")], capture_output=True, text=True)
        if r.returncode != 0:
            raise Stop("layout", (r.stderr or r.stdout).strip()[-400:])
        lj = json.loads(r.stdout)
        res.update(state="DRY_RUN", layout={k: lj.get(k) for k in ("n_capsules", "index_root", "endpoints_keyed", "largest_shard_bytes")},
                   not_done="not signed, not OTS-stamped, not published to HF or the site (dry run)")
        return res
    for step, args in (("sign-index", ("sign", "--file", str(sf), "--token", a.token)), ("ots-index", ("ots", "--file", str(sf))),
                       ("verify-index", ("verify", "--file", str(sf)))):
        r = vc(*args)
        if r.returncode != 0:
            raise Stop(step, (r.stderr or r.stdout).strip()[-400:])
    if "VERIFIES" not in json.dumps(last_json(r.stdout) or {}):
        raise Stop("verify-index", "signature not VERIFIES")
    for p in sorted(stage.iterdir()):
        shutil.move(str(p), str(bulk / p.name))
    post = verify_chain(bulk, work / f"chain-verify-{D}.json")
    res["chain_after"] = {k: post.get(k) for k in ("result", "chain_length", "gap_days_declared")}
    if datetime.date.fromisoformat(D).isoweekday() == 7 and not (bulk / f"measurement-index-chain-head-{D}.json").exists():
        r = vc("chain-head", "--date", D, "--dir", str(bulk), "--token", a.token)
        if r.returncode != 0:
            raise Stop("chain-head", (r.stderr or r.stdout).strip()[-400:])
        res["weekly_head"] = "written (signed, OTS; Rekor and XRPL drafts prepared, not submitted)"
    anchors = work / f"anchors-{D}.json"
    r = vc("anchors", "--date", D, "--dir", str(bulk), "--out", str(anchors))
    if r.returncode != 0:
        raise Stop("anchors", (r.stderr or r.stdout).strip()[-400:])
    r = vc("publish-hf", "--date", D, "--dir", str(bulk), "--approval-file", a.hf_approval)
    hf = last_json(r.stdout) or {}
    if r.returncode != 0 or hf.get("state") not in ("PUBLISHED", "ALREADY_PUBLISHED"):
        raise Stop("publish-hf", f"{hf.get('state')} {hf.get('why') or ''}".strip())
    res["hf"] = {k: hf.get(k) for k in ("state", "commit", "to_add")}
    res["site"] = lay_out(bulk, D, site, anchors, work)
    res["state"] = "DONE"
    return res


def main():
    p = argparse.ArgumentParser(description=__doc__.split("\n\n")[0])
    sp = p.add_subparsers(dest="cmd", required=True)
    q = sp.add_parser("run", help="the day's chained index: chain, carry, index, sign, publish")
    q.add_argument("--date", default=None, help="index date (default: today, UTC)")
    q.add_argument("--bulk", default="/evac-bulk", help="chain + batch directory (the index host's name for it)")
    q.add_argument("--work", required=True, help="scratch directory")
    q.add_argument("--site", default=str(REPO / "public" / "measurement-capsules"), help="the published capsule tree")
    q.add_argument("--token", default="github-oidc", help="board-sign caller (venturi_capsule.py sign --token)")
    q.add_argument("--hf-approval", default=None, help="the owner's publication approval record (required unless --dry-run)")
    q.add_argument("--no-fetch", action="store_true", help="use the chain already in --bulk (tests)")
    q.add_argument("--dry-run", action="store_true", help="stop after the unsigned index and a scratch layout")
    q = sp.add_parser("layout", help="lay out one chained day already in --bulk onto the site tree")
    q.add_argument("--date", required=True); q.add_argument("--bulk", default="/evac-bulk")
    q.add_argument("--site", default=str(REPO / "public" / "measurement-capsules")); q.add_argument("--anchors", default=None)
    a = p.parse_args()
    try:
        if a.cmd == "layout":
            out = {"state": "LAID_OUT", "date": a.date, "site": lay_out(a.bulk, a.date, a.site, a.anchors)}
        else:
            if not a.dry_run and not a.hf_approval:
                raise Stop("args", "--hf-approval is required to publish")
            out = run(a)
    except Stop as e:
        print(json.dumps({"state": "FAILED", "step": e.step, "why": e.why}))
        sys.exit(1)
    print(json.dumps(out))


if __name__ == "__main__":
    main()
