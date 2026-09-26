#!/usr/bin/env python3
# SPDX-License-Identifier: Apache-2.0
"""Build one epoch of the instrument guard: classify each bank's exposure item by item, mint
canaries for banks with private items, split into public calibration / held-out slices, and write

  <private-out>/            -> ONLY for the private calibration store (hf:csoai/private-calibration)
      banks/<bank>.jsonl            source bytes (so bank_sha256 is recomputable by the owner)
      canaries/<bank>.jsonl         the canary rows (secret)
      epochs/<E>/epoch.json         the epoch key (secret)
      epochs/<E>/heldout/<bank>.jsonl   held-out graded rows + canary rows (secret)
      epochs/<E>/public/<bank>.jsonl    public calibration slice (publishable after owner sign-off)
      MANIFEST.json                 sha256 of every file above
  <public-record>           -> the commitments record: digests only, safe to publish

Exposure is decided per ITEM against what a stranger can read: every public csoai/gspc-* HF file
(anonymous fetch cache) and the repository tree at master. Prints no bank content.

Usage (Oracle lane):
  python3 build_commitments.py --banks-dir mine/pod-banks --hf-cache mine/hf-cache \
     --inventory mine/inventory.json --mirror ~/mirrors/councilof-ai.git \
     --private-out private-out --record public/interop/instrument-guard/bank-commitments-2026-09-26.json
"""
import argparse
import datetime
import glob
import hashlib
import json
import os
import random
import re
import secrets
import subprocess
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import instrument_guard as ig  # noqa: E402

SKIP = re.compile(r"(\.reverted-|\.bak-|\.HOLD$|-candidates\.jsonl$|-controls\.jsonl$)")


def strings_of(o, acc):
    if isinstance(o, str):
        if len(o) >= 12:
            acc.append(ig._norm_prompt(o))
    elif isinstance(o, dict):
        for v in o.values():
            strings_of(v, acc)
    elif isinstance(o, list):
        for v in o:
            strings_of(v, acc)


def load_rows(data: bytes):
    txt = data.decode("utf-8", "replace").strip()
    if txt.startswith("["):
        return json.loads(txt)
    if txt.startswith("{") and txt.count("\n") < 2:
        d = json.loads(txt)
        for k in ("items", "samples", "rows", "data"):
            if isinstance(d.get(k), list):
                return d[k]
        return [d]
    out = []
    for ln in txt.splitlines():
        ln = ln.strip()
        if ln:
            try:
                out.append(json.loads(ln))
            except Exception:
                pass
    return out


def public_corpus(hf_cache, private_ds):
    priv_prefix = tuple(d.replace("/", "__") + "__" for d in private_ds)
    acc, files, sha_to_file = [], 0, {}
    for fn in glob.glob(os.path.join(hf_cache, "*")):
        base = os.path.basename(fn)
        if base.startswith(priv_prefix):
            continue
        data = open(fn, "rb").read()
        sha_to_file[hashlib.sha256(data).hexdigest()] = base
        try:
            for r in load_rows(data):
                strings_of(r, acc)
        except Exception:
            strings_of(data.decode("utf-8", "replace"), acc)
        files += 1
    exact = set(acc)
    blob = "\x00".join(acc)
    return exact, blob, files, sha_to_file


def ascii_windows(p, n=40):
    s = re.sub(r"\s+", " ", p)
    out = [m.group(0)[:n] for m in re.finditer(r"[ -~]{%d,}" % n, s)]
    return out[:2]


