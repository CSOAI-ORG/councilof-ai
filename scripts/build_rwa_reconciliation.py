#!/usr/bin/env python3
"""Refresh the RWA reconciliation pack (TUI-3, overnight brief item 3).

Fetches the primary sources (rwa.xyz league tables + asset/platform pages,
Franklin Templeton pages), archives raw bytes with retrieval metadata, extracts
figures by NAME-MATCHED JSON paths (never positional), and rewrites
figures.json + a reconciliation table with disagreements visible.

Rules: facts, not grades. A source that fails leaves the prior cell STALE —
never zero-filled, never guessed. Scopes are never mixed: distributed and
represented are separate numbers with the rule attached. No network failure
propagates: the script always exits 0 with a report.
"""
from __future__ import annotations

import hashlib
import json
import re
import urllib.error
import urllib.request
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parent.parent
PACK = ROOT / "public" / "interop" / "rwa-reconciliation-2026-09"
MIRRORS = PACK / "mirrors"
FIGURES = PACK / "figures.json"
TABLE = PACK / "reconciliation.json"
MANIFEST = PACK / "artefact-manifest.json"
UA = {"User-Agent": "councilof-ai-watch/0.1"}
NEXT_DATA = re.compile(r'<script id="__NEXT_DATA__"[^>]*>(.*?)</script>', re.S)

SOURCES = {
    "rwa-xyz-networks.html": "https://app.rwa.xyz/networks",
    "rwa-xyz-network-xrp-ledger.html": "https://app.rwa.xyz/networks/xrp-ledger",
    "rwa-xyz-asset-jmwh.html": "https://app.rwa.xyz/assets/JMWH",
    "rwa-xyz-asset-benji.html": "https://app.rwa.xyz/assets/BENJI",
    "rwa-xyz-platform-franklin-benji.html": "https://app.rwa.xyz/platforms/franklin-templeton-benji-investments",
    "franklintempleton-benji-platform.html": "https://www.franklintempleton.com/investments/options/money-market-funds/products/29386/SINGLCLASS/franklin-onchain-u-s-government-money-fund/FOBXX",
    "franklintempleton-fobxx-fund.html": "https://www.franklintempleton.com/investments/options/money-market-funds/products/29386/SINGLCLASS/franklin-onchain-u-s-government-money-fund/FOBXX",
}


def _now() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def fetch(url: str) -> tuple[bytes | None, int | None, str | None]:
    req = urllib.request.Request(url, headers=UA)
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            return r.read(), r.status, None
    except urllib.error.HTTPError as e:
        try:
            return e.read(), e.code, None
        except Exception:
            return None, e.code, None
    except Exception as e:
        return None, None, f"{type(e).__name__}: {e}"


def archive(mid: str, role: str, url: str, body: bytes, http: int | None, ts: str) -> dict:
    (MIRRORS / mid).write_bytes(body)
    meta = {
        "id": mid, "role": role, "source_url": url, "fetched_at": ts,
        "http": http, "bytes": len(body), "sha256": hashlib.sha256(body).hexdigest(),
    }
    (MIRRORS / (mid + ".meta.json")).write_text(json.dumps(meta, indent=2, sort_keys=True) + "\n")
    return meta


def next_data(body: bytes) -> dict | None:
    m = NEXT_DATA.search(body.decode("utf-8", errors="replace"))
    if not m:
        return None
    try:
        return json.loads(m.group(1))
    except Exception:
        return None


def xrpl_row(nd: dict, tab: str, scope: str) -> float | None:
    try:
        tables = nd["props"]["pageProps"][tab][scope]
        network_table = next(
            item for item in tables
            if isinstance(item, dict) and item.get("key") == "parent_networks"
        )
        rows = network_table["data"]["rows"]
        for r in rows:
            if isinstance(r, dict) and (r.get("group") or {}).get("name") == "XRP Ledger":
                return r.get("value")
    except Exception:
        return None
    return None


def issuer_row(nd: dict, name: str) -> dict | None:
    try:
        for r in nd["props"]["pageProps"]["network"]["issuer_stats"]:
            if isinstance(r, dict) and name.lower() in json.dumps(r.get("issuer") or r.get("name") or "").lower():
                return r
    except Exception:
        return None
    return None


def cell(value: Any, definition: str, source: str, as_of: str, **extra: Any) -> dict:
    out = {"value": value, "definition": definition, "as_of": as_of, "source": source}
    out.update({k: v for k, v in extra.items() if v})
    return out


