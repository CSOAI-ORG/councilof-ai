#!/usr/bin/env python3
"""Manifest-bound OTS maintenance. Offline by default; upgrade stages, never publishes.

Uses the official OpenTimestamps parser/operation graph, not a new verifier.
Even a parsed Bitcoin attestation is UNVERIFIED until checked against the chain.
"""
from __future__ import annotations

import argparse
import hashlib
import io
import json
import re
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

from opentimestamps.core.notary import BitcoinBlockHeaderAttestation, PendingAttestation
from opentimestamps.core.serialize import BytesDeserializationContext, StreamDeserializationContext, StreamSerializationContext
from opentimestamps.core.timestamp import DetachedTimestampFile, Timestamp

CALENDARS = frozenset({
    "https://a.pool.opentimestamps.org", "https://b.pool.opentimestamps.org",
    "https://alice.btc.calendar.opentimestamps.org", "https://bob.btc.calendar.opentimestamps.org",
})
PATH = re.compile(r"cards/signed-[a-z0-9-]+-[a-f0-9]{12}\.json\Z")
HEX = re.compile(r"[a-f0-9]{64}\Z")
MAX_PROOF = 1_048_576


def sha(raw):
    return hashlib.sha256(raw).hexdigest()


def safe_file(root: Path, relative: str) -> Path:
    if not PATH.fullmatch(relative.removesuffix(".ots")):
        raise ValueError("unexpected card/proof path")
    path = root / relative
    for part in (path, path.parent):
        if part.is_symlink():
            raise ValueError("symlink card/proof path")
    if path.resolve().parent != (root / "cards").resolve():
        raise ValueError("card/proof escapes manifest directory")
    if path.exists() and not path.is_file():
        raise ValueError("card/proof must be a regular file")
    return path


def parse(raw: bytes, digest: str):
    if len(raw) > MAX_PROOF:
        raise ValueError("oversized OTS proof")
    context = StreamDeserializationContext(io.BytesIO(raw))
    proof = DetachedTimestampFile.deserialize(context)
    context.assert_eof()
    if proof.file_hash_op.TAG != b"\x08" or proof.timestamp.msg.hex() != digest:
        raise ValueError("OTS proof does not bind exact SHA256 card bytes")
    return proof


def serialize(proof):
    out = io.BytesIO()
    proof.serialize(StreamSerializationContext(out))
    return out.getvalue()


def proof_state(proof):
    if proof is None:
        return {"state": "ABSENT", "chain_verified": False}
    attestations = list(proof.timestamp.all_attestations())
    heights = sorted({a.height for _, a in attestations if isinstance(a, BitcoinBlockHeaderAttestation)})
    pending = sum(isinstance(a, PendingAttestation) for _, a in attestations)
    return {"state": "BITCOIN_ATTESTATION_UNVERIFIED" if heights else "STAMPED_PENDING_BITCOIN" if pending else "NO_KNOWN_ATTESTATION",
            "bitcoin_heights": heights, "pending_attestations": pending, "chain_verified": False}


def nodes(timestamp):
    seen, stack = set(), [timestamp]
    while stack:
        node = stack.pop()
        if id(node) in seen:
            continue
        seen.add(id(node))
        yield node
        stack.extend(node.ops.values())


class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        raise ValueError("calendar redirect refused")


def fetch_calendar(url, commitment, timeout):
    """GET only; the official parser binds the response to this commitment."""
    if url not in CALENDARS:
        raise ValueError("calendar not admitted")
    request = urllib.request.Request(url + "/timestamp/" + commitment.hex(), headers={"Accept": "application/vnd.opentimestamps.v1", "User-Agent": "csoai-ots-maintenance/1"})
    with urllib.request.build_opener(NoRedirect()).open(request, timeout=timeout) as response:
        if response.status != 200:
            raise ValueError("calendar did not return HTTP 200")
        raw = response.read(10_001)
    if len(raw) > 10_000:
        raise ValueError("oversized calendar response")
    # Do not accept an operation graph for another digest.
    context = BytesDeserializationContext(raw)
    Timestamp.deserialize(context, commitment)
    context.assert_eof()
    return raw


