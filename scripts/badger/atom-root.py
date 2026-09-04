#!/usr/bin/env python3
"""Anchor the WHOLE atom queue with ONE timestamp: Merkle root + inclusion proofs.

WHY NOT 16,809 STAMPS. The obvious reading of "stamp and anchor all the atoms" is
one .ots per atom. That is the wrong shape, for four reasons:

  1. It would send ~50,000 submissions (16,809 atoms x 3 calendars) to free public
     infrastructure run by volunteers. That is abuse, and it gets you rate-limited
     or blocked, which anchors nothing.
  2. It takes hours of wall time and must be repeated for every new atom.
  3. It leaves 16,809 proof files to store, upgrade and verify forever, when the
     information content is one commitment.
  4. It still would not make anything "anchored". A stamp is a request; Bitcoin
     commits on its own schedule. Volume cannot buy that.

OpenTimestamps is built for exactly this: commit once to a Merkle root, prove each
member by inclusion. One stamp covers every atom, and when that root's proof
upgrades to a Bitcoin block, every atom in the tree is anchored through it — with
a proof any stranger can check offline.

The leaf digest and Merkle construction are IMPORTED from publish_public_root.py
rather than re-implemented, so an atom's inclusion proof is checkable with the same
code that checks a card's. Re-typing the tree is how two roots drift apart.

    python3 scripts/badger/atom-root.py --dry-run
    python3 scripts/badger/atom-root.py --build-candidate evidence/candidates/atom-roots/atom-root.json

The default command is fail-closed. This script no longer submits a timestamp.
A candidate is non-public and unsigned; publishing and OTS submission require a
separate reviewed ceremony.
"""
from __future__ import annotations

import argparse
import fnmatch
import hashlib
import importlib.util
import json
import sys
from datetime import datetime, timezone
from pathlib import Path

HERE = Path(__file__).resolve().parent
REPO = HERE.parent.parent
sys.path.insert(0, str(HERE))
from ots_stamp import attestation_state, describe  # noqa: E402

# publish_public_root.py has a hyphen-free name but lives outside the package path.
_spec = importlib.util.spec_from_file_location(
    "publish_public_root", REPO / "scripts" / "publish_public_root.py"
)
_ppr = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(_ppr)
merkle_root, merkle_proof, sha256_hex = _ppr.merkle_root, _ppr.merkle_proof, _ppr.sha256_hex

QUEUE = HERE / "_queue"
OUT = REPO / "public" / "interop"
CANDIDATE_DIR = REPO / "evidence" / "candidates" / "atom-roots"
SOURCE_POLICY_PATH = HERE / "atom-root-sources.json"

# These directories are immutable incident evidence, not admissible atom inputs.
#
# - cose-wrap/: the retired wrapper reused a signature over the card bytes for a
#   different COSE Sig_structure and omitted the RFC 9052 "Signature1" context.
# - xrpl-settlement/: the retired batch equated a successful ledger read with a
#   GSPC MEASURED result and emitted hash-shaped placeholders when no signing key
#   was available.
#
# Keep the files for auditability, but never commit them into a new root. The
# release gate independently checks this list so removing a prefix here cannot
# silently make either incident admissible again.
QUARANTINED_SOURCE_PREFIXES = (
    "bft-council/vote-chain-",
    "cose-wrap/",
    "deep-mining/",
    "learn-loop/",
    "witness-receipts/",
    "xrpl-settlement/",
)


def source_policy() -> dict:
    policy = json.loads(SOURCE_POLICY_PATH.read_text())
    if policy.get("default") != "deny":
        raise ValueError("atom-root source policy must be default-deny")
    return policy


def source_is_quarantined(source: str, policy: dict | None = None) -> bool:
    """Return True when an audit-only queue path must not enter a new root."""
    normalized = source.replace("\\", "/")
    configured = tuple((policy or {}).get("excluded_prefixes", QUARANTINED_SOURCE_PREFIXES))
    excluded_globs = tuple((policy or {}).get("excluded_globs", ()))
    return normalized.startswith(configured) or any(
        fnmatch.fnmatchcase(normalized, pattern) for pattern in excluded_globs
    )


def source_is_allowed(source: str, policy: dict) -> bool:
    normalized = source.replace("\\", "/")
    return not source_is_quarantined(normalized, policy) and normalized in set(
        policy.get("allowed_sources", [])
    )


