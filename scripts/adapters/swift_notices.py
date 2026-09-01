"""Public-notice cards: one UNMEASURED coverage card per SWIFT 17-bank TARGET.

Cohort names are TARGETS, not clients. Never 'partnered with SWIFT'.
Never '17-banks-on-our-feed'. Settlement still off-chain.
Official press URL is hashed; press HTML body may be UNCHECKABLE.
Not a GPI firehose.
"""
from __future__ import annotations

import hashlib
from typing import Any

SWIFT_PRESS = (
    "https://www.swift.com/news-events/press-releases/"
    "swifts-blockchain-ledger-ready-use-17-banks-set-pioneer-"
    "tokenised-cross-border-payments-trusted-global-infrastructure"
)

PRESS_SHA256 = hashlib.sha256(SWIFT_PRESS.encode("utf-8")).hexdigest()

# Official 9 Jul 2026 shared-ledger pioneer cohort. TARGETS, not clients.
COHORT_17 = [
    "ANZ",
    "BNP Paribas",
    "BNY",
    "Citi",
    "DBS",
    "FAB / First Abu Dhabi Bank",
    "FirstRand Bank Limited",
    "HSBC",
    "Itaú Unibanco",
    "Lloyds Bank",
    "Mashreq",
    "MUFG Bank",
    "OCBC",
    "Standard Chartered",
    "UBS",
    "UOB",
    "Wells Fargo",
]


def _card(bank: str) -> dict[str, Any]:
    return {
        "surface": "public.notice",
        "subject": f"SWIFT shared-ledger TARGET: {bank} (9 Jul 2026 press)",
        "as_of": "2026-08-31T07:38:20Z",
        "source_urls": [SWIFT_PRESS],
        "payload": {
            "bank": bank,
            "kind": "gspc.coverage-card/0.1",
            "status": "UNMEASURED",
            "n": 0,
            "not_a_grade": True,
            "not_a_client": True,
            "settlement": "off_chain",
            "settlement_still_off_chain": True,
            "note": (
                "TARGET not client. Official public notice hashed. "
                "Tokenised deposits orchestrated 24/7; final settlement still "
                "through existing systems. Not a GPI firehose."
            ),
            "url_sha256": PRESS_SHA256,
        },
        "unmeasured": [
            "press_html_body",
            "iso20022_message",
            "settlement_rail_bytes",
            "gpi_firehose",
        ],
        "tags": [
            "framework:swift-public-press",
            "coverage:TARGETS-not-clients",
            "coverage:UNMEASURED",
            "settlement:off-chain",
        ],
    }


def collect() -> dict[str, Any]:
    leaves = [_card(bank) for bank in COHORT_17]
    if len(leaves) != 17:
        raise RuntimeError("SWIFT coverage must be 17 cards, one bank each")
    return {
        "leaves": leaves,
        "sidecar": {
            "swift_partnered": False,
            "seventeen_banks_on_our_feed": False,
            "cohort_are_clients": False,
            "gpi_firehose": False,
            "n_cards": 17,
            "settlement_still_off_chain": True,
            "press_url_sha256": PRESS_SHA256,
            "note": (
                "17 UNMEASURED coverage cards, one TARGET each, hashing the "
                "9 Jul 2026 official press URL. Not clients. Settlement still off-chain."
            ),
        },
    }
