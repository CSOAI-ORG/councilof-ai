#!/usr/bin/env python3
"""TUI-3 independent verification using the ESTATE'S OWN verifier.

Runs harness/gspc-top100/verify_card.py (three-state: VALID/INVALID/UNCHECKABLE)
over all 335 index cards and all 36 PR#1888 signed cards.

Third-party check: this script is not the estate's; it imports the estate's
verifier and reports only what that verifier returns.
"""
from __future__ import annotations

import hashlib
import json
import sys
import urllib.request
from collections import Counter

sys.path.insert(0, "/tmp/hcheck/harness/gspc-top100")
import verify_card as VC  # noqa: E402

UA = {"User-Agent": "CSOAI-TUI3-verify/1.0"}


def get(url: str) -> bytes:
    return urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=20).read()


def main() -> None:
    did_doc = json.loads(get("https://csoai.org/.well-known/did.json"))
    index = json.loads(get("https://councilof.ai/signed/card_index.json"))
    index_cards = index.get("cards", [])

    # ---- 335 index cards -------------------------------------------------
    idx_counts: Counter[str] = Counter()
    idx_bad: list[str] = []
    for entry in index_cards:
        sha = entry["card"]
        blob = get(f"https://councilof.ai/signed/cards/{sha}.json")
        state, reason = VC.verify_signed_card_with_did_doc(blob, did_doc)
        idx_counts[state] += 1
        if state != "VALID":
            idx_bad.append(f"{sha[:16]}… {state}: {reason}")

    # ---- 36 PR#1888 signed cards -----------------------------------------
    files = [
        "signed-affect-6bc329116310.json", "signed-affect-85fca257687a.json",
        "signed-art5-saf-7a99ce4329a0.json", "signed-art5-saf-e48806d33c62.json",
        "signed-art5-saf-f5937fb2444e.json", "signed-care-21d911b70cd7.json",
        "signed-care-9cadd5fbfdfd.json", "signed-care-fa15999eda7a.json",
        "signed-conforma-a246bbf44e14.json", "signed-continui-e75c90266a19.json",
        "signed-cross-re-09b060be7116.json", "signed-cross-re-18ae9f34b41a.json",
        "signed-cross-re-95281acd503b.json", "signed-cross-re-d2c2cdb2c057.json",
        "signed-detector-31ed36ce58e2.json", "signed-detector-7ab4482bcb2c.json",
        "signed-detector-919268db7805.json", "signed-detector-ecc8c60c6991.json",
        "signed-governan-86b7771af006.json", "signed-governan-d55a4a676f7f.json",
        "signed-jail-103d69855ec5.json", "signed-jail-2c1cc82faa60.json",
        "signed-jail-2c4eba358370.json", "signed-jail-4a0862211589.json",
        "signed-jail-a0210ae6d547.json", "signed-jail-c19f9ab2f7c7.json",
        "signed-machiner-59cb200063ee.json", "signed-machiner-95e44987298b.json",
        "signed-machiner-a68f4ae1f37c.json", "signed-openness-2f70ff5d93f4.json",
        "signed-openness-66e58ceb2dbc.json", "signed-provenan-7dee23005516.json",
        "signed-safety-32bb6e601009.json", "signed-safety-7443b173d7bb.json",
        "signed-swarm-31e9fb39baa2.json", "signed-swarm-5ab11f152dde.json",
    ]
    pr_counts: Counter[str] = Counter()
    pr_bad: list[str] = []
    for f in files:
        blob = get(f"https://councilof.ai/interop/mill-cards-signed/{f}")
        state, reason = VC.verify_signed_card_with_did_doc(blob, did_doc)
        pr_counts[state] += 1
        if state != "VALID":
            pr_bad.append(f"{f} {state}: {reason}")

    # ---- tally -----------------------------------------------------------
    total = sum(idx_counts.values()) + sum(pr_counts.values())
    valid = idx_counts["VALID"] + pr_counts["VALID"]
    out = {
        "schema": "csoai.tui3-estate-verifier-run/0.1",
        "verifier": "harness/gspc-top100/verify_card.py (estate's own code)",
        "verifier_source": "https://github.com/CSOAI-ORG/councilof-ai/tree/master/harness",
        "did_source": "https://csoai.org/.well-known/did.json",
        "observed_at": "2026-09-11",
        "index": {"total": sum(idx_counts.values()), "states": dict(idx_counts), "non_valid": idx_bad},
        "pr1888": {"total": sum(pr_counts.values()), "states": dict(pr_counts), "non_valid": pr_bad},
        "combined": {"total": total, "valid": valid, "not_valid": total - valid},
        "three_state_note": "VALID/INVALID/UNCHECKABLE are verifier states, not grades. Not a certification.",
    }
    print(json.dumps(out, indent=2))


if __name__ == "__main__":
    main()
