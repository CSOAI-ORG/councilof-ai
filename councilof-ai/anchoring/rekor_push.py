#!/usr/bin/env python3
"""
CSOAI Rekor Sigstore State (reconciled 2026-10-07)
==================================================
Describes the CURRENT Rekor inclusion state for the public root — DERIVED from the
live witness sidecar at observation time.

Reconciliation note (2026-10-07): this file previously HARDCODED logIndex 2791822965
over the 167-card root (sha256 62a1931b…) with "No new push is needed", while the
retained live entry had moved to logIndex 3012420819 over the 319-card root
(f1913eca…). A retained state file may never outrun the truth it reconciles, so
every field below is read from the sidecar; an unreachable sidecar yields
UNAVAILABLE — an honest absence, never a stale claim.

The actual Rekor submission for each root is performed by the publish pipeline
(rekord type: preimage bytes + board Ed25519 signature + x509 public key);
this script only reports state. No spend, read-only.

Run:
    python3 anchoring/rekor_push.py [--verify-only]
"""

import json
import sys
import urllib.request
from datetime import datetime, timezone

SIDECAR_URL = "https://councilof.ai/interop/root-witness-latest.json"
ROOT_URL = "https://councilof.ai/root.json"
UA = {"User-Agent": "CSOAI-rekor-state/0.2"}


def _fetch(url, timeout=25):
    import ssl
    import os
    ctx = None
    try:
        import certifi
        ctx = ssl.create_default_context(cafile=certifi.where())
    except Exception:
        ctx = ssl.create_default_context()
    req = urllib.request.Request(url, headers=UA)
    with urllib.request.urlopen(req, timeout=timeout, context=ctx) as resp:
        return resp.read()


def describe_rekor_state() -> dict:
    """Describe the current Rekor state for the CSOAI root, live-derived."""
    measured = datetime.now(timezone.utc).isoformat()
    base = {
        "schema": "csoai.anchor.rekor-state/0.2",
        "kind": "rekor.sigstore.inclusion",
        "measured_at": measured,
        "derived_from": SIDECAR_URL,
        "measurement_not_certification": True,
    }
    try:
        side = json.loads(_fetch(SIDECAR_URL))
        rekor = ((side.get("witnesses") or {}).get("rekor")) or {}
        artifact = side.get("artifact") or {}
    except Exception as exc:  # honest absence, never a stale assertion
        return {
            **base,
            "state": "UNAVAILABLE",
            "reason": f"sidecar unreachable at measurement time ({type(exc).__name__}); no state asserted",
        }
    if not rekor:
        return {**base, "state": "ABSENT", "reason": "no rekor witness present in sidecar"}
    return {
        **base,
        "state": "WITNESSED" if rekor.get("status") == "WITNESSED" else rekor.get("status", "UNKNOWN"),
        "current_entry": {
            "status": rekor.get("status"),
            "logIndex": rekor.get("logIndex"),
            "uuid": rekor.get("uuid"),
            "integratedTime": rekor.get("integratedTime"),
            "integratedTimeIso": (
                datetime.fromtimestamp(rekor["integratedTime"], timezone.utc).isoformat()
                if isinstance(rekor.get("integratedTime"), int) else None
            ),
            "logID": rekor.get("logID"),
            "type": rekor.get("type"),
            "url": f"https://rekor.sigstore.dev/api/v1/log/entries?logIndex={rekor.get('logIndex')}",
            "entry_file": rekor.get("entry_file"),
        },
        "artifact_anchored": {
            "url": artifact.get("url") or ROOT_URL,
            "sha256": artifact.get("sha256"),
            "merkle_root": artifact.get("merkle_root"),
            "card_count": artifact.get("card_count"),
            "as_of": artifact.get("as_of"),
        },
        "next_root_push": {
            "status": "PERFORMED_BY_PUBLISH_PIPELINE",
            "trigger": "a new root.json published by public-root.yml",
            "method": "rekord entry (preimage bytes + board signature + x509 key)",
            "cost": "free",
        },
        "honest_sentence": (
            f"Root {artifact.get('sha256', '?')[:16]}… is witnessed in Rekor at logIndex "
            f"{rekor.get('logIndex')} (observed {measured}). Measurement of inclusion only — "
            "not a certification, not a signature-validity claim beyond what verify_all.py measures."
        ),
    }


def main():
    state = describe_rekor_state()
    print(json.dumps(state, indent=2))
    return 0 if state.get("state") in ("WITNESSED",) else 1


if __name__ == "__main__":
    sys.exit(main())
