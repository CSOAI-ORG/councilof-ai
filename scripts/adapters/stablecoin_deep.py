"""Stablecoin top-20 deep-measurement leaves (attestation dimensions).

Pure file reader of public/interop/stablecoin-deep-2026-09/deep.json, which is
built by scripts/build_stablecoin_deep.py (the network side; archived mirrors +
retrieval metadata live in the same pack). No network in collect(). Never
raises: missing/invalid input -> ABSENT/INVALID sidecar with no leaves.

Doctrine: facts, not grades. DEEP_PROBED means "the issuer page was fetched
and its served bytes inspected" — never a certification. The bare state word
MEASURED is banned; rows are DEEP_PROBED or UNMEASURED. Unverifiable cells
stay empty and named in unmeasured[].
"""
from __future__ import annotations

import json
from pathlib import Path
from typing import Any

REL = Path("public/interop/stablecoin-deep-2026-09/deep.json")
PUBLIC_URL = "https://councilof.ai/interop/stablecoin-deep-2026-09/deep.json"
MANIFEST_URL = "https://councilof.ai/interop/stablecoin-deep-2026-09/artefact-manifest.json"
MAX_PAYLOAD_BYTES = 3072
MAX_EXCERPT = 160


def _canon(obj: Any) -> bytes:
    return json.dumps(obj, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode("utf-8")


def _repo_root(root: Any) -> Path:
    if root is not None:
        return Path(root)
    return Path(__file__).resolve().parent.parent.parent


def _asset_leaf(row: dict[str, Any], as_of: Any) -> dict[str, Any]:
    symbol = str(row.get("symbol") or row.get("id") or "?")
    state = row.get("measurement_state")
    if state not in ("DEEP_PROBED", "UNMEASURED"):
        state = "UNMEASURED"
    payload: dict[str, Any] = {
        "kind": "csoai.stablecoin-deep-asset/0.1",
        "status": state,
        "id": row.get("id"),
        "symbol": symbol,
        "attestation_page": row.get("attestation_page"),
        "auditor": row.get("auditor"),
        "cadence_claimed": row.get("cadence_claimed"),
        "latest_report_date": row.get("latest_report_date"),
        "staleness_days": row.get("staleness_days"),
        "mirror_sha256": row.get("mirror_sha256"),
    }
    excerpt = row.get("excerpt")
    if isinstance(excerpt, str) and excerpt.strip():
        payload["excerpt"] = excerpt[:MAX_EXCERPT]
    findings = [str(f) for f in row.get("findings") or []][:3]
    if findings:
        payload["findings"] = findings
    unmeasured = [str(u) for u in row.get("unmeasured") or []]
    payload["unmeasured"] = unmeasured
    assert len(_canon(payload)) <= MAX_PAYLOAD_BYTES, f"{symbol} payload over byte cap"
    return {
        "surface": "public.notice",
        "subject": f"Stablecoin attestation deep-probe: {symbol}",
        "as_of": as_of,
        "source_urls": sorted({u for u in [PUBLIC_URL, MANIFEST_URL, row.get("attestation_page")] if u}),
        "payload": payload,
        "unmeasured": unmeasured,
        "tags": ["subject:stablecoin-attestation", "release:stablecoin-deep-2026-09", "facts-not-grades"],
    }


def _summary_leaf(deep: dict[str, Any], rows: list[dict[str, Any]], as_of: Any) -> dict[str, Any]:
    summary = deep.get("summary") if isinstance(deep.get("summary"), dict) else {}
    unmeasured: list[str] = []
    payload: dict[str, Any] = {
        "kind": "csoai.stablecoin-deep-summary/0.1",
        "status": "PROBED",
        "release_id": deep.get("release_id"),
        "top_n": deep.get("top_n"),
        "n_rows": len(rows),
        "n_deep_probed": sum(1 for r in rows if r.get("measurement_state") == "DEEP_PROBED"),
        "n_unmeasured_rows": sum(1 for r in rows if r.get("measurement_state") != "DEEP_PROBED"),
        "n_with_attestation_page": summary.get("n_with_attestation_page"),
        "n_with_auditor": summary.get("n_with_auditor"),
        "n_with_staleness": summary.get("n_with_staleness"),
        "median_staleness_days": summary.get("median_staleness_days"),
        "free_surface": "index total + staleness_days",
        "paid_surface": "per-chain splits + gap basis points (PROOF door; price lives at the 402 challenge)",
        "not_a_certification": True,
        "truth_rules": [str(t) for t in deep.get("truth_rules") or []][:3],
        "unmeasured": unmeasured,
    }
    for key in ("n_with_auditor", "n_with_staleness"):
        if payload.get(key) is None:
            unmeasured.append(key)
    assert len(_canon(payload)) <= MAX_PAYLOAD_BYTES, "summary payload over byte cap"
    return {
        "surface": "public.notice",
        "subject": "Stablecoin top-20 attestation deep-measurement: summary",
        "as_of": as_of,
        "source_urls": [PUBLIC_URL, MANIFEST_URL],
        "payload": payload,
        "unmeasured": unmeasured,
        "tags": ["subject:stablecoin-attestation", "release:stablecoin-deep-2026-09", "facts-not-grades"],
    }


def collect(root: Any = None) -> dict[str, Any]:
    try:
        path = _repo_root(root) / REL
        if not path.is_file():
            return {"leaves": [], "sidecar": {"status": "ABSENT", "path": str(REL)}}
        try:
            deep = json.loads(path.read_bytes())
        except Exception as exc:
            return {"leaves": [], "sidecar": {"status": "INVALID", "reason": type(exc).__name__}}
        if not isinstance(deep, dict) or deep.get("schema") != "csoai.stablecoin-deep/0.1":
            return {"leaves": [], "sidecar": {"status": "INVALID", "reason": "deep contract"}}
        rows = [r for r in deep.get("rows") or [] if isinstance(r, dict)]
        as_of = deep.get("generated_at")
        leaves = [_summary_leaf(deep, rows, as_of)] + [_asset_leaf(r, as_of) for r in rows]
        return {
            "leaves": leaves,
            "sidecar": {
                "status": "PROBED",
                "release_id": deep.get("release_id"),
                "rows": len(rows),
                "generated_at": as_of,
            },
        }
    except Exception as exc:  # never raises
        return {"leaves": [], "sidecar": {"status": "ERROR", "reason": type(exc).__name__}}


if __name__ == "__main__":
    out = collect()
    print(f"  stablecoin_deep: {out['sidecar']}")
    sizes = [len(_canon(l["payload"])) for l in out["leaves"]]
    print(f"  leaves: {len(out['leaves'])} (payload max {max(sizes) if sizes else 0}B)")
