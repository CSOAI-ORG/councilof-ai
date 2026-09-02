#!/usr/bin/env python3
"""scrapi-ccf harness consumer — pin-verify pinned-vectors.json → unsigned eval.delta.

Verifies pinned digest shapes (and optionally fetches URLs to re-hash).
Emits unsigned eval.delta. Asserts no scitt-keys paths are introduced.
No keys. Never wrangler. Never certify. CSOAI is not a TS.
Never edits /api/gspc.

Harness (M4): ~/.grokbot/harness/run.sh measure — see HARNESS.md.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import re
import sys
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

_HERE = Path(__file__).resolve().parent
if str(_HERE) not in sys.path:
    sys.path.insert(0, str(_HERE))
from _card_canon import unsigned_card, write_card  # noqa: E402

HEX64 = re.compile(r"^[0-9a-f]{64}$")
FORBIDDEN_SCITT_KEYS = (
    "public/.well-known/scitt-keys",
    "public/.well-known/scitt-keys.json",
    ".well-known/scitt-keys",
)


def repo_root() -> Path:
    return Path(__file__).resolve().parents[2]


def assert_no_scitt_keys(root: Path) -> None:
    hits = []
    for rel in FORBIDDEN_SCITT_KEYS:
        p = root / rel
        if p.exists():
            hits.append(str(rel))
    # also scan public/ for accidental scitt-keys filename
    pub = root / "public"
    if pub.is_dir():
        for p in pub.rglob("*scitt-keys*"):
            hits.append(str(p.relative_to(root)))
    if hits:
        raise SystemExit(
            "FAIL: scitt-keys must stay absent (CSOAI is not a TS): " + ", ".join(hits)
        )


def collect_digests(pins: dict) -> list[tuple[str, str, str | None]]:
    """Return list of (id, sha256, url|None)."""
    out: list[tuple[str, str, str | None]] = []
    for group_name, group in (pins.get("pins") or {}).items():
        for vec in group.get("vectors") or []:
            vid = vec.get("id") or group_name
            if vec.get("sha256"):
                out.append((vid, vec["sha256"].lower(), vec.get("url")))
            files = vec.get("files") or {}
            base_url = vec.get("url")
            for fname, digest in files.items():
                file_url = None
                if isinstance(base_url, str) and base_url.startswith("https://github.com/") and "/tree/" in base_url:
                    # cannot raw-fetch a tree URL; leave None unless sha256sums_source exists
                    file_url = None
                out.append((f"{vid}/{fname}", digest.lower(), file_url))
    return out


def verify_digest_shapes(entries: list[tuple[str, str, str | None]]) -> None:
    bad = [eid for eid, d, _ in entries if not HEX64.match(d)]
    if bad:
        raise SystemExit(f"FAIL: non-sha256 digests: {bad}")
    if not entries:
        raise SystemExit("FAIL: no digests found in pinned-vectors.json")


def fetch_verify(entries: list[tuple[str, str, str | None]], timeout: float = 30.0) -> dict:
    results = {"checked": 0, "ok": [], "skipped": [], "mismatch": []}
    for eid, want, url in entries:
        if not url or not url.startswith("https://raw.githubusercontent.com/"):
            results["skipped"].append(eid)
            continue
        try:
            with urllib.request.urlopen(url, timeout=timeout) as resp:
                body = resp.read()
        except Exception as exc:  # noqa: BLE001 — report and continue
            results["skipped"].append(f"{eid}:fetch_error:{exc}")
            continue
        got = hashlib.sha256(body).hexdigest()
        results["checked"] += 1
        if got != want:
            results["mismatch"].append({"id": eid, "want": want, "got": got})
        else:
            results["ok"].append(eid)
    if results["mismatch"]:
        raise SystemExit(f"FAIL: digest mismatch: {results['mismatch']}")
    return results


def build_card(pins: dict, verify_meta: dict, as_of: str) -> dict:
    entries = collect_digests(pins)
    compact_pins = []
    for eid, digest, url in entries:
        row = {"id": eid, "sha256": digest}
        if url:
            row["url"] = url
        compact_pins.append(row)
    # keep payload under 3KB — digest table only + honesty
    payload = {
        "profile": "scrapi-ccf-public-fixtures",
        "role": "consumer_of_fixtures_only",
        "csoai_is_transparency_service": False,
        "scitt_keys": "absent_by_design",
        "data_hash_binding_check": pins.get("data_hash_binding_check")
        or "proof.leaf.data-hash == HASH(candidate)",
        "pinned_digest_count": len(entries),
        "pinned_digests": compact_pins[:12],  # cap rows for 3KB
        "source_commits": pins.get("source_commits") or {},
        "pin_verify": {
            "shape_ok": True,
            "fetch": verify_meta,
        },
        "board_axis_fill": False,
        "never_certify": True,
        "status": "UNSIGNED_PIN_VERIFY",
    }
    sources = [
        "https://github.com/microsoft/scitt-ccf-ledger",
        "https://github.com/action-state-group/scitt-cose",
        "https://datatracker.ietf.org/doc/draft-ietf-scitt-scrapi/",
        "https://councilof.ai/.well-known/scitt.json",
    ]
    return unsigned_card(
        surface="eval.delta",
        subject="scrapi-ccf pin-verify → unsigned eval.delta",
        as_of=as_of,
        source_urls=sources,
        payload=payload,
        unmeasured=[
            "csoai-not-a-ts",
            "no-live-scitt-keys",
            "live_receipt_reverify",
            "n>=30",
            "4way",
            "keystone",
            "gspc_axis_projection_forbidden",
        ],
        tags=["scrapi-ccf", "eval.delta", "unsigned", "fixtures-consumer", "not-a-ts", "harness-consumer"],
    )


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--repo-root", type=Path, default=None)
    ap.add_argument("--out", type=Path, default=None)
    ap.add_argument("--fetch", action="store_true", help="Fetch raw.githubusercontent.com pins and re-hash")
    ap.add_argument("--stdout", action="store_true")
    args = ap.parse_args()
    root = args.repo_root or repo_root()
    assert_no_scitt_keys(root)
    pin_path = root / "public" / "interop" / "scrapi-ccf" / "pinned-vectors.json"
    pins = json.loads(pin_path.read_text(encoding="utf-8"))
    entries = collect_digests(pins)
    verify_digest_shapes(entries)
    verify_meta: dict
    if args.fetch:
        verify_meta = fetch_verify(entries)
        verify_meta["mode"] = "fetch"
    else:
        verify_meta = {
            "mode": "shape_only",
            "digest_count": len(entries),
            "note": "Pass --fetch to re-hash raw.githubusercontent.com pins",
        }
    as_of = datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")
    card = build_card(pins, verify_meta, as_of)
    assert card["sig_ed25519"] is None
    # re-assert after emit (no accidental scitt-keys write)
    assert_no_scitt_keys(root)
    out = args.out or (root / "public" / "interop" / "scrapi-ccf" / "card-unsigned.consumer.json")
    if args.stdout:
        print(json.dumps(card, indent=2, ensure_ascii=False))
    else:
        write_card(out, card)
        print(
            f"wrote {out} sha256={card['sha256']} digests={len(entries)} scitt-keys=absent sig=null",
            file=sys.stderr,
        )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
