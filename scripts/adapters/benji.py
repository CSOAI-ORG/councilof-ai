"""BENJI/FOBXX public layer. Public explorers and dated notices only.

No Franklin GraphQL. Stellar toml HAVE, XRPL toml ABSENT. Not issuer 7.
SEC staff no-action 12 Aug 2026 + HashKey Earn 24 Aug 2026 notices.
"""
from __future__ import annotations

import hashlib
import urllib.error
import urllib.request
from typing import Any

UA = "csoai-public-root-writer/0 (+https://councilof.ai/root.json)"

SEC_NOTICE = (
    "https://www.theblock.co/news/defi/2026-08-12-sec-clears-franklin-templeton-"
    "funds-use-onchain-benji-system-cash-management-411654"
)
HASHKEY_NOTICE = (
    "https://www.cryptotimes.io/2026/08/25/hashkey-exchange-brings-franklin-"
    "templetons-grbenji-tokenized-fund-to-asia/"
)
STELLAR_TOML = "https://www.franklintempleton.com/.well-known/stellar.toml"

CHAINS_CLAIMED_PUBLIC = ["Stellar", "Polygon", "Avalanche", "Base", "Arbitrum", "Aptos"]


def _get(url: str, timeout: int = 15) -> tuple[int, bytes]:
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            return int(resp.status), resp.read()
    except urllib.error.HTTPError as e:
        return int(e.code), e.read() if e.fp else b""
    except Exception as e:
        return 0, str(e).encode("utf-8")


def collect() -> dict[str, Any]:
    stellar_code, _ = _get(STELLAR_TOML)
    stellar_have = stellar_code == 200
    unmeasured_supply = ["onchain_supply_per_chain", "dune_query", "graphql", "xrpl_toml"]
    if not stellar_have:
        unmeasured_supply.append("stellar_toml_body")

    supply_sources = [SEC_NOTICE]
    if stellar_have:
        supply_sources.append(STELLAR_TOML)

    supply = {
        "surface": "benji.onchain.supply",
        "subject": "BENJI/FOBXX on-chain supply (public layer)",
        "as_of": "2026-08-31T07:38:20Z",
        "source_urls": supply_sources,
        "payload": {
            "chains_claimed_public": CHAINS_CLAIMED_PUBLIC,
            "graphql": "DARK",
            "xrpl_toml": "ABSENT",
            "stellar_toml": "HAVE" if stellar_have else "UNMEASURED",
            "stellar_toml_http": stellar_code,
            "not_issuer_7": True,
        },
        "unmeasured": unmeasured_supply,
        "tags": ["jurisdiction:US", "framework:sec-staff-no-action", "subject:BENJI"],
    }

    sec = {
        "surface": "public.notice",
        "subject": (
            "SEC staff no-action (12 Aug 2026) — Franklin registered funds "
            "may hold BENJI/FOBXX for cash management"
        ),
        "as_of": "2026-08-31T07:38:20Z",
        "source_urls": [SEC_NOTICE],
        "payload": {
            "note": "Public reporting of a staff no-action letter. Not a rule. GraphQL dark. Not a CSOAI client. Do not quote AUM as audited.",
            "status": "public_notice",
            "who": ["Franklin Templeton"],
            "url_sha256": hashlib.sha256(SEC_NOTICE.encode("utf-8")).hexdigest(),
        },
        "unmeasured": ["sec_gov_pdf", "onchain_supply", "graphql"],
        "tags": [
            "jurisdiction:US",
            "framework:sec-staff-no-action",
            "coverage:public-notice-only",
        ],
    }

    hashkey = {
        "surface": "public.notice",
        "subject": "HashKey Earn listing of grBENJI (24 Aug 2026 notice) — professional investors only",
        "as_of": "2026-08-31T07:38:20Z",
        "source_urls": [HASHKEY_NOTICE],
        "payload": {
            "note": "Public product notice. No external wallet deposit/withdraw/transfer on that venue per reporting. GraphQL dark.",
            "status": "public_notice",
            "who": ["Franklin Templeton"],
            "url_sha256": hashlib.sha256(HASHKEY_NOTICE.encode("utf-8")).hexdigest(),
        },
        "unmeasured": ["hashkey_primary_press_pdf", "onchain_supply", "graphql"],
        "tags": [
            "jurisdiction:US",
            "framework:sec-staff-no-action",
            "coverage:public-notice-only",
        ],
    }

    return {
        "leaves": [supply, sec, hashkey],
        "sidecar": {
            "graphql": "DARK",
            "xrpl_toml": "ABSENT",
            "stellar_toml_http": stellar_code,
            "not_issuer_7": True,
            "franklin_graphql": False,
        },
    }
