#!/usr/bin/env python3
"""Fold existing unsigned AUTO-EAT atoms into the existing signer inputs.

No network, signing, measurement, training or authority is performed here.
The entire input batch is validated before any output replacement. --check
compares both the ledger payload and the complete unsigned destination atom.
An unreadable source is not an empty source. A confirmed {} is a valid no-op.

A source with no staged atom and an existing bare ledger key is ledger-direct:
that row belongs to another writer. It is counted as delegated/unverified and
never folded; payload differences are reported, not silently called matches.
Legacy atoms missing signature/state metadata are preserved without rewriting
only when source, existing destination and ledger payload already agree. They
are not relabelled unsigned, authenticated, measured or newly folded.

File replacements are atomic individually; this is not a multi-file database
transaction. An I/O failure is nonzero and may require a check/rerun. Writers
must still honour the repository's single-writer ownership convention.
"""
from __future__ import annotations

import argparse
import json
import math
import os
import re
import stat
import sys
import tempfile
from pathlib import Path

import common as c

MAX_COMPACT_BYTES = 8 * 1024 * 1024
MAX_LEDGER_BYTES = 64 * 1024 * 1024
MAX_ATOM_BYTES = 64 * 1024
MAX_STAGED_ATOMS = 4096
SURFACE = re.compile(r"autoeat\.[A-Za-z0-9_-]+(?:[./][A-Za-z0-9_-]+)*\Z")
SCHEMA = "https://councilof.ai/schema/card-v0.json"
# Two pre-existing dated source identities: preserved only, never rebound.
LEGACY_ALIASES = {
    "autoeat.a2a.mining.summary": "a2a.mining.summary.2026.09.16",
    "autoeat.hf.mining.summary": "hf.mining.summary.2026.09.16",
}


class FoldError(ValueError):
    """An invalid/incomplete input must not be reported as a successful fold."""


def slug(surface: str) -> str:
    return c.slug(surface)


def canonical(value) -> bytes:
    return json.dumps(value, sort_keys=True, separators=(",", ":"),
                      ensure_ascii=False, allow_nan=False).encode("utf-8")


def _pairs(items):
    result = {}
    for key, value in items:
        if key in result:
            raise FoldError("duplicate JSON key")
        result[key] = value
    return result


def _finite_float(text):
    value = float(text)
    if not math.isfinite(value):
        raise FoldError("nonfinite JSON number")
    return value


def _reject_constant(_):
    raise FoldError("nonfinite JSON constant")


def _read(path: Path, limit: int, snapshots: dict, *, optional=False):
    """Bound regular-file bytes and remember the exact read for pre-write checks."""
    try:
        info = path.lstat()
    except FileNotFoundError:
        if optional:
            snapshots[path] = None
            return None
        raise FoldError(f"missing required file: {path.name}")
    if not stat.S_ISREG(info.st_mode):
        raise FoldError(f"not a regular file: {path.name}")
    if info.st_size > limit:
        raise FoldError(f"file exceeds byte limit: {path.name}")
    with path.open("rb") as stream:
        raw = stream.read(limit + 1)
    if len(raw) > limit:
        raise FoldError(f"file exceeds byte limit: {path.name}")
    snapshots[path] = raw
    try:
        value = json.loads(raw.decode("utf-8", errors="strict"),
                           object_pairs_hook=_pairs,
                           parse_constant=_reject_constant,
                           parse_float=_finite_float)
    except (ValueError, UnicodeError, RecursionError) as exc:
        raise FoldError(f"invalid JSON in {path.name}: {exc}") from exc
    if not isinstance(value, dict):
        raise FoldError(f"expected JSON object: {path.name}")
    return value


def _validate_identity(atom: dict, surface: str, payload: dict, name: str):
    incomplete = "sig_ed25519" not in atom or "state" not in atom
    identity_matches = atom.get("surface") == surface or (
        incomplete and surface in LEGACY_ALIASES
        and atom.get("surface") == LEGACY_ALIASES[surface])
    if atom.get("schema") != SCHEMA or not identity_matches:
        raise FoldError(f"atom identity differs: {name}")
    if not isinstance(atom.get("payload"), dict) or canonical(atom["payload"]) != canonical(payload):
        raise FoldError(f"staged payload differs from compact: {name}")
    flags = payload.get("flags")
    if isinstance(flags, dict) and flags.get("auto_measured", False) is not False:
        raise FoldError(f"auto_measured is not false: {name}")