def placeholder_evidence_issues(atom: dict) -> list[str]:
    """Reject known placeholder shapes before they can enter a candidate root."""
    issues: list[str] = []
    council = atom.get("council_attestation")
    if isinstance(council, dict) and (
        council.get("council_size") == 33
        and council.get("yes_count") == 33
        and council.get("no_count") == 0
        and council.get("quorum_reached") is True
    ):
        issues.append("hard-coded 33/33 council result")
    if atom.get("yes") == 33 and atom.get("no") == 0 and atom.get("quorum_reached") is True:
        issues.append("hard-coded 33/33 vote row")

    sig = atom.get("sig") or atom.get("sig_ed25519")
    if isinstance(sig, str) and len(sig) == 64 and all(c in "0123456789abcdefABCDEF" for c in sig):
        issues.append("32-byte digest represented as an Ed25519 signature")

    anchors = atom.get("anchors")
    if isinstance(anchors, dict):
        for receipt in anchors.values():
            if not isinstance(receipt, dict) or str(receipt.get("status", "")).lower() not in {
                "pending", "queued"
            }:
                continue
            for key in ("stamp", "entry_uuid", "attestation_uid"):
                value = receipt.get(key)
                if isinstance(value, str) and len(value.removeprefix("0x")) in {62, 63, 64}:
                    issues.append(f"hash-shaped {key} placeholder")
    return issues


def ots_file_digest(blob: bytes) -> str:
    """The digest a detached OTS proof actually commits to."""
    from opentimestamps.core.serialize import BytesDeserializationContext
    from opentimestamps.core.timestamp import DetachedTimestampFile

    return DetachedTimestampFile.deserialize(
        BytesDeserializationContext(blob)).file_digest.hex()


def canonical(obj) -> bytes:
    def rec(v):
        if isinstance(v, list):
            return [rec(x) for x in v]
        if isinstance(v, dict):
            return {k: rec(v[k]) for k in sorted(v.keys())}
        return v
    return json.dumps(rec(obj), separators=(",", ":"), ensure_ascii=False).encode("utf-8")


def collect() -> list[tuple[str, str]]:
    """(leaf_digest, source) for every atom, deduplicated, in stable order."""
    policy = source_policy()
    seen, leaves = set(), []
    for jsonl in sorted(QUEUE.rglob("*.jsonl")):
        source = str(jsonl.relative_to(QUEUE)).replace("\\", "/")
        if not source_is_allowed(source, policy):
            continue
        try:
            lines = jsonl.read_text(encoding="utf-8").splitlines()
        except UnicodeDecodeError as exc:
            raise ValueError(f"non-UTF-8 atom source {source}: {exc}") from exc
        for line_number, line in enumerate(lines, start=1):
            line = line.strip()
            if not line:
                continue
            try:
                atom = json.loads(line)
            except json.JSONDecodeError as exc:
                raise ValueError(
                    f"malformed JSONL in {source}:{line_number}: {exc.msg}"
                ) from exc
            if not isinstance(atom, dict):
                raise ValueError(
                    f"non-object JSONL record in {source}:{line_number}: "
                    f"got {type(atom).__name__}"
                )
            issues = placeholder_evidence_issues(atom)
            if issues:
                raise ValueError(f"inadmissible atom in {source}: {', '.join(issues)}")
            d = sha256_hex(canonical(atom))
            if d in seen:
                continue
            seen.add(d)
            leaves.append((d, source))
    leaves.sort()
    return leaves


def resolve_candidate_destination(requested: Path) -> Path:
    """Allow candidate writes only as direct JSON children of the evidence lane."""
    destination = (
        (REPO / requested).resolve()
        if not requested.is_absolute()
        else requested.resolve()
    )
    allowed_parent = CANDIDATE_DIR.resolve()
    if destination.parent != allowed_parent or destination.suffix.lower() != ".json":
        raise ValueError(
            "candidate destination must be a .json file directly under "
            "evidence/candidates/atom-roots/"
        )
    return destination


