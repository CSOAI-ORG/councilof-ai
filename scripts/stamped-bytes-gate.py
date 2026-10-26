#!/usr/bin/env python3
"""A pull request may not change the bytes of an OpenTimestamps-stamped file unless it re-stamps it.

WHY THIS EXISTS (7 Oct 2026). PR #2871 added fields to public/interop/iso-20022.json. That file has
a sibling iso-20022.json.ots whose detached digest is bfaafd05..., the sha256 of the bytes it had
before. Every PR check was green, because the only check that compares a proof with its target,
scripts/root-witness-release-gate.py, runs in deploy.yml after the merge. Production deploy run
37590160574 (master f4487608d) then failed closed at "Public root + witness integrity", and so did
every later master deploy: one stale proof held every merged fix off councilof.ai.

THE RULE, decided from two git revisions (the PR's base and head), never from the working tree:

  * A file is STAMPED at a revision when a proof commits to it there: either `<file>.ots` sits
    beside it, or public/interop/ots-exact-bindings-v1.json binds a proof to it (the same lookup
    order the release gate uses: an exact binding first, then the adjacent file).
  * If the PR changes the bytes of a stamped file, it must also replace that proof, and the new
    proof must be a parseable OpenTimestamps file whose sha256 digest is the sha256 of the new bytes.
  * Deleting a stamped file fails. Deleting a proof whose target stays fails. Replacing a proof with
    one that does not commit to its target's bytes fails, as does adding such a pair.
  * A pair that had ALREADY drifted at the base protects nothing, so it is judged on the head alone:
    restoring the bytes its proof commits to passes (that is how #2871 is repaired), editing it again
    without a matching proof fails, and removing the broken proof passes.

The estate convention is not to edit stamped bytes at all (#2865, #2868): write a new immutable dated
file, stamp it with scripts/badger/ots_stamp.py, and move an unsigned pointer. A re-stamp in the same
PR is accepted here because the bytes and the proof then agree, which is the property the deploy
gate enforces; whether to re-stamp or to version is a review decision, not this gate's.

    python3 scripts/stamped-bytes-gate.py --base <rev> [--head <rev>]   # PR mode
    python3 scripts/stamped-bytes-gate.py --audit [--rev <rev>]          # every stamped pair at one rev
    python3 scripts/stamped-bytes-gate.py --selftest                     # proves each failure goes red

Exit 0 = pass, 1 = a stamped file and its proof disagree, 2 = UNCHECKABLE (no OpenTimestamps parser,
unreadable revision). Needs `pip install opentimestamps-client`. Measurement, not certification:
this checks that a proof commits to bytes, not that a stamp is confirmed in Bitcoin.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import subprocess
import sys
import tempfile
from pathlib import Path

BINDINGS_PATH = "public/interop/ots-exact-bindings-v1.json"
BINDINGS_SCHEMA = "csoai.ots-exact-byte-bindings/0.1"


class Uncheckable(Exception):
    pass


def sha256(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


class Revision:
    """Read-only view of one git revision: path -> blob id, and blob bytes on demand."""

    def __init__(self, repo: Path, rev: str):
        self.repo = repo
        self.rev = rev
        try:
            out = subprocess.run(
                ["git", "-C", str(repo), "ls-tree", "-r", "-z", "--full-tree", rev],
                check=True, capture_output=True,
            ).stdout
        except subprocess.CalledProcessError as exc:
            raise Uncheckable(f"cannot read revision {rev!r}: {exc.stderr.decode(errors='replace').strip()}")
        self.blobs: dict[str, str] = {}
        for entry in out.split(b"\0"):
            if not entry:
                continue
            meta, path = entry.split(b"\t", 1)
            mode, kind, blob = meta.split(b" ")
            if kind == b"blob" and mode != b"120000":  # a symlink's "bytes" are a path, not content
                self.blobs[path.decode()] = blob.decode()
        self._cache: dict[str, bytes] = {}

    def read(self, path: str) -> bytes:
        blob = self.blobs[path]
        if blob not in self._cache:
            self._cache[blob] = subprocess.run(
                ["git", "-C", str(self.repo), "cat-file", "blob", blob], check=True, capture_output=True,
            ).stdout
        return self._cache[blob]


def stamped_pairs(rev: Revision) -> dict[str, str]:
    """proof path -> the path whose bytes it is meant to commit to, at this revision."""
    bindings: dict = {}
    if BINDINGS_PATH in rev.blobs:
        try:
            doc = json.loads(rev.read(BINDINGS_PATH))
            if isinstance(doc, dict) and doc.get("schema") == BINDINGS_SCHEMA and isinstance(doc.get("bindings"), dict):
                bindings = doc["bindings"]
        except ValueError:
            bindings = {}
    pairs: dict[str, str] = {}
    for path in rev.blobs:
        if not path.endswith(".ots"):
            continue
        row = bindings.get(path.removeprefix("public/")) if path.startswith("public/") else None
        if isinstance(row, dict) and isinstance(row.get("target"), str):
            pairs[path] = "public/" + row["target"]
        elif path[: -len(".ots")] in rev.blobs:
            pairs[path] = path[: -len(".ots")]
        # A proof with neither is bound (if at all) by a witness sidecar; the release gate owns that.
    return pairs


def proof_digest(raw: bytes) -> str:
    """The sha256 digest a detached OpenTimestamps proof commits to. Raises ValueError if it is not one."""
    try:
        from opentimestamps.core.op import OpSHA256
        from opentimestamps.core.serialize import BytesDeserializationContext
        from opentimestamps.core.timestamp import DetachedTimestampFile
    except Exception as exc:  # pragma: no cover - environment
        raise Uncheckable(f"OpenTimestamps parser unavailable ({type(exc).__name__}); pip install opentimestamps-client")
    try:
        detached = DetachedTimestampFile.deserialize(BytesDeserializationContext(raw))
    except Exception as exc:
        raise ValueError(f"not an OpenTimestamps proof ({type(exc).__name__})")
    if not isinstance(detached.file_hash_op, OpSHA256):
        raise ValueError(f"proof hashes with {detached.file_hash_op!r}, not sha256")
    return bytes(detached.timestamp.msg).hex()


def check_pair(rev: Revision, proof: str, target: str) -> str | None:
    """None when the proof at `rev` commits to the target's bytes at `rev`; otherwise the reason."""
    if target not in rev.blobs:
        return f"{proof}: its target {target} is missing"
    try:
        digest = proof_digest(rev.read(proof))
    except ValueError as exc:
        return f"{proof}: {exc}"
    actual = sha256(rev.read(target))
    if digest != actual:
        return f"{proof} proves {digest[:16]}..., but {target} hashes to {actual[:16]}..."
    return None


