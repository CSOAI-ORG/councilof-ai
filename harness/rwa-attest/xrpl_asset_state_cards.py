#!/usr/bin/env python3
"""Emit one xrpl.asset.state card per instrument on the live XRPL reader-16.

CSOAI_LEDGER_AGENTS_01Sep2026 · Agent XRPL-READER + Shared card rules:
  card-v0 · surface xrpl.asset.state · subject issuer + instrument · as_of now
  source_urls[] · payload = flags + verified_via + unmeasured[] · sha256
  NO GSPC measure fields on the envelope · <= 3KB each
  Sign ONLY in GHA under did:web:csoai.org#card-attestation-1. NEVER a laptop key.
  Cards are written QUEUED with sig_ed25519=null. NO_LAPTOP_SIGN.

Start set (signed-capable, bidirectional domain): RLUSD, OUSG, USDB, BBRL.
EURQ / USDQ / EURCV / XAU.gh / PSC arrive with reader sig null — that flag is
carried, unmeasured[] stays populated, and no two-way toml is invented.
"""
from __future__ import annotations

import hashlib
import json
import re
import ssl
import time
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[1]
OUT = ROOT / "public" / "interop" / "cards" / "xrpl"
UA = "CSOAI-xrpl-reader/0.1 (+https://councilof.ai)"
CTX = ssl.create_default_context()
READER = "https://councilof.ai/api/xrpl"
RPCS = ("https://xrplcluster.com", "https://s2.ripple.com:51234/")
AS_OF = datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")
START_SET = ["RLUSD", "OUSG", "USDB", "BBRL"]
BANNED = ("archax", "openeden", "abrdn", "tbill", "aaulf", "buidl")


def canonical(obj: object) -> bytes:
    return json.dumps(obj, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode("utf-8")


def get(url: str) -> dict:
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=25, context=CTX) as r:
        return json.loads(r.read())


def account_flags(addr: str) -> dict | None:
    body = json.dumps({"method": "account_info", "params": [{"account": addr, "ledger_index": "validated"}], "id": 1}).encode()
    for rpc in RPCS:
        try:
            req = urllib.request.Request(rpc, data=body, headers={"Content-Type": "application/json", "User-Agent": UA})
            with urllib.request.urlopen(req, timeout=25, context=CTX) as r:
                ad = (json.loads(r.read()).get("result") or {}).get("account_data") or {}
            if not ad:
                continue
            f = ad.get("Flags")
            dom = ""
            if ad.get("Domain"):
                try:
                    dom = bytes.fromhex(ad["Domain"]).decode("ascii", "replace").strip()
                except Exception:
                    dom = ""
            return {
                "account_root_flags": f,
                "require_auth": bool(f is not None and f & 0x00040000),
                "global_freeze": bool(f is not None and f & 0x00400000),
                "no_freeze": bool(f is not None and f & 0x00200000),
                "declared_domain": dom or None,
            }
        except Exception:
            time.sleep(0.6)
    return None  # RPC unreachable — flags stay uncheckable, never invented


def slug(sym: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", sym.lower()).strip("-")


def main() -> int:
    OUT.mkdir(parents=True, exist_ok=True)
    d = get(READER)
    assets = d.get("assets") or []
    if d.get("n") != 16 or len(assets) != 16:
        raise SystemExit(f"HALT reader n={d.get('n')} — catalogue drifted, refuse")
    for a in assets:
        if any(b in (str(a.get("symbol", "")) + " " + str(a.get("issuer", ""))).lower() for b in BANNED):
            raise SystemExit(f"HALT banned name on reader: {a.get('symbol')}")
    order = {s: i for i, s in enumerate(START_SET)}
    assets = sorted(assets, key=lambda a: (order.get(a["symbol"], 99), assets.index(a)))

    index = []
    for a in assets:
        sym = a["symbol"]
        flags = account_flags(a["issuer_address"])
        unmeasured = list(a.get("unmeasured") or [])
        if flags is None:
            unmeasured.append("account_root_flags (XRPL RPC unreachable this run)")
        payload = {
            "symbol": sym,
            "issuer": a.get("issuer"),
            "issuer_address": a.get("issuer_address"),
            "verified_via": a.get("verified_via"),
            "kind": a.get("kind"),
            "holders": a.get("holders"),
            "supply": a.get("supply"),
            "flags": flags,
            "reader_sig_ed25519": "present" if a.get("sig_ed25519") else "null",
            "unmeasured": unmeasured,
        }
        card = {
            "schema": "https://councilof.ai/schema/card-v0.json",
            "surface": "xrpl.asset.state",
            "subject": f"{a.get('issuer')} / {sym}",
            "as_of": AS_OF,
            "source_urls": [READER] + (["https://" + flags["declared_domain"]] if flags and flags.get("declared_domain") and not str(flags["declared_domain"]).startswith("http") else ([flags["declared_domain"]] if flags and flags.get("declared_domain") else [])),
            "payload": payload,
            "sha256": hashlib.sha256(canonical(payload)).hexdigest(),
            "sig_ed25519": None,
            "signing": "QUEUED for GHA under did:web:csoai.org#card-attestation-1. NO_LAPTOP_SIGN.",
            "start_set": sym in START_SET,
        }
        raw = json.dumps(card, indent=1, ensure_ascii=False) + "\n"
        if len(raw.encode()) > 3072:
            raise SystemExit(f"HALT {sym} card {len(raw.encode())}B > 3KB — it is a tape, not a card")
        p = OUT / f"xrpl-asset-state-{slug(sym)}.json"
        p.write_text(raw, encoding="utf-8")
        index.append({"symbol": sym, "file": p.name, "sha256": card["sha256"], "start_set": card["start_set"], "bytes": len(raw.encode())})
        print(f"CARD {sym:8s} {len(raw.encode()):5d}B sha={card['sha256'][:16]} start_set={card['start_set']}")
        time.sleep(0.4)

    (OUT / "INDEX.json").write_text(json.dumps({
        "surface": "xrpl.asset.state",
        "as_of": AS_OF,
        "n": len(index),
        "signing": "all QUEUED; GHA #card-attestation-1 only",
        "cards": index,
    }, indent=1) + "\n", encoding="utf-8")
    print("AS_OF", AS_OF)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
