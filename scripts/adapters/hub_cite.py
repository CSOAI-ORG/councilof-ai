"""Hub census + GSPC board cites for publisher-health.json only.

Do NOT emit hub.census.digest or gspc.board.cite as card-v0 surfaces
(schema frozen: xrpl.asset.state | xrpl.basket.root | public.notice | benji.onchain.supply).
A Hub listing is DISCOVERED, not a grade. Never stamp MEASURED.
"""
from __future__ import annotations

import json
import urllib.error
import urllib.request
from pathlib import Path
from typing import Any

UA = "csoai-public-root-writer/0 (+https://councilof.ai/root.json)"
GSPC_URL = "https://councilof.ai/api/gspc"


def _get(url: str, timeout: int = 20) -> tuple[int, Any]:
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": "application/json"})
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            raw = resp.read()
            try:
                return int(resp.status), json.loads(raw.decode("utf-8"))
            except Exception:
                return int(resp.status), None
    except urllib.error.HTTPError as e:
        return int(e.code), None
    except Exception:
        return 0, None


def collect(repo_root: Path) -> dict[str, Any]:
    census_path = repo_root / "public" / "signed" / "hub-census-baseline.json"
    hub: dict[str, Any] = {
        "kind": "cite",
        "surface_not_on_card_v0": "hub.census.digest",
        "status": "UNMEASURED",
        "listing_state": "DISCOVERED",
        "note": "Cited in publisher-health.json / status only. Not a card-v0 leaf. Not MEASURED.",
    }
    if census_path.is_file():
        doc = json.loads(census_path.read_text(encoding="utf-8"))
        hub.update(
            {
                "as_of": doc.get("as_of"),
                "n": doc.get("n"),
                "n_unique_ids": doc.get("n_unique_ids"),
                "n_measured": doc.get("n_measured"),
                "sha256_jsonl": doc.get("sha256_jsonl"),
                "complete": doc.get("complete"),
                "source": "public/signed/hub-census-baseline.json",
            }
        )
    else:
        hub["unmeasured"] = ["hub-census-baseline.json"]

    code, gspc = _get(GSPC_URL)
    board: dict[str, Any] = {
        "kind": "cite",
        "surface_not_on_card_v0": "gspc.board.cite",
        "source": GSPC_URL,
        "http": code,
        "note": "Cited in publisher-health.json / status only. Not a card-v0 leaf. This writer does not write /api/gspc.",
    }
    if isinstance(gspc, dict):
        totals = gspc.get("totals") or {}
        board.update(
            {
                "totals_axes": totals.get("axes"),
                "totals_measured_axes": totals.get("measured_axes"),
                "totals_unmeasured_axes": totals.get("unmeasured_axes"),
                "public_count": totals.get("public_count"),
                "measured_on": gspc.get("measured_on"),
            }
        )
    else:
        board["unmeasured"] = ["api.gspc"]

    return {
        "leaves": [],
        "sidecar": {
            "hub.census.digest": hub,
            "gspc.board.cite": board,
        },
    }
