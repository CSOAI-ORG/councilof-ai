"""Public-notice cards: SWIFT 17-bank cohort + transfer notices.

Cohort names are TARGETS, not clients. Never 'partnered with SWIFT'.
Never '17-banks-on-our-feed'. Settlement still off-chain.
Locked URLs are hashed; press HTML body may be UNCHECKABLE.
"""
from __future__ import annotations

import hashlib
from typing import Any

SWIFT_PRESS = (
    "https://www.swift.com/news-events/press-releases/"
    "swifts-blockchain-ledger-ready-use-17-banks-set-pioneer-"
    "tokenised-cross-border-payments-trusted-global-infrastructure"
)

COHORT_17 = [
    "ANZ",
    "BNP Paribas",
    "BNY",
    "Citi",
    "DBS",
    "FAB",
    "FirstRand",
    "HSBC",
    "Itaú",
    "Lloyds",
    "Mashreq",
    "MUFG",
    "OCBC",
    "Standard Chartered",
    "UBS",
    "UOB",
    "Wells Fargo",
]

# Dated public notices. as_of is the walk that first locked the URL, not a live poll.
NOTICES: list[dict[str, Any]] = [
    {
        "subject": "SWIFT shared-ledger 17-bank cohort (9 Jul 2026 press)",
        "as_of": "2026-08-31T07:38:20Z",
        "source_urls": [SWIFT_PRESS],
        "payload": {
            "currency": None,
            "note": "TARGETS not clients. Press HTML body UNCHECKABLE from this host (timeout). Settlement off-chain.",
            "settlement": "off_chain",
            "settlement_still_off_chain": True,
            "status": "pilot_cohort_17",
            "who": COHORT_17,
            "url_sha256": hashlib.sha256(SWIFT_PRESS.encode("utf-8")).hexdigest(),
        },
        "unmeasured": ["press_html_body", "currency"],
        "tags": [
            "framework:swift-public-press",
            "coverage:TARGETS-not-clients",
            "settlement:off-chain",
        ],
    },
    {
        "subject": "HSBC–Standard Chartered tokenised transfer (public notice ~19 Aug 2026)",
        "as_of": "2026-08-31T07:38:20Z",
        "source_urls": [SWIFT_PRESS],
        "payload": {
            "currency": None,
            "note": "Public reporting of a confirmed transfer. Settlement still off-chain. Not a CSOAI client.",
            "settlement": "off_chain",
            "settlement_still_off_chain": True,
            "status": "live_transfer_confirmed",
            "who": ["HSBC", "Standard Chartered"],
            "url_sha256": hashlib.sha256(SWIFT_PRESS.encode("utf-8")).hexdigest(),
        },
        "unmeasured": ["iso20022_message", "settlement_rail_bytes", "currency"],
        "tags": [
            "framework:swift-public-press",
            "coverage:TARGETS-not-clients",
            "settlement:off-chain",
        ],
    },
    {
        "subject": "UOB–HSBC HKD tokenised transfer (public notice ~28 Aug 2026)",
        "as_of": "2026-08-31T07:38:20Z",
        "source_urls": [SWIFT_PRESS],
        "payload": {
            "currency": None,
            "note": "Public reporting. Settlement still off-chain. Not a CSOAI client.",
            "settlement": "off_chain",
            "settlement_still_off_chain": True,
            "status": "live_transfer_confirmed",
            "who": ["UOB", "HSBC"],
            "url_sha256": hashlib.sha256(SWIFT_PRESS.encode("utf-8")).hexdigest(),
        },
        "unmeasured": ["iso20022_message", "settlement_rail_bytes", "currency"],
        "tags": [
            "framework:swift-public-press",
            "coverage:TARGETS-not-clients",
            "settlement:off-chain",
        ],
    },
]


def collect() -> dict[str, Any]:
    leaves = []
    for n in NOTICES:
        leaves.append(
            {
                "surface": "public.notice",
                "subject": n["subject"],
                "as_of": n["as_of"],
                "source_urls": list(n["source_urls"]),
                "payload": dict(n["payload"]),
                "unmeasured": list(n["unmeasured"]),
                "tags": list(n["tags"]),
            }
        )
    return {
        "leaves": leaves,
        "sidecar": {
            "swift_partnered": False,
            "seventeen_banks_on_our_feed": False,
            "cohort_are_clients": False,
            "note": "One hashed press URL covering a 17-name TARGETS cohort, plus two transfer notices. Not clients. Settlement still off-chain.",
        },
    }
