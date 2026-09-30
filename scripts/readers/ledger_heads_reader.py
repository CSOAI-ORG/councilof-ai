#!/usr/bin/env python3
"""Ledger heads -> staged UNSIGNED card-v0 atoms, one per public ledger (public readback, no signing).

    python3 scripts/readers/ledger_heads_reader.py --stage public/interop/ledger-heads-2026-09
    python3 scripts/readers/ledger_heads_reader.py --selftest

WHY. The estate keeps several append-only or source-maintained records (the corrections ledger,
the fix-receipt chain, the withdrawal list of signed mill cards, the claim-maintenance register
and its executed re-checks, the corrections-watch rows, the Layer O presence rollup). Each has its
own producer and its own home. Until 2026-09-29 none of their heads was committed to the ONE
public root, so a reader could not tell whether a ledger had been rewritten between two days.

WHAT IT DOES. For every ledger in LEDGERS it fetches the SERVED bytes anonymously (the public
readback, exactly what a stranger gets), hashes them, reads the ledger's own head and count, and
writes one atom card-ledger-<key>-unsigned.json into the staging directory. The public-root writer
(scripts/publish_public_root.py via scripts/adapters/staged_leaves.py, run by the daily root job
on the build pod) signs each atom as a public.notice leaf; witness_public_root.py anchors the ONE
root (Rekor + OTS). Nothing here signs and nothing here can.

WHAT IT NEVER DOES. It writes no verdict and never the word the staging gate refuses; a fetch that
fails writes state UNMEASURED with the HTTP status, never a stale number. The payload carries no
wall-clock time, so a ledger whose bytes did not change produces the same payload sha256 and the
root gains no new leaf for it. Counts come from the served bytes, never from a typed number.

Authority (one per record type; every other surface is a feed into it or a view of it):
  corrections of our own publications -> GET /api/corrections (functions/api/corrections.ts)
  before/after readings of our fixes  -> /interop/fix-receipts/fix-receipt-chain.jsonl
  withdrawn signed mill cards         -> /interop/mill-cards-signed/WITHDRAWN.jsonl
  claim-maintenance state per subject -> GET /api/claims/register
  executed day-7/30/90 re-checks      -> HF csoai/councilof-ai-evidence public/interop/claim-maintenance/latest.json
  third-party correction propagation  -> HF csoai/councilof-ai-evidence public/interop/corrections-watch/latest.json
  operational surfaces (Layer O)      -> /.well-known/layer-o-presence.json

CC-BY-4.0. Council of AI (CSOAI Ltd, UK Companies House 16939677).
"""
from __future__ import annotations

import argparse
import collections
import hashlib
import json
import sys
import urllib.error
import urllib.request
from pathlib import Path
from typing import Any, Callable

SCHEMA = "https://councilof.ai/schema/card-v0.json"
KIND = "csoai.ledger-head/0.1"
SITE = "https://councilof.ai"
EVIDENCE = "https://huggingface.co/datasets/csoai/councilof-ai-evidence/resolve/main"
UA = "csoai-ledger-heads/0.1 (+https://councilof.ai/corrections)"
CAP = 3072
TAG = "ledger-heads-2026-09"


