"""Attestation-watch gap leaves — issuer claim vs observable ledger state.

EP3 / TUI-3. The public page is /watch; these are the signed facts behind it.

Honesty spine (do not soften):
  * CLAIM SIDE comes only from public/interop/watch/issuer-claims.json — a
    registry where every entry was actually fetched and archived with a
    timestamp and an excerpt. claim: null -> the gap is UNMEASURED, the leaf
    still ships, the empty cell stays visible. Never omitted, never invented.
  * OBSERVABLE SIDE is xrpl.fi/api/metrics via the locked-16 xrpl adapter —
    the same source root.json already declares.
  * Divergence is computed ONLY inside one disclosed scope. A cross-scope
    pair (issuer all-chain total vs XRPL slice) is recorded as two facts with
    the scope mismatch named — the divergence cell stays empty.
  * Facts, not grades: no verdict words, no solvency statements, no "backed"
    or "unbacked". We measure what a page said against what a ledger shows.
  * Nothing here signs. Leaves are surface public.notice; the hourly
    public-root.yml run signs them (GHA OIDC, #board-attestation-1) or they
    stay unsigned. NO_LAPTOP_SIGN.

Never raises: dark metrics or a missing registry -> fewer leaves + a sidecar
note; the hourly root is never halted by this adapter.

Run:   python3 scripts/adapters/watch_gaps.py   (writes the page snapshot only)
Emits: public/interop/watch/watch-latest.json — the snapshot /watch renders.
"""
from __future__ import annotations

import json
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

sys.path.insert(0, str(Path(__file__).resolve().parent))
from xrpl import LOCKED_16, METRICS_URL, fetch_metrics  # noqa: E402

WATCH_DIR = Path(__file__).resolve().parents[2] / "public" / "interop" / "watch"
CLAIMS_PATH = WATCH_DIR / "issuer-claims.json"
SPECIMEN_PATH = WATCH_DIR / "specimen-ledger.json"
CALENDAR_PATH = WATCH_DIR / "calendar.json"
SNAPSHOT_PATH = WATCH_DIR / "watch-latest.json"

GAP_KIND = "csoai.attestation-watch/0.1"
SPECIMEN_KIND = "csoai.specimen-ledger/0.1"


def _now() -> str:
    return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")


def _load(path: Path) -> dict[str, Any]:
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except Exception as e:
        print(f"  watch: cannot load {path.name}: {e}", file=sys.stderr)
        return {}


def _observable_by_symbol(metrics: dict[str, Any]) -> dict[str, dict[str, Any]]:
    out: dict[str, dict[str, Any]] = {}
    for a in metrics.get("assets") or []:
        sym = a.get("symbol") or a.get("currency") or ""
        if sym:
            out[sym] = a
    return out


def _divergence(claim: dict[str, Any], observable: dict[str, Any]) -> tuple[float | None, str | None, list[str]]:
    """Same-scope divergence only. Returns (pct, method, unmeasured_extra)."""
    unmeasured: list[str] = []
    supply = observable.get("supply")
    if supply is None:
        return None, None, ["observable_supply"]
    ctype = claim.get("type")
    if ctype == "numeric-tvl" and claim.get("tvl_usd_xrpl") and claim.get("price_usd"):
        implied = float(supply) * float(claim["price_usd"])
        claim_xrpl = float(claim["tvl_usd_xrpl"])
        pct = round((implied - claim_xrpl) / claim_xrpl * 100, 2)
        pct = pct if pct else 0.0  # never serialize -0.0
        return pct, "observable.supply × claim.price_usd (issuer-quoted) vs claim.tvl_usd_xrpl — same scope (XRPL), issuer's own price on both sides", unmeasured
    # Every other shape is a scope or type mismatch: say so, keep the cell empty.
    if ctype == "numeric-total-circulation":
        unmeasured.append("same_scope_divergence: claim is all-chains, observable is the XRPL slice")
    elif ctype == "qualitative-backing":
        unmeasured.append("numeric_issuer_claim: the issuer page serves no supply figure")
    return None, None, unmeasured


