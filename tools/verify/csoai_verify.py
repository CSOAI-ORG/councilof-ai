#!/usr/bin/env python3
# SPDX-License-Identifier: CC0-1.0
"""csoai_verify.py — one command: signature under the DID, root inclusion, OTS proof presence.

Handles three card shapes:
  gspc-card       harness/gspc-top100/verify_card.py → verify_signed_card_with_did_doc
                  (sha256(canonical body) == id, Ed25519 under the DID key)
  public-root-card  Ed25519 over canonical {did, schema, surface, as_of, sha256}
  csoai-certificate sha256(canon(payload)) == certificate_id, Ed25519 over canon(payload)
                  under issuer_did — PHASE3 C.3

Then it asks the two published Merkle roots whether they carry this card:
  card-root  /interop/card-root-*.json (csoai.card-root/1). leaf = sha256(canonical WHOLE card,
             sorted keys, compact, ensure_ascii=False). The proof is rebuilt from the published
             leaves and folded per the root's own proof_rule (index parity), and the tree is
             recomputed; n_leaves must equal len(leaves).
  root.json  csoai.public-root/v1. leaf = sha256(canonical(card minus sha256 and sig_ed25519)).
             The root's own Ed25519 signature is checked under did_intended; len(card_sha256) must
             equal card_count (the CVE-2012-2459 caveat the root itself states).

OTS: for the root that includes the card, the sidecar `<root>.ots` is fetched and its
OpenTimestamps magic header checked. PRESENT means a proof file exists — this tool performs
no Bitcoin validation, so it never says "anchored" or "confirmed".

Three card corpora are published and they do not overlap (council-os/CARD-CORPORA.md). The
335 signed cards under /signed/cards are NOT leaves of either root today, so for those this
reports NOT_IN_SUPPLIED_ROOTS — a statement about the roots checked, not an accusation.

Exit: 0 signature VALID and every --require-* held · 1 signature INVALID, or a tamper control
not detected · 2 UNCHECKABLE / usage · 3 signature VALID but a required inclusion/OTS not shown.

  python3 tools/verify/csoai_verify.py https://councilof.ai/signed/cards/<id>.json
  python3 tools/verify/csoai_verify.py card.json --did did.json --card-root card-root.json --no-discover
  python3 tools/verify/csoai_verify.py <card> --tamper-control --require-inclusion --require-ots --json
"""
from __future__ import annotations

import argparse
import base64
import copy
import hashlib
import json
import os
import re
import sys
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

HERE = Path(__file__).resolve().parent
REPO = HERE.parents[1]
sys.path.insert(0, str(REPO / "harness" / "gspc-top100"))
sys.path.insert(0, str(HERE))

from verify_card import verify_signed_card_with_did_doc  # noqa: E402  (the estate library)
import card_v01_validate as v01  # noqa: E402

UA = "csoai-verify/0.1 (+https://councilof.ai/verify)"
DEFAULT_DID = "https://csoai.org/.well-known/did.json"
DEFAULT_ROOT_JSON = "https://councilof.ai/root.json"
EDGE = "https://councilof.ai"
LISTING = "https://api.github.com/repos/CSOAI-ORG/councilof-ai/contents/public/interop?ref=master"
CARD_ROOT_NAME = re.compile(r"^card-root-(\d{4}-\d{2}-\d{2})(?:-[0-9a-f]{12})?\.json$")
OTS_MAGIC = b"\x00OpenTimestamps\x00\x00Proof\x00"


def fetch(src: str) -> bytes:
    if src.startswith(("https://", "http://")):
        req = urllib.request.Request(src, headers={"User-Agent": UA, "Accept": "application/json, */*"})
        with urllib.request.urlopen(req, timeout=30) as r:
            return r.read()
    return Path(src).read_bytes()


def canon(obj, ensure_ascii: bool) -> bytes:
    return json.dumps(obj, sort_keys=True, separators=(",", ":"), ensure_ascii=ensure_ascii).encode("utf-8")


