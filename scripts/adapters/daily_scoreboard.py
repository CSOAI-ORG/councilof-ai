"""Daily scoreboard leaves — the public RWA cite + the SOV signal state (J20, J22).

EP3 / TUI-3, V2 "EAT" edition. Two public.notice leaves a day, both FILE READERS:

  1. rwa_networks_public_cite (J20) — the app.rwa.xyz/networks figures the estate
     archived 2026-08-30 (distributed $38.4B / represented $380.88B / XRPL
     distributed $474.3M, 10.5%). The rule is on the skeleton and stays on the
     leaf: settlement figures are theirs; we hash the page; represented never
     mixes into the XRPL basket. Cited, sourced, signed — a CITE, not a
     measurement of solvency or anything else.

  2. SOV Index v0 (J22) — the state of public/signals/sov-signal.signed.json,
     the estate's existing signed signal artifact. v0 IS the artifact's own
     numbers with its own generated date: the index counts what was measured
     and never predicts. The 40/20/15/15/10 weighted form is UNMEASURED — the
     component definitions were never enumerated anywhere in the estate, and
     this adapter does not invent them. Scoreboard only: no token, no trading,
     no issuance (EP9 gate).

Never raises: a missing file -> that leaf absent + sidecar note; the hourly
root is never halted by this adapter. Nothing here signs: the public-root.yml
run signs (GHA OIDC, #board-attestation-1) or the leaf stays unsigned.

Run:   python3 scripts/adapters/daily_scoreboard.py
Emits: public/interop/scoreboard/latest.json — the snapshot the /watch
       scoreboard strip renders.
"""
from __future__ import annotations

import json
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[2]
RWA_CITE_PATH = ROOT / "public" / "interop" / "fin7-skeletons" / "rwa_networks_public_cite.json"
SOV_SIGNAL_PATH = ROOT / "public" / "signals" / "sov-signal.signed.json"
OUT_DIR = ROOT / "public" / "interop" / "scoreboard"
SNAPSHOT_PATH = OUT_DIR / "latest.json"

RWA_CITE_KIND = "csoai.public-cite/0.1"
SOV_INDEX_KIND = "csoai.sov-index/0.1"


def _now() -> str:
    return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")


def _load(path: Path) -> dict[str, Any] | None:
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except Exception as e:
        print(f"  scoreboard: cannot load {path.relative_to(ROOT)}: {e}", file=sys.stderr)
        return None


def _rwa_cite_leaf(cite: dict[str, Any]) -> dict[str, Any]:
    return {
        "surface": "public.notice",
        "subject": "Public cite: rwa.xyz networks — distributed vs represented value (archived page figures)",
        "as_of": str(cite.get("as_of") or cite.get("as_of_mined") or _now()),
        "source_urls": [str(cite.get("source_url"))],
        "payload": {
            "kind": RWA_CITE_KIND,
            "status": "DISCOVERED",
            "not_a_grade": True,
            "as_of": cite.get("as_of"),
            "as_of_mined": cite.get("as_of_mined"),
            "distributed_asset_value_usd": cite.get("distributed_asset_value_usd"),
            "represented_asset_value_usd": cite.get("represented_asset_value_usd"),
            "xrpl_distributed_usd": cite.get("xrpl_distributed_usd"),
            "xrpl_pct_distributed": cite.get("xrpl_pct_distributed"),
            "xrpl_represented_usd": cite.get("xrpl_represented_usd"),
            "rule": cite.get("rule"),
            "license": cite.get("license"),
            "establishes": "What the cited page said on the archived date, carried unchanged with its own as_of.",
            "does_not_establish": "That the figures are current, correct, or audited. A cite is a hash of what was published, not a re-measurement.",
        },
        "unmeasured": ["freshness: figures are the archived page's, as_of carried on the leaf"],
        "tags": ["public-cite", "rwa-networks", "reg.tag:public-ledger"],
    }