def verify_root(root_path: Path, ots_path: Path) -> int:
    """Verify root construction and require a parseable proof over exact bytes."""
    if not root_path.is_file():
        print(f"no root at {root_path}")
        return 1

    root_bytes = root_path.read_bytes()
    try:
        body = json.loads(root_bytes)
        if not isinstance(body, dict) or not isinstance(body.get("leaves"), list):
            raise ValueError("root must be an object with a leaves array")
        leaves = [leaf["leaf"] for leaf in body["leaves"]]
        expected = body["merkle_root"]
        recomputed = merkle_root(leaves)
    except (KeyError, TypeError, ValueError, json.JSONDecodeError) as exc:
        print(f"root        : INVALID — {exc}")
        return 1

    root_matches = recomputed == expected
    print(f"leaves      : {len(leaves)}")
    print(f"merkle_root : {expected}")
    print(f"recomputed  : {recomputed}  {'MATCH' if root_matches else 'MISMATCH'}")

    if not ots_path.is_file():
        print("ots         : UNCHECKABLE — no .ots beside this root")
        print("coverage    : UNCHECKABLE — exact-byte binding is required")
        return 1

    proof_bytes = ots_path.read_bytes()
    try:
        stamped = ots_file_digest(proof_bytes)
    except Exception as exc:
        print(f"ots         : UNCHECKABLE — proof did not parse ({type(exc).__name__})")
        print("coverage    : UNCHECKABLE — exact-byte binding is required")
        return 1

    state = attestation_state(proof_bytes)
    print(f"ots         : {describe(state)}")
    actual = hashlib.sha256(root_bytes).hexdigest()
    covered = actual == stamped
    if covered:
        print(f"coverage    : COVERS — proof commits to these exact bytes ({actual[:16]}…)")
    else:
        print(
            f"coverage    : ORPHANED — file is {actual[:16]}… but the proof covers "
            f"{stamped[:16]}…"
        )
    return 0 if root_matches and covered else 1


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    modes = ap.add_mutually_exclusive_group()
    modes.add_argument("--verify", action="store_true", help="re-check the published root, no network")
    modes.add_argument("--dry-run", action="store_true", help="compute the allowlisted root without writing")
    modes.add_argument(
        "--build-candidate",
        type=Path,
        help="write an unsigned candidate under evidence/candidates/atom-roots/",
    )
    args = ap.parse_args()

    if not args.verify and not args.dry_run and args.build_candidate is None:
        print("UNAVAILABLE_FAIL_CLOSED: choose --dry-run or --build-candidate; OTS submission requires a reviewed ceremony")
        return 78

    if args.verify:
        stamp = datetime.now(timezone.utc).strftime("%Y-%m-%d")
        root_path = OUT / f"atom-root-{stamp}.json"
        ots_path = OUT / f"atom-root-{stamp}.json.ots"
        return verify_root(root_path, ots_path)

    destination = None
    if args.build_candidate is not None:
        try:
            destination = resolve_candidate_destination(args.build_candidate)
        except ValueError as exc:
            print(f"refusing candidate destination: {exc}")
            return 2

    try:
        leaves = collect()
    except ValueError as exc:
        print(f"inadmissible atom source: {exc}")
        return 2
    if not leaves:
        print("no atoms found")
        return 1
    hexes = [d for d, _ in leaves]
    root = merkle_root(hexes)

    body = {
        "kind": "csoai.atom-root",
        "version": 1,
        "as_of": datetime.now(timezone.utc).isoformat(timespec="seconds").replace("+00:00", "Z"),
        "n_leaves": len(hexes),
        "merkle_root": root,
        "leaf_rule": (
            "sha256 over canonical JSON (sorted keys, no whitespace, ensure_ascii=False) "
            "of the whole atom. Tree and proof are publish_public_root.merkle_root / "
            "merkle_proof, imported not re-implemented."
        ),
        "anchor_rule": (
            "ONE OpenTimestamps stamp commits this root. Each atom is anchored through "
            "its inclusion proof, not through a stamp of its own. Until the .ots carries "
            "a Bitcoin block attestation this root is STAMPED, not ANCHORED."
        ),
        "leaves": [{"leaf": d, "source": s} for d, s in leaves],
    }
    if args.dry_run:
        print(f"allowlisted atoms: {len(hexes)}")
        print(f"candidate merkle root: {root}")
        print("writes: 0; signatures: 0; OTS submissions: 0")
        return 0

    assert destination is not None
    root_path = destination
    CANDIDATE_DIR.mkdir(parents=True, exist_ok=True)
    # STAMP THE BYTES WE WRITE. This previously wrote the pretty-printed body INCLUDING
    # leaves, then stamped sha256(canonical(body minus leaves)) — a compact, leaves-
    # excluded serialisation that is not the file and never was. So `<root>.json.ots` has
    # never been a detached proof of `<root>.json`, by construction, in every root this
    # script has ever produced. Every OTS tool compares a detached proof against the file
    # it is named after, so all of them reported a mismatch, and the two anchors at block
    # 965312 covering digests present in no file are that bug reaching Bitcoin.
    #
    # The old digest was not meaningless — it commits to the root metadata, and is
    # reconstructible from the published file by dropping `leaves` and canonicalising.
    # But a file named `X.ots` asserts it covers X. Either stamp X, or do not use that
    # name. Stamping X is the useful choice: a stranger runs `ots verify` against the
    # published bytes with no instructions from us.
    root_bytes = (json.dumps(body, indent=2, ensure_ascii=False) + "\n").encode("utf-8")
    try:
        with root_path.open("xb") as candidate:
            candidate.write(root_bytes)
    except FileExistsError:
        print(f"refusing to overwrite existing candidate: {root_path}")
        return 2

    digest = hashlib.sha256(root_bytes).hexdigest()
    print(f"candidate atoms: {len(hexes)}")
    print(f"merkle_root   : {root}")
    print(f"file digest   : {digest}")
    print(f"wrote unsigned, unstamped candidate: {root_path}")
    print("Publishing and OTS submission remain ceremony-gated.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
