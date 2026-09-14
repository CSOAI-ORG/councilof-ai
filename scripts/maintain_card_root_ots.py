#!/usr/bin/env python3
"""Stage bounded OTS upgrades for exact published card-root bytes.

This command never writes public files. It validates every root and detached
proof before network access, follows only the fixed HTTPS calendar allowlist,
then writes candidates into a new review directory. A pending response is kept
pending and is not staged. A Bitcoin attestation remains explicitly unverified;
this command has no Bitcoin node and makes no chain-confirmation claim.
"""
from __future__ import annotations

import argparse
import json
import re
from pathlib import Path

from maintain_card_ots import (
    CALENDARS,
    fetch_calendar,
    nodes,
    parse,
    proof_state,
    serialize,
    sha,
)
from opentimestamps.core.notary import PendingAttestation
from opentimestamps.core.serialize import BytesDeserializationContext
from opentimestamps.core.timestamp import Timestamp

HERE = Path(__file__).resolve().parent
REPO = HERE.parent
PUBLIC = REPO / "public" / "interop"
ROOT_NAME = re.compile(r"card-root-[0-9]{4}-[0-9]{2}-[0-9]{2}(?:-[a-f0-9]{12})?\.json\Z")
HEX = re.compile(r"[a-f0-9]{64}\Z")


def _safe_root(path: Path, public_dir: Path) -> Path:
    path = path.absolute()
    if not ROOT_NAME.fullmatch(path.name) or path.parent.resolve() != public_dir.resolve():
        raise ValueError(f"unexpected card-root path: {path}")
    if path.is_symlink() or not path.is_file():
        raise ValueError("card root must be a regular non-symlink file")
    return path


def _validate_root(raw: bytes) -> dict:
    if len(raw) > 4_194_304:
        raise ValueError("oversized card root")
    doc = json.loads(raw)
    leaves = doc.get("leaves")
    if doc.get("kind") != "csoai.card-root/1" or not isinstance(leaves, list) or not leaves:
        raise ValueError("unsupported card root")
    digests = []
    for index, leaf in enumerate(leaves):
        digest = leaf.get("leaf") if isinstance(leaf, dict) else None
        if not isinstance(digest, str) or not HEX.fullmatch(digest) or leaf.get("index") != index:
            raise ValueError("malformed card-root leaf/index")
        digests.append(digest)
    if len(set(digests)) != len(digests):
        raise ValueError("duplicate card-root leaf")
    # Import the estate's one tree implementation rather than retype it.
    from card_root import merkle_root
    if doc.get("n_leaves") != len(leaves) or doc.get("merkle_root") != merkle_root(digests):
        raise ValueError("card-root Merkle commitment does not recompute")
    return doc