def merkle_levels(leaves_hex: list[str]) -> list[list[bytes]]:
    level = [bytes.fromhex(x) for x in leaves_hex]
    levels = [level]
    while len(level) > 1:
        if len(level) % 2:
            level = level + [level[-1]]  # Bitcoin-style duplication, as both roots declare
        level = [hashlib.sha256(level[i] + level[i + 1]).digest() for i in range(0, len(level), 2)]
        levels.append(level)
    return levels


def proof_for(leaves_hex: list[str], index: int) -> list[bytes]:
    sibs, i = [], index
    for level in merkle_levels(leaves_hex)[:-1]:
        lv = level + [level[-1]] if len(level) % 2 else level
        sibs.append(lv[i ^ 1])
        i //= 2
    return sibs


def fold(leaf_hex: str, index: int, siblings: list[bytes]) -> str:
    cur, i = bytes.fromhex(leaf_hex), index
    for s in siblings:
        cur = hashlib.sha256(cur + s if i % 2 == 0 else s + cur).digest()
        i //= 2
    return cur.hex()


def did_key(did_doc: dict, did: str) -> bytes:
    frag = "#" + did.split("#", 1)[-1]
    for vm in did_doc.get("verificationMethod") or []:
        if str(vm.get("id", "")).endswith(frag):
            x = (vm.get("publicKeyJwk") or {})["x"]
            return base64.urlsafe_b64decode(x + "=" * (-len(x) % 4))
    raise KeyError(f"DID document has no {frag}")


def ots_presence(root_src: str) -> dict:
    side = root_src + ".ots"
    try:
        b = fetch(side)
    except Exception as e:
        return {"state": "ABSENT_AT_SIDECAR_PATH", "sidecar": side, "reason": type(e).__name__,
                "note": "absence at one conventional path is not proof that no proof exists"}
    if not b.startswith(OTS_MAGIC):
        return {"state": "NOT_AN_OTS_FILE", "sidecar": side, "bytes": len(b)}
    return {"state": "PRESENT", "sidecar": side, "bytes": len(b), "sha256": hashlib.sha256(b).hexdigest(),
            "note": "proof file present with OpenTimestamps header; no Bitcoin block validation performed here"}


def check_card_root(card: dict, src: str, doc: dict) -> dict:
    out = {"root": src, "kind": doc.get("kind"), "as_of": doc.get("as_of"), "merkle_root": doc.get("merkle_root")}
    leaves = doc.get("leaves")
    if doc.get("kind") != "csoai.card-root/1" or not isinstance(leaves, list):
        return {**out, "state": "UNCHECKABLE", "reason": "not a csoai.card-root/1 document"}
    if doc.get("n_leaves") != len(leaves):
        return {**out, "state": "UNCHECKABLE", "reason": f"n_leaves {doc.get('n_leaves')} != len(leaves) {len(leaves)}"}
    hexes = [lf.get("leaf") for lf in leaves]
    if merkle_levels(hexes)[-1][0].hex() != doc.get("merkle_root"):
        return {**out, "state": "ROOT_MISMATCH", "reason": "published leaves do not recompute merkle_root"}
    leaf = hashlib.sha256(canon(card, ensure_ascii=False)).hexdigest()
    if leaf not in hexes:
        return {**out, "state": "NOT_INCLUDED", "leaf": leaf}
    idx = hexes.index(leaf)
    if leaves[idx].get("index", idx) != idx:
        return {**out, "state": "UNCHECKABLE", "reason": "leaf index field disagrees with position"}
    proof_ok = fold(leaf, idx, proof_for(hexes, idx)) == doc["merkle_root"]
    return {**out, "state": "INCLUDED" if proof_ok else "PROOF_FAILED", "leaf": leaf, "index": idx, "n_leaves": len(hexes)}


