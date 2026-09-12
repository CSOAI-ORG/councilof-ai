"""XRPL impersonation watch — daily scan of RLUSD/XSGD/USDC/AUDD issuers.

Brief G3.2. Scans the XRPSCAN token ranking (top-N by holders) for rows whose
currency code is one of the watched codes, and classifies every observed issuer
against a hard-coded verified-issuer set:

  * MATCH                    issuer == archived verified issuer
  * MISMATCH                 issuer != archived verified issuer
  * VERIFIED_SET_UNMEASURED  no verified issuer archived for this code —
                             every observed issuer is reported with
                             verified_set_state UNMEASURED.

Honesty spine (do not soften):
  * Facts, not grades. A MISMATCH means ONLY "issuer not in the archived
    verified set — legitimacy UNMEASURED". We never call an issuer
    fake/fraudulent/a scam. Measurement, not certification.
  * Issuance below the ranking window is not enumerated: the long tail is
    UNMEASURED and stays listed, never zero-filled.
  * Every live page is archived as raw bytes + sha256 + retrieval metadata
    (owner ruling 2026-09-12). Mirrors are written only on live runs, never
    under replay, and mirror-writing is best-effort.
  * collect() NEVER raises. Network dark -> leaves rebuilt from the committed
    last-scan snapshot if present, else an ABSENT sidecar with no leaves.

All leaves are surface public.notice, the same envelope the other adapters
emit, so the existing public-root signer folds them into /root.json.
"""
from __future__ import annotations

import hashlib
import json
import urllib.request
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Callable

PACK = "xrpl-impersonation-2026-09"
PACK_REL = Path("public/interop") / PACK
MIRRORS_REL = PACK_REL / "mirrors"
SNAPSHOT_REL = PACK_REL / "latest.json"
MANIFEST_REL = PACK_REL / "artefact-manifest.json"

API = "https://api.xrpscan.com/api/v1/tokens"
PAGE_LIMIT = 100
USER_AGENT = "councilof-ai-watch/0.1"
TIMEOUT_S = 20

WATCHED_CODES = ("RLUSD", "XSGD", "USDC", "AUDD")

# Hard-coded verified-issuer set. None means: no verified issuer archived for
# this code — every observed issuer is verified_set_state UNMEASURED, never a
# mismatch, never a verdict.
VERIFIED: dict[str, str | None] = {
    "RLUSD": "rMxCKbEDwqr76QuheSUMdEGf4B9xJ8m5De",
    "USDC": "rGm7WCVp9gb4jZHWTEtGUr4dd74z2XuWhE",
    "XSGD": None,
    "AUDD": None,
}

MISMATCH_WORDING = "issuer not in the archived verified set — legitimacy UNMEASURED"
LONG_TAIL_NOTE = "UNMEASURED — issuance below the ranking window is not enumerated"

# Completed deep-window scan (offsets 3000..11900) archived from a local capture.
DEEP_SCAN_CAPTURE = Path("/tmp/tui3-deep-scan.json")
DEEP_MIRROR_ID = "xrpscan-tokens-deep-3000-11900.json"
DEEP_SOURCE_URL = "https://api.xrpscan.com/api/v1/tokens?limit=100&offset=3000..11900"
DEEP_WINDOW_ROWS = 9000

MAX_PAYLOAD_BYTES = 3072


