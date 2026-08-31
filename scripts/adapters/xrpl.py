"""xrpl.fi identity-verified issued assets — locked 16, never a silent expand.

Coverage of public XRPL instruments. Not a mill. Not 377. Not clients.
Missing issuer address this hour → UNMEASURED[] on that card, not omitted.
Represented TVL is a sidecar (publisher-health), never a grade on a leaf.
AAULF / TBILL are watchlist extras only.
"""
from __future__ import annotations

import json
import urllib.error
import urllib.request
from typing import Any

METRICS_URL = "https://xrpl.fi/api/metrics"
UA = "csoai-public-root-writer/0 (+https://councilof.ai/root.json)"

# Locked 16 from sheet 07. Do not silently expand.
LOCKED_16: list[dict[str, str]] = [
    {"symbol": "RLUSD", "issuer_address": "rMxCKbEDwqr76QuheSUMdEGf4B9xJ8m5De"},
    {"symbol": "OUSG", "issuer_address": "rHuiXXjHLpMP8ZE9sSQU5aADQVWDwv6h5p"},
    {"symbol": "USDB", "issuer_address": "rB3y9EPnq1ZrZP3aXgfyfdXQThzdXMrLMc"},
    {"symbol": "BBRL", "issuer_address": "rH5CJsqvNqZGxrMyGaqLEoMWRYcVTAPZMt"},
    {"symbol": "EURCV", "issuer_address": "rUNaS5sqRuxZz6V7rBGhoSaZiVYA3ut4UL"},
    {"symbol": "USD.bs", "issuer_address": "rvYAfWj5gh67oV6fW32ZzP3Aw4Eubs59B"},
    {"symbol": "EUR.bs", "issuer_address": "rvYAfWj5gh67oV6fW32ZzP3Aw4Eubs59B"},
    {"symbol": "USD.gh", "issuer_address": "rhub8VRN55s94qWKDv6jmDy1pUykJzF3wq"},
    {"symbol": "USDC", "issuer_address": "rGm7WCVp9gb4jZHWTEtGUr4dd74z2XuWhE"},
    {"symbol": "EUR.gh", "issuer_address": "rhub8VRN55s94qWKDv6jmDy1pUykJzF3wq"},
    {"symbol": "EURQ", "issuer_address": "rDk1xiArDMjDqnrR2yWypwQAKg4mKnQYvs"},
    {"symbol": "USDQ", "issuer_address": "rDk1xiArDMjDqnrR2yWypwQAKg4mKnQYvs"},
    {"symbol": "EURØP", "issuer_address": "rMkEuRii9w9uBMQDnWV5AA43gvYZR9JxVK"},
    {"symbol": "XAU.gh", "issuer_address": "rcoef87SYMJ58NAFx7fNM5frVknmvHsvJ"},
    {"symbol": "GBP.gh", "issuer_address": "r4GN9eEoz9K4BhMQXe4H1eYNtvtkwGdt8g"},
    {"symbol": "PSC", "issuer_address": "rwekfW4MiS5yZjXASRBDzzPPWYKuHvKP7E"},
]

# Watchlist extras — NOT in the 16. toml failures this hour.
WATCHLIST: list[dict[str, Any]] = [
    {
        "symbol": "AAULF",
        "issuer": "Archax",
        "issuer_address": "rKCu4CucpepQ6N89c8T5GuX2jkxzCST18Q",
        "toml": 403,
        "in_locked_16": False,
        "note": "watchlist extra; not a silent expand of the 16",
    },
    {
        "symbol": "TBILL",
        "issuer_address": "rJNE2NNz83GJYtWVLwMvchDWEon3huWnFn",
        "toml": 404,
        "in_locked_16": False,
        "note": "watchlist extra; not a silent expand of the 16",
    },
]

LOCKED_SYMBOLS = [row["symbol"] for row in LOCKED_16]