def check_root_json(card: dict, src: str, doc: dict, did_doc: dict | None) -> dict:
    out = {"root": src, "kind": doc.get("kind"), "as_of": doc.get("as_of"), "merkle_root": doc.get("merkle_root")}
    leaves = doc.get("card_sha256")
    if doc.get("kind") != "csoai.public-root/v1" or not isinstance(leaves, list):
        return {**out, "state": "UNCHECKABLE", "reason": "not a csoai.public-root/v1 document"}
    if doc.get("card_count") != len(leaves):
        return {**out, "state": "UNCHECKABLE", "reason": "len(card_sha256) != card_count — rejected per the root's tree_caveat"}
    # The root's own signature: Ed25519 over canonical {kind, schema, as_of, merkle_root, card_count, did_intended}.
    sig_state = "UNCHECKABLE"
    if did_doc is not None and doc.get("sig_ed25519") and doc.get("did_intended"):
        try:
            from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PublicKey

            pre = {k: doc.get(k) for k in ("kind", "schema", "as_of", "merkle_root", "card_count", "did_intended")}
            Ed25519PublicKey.from_public_bytes(did_key(did_doc, doc["did_intended"])).verify(bytes.fromhex(doc["sig_ed25519"]), canon(pre, False))
            sig_state = "VALID"
        except KeyError:
            sig_state = "UNCHECKABLE"
        except Exception:
            sig_state = "INVALID"
    out["root_signature"] = sig_state
    if merkle_levels(leaves)[-1][0].hex() != doc.get("merkle_root"):
        return {**out, "state": "ROOT_MISMATCH"}
    stripped = {k: v for k, v in card.items() if k not in ("sha256", "sig_ed25519")}
    for ea in (False, True):
        leaf = hashlib.sha256(canon(stripped, ea)).hexdigest()
        if leaf in leaves:
            idx = leaves.index(leaf)
            ok = fold(leaf, idx, proof_for(leaves, idx)) == doc["merkle_root"]
            return {**out, "state": "INCLUDED" if ok else "PROOF_FAILED", "leaf": leaf, "index": idx, "n_leaves": len(leaves)}
    return {**out, "state": "NOT_INCLUDED"}


def discover_card_roots(limit: int) -> tuple[list[str], str | None]:
    """Newest card-root files by name, from the repository listing (keyless). Fetched from the edge."""
    try:
        names = [e["name"] for e in json.loads(fetch(LISTING)) if CARD_ROOT_NAME.match(e.get("name", ""))]
    except Exception as e:
        return [], f"card-root discovery failed ({type(e).__name__}); pass --card-root explicitly"
    names.sort(key=lambda n: (CARD_ROOT_NAME.match(n).group(1), n), reverse=True)
    return [f"{EDGE}/interop/{n}" for n in names[:limit]], None


def verify_csoai_certificate(wrapper: dict, did_doc: dict) -> tuple[str, str]:
    """VALID only when the cid matches sha256(canon(payload)) AND the Ed25519
    signature on canon(payload) recovers under the issuer_did key.

    Conformance with public/schemas/csoai-certificate-0.1.schema.json.
    """
    if not isinstance(wrapper, dict) or wrapper.get("schema") != "csoai.certificate/0.1":
        return "UNCHECKABLE", "not a csoai.certificate/0.1 wrapper"
    payload = wrapper.get("payload")
    cid = wrapper.get("certificate_id")
    sig = wrapper.get("sig_ed25519")
    issuer_did = str(wrapper.get("issuer_did") or "did:web:csoai.org#board-attestation-1")
    if not isinstance(payload, dict) or not isinstance(cid, str) or not isinstance(sig, str):
        return "INVALID", "wrapper missing payload, certificate_id, or sig_ed25519"
    preimage = canon(payload, ensure_ascii=False)
    expected_id = hashlib.sha256(preimage).hexdigest()
    if expected_id != cid:
        return "INVALID", "sha256(canon(payload)) != certificate_id"
    try:
        pub = did_key(did_doc, issuer_did)
    except Exception as e:
        return "UNCHECKABLE", f"did {e}"
    try:
        from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PublicKey
        Ed25519PublicKey.from_public_bytes(pub).verify(bytes.fromhex(sig), preimage)
    except ValueError:
        return "INVALID", "sig_ed25519 is not hex"
    except Exception:
        return "INVALID", "signature does not verify over canon(payload)"
    return "VALID", issuer_did


