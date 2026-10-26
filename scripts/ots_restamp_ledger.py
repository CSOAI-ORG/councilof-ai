#!/usr/bin/env python3
"""Re-stamp a publisher-owned mutable ledger whose bytes changed; keep the old bytes + old proof.

WHY. public/interop/eas-root-attestations.json carries a detached OpenTimestamps proof
(eas-root-attestations.json.ots) of its 30 Sep 2026 bytes. root-witness-release-gate.py checks
every public .ots against the bytes beside it and blocks the whole root on one mismatch. The
hourly publisher rewrote that ledger on every run, so the gate blocked every public-root run of
5-6 Oct 2026 (runs 37376012173, 37403227482, 37447955940): a fresh root was signed, witnessed on
Rekor and stamped, then thrown away.

scripts/eas_attest_root.mjs no longer rewrites an unchanged NOT_YET. This covers the other case:
the ledger really changes (an EAS attestation is appended). A proof of the previous bytes must
not stay beside the new bytes. The procedure is the one #2816 applied by hand:

  1. recover the bytes the existing proof commits to from git HEAD, and check them against the
     proof's own digest (never assumed);
  2. keep the old bytes and the old proof, byte-exact, as <stem>.pre-<event><suffix>(.ots);
  3. stamp the new bytes with the OpenTimestamps calendars (calendar-pending, which is never
     described as Bitcoin-anchored);
  4. require the new proof's digest to equal sha256(new bytes).

If any step fails, everything is rolled back and the script exits non-zero. The release gate would
block the tree anyway, so stopping here gives the reason instead of a digest mismatch.

SCOPE. Only paths in MUTABLE_LEDGERS. If a dated receipt or signed artifact changes bytes, that is
an incident, not a re-stamp, and the gate keeps blocking it.

    python3 scripts/ots_restamp_ledger.py --check                    # report, write nothing
    python3 scripts/ots_restamp_ledger.py --event root-0ee7e9ee \\
        --list-out "$RUNNER_TEMP/restamped.txt"                       # re-stamp what changed

Exit codes: 0 = every ledger CURRENT, UNSTAMPED, ABSENT or RESTAMPED; 1 = STALE under --check, or a
refusal. Measurement, not certification.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import os
import re
import shutil
import subprocess
import sys
from pathlib import Path
from typing import Callable

REPO = Path(__file__).resolve().parents[1]
MUTABLE_LEDGERS = ("public/interop/eas-root-attestations.json",)
EVENT_RE = re.compile(r"^[a-z0-9][a-z0-9-]{2,63}$")


class RestampError(RuntimeError):
    pass


def sha256(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def proof_digest(proof: bytes) -> str:
    """The sha256 digest a detached proof commits to. Refuses anything that is not one."""
    from opentimestamps.core.op import OpSHA256
    from opentimestamps.core.serialize import BytesDeserializationContext
    from opentimestamps.core.timestamp import DetachedTimestampFile

    try:
        detached = DetachedTimestampFile.deserialize(BytesDeserializationContext(proof))
    except Exception as exc:  # a calendar fragment saved under the .ots name is not a proof
        raise RestampError(f"not an OpenTimestamps detached proof: {type(exc).__name__}") from exc
    if not isinstance(detached.file_hash_op, OpSHA256):
        raise RestampError(f"proof file hash is {detached.file_hash_op!r}, not sha256")
    if not any(True for _ in detached.timestamp.all_attestations()):
        raise RestampError("proof carries no attestation (neither calendar-pending nor Bitcoin)")
    return bytes(detached.timestamp.msg).hex()


def git_head_bytes(repo: Path, rel: str) -> bytes | None:
    try:
        return subprocess.run(
            ["git", "-C", str(repo), "show", f"HEAD:{rel}"], check=True, capture_output=True, timeout=60
        ).stdout
    except (subprocess.CalledProcessError, subprocess.TimeoutExpired, FileNotFoundError):
        return None


def calendar_stamp(path: Path) -> bytes:
    """`ots stamp` the file (writes <path>.ots) and return the proof bytes."""
    exe = os.environ.get("OTS_BIN") or shutil.which("ots")
    if not exe:
        raise RestampError("ots client not installed on this runner (pip install opentimestamps-client)")
    out = path.with_name(path.name + ".ots")
    if out.exists():
        raise RestampError(f"refusing to stamp over an existing proof: {out}")
    try:
        subprocess.run(
            [exe, "--no-cache", "stamp", "--timeout", "90", str(path)],
            check=True, capture_output=True, text=True, timeout=240,
        )
    except Exception as exc:
        raise RestampError(f"calendars did not answer: {str(exc)[:160]}") from exc
    if not out.is_file():
        raise RestampError("ots stamp produced no proof")
    return out.read_bytes()


def pre_path(path: Path, event: str) -> Path:
    return path.with_name(f"{path.stem}.pre-{event}{path.suffix}")


def restamp_ledger(
    repo: Path,
    rel: str,
    event: str | None,
    *,
    check_only: bool = False,
    stamp: Callable[[Path], bytes] = calendar_stamp,
    head_bytes: Callable[[Path, str], bytes | None] = git_head_bytes,
) -> dict:
    if rel not in MUTABLE_LEDGERS:
        raise RestampError(f"{rel} is not a declared publisher-owned mutable ledger; a changed receipt is an incident, not a re-stamp")
    path = repo / rel
    proof = path.with_name(path.name + ".ots")
    if not path.is_file():
        return {"path": rel, "state": "ABSENT"}
    if not proof.is_file():
        return {"path": rel, "state": "UNSTAMPED"}

    new = path.read_bytes()
    new_sha = sha256(new)
    old_proof = proof.read_bytes()
    old_digest = proof_digest(old_proof)
    if old_digest == new_sha:
        return {"path": rel, "state": "CURRENT", "sha256": new_sha}
    if check_only:
        return {"path": rel, "state": "STALE", "proof_commits_to": old_digest, "bytes_hash_to": new_sha}

    if event is None or not EVENT_RE.fullmatch(event):
        raise RestampError(f"--event must match {EVENT_RE.pattern}, got {event!r}")
    old = head_bytes(repo, rel)
    if old is None or sha256(old) != old_digest:
        raise RestampError(
            f"{rel}: the bytes its proof commits to ({old_digest[:16]}...) are not the bytes at git HEAD; "
            "refusing to invent a dated pair"
        )

    pre = pre_path(path, event)
    pre_proof = pre.with_name(pre.name + ".ots")
    created: list[Path] = []
    for target, data in ((pre, old), (pre_proof, old_proof)):
        if target.exists():
            if target.read_bytes() != data:
                raise RestampError(f"{target.relative_to(repo)} already exists with different bytes")
            continue
        target.write_bytes(data)
        created.append(target)

    proof.unlink()
    try:
        new_proof = stamp(path)
        if proof_digest(new_proof) != new_sha:
            raise RestampError("the new proof does not commit to the new bytes")
        proof.write_bytes(new_proof)
    except Exception:
        proof.unlink(missing_ok=True)
        proof.write_bytes(old_proof)
        for target in created:
            target.unlink(missing_ok=True)
        raise

    return {
        "path": rel,
        "state": "RESTAMPED",
        "sha256": new_sha,
        "proof": proof.relative_to(repo).as_posix(),
        "proof_state": "CALENDAR_PENDING",
        "previous": {
            "sha256": old_digest,
            "bytes": pre.relative_to(repo).as_posix(),
            "proof": pre_proof.relative_to(repo).as_posix(),
        },
        "touched": [rel, proof.relative_to(repo).as_posix(), pre.relative_to(repo).as_posix(), pre_proof.relative_to(repo).as_posix()],
    }


def main(argv: list[str] | None = None) -> int:
    ap = argparse.ArgumentParser(description=__doc__.split("\n\n")[0])
    ap.add_argument("--event", help="dated-pair label, e.g. root-<first 8 hex of the new root.json sha256>")
    ap.add_argument("--check", action="store_true", help="report CURRENT/STALE, write nothing")
    ap.add_argument("--list-out", help="write every path this run touched, one per line (for git add)")
    ap.add_argument("--repo", default=str(REPO))
    a = ap.parse_args(argv)
    if not a.check and not a.event:
        ap.error("--event is required unless --check")

    repo = Path(a.repo).resolve()
    rows: list[dict] = []
    try:
        for rel in MUTABLE_LEDGERS:
            rows.append(restamp_ledger(repo, rel, a.event, check_only=a.check))
    except RestampError as exc:
        print(json.dumps({"status": "REFUSED", "reason": str(exc), "ledgers": rows}, indent=1))
        return 1

    touched = [p for row in rows for p in row.get("touched", [])]
    if a.list_out:
        Path(a.list_out).write_text("".join(f"{p}\n" for p in touched))
    stale = [row for row in rows if row["state"] == "STALE"]
    print(json.dumps({"status": "STALE" if stale else "OK", "ledgers": rows}, indent=1))
    return 1 if stale else 0


if __name__ == "__main__":
    sys.exit(main())
