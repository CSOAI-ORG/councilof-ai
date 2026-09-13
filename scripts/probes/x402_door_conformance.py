#!/usr/bin/env python3
"""x402 door conformance probe (TUI-3, agent-economy lane — 2026-09-13 brief).

Verifies the nine CSOAI x402 doors end to end WITHOUT spending:
  discovery (/.well-known/x402.json) -> per-door 402 challenge shape
  (accepts[]: scheme, network, asset, payTo, resource, amount) -> classification.

Payment, fulfillment and settlement are NOT exercised here: fulfillment bytes
stay UNMEASURED until an authorized settlement runs, and settlement
classification comes from the receipts ledger (SELF_TEST vs EXTERNAL), never
from this probe. A 402 is a challenge, not delivery.

Output: public/interop/x402-door-conformance-2026-09/
  report.json          full machine-readable report (states + limitations)
  mirrors/             raw discovery + challenge bytes with retrieval metadata
  card-*-unsigned.json staged card-v0 atoms for the publisher intake
Never raises. Network dark -> report with all doors UNCHECKABLE.
"""
from __future__ import annotations

import hashlib
import json
import sys
import urllib.error
import urllib.request
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parent.parent.parent
PACK = "x402-door-conformance-2026-09"
PACK_DIR = ROOT / "public" / "interop" / PACK
DISCOVERY_URL = "https://councilof.ai/.well-known/x402.json"
UA = {"User-Agent": "councilof-ai-conformance/0.1", "Accept": "application/json"}
CAP = 3072
CARD_SCHEMA = "https://councilof.ai/schema/card-v0.json"
USDC_BASE = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913"