def card_shape(card) -> tuple[str, dict | None]:
    """Detect card / certificate wrapper shapes.

    gspc-card {body,id,signature} · public-root-card {sha256, sig_ed25519, did}
    · csoai-certificate {schema, certificate_id, payload, sig_ed25519, ...}.
    Returns one of {'gspc-card', 'public-root-card', 'csoai-certificate', 'other'}
    plus an inner-dict (the inner for the first two kinds, the wrapper for
    certificates).
    """
    if not isinstance(card, dict):
        return "other", None
    if card.get("schema") == "csoai.certificate/0.1":
        return "csoai-certificate", card
    if isinstance(card.get("body"), dict) and card.get("id"):
        return "gspc-card", card
    inner = card.get("card") if isinstance(card.get("card"), dict) else card
    if all(k in inner for k in ("sha256", "sig_ed25519", "did")):
        return "public-root-card", inner
    return "other", None





def verify_public_root_card(inner: dict, did_doc: dict) -> tuple[str, str]:
    stripped = {k: v for k, v in inner.items() if k not in ("sha256", "sig_ed25519")}
    if inner.get("sha256") not in {hashlib.sha256(canon(stripped, ea)).hexdigest() for ea in (False, True)}:
        return "INVALID", "sha256(canonical card minus sha256, sig_ed25519) != sha256"
    try:
        pub = did_key(did_doc, str(inner["did"]))
    except Exception as e:
        return "UNCHECKABLE", f"did {e}"
    try:
        from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PublicKey

        sig = bytes.fromhex(inner["sig_ed25519"])
    except ValueError:
        return "INVALID", "sig_ed25519 is not hex"
    env = {k: inner.get(k) for k in ("did", "schema", "surface", "as_of", "sha256")}
    for ea in (False, True):
        try:
            Ed25519PublicKey.from_public_bytes(pub).verify(sig, canon(env, ea))
            return "VALID", str(inner["did"])
        except Exception:
            continue
    return "INVALID", "signature does not verify over the compact envelope"


def tamper_bytes(card: dict) -> bytes:
    return json.dumps(v01.tamper(card)).encode("utf-8")


