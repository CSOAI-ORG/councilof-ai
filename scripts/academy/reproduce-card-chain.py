#!/usr/bin/env python3
# SPDX-License-Identifier: CC0-1.0
"""reproduce-card-chain.py — a learner's first reproduction: re-measure card_chain.bodies_verified_valid.

The published measurement: GET https://councilof.ai/api/state -> card_chain.bodies_verified_valid
(kind "measured"). It counts the signed card bodies (corpus 3, /signed/card_index.json) whose id
is sha256 of the canonical body AND whose Ed25519 signature verifies under the key pinned in
the DID document (#card-attestation-1). The rule is public/signed/HOW-TO-VERIFY.md §2.

This script re-runs that measurement from the published bytes alone and prints both results and
their sha256 over one canonical result object:

    {"measurement":"card_chain.bodies_verified_valid","value":<int>}   (sorted keys, compact)

Equal sha256 = reproduced. It says nothing about the other two card corpora; do not add them.

    python3 scripts/academy/reproduce-card-chain.py [--edge https://councilof.ai] [--json]
Exit 0 reproduced · 1 not reproduced · 2 could not run.
"""
from __future__ import annotations

import argparse
import base64
import hashlib
import json
import sys
import urllib.request
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone

UA = "csoai-academy-reproduce/0.1 (+https://councilof.ai/academy/)"
MEASUREMENT = "card_chain.bodies_verified_valid"


def get(url: str) -> bytes:
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": "application/json"})
    with urllib.request.urlopen(req, timeout=60) as r:
        return r.read()


def result_bytes(value: int) -> bytes:
    return json.dumps({"measurement": MEASUREMENT, "value": value}, sort_keys=True, separators=(",", ":")).encode()


def main(argv=None) -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--edge", default="https://councilof.ai")
    ap.add_argument("--json", action="store_true")
    a = ap.parse_args(argv)
    from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PublicKey

    started = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    try:
        state = json.loads(get(f"{a.edge}/api/state"))
        published = state["card_chain"]["bodies_verified_valid"]
        did = json.loads(get(f"{a.edge}/.well-known/did.json"))
        index = json.loads(get(f"{a.edge}/signed/card_index.json"))
    except Exception as e:  # noqa: BLE001
        print(f"could not read the published inputs: {type(e).__name__}: {e}", file=sys.stderr)
        return 2
    vm = [v for v in did.get("verificationMethod", []) if str(v.get("id", "")).endswith("#card-attestation-1")]
    if len(vm) != 1:
        print("DID document has no single #card-attestation-1 key", file=sys.stderr)
        return 2
    x = vm[0]["publicKeyJwk"]["x"]
    pinned = base64.urlsafe_b64decode(x + "=" * (-len(x) % 4))
    key = Ed25519PublicKey.from_public_bytes(pinned)

    urls = [f"{a.edge}{c['card_url']}" for c in index["cards"]]

    def check(url: str) -> str:
        try:
            card = json.loads(get(url))
        except Exception:  # noqa: BLE001
            return "UNCHECKABLE"
        if card.get("pubkey") != pinned.hex():
            return "INVALID"
        pre = json.dumps(card["body"], sort_keys=True, separators=(",", ":"), ensure_ascii=True).encode("utf-8")
        if hashlib.sha256(pre).hexdigest() != card.get("id"):
            return "INVALID"
        try:
            key.verify(bytes.fromhex(card["signature"]), pre)
        except Exception:  # noqa: BLE001
            return "INVALID"
        return "VALID"

    with ThreadPoolExecutor(max_workers=8) as ex:
        verdicts = list(ex.map(check, urls))
    reproduced = verdicts.count("VALID")
    pub_b, rep_b = result_bytes(int(published["value"])), result_bytes(reproduced)
    out = {
        "measurement": MEASUREMENT,
        "measurement_ref": f"{a.edge}/api/state#/card_chain/bodies_verified_valid",
        "published": {"value": published["value"], "kind": published.get("kind"), "as_of": published.get("as_of"),
                      "result_sha256": hashlib.sha256(pub_b).hexdigest()},
        "reproduced": {"value": reproduced, "cards_in_index": len(urls),
                       "invalid": verdicts.count("INVALID"), "uncheckable": verdicts.count("UNCHECKABLE"),
                       "result_sha256": hashlib.sha256(rep_b).hexdigest()},
        "method": "Fetched /signed/card_index.json and every card_url it lists; pinned the #card-attestation-1 key "
                  "from /.well-known/did.json; per card: pubkey == pinned key, sha256(json.dumps(body, sort_keys, "
                  "compact, ensure_ascii)) == id, Ed25519 signature verifies; counted VALID "
                  "(public/signed/HOW-TO-VERIFY.md section 2).",
        "reproduced_at": started,
    }
    out["reproduced_ok"] = out["published"]["result_sha256"] == out["reproduced"]["result_sha256"]
    print(json.dumps(out, indent=1) if a.json else
          f"published {published['value']}  reproduced {reproduced}  -> {'REPRODUCED' if out['reproduced_ok'] else 'NOT REPRODUCED'}")
    return 0 if out["reproduced_ok"] else 1


if __name__ == "__main__":
    sys.exit(main())