def _get(url: str, timeout: int = 20) -> tuple[int, bytes]:
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": "application/json"})
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            return int(resp.status), resp.read()
    except urllib.error.HTTPError as e:
        return int(e.code), e.read() if e.fp else b""
    except Exception as e:
        return 0, str(e).encode("utf-8")


def fetch_metrics() -> dict[str, Any]:
    code, raw = _get(METRICS_URL)
    if code != 200:
        return {
            "ok": False,
            "http": code,
            "unmeasured": ["xrpl.fi/api/metrics"],
            "assets": [],
            "assetCount": None,
            "updatedAt": None,
            "totalTvl": None,
        }
    data = json.loads(raw.decode("utf-8"))
    data["ok"] = True
    data["http"] = 200
    return data


def _match(asset: dict[str, Any], symbol: str, issuer_address: str) -> bool:
    sym = asset.get("symbol") or asset.get("currency") or ""
    addr = asset.get("issuerAddress") or asset.get("issuer_address") or ""
    return sym == symbol and (not issuer_address or addr == issuer_address)


def collect() -> dict[str, Any]:
    metrics = fetch_metrics()
    assets = metrics.get("assets") or []
    as_of = metrics.get("updatedAt")
    leaves: list[dict[str, Any]] = []
    for locked in LOCKED_16:
        symbol = locked["symbol"]
        want_addr = locked["issuer_address"]
        hit = next((a for a in assets if _match(a, symbol, want_addr)), None)
        if hit is None:
            hit = next((a for a in assets if (a.get("symbol") or a.get("currency")) == symbol), None)
        unmeasured: list[str] = []
        issuer_address = want_addr
        if hit is None:
            unmeasured.extend(["xrpl.fi_row", "holders", "supply", "verified_via"])
            payload = {
                "asset_class": None,
                "holders": None,
                "issuer": None,
                "issuer_address": issuer_address or None,
                "kind": "distributed",
                "source": "xrpl.fi/api/metrics",
                "supply": None,
                "symbol": symbol,
                "verified_domain": None,
                "verified_via": None,
            }
            if not issuer_address:
                unmeasured.append("issuer_address")
                payload["issuer_address"] = None
        else:
            issuer_address = hit.get("issuerAddress") or want_addr
            if not issuer_address:
                unmeasured.append("issuer_address")
            via = hit.get("verifiedVia")
            domain = hit.get("verifiedDomain")
            if via != "Bidirectional domain match":
                unmeasured.append("strict_two_way_toml")
            payload = {
                "asset_class": hit.get("assetClass"),
                "holders": hit.get("holders"),
                "issuer": hit.get("issuer"),
                "issuer_address": issuer_address or None,
                "kind": "distributed",
                "source": "xrpl.fi/api/metrics",
                "supply": hit.get("supply"),
                "symbol": symbol,
                "verified_domain": domain,
                "verified_via": via,
            }
            for field in ("holders", "supply", "issuer", "asset_class"):
                if payload.get(field) is None:
                    unmeasured.append(field)
        leaves.append(
            {
                "surface": "xrpl.asset.state",
                "subject": f"XRPL {symbol} public state",
                "as_of": as_of,
                "source_urls": [METRICS_URL],
                "payload": payload,
                "unmeasured": unmeasured,
                "tags": [
                    "reg.tag:public-ledger",
                    "framework:xrpl",
                    "jurisdiction:permissionless",
                ],
            }
        )
    tvl = metrics.get("totalTvl")
    return {
        "leaves": leaves,
        "sidecar": {
            "xrpl_fi_assetCount": metrics.get("assetCount"),
            "xrpl_fi_updatedAt": as_of,
            "xrpl_asset_count_attempted": 16,
            "represented_tvl": {
                "usd": tvl,
                "source": METRICS_URL,
                "note": "xrpl.fi totalTvl quote. Represented TVL is separate from the 16 leaves. Not a CSOAI grade. Not MEASURED.",
            },
            "watchlist": WATCHLIST,
            "metrics_ok": bool(metrics.get("ok")),
            "metrics_http": metrics.get("http"),
        },
    }
