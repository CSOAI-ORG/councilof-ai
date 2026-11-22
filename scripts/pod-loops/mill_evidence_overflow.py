#!/usr/bin/env python3
"""Stage exactly the missing 22 Nov 2026 mill evidence bytes to bounded HF shards.

Independent of public routing, board admission and production worker health.
No file in the historical Hugging Face location is deleted or rewritten.
Run only on the immutable source revision pinned below, using a reviewed manifest.
"""
import argparse
from concurrent.futures import ThreadPoolExecutor, as_completed
import hashlib
import json
import os
from pathlib import Path
import re
import subprocess
import sys
import time

import evidence_sync as mirror

SOURCE_SHA = "5b7502e7432da957d59ba93f5b3b603c0db7932c"
MANIFEST_SHA256 = "efd2fd13bdb40c418335422768828c2a995a13be90729f121f82c64a3f31cd54"
MANIFEST = Path(__file__).with_name("mill-evidence-overflow-20261122.json")
PREFIX = "interop/mill-evidence-overflow/2026-11-22"
EXPECTED_COUNTS = {"admission": 2952, "items": 656}
EXPECTED_FILES = 3608
EXPECTED_BYTES = 25273138
MAX_PER_SHARD = 10000
NAME_RE = re.compile(r"(?:admission-[a-f0-9]{12}\.json|items-[a-z0-9-]+\.jsonl)\Z")
HEX_RE = re.compile(r"[a-f0-9]{64}\Z")


class EvidenceError(Exception):
    pass


def sha256(blob):
    return hashlib.sha256(blob).hexdigest()


def checked_entry(entry, source_dir):
    """Reject traversal, aliased destinations, mismatched sizes and changed bytes."""
    if not isinstance(entry, dict) or set(entry) != {"name", "sha256", "bytes", "shard"}:
        raise EvidenceError("ENTRY_FIELDS_INVALID")
    name, digest, size, shard = (entry[k] for k in ("name", "sha256", "bytes", "shard"))
    if not isinstance(name, str) or not NAME_RE.fullmatch(name):
        raise EvidenceError("ENTRY_NAME_INVALID")
    if not isinstance(digest, str) or not HEX_RE.fullmatch(digest):
        raise EvidenceError("ENTRY_DIGEST_INVALID")
    if type(size) is not int or size <= 0 or size > 1_000_000:
        raise EvidenceError("ENTRY_SIZE_INVALID")
    if shard != digest[:2]:
        raise EvidenceError("ENTRY_SHARD_MISMATCH")
    if name.startswith("admission-") and name[10:22] != digest[:12]:
        raise EvidenceError("ADMISSION_NAME_DIGEST_MISMATCH")
    source = source_dir / name
    if not source.is_file() or source.is_symlink():
        raise EvidenceError("ENTRY_SOURCE_NOT_REGULAR")
    blob = source.read_bytes()
    if len(blob) != size or sha256(blob) != digest:
        raise EvidenceError("ENTRY_SOURCE_BYTES_MISMATCH")
    return name, digest, source, PREFIX + "/" + shard + "/" + name


def validate_manifest(path, source_dir, strict=True):
    raw = path.read_bytes()
    if strict and sha256(raw) != MANIFEST_SHA256:
        raise EvidenceError("IMMUTABLE_MANIFEST_SHA256_MISMATCH")
    data = json.loads(raw)
    if data.get("schema") != "csoai.mill-evidence-overflow/1":
        raise EvidenceError("MANIFEST_SCHEMA_INVALID")
    if data.get("source_commit") != SOURCE_SHA:
        raise EvidenceError("SOURCE_COMMIT_MISMATCH")
    if data.get("dataset") != mirror.REPO:
        raise EvidenceError("DATASET_MISMATCH")
    if data.get("original_prefix") != "interop/mill-evidence/":
        raise EvidenceError("ORIGINAL_PREFIX_MISMATCH")
    if data.get("shard_prefix") != PREFIX + "/":
        raise EvidenceError("SHARD_PREFIX_MISMATCH")
    rows = data.get("files")
    if not isinstance(rows, list) or not rows:
        raise EvidenceError("NO_FILES")
    if strict and len(rows) != EXPECTED_FILES:
        raise EvidenceError("FILE_COUNT_MISMATCH")
    files, digests, counts = {}, {}, {"admission": 0, "items": 0}
    shard_counts = {}
    total_bytes = 0
    for entry in rows:
        name, digest, source, destination = checked_entry(entry, source_dir)
        if destination in files:
            raise EvidenceError("DUPLICATE_DESTINATION")
        files[destination] = source
        digests[destination] = digest
        counts["admission" if name.startswith("admission-") else "items"] += 1
        shard_counts[entry["shard"]] = shard_counts.get(entry["shard"], 0) + 1
        total_bytes += entry["bytes"]
    if strict and (counts != EXPECTED_COUNTS or total_bytes != EXPECTED_BYTES):
        raise EvidenceError("SOURCE_CLASS_OR_SIZE_DRIFT")
    if max(shard_counts.values()) >= MAX_PER_SHARD:
        raise EvidenceError("SHARD_AT_CAPACITY")
    return files, digests, counts, total_bytes, shard_counts