def canonical_bytes(obj: Any) -> bytes:
    return json.dumps(obj, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode("utf-8")


def sha(b: bytes) -> str:
    return hashlib.sha256(b).hexdigest()


def fetch(url: str, timeout: int = 45) -> tuple[int, bytes]:
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": "application/json, */*"})
    try:
        with urllib.request.urlopen(req, timeout=timeout) as r:
            return r.status, r.read()
    except urllib.error.HTTPError as e:
        return e.code, b""
    except Exception:
        return 0, b""


def jsonl(b: bytes) -> list[dict]:
    return [json.loads(l) for l in b.decode("utf-8").splitlines() if l.strip()]


# ------------------------------------------------------------------ per-ledger head readers
# Each returns the ledger-specific payload fields read from the served bytes. They raise on a
# shape they do not recognise; main() turns that into an UNMEASURED atom, never a guess.

def head_corrections(b: bytes) -> dict:
    d = json.loads(b)
    rows = d["corrections"]
    ids = [str(c["id"]) for c in rows]
    sig = d.get("signature") or {}
    out = {
        "entries": len(rows),
        "head_id": ids[0] if ids else None,
        "last_update": max((str(c.get("date", "")) for c in rows), default=None) or None,
        "signature_state": d.get("signature_state"),
        "signature_key": sig.get("kid") or sig.get("verificationMethod") or sig.get("did"),
        "ids_sha256": sha("\n".join(sorted(ids)).encode()),
        "ids": sorted(ids),
    }
    return out


def head_fix_receipts(b: bytes) -> dict:
    links = jsonl(b)
    rec = [l for l in links if l.get("kind") == "FIX_RECEIPT"]
    verdicts = collections.Counter(str((l.get("verdict") or (l.get("after") or {}).get("verdict") or "UNRECORDED")) for l in rec)
    refs = sorted({str((l.get("corrections_ref") or {}).get("id")) for l in rec if (l.get("corrections_ref") or {}).get("id")})
    return {
        "entries": len(rec),
        "links": len(links),
        "head_id": rec[-1].get("receipt_id") if rec else None,
        "head_digest": links[-1].get("state_digest") if links else None,
        "last_update": max((str(l.get("observed_at", "")) for l in links), default=None) or None,
        "verdicts": dict(sorted(verdicts.items())),
        "corrections_refs": refs,
        "ids": [str(l.get("receipt_id")) for l in rec],
    }


def head_withdrawals(b: bytes) -> dict:
    rows = jsonl(b)
    by_corr = collections.Counter(str(r.get("correction") or "UNRECORDED") for r in rows)
    ids = sorted(str(r.get("withdrawn_id", "")) for r in rows)
    return {
        "entries": len(rows),
        "head_id": rows[-1].get("withdrawn_id") if rows else None,
        "by_correction": dict(sorted(by_corr.items())),
        "ids_sha256": sha("\n".join(ids).encode()),
        "admitted": 0,
        "admitted_rule": "a withdrawn card is never counted as an admitted measurement",
    }


def head_register(b: bytes) -> dict:
    d = json.loads(b)
    regs = d.get("registries") or []
    subs = d.get("subjects") or []
    return {
        "entries": len(regs),
        "subjects": len(subs),
        "head_digest": d.get("register_digest"),
        "last_update": d.get("as_of"),
        "registries": sorted(f"{r.get('registry_id')}:{r.get('status')}" for r in regs),
    }


def head_claim_checks(b: bytes) -> dict:
    d = json.loads(b)
    rows = d.get("checks") or []
    by = collections.Counter(str(r.get("outcome")) for r in rows)
    return {
        "entries": len(rows),
        "head_digest": d.get("outcomes_head_sha256"),
        "last_update": d.get("run_at"),
        "outcomes": dict(sorted(by.items())),
        "checks": [f"{r.get('registry_id')}|{r.get('check')}|{r.get('due')}|{r.get('outcome')}" for r in rows][:24],
    }


def head_corrections_watch(b: bytes) -> dict:
    d = json.loads(b)
    rows = d.get("rows") or []
    states = collections.Counter(str(r.get("state")) for r in rows)
    return {
        "entries": len(rows),
        "last_update": d.get("run_date") or d.get("date") or d.get("generated_at"),
        "row_states": dict(sorted(states.items())),
        "signed": d.get("signed"),
        "scope": "third-party pages; not a record of our own corrections",
    }


def head_layer_o(b: bytes) -> dict:
    d = json.loads(b)
    surf = d["surfaces"]
    chain = d.get("event_chain") or {}
    return {
        "entries": len(surf),
        "surfaces_total_declared": d.get("surfaces_total"),
        "events": chain.get("events"),
        "head_digest": chain.get("head"),
        "last_update": d.get("as_of"),
        "counts_by_state": d.get("counts_by_state"),
    }


def head_receipt_chain(b: bytes) -> dict:
    links = jsonl(b)
    kinds = collections.Counter(str(l.get("kind")) for l in links)
    return {
        "entries": len(links),
        "head_digest": links[-1].get("state_digest") if links else None,
        "last_update": links[-1].get("observed_at") or links[-1].get("at") or links[-1].get("ts") if links else None,
        "kinds": dict(sorted(kinds.items())),
    }


# key, authority_for, url, reader
LEDGERS: list[tuple[str, str, str, Callable[[bytes], dict]]] = [
    ("corrections", "corrections of our own published statements", f"{SITE}/api/corrections", head_corrections),
    ("fix-receipts", "before/after readings that a fix held", f"{SITE}/interop/fix-receipts/fix-receipt-chain.jsonl", head_fix_receipts),
    ("withdrawals-mill-cards", "signed mill cards withdrawn from use", f"{SITE}/interop/mill-cards-signed/WITHDRAWN.jsonl", head_withdrawals),
    ("claim-maintenance-register", "claim state per maintained subject", f"{SITE}/api/claims/register", head_register),
    ("claim-maintenance-checks", "executed day-7/30/90 re-checks of maintained claims", f"{EVIDENCE}/public/interop/claim-maintenance/latest.json", head_claim_checks),
    ("corrections-watch", "whether other organisations' corrections reached their pages", f"{EVIDENCE}/public/interop/corrections-watch/latest.json", head_corrections_watch),
    ("layer-o-presence", "operational surfaces and their contracts (rollup)", f"{SITE}/.well-known/layer-o-presence.json", head_layer_o),
    ("receipt-chain", "what the estate's own loops did, hash-linked", f"{SITE}/interop/receipts/receipt-chain.jsonl", head_receipt_chain),
]


def build_atom(key: str, authority: str, url: str, status: int, body: bytes, reader: Callable[[bytes], dict], as_of: str) -> dict:
    payload: dict[str, Any] = {
        "kind": KIND,
        "ledger": key,
        "authority_for": authority,
        "served_url": url,
        "http_status": status,
        "not_a_grade": True,
    }
    unmeasured = ["whether any entry is correct; this atom commits to the served bytes and their head only"]
    if status == 200 and body:
        try:
            fields = reader(body)
            payload.update({"bytes_sha256": sha(body), "n_bytes": len(body), **fields, "state": "PROBED"})
        except Exception as e:  # a shape we do not recognise is UNMEASURED, never a guess
            payload.update({"bytes_sha256": sha(body), "n_bytes": len(body), "state": "UNMEASURED", "reason": f"unrecognised shape: {type(e).__name__}"})
    else:
        payload.update({"state": "UNMEASURED", "reason": "no body at the served URL on this read"})
    # stay under the staging cap: drop the longest list fields first, keeping their digests
    for k in ("ids", "checks", "registries", "corrections_refs"):
        card = _card(key, payload, url, as_of, unmeasured)
        if len(canonical_bytes(card)) <= CAP:
            break
        if k in payload:
            payload[f"{k}_omitted"] = f"{len(payload[k])} names; over the 3072-byte cap"
            del payload[k]
    return _card(key, payload, url, as_of, unmeasured)


def _card(key: str, payload: dict, url: str, as_of: str, unmeasured: list[str]) -> dict:
    return {
        "schema": SCHEMA,
        "surface": "public.notice",
        "subject": f"Ledger head: {key} (served bytes, digest and count at one read)",
        "as_of": as_of,
        "source_urls": [url],
        "payload": payload,
        "sha256": sha(canonical_bytes(payload)),
        "unmeasured": unmeasured,
        "tags": ["ledger-head", key, TAG],
    }


def selftest() -> int:
    import re, sys as _s
    sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "adapters"))
    import staged_leaves as SL  # the gate the atoms must pass
    ok = True
    corr = json.dumps({"corrections": [{"id": "C-2026-0929-02", "date": "2026-09-29"}, {"id": "C-2026-0901-01", "date": "2026-09-01"}], "signature_state": "VALID"}).encode()
    a = build_atom("corrections", "x", "https://councilof.ai/api/corrections", 200, corr, head_corrections, "2026-09-29T05:00:00Z")
    ok &= a["payload"]["entries"] == 2 and a["payload"]["head_id"] == "C-2026-0929-02" and a["payload"]["state"] == "PROBED"
    ok &= SL._check(a) is None or print("gate refused:", SL._check(a)) is not None and False
    # same bytes at another time -> same payload sha (no new leaf); different bytes -> different
    b = build_atom("corrections", "x", "https://councilof.ai/api/corrections", 200, corr, head_corrections, "2026-09-30T05:00:00Z")
    ok &= a["sha256"] == b["sha256"]
    c = build_atom("corrections", "x", "https://councilof.ai/api/corrections", 200, corr.replace(b"0901", b"0902"), head_corrections, "2026-09-29T05:00:00Z")
    ok &= a["sha256"] != c["sha256"]
    # a swap of equal size is visible: ids_sha256 differs
    ok &= a["payload"]["ids_sha256"] != c["payload"]["ids_sha256"]
    # failed fetch -> UNMEASURED, no count
    f = build_atom("corrections", "x", "https://councilof.ai/api/corrections", 503, b"", head_corrections, "2026-09-29T05:00:00Z")
    ok &= f["payload"]["state"] == "UNMEASURED" and "entries" not in f["payload"] and SL._check(f) is None
    # unrecognised shape -> UNMEASURED
    g = build_atom("corrections", "x", "https://councilof.ai/api/corrections", 200, b"{}", head_corrections, "2026-09-29T05:00:00Z")
    ok &= g["payload"]["state"] == "UNMEASURED"
    # withdrawn rows are never admitted
    w = build_atom("withdrawals-mill-cards", "x", "https://councilof.ai/w.jsonl", 200, b'{"withdrawn_id":"a","correction":"C-1"}\n{"withdrawn_id":"b","correction":"C-1"}\n', head_withdrawals, "2026-09-29T05:00:00Z")
    ok &= w["payload"]["entries"] == 2 and w["payload"]["admitted"] == 0 and w["payload"]["by_correction"] == {"C-1": 2}
    # every atom the gate would see passes it
    for x in (a, b, c, f, g, w):
        r = SL._check(x)
        if r:
            print("gate refused", x["payload"].get("ledger"), r); ok = False
    # the cap is enforced by dropping name lists, keeping digests
    many = json.dumps({"corrections": [{"id": f"C-2026-09{i:02d}-{j:02d}", "date": "2026-09-01"} for i in range(1, 30) for j in range(1, 9)], "signature_state": "VALID"}).encode()
    m = build_atom("corrections", "x", "https://councilof.ai/api/corrections", 200, many, head_corrections, "2026-09-29T05:00:00Z")
    ok &= len(canonical_bytes(m)) <= CAP and "ids" not in m["payload"] and m["payload"]["ids_sha256"] and SL._check(m) is None
    print("selftest", "ok" if ok else "FAILED")
    return 0 if ok else 1


def resolve_root(stage: Path, repo: Path) -> dict:
    """After the root writer ran: which root leaf carries each staged atom?

    The writer turns an atom into a card-v1 whose leaf digest covers the whole card, so the atom's
    own sha256 (payload only) is not the leaf. The join is on the payload: a leaf of public/root.json
    whose card (public/cards/<sha16>.json) carries a payload with the atom's payload digest. Written
    to root-inclusion.json beside the atoms (staged_leaves reads only card-*-unsigned.json, so this
    file never becomes a leaf). A ledger with no matching leaf reads NOT_IN_ROOT, never a guess.
    """
    root = json.loads((repo / "public/root.json").read_text(encoding="utf-8"))
    leaves = list(root.get("card_sha256") or [])
    by_payload: dict[str, str] = {}
    for s in leaves:
        p = repo / "public/cards" / f"{s[:16]}.json"
        try:
            doc = json.loads(p.read_text(encoding="utf-8"))
        except Exception:
            continue
        card = doc.get("card", doc)
        if isinstance(card, dict) and isinstance(card.get("payload"), dict) and card["payload"].get("kind") == KIND:
            by_payload[sha(canonical_bytes(card["payload"]))] = s
    out: dict[str, Any] = {
        "schema": "csoai.ledger-heads-root-inclusion/0.1",
        "root_as_of": root.get("as_of"),
        "merkle_root": root.get("merkle_root"),
        "root_card_count": root.get("card_count"),
        "join": "leaf card payload sha256 == staged atom sha256 (sha256 of the canonical payload)",
        "ledgers": {},
    }
    for f in sorted(stage.glob("card-ledger-*-unsigned.json")):
        atom = json.loads(f.read_text(encoding="utf-8"))
        key = atom["payload"].get("ledger")
        leaf = by_payload.get(atom["sha256"])
        out["ledgers"][key] = {"atom_sha256": atom["sha256"], "leaf_sha256": leaf, "state": "IN_ROOT" if leaf else "NOT_IN_ROOT"}
    (stage / "root-inclusion.json").write_text(json.dumps(out, indent=1, ensure_ascii=False) + "\n", encoding="utf-8")
    return out


def main(argv=None) -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--stage", help="directory to write card-ledger-<key>-unsigned.json into")
    ap.add_argument("--resolve-root", metavar="STAGE", help="after the root writer: record which leaf carries each atom")
    ap.add_argument("--repo", default=str(Path(__file__).resolve().parents[2]))
    ap.add_argument("--selftest", action="store_true")
    a = ap.parse_args(argv)
    if a.selftest:
        return selftest()
    if a.resolve_root:
        r = resolve_root(Path(a.resolve_root), Path(a.repo))
        n = sum(1 for v in r["ledgers"].values() if v["state"] == "IN_ROOT")
        print(f"root {str(r['merkle_root'])[:12]} as_of {r['root_as_of']}: {n}/{len(r['ledgers'])} ledger heads IN_ROOT")
        return 0
    if not a.stage:
        ap.error("--stage is required")
    from datetime import datetime, timezone
    as_of = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    out = Path(a.stage)
    out.mkdir(parents=True, exist_ok=True)
    n_ok = 0
    for key, authority, url, reader in LEDGERS:
        status, body = fetch(url)
        atom = build_atom(key, authority, url, status, body, reader, as_of)
        p = out / f"card-ledger-{key}-unsigned.json"
        prev = None
        if p.exists():
            try:
                prev = json.loads(p.read_text(encoding="utf-8"))
            except Exception:
                prev = None
        # unchanged payload: keep the file byte-identical (as_of of the read that first saw these bytes)
        if prev and prev.get("sha256") == atom["sha256"]:
            print(f"{key}: unchanged {atom['sha256'][:12]} state={atom['payload']['state']}")
        else:
            p.write_text(json.dumps(atom, indent=1, ensure_ascii=False) + "\n", encoding="utf-8")
            print(f"{key}: wrote {atom['sha256'][:12]} state={atom['payload']['state']} http={status} entries={atom['payload'].get('entries')}")
        n_ok += atom["payload"]["state"] == "PROBED"
    print(f"ledger heads: {n_ok}/{len(LEDGERS)} PROBED")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