def maintain(manifest_path, manifest_sha, *, upgrade=False, output_dir=None, max_requests=8, timeout=10, fetcher=fetch_calendar):
    manifest_path = Path(manifest_path).absolute()
    if manifest_path.is_symlink() or not manifest_path.is_file() or not HEX.fullmatch(manifest_sha):
        raise ValueError("manifest must be a regular file with an independently retained SHA256")
    if manifest_path.stat().st_size > 262_144:
        raise ValueError("manifest SHA256/size mismatch")
    raw_manifest = manifest_path.read_bytes()
    if len(raw_manifest) > 262_144 or sha(raw_manifest) != manifest_sha:
        raise ValueError("manifest SHA256/size mismatch")
    manifest = json.loads(raw_manifest)
    rows = manifest.get("files", [])
    if manifest.get("schema") != "csoai.exact-card-ots-preparation/1" or not 1 <= len(rows) <= 256 or manifest.get("count") != len(rows):
        raise ValueError("unsupported manifest or count")
    if not 1 <= max_requests <= 32 or not 1 <= timeout <= 30 or max_requests * timeout > 300:
        raise ValueError("request budget exceeds bounds")
    output = Path(output_dir).absolute() if output_dir else None
    if upgrade and (output is None or output.exists() or output.is_symlink() or not output.parent.is_dir() or output.parent.is_symlink()):
        raise ValueError("upgrade requires a new output directory under an existing real parent")
    if not upgrade and output is not None:
        raise ValueError("dry-run does not write an output directory")

    root = manifest_path.parent.resolve()
    held, paths, total = [], set(), 0
    # Validate the ENTIRE input set before any calendar request or output write.
    for row in rows:
        relative = row.get("path", "")
        if not PATH.fullmatch(relative) or relative in paths or not HEX.fullmatch(row.get("sha256", "")):
            raise ValueError("unexpected/duplicate path or malformed digest")
        paths.add(relative)
        card_path = safe_file(root, relative)
        if card_path.stat().st_size > 32_768:
            raise ValueError("oversized card")
        raw_card = card_path.read_bytes()
        expected_url = "https://councilof.ai/interop/mill-cards-signed/" + relative.removeprefix("cards/")
        if row.get("public_url") != expected_url or len(raw_card) != row.get("bytes") or sha(raw_card) != row["sha256"]:
            raise ValueError("card bytes, URL or digest differ from manifest")
        total += len(raw_card)
        proof_path = safe_file(root, relative + ".ots")
        if proof_path.exists() and proof_path.stat().st_size > MAX_PROOF:
            raise ValueError("oversized OTS proof")
        raw_proof = proof_path.read_bytes() if proof_path.exists() else None
        proof = parse(raw_proof, row["sha256"]) if raw_proof is not None else None
        held.append((row, card_path, raw_card, proof_path, raw_proof, proof))
    if total != manifest.get("total_bytes"):
        raise ValueError("manifest total byte count mismatch")

    requests, cache, results, staged = 0, {}, [], []
    for row, card_path, raw_card, proof_path, raw_proof, proof in held:
        before = proof_state(proof)
        before_serialized = serialize(proof) if proof is not None else None
        issues = []
        # Snapshot nodes/attestations: one bounded pass, never chase newly supplied calendars.
        pending = [(node, a) for node in nodes(proof.timestamp) for a in list(node.attestations) if isinstance(a, PendingAttestation)] if proof and before["state"] != "BITCOIN_ATTESTATION_UNVERIFIED" else []
        for node, att in pending:
            try:
                uri = att.uri.decode("utf-8") if isinstance(att.uri, bytes) else att.uri
            except UnicodeDecodeError:
                issues.append("CALENDAR_NOT_ADMITTED")
                continue
            if uri not in CALENDARS:
                issues.append("CALENDAR_NOT_ADMITTED")
                continue
            if not upgrade:
                continue
            key = (uri, node.msg)
            if key not in cache:
                if requests >= max_requests:
                    issues.append("REQUEST_BUDGET_EXHAUSTED")
                    continue
                requests += 1
                try:
                    response = fetcher(uri, node.msg, timeout)
                    if len(response) > 10_000:
                        raise ValueError("oversized calendar response")
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
        candidate = serialize(proof) if proof is not None else None
        if candidate is not None:
            parse(candidate, row["sha256"])
        changed = upgrade and raw_proof is not None and candidate != before_serialized
        result = {"path": row["path"], "subject_sha256": row["sha256"], "before": before, "after": proof_state(proof), "changed": bool(changed), "original_proof_sha256": sha(raw_proof) if raw_proof is not None else None,
                  "candidate_proof_sha256": sha(candidate) if changed else None, "candidate_path": "candidates/" + row["path"] + ".ots" if changed else None,
                  "original_path": "originals/" + row["path"] + ".ots" if changed else None, "issues": sorted(set(issues))}
        results.append(result)
        if changed:
            staged.append((row["path"] + ".ots", raw_proof, candidate))

    # Race check: an input changed during network reads must not become a mixed bundle.
    if manifest_path.is_symlink() or not manifest_path.is_file() or manifest_path.read_bytes() != raw_manifest:
        raise ValueError("manifest changed during maintenance")
    for row, card_path, raw_card, proof_path, raw_proof, _ in held:
        safe_file(root, row["path"])
        safe_file(root, row["path"] + ".ots")
        if card_path.read_bytes() != raw_card or (proof_path.read_bytes() if proof_path.exists() else None) != raw_proof:
            raise ValueError("source changed during maintenance")
    report = {"schema": "csoai.ots-maintenance/1", "mode": "STAGED_UPGRADE" if upgrade else "OFFLINE_DRY_RUN", "observed_at": datetime.now(timezone.utc).isoformat(), "manifest_sha256": manifest_sha,
              "files": len(rows), "total_bytes": total, "requests": requests, "proofs_changed": len(staged), "chain_verified": False,
              "limit": "No publication or chain verification. A Bitcoin attestation is not verified Bitcoin; use official ots verify against a trusted Bitcoin node.", "results": results}
    if upgrade:
        output.mkdir()  # exclusive; never overwrite a previous run
        for relative, original, candidate in staged:
            for group, data in (("originals", original), ("candidates", candidate)):
                path = output / group / relative
                path.parent.mkdir(parents=True, exist_ok=True)
                with path.open("xb") as handle:
                    handle.write(data)
        for name, data in (("manifest.json", raw_manifest), ("report.json", (json.dumps(report, indent=2) + "\n").encode())):
            with (output / name).open("xb") as handle:
                handle.write(data)
    return report


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--manifest", required=True, type=Path)
    parser.add_argument("--manifest-sha256", required=True)
    mode = parser.add_mutually_exclusive_group()
    mode.add_argument("--dry-run", action="store_true", help="default: local verification only, no writes/network")
    mode.add_argument("--upgrade", action="store_true", help="explicit calendar GETs, stage proof changes only")
    parser.add_argument("--output-dir", type=Path)
    parser.add_argument("--max-requests", type=int, default=8)
    parser.add_argument("--timeout", type=int, default=10)
    args = parser.parse_args(argv)
    try:
        report = maintain(args.manifest, args.manifest_sha256, upgrade=args.upgrade, output_dir=args.output_dir, max_requests=args.max_requests, timeout=args.timeout)
    except Exception as exc:
        print(json.dumps({"state": "FAILED_CLOSED", "error": type(exc).__name__, "reason": str(exc)}))
        return 2
    print(json.dumps(report, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