def run_diff(repo: Path, base_rev: str, head_rev: str) -> tuple[list[str], list[str]]:
    base, head = Revision(repo, base_rev), Revision(repo, head_rev)
    base_pairs, head_pairs = stamped_pairs(base), stamped_pairs(head)
    errors: list[str] = []
    checked: list[str] = []

    def changed(path: str) -> bool:
        return base.blobs.get(path) != head.blobs.get(path)

    touched = sorted(
        proof
        for proof in set(base_pairs) | set(head_pairs)
        if changed(proof)
        or (proof in base_pairs and changed(base_pairs[proof]))
        or (proof in head_pairs and changed(head_pairs[proof]))
        or base_pairs.get(proof) != head_pairs.get(proof)
    )
    for proof in touched:
        checked.append(proof)
        # Only a pair whose proof committed to its target's bytes at the base is stamped. A pair that
        # was already drifted there protects nothing: restoring the bytes its proof commits to, or
        # removing a proof that commits to nothing on the tree, repairs it, and the head state below
        # is all that is judged.
        base_valid = proof in base_pairs and check_pair(base, proof, base_pairs[proof]) is None
        if base_valid:
            target = base_pairs[proof]
            if target not in head.blobs:
                errors.append(
                    f"STAMPED FILE DELETED: {target} (stamped by {proof}). Stamped bytes are evidence; "
                    "withdraw them through a reviewed quarantine, not a lane PR."
                )
                continue
            if proof not in head.blobs:
                errors.append(f"PROOF DELETED: {proof} was removed while {target} remains.")
                continue
            if changed(target) and not changed(proof):
                old = proof_digest(base.read(proof))
                errors.append(
                    f"STAMPED BYTES CHANGED WITHOUT A NEW PROOF: {target} now hashes to "
                    f"{sha256(head.read(target))[:16]}..., but {proof} still proves {old[:16]}.... "
                    f"Restore the exact bytes (git checkout {base_rev} -- {target}) and put the new content in a "
                    "new dated file stamped with scripts/badger/ots_stamp.py (the #2865 recipe), or replace the "
                    "proof with a valid one for the new bytes in this PR."
                )
                continue
        if proof in head_pairs:
            reason = check_pair(head, proof, head_pairs[proof])
            if reason:
                errors.append(f"PROOF DOES NOT COMMIT TO ITS TARGET: {reason}")
        elif base_valid:
            errors.append(f"PROOF UNBOUND: {proof} committed to {base_pairs[proof]} and now names no target.")
    return checked, errors