def _validate_atom(atom: dict, surface: str, payload: dict, name: str):
    _validate_identity(atom, surface, payload, name)
    if "sig_ed25519" not in atom or atom["sig_ed25519"] is not None:
        raise FoldError(f"atom is not explicitly unsigned: {name}")
    if atom.get("state") != "queued":
        raise FoldError(f"atom is not queued: {name}")


def _stable(snapshots: dict) -> None:
    for path, expected in snapshots.items():
        try:
            info = path.lstat()
        except FileNotFoundError:
            if expected is None:
                continue
            raise FoldError(f"input disappeared before write: {path.name}")
        if expected is None or not stat.S_ISREG(info.st_mode):
            raise FoldError(f"input changed before write: {path.name}")
        with path.open("rb") as stream:
            actual = stream.read(len(expected) + 1)
        if actual != expected:
            raise FoldError(f"input changed before write: {path.name}")


def _atomic_write(path: Path, data: bytes):
    """Replace one file without exposing truncated bytes; retain its normal mode."""
    mode = stat.S_IMODE(path.stat().st_mode) if path.exists() else 0o644
    fd, temporary = tempfile.mkstemp(prefix=".eat-fold-", dir=path.parent)
    try:
        with os.fdopen(fd, "wb") as stream:
            os.fchmod(stream.fileno(), mode)
            stream.write(data)
            stream.flush()
            os.fsync(stream.fileno())
        os.replace(temporary, path)
    finally:
        try:
            os.unlink(temporary)
        except FileNotFoundError:
            pass


