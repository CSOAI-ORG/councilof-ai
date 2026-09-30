#!/usr/bin/env python3
# SPDX-License-Identifier: Apache-2.0
# SPDX-FileCopyrightText: 2026 CSOAI
"""Lay out one signed measurement-capsule index as the STATIC tree a deploy would serve.

    measurement_capsule_layout.py --index INDEX.json --out DIR [--anchors ANCHORS.json] [--no-capsules]

Reads nothing but the index and the batch directories it names; writes (never into public/ unless
--out says so; publication is the owner's call):

  DIR/latest.json                         {"version": "0.2", "versions": [...], "index": ".../index.json"}
  DIR/v<ver>/index.json                   the index BYTES, unchanged (its board signature pins them)
  DIR/v<ver>/index.signed.json            the index's signed sidecar, unchanged
  DIR/v<ver>/index.json.ots               its OpenTimestamps proof, unchanged (when present)
  DIR/v<ver>/anchors.json                 anchor states (--anchors), copied; absent = none claimed
  DIR/v<ver>/<batch>/record.json          + record.signed.json + record.json.ots, unchanged
  DIR/v<ver>/<batch>/capsules.jsonl.gz    the capsules, unchanged (--no-capsules omits)
  DIR/v<ver>/<batch>/leaves.json          the sorted capsule ids; must recompute to the batch root
                                          <batch> = batch_slug(): the adapter name when one batch
                                          carries it, else <adapter>-<first 12 hex of its merkle_root>
  DIR/v<ver>/endpoints/<xx>.json          256 shards keyed by sha256(normalised endpoint)[:2]:
                                          every capsule whose subject names an http(s) endpoint,
                                          with its batch root, inclusion pointers and its exact
                                          canonical line (capsule_json, so a reader can recompute
                                          capsule_id from the bytes without the batch file); plus an
                                          origins map (origin key -> endpoints measured there)

The functions/_lib/measurementCapsule.ts readers (MCP measurement_index / verify_capsule /
server_evidence and the A2A skills) read exactly these paths under /measurement-capsules/.
Every shard is written, empty or not, so a missing shard is a fault and never "not measured".
States only: this script adds no verdict, score or ranking to anything it copies.
"""
import argparse, collections, gzip, hashlib, json, pathlib, re, shutil, sys, urllib.parse

# index 0.3 = the chained daily index (0.2 plus prev_index_* / gap_days / freshness); same capsule, batch and root rules,
# so it is laid out under v0.2 exactly like 0.2 (2026-09-28: the daily publisher, scripts/pod-loops/capsule-publish-daily.sh)
INDEX_SCHEMAS = {"csoai.venturi-index/0.1": "0.1", "csoai.measurement-capsule-index/0.2": "0.2",
                 "csoai.measurement-capsule-index/0.3": "0.2"}
RECORD_SCHEMAS = {"csoai.venturi-capsule-batch/0.1": "0.1", "csoai.measurement-capsule-batch/0.2": "0.2"}
DATA_ROOT = "/measurement-capsules"
SHARD_HEX = 2
URL_RE = re.compile(r"https?://[^\s@\"'<>]+")
DOCTRINE = "measurement, not endorsement"


def sha(b):
    return hashlib.sha256(b).hexdigest()


def file_sha(p):
    h = hashlib.sha256()
    with open(p, "rb") as f:
        for b in iter(lambda: f.read(1 << 20), b""):
            h.update(b)
    return h.hexdigest()


def merkle_root(ver, ids):
    """0.1: sha256(l||r), odd promoted. 0.2: RFC 6962 (leaf 0x00||id, node 0x01||l||r). Same left-balanced shape."""
    level = [bytes.fromhex(i) for i in sorted(ids)]
    if not level:
        return sha(b"")
    if ver == "0.2":
        level = [hashlib.sha256(b"\x00" + x).digest() for x in level]
    node = (lambda l, r: hashlib.sha256(b"\x01" + l + r).digest()) if ver == "0.2" else (lambda l, r: hashlib.sha256(l + r).digest())
    while len(level) > 1:
        level = [node(level[i], level[i + 1]) if i + 1 < len(level) else level[i] for i in range(0, len(level), 2)]
    return level[0].hex()


def normalise_endpoint(raw):
    """Byte-for-byte mirror of normaliseEndpoint() in functions/_lib/measurementCapsule.ts for the URLs
    the census carries (ASCII hosts). Returns None for anything that is not a plain http(s) URL."""
    try:
        u = urllib.parse.urlsplit(raw.strip())
    except ValueError:
        return None
    scheme = u.scheme.lower()
    if scheme not in ("http", "https") or not u.hostname or u.username or u.password:
        return None
    host = u.hostname.lower()
    try:
        port = u.port
    except ValueError:
        return None
    port_s = f":{port}" if port and not ((scheme == "https" and port == 443) or (scheme == "http" and port == 80)) else ""
    path = u.path or "/"
    if len(path) > 1:
        path = path.rstrip("/") or "/"
    return f"{scheme}://{host}{port_s}{path}{'?' + u.query if u.query else ''}"