def _now() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def _canon(obj: Any) -> bytes:
    return json.dumps(obj, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode("utf-8")


def _fetch(url: str) -> tuple[int, bytes]:
    req = urllib.request.Request(url, headers=UA)
    try:
        with urllib.request.urlopen(req, timeout=25) as r:
            return int(r.status), r.read()
    except urllib.error.HTTPError as e:
        return int(e.code), (e.read() if e.fp else b"")
    except Exception as e:
        return 0, str(e).encode()[:400]


def _archive(name: str, role: str, url: str, body: bytes, http: int, ts: str, metas: list) -> None:
    try:
        mdir = PACK_DIR / "mirrors"
        mdir.mkdir(parents=True, exist_ok=True)
        (mdir / name).write_bytes(body)
        meta = {"id": name, "role": role, "source_url": url, "fetched_at": ts,
                "http": http, "bytes": len(body), "sha256": hashlib.sha256(body).hexdigest()}
        (mdir / (name + ".meta.json")).write_text(json.dumps(meta, indent=2, sort_keys=True) + "\n")
        metas.append(meta)
    except Exception:
        pass


def _check_challenge(body: bytes, catalog: dict[str, Any]) -> dict[str, Any]:
    """Validate one 402 body against the catalog's declared terms."""
    try:
        d = json.loads(body)
    except Exception:
        return {"parse": "FAILED", "conformant": False, "notes": ["challenge body is not JSON"]}
    accepts = d.get("accepts") or []
    out: dict[str, Any] = {"x402Version": d.get("x402Version"), "n_accepts": len(accepts),
                           "conformant": True, "notes": []}
    if d.get("x402Version") != catalog.get("x402Version"):
        out["conformant"] = False
        out["notes"].append("x402Version differs from discovery doc")
    if not accepts:
        out["conformant"] = False
        out["notes"].append("no accepts[] in challenge")
        return out
    a = accepts[0]
    checks = {
        "scheme_exact": a.get("scheme") == "exact",
        "network_base": a.get("network") in ("base", "eip155:8453"),
        "asset_usdc": str(a.get("asset", "")).lower() == USDC_BASE.lower(),
        "payto_matches": str(a.get("payTo", "")).lower() == str(catalog.get("payTo", "")).lower(),
        "resource_named": bool(a.get("resource")),
        "amount_present": a.get("amount") is not None or a.get("maxAmountRequired") is not None,
    }
    out["checks"] = checks
    out["amount"] = a.get("amount") or a.get("maxAmountRequired")
    out["facilitator_seen"] = "facilitator" in json.dumps(d).lower()
    for k, v in checks.items():
        if not v:
            out["conformant"] = False
            out["notes"].append(f"accepts[0].{k} failed")
    return out


def _atom(subject: str, as_of: str, payload: dict, urls: list[str],
          unmeasured: list[str], tags: list[str], name: str) -> None:
    card = {
        "schema": CARD_SCHEMA,
        "surface": "public.notice",
        "subject": subject,
        "as_of": as_of,
        "source_urls": urls,
        "payload": payload,
        "sha256": hashlib.sha256(_canon(payload)).hexdigest(),
        "unmeasured": unmeasured,
        "tags": tags,
    }
    assert len(_canon(payload)) <= CAP and len(_canon(card)) <= CAP, f"{name} over cap"
    (PACK_DIR / name).write_text(json.dumps(card, indent=1, sort_keys=True) + "\n")


def main() -> int:
    ts = _now()
    PACK_DIR.mkdir(parents=True, exist_ok=True)
    metas: list[dict] = []

    code, disc_body = _fetch(DISCOVERY_URL)
    discovery: dict[str, Any] = {"http": code, "state": "UNCHECKABLE"}
    catalog: dict[str, Any] = {}
    if code == 200:
        _archive("well-known-x402.json", "discovery", DISCOVERY_URL, disc_body, code, ts, metas)
        try:
            catalog = json.loads(disc_body)
            ok = all(catalog.get(k) for k in ("x402Version", "network", "asset", "payTo")) \
                and isinstance(catalog.get("resources"), list)
            discovery = {"http": code, "state": "PROBED" if ok else "UNCHECKABLE",
                         "x402Version": catalog.get("x402Version"),
                         "network": catalog.get("network"), "asset": catalog.get("asset"),
                         "payTo": catalog.get("payTo"),
                         "n_resources": len(catalog.get("resources") or []),
                         "notes": [] if ok else ["discovery doc missing required fields"]}
        except Exception:
            discovery = {"http": code, "state": "UNCHECKABLE", "notes": ["discovery doc not JSON"]}

    doors = []
    for i, res in enumerate(catalog.get("resources") or []):
        url = res.get("url")
        door: dict[str, Any] = {"i": i, "url": url, "paid_for": res.get("paid_for"),
                                "catalog_amount": res.get("amount")}
        if not url:
            door["state"] = "UNCHECKABLE"
            door["notes"] = ["resource entry without url"]
            doors.append(door)
            continue
        dcode, dbody = _fetch(url)
        _archive(f"door-{i}-challenge.json", "402-challenge", url, dbody, dcode, ts, metas)
        door["http"] = dcode
        if dcode == 402:
            ch = _check_challenge(dbody, catalog)
            door["challenge"] = ch
            door["state"] = "PROBED" if ch.get("conformant") else "DISCOVERED"
            if not ch.get("conformant"):
                door["notes"] = ch.get("notes")
            if res.get("amount") == "0":
                door["zero_price"] = True
                door["note"] = "free door: a live 402 route priced at zero — settles and charges nothing"
        elif dcode == 0:
            door["state"] = "UNCHECKABLE"
            door["notes"] = ["transport failure"]
        else:
            door["state"] = "DISCOVERED"
            door["notes"] = [f"expected 402 challenge, got HTTP {dcode}"]
        # fulfillment is never exercised without an authorized settlement
        door["fulfillment"] = "UNMEASURED — payment not exercised by this probe"
        doors.append(door)

    n_probed = sum(1 for d in doors if d.get("state") == "PROBED")
    n_disc = sum(1 for d in doors if d.get("state") == "DISCOVERED")
    n_uncheck = sum(1 for d in doors if d.get("state") == "UNCHECKABLE")

    report = {
        "schema": "csoai.x402-door-conformance/0.1",
        "generated_at": ts,
        "discovery": discovery,
        "doors": doors,
        "summary": {"n_doors": len(doors), "probed_conformant": n_probed,
                    "discovered_mismatch": n_disc, "uncheckable": n_uncheck},
        "limitations": [
            "402 challenge shape only — fulfillment bytes and settlement are not exercised without an authorized payment",
            "challenge conformance is not a delivery guarantee",
            "settlement classes come from the receipts ledger, not this probe",
        ],
    }
    (PACK_DIR / "report.json").write_text(json.dumps(report, indent=1, sort_keys=True) + "\n")

    # manifest
    try:
        all_metas = list(metas)
        seen = {m["id"] for m in all_metas}
        for mp in sorted((PACK_DIR / "mirrors").glob("*.meta.json")):
            m = json.loads(mp.read_bytes())
            if m["id"] not in seen:
                all_metas.append(m)
                seen.add(m["id"])
        (PACK_DIR / "artefact-manifest.json").write_text(json.dumps(
            {"schema": "csoai.artefact-manifest/0.1", "pack": PACK, "as_of": ts,
             "artefacts": sorted(all_metas, key=lambda m: m["id"])}, indent=2, sort_keys=True) + "\n")
    except Exception:
        pass

    # staged atoms (unsigned; admission/signing is the publisher's, TUI-4's boundary)
    summary_payload = {
        "kind": "csoai.x402-door-conformance/0.1",
        "state": "PROBED" if n_uncheck == 0 and discovery.get("state") == "PROBED" else "UNMEASURED",
        "n_doors": len(doors),
        "probed_conformant": n_probed,
        "discovered_mismatch": n_disc,
        "uncheckable": n_uncheck,
        "discovery_state": discovery.get("state"),
        "not_delivery_proof": True,
        "report": f"https://councilof.ai/interop/{PACK}/report.json",
    }
    _atom("x402 door conformance round — 9 doors, challenge shape",
          ts, summary_payload, [DISCOVERY_URL, f"https://councilof.ai/interop/{PACK}/report.json"],
          ["fulfillment_bytes", "settlement_classification_from_this_probe"],
          ["x402", "conformance", PACK], "card-x402-door-conformance-summary-unsigned.json")

    for d in doors:
        if d.get("state") == "PROBED":
            continue  # conformant doors ride the summary; atoms are for exceptions
        p = {
            "kind": "csoai.x402-door-exception/0.1",
            "state": d.get("state"),
            "door": d.get("url"),
            "paid_for": d.get("paid_for"),
            "http": d.get("http"),
            "notes": (d.get("notes") or [])[:4],
            "not_delivery_proof": True,
        }
        _atom(f"x402 door exception: {d.get('url')}", ts, p,
              [d.get("url") or DISCOVERY_URL, f"https://councilof.ai/interop/{PACK}/report.json"],
              ["fulfillment_bytes"], ["x402", "conformance", "exception"],
              f"card-x402-door-{d['i']}-unsigned.json")

    print(json.dumps(report["summary"], sort_keys=True))
    print(f"doors probed: {n_probed} conformant / {n_disc} mismatch / {n_uncheck} uncheckable")
    return 0


if __name__ == "__main__":
    sys.exit(main())