def main() -> int:
    ts = _now()
    prior = json.loads(FIGURES.read_text()) if FIGURES.is_file() else {}
    report = {"refreshed_at": ts, "sources_ok": [], "sources_failed": [], "changed": [], "stale_kept": []}
    manifest_meta = []

    bodies: dict[str, bytes] = {}
    nds: dict[str, dict | None] = {}
    for mid, url in SOURCES.items():
        body, http, err = fetch(url)
        if body is None or http is None or not 200 <= http < 300:
            report["sources_failed"].append({"id": mid, "url": url, "error": err, "http": http})
            # Never overwrite the last good mirror with an HTTP error body.
            # The report carries the failure status and the prior cell stays STALE.
            continue
        report["sources_ok"].append({"id": mid, "http": http, "bytes": len(body)})
        role = "aggregator-source" if mid.startswith("rwa-xyz-") else "issuer-source"
        manifest_meta.append(archive(mid, role, url, body, http, ts))
        bodies[mid] = body
        nds[mid] = next_data(body) if mid.endswith(".html") else None

    fig: dict[str, Any] = {
        "schema": "csoai.rwa-reconciliation/0.1",
        "generated_at": ts,
        "brief_reference": prior.get("brief_reference"),
        "jmwh": {}, "benji": {}, "unmeasured": list(prior.get("unmeasured") or []),
        "sources": ["artefact-manifest.json"],
    }

    def keep_prior(path: list[str], note: str) -> Any:
        node = prior
        for k in path:
            node = (node or {}).get(k) if isinstance(node, dict) else None
        if node is not None:
            node = dict(node)
            node["state"] = "STALE"
            node["stale_note"] = note
            report["stale_kept"].append(".".join(path))
        return node

    nd_net = nds.get("rwa-xyz-networks.html")
    if nd_net:
        dist = xrpl_row(nd_net, "leagueTableTabsWithoutStablecoins", "distributed")
        dist_incl = xrpl_row(nd_net, "leagueTableTabs", "distributed")
        rep = xrpl_row(nd_net, "leagueTableTabs", "represented")
        if dist is not None:
            fig["jmwh"]["xrpl_distributed_usd"] = cell(
                dist, "rwa.xyz networks league table, distributed scope, stablecoins excluded",
                "rwa-xyz-networks.html", ts[:10])
        else:
            fig["jmwh"]["xrpl_distributed_usd"] = keep_prior(["jmwh", "xrpl_distributed_usd"], "path not found in fresh page")
        if dist_incl is not None:
            fig["jmwh"]["xrpl_distributed_incl_stablecoins_usd"] = cell(
                dist_incl, "same league table, stablecoin-inclusive variant", "rwa-xyz-networks.html", ts[:10])
        if rep is not None:
            fig["jmwh"]["xrpl_represented_usd"] = cell(
                rep, "rwa.xyz networks league table, represented scope", "rwa-xyz-networks.html", ts[:10])
        else:
            fig["jmwh"]["xrpl_represented_usd"] = keep_prior(["jmwh", "xrpl_represented_usd"], "path not found in fresh page")
    else:
        for k in ("xrpl_distributed_usd", "xrpl_represented_usd"):
            fig["jmwh"][k] = keep_prior(["jmwh", k], "networks page unfetchable or unparseable")

    nd_xrpl = nds.get("rwa-xyz-network-xrp-ledger.html")
    nd_jmwh = nds.get("rwa-xyz-asset-jmwh.html")
    justoken = issuer_row(nd_xrpl, "justoken") if nd_xrpl else None
    jmwh_asset_val = None
    jmwh_address = None
    if nd_jmwh:
        try:
            tokens = nd_jmwh["props"]["pageProps"]["asset"]["tokens"]
            xrpl_token = next(
                token for token in tokens
                if isinstance(token, dict)
                and ((token.get("network") or {}).get("name") == "XRP Ledger")
            )
            jmwh_asset_val = xrpl_token["total_asset_value_dollar"]["val"]
            jmwh_address = xrpl_token.get("address")
        except Exception:
            jmwh_asset_val = None
    rep_total = (fig["jmwh"].get("xrpl_represented_usd") or {}).get("value")
    justoken_val = None
    if justoken:
        justoken_val = ((justoken.get("bridged_token_value_dollar") or {}).get("val"))
    chosen = justoken_val or jmwh_asset_val
    if chosen is not None:
        share = round(chosen / rep_total * 100, 2) if rep_total else None
        fig["jmwh"]["largest_single_asset"] = {
            # Keep the established adapter contract. This is intentionally
            # represented_usd, not the generic value key used by scalar cells.
            "id_or_name": "JMWH",
            "represented_usd": chosen,
            "share_pct": share,
            "as_of": ts[:10],
            "source": "rwa-xyz-network-xrp-ledger.html" if justoken_val else "rwa-xyz-asset-jmwh.html",
            "platform": "Justoken",
            "crosscheck": ("network issuer_stats row and asset page agree"
                           if justoken_val and jmwh_asset_val and abs(justoken_val - jmwh_asset_val) < 1 else None),
        }
        if jmwh_address:
            fig["jmwh"]["largest_single_asset"]["xrpl_address"] = jmwh_address
    else:
        fig["jmwh"]["largest_single_asset"] = keep_prior(["jmwh", "largest_single_asset"], "JMWH paths not found")

    nd_benji = nds.get("rwa-xyz-asset-benji.html")
    if nd_benji:
        try:
            v = nd_benji["props"]["pageProps"]["asset"]["circulating_asset_value_dollar"]["val"]
            fig["benji"]["number_benji_asset_usd"] = cell(
                v, "rwa.xyz circulating asset value of the BENJI token, aggregate across the public chains listed",
                "rwa-xyz-asset-benji.html", ts[:10],
                crosscheck=(prior.get("benji", {}).get("number_benji_asset_usd", {}) or {}).get("crosscheck"))
        except Exception:
            fig["benji"]["number_benji_asset_usd"] = keep_prior(["benji", "number_benji_asset_usd"], "benji asset path missing")
    else:
        fig["benji"]["number_benji_asset_usd"] = keep_prior(["benji", "number_benji_asset_usd"], "benji page unfetchable")

    # SEC N-MFP3 fund figure: monthly filing cadence; the archived 2026-08-31
    # report is the latest filed. Not re-fetched on a daily refresh.
    fig["benji"]["number_fobxx_fund_usd"] = keep_prior(["benji", "number_fobxx_fund_usd"],
        "SEC N-MFP3 files monthly; archived 2026-08-31 report remains the latest filing") \
        or (prior.get("benji", {}) or {}).get("number_fobxx_fund_usd")

    nd_plat = nds.get("rwa-xyz-platform-franklin-benji.html")
    if nd_plat:
        try:
            # Platform total is a named root field. Do not take the first
            # asset-class row: that would turn ordering into evidence.
            v = nd_plat["props"]["pageProps"]["platform"]["circulating_asset_value_dollar"]["val"]
            fig["benji"]["number_platform_usd"] = cell(
                v, "rwa.xyz platform total for Franklin Templeton Benji Investments across all listed platform assets",
                "rwa-xyz-platform-franklin-benji.html", ts[:10])
        except Exception:
            fig["benji"]["number_platform_usd"] = keep_prior(["benji", "number_platform_usd"], "platform path missing")
    else:
        fig["benji"]["number_platform_usd"] = keep_prior(["benji", "number_platform_usd"], "platform page unfetchable")

    # Reconciliation table: brief vs prior vs current, disagreements visible.
    rows = []
    brief = (prior.get("brief_reference") or {})
    pairs = [
        ("xrpl_distributed_usd", brief.get("g33_xrpl_distributed_usd"), fig["jmwh"].get("xrpl_distributed_usd")),
        ("xrpl_represented_usd", brief.get("g33_xrpl_represented_usd"), fig["jmwh"].get("xrpl_represented_usd")),
        ("jmwh_represented_usd", brief.get("g33_jmwh_represented_usd"), fig["jmwh"].get("largest_single_asset")),
        ("benji_asset_usd", brief.get("g34_benji_asset_usd"), fig["benji"].get("number_benji_asset_usd")),
        ("fobxx_fund_usd", brief.get("g34_fobxx_fund_usd"), fig["benji"].get("number_fobxx_fund_usd")),
        ("platform_usd", brief.get("g34_platform_usd"), fig["benji"].get("number_platform_usd")),
    ]
    for name, brief_val, cur in pairs:
        cur_val = (cur or {}).get("value") if isinstance(cur, dict) else None
        state = "OBSERVED" if cur_val is not None and (cur or {}).get("state") != "STALE" else (
            "STALE" if cur_val is not None else "UNMEASURED")
        row = {
            "metric": name,
            "brief_figure": brief_val,
            "current_figure": cur_val,
            "as_of": (cur or {}).get("as_of") if isinstance(cur, dict) else None,
            "source": (cur or {}).get("source") if isinstance(cur, dict) else None,
            "state": state,
            "delta_vs_brief_pct": (round((cur_val - brief_val) / brief_val * 100, 2)
                                   if isinstance(brief_val, (int, float)) and brief_val and cur_val is not None else None),
            "note": None if brief_val is None or cur_val is None else (
                "brief figure reproduced within rounding" if abs((cur_val - brief_val) / max(brief_val, 1)) < 0.02
                else "brief figure NOT reproduced — current archived figure governs"),
        }
        rows.append(row)
    table = {
        "schema": "csoai.rwa-reconciliation-table/0.1",
        "generated_at": ts,
        "rule": "represented is not distributed — never mix scopes",
        "state_vocabulary": ["OBSERVED", "STALE", "UNMEASURED", "UNCHECKABLE"],
        "rows": rows,
        "report": report,
    }

    FIGURES.write_text(json.dumps(fig, indent=1, sort_keys=True) + "\n")
    TABLE.write_text(json.dumps(table, indent=1, sort_keys=True) + "\n")

    # Manifest: all committed mirror sidecars.
    artefacts = []
    for mp in sorted(MIRRORS.glob("*.meta.json")):
        try:
            artefacts.append(json.loads(mp.read_bytes()))
        except Exception:
            continue
    MANIFEST.write_text(json.dumps(
        {"schema": "csoai.artefact-manifest/0.1", "pack": "rwa-reconciliation-2026-09",
         "as_of": ts, "artefacts": artefacts}, indent=2, sort_keys=True) + "\n")

    print(json.dumps(report, indent=1, sort_keys=True))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
