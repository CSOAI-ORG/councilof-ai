#!/usr/bin/env python3
"""CSOAI Catapult — manifest builder.

Builds the catapult manifest for one fan-out run. The manifest records
source_sha256, signed_at, signer_did, targets_attempted=N, targets_published=M
(M <= N always), the NAMED difference between them, readback_required flags
per target, and failure_mode='ALL_OR_NOTHING'.

Measurement doctrine: a count without its denominator is a defect, so the
manifest carries both raw counts and an explicit M/N ratio string. The
difference between N and M is NAMED (surface names in `targets_not_published`),
never zero-filled with anonymous placeholders.

present-and-null is treated explicitly: a present-null field is recorded as
"explicit-null", which is NOT the same as an absent field ("not-recorded").

This module never signs anything. The only key allowed to write a catapult
manifest entry is the board signer did:web:csoai.org#board-attestation-1;
the harvest-stage key is never accepted (enforced by the engine gate).
"""

import hashlib
import json

FAILURE_MODE = "ALL_OR_NOTHING"

MISSING = object()


def field(obj, key, missing="not-recorded", null="explicit-null"):
    """Read a scalar with present-null treated explicitly, never as a default."""
    if not isinstance(obj, dict) or key not in obj:
        return missing
    value = obj[key]
    return null if value is None else value


def build_manifest(evidence, target_entries, attempted_names=None):
    """Build the catapult manifest dict.

    target_entries: per-target dicts with at least surface_name,
    readback_required, byte_size, record_sha256, published (bool) and
    not_published_reason (str or None).
    attempted_names: the full named target list (defaults to the entry names).
    """
    entries = list(target_entries)
    if attempted_names is None:
        attempted_names = [entry["surface_name"] for entry in entries]
    published_entries = [entry for entry in entries if entry.get("published")]
    published_names = {entry["surface_name"] for entry in published_entries}
    not_published = [name for name in attempted_names if name not in published_names]

    if len(published_entries) > len(attempted_names):
        raise ValueError(
            "manifest_refused: targets_published %d exceeds targets_attempted %d"
            % (len(published_entries), len(attempted_names))
        )

    manifest = {
        "manifest_version": "catapult-manifest-v0",
        "source_sha256": field(evidence, "sha256"),
        "signed_at": field(evidence, "as_of"),
        "signer_did": field(evidence, "signed_by"),
        "targets_attempted": len(attempted_names),
        "targets_published": len(published_entries),
        "targets_published_of_attempted": "%d/%d" % (len(published_entries), len(attempted_names)),
        "targets_not_published": not_published,
        "targets_not_published_rule": "The difference (attempted - published) is NAMED by surface, never zero-filled.",
        "readback_required": {
            entry["surface_name"]: bool(entry.get("readback_required")) for entry in entries
        },
        "failure_mode": FAILURE_MODE,
        "counts_rule": "Every rate carries its denominator: targets_published_of_attempted is M/N with N the named 17-surface list.",
        "partial_publish_rule": (
            "A manifest with a non-empty targets_not_published is a counter record only "
            "and MUST NOT be published as a fan-out; the catapult never publishes partial outputs."
        ),
        "targets": [
            {
                "surface_name": entry["surface_name"],
                "target_path": entry.get("target_path"),
                "content_type": entry.get("content_type"),
                "byte_size": entry.get("byte_size"),
                "record_sha256": entry.get("record_sha256"),
                "readback_required": bool(entry.get("readback_required")),
                "published": bool(entry.get("published")),
                "not_published_reason": entry.get("not_published_reason"),
            }
            for entry in entries
        ],
    }
    return manifest


def manifest_bytes(manifest):
    return (json.dumps(manifest, indent=2, sort_keys=True) + "\n").encode("utf-8")


def main(argv=None):
    """CLI: build a manifest from an evidence JSON + a render-index JSON."""
    import argparse

    parser = argparse.ArgumentParser(description="Build the catapult manifest.")
    parser.add_argument("evidence", help="path to the evidence object JSON")
    parser.add_argument("index", help="path to the render-index JSON (targets list)")
    parser.add_argument("-o", "--out", default="catapult-manifest.json", help="manifest output path")
    args = parser.parse_args(argv)

    with open(args.evidence, "rb") as handle:
        evidence = json.load(handle)
    with open(args.index, "rb") as handle:
        index = json.load(handle)

    entries = index.get("targets")
    if not isinstance(entries, list) or not entries:
        print("manifest_refused: render index has no targets list")
        return 2

    attempted_names = [entry["surface_name"] for entry in entries]
    for entry in entries:
        entry.setdefault("published", True)
        entry.setdefault("not_published_reason", None)
        entry.setdefault("readback_required", False)

    try:
        manifest = build_manifest(evidence, entries, attempted_names)
    except ValueError as exc:
        print(str(exc))
        return 2

    data = manifest_bytes(manifest)
    with open(args.out, "wb") as handle:
        handle.write(data)

    with open(args.out, "rb") as handle:
        readback = handle.read()
    if len(readback) != len(data) or hashlib.sha256(readback).hexdigest() != hashlib.sha256(data).hexdigest():
        print("manifest_refused: local readback mismatch for %s" % args.out)
        return 3

    print(
        "manifest written: %s — targets_published %s (failure_mode=%s)"
        % (args.out, manifest["targets_published_of_attempted"], manifest["failure_mode"])
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