def repo_hits(mirror, windows):
    """One git grep pass over master for every window; returns the set of windows found."""
    if not windows:
        return set()
    pf = os.path.join(os.environ.get("TMPDIR", "/tmp"), f"ig-pats-{os.getpid()}.txt")
    with open(pf, "w") as f:
        f.write("\n".join(sorted(set(windows))) + "\n")
    try:
        out = subprocess.run(["git", "--git-dir", mirror, "grep", "-F", "-o", "-h", "-I", "-f", pf, "master"],
                             capture_output=True, text=True).stdout
    finally:
        os.unlink(pf)
    found = set()
    for ln in out.splitlines():
        found.add(ln.split(":", 1)[1] if ln.startswith("master:") else ln)
    return found


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--banks-dir", required=True)
    ap.add_argument("--hf-cache", required=True)
    ap.add_argument("--inventory", required=True)
    ap.add_argument("--mirror", required=True)
    ap.add_argument("--private-out", required=True)
    ap.add_argument("--record", required=True)
    ap.add_argument("--epoch-id", default="E" + datetime.date.today().isoformat())
    ap.add_argument("--fraction", type=float, default=0.30)
    ap.add_argument("--k", type=int, default=8)
    ap.add_argument("--min-heldout", type=int, default=30)
    a = ap.parse_args()

    inv = json.load(open(a.inventory))
    exact, blob, nfiles, pub_sha = public_corpus(a.hf_cache, inv.get("private_ds", []))
    print(f"public corpus: {nfiles} files, {len(exact)} distinct strings", file=sys.stderr)

    # distinct live banks (dedupe identical bytes; skip backups and candidate/control scratch files)
    banks, seen = [], {}
    # canonical names first, so a byte-identical candidate file becomes an alias, not the id
    for fn in sorted(glob.glob(os.path.join(a.banks_dir, "*.jsonl")), key=lambda f: ("candidates" in f, f)):
        name = os.path.basename(fn)
        if SKIP.search(name):
            continue
        data = open(fn, "rb").read()
        sha = hashlib.sha256(data).hexdigest()
        if sha in seen:
            seen[sha]["aliases"].append(name[:-6])
            continue
        b = {"bank_id": name[:-6], "file": fn, "data": data, "sha": sha, "aliases": []}
        seen[sha] = b
        banks.append(b)

    # exact bytes readable by a stranger: a public HF file, or a blob in the repository tree at master
    master_blobs = {}
    for ln in subprocess.run(["git", "--git-dir", a.mirror, "ls-tree", "-r", "master"],
                             capture_output=True, text=True).stdout.splitlines():
        meta, path = ln.split("\t", 1)
        master_blobs.setdefault(meta.split()[2], []).append(path)
    for b in banks:
        oid = hashlib.sha1(b"blob %d\0" % len(b["data"]) + b["data"]).hexdigest()
        b["exact_public"] = ([f"hf:{pub_sha[b['sha']]}"] if b["sha"] in pub_sha else []) + \
                            [f"repo:{p}" for p in master_blobs.get(oid, [])]

    # item-level exposure: HF (exact + substring) then one repo pass for the survivors
    windows_by_item = {}
    for b in banks:
        b["rows"] = load_rows(b["data"])
        b["graded"] = [r for r in b["rows"] if isinstance(r, dict) and ig.is_graded(r)]
        b["public_keys"] = set()
        for r in b["graded"]:
            p = ig.prompt_of(r)
            key = ig.item_key(r)
            if b["exact_public"] or p is None:
                b["public_keys"].add(key)  # nothing to compare: cannot claim it is private
                continue
            n = ig._norm_prompt(p)
            if n in exact or (len(n) >= 24 and n in blob):
                b["public_keys"].add(key)
            else:
                windows_by_item[(b["bank_id"], key)] = ascii_windows(p)
    all_w = [w for ws in windows_by_item.values() for w in ws]
    found = repo_hits(a.mirror, all_w)
    for b in banks:
        for r in b["graded"]:
            key = ig.item_key(r)
            ws = windows_by_item.get((b["bank_id"], key))
            if ws is not None and any(w in found for w in ws):
                b["public_keys"].add(key)

    epoch_key = secrets.token_bytes(32)
    created = datetime.datetime.now(datetime.timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")
    rotate_by = (datetime.date.today() + datetime.timedelta(days=90)).isoformat()
    po = a.private_out
    for d in ("banks", "canaries", f"epochs/{a.epoch_id}/heldout", f"epochs/{a.epoch_id}/public"):
        os.makedirs(os.path.join(po, d), exist_ok=True)
    os.chmod(po, 0o700)

    rec_banks = []
    for b in banks:
        n_g = len(b["graded"])
        n_pub = len(b["public_keys"])
        exact_public = bool(b["exact_public"])
        eligible = n_g - n_pub
        if exact_public or (n_g and n_pub == n_g):
            exposure = "PUBLIC" if exact_public else "CONTENT_PUBLIC"
        elif n_pub == 0:
            exposure = "PRIVATE"
        else:
            exposure = "PARTIAL"
        entry = {"bank_id": b["bank_id"], "aliases": b["aliases"], "bank_sha256": b["sha"],
                 "rows": len(b["rows"]), "graded": n_g, "items_public": n_pub, "items_private": eligible,
                 "exposure": exposure, "exact_bytes_public_at": b["exact_public"][:3]}
        with open(os.path.join(po, "banks", b["bank_id"] + ".jsonl"), "wb") as f:
            f.write(b["data"])
        if eligible == 0:
            entry["heldout"] = {"state": "HELDOUT_INELIGIBLE", "reason": "every graded item is already public"}
            rec_banks.append(entry)
            continue
        canaries = ig.make_canaries(b["bank_id"], a.k)
        pubset = set()
        # public_keys are item keys; pass them as retired so split_bank forces them public
        s = ig.split_bank(b["graded"], epoch_key=epoch_key, bank_id=b["bank_id"], fraction=a.fraction,
                          public_prompts=pubset, retired_keys=b["public_keys"])
        held, pub = s["heldout"], s["public"]
        # canaries ride inside the held-out file, at CSPRNG positions
        mixed = list(held)
        for c in canaries:
            mixed.insert(secrets.randbelow(len(mixed) + 1), c)
        write = lambda rel, rows: open(os.path.join(po, rel), "wb").write(b"".join(ig.canonical(r) + b"\n" for r in rows))  # noqa: E731
        write(f"canaries/{b['bank_id']}.jsonl", canaries)
        write(f"epochs/{a.epoch_id}/heldout/{b['bank_id']}.jsonl", mixed)
        write(f"epochs/{a.epoch_id}/public/{b['bank_id']}.jsonl", pub)
        entry["heldout"] = {
            "state": "OK" if len(held) >= a.min_heldout else "HELDOUT_INSUFFICIENT",
            "n": len(held), "slice_sha256": ig.slice_digest(held),
            "file_sha256": ig.sha256_hex(b"".join(ig.canonical(r) + b"\n" for r in mixed)),
        }
        entry["public_slice"] = {"n": len(pub), "slice_sha256": ig.slice_digest(pub), "published": False}
        entry["canary_set"] = {"k": len(canaries), "commitment_sha256": ig.canary_set_commitment(canaries),
                               "leakscan_digests": ig.leakscan_digests(canaries)}
        rec_banks.append(entry)

    with open(os.path.join(po, f"epochs/{a.epoch_id}/epoch.json"), "w") as f:
        json.dump({"epoch_id": a.epoch_id, "epoch_key_hex": epoch_key.hex(), "fraction": a.fraction,
                   "created": created, "rotate_by": rotate_by}, f)
    manifest = {}
    for root, _, files in os.walk(po):
        for fn in files:
            p = os.path.join(root, fn)
            rel = os.path.relpath(p, po)
            if rel == "MANIFEST.json":
                continue
            manifest[rel] = ig.sha256_hex(open(p, "rb").read())
    with open(os.path.join(po, "MANIFEST.json"), "w") as f:
        json.dump({"schema": "councilof.ai/instrument-guard-private-manifest/1", "epoch_id": a.epoch_id,
                   "files": dict(sorted(manifest.items()))}, f, indent=1)

    counts = {}
    for e in rec_banks:
        counts[e["exposure"]] = counts.get(e["exposure"], 0) + 1
    record = {
        "schema": ig.SCHEMA_COMMIT,
        "as_of": created,
        "issuer": "CSOAI Ltd (Council of AI)",
        "policy": "docs/operations/INSTRUMENT-GUARD-POLICY.md",
        "private_store": "hf:csoai/private-calibration (private, access-controlled); content not published",
        "establishes": [
            "That on this date CSOAI held bank files with exactly these sha256 digests.",
            "That on this date CSOAI held, per listed bank, a canary set and held-out/public slices whose "
            "digests are these; any later disclosure can be checked against them.",
            "Which of each bank's graded items were already readable by a stranger (public HF csoai/gspc-* "
            "files fetched anonymously, and the repository at master) when this record was made.",
        ],
        "doesNotEstablish": [
            "The content of any bank, slice or canary.",
            "That any model is or is not contaminated. That is the contamination probe's job, per model.",
            "That an item marked private has never been seen by anyone outside CSOAI; only that it was "
            "not found in the public sources named here.",
        ],
        "exposure_method": {
            "unit": "graded item (expected/target non-null; canary rows excluded)",
            "public_sources": [f"{nfiles} JSON/JSONL files across public huggingface.co/datasets/csoai/gspc-* "
                               "(anonymous fetch) plus gspc-normalized parquet rows",
                               "councilof-ai repository tree at master (git grep, fixed strings)"],
            "match": "NFKC/whitespace/dash-normalised exact or substring match of the prompt (HF); "
                     "40-char ASCII window fixed-string match (repo)",
            "repo_master": subprocess.run(["git", "--git-dir", a.mirror, "rev-parse", "master"],
                                          capture_output=True, text=True).stdout.strip(),
        },
        "rotation_epoch": {"epoch_id": a.epoch_id, "created": created, "rotate_by": rotate_by,
                           "heldout_fraction": a.fraction, "min_heldout": a.min_heldout,
                           "epoch_key_commitment_sha256": ig.sha256_hex(epoch_key),
                           "membership": "HMAC-SHA256(epoch_key, bank_id||0x00||sha256(canonical(row)))[:8]/2^64 < fraction; "
                                         "only never-public, never-retired items are eligible"},
        "private_manifest_sha256": ig.sha256_hex(open(os.path.join(po, "MANIFEST.json"), "rb").read()),
        "leakscan": {"digest": "sha256('csoai-canary-leakscan/v1:' + lower(token))",
                     "token_shapes": ["UUIDv4", "XXXX-XXXX-XXXX base32 code phrase"],
                     "gate": "scripts/canary-leak-gate.mjs"},
        "exposure_counts": counts,
        "banks": rec_banks,
    }
    os.makedirs(os.path.dirname(os.path.abspath(a.record)), exist_ok=True)
    with open(a.record, "w") as f:
        f.write(json.dumps(record, indent=1, ensure_ascii=False) + "\n")
    for e in rec_banks:
        h = e.get("heldout", {})
        print(f"{e['bank_id']:36s} {e['exposure']:15s} graded={e['graded']:3d} public={e['items_public']:3d} "
              f"private={e['items_private']:3d} heldout={h.get('n', '-')!s:>3} {h.get('state')}")
    print("record", a.record, ig.sha256_hex(open(a.record, "rb").read()))


if __name__ == "__main__":
    main()