def _gap_leaf(
    locked: dict[str, str],
    registry_row: dict[str, Any],
    observable: dict[str, Any] | None,
    metrics_as_of: str | None,
) -> dict[str, Any]:
    symbol = locked["symbol"]
    claim = registry_row.get("claim")
    ext = registry_row.get("external_reference")
    obs = None
    unmeasured: list[str] = []
    if observable is not None:
        obs = {
            "supply": observable.get("supply"),
            "holders": observable.get("holders"),
            "as_of": metrics_as_of,
            "source": METRICS_URL,
            "scope": "xrpl",
        }
        for f in ("supply", "holders"):
            if obs.get(f) is None:
                unmeasured.append(f"observable_{f}")
    else:
        unmeasured.append("observable_state: asset absent from xrpl.fi metrics this run")

    payload: dict[str, Any] = {
        "kind": GAP_KIND,
        "status": "PROBED",
        "symbol": symbol,
        "issuer": registry_row.get("issuer"),
        "issuer_address": locked["issuer_address"],
        "claim": claim,
        "observable": obs,
        "establishes": "What the issuer's public page claimed (archived, timestamped) beside what the public ledger reader showed, each in its own disclosed scope.",
        "does_not_establish": "Solvency, reserve adequacy, redemption risk, or any statement about the issuer's finances. A divergence is a measurement fact, not an accusation.",
    }
    if claim is None:
        payload["status"] = "UNMEASURED"
        unmeasured.append("issuer_claim: no archived claim in the registry")
        if registry_row.get("registry_note"):
            payload["registry_note"] = registry_row["registry_note"]
        payload["divergence_pct"] = None
    else:
        pct, method, extra = _divergence(claim, obs or {})
        payload["divergence_pct"] = pct
        if method:
            payload["divergence_method"] = method
        unmeasured.extend(extra)
        if pct is None and claim.get("type") != "qualitative-backing":
            payload["status"] = "PROBED"  # sources probed; divergence itself unmeasured
        if ext:
            payload["external_reference"] = ext
            if obs and obs.get("supply") is not None and ext.get("value"):
                # Same unit (token), different scope — disclosed, never summed.
                payload["xrpl_share_of_tracker_pct"] = round(float(obs["supply"]) / float(ext["value"]) * 100, 2)
                payload["scope_note"] = "external_reference is all-chains; observable is the XRPL slice. The share is arithmetic on two sourced numbers, not a claim about backing."
    srcs = [METRICS_URL]
    if claim and claim.get("source_url"):
        srcs.insert(0, claim["source_url"])
    return {
        "surface": "public.notice",
        "subject": f"Attestation watch: {symbol} issuer claim vs observable XRPL state",
        "as_of": metrics_as_of or _now(),
        "source_urls": srcs,
        "payload": payload,
        "unmeasured": unmeasured,
        "tags": ["attestation-watch", "framework:xrpl", "reg.tag:public-ledger"],
    }


def _specimen_leaf(entry: dict[str, Any]) -> dict[str, Any]:
    payload: dict[str, Any] = {
        "kind": SPECIMEN_KIND,
        "status": "DISCOVERED",
        "entry_id": entry.get("id"),
        "entry_status": entry.get("status"),
        "archived_at": entry.get("archived_at"),
        "event": entry.get("event", {}).get("name"),
        "event_scheduled": entry.get("event", {}).get("scheduled"),
        "hype_claims_observed": [c.get("claim") for c in entry.get("hype_claims_observed") or []],
        "reference_state_at_archive": (entry.get("reference_state_at_archive") or {}).get("note"),
        "measurement_plan": entry.get("measurement_plan"),
        "outcome": entry.get("outcome"),
        "outcome_due": entry.get("outcome_due"),
        "establishes": "A public prediction archived before its outcome date, with the measurement plan stated in advance.",
        "does_not_establish": "The outcome. OUTCOME_PENDING means exactly that.",
    }
    unmeasured = ["outcome"] if entry.get("outcome") is None else []
    if entry.get("access_ask"):
        payload["access_ask"] = entry["access_ask"]
    return {
        "surface": "public.notice",
        "subject": f"Specimen ledger: {entry.get('event', {}).get('name', entry.get('id'))}",
        "as_of": entry.get("archived_at") or _now(),
        "source_urls": entry.get("event", {}).get("sources") or [],
        "payload": payload,
        "unmeasured": unmeasured,
        "tags": ["specimen-ledger", "attestation-watch"],
    }