def _now_z() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def _iso_z_from_ts(ts: float) -> str:
    return datetime.fromtimestamp(ts, timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def _canon_size(payload: dict[str, Any]) -> int:
    return len(
        json.dumps(payload, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode("utf-8")
    )


def _default_fetch(url: str) -> bytes:
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(req, timeout=TIMEOUT_S) as resp:
        return resp.read()


def _write_bytes(path: Path, data: bytes) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(data)


def _archive_mirror(
    root: Path, mirror_id: str, role: str, source_url: str, body: bytes, fetched_at: str
) -> dict[str, Any] | None:
    """Best-effort mirror write + .meta.json sidecar. Returns the meta dict."""
    try:
        meta = {
            "id": mirror_id,
            "role": role,
            "source_url": source_url,
            "fetched_at": fetched_at,
            "http": 200,
            "bytes": len(body),
            "sha256": hashlib.sha256(body).hexdigest(),
        }
        _write_bytes(root / MIRRORS_REL / mirror_id, body)
        _write_bytes(
            root / MIRRORS_REL / (mirror_id + ".meta.json"),
            (json.dumps(meta, indent=2, sort_keys=True) + "\n").encode("utf-8"),
        )
        return meta
    except Exception:
        return None


def _classify(code: str, issuer: str) -> str:
    verified = VERIFIED.get(code)
    if verified is None:
        return "VERIFIED_SET_UNMEASURED"
    return "MATCH" if issuer == verified else "MISMATCH"


def _row_hit(row: dict[str, Any], window: str) -> dict[str, Any]:
    code = str(row.get("code") or "")
    issuer = str(row.get("issuer") or "")
    return {
        "code": code,
        "issuer": issuer,
        "holders": row.get("holders"),
        "supply": row.get("supply"),
        "first_seen_in_window": row.get("createdAt"),
        "classification": _classify(code, issuer),
        "verified_issuer": VERIFIED.get(code),
        "window": window,
    }


def _mismatch_leaf(hit: dict[str, Any], as_of: str) -> dict[str, Any]:
    code, issuer = hit["code"], hit["issuer"]
    payload = {
        "kind": "csoai.xrpl-impersonation-mismatch/0.1",
        "status": "DISCOVERED",
        "code": code,
        "issuer": issuer,
        "holders": hit.get("holders"),
        "supply": hit.get("supply"),
        "first_seen_in_window": hit.get("first_seen_in_window"),
        "verified_issuer": hit.get("verified_issuer"),
        "wording": MISMATCH_WORDING,
    }
    assert _canon_size(payload) <= MAX_PAYLOAD_BYTES, "mismatch payload over 3072 bytes"
    return {
        "surface": "public.notice",
        "subject": f"XRPL {code} issuer {issuer} not in archived verified set",
        "as_of": as_of,
        "source_urls": [API, f"https://xrpscan.com/token/{code}.{issuer}"],
        "payload": payload,
        "unmeasured": ["issuer_legitimacy", "long_tail_issuance_below_ranking_window"],
        "tags": ["xrpl", "impersonation-watch", f"code:{code}", "mismatch"],
    }


def _unmeasured_issuer_leaf(hit: dict[str, Any], as_of: str, entry_1: bool) -> dict[str, Any]:
    code, issuer = hit["code"], hit["issuer"]
    payload = {
        "kind": "csoai.xrpl-impersonation-unmeasured/0.1",
        "status": "DISCOVERED",
        "verified_set_state": "UNMEASURED",
        "code": code,
        "issuer": issuer,
        "holders": hit.get("holders"),
        "supply": hit.get("supply"),
        "first_seen_in_window": hit.get("first_seen_in_window"),
        "verified_issuer": None,
        "wording": "no verified issuer archived for this code — legitimacy UNMEASURED",
    }
    assert _canon_size(payload) <= MAX_PAYLOAD_BYTES, "unmeasured payload over 3072 bytes"
    tags = ["xrpl", "impersonation-watch", f"code:{code}", "verified-set-unmeasured"]
    if entry_1:
        tags.append("entry-1")
    return {
        "surface": "public.notice",
        "subject": f"XRPL {code} issuer {issuer} — verified set UNMEASURED",
        "as_of": as_of,
        "source_urls": [API, f"https://xrpscan.com/token/{code}.{issuer}"],
        "payload": payload,
        "unmeasured": ["verified_issuer_for_code", "issuer_legitimacy"],
        "tags": tags,
    }


def _summary_leaf(snapshot: dict[str, Any]) -> dict[str, Any]:
    counts: dict[str, dict[str, int]] = {
        code: {"matches": 0, "mismatches": 0, "verified_set_unmeasured": 0}
        for code in WATCHED_CODES
    }
    for hit in snapshot.get("hits", []):
        cls = hit.get("classification")
        code = hit.get("code")
        if code not in counts:
            continue
        if cls == "MATCH":
            counts[code]["matches"] += 1
        elif cls == "MISMATCH":
            counts[code]["mismatches"] += 1
        else:
            counts[code]["verified_set_unmeasured"] += 1

    unmeasured: list[str] = [LONG_TAIL_NOTE]
    for code in WATCHED_CODES:
        if VERIFIED.get(code) is None:
            unmeasured.append(f"verified issuer for {code}")
    if not any(h.get("code") == "XSGD" for h in snapshot.get("hits", [])):
        unmeasured.append("XSGD issuance inside scan window")

    cov = snapshot.get("scan_coverage", {})
    payload = {
        "kind": "csoai.xrpl-impersonation-scan/0.1",
        "status": "PROBED",
        "as_of": snapshot.get("generated_at"),
        "counts": counts,
        "scan_coverage": {
            "source": cov.get("source"),
            "window": cov.get("window"),
            "n_scanned": cov.get("n_scanned"),
            "pages_ok": cov.get("pages_ok"),
            "pages_failed": cov.get("pages_failed"),
            "long_tail": LONG_TAIL_NOTE,
        },
        "unmeasured": unmeasured,
        "not_a_verdict": True,
        "wording": MISMATCH_WORDING,
    }
    if snapshot.get("replay"):
        payload["replay_from_snapshot"] = True
    assert _canon_size(payload) <= MAX_PAYLOAD_BYTES, "summary payload over 3072 bytes"
    return {
        "surface": "public.notice",
        "subject": "XRPL stablecoin-code impersonation watch — daily scan",
        "as_of": snapshot.get("generated_at"),
        "source_urls": [API, f"https://councilof.ai/interop/{PACK}/latest.json"],
        "payload": payload,
        "unmeasured": unmeasured,
        "tags": ["xrpl", "impersonation-watch", "daily-scan", PACK],
    }


def _leaves_from_snapshot(snapshot: dict[str, Any]) -> list[dict[str, Any]]:
    as_of = snapshot.get("generated_at") or _now_z()
    leaves = [_summary_leaf(snapshot)]
    entry_1_done = False
    for hit in snapshot.get("mismatches", []):
        leaves.append(_mismatch_leaf(hit, as_of))
    for hit in snapshot.get("unmeasured", []):
        entry_1 = hit.get("code") == "XSGD" and not entry_1_done
        if entry_1:
            entry_1_done = True
        leaves.append(_unmeasured_issuer_leaf(hit, as_of, entry_1))
    return leaves


def _load_snapshot(root: Path) -> dict[str, Any] | None:
    try:
        path = root / SNAPSHOT_REL
        if path.is_file():
            snap = json.loads(path.read_bytes())
            if isinstance(snap, dict) and snap.get("schema") == "csoai.xrpl-impersonation-scan/0.1":
                snap["replay"] = True
                return snap
    except Exception:
        pass
    return None


def _load_deep_hits(path: Path) -> tuple[list[dict[str, Any]], bytes, float] | None:
    """Return (rows, raw_json_bytes, mtime) from the completed deep capture, else None."""
    try:
        if not path.is_file():
            return None
        lines = path.read_bytes().splitlines()
        if not lines:
            return None
        rows = json.loads(lines[-1])
        if not isinstance(rows, list):
            return None
        rows = [r for r in rows if isinstance(r, dict) and r.get("code") in WATCHED_CODES]
        body = lines[-1] if lines[-1].strip().startswith(b"[") else json.dumps(rows).encode("utf-8")
        return rows, body, path.stat().st_mtime
    except Exception:
        return None


def collect(
    root: str | Path | None = None,
    *,
    fetch: Callable[[str], bytes] | None = None,
    scan_limit: int = 3000,
    deep_capture: str | Path | None = None,
) -> dict[str, Any]:
    """Scan the XRPSCAN token ranking. NEVER raises."""
    live = fetch is None
    fetch_fn = fetch or _default_fetch
    root_path = Path(root) if root is not None else Path(__file__).resolve().parents[2]
    deep_path = Path(deep_capture) if deep_capture is not None else DEEP_SCAN_CAPTURE

    try:
        pages_ok = 0
        pages_failed = 0
        hits: list[dict[str, Any]] = []
        metas: list[dict[str, Any]] = []
        generated_at = _now_z()

        for offset in range(0, scan_limit, PAGE_LIMIT):
            url = f"{API}?limit={PAGE_LIMIT}&offset={offset}"
            try:
                body = fetch_fn(url)
                rows = json.loads(body)
                if isinstance(rows, dict):
                    rows = rows.get("tokens") or []
                if not isinstance(rows, list):
                    raise ValueError("unexpected page shape")
            except Exception:
                pages_failed += 1
                continue
            pages_ok += 1
            if live:
                meta = _archive_mirror(
                    root_path, f"xrpscan-tokens-{offset}.json", "token-ranking-page", url, body, generated_at
                )
                if meta:
                    metas.append(meta)
            for row in rows:
                if isinstance(row, dict) and row.get("code") in WATCHED_CODES:
                    hits.append(_row_hit(row, "top-ranking"))

        if pages_ok == 0:
            snap = _load_snapshot(root_path)
            if snap is not None:
                return {
                    "leaves": _leaves_from_snapshot(snap),
                    "sidecar": {
                        "status": "SNAPSHOT_REPLAY",
                        "pack": PACK,
                        "note": "network dark — leaves rebuilt from committed last-scan snapshot",
                        "snapshot_generated_at": snap.get("generated_at"),
                    },
                }
            return {
                "leaves": [],
                "sidecar": {
                    "status": "ABSENT",
                    "pack": PACK,
                    "pages_failed": pages_failed,
                    "note": "network dark and no committed snapshot present",
                },
            }

        # Deep window (offsets 3000..11900): incorporate the completed capture.
        deep_state = "UNMEASURED"
        deep = _load_deep_hits(deep_path)
        if deep is not None:
            deep_rows, deep_body, deep_mtime = deep
            for row in deep_rows:
                hits.append(_row_hit(row, "deep-3000-11900"))
            deep_state = "ARCHIVED"
            if live:
                meta = _archive_mirror(
                    root_path,
                    DEEP_MIRROR_ID,
                    "token-ranking-deep-window-archived",
                    DEEP_SOURCE_URL,
                    deep_body,
                    _iso_z_from_ts(deep_mtime),
                )
                if meta:
                    metas.append(meta)

        # Dedupe by (code, issuer), first observation wins.
        seen: set[tuple[str, str]] = set()
        deduped: list[dict[str, Any]] = []
        for hit in hits:
            key = (hit["code"], hit["issuer"])
            if key not in seen:
                seen.add(key)
                deduped.append(hit)

        n_scanned = pages_ok * PAGE_LIMIT + (DEEP_WINDOW_ROWS if deep_state == "ARCHIVED" else 0)
        snapshot = {
            "schema": "csoai.xrpl-impersonation-scan/0.1",
            "generated_at": generated_at,
            "scan_coverage": {
                "source": "api.xrpscan.com/api/v1/tokens",
                "window": f"top-{scan_limit} by holders ranking"
                + (" + archived deep window offsets 3000..11900" if deep_state == "ARCHIVED" else ""),
                "n_scanned": n_scanned,
                "pages_ok": pages_ok,
                "pages_failed": pages_failed,
                "deep_window": deep_state,
                "long_tail": LONG_TAIL_NOTE,
            },
            "verified_issuers": VERIFIED,
            "hits": deduped,
            "mismatches": [h for h in deduped if h["classification"] == "MISMATCH"],
            "unmeasured": [h for h in deduped if h["classification"] == "VERIFIED_SET_UNMEASURED"],
        }

        if live:
            try:
                _write_bytes(
                    root_path / SNAPSHOT_REL,
                    (json.dumps(snapshot, indent=2, sort_keys=True) + "\n").encode("utf-8"),
                )
            except Exception:
                pass
            try:
                manifest = {
                    "schema": "csoai.artefact-manifest/0.1",
                    "pack": PACK,
                    "as_of": generated_at,
                    "artefacts": sorted(metas, key=lambda m: m["id"]),
                }
                _write_bytes(
                    root_path / MANIFEST_REL,
                    (json.dumps(manifest, indent=2, sort_keys=True) + "\n").encode("utf-8"),
                )
            except Exception:
                pass

        return {
            "leaves": _leaves_from_snapshot(snapshot),
            "sidecar": {
                "status": "PROBED",
                "pack": PACK,
                "n_scanned": n_scanned,
                "pages_ok": pages_ok,
                "pages_failed": pages_failed,
                "deep_window": deep_state,
                "hits": len(deduped),
                "mismatches": len(snapshot["mismatches"]),
                "verified_set_unmeasured": len(snapshot["unmeasured"]),
                "mirrors_written": len(metas) if live else 0,
            },
        }
    except Exception as exc:  # absolute last resort — never raise
        try:
            snap = _load_snapshot(root_path)
            if snap is not None:
                return {
                    "leaves": _leaves_from_snapshot(snap),
                    "sidecar": {"status": "SNAPSHOT_REPLAY", "pack": PACK, "reason": type(exc).__name__},
                }
        except Exception:
            pass
        return {"leaves": [], "sidecar": {"status": "ABSENT", "pack": PACK, "reason": type(exc).__name__}}


if __name__ == "__main__":
    result = collect()
    print(json.dumps(result["sidecar"], indent=2, sort_keys=True))
    print(f"leaves: {len(result['leaves'])}")