def run(a) -> tuple[int, dict]:
    now = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    report: dict = {"tool": "csoai-verify/0.1", "checked_at": now, "card": a.card}
    try:
        blob = fetch(a.card)
        card = json.loads(blob)
    except Exception as e:
        report["signature"] = {"state": "UNCHECKABLE", "reason": f"card unreadable: {type(e).__name__}"}
        return 2, report
    report["card_id"] = card.get("id") if isinstance(card, dict) else None
    try:
        did_doc = json.loads(fetch(a.did))
        report["did_document"] = a.did
    except Exception as e:
        report["signature"] = {"state": "UNCHECKABLE", "reason": f"DID document unreadable: {type(e).__name__}"}
        return 2, report

    kind, inner = card_shape(card)
    report["card_shape"] = kind
    if kind == "gspc-card":
        verdict, reason = verify_signed_card_with_did_doc(blob, did_doc)
        report["signature"] = {"state": verdict, "detail": reason,
                               "library": "harness/gspc-top100/verify_card.py:verify_signed_card_with_did_doc"}
        schema, _ = v01.load_schema()
        report["shape"] = v01.validate(card, schema)
        if a.tamper_control:
            tv, treason = verify_signed_card_with_did_doc(tamper_bytes(card), did_doc)
            report["tamper_control"] = {"state": "DETECTED" if tv == "INVALID" else "NOT_DETECTED", "tampered_verdict": tv, "detail": treason}
    elif kind == "public-root-card":
        verdict, reason = verify_public_root_card(inner, did_doc)
        report["signature"] = {"state": verdict, "detail": reason, "rule": "sha256 == sha256(canonical(card minus sha256, sig_ed25519)); "
                               "Ed25519 over canonical {did, schema, surface, as_of, sha256} under the DID key"}
        report["shape"] = {"verdict": "NOT_APPLICABLE", "reason": "public-root card, not a card-v0.1 measurement card"}
        if a.tamper_control:
            t = copy.deepcopy(inner)
            t["payload"] = {"tampered": True, "was": t.get("payload")}
            tv, treason = verify_public_root_card(t, did_doc)
            report["tamper_control"] = {"state": "DETECTED" if tv == "INVALID" else "NOT_DETECTED", "tampered_verdict": tv, "detail": treason}
    elif kind == "csoai-certificate":
        verdict, reason = verify_csoai_certificate(inner, did_doc)
        report["signature"] = {"state": verdict, "detail": reason,
                               "rule": "certificate_id == sha256(canon(payload)); Ed25519 over canon(payload) under issuer_did"}
        report["shape"] = {"verdict": "NOT_APPLICABLE", "reason": "paid-entitlement certificate, not a measurement card"}
        report["card_id"] = inner.get("certificate_id")
        if a.tamper_control:
            t = copy.deepcopy(inner)
            t["payload"] = {"tampered": True, "was": t.get("payload")}
            tv, treason = verify_csoai_certificate(t, did_doc)
            report["tamper_control"] = {"state": "DETECTED" if tv == "INVALID" else "NOT_DETECTED", "tampered_verdict": tv, "detail": treason}
    else:
        verdict, reason = "UNCHECKABLE", "NOT_A_CARD: no body/id and not a public-root card — not checked, not accused"
        report["signature"] = {"state": verdict, "detail": reason}

    # Roots
    roots = list(a.card_root or [])
    notes = []
    if not a.no_discover and not roots:
        found, err = discover_card_roots(a.discover_limit)
        roots += found
        if err:
            notes.append(err)
    inclusion = []
    if isinstance(card, dict) and verdict != "UNCHECKABLE":
        for src in roots:
            try:
                inclusion.append(check_card_root(card, src, json.loads(fetch(src))))
            except Exception as e:
                inclusion.append({"root": src, "state": "UNCHECKABLE", "reason": f"unreadable: {type(e).__name__}"})
        if a.root_json:
            try:
                inclusion.append(check_root_json(inner, a.root_json, json.loads(fetch(a.root_json)), did_doc))
            except Exception as e:
                inclusion.append({"root": a.root_json, "state": "UNCHECKABLE", "reason": f"unreadable: {type(e).__name__}"})
    hit = next((r for r in inclusion if r["state"] == "INCLUDED"), None)
    bad = [r for r in inclusion if r["state"] in ("ROOT_MISMATCH", "PROOF_FAILED")]
    if hit:
        inc_state = "INCLUDED"
    elif bad:
        inc_state = "ROOT_INCONSISTENT"
    elif inclusion and all(r["state"] == "NOT_INCLUDED" for r in inclusion):
        inc_state = "NOT_IN_SUPPLIED_ROOTS"
    else:
        inc_state = "UNCHECKABLE"
    report["inclusion"] = {"state": inc_state, "roots_checked": inclusion, "notes": notes}
    report["ots"] = ots_presence(hit["root"]) if hit else {"state": "NOT_APPLICABLE", "reason": "no including root, so no root proof to look for"}
    report["not_established"] = ("A VALID signature says the holder of the published key signed these bytes. It does not say the "
                                 "measurement is correct, complete, or current. INCLUDED says a published root commits to the card; "
                                 "OTS PRESENT says a proof file exists — not that Bitcoin confirmation was checked. Not a certification.")

    if verdict == "INVALID" or report.get("tamper_control", {}).get("state") == "NOT_DETECTED":
        code = 1
    elif verdict != "VALID":
        code = 2
    elif bad:
        code = 1
    elif (a.require_inclusion and inc_state != "INCLUDED") or (a.require_ots and report["ots"]["state"] != "PRESENT"):
        code = 3
    else:
        code = 0
    report["exit_code"] = code
    return code, report


