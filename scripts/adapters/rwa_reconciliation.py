"""RWA reconciliation leaves: XRPL single-asset share + BENJI three-number.

Pure file reader of public/interop/rwa-reconciliation-2026-09/figures.json.
No network in collect(). Never raises. Missing or invalid file -> ABSENT/INVALID
sidecar with no leaves. Facts, not grades: scopes are never mixed without the
rule attached, and every number carries value + as_of + source mirror id.
"""
from __future__ import annotations

import json
from pathlib import Path
from typing import Any

REL = Path("public/interop/rwa-reconciliation-2026-09/figures.json")
PUBLIC_URL = "https://councilof.ai/interop/rwa-reconciliation-2026-09/figures.json"
PACK_URL = "https://councilof.ai/interop/rwa-reconciliation-2026-09/artefact-manifest.json"
MIRROR_BASE = "https://councilof.ai/interop/rwa-reconciliation-2026-09/mirrors/"
MAX_PAYLOAD_BYTES = 3072
SCOPE_RULE = "represented is not distributed — never mix scopes"

FORBIDDEN = ("oracle", "risk", "risky", "safe", "unsafe", "compliant",
             "non-compliant", "rating", "ratings")


def _canon(obj: Any) -> bytes:
    return json.dumps(obj, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode("utf-8")


def _repo_root(root: Any) -> Path:
    if root is not None:
        return Path(root)
    return Path(__file__).resolve().parent.parent.parent


def _num(entry: Any) -> dict[str, Any] | None:
    """Normalize a figures.json number cell; None if not a usable value."""
    if not isinstance(entry, dict):
        return None
    value = entry.get("value")
    if not isinstance(value, (int, float)) or isinstance(value, bool):
        return None
    out: dict[str, Any] = {"value": value}
    for key in ("as_of", "source", "definition", "note"):
        if entry.get(key):
            out[key] = str(entry[key])
    return out


def _check_words(leaf: dict[str, Any]) -> None:
    text = json.dumps(leaf).lower()
    for word in FORBIDDEN:
        assert f" {word} " not in f" {text} " and not text.startswith(word), word


def _leaf_jmwh(fig: dict[str, Any]) -> dict[str, Any]:
    jmwh = fig.get("jmwh") if isinstance(fig.get("jmwh"), dict) else {}
    unmeasured: list[str] = []

    dist = _num(jmwh.get("xrpl_distributed_usd"))
    if dist is None:
        unmeasured.append("xrpl_distributed_usd")
    rep = _num(jmwh.get("xrpl_represented_usd"))
    if rep is None:
        unmeasured.append("xrpl_represented_usd")

    largest_raw = jmwh.get("largest_single_asset") if isinstance(jmwh.get("largest_single_asset"), dict) else {}
    largest: dict[str, Any] | None = None
    if isinstance(largest_raw.get("represented_usd"), (int, float)) and largest_raw.get("id_or_name"):
        largest = {
            "id_or_name": str(largest_raw["id_or_name"]),
            "represented_usd": largest_raw["represented_usd"],
        }
        if isinstance(largest_raw.get("share_pct"), (int, float)):
            largest["share_pct"] = largest_raw["share_pct"]
        for key in ("as_of", "source", "platform"):
            if largest_raw.get(key):
                largest[key] = str(largest_raw[key])
    else:
        unmeasured.append("largest_single_asset")

    for item in fig.get("unmeasured") or []:
        name = str(item).split(" (")[0]
        if "jmwh" in name or "xrpl" in name or "3720000000" in name:
            unmeasured.append(name)

    as_of = None
    for cell in (rep, dist):
        if cell and cell.get("as_of"):
            as_of = cell["as_of"]
            break

    payload = {
        "kind": "csoai.rwa-concentration/0.1",
        "status": "PROBED",
        "xrpl_distributed_usd": dist,
        "xrpl_represented_usd": rep,
        "largest_single_asset": largest,
        "rule": SCOPE_RULE,
        "scope": "rwa.xyz league tables; distributed scope excludes stablecoins per publisher variant",
        "unmeasured": unmeasured,
    }
    assert len(_canon(payload)) <= MAX_PAYLOAD_BYTES, "jmwh payload over byte cap"
    sources = [PUBLIC_URL, PACK_URL]
    for cell in (dist, rep, largest):
        if cell and cell.get("source"):
            sources.append(MIRROR_BASE + cell["source"])
    leaf = {
        "surface": "public.notice",
        "subject": "XRPL RWA: distributed vs represented, single-asset concentration",
        "as_of": as_of or fig.get("generated_at"),
        "source_urls": sorted(set(sources)),
        "payload": payload,
        "unmeasured": unmeasured,
        "tags": ["subject:xrpl-rwa", "scope:distributed-vs-represented", "facts-not-grades"],
    }
    _check_words(leaf)
    return leaf


def _leaf_benji(fig: dict[str, Any]) -> dict[str, Any]:
    benji = fig.get("benji") if isinstance(fig.get("benji"), dict) else {}
    unmeasured: list[str] = []
    numbers: dict[str, Any] = {}
    for key in ("number_benji_asset_usd", "number_fobxx_fund_usd", "number_platform_usd"):
        cell = _num(benji.get(key))
        if cell is None:
            unmeasured.append(key)
        numbers[key] = cell

    for item in fig.get("unmeasured") or []:
        name = str(item).split(" (")[0]
        if any(t in name for t in ("fobxx", "benji", "bnb", "primary_register")):
            unmeasured.append(name)

    as_of = None
    for cell in numbers.values():
        if cell and cell.get("as_of"):
            as_of = cell["as_of"]

    payload = {
        "kind": "csoai.benji-reconciliation/0.1",
        "status": "PROBED",
        "number_benji_asset_usd": numbers["number_benji_asset_usd"],
        "number_fobxx_fund_usd": numbers["number_fobxx_fund_usd"],
        "number_platform_usd": numbers["number_platform_usd"],
        "why_they_diverge": (
            "Three publishers, three scopes: token-level circulating value on public "
            "chains; fund-level net assets filed with the SEC (transfer-agent books, "
            "report date lag); platform-level total across all issuer products "
            "including other funds and iBENJI. Different definitions, not a discrepancy."
        ),
        "daily_tracking": "reconciled each publisher run from figures.json",
        "unmeasured": unmeasured,
    }
    assert len(_canon(payload)) <= MAX_PAYLOAD_BYTES, "benji payload over byte cap"
    sources = [PUBLIC_URL, PACK_URL]
    for cell in numbers.values():
        if cell and cell.get("source"):
            sources.append(MIRROR_BASE + cell["source"])
    leaf = {
        "surface": "public.notice",
        "subject": "BENJI: three published numbers, three definitions",
        "as_of": as_of or fig.get("generated_at"),
        "source_urls": sorted(set(sources)),
        "payload": payload,
        "unmeasured": unmeasured,
        "tags": ["subject:benji-fobxx", "scope:three-definitions", "facts-not-grades"],
    }
    _check_words(leaf)
    return leaf


def collect(root: Any = None) -> dict[str, Any]:
    try:
        path = _repo_root(root) / REL
        if not path.is_file():
            return {"leaves": [], "sidecar": {"status": "ABSENT", "path": str(REL)}}
        try:
            fig = json.loads(path.read_bytes())
        except Exception as exc:
            return {"leaves": [], "sidecar": {"status": "INVALID", "reason": type(exc).__name__}}
        if not isinstance(fig, dict) or fig.get("schema") != "csoai.rwa-reconciliation/0.1":
            return {"leaves": [], "sidecar": {"status": "INVALID", "reason": "figures contract"}}
        leaves = [_leaf_jmwh(fig), _leaf_benji(fig)]
        return {
            "leaves": leaves,
            "sidecar": {
                "status": "PROBED",
                "generated_at": fig.get("generated_at"),
                "unmeasured_count": sum(len(l["unmeasured"]) for l in leaves),
            },
        }
    except Exception as exc:  # never raises
        return {"leaves": [], "sidecar": {"status": "ERROR", "reason": type(exc).__name__}}