def remote_match(file_path, remote_row):
    if remote_row is None:
        return False
    oid, lfs = remote_row
    blob = file_path.read_bytes()
    return (lfs == sha256(blob)) if lfs else (oid == mirror.git_blob_sha(blob))


def anonymous_readback(files, destinations, workers=4):
    """Real anonymous GETs, byte-equality; never sends HF_TOKEN."""
    failures = []
    with ThreadPoolExecutor(max_workers=workers) as pool:
        jobs = {pool.submit(mirror.anon_probe, files, [rel], 1): rel for rel in destinations}
        for job in as_completed(jobs):
            try:
                if job.result():
                    failures.append(jobs[job])
            except Exception:
                failures.append(jobs[job])
    return failures


def write_receipt(path, receipt):
    if path is None:
        return
    receipt["at"] = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    path.write_text(json.dumps(receipt, sort_keys=True, indent=2) + "\n")


def run():
    parser = argparse.ArgumentParser()
    parser.add_argument("--source-repo", required=True, type=Path)
    parser.add_argument("--source-dir", required=True, type=Path)
    parser.add_argument("--apply", action="store_true")
    parser.add_argument("--full-anonymous", action="store_true")
    parser.add_argument("--receipt", type=Path)
    args = parser.parse_args()

    receipt = {"schema": "csoai.mill-overflow-upload-receipt/1",
               "source_commit": SOURCE_SHA, "dataset": mirror.REPO,
               "target": PREFIX, "state": "STARTED", "admitted": False}
    try:
        actual_head = subprocess.check_output(
            ["git", "-C", str(args.source_repo), "rev-parse", "HEAD"], text=True
        ).strip()
        if actual_head != SOURCE_SHA:
            raise EvidenceError("CHECKED_OUT_REVISION_MISMATCH")
        files, digests, counts, total, shards = validate_manifest(
            MANIFEST, args.source_dir, strict=True
        )
        receipt.update(file_count=len(files), classes=counts, source_bytes=total,
                       shards=len(shards), max_shard_files=max(shards.values()))
        hits = mirror.secret_scan(files, sorted(files))
        if hits:
            raise EvidenceError("SECRET_SCAN_FAILED")
        receipt["secret_scan_hits"] = 0

        token = os.environ.get("HF_TOKEN") if args.apply else None
        if args.apply and not token:
            raise EvidenceError("HF_TOKEN_NOT_AVAILABLE")
        before = mirror.remote_tree([PREFIX], token=token)
        conflicts = [name for name in files
                     if name in before and not remote_match(files[name], before[name])]
        if conflicts:
            raise EvidenceError("IMMUTABLE_SHARD_CONFLICT")
        pending = sorted(name for name in files if name not in before)
        receipt.update(remote_before=len(before), already_byte_equal=len(files)-len(pending),
                       pending_before=len(pending))
        print(json.dumps({"source": SOURCE_SHA[:12], "classes": counts,
                          "pending": len(pending), "shards": len(shards),
                          "existing_matching": len(files)-len(pending),
                          "source_bytes": total, "secret_scan_hits": 0}))
        if not args.apply:
            receipt["state"] = "PLAN_ONLY_NO_WRITE"
            return 0

        receipt["state"] = "UPLOAD_ATTEMPTED_UNVERIFIED"
        if pending:
            mirror.commit(pending, files, token, "verified 2026-11-22 mill evidence overflow; no admission")
        after = mirror.remote_tree([PREFIX], token=token)
        mismatched = [name for name in files
                      if not remote_match(files[name], after.get(name))]
        receipt.update(remote_after=len(after), matching_tree_oids=len(files)-len(mismatched),
                       mismatched_tree_oids=len(mismatched))
        if mismatched:
            raise EvidenceError("POSTUPLOAD_REMOTE_BLOB_MISMATCH")

        by_shard = {}
        for name in sorted(files):
            shard = name[len(PREFIX)+1:len(PREFIX)+3]
            by_shard.setdefault(shard, name)
        to_probe = sorted(files) if args.full_anonymous else sorted(by_shard.values())
        bad = anonymous_readback(files, to_probe)
        receipt.update(anonymous_checked=len(to_probe),
                       anonymous_passed=len(to_probe)-len(bad),
                       anonymous_failed=len(bad))
        if bad:
            raise EvidenceError("ANONYMOUS_SHA256_READBACK_INCOMPLETE")
        receipt["state"] = ("ALL_ANONYMOUS_HASHES_VERIFIED" if args.full_anonymous
                            else "TREE_OIDS_AND_PER_SHARD_ANONYMOUS_HASHES_VERIFIED")
        print(json.dumps({"state": receipt["state"], "matching_tree_oids": len(files),
                          "anonymous_passed": len(to_probe), "admitted": False}))
        return 0
    except EvidenceError as error:
        receipt["state"] = str(error)
        print("FAIL_CLOSED: " + receipt["state"], file=sys.stderr)
        return 6
    except (SystemExit, OSError, ValueError):
        receipt["state"] = "EXTERNAL_OR_SOURCE_READ_UNAVAILABLE"
        print("FAIL_CLOSED: external/source read incomplete; no admission", file=sys.stderr)
        return 7
    finally:
        write_receipt(args.receipt, receipt)


if __name__ == "__main__":
    sys.exit(run())