def maintain(root_paths, output_dir: Path, *, max_requests=8, timeout=10,
             fetcher=fetch_calendar, public_dir: Path = PUBLIC) -> dict:
    if not 1 <= max_requests <= 32 or not 1 <= timeout <= 30 or max_requests * timeout > 300:
        raise ValueError("request budget exceeds bounds")
    output = Path(output_dir).absolute()
    if output.exists() or output.is_symlink() or not output.parent.is_dir() or output.parent.is_symlink():
        raise ValueError("upgrade requires a new output directory under an existing real parent")

    held = []
    seen = set()
    for supplied in root_paths:
        root = _safe_root(Path(supplied), public_dir)
        if root.name in seen:
            raise ValueError("duplicate card-root path")
        seen.add(root.name)
        raw_root = root.read_bytes()
        _validate_root(raw_root)
        proof_path = root.with_suffix(root.suffix + ".ots")
        if proof_path.is_symlink() or (proof_path.exists() and not proof_path.is_file()):
            raise ValueError("OTS sidecar must be a regular non-symlink file")
        raw_proof = proof_path.read_bytes() if proof_path.exists() else None
        proof = parse(raw_proof, sha(raw_root)) if raw_proof is not None else None
        held.append((root, raw_root, proof_path, raw_proof, proof))
    if not held:
        raise ValueError("no card roots to maintain")

    requests = 0
    cache = {}
    results = []
    staged = []
    for root, raw_root, proof_path, raw_proof, proof in held:
        before = proof_state(proof)
        issues = []
        pending = []
        if proof is not None and before["state"] == "STAMPED_PENDING_BITCOIN":
            pending = [
                (node, att)
                for node in nodes(proof.timestamp)
                for att in list(node.attestations)
                if isinstance(att, PendingAttestation)
            ]
        for node, att in pending:
            try:
                uri = att.uri.decode("utf-8") if isinstance(att.uri, bytes) else att.uri
            except UnicodeDecodeError:
                issues.append("CALENDAR_NOT_ADMITTED")
                continue
            if uri not in CALENDARS:
                issues.append("CALENDAR_NOT_ADMITTED")
                continue
            key = (uri, node.msg)
            if key not in cache:
                if requests >= max_requests:
                    issues.append("REQUEST_BUDGET_EXHAUSTED")
                    continue
                requests += 1
                try:
                    response = fetcher(uri, node.msg, timeout)
                    context = BytesDeserializationContext(response)
                    Timestamp.deserialize(context, node.msg)
                    context.assert_eof()
                    cache[key] = (response, None)
                except Exception as exc:
                    cache[key] = (None, type(exc).__name__)
            response, error = cache[key]
            if error:
                issues.append("CALENDAR_UNAVAILABLE:" + error)
            else:
                node.merge(Timestamp.deserialize(BytesDeserializationContext(response), node.msg))

        after = proof_state(proof)
        candidate = serialize(proof) if proof is not None else None
        if candidate is not None:
            parse(candidate, sha(raw_root))
        # Only a monotonic transition out of pending is reviewable. Calendar
        # graph churn which remains pending never displaces the exact sidecar.
        changed = (
            raw_proof is not None
            and candidate != raw_proof
            and before["state"] == "STAMPED_PENDING_BITCOIN"
            and after["state"] == "BITCOIN_ATTESTATION_UNVERIFIED"
        )
        if before["state"] == "STAMPED_PENDING_BITCOIN" and not changed:
            issues.append("STILL_PENDING_NOT_STAGED")
        result = {
            "root": root.name,
            "subject_sha256": sha(raw_root),
            "before": before,
            "after": after,
            "changed": changed,
            "original_proof_sha256": sha(raw_proof) if raw_proof is not None else None,
            "candidate_proof_sha256": sha(candidate) if changed else None,
            "chain_verified": False,
            "issues": sorted(set(issues)),
        }
        results.append(result)
        if changed:
            staged.append((proof_path.name, raw_proof, candidate))

    # Recheck every exact input after network reads, before staging a mixed run.
    for root, raw_root, proof_path, raw_proof, _ in held:
        _safe_root(root, public_dir)
        if root.read_bytes() != raw_root or proof_path.is_symlink() or (
            proof_path.read_bytes() if proof_path.exists() else None
        ) != raw_proof:
            raise ValueError("source changed during maintenance")

    report = {
        "schema": "csoai.card-root-ots-maintenance/1",
        "roots": len(held),
        "requests": requests,
        "proofs_changed": len(staged),
        "chain_verified": False,
        "limit": (
            "Candidates only carry a Bitcoin attestation tag. They are not Bitcoin-chain "
            "verified here and require review before publication."
        ),
        "results": results,
    }
    output.mkdir()
    for name, original, candidate in staged:
        for group, raw in (("originals", original), ("candidates", candidate)):
            directory = output / group
            directory.mkdir(exist_ok=True)
            with (directory / name).open("xb") as handle:
                handle.write(raw)
    with (output / "report.json").open("xb") as handle:
        handle.write((json.dumps(report, indent=2) + "\n").encode())
    return report


def main(argv=None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("roots", nargs="*", type=Path)
    parser.add_argument("--output-dir", required=True, type=Path)
    parser.add_argument("--max-requests", type=int, default=8)
    parser.add_argument("--timeout", type=int, default=10)
    args = parser.parse_args(argv)
    roots = args.roots or sorted(PUBLIC.glob("card-root-*.json"))
    try:
        report = maintain(roots, args.output_dir, max_requests=args.max_requests, timeout=args.timeout)
    except Exception as exc:
        print(json.dumps({"state": "FAILED_CLOSED", "error": type(exc).__name__, "reason": str(exc)}))
        return 2
    print(json.dumps(report, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