def collect(root: Path | None = None) -> dict[str, Any]:
    del root  # paths are repo-relative constants; signature matches sibling adapters
    registry = _load(CLAIMS_PATH)
    specimen = _load(SPECIMEN_PATH)
    calendar = _load(CALENDAR_PATH)
    rows = {r.get("symbol"): r for r in registry.get("claims") or []}

    metrics = fetch_metrics()
    metrics_ok = bool(metrics.get("ok"))
    metrics_as_of = metrics.get("updatedAt")
    obs_by_symbol = _observable_by_symbol(metrics) if metrics_ok else {}

    gap_leaves: list[dict[str, Any]] = []
    panels: list[dict[str, Any]] = []
    for locked in LOCKED_16:
        symbol = locked["symbol"]
        row = rows.get(symbol) or {"symbol": symbol, "claim": None, "external_reference": None}
        obs = obs_by_symbol.get(symbol)
        leaf = _gap_leaf(locked, row, obs, metrics_as_of)
        gap_leaves.append(leaf)
        panels.append(
            {
                "symbol": symbol,
                "issuer": row.get("issuer"),
                "status": leaf["payload"]["status"],
                "claim": row.get("claim"),
                "external_reference": row.get("external_reference"),
                "observable": leaf["payload"].get("observable"),
                "divergence_pct": leaf["payload"].get("divergence_pct"),
                "xrpl_share_of_tracker_pct": leaf["payload"].get("xrpl_share_of_tracker_pct"),
                "scope_note": leaf["payload"].get("scope_note"),
                "unmeasured": leaf["unmeasured"],
            }
        )

    specimen_entries = specimen.get("entries") or []
    specimen_leaves = [_specimen_leaf(e) for e in specimen_entries]

    snapshot = {
        "schema": "csoai.watch.snapshot/0.1",
        "generated_at": _now(),
        "doctrine": "Measurement, not certification. A divergence is a fact about two sourced numbers, not an accusation. claim: null is UNMEASURED and stays visible.",
        "metrics_ok": metrics_ok,
        "metrics_as_of": metrics_as_of,
        "assets": panels,
        "calendar": calendar.get("events") or [],
        "specimen_ledger": specimen_entries,
    }
    try:
        SNAPSHOT_PATH.parent.mkdir(parents=True, exist_ok=True)
        SNAPSHOT_PATH.write_text(json.dumps(snapshot, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    except Exception as e:
        print(f"  watch: snapshot write failed: {e}", file=sys.stderr)

    return {
        "leaves": gap_leaves + specimen_leaves,
        "sidecar": {
            "move": "attestation-watch",
            "n_gap_leaves": len(gap_leaves),
            "n_specimen_leaves": len(specimen_leaves),
            "n_with_archived_claim": sum(1 for p in panels if p["claim"]),
            "n_with_divergence": sum(1 for p in panels if p["divergence_pct"] is not None),
            "metrics_ok": metrics_ok,
            "metrics_as_of": metrics_as_of,
            "note": (
                "Claim vs observable for the locked-16 XRPL assets + the dated specimen "
                "ledger. Facts, not grades. claim:null ships as UNMEASURED, never omitted."
            ),
        },
    }


if __name__ == "__main__":
    out = collect()
    print(f"  {out['sidecar']['n_gap_leaves']} gap leaves, {out['sidecar']['n_specimen_leaves']} specimen leaves")
    print(f"  claims archived: {out['sidecar']['n_with_archived_claim']}, divergences computed: {out['sidecar']['n_with_divergence']}")
    print(f"  snapshot -> {SNAPSHOT_PATH}")