def fold(check: bool = False) -> int:
    snapshots = {}
    for directory in (c.INTEROP, c.FEED):
        if directory.is_symlink() or not directory.is_dir():
            raise FoldError(f"required directory missing or symlinked: {directory.name}")
    compact = _read(c.COMPACT, MAX_COMPACT_BYTES, snapshots)
    if not compact:
        print("fold: confirmed empty compact object; no staged inputs, no writes")
        return 0
    ledger = _read(c.LEDGER_COMPACT, MAX_LEDGER_BYTES, snapshots, optional=True)
    if ledger is None:
        ledger = {}
    atoms = {}
    staged_paths = sorted(c.FEED.glob("card-*-unsigned.json"))
    if len(staged_paths) > MAX_STAGED_ATOMS:
        raise FoldError("too many staged atoms")
    for path in staged_paths:
        atoms[path] = _read(path, MAX_ATOM_BYTES, snapshots)
    planned = []
    destinations = set()
    delegated = 0
    delegated_payload_differences = 0
    preserved_legacy = 0
    for surface, payload in compact.items():
        if not surface.startswith("autoeat."):
            print(f"fold: SKIP non-autoeat surface {surface}")
            continue
        # Establish which writer owns this row before applying file-write rules.
        # An unowned bare-key mirror is never given an atom by this bridge.
        if not isinstance(payload, dict):
            raise FoldError(f"invalid payload: {surface}")
        safe_surface = SURFACE.fullmatch(surface) is not None
        source = c.FEED / f"card-{slug(surface)}-unsigned.json" if safe_surface else None
        atom = atoms.get(source)
        if atom is None:
            matches = [(p, a) for p, a in atoms.items()
                       if a.get("surface") in (surface, LEGACY_ALIASES.get(surface))
                       and isinstance(a.get("payload"), dict)
                       and canonical(a["payload"]) == canonical(payload)]
            if len(matches) > 1:
                raise FoldError(f"ambiguous staged atoms: {surface}")
            if matches:
                source, atom = matches[0]
            else:
                bare = surface[len("autoeat."):]
                if bare in ledger:
                    delegated += 1
                    delegated_payload_differences += canonical(ledger[bare]) != canonical(payload)
                    continue
                raise FoldError(f"missing matching staged atom: {surface}")
        if not safe_surface:
            raise FoldError(f"invalid staged surface: {surface}")
        if len(canonical(payload)) > c.MAX_PAYLOAD_BYTES:
            raise FoldError(f"payload exceeds {c.MAX_PAYLOAD_BYTES} bytes: {surface}")
        destination = c.INTEROP / f"ledger-card-{slug(surface)}-unsigned.json"
        if destination in destinations:
            raise FoldError(f"surface filename collision: {surface}")
        destinations.add(destination)
        _validate_identity(atom, surface, payload, source.name)
        existing = _read(destination, MAX_ATOM_BYTES, snapshots, optional=True)
        atom_matches = existing is not None and canonical(existing) == canonical(atom)
        ledger_matches = surface in ledger and canonical(ledger[surface]) == canonical(payload)
        incomplete_envelope = "sig_ed25519" not in atom or "state" not in atom
        if incomplete_envelope:
            # Historical absence is NOT a valid signature or an unsigned assertion.
            # Preserve only an already-consistent triple, and never rewrite it.
            if atom.get("sig_ed25519") is not None or atom.get("state", "queued") != "queued":
                raise FoldError(f"legacy atom carries unsupported signature/state: {source.name}")
            if not atom_matches or not ledger_matches:
                raise FoldError(f"legacy atom requires owner migration, not an implicit fold: {source.name}")
            preserved_legacy += 1
            print(f"fold: PRESERVED_LEGACY {surface}; metadata incomplete, no writes or authority claim")
            continue
        _validate_atom(atom, surface, payload, source.name)
        if existing is not None:
            # Do not overwrite signed/nonqueued evidence, even on an explicit fold.
            if "sig_ed25519" not in existing or existing["sig_ed25519"] is not None or existing.get("state") != "queued":
                raise FoldError(f"destination is not unsigned queued evidence: {destination.name}")
            if existing.get("schema") != SCHEMA or existing.get("surface") != surface:
                raise FoldError(f"destination identity differs: {destination.name}")
        atom_matches = existing is not None and canonical(existing) == canonical(atom)
        ledger_matches = surface in ledger and canonical(ledger[surface]) == canonical(payload)
        planned.append((surface, payload, destination, atom, atom_matches, ledger_matches))
    if delegated:
        print(f"fold: DELEGATED_UNVERIFIED {delegated} ledger-direct rows; "
              f"payload_differences={delegated_payload_differences}; other writer owns them, no writes")
    drift = sum(not a or not l for _, _, _, _, a, l in planned)
    if check:
        for surface, _, _, _, a, l in planned:
            if not a or not l:
                print(f"fold: DRIFT {surface}; ledger_match={l} atom_match={a}")
        print(f"fold --check: checked={len(planned) + preserved_legacy} preserved_legacy={preserved_legacy} delegated={delegated} drift={drift}")
        return 1 if drift else 0
    # Batch validation above is complete: invalid input cannot cause partial writes.
    if not drift:
        print(f"fold: unchanged={len(planned) + preserved_legacy} preserved_legacy={preserved_legacy} delegated={delegated}; no writes")
        return 0
    lock = c.INTEROP / ".auto-eat-fold.lock"
    try:
        descriptor = os.open(lock, os.O_CREAT | os.O_EXCL | os.O_WRONLY, 0o600)
    except FileExistsError as exc:
        raise FoldError("another fold or retained lock exists; no automatic lock removal") from exc
    try:
        os.close(descriptor)
        _stable(snapshots)
        ledger_changed = False
        for surface, payload, destination, atom, atom_matches, ledger_matches in planned:
            if not atom_matches:
                _atomic_write(destination, (json.dumps(atom, indent=1, ensure_ascii=False) + "\n").encode("utf-8"))
            if not ledger_matches:
                ledger[surface] = payload
                ledger_changed = True
        if ledger_changed:
            # Preserve the existing ledger writer's formatting and unrelated rows.
            _atomic_write(c.LEDGER_COMPACT, json.dumps(ledger, indent=2).encode("utf-8"))
    finally:
        lock.unlink()
    print(f"fold: folded={drift} checked={len(planned) + preserved_legacy} preserved_legacy={preserved_legacy} delegated={delegated}; new writes unsigned only")
    return 0


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--check", action="store_true", help="validate and compare; write nothing")
    args = parser.parse_args()
    try:
        return fold(check=args.check)
    except (FoldError, OSError, ValueError, RecursionError) as exc:
        print(f"fold: HALT {exc}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