def run_audit(repo: Path, rev_name: str) -> tuple[int, list[str]]:
    rev = Revision(repo, rev_name)
    pairs = stamped_pairs(rev)
    errors = [r for r in (check_pair(rev, p, t) for p, t in sorted(pairs.items())) if r]
    return len(pairs), errors


# --------------------------------------------------------------------------------------------- selftest

def _proof_for(data: bytes) -> bytes:
    from opentimestamps.core.notary import PendingAttestation
    from opentimestamps.core.op import OpSHA256
    from opentimestamps.core.serialize import BytesSerializationContext
    from opentimestamps.core.timestamp import DetachedTimestampFile, Timestamp

    stamp = Timestamp(hashlib.sha256(data).digest())
    stamp.attestations.add(PendingAttestation("https://selftest.invalid"))
    ctx = BytesSerializationContext()
    DetachedTimestampFile(OpSHA256(), stamp).serialize(ctx)
    return ctx.getbytes()


def run_selftest() -> int:
    proof_digest(_proof_for(b"x"))  # Uncheckable propagates if the parser is missing
    with tempfile.TemporaryDirectory() as tmp:
        repo = Path(tmp)

        def git(*args: str) -> str:
            return subprocess.run(["git", "-C", tmp, *args], check=True, capture_output=True, text=True).stdout.strip()

        def write(rel: str, data: bytes | None) -> None:
            path = repo / rel
            if data is None:
                path.unlink()
            else:
                path.parent.mkdir(parents=True, exist_ok=True)
                path.write_bytes(data)

        def commit(files: dict[str, bytes | None], parent: str) -> str:
            git("checkout", "-q", "--detach", parent)
            for rel, data in files.items():
                write(rel, data)
            git("add", "-A")
            git("commit", "-q", "--allow-empty", "-m", "case")
            return git("rev-parse", "HEAD")

        git("init", "-q")
        git("config", "user.email", "selftest@invalid")
        git("config", "user.name", "selftest")
        a, b, bound = b'{"a":1}', b'{"b":1}', b"retained bytes"
        write("public/interop/a.json", a)
        write("public/interop/a.json.ots", _proof_for(a))
        write("public/interop/b.json", b)
        write("public/interop/b.json.ots", _proof_for(b))
        write("public/interop/plain.json", b"{}")
        write("public/interop/proof-targets/x.body", bound)
        write("public/interop/x.json", b"drifted adjacent bytes")
        write("public/interop/x.json.ots", _proof_for(bound))
        write(BINDINGS_PATH, json.dumps({"schema": BINDINGS_SCHEMA, "bindings": {
            "interop/x.json.ots": {"target": "interop/proof-targets/x.body", "digest": sha256(bound)}}}).encode())
        write("public/interop/d.json", b"edited after stamping")
        write("public/interop/d.json.ots", _proof_for(b"stamped d"))
        write("evidence/e.json", b"e")
        write("evidence/e.json.ots", _proof_for(b"e"))
        git("add", "-A")
        git("commit", "-q", "-m", "base")
        base = git("rev-parse", "HEAD")

        a2 = b'{"a":2}'
        cases: list[tuple[str, dict[str, bytes | None], bool, str]] = [
            ("unstamped file changes", {"public/interop/plain.json": b'{"p":1}'}, True, ""),
            ("stamped bytes change, proof untouched (#2871)", {"public/interop/a.json": a2}, False, "WITHOUT A NEW PROOF"),
            ("stamped bytes change outside public/", {"evidence/e.json": b"e2"}, False, "WITHOUT A NEW PROOF"),
            ("stamped bytes change with a valid new proof", {"public/interop/a.json": a2, "public/interop/a.json.ots": _proof_for(a2)}, True, ""),
            ("stamped bytes change with a proof of other bytes", {"public/interop/a.json": a2, "public/interop/a.json.ots": _proof_for(b"other")}, False, "DOES NOT COMMIT"),
            ("stamped file deleted", {"public/interop/a.json": None}, False, "STAMPED FILE DELETED"),
            ("stamped file and proof both deleted", {"public/interop/a.json": None, "public/interop/a.json.ots": None}, False, "STAMPED FILE DELETED"),
            ("proof deleted, target kept", {"public/interop/a.json.ots": None}, False, "PROOF DELETED"),
            ("proof replaced by a text stub", {"public/interop/a.json.ots": b"=== OTS PENDING ==="}, False, "not an OpenTimestamps proof"),
            ("new pair with a valid proof", {"public/interop/n.json": b"n", "public/interop/n.json.ots": _proof_for(b"n")}, True, ""),
            ("new pair with a wrong proof", {"public/interop/w.json": b"w", "public/interop/w.json.ots": _proof_for(b"not w")}, False, "DOES NOT COMMIT"),
            ("exact-binding target changed", {"public/interop/proof-targets/x.body": b"edited"}, False, "WITHOUT A NEW PROOF"),
            ("adjacent bytes of an exact-bound proof change", {"public/interop/x.json": b"still not stamped by x.json.ots"}, True, ""),
            ("drifted pair: restore the bytes its proof commits to", {"public/interop/d.json": b"stamped d"}, True, ""),
            ("drifted pair: edited again without a matching proof", {"public/interop/d.json": b"edited twice"}, False, "DOES NOT COMMIT"),
            ("drifted pair: broken proof removed", {"public/interop/d.json.ots": None}, True, ""),
            ("binding removed so the proof falls back to drifted adjacent bytes", {BINDINGS_PATH: json.dumps({"schema": BINDINGS_SCHEMA, "bindings": {}}).encode()}, False, "DOES NOT COMMIT"),
        ]
        failures = 0
        for name, files, should_pass, needle in cases:
            head = commit(files, base)
            _, errors = run_diff(repo, base, head)
            ok = (not errors) if should_pass else (bool(errors) and any(needle in e for e in errors))
            print(f"  {'ok ' if ok else 'BAD'} {name}: {'pass' if not errors else errors[0][:110]}")
            failures += not ok

        n, audit_base = run_audit(repo, base)
        drifted = commit({"public/interop/b.json": b'{"b":2}'}, base)
        _, audit_drift = run_audit(repo, drifted)
        audit_ok = (
            n == 5
            and len(audit_base) == 1 and "d.json" in audit_base[0]
            and len(audit_drift) == 2 and any("b.json" in e for e in audit_drift)
        )
        print(f"  {'ok ' if audit_ok else 'BAD'} audit: names exactly the drifted pairs ({n} pairs at base)")
        failures += not audit_ok
    if failures:
        print(f"stamped-bytes-gate selftest: FAIL ({failures} case(s))", file=sys.stderr)
        return 1
    print(f"stamped-bytes-gate selftest: PASS ({len(cases) + 1} cases)")
    return 0


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    mode = parser.add_mutually_exclusive_group(required=True)
    mode.add_argument("--base", help="PR mode: the revision the PR merges into")
    mode.add_argument("--audit", action="store_true", help="check every stamped pair at --rev")
    mode.add_argument("--selftest", action="store_true")
    parser.add_argument("--head", default="HEAD")
    parser.add_argument("--rev", default="HEAD")
    parser.add_argument("--repo", type=Path, default=Path(__file__).resolve().parents[1])
    args = parser.parse_args()
    try:
        if args.selftest:
            return run_selftest()
        if args.audit:
            n, errors = run_audit(args.repo, args.rev)
            for e in errors:
                print(f"- DRIFTED: {e}", file=sys.stderr)
            verdict = f"FAIL ({len(errors)} of {n} stamped pairs drifted)" if errors else f"PASS ({n} stamped pairs)"
            print(f"stamped-bytes-gate audit @ {args.rev}: {verdict}")
            return 1 if errors else 0
        checked, errors = run_diff(args.repo, args.base, args.head)
    except Uncheckable as exc:
        print(f"stamped-bytes-gate: UNCHECKABLE - {exc}", file=sys.stderr)
        return 2
    for proof in checked:
        print(f"  touched stamped pair: {proof}")
    for e in errors:
        print(f"- {e}", file=sys.stderr)
    verdict = f"FAIL ({len(errors)} issue(s))" if errors else "PASS"
    print(f"stamped-bytes-gate {args.base[:12]}..{args.head[:12]}: {verdict} ({len(checked)} stamped pair(s) touched)")
    return 1 if errors else 0


if __name__ == "__main__":
    sys.exit(main())