def _sov_index_leaf(sig: dict[str, Any]) -> dict[str, Any]:
    rows = sig.get("rows") or []
    measured = [r for r in rows if r.get("register") == "MEASURED"]
    generated = str(sig.get("generated") or "")
    return {
        "surface": "public.notice",
        "subject": "SOV Index v0 — daily scoreboard state (counts what was measured; never predicts)",
        "as_of": generated or _now(),
        "source_urls": ["https://councilof.ai/signals/sov-signal.signed.json"],
        "payload": {
            "kind": SOV_INDEX_KIND,
            "status": "PROBED",
            "not_a_grade": True,
            "not_a_token": True,
            "scoreboard_only": True,
            "value": {
                "measured_axes": sig.get("measured_axes") if sig.get("measured_axes") is not None else len(measured),
                "n_signal_rows": len(rows),
                "n_measured_rows": len(measured),
            },
            "artifact_generated": generated,
            "artifact_content_id": sig.get("content_id"),
            "artifact_doctrine": sig.get("doctrine"),
            "weighted_form": "UNMEASURED — the 40/20/15/15/10 component definitions were never enumerated in the estate; v0 publishes the signal artifact's own counts with its own date, nothing invented.",
            "establishes": "The state of the signed sov-signal artifact at its own generated timestamp.",
            "does_not_establish": "A forecast, a price, a token, or a recomputation of any axis. The index counts what was measured — never predicts.",
        },
        "unmeasured": ["weighted_components_40_20_15_15_10: definitions never enumerated on disk"],
        "tags": ["sov-index", "scoreboard", "no-token"],
    }


def collect(root: Path | None = None) -> dict[str, Any]:
    del root  # paths are repo-relative constants; signature matches sibling adapters
    leaves: list[dict[str, Any]] = []
    snapshot: dict[str, Any] = {
        "schema": "csoai.scoreboard.snapshot/0.1",
        "generated_at": _now(),
        "doctrine": "Scoreboard, not a token. Cites carry their own as_of. UNMEASURED stays visible.",
    }

    cite = _load(RWA_CITE_PATH)
    if cite:
        leaves.append(_rwa_cite_leaf(cite))
        snapshot["rwa_cite"] = {
            "as_of": cite.get("as_of"),
            "source_url": cite.get("source_url"),
            "distributed_asset_value_usd": cite.get("distributed_asset_value_usd"),
            "represented_asset_value_usd": cite.get("represented_asset_value_usd"),
            "xrpl_distributed_usd": cite.get("xrpl_distributed_usd"),
            "xrpl_pct_distributed": cite.get("xrpl_pct_distributed"),
            "xrpl_represented_usd": cite.get("xrpl_represented_usd"),
            "rule": cite.get("rule"),
            "license": cite.get("license"),
        }
    else:
        snapshot["rwa_cite"] = None

    sig = _load(SOV_SIGNAL_PATH)
    if sig:
        leaf = _sov_index_leaf(sig)
        leaves.append(leaf)
        snapshot["sov_index"] = {
            "value": leaf["payload"]["value"],
            "artifact_generated": leaf["payload"]["artifact_generated"],
            "artifact_content_id": leaf["payload"]["artifact_content_id"],
            "weighted_form": leaf["payload"]["weighted_form"],
            "source_url": "https://councilof.ai/signals/sov-signal.signed.json",
        }
    else:
        snapshot["sov_index"] = None

    try:
        SNAPSHOT_PATH.parent.mkdir(parents=True, exist_ok=True)
        SNAPSHOT_PATH.write_text(json.dumps(snapshot, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    except Exception as e:
        print(f"  scoreboard: snapshot write failed: {e}", file=sys.stderr)

    return {
        "leaves": leaves,
        "sidecar": {
            "move": "daily-scoreboard",
            "n_leaves": len(leaves),
            "rwa_cite_present": cite is not None,
            "sov_signal_present": sig is not None,
            "sov_signal_generated": (sig or {}).get("generated"),
            "note": (
                "RWA public cite (archived page figures, own as_of) + SOV Index v0 "
                "(signal artifact state; weighted form UNMEASURED, never invented). "
                "Scoreboard only — no token, no trading, no issuance."
            ),
        },
    }


if __name__ == "__main__":
    out = collect()
    print(f"  {out['sidecar']['n_leaves']} scoreboard leaves "
          f"(rwa_cite={out['sidecar']['rwa_cite_present']}, sov_signal={out['sidecar']['sov_signal_present']})")
    print(f"  snapshot -> {SNAPSHOT_PATH}")
