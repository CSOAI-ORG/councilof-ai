"""Compact public-root leaf for the Art 50 generator content-marking census.

Pure file reader of public/interop/art50-census-2026-09/census.json. No network.
Never raises: a missing file yields an ABSENT sidecar, a malformed file an INVALID
one, and in both cases zero leaves. Facts, not grades: stated vs detectable stay
separate and UNMEASURED is a first-class value, never zero-filled.
"""
from __future__ import annotations

import hashlib
import json
import re
from pathlib import Path
from typing import Any

REL = Path("public/interop/art50-census-2026-09/census.json")
ENDPOINT = "/interop/art50-census-2026-09/endpoint.json"
RELEASE_ID = "art50-census-2026-09"
PAYLOAD_CAP = 3072

MARKING_KEYS = (
    "c2pa_manifest",
    "iptc_or_metadata_marking",
    "invisible_watermark",
    "visible_or_disclosure_marking",
)
SHA256_RE = re.compile(r"^[0-9a-f]{64}$")
SLOT_LABELS = ("C2PA", "meta", "wm", "vis")


def _slot(entry: dict[str, Any]) -> str:
    """One slot glyph: + detected, x detected-not, ? stated but unprobed, - no data."""
    if not isinstance(entry, dict):
        return "—"
    detectable = entry.get("detectable")
    if detectable is True:
        return "✓"
    if detectable is False:
        return "✗"
    if entry.get("stated") is True:
        return "?"
    return "—"


def _stack(marking: dict[str, Any]) -> str:
    return "/".join(
        f"{label}{_slot(marking.get(key))}" if isinstance(marking, dict) else f"{label}—"
        for label, key in zip(SLOT_LABELS, MARKING_KEYS)
    )


def _canonical(obj: Any) -> bytes:
    return json.dumps(obj, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode("utf-8")


def collect(repo_root: Path) -> dict[str, Any]:
    try:
        path = Path(repo_root) / REL
        if not path.is_file():
            return {"leaves": [], "sidecar": {"status": "ABSENT", "path": str(REL)}}
        census = json.loads(path.read_bytes())
        generators = census.get("generators")
        if not str(census.get("schema", "")).startswith("csoai.art50-marking-census/") or not isinstance(generators, list):
            return {"leaves": [], "sidecar": {"status": "INVALID", "reason": "census contract"}}

        compact = []
        gated = []
        for gen in generators:
            if not isinstance(gen, dict) or not isinstance(gen.get("name"), str):
                return {"leaves": [], "sidecar": {"status": "INVALID", "reason": "generator contract"}}
            marking = gen.get("marking")
            source_version = gen.get("source_version")
            if source_version is not None:
                if not isinstance(source_version, dict):
                    return {"leaves": [], "sidecar": {"status": "INVALID", "reason": "source_version contract"}}
                rel = source_version.get("posture_card")
                digest = source_version.get("sha256")
                if not isinstance(rel, str) or not isinstance(digest, str) or not SHA256_RE.fullmatch(digest):
                    return {"leaves": [], "sidecar": {"status": "INVALID", "reason": "source_version digest contract"}}
                versioned_path = Path(repo_root) / rel
                if not versioned_path.is_file() or hashlib.sha256(versioned_path.read_bytes()).hexdigest() != digest:
                    return {"leaves": [], "sidecar": {"status": "INVALID", "reason": "source_version digest mismatch"}}
            compact.append({"name": gen["name"], "stack": _stack(marking if isinstance(marking, dict) else {})})
            if gen.get("gate"):
                gated.append(gen["name"])

        payload = {
            "kind": "csoai.art50-marking-census/0.1",
            "status": "PROBED",
            "release_id": RELEASE_ID,
            "generated_at": census.get("generated_at"),
            "n_generators": len(generators),
            "per_generator_compact": compact,
            "midjourney_gate": any(g.lower() == "midjourney" for g in gated),
            "endpoint": ENDPOINT,
            "unmeasured": [
                "all detector runs: no sample probes executed in this release",
                "owner-gated sample generation: " + ",".join(gated) if gated else "owner-gated sample generation: none",
            ],
        }
        size = len(_canonical(payload))
        if size > PAYLOAD_CAP:
            return {"leaves": [], "sidecar": {"status": "INVALID", "reason": "payload cap", "bytes": size}}

        leaf = {
            "surface": "public.notice",
            "subject": "Art 50 generator content-marking census",
            "as_of": census.get("generated_at"),
            "source_urls": ["https://councilof.ai" + ENDPOINT],
            "payload": payload,
            "unmeasured": payload["unmeasured"],
            "tags": ["public-notice", "art50", "marking-census"],
        }
        return {
            "leaves": [leaf],
            "sidecar": {"status": "PROBED", "n_generators": len(generators), "payload_bytes": size},
        }
    except Exception as exc:  # never raise into the publisher
        return {"leaves": [], "sidecar": {"status": "INVALID", "reason": type(exc).__name__}}