def origin_of(n):
    u = urllib.parse.urlsplit(n)
    return f"{u.scheme}://{u.netloc}"


def batch_slug(batches, b):
    """Directory name of one batch under v<ver>/. An index may carry two batches of one adapter
    (2026-09-26: mill_cross_runtime n=14 and mill_cross_runtime-batch2 n=140). Writing both to
    <adapter>/ let the second overwrite the first's leaves, so no capsule of the first could ever be
    shown included. Mirrored byte-for-byte by batchSlug() in functions/_lib/measurementCapsule.ts."""
    adapter = str(b["adapter"])
    if sum(1 for x in batches if str(x.get("adapter")) == adapter) == 1:
        return adapter
    return f"{adapter}-{str(b['merkle_root'])[:12]}"


def endpoints_of(capsule):
    out = []
    for m in URL_RE.findall(str(capsule.get("subject_id") or "")):
        n = normalise_endpoint(m.rstrip(".,;)]}"))
        if n and n not in out:
            out.append(n)
    return out


def iter_capsules(batch_dir, rec):
    p = pathlib.Path(batch_dir) / rec["capsules_file"]["path"]
    if file_sha(p) != rec["capsules_file"]["sha256"]:
        sys.exit(f"CAPSULES_FILE_NOT_PINNED {p}")
    opener = gzip.open if p.suffix == ".gz" else open
    with opener(p, "rb") as f:
        for line in f:
            if line.strip():
                yield json.loads(line), line.decode("utf-8").rstrip("\r\n")


