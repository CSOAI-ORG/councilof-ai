#!/usr/bin/env python3
"""Layer 0 liveness — one PROBED atom per hour about the trust floor itself.

Layer 0 is the floor every other claim stands on: the DID key, the signed public root, and the
witnesses (Rekor, OpenTimestamps) that anchor it. /layer0 was a page with honest status and no
measurement behind it. This reader records, from the live site and from the release gate that
the public-root run already executes, what the floor looked like at one instant:

  did_json_http, did_key_present, root_http, root_card_count, root_as_of, root_merkle_prefix,
  pointer_http, pointer_match (live_root == root.json merkle), rekor_state, ots_state,
  release_gate (PASS/FAIL/UNRUN — the run's own root-witness-release-gate verdict, passed in)

It is a read, not a rating: state is PROBED; nothing here says the floor is "secure" or
"certified". The atom is staged under public/interop/layer0-liveness-2026-09/ and the public
root signs it on its next tick, so the floor's own history is rooted and witnessed like every
other measurement. Card-v0, surface public.notice, ≤3072 bytes, unsigned (scripts/adapters/
staged_leaves.py admits it).
"""
from __future__ import annotations

import argparse
import hashlib
import json
import sys
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

SITE = "https://councilof.ai"
KIND = "csoai.layer0.liveness/0.1"
SCHEMA = "https://councilof.ai/schema/card-v0.json"
UA = "csoai-layer0-liveness-reader/0.1 (+https://councilof.ai/layer0)"


def canonical_bytes(obj) -> bytes:
    return json.dumps(obj, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode("utf-8")


def get_json(url: str, timeout: int = 30):
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": "application/json"})
    try:
        with urllib.request.urlopen(req, timeout=timeout) as r:
            status = r.status
            body = r.read()
        try:
            return status, json.loads(body)
        except Exception:
            return status, None
    except urllib.error.HTTPError as e:
        return e.code, None
    except Exception:
        return 0, None


def read_floor(site: str = SITE) -> dict:
    did_http, did = get_json(f"{site}/.well-known/did.json")
    root_http, root = get_json(f"{site}/root.json")
    ptr_http, ptr = get_json(f"{site}/interop/root-witness-pointer.json")
    wit_http, wit = get_json(f"{site}/interop/root-witness-latest.json")

    key_present = bool(did and isinstance(did.get("verificationMethod"), list) and did["verificationMethod"])
    merkle = str((root or {}).get("merkle_root") or "")
    live_root = ""
    if isinstance(ptr, dict):
        lr = ptr.get("live_root")
        live_root = str(lr.get("merkle_root") or lr.get("sha256") or "") if isinstance(lr, dict) else str(lr or "")
    witnesses = (ptr or {}).get("witnesses") if isinstance(ptr, dict) else None
    rekor = str((witnesses or {}).get("rekor") or ((wit or {}).get("witnesses") or {}).get("rekor", {}).get("status") or "UNKNOWN")
    ots = str((witnesses or {}).get("ots") or ((wit or {}).get("witnesses") or {}).get("ots", {}).get("status") or "UNKNOWN")
    return {
        "did_json_http": did_http,
        "did_key_present": key_present,
        "root_http": root_http,
        "root_card_count": (root or {}).get("card_count") if isinstance(root, dict) else None,
        "root_as_of": (root or {}).get("as_of") if isinstance(root, dict) else None,
        "root_merkle_prefix": merkle[:16] or None,
        "pointer_http": ptr_http,
        "pointer_match": (bool(merkle) and bool(live_root) and (live_root == merkle or live_root.startswith(merkle[:16]))) if (merkle and live_root) else None,
        "rekor_state": rekor,
        "ots_state": ots,
    }


def build_atom(reading: dict, gate: str, as_of: str, site: str = SITE) -> dict:
    payload = {
        "kind": KIND,
        "state": "PROBED",
        "not_a_grade": True,
        "release_gate": gate,
        **reading,
    }
    raw = canonical_bytes(payload)
    return {
        "schema": SCHEMA,
        "surface": "public.notice",
        "subject": "Layer 0 liveness — DID key, signed public root, Rekor + OTS witnesses, at one instant",
        "as_of": as_of,
        "payload": payload,
        "sha256": hashlib.sha256(raw).hexdigest(),
        "source_urls": [
            f"{site}/.well-known/did.json",
            f"{site}/root.json",
            f"{site}/interop/root-witness-pointer.json",
        ],
        "tags": ["layer0", "liveness", "probe", "layer0-liveness-2026-09"],
        "unmeasured": [
            "fault tolerance and independent review (the 33-seat council is a design, not a live property)",
            "anything about the correctness of the cards the root commits to",
        ],
    }


def main(argv=None) -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--stage", required=True, help="directory to write card-layer0-liveness-unsigned.json into")
    ap.add_argument("--gate-result", default="UNRUN", choices=["PASS", "FAIL", "UNRUN"], help="the run's own root-witness-release-gate verdict, if it ran")
    ap.add_argument("--site", default=SITE)
    ap.add_argument("--as-of", default="")
    args = ap.parse_args(argv)
    as_of = args.as_of or datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    atom = build_atom(read_floor(args.site), args.gate_result, as_of, args.site)
    out = Path(args.stage)
    out.mkdir(parents=True, exist_ok=True)
    p = out / "card-layer0-liveness-unsigned.json"
    p.write_text(json.dumps(atom, indent=1, sort_keys=True, ensure_ascii=False) + "\n", encoding="utf-8")
    print(json.dumps({"wrote": str(p), "sha256": atom["sha256"], "bytes": len(canonical_bytes(atom)), **{k: atom["payload"][k] for k in ("root_card_count", "rekor_state", "ots_state", "pointer_match", "release_gate")}}))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
