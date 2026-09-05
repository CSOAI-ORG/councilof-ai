#!/usr/bin/env python3
"""transparency_anchor_retry.py — attempt/record Rekor v1·v2 + OTS for live root.json.

Honest outcomes only: success | fail | UNCHECKABLE.
Never fakes a Rekor seal or OTS proof. Never mutates signed root.
"""
from __future__ import annotations

import hashlib
import json
import sys
import urllib.error
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

try:
    from zoneinfo import ZoneInfo
except ImportError:  # pragma: no cover
    ZoneInfo = None  # type: ignore

UA = "csoai-transparency-anchor-retry/0 (+https://councilof.ai)"
ROOT_URL = "https://councilof.ai/root.json"
REPO = Path(__file__).resolve().parents[1]
OUT_DIR = REPO / "public" / "interop" / "transparency-anchor-retry"
OUT_CARD = OUT_DIR / "card-unsigned.json"


def _fetch(url: str, method: str = "GET", body: bytes | None = None, timeout: int = 25):
    headers = {"User-Agent": UA, "Accept": "application/json"}
    if body is not None:
        headers["Content-Type"] = "application/json"
    req = urllib.request.Request(url, data=body, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            raw = resp.read()
            return int(resp.status), raw
    except urllib.error.HTTPError as e:
        return int(e.code), e.read()
    except Exception as e:
        return 0, str(e).encode()


def main() -> int:
    code, raw = _fetch(ROOT_URL)
    if code != 200 or not raw:
        print(f"FAIL: could not GET {ROOT_URL} (http={code})", file=sys.stderr)
        return 2
    root_sha = hashlib.sha256(raw).hexdigest()
    try:
        live = json.loads(raw.decode("utf-8"))
    except Exception:
        live = {}

    attempts = []

    payload = json.dumps({"hash": f"sha256:{root_sha}"}).encode()
    http, body = _fetch(
        "https://rekor.sigstore.dev/api/v1/index/retrieve", method="POST", body=payload
    )
    entries = None
    try:
        entries = json.loads(body.decode("utf-8")) if body else None
    except Exception:
        entries = None
    if http == 200 and isinstance(entries, list) and len(entries) > 0:
        attempts.append(
            {
                "rail": "rekor-v1-index-retrieve",
                "endpoint": "https://rekor.sigstore.dev/api/v1/index/retrieve",
                "method": "POST",
                "http": http,
                "outcome": "success",
                "entry_count": len(entries),
                "note": "Hash found in Rekor v1 index. Still not a certification; record UUIDs only.",
                "entries_prefix": entries[:5],
            }
        )
        rekor_entry = entries
        v1_subject = "success"
    elif http == 200 and isinstance(entries, list):
        attempts.append(
            {
                "rail": "rekor-v1-index-retrieve",
                "endpoint": "https://rekor.sigstore.dev/api/v1/index/retrieve",
                "method": "POST",
                "http": http,
                "response": [],
                "outcome": "fail",
                "note": "Rekor v1 reachable; no entry for this root.json sha256. Not anchored. No seal invented.",
            }
        )
        rekor_entry = None
        v1_subject = "fail"
    else:
        attempts.append(
            {
                "rail": "rekor-v1-index-retrieve",
                "endpoint": "https://rekor.sigstore.dev/api/v1/index/retrieve",
                "method": "POST",
                "http": http,
                "outcome": "UNCHECKABLE",
                "note": f"Could not complete Rekor v1 index retrieve (http={http}). No seal invented.",
                "body_prefix": body[:300].decode("utf-8", "replace") if isinstance(body, (bytes, bytearray)) else str(body)[:300],
            }
        )
        rekor_entry = None
        v1_subject = "UNCHECKABLE"

    http, body = _fetch("https://rekor.sigstore.dev/api/v1/log")
    attempts.append(
        {
            "rail": "rekor-v1-log",
            "endpoint": "https://rekor.sigstore.dev/api/v1/log",
            "method": "GET",
            "http": http,
            "outcome": "success" if http == 200 else ("fail" if http else "UNCHECKABLE"),
            "note": (
                "Public log info reachable (infrastructure up). Does not prove this root is logged."
                if http == 200
                else "Rekor v1 log unreachable."
            ),
        }
    )

    http, body = _fetch("https://rekor.sigstore.dev/api/v2/log")
    attempts.append(
        {
            "rail": "rekor-v2",
            "endpoint": "https://rekor.sigstore.dev/api/v2/log",
            "method": "GET",
            "http": http,
            "outcome": "UNCHECKABLE" if http in (0, 404) else ("success" if http == 200 else "fail"),
            "note": (
                "Rekor v2 path not available on public rekor.sigstore.dev as of attempt. Do not fake a v2 seal."
                if http == 404
                else f"Rekor v2 probe http={http}."
            ),
        }
    )

    ots_outcome = "UNCHECKABLE"
    ots_note = "OTS client / opentimestamps package not available on this runner. No .ots proof minted. No fake calendar attestation."
    try:
        import opentimestamps  # noqa: F401

        ots_note = "opentimestamps importable, but this script does not mint proofs (owner calendar run). Outcome left UNCHECKABLE until a real .ots exists."
    except Exception:
        pass
    attempts.append(
        {
            "rail": "opentimestamps",
            "tool": "harness/arena/ots_anchor.py + opentimestamps",
            "outcome": ots_outcome,
            "note": ots_note,
        }
    )

    overall = v1_subject
    now = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    if ZoneInfo is not None:
        london = datetime.now(ZoneInfo("Europe/London")).strftime("%Y-%m-%dT%H:%M:%S%z")
        london = london[:-2] + ":" + london[-2:]
    else:
        london = now

    card = {
        "schema": "https://councilof.ai/schema/card-v0.json",
        "surface": "public.notice",
        "subject": "councilof.ai/root.json transparency-anchor retry (Rekor v1/v2 + OTS)",
        "as_of": now,
        "source_urls": [
            ROOT_URL,
            "https://rekor.sigstore.dev/api/v1/log",
            "https://rekor.sigstore.dev/api/v1/index/retrieve",
            "https://rekor.sigstore.dev/api/v2/log",
            "https://councilof.ai/interop/transparency-anchors.json",
        ],
        "payload": {
            "kind": "csoai.transparency-anchor-retry/0.1",
            "subject_url": ROOT_URL,
            "subject_as_of": live.get("as_of"),
            "subject_merkle_root": live.get("merkle_root"),
            "subject_card_count": live.get("card_count"),
            "subject_sha256": root_sha,
            "attempted_at_europe_london": london,
            "overall_outcome": overall,
            "overall_note": (
                "Attempt recorded. Never fake a Rekor/OTS seal. "
                f"Subject-hash lookup outcome={overall}."
            ),
            "attempts": attempts,
            "seal": None,
            "rekor_entry": rekor_entry,
            "ots_proof": None,
            "flags": {
                "fake_seal_forbidden": True,
                "witness_not_certification": True,
                "anchor_is_root_hash_only": True,
            },
        },
        "sha256": None,
        "sig_ed25519": None,
        "did": "did:web:csoai.org#board-attestation-1",
        "unmeasured": [
            "rekor_v1_inclusion",
            "rekor_v2_api",
            "ots_bitcoin_attestation",
            "n>=30",
            "4way",
            "keystone",
        ],
        "tags": ["transparency-anchor", "rekor", "ots", "unsigned", "no-fake-seal"],
    }
    preimage = {k: v for k, v in card.items() if k not in ("sha256", "sig_ed25519")}
    card["sha256"] = hashlib.sha256(
        json.dumps(preimage, sort_keys=True, separators=(",", ":")).encode()
    ).hexdigest()

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    OUT_CARD.write_text(json.dumps(card, indent=2) + "\n", encoding="utf-8")
    print(
        json.dumps(
            {
                "wrote": str(OUT_CARD.relative_to(REPO)),
                "overall_outcome": overall,
                "subject_sha256": root_sha,
            },
            indent=2,
        )
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
