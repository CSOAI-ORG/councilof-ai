#!/usr/bin/env python3
"""Build the Art 50 target index with source-time semantics.

The provider-diff feed is the source. ``as_of`` and ``source_as_of`` therefore
come from that feed, while ``derived_at`` records when this projection was
built. A derivation-time-only change never rewrites the output.
"""

from __future__ import annotations

import argparse
import json
import tempfile
import urllib.request
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

DEFAULT_SOURCE = "https://councilof.ai/api/feeds/provider-diff"


def utcnow() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def source_as_of(feed: dict[str, Any]) -> str:
    value = feed.get("as_of") or (feed.get("last_run") or {}).get("run_at")
    if not isinstance(value, str) or not value.strip():
        raise ValueError("provider-diff feed has no as_of or last_run.run_at")
    return value.strip()


def build_index(feed: dict[str, Any], *, derived_at: str) -> dict[str, Any]:
    targets = feed.get("targets") or []
    if not isinstance(targets, list):
        raise ValueError("provider-diff targets must be a list")
    art = sorted(
        [
            target
            for target in targets
            if "art50" in str(target.get("id") or "").lower()
            or "marking" in str(target.get("surface") or "").lower()
        ],
        key=lambda target: str(target.get("id") or ""),
    )
    observed_at = source_as_of(feed)
    return {
        "schema": "csoai.art50-target-index/0.1",
        # Backward-compatible field; it now truthfully means source observation time.
        "as_of": observed_at,
        "source_as_of": observed_at,
        "derived_at": derived_at,
        "source": f"{DEFAULT_SOURCE} (derived)",
        "n_targets": feed.get("n_targets"),
        "n_ok": sum(1 for target in targets if target.get("state") == "OK"),
        "n_uncheckable": sum(
            1 for target in targets if target.get("state") == "UNCHECKABLE"
        ),
        "art50_marking_targets": [
            {
                "id": target.get("id"),
                "provider": target.get("provider_name"),
                "url": target.get("url"),
                "state": target.get("state"),
                "norm_sha256": str(target.get("norm_sha256") or "")[:16],
            }
            for target in art
        ],
        "principle": (
            "Derived inputs for the Art 50 marking-evidence door (402 per doctor). "
            "Reachability + hashes only; no detection claim."
        ),
    }


def substantive(payload: dict[str, Any]) -> dict[str, Any]:
    """Remove local derivation time before comparing two projections."""
    return {key: value for key, value in payload.items() if key != "derived_at"}


def write_if_changed(path: Path, candidate: dict[str, Any]) -> bool:
    existing: dict[str, Any] | None = None
    if path.exists():
        loaded = json.loads(path.read_text(encoding="utf-8"))
        if isinstance(loaded, dict):
            existing = loaded
    if existing is not None and substantive(existing) == substantive(candidate):
        return False
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(candidate, indent=2) + "\n", encoding="utf-8")
    return True


def fetch_feed(url: str) -> dict[str, Any]:
    request = urllib.request.Request(url, headers={"User-Agent": "CSOAI-regen/0.2"})
    with urllib.request.urlopen(request, timeout=30) as response:
        payload = json.loads(response.read())
    if not isinstance(payload, dict):
        raise ValueError("provider-diff response must be a JSON object")
    return payload


def selftest() -> None:
    feed = {
        "as_of": "2026-09-05T09:06:18Z",
        "last_run": {"run_at": "2026-09-05T09:00:00Z"},
        "n_targets": 2,
        "targets": [
            {
                "id": "example/art50_marking",
                "provider_name": "Example",
                "surface": "art50_marking",
                "url": "https://example.test/marking",
                "state": "OK",
                "norm_sha256": "a" * 64,
            },
            {"id": "example/terms", "state": "UNCHECKABLE"},
        ],
    }
    first = build_index(feed, derived_at="2026-09-12T10:00:00Z")
    assert first["as_of"] == feed["as_of"]
    assert first["source_as_of"] == feed["as_of"]
    assert first["derived_at"] != first["source_as_of"]
    assert first["n_ok"] == 1 and first["n_uncheckable"] == 1
    with tempfile.TemporaryDirectory() as tmp:
        path = Path(tmp) / "index.json"
        assert write_if_changed(path, first)
        before = path.read_bytes()
        second = build_index(feed, derived_at="2026-09-12T11:00:00Z")
        assert not write_if_changed(path, second)
        assert path.read_bytes() == before
        feed["as_of"] = "2026-09-05T10:06:18Z"
        third = build_index(feed, derived_at="2026-09-12T12:00:00Z")
        assert write_if_changed(path, third)
    try:
        source_as_of({})
    except ValueError:
        pass
    else:
        raise AssertionError("missing source time did not fail closed")


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--source", default=DEFAULT_SOURCE)
    parser.add_argument(
        "--output", type=Path, default=Path("public/interop/art50-target-index.json")
    )
    parser.add_argument("--selftest", action="store_true")
    args = parser.parse_args()
    if args.selftest:
        selftest()
        print("art50 target index selftest: ok")
        return 0
    candidate = build_index(fetch_feed(args.source), derived_at=utcnow())
    changed = write_if_changed(args.output, candidate)
    print(
        "changed=",
        int(changed),
        "source_as_of=",
        candidate["source_as_of"],
        "art50_targets=",
        len(candidate["art50_marking_targets"]),
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