def main(argv=None) -> int:
    ap = argparse.ArgumentParser(description="Verify a CSOAI signed card: DID signature, root inclusion, OTS proof presence.")
    ap.add_argument("card", help="card file path or https URL")
    ap.add_argument("--did", default=DEFAULT_DID, help=f"DID document URL or file (default {DEFAULT_DID})")
    ap.add_argument("--card-root", action="append", help="card-root JSON URL/file (repeatable); disables discovery")
    ap.add_argument("--root-json", default=DEFAULT_ROOT_JSON, help="public root.json URL/file ('' to skip)")
    ap.add_argument("--no-discover", action="store_true", help="do not list recent card-root files")
    ap.add_argument("--discover-limit", type=int, default=4)
    ap.add_argument("--tamper-control", action="store_true", help="mutate the body; the signature check must say INVALID")
    ap.add_argument("--require-inclusion", action="store_true")
    ap.add_argument("--require-ots", action="store_true")
    ap.add_argument("--json", action="store_true")
    ap.add_argument("--github-output", action="store_true", help="append signature/inclusion/ots/tamper outputs to $GITHUB_OUTPUT")
    a = ap.parse_args(argv)
    code, r = run(a)

    if a.github_output and os.environ.get("GITHUB_OUTPUT"):
        with open(os.environ["GITHUB_OUTPUT"], "a", encoding="utf-8") as fh:
            fh.write(f"signature={r.get('signature', {}).get('state', 'UNCHECKABLE')}\n")
            fh.write(f"inclusion={r.get('inclusion', {}).get('state', 'UNCHECKABLE')}\n")
            fh.write(f"ots={r.get('ots', {}).get('state', 'NOT_APPLICABLE')}\n")
            fh.write(f"tamper_control={r.get('tamper_control', {}).get('state', 'NOT_RUN')}\n")
            cid = r.get("card_id")
            fh.write(f"id={cid if isinstance(cid, str) and re.fullmatch(r'[0-9a-f]{64}', cid) else ''}\n")
    if a.json:
        print(json.dumps(r, indent=1))
    else:
        s = r.get("signature", {})
        print(f"card       {r['card']}")
        print(f"signature  {s.get('state')}  ({s.get('detail') or s.get('reason')})")
        if "shape" in r:
            print(f"shape/id   {r['shape'].get('verdict')}  schema={r['shape'].get('schema')} id={r['shape'].get('id')}")
        if "tamper_control" in r:
            print(f"tamper     {r['tamper_control']['state']}  (mutated body → {r['tamper_control']['tampered_verdict']})")
        inc = r.get("inclusion", {})
        print(f"inclusion  {inc.get('state')}")
        for x in inc.get("roots_checked", []):
            print(f"  - {x['state']:<14} {x['root']}" + (f"  index {x['index']}/{x['n_leaves']}" if "index" in x else "")
                  + (f"  root_signature={x['root_signature']}" if "root_signature" in x else ""))
        for n in inc.get("notes", []):
            print(f"  note: {n}")
        print(f"ots        {r.get('ots', {}).get('state')}  {r.get('ots', {}).get('sidecar', '')}")
        print(f"exit       {code}")
    return code


if __name__ == "__main__":
    sys.exit(main())