def entry_for(c, line, ver, adapter, slug, root, rule, vroot):
    claim = c.get("claim") or {}
    return {
        "capsule_id": c["capsule_id"], "adapter": adapter, "kind": c.get("kind"), "schema": c.get("schema"),
        "subject_id": c.get("subject_id"),
        "claim": {k: claim[k] for k in ("dimension", "statement", "index", "offering", "axis") if k in claim},
        "measurement_state": c.get("measurement_state"), "observed_at": c.get("observed_at"),
        "correction_pointer": c.get("correction_pointer"), "limitations": c.get("limitations") or [],
        "batch": {"adapter": adapter, "slug": slug, "merkle_root": root, "rule": rule, "version": ver},
        "inclusion": {"verify_with": "MCP verify_capsule(capsule_json) or A2A skill measurement-capsules {op: verify}",
                      "leaves": f"{vroot}/{slug}/leaves.json", "capsules": f"{vroot}/{slug}/capsules.jsonl.gz",
                      "record": f"{vroot}/{slug}/record.json"},
        "capsule_json": line,
    }


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--index", required=True)
    ap.add_argument("--out", required=True)
    ap.add_argument("--anchors", default=None)
    ap.add_argument("--no-capsules", action="store_true")
    ap.add_argument("--source-root", default=None,
                    help="re-root the absolute batch dirs the index names (a copy of /evac-bulk streamed elsewhere)")
    a = ap.parse_args()
    ip = pathlib.Path(a.index)
    raw = ip.read_bytes()
    idx = json.loads(raw)
    ver = INDEX_SCHEMAS.get(idx.get("schema"))
    if not ver:
        sys.exit(f"UNKNOWN_INDEX_SCHEMA {idx.get('schema')}")
    out = pathlib.Path(a.out)
    vdir = out / f"v{ver}"
    vroot = f"{DATA_ROOT}/v{ver}"
    vdir.mkdir(parents=True, exist_ok=True)
    (vdir / "index.json").write_bytes(raw)
    signed = ip.with_name(ip.stem + ".signed.json")
    if signed.exists():
        shutil.copyfile(signed, vdir / "index.signed.json")
    ots = ip.with_name(ip.name + ".ots")
    if ots.exists():
        shutil.copyfile(ots, vdir / "index.json.ots")
    if a.anchors:
        shutil.copyfile(a.anchors, vdir / "anchors.json")
    shards = collections.defaultdict(lambda: {"endpoints": {}, "origins": {}})
    all_ids, report, unkeyed, slugs = [], [], collections.Counter(), set()
    for b in idx["batches"]:
        adapter, slug = b["adapter"], batch_slug(idx["batches"], b)
        if slug in slugs:
            sys.exit(f"BATCH_DIR_COLLISION {slug}")
        slugs.add(slug)
        bdir = pathlib.Path(a.source_root, b["dir"].lstrip("/")) if a.source_root else pathlib.Path(b["dir"])
        rraw = (bdir / "record.json").read_bytes()
        if sha(rraw) != b["record_sha256"]:
            sys.exit(f"RECORD_CHANGED_SINCE_INDEX {adapter}")
        rec = json.loads(rraw)
        if RECORD_SCHEMAS.get(rec.get("schema")) != ver:
            sys.exit(f"RECORD_VERSION_MISMATCH {adapter}: {rec.get('schema')} under a v{ver} index")
        odir = vdir / slug
        odir.mkdir(parents=True, exist_ok=True)
        for n in ("record.json", "record.signed.json", "record.json.ots"):
            if (bdir / n).exists():
                shutil.copyfile(bdir / n, odir / n)
        if not a.no_capsules:
            shutil.copyfile(bdir / rec["capsules_file"]["path"], odir / pathlib.Path(rec["capsules_file"]["path"]).name)
        ids, keyed = [], 0
        for c, line in iter_capsules(bdir, rec):
            ids.append(c["capsule_id"])
            eps = endpoints_of(c)
            if not eps:
                unkeyed[slug] += 1
                continue
            keyed += 1
            e = entry_for(c, line, ver, adapter, slug, rec["merkle_root"], rec.get("merkle"), vroot)
            for ep in eps:
                k = sha(ep.encode())
                slot = shards[k[:SHARD_HEX]]["endpoints"].setdefault(k, {"endpoint": ep, "capsules": [], "by_adapter": {}})
                slot["capsules"].append(e)
                ba = slot["by_adapter"].setdefault(adapter, {})
                ba[e["measurement_state"]] = ba.get(e["measurement_state"], 0) + 1
                o = origin_of(ep)
                ok = sha(o.encode())
                lst = shards[ok[:SHARD_HEX]]["origins"].setdefault(ok, [])
                if ep not in lst:
                    lst.append(ep)
        ids.sort()
        root = merkle_root(ver, ids)
        if root != rec["merkle_root"] or root != b["merkle_root"]:
            sys.exit(f"LEAVES_DO_NOT_RECOMPUTE {slug}: {root}")
        (odir / "leaves.json").write_text(json.dumps({
            "schema": f"csoai.measurement-capsule-leaves/{ver}", "adapter": adapter, "batch": slug, "kind": rec.get("kind", b.get("kind")),
            "merkle_root": root, "rule": rec.get("merkle"), "n": len(ids), "leaves": ids}, separators=(",", ":")) + "\n")
        all_ids += ids
        report.append({"adapter": adapter, "batch": slug, "n": len(ids), "endpoint_keyed": keyed, "not_endpoint_keyed": unkeyed[slug]})
    if merkle_root(ver, all_ids) != idx["index_root"]:
        sys.exit("INDEX_ROOT_DOES_NOT_RECOMPUTE")
    edir = vdir / "endpoints"
    edir.mkdir(exist_ok=True)
    n_endpoints, biggest = 0, 0
    for s in range(16 ** SHARD_HEX):
        sid = f"{s:0{SHARD_HEX}x}"
        body = shards.get(sid, {"endpoints": {}, "origins": {}})
        for ent in body["endpoints"].values():
            ent["capsules"].sort(key=lambda e: (e["adapter"], e["claim"].get("dimension") or "", e["capsule_id"]))
        n_endpoints += len(body["endpoints"])
        txt = json.dumps({"schema": f"csoai.measurement-capsule-endpoint-shard/{ver}", "doctrine": DOCTRINE, "shard": sid,
                          "key_rule": "sha256(normalised endpoint URL) hex; shard = first two hex",
                          "as_of": idx.get("as_of"), "index_root": idx["index_root"],
                          "endpoints": dict(sorted(body["endpoints"].items())), "origins": dict(sorted(body["origins"].items()))},
                         separators=(",", ":"), ensure_ascii=False) + "\n"
        biggest = max(biggest, len(txt.encode()))
        (edir / f"{sid}.json").write_text(txt)
    latest = out / "latest.json"
    prev = json.loads(latest.read_text()) if latest.exists() else {}
    versions = sorted(set(prev.get("versions", [])) | {ver}, reverse=True)
    top = max(versions)
    latest.write_text(json.dumps({"schema": "csoai.measurement-capsule-latest/0.1", "version": top, "versions": versions,
                                  "index": f"{DATA_ROOT}/v{top}/index.json", "doctrine": DOCTRINE,
                                  # when the laid-out index was written (a reader checks freshness here without the index)
                                  "as_of": idx.get("as_of") if ver == top else prev.get("as_of"),
                                  "index_date": idx.get("date") if ver == top else prev.get("index_date")}, indent=1) + "\n")
    print(json.dumps({"version": ver, "batches": report, "n_capsules": len(all_ids), "index_root": idx["index_root"],
                      "endpoints_keyed": n_endpoints, "largest_shard_bytes": biggest}, indent=1))


if __name__ == "__main__":
    main()
