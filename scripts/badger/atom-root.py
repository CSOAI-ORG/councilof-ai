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
    python3 scripts/badger/atom-root.py --build-candidate evidence/candidates/atom-root.json

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
        for line in jsonl.read_text(errors="replace").splitlines():
            line = line.strip()
            if not line:
                continue
            try:
                atom = json.loads(line)
            except Exception:
                continue
            if not isinstance(atom, dict):
                continue
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


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--verify", action="store_true", help="re-check the published root, no network")
    ap.add_argument("--dry-run", action="store_true", help="compute the allowlisted root without writing")
    ap.add_argument("--build-candidate", type=Path, help="write an unsigned candidate outside public/")
    args = ap.parse_args()

    if not args.verify and not args.dry_run and args.build_candidate is None:
        print("UNAVAILABLE_FAIL_CLOSED: choose --dry-run or --build-candidate; OTS submission requires a reviewed ceremony")
        return 78
    if args.build_candidate is not None:
        destination = (REPO / args.build_candidate).resolve() if not args.build_candidate.is_absolute() else args.build_candidate.resolve()
        public_root = (REPO / "public").resolve()
        if public_root == destination or public_root in destination.parents or destination.suffix == ".ots":
            print("refusing candidate destination: candidates must stay outside public/ and cannot be .ots files")
            return 2

    stamp = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    root_path = OUT / f"atom-root-{stamp}.json"
    ots_path = OUT / f"atom-root-{stamp}.json.ots"

    # NEVER overwrite a proof. The queue grows all day, so re-rooting is normal, but a
    # root's .ots is evidence and writing over it destroys hours of calendar time. A root
    # is superseded, never edited: it keeps its name and the new one takes the next suffix.
    # (It happened twice — a root anchored at block 965299 covering 42,118 atoms was
    # clobbered by a re-root minutes later, and again at block 965312.)
    #
    # SUPERSEDE ON *ANY* PRIOR STAMP, not only an anchored one. This used to read
    # `if prior["state"] == "bitcoin"`, which asks the wrong question at the wrong time.
    # A stamp is a CLAIM ON FUTURE EVIDENCE: pending now, Bitcoin-attested hours later
    # when a calendar aggregates it. Overwriting a pending stamp therefore destroys a
    # proof that had not become valuable YET, and the calendar goes on to anchor it
    # anyway — leaving a genuine BitcoinBlockHeaderAttestation over bytes that no longer
    # exist.
    #
    # That is not hypothetical. Audited 2026-09-04:
    #   atom-root-2026-09-03.json.ots    anchored block 965312, covers cbfca3da…
    #   atom-root-2026-09-03-2.json.ots  anchored block 965312, covers eebb7987…
    #   the files beside them are        6f9e25e7… and 103866d3…
    # Neither proof covers the file it sits next to, and the copy actually served was a
    # third set of bytes again. An anchor over bytes nobody has is worse than no anchor,
    # because it reads as proof.
    #
    # A pending stamp costs one filename to keep and hours of calendar time to re-earn.
    # Always supersede; never overwrite.
    if not args.verify and ots_path.exists():
        prior = attestation_state(ots_path.read_bytes())
        n = 2
        while (OUT / f"atom-root-{stamp}-{n}.json.ots").exists():
            n += 1
        root_path = OUT / f"atom-root-{stamp}-{n}.json"
        ots_path = OUT / f"atom-root-{stamp}-{n}.json.ots"
        where = (f"ANCHORED at block {prior['block_height']}" if prior["state"] == "bitcoin"
                 else f"{prior['state'].upper()} — and a pending stamp still becomes an anchor later")
        print(f"  prior root is {where} — superseding, not overwriting.")
        print(f"  New root -> {root_path.name}")

    if args.verify:
        if not root_path.exists():
            print(f"no root at {root_path}")
            return 1
        body = json.loads(root_path.read_text())
        leaves = [l["leaf"] for l in body["leaves"]]
        recomputed = merkle_root(leaves)
        ok = recomputed == body["merkle_root"]
        print(f"leaves      : {len(leaves)}")
        print(f"merkle_root : {body['merkle_root']}")
        print(f"recomputed  : {recomputed}  {'MATCH' if ok else 'MISMATCH'}")
        st = attestation_state(ots_path.read_bytes() if ots_path.exists() else None)
        print(f"ots         : {describe(st)}")

        # COVERAGE. Recomputing the Merkle root proves the leaves hash to the value the
        # file states. It says nothing about whether the .ots beside it commits to THESE
        # bytes — and that is the failure that actually happened: two roots carrying real
        # Bitcoin attestations at block 965312 over digests matching no file on disk.
        # A proof that names a file it does not cover is worse than a missing proof,
        # because it reads as anchored. UNCHECKABLE is a distinct state from ORPHANED:
        # no proof present is not the same as a proof that disagrees.
        covered = None
        if ots_path.exists():
            actual = hashlib.sha256(root_path.read_bytes()).hexdigest()
            try:
                stamped = ots_file_digest(ots_path.read_bytes())
            except Exception as e:
                stamped = None
                print(f"coverage    : UNCHECKABLE — proof did not parse ({type(e).__name__})")
            if stamped is not None:
                covered = actual == stamped
                if covered:
                    print(f"coverage    : COVERS — proof commits to these exact bytes ({actual[:16]}…)")
                else:
                    print(f"coverage    : ORPHANED — file is {actual[:16]}… but the proof covers "
                          f"{stamped[:16]}…. This root was regenerated after it was stamped; the "
                          f"anchor proves the existence of bytes that are not here.")
        else:
            print("coverage    : UNCHECKABLE — no .ots beside this root")

        return 0 if (ok and covered is not False) else 1

    leaves = collect()
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

    root_path = destination
    root_path.parent.mkdir(parents=True, exist_ok=True)
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
    root_path.write_bytes(root_bytes)

    digest = hashlib.sha256(root_bytes).hexdigest()
    print(f"candidate atoms: {len(hexes)}")
    print(f"merkle_root   : {root}")
    print(f"file digest   : {digest}")
    print(f"wrote unsigned, unstamped candidate: {root_path}")
    print("Publishing and OTS submission remain ceremony-gated.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
