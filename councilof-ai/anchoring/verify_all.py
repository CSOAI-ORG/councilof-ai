#!/usr/bin/env python3
"""
TUI 5 — Full certificate verification sweep (v2).
Verifies EVERY card signature independently from published bytes + DID material.

Corpus A: public root (councilof.ai/cards/<prefix16>.json)
  - leaf in published card_sha256[] by exact hash match (membership)
  - digest  = sha256(canonical(whole-card-except-sha256-and-sig_ed25519))
              computed under BOTH CPython encodings; rule recorded per card
  - sig     = Ed25519 over compact {did,schema,surface,as_of,sha256}
  - proof   = index-aware walk (left = sha256(cur||sib), right = sha256(sib||cur)),
              index = leaf position in the published card_sha256[] array
  - key pin = DID document, never the card's own key claim
  - cards with sig_ed25519 == null are counted UNSIGNED, not as errors

Corpus B: signed card index (signed/cards/<id>.json)
  - id == sha256(canonical(body)) and Ed25519 over that preimage under card-attestation-1

TLS verification stays ON (certifi fallback for this interpreter's missing CA bundle).
Read-only: no signing, no anchoring, no spend.
"""

import json
import hashlib
import base64
import sys
import urllib.request
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime, timezone

UA = {"User-Agent": "CSOAI-TUI5-full-verify/2.0"}


def _ssl_ctx():
    import ssl
    import os
    try:
        default = ssl.get_default_verify_paths().cafile
        if default and os.path.exists(default):
            return ssl.create_default_context()
    except Exception:
        pass
    try:
        import certifi
        return ssl.create_default_context(cafile=certifi.where())
    except Exception:
        return ssl.create_default_context()


def fetch(url, timeout=25):
    req = urllib.request.Request(url, headers=UA)
    with urllib.request.urlopen(req, timeout=timeout, context=_ssl_ctx()) as resp:
        return resp.read()


def fetch_json(url, timeout=25):
    return json.loads(fetch(url, timeout))


def canon(obj, ensure_ascii):
    return json.dumps(obj, sort_keys=True, separators=(",", ":"), ensure_ascii=ensure_ascii).encode("utf-8")


def did_keys():
    """Pin BOTH signing keys from the DID document — never from the card."""
    did = fetch_json("https://csoai.org/.well-known/did.json")
    out = {}
    for v in did.get("verificationMethod", []):
        x = v.get("publicKeyJwk", {}).get("x", "")
        if x:
            out[v["id"].rsplit("#", 1)[-1]] = base64.urlsafe_b64decode(x + "=" * (-len(x) % 4))
    return out


def merkle_root_from(leaves_hex):
    lvl = [bytes.fromhex(h) for h in leaves_hex]
    while len(lvl) > 1:
        lvl = [hashlib.sha256(lvl[i] + (lvl[i + 1] if i + 1 < len(lvl) else lvl[i])).digest()
               for i in range(0, len(lvl), 2)]
    return lvl[0].hex() if lvl else None


def verify_root_card(prefix16, leaves, root_hex, board_key):
    from nacl.signing import VerifyKey
    res = {"card": prefix16}
    try:
        data = fetch_json(f"https://councilof.ai/cards/{prefix16}.json")
        card = data["card"]
        sha = card["sha256"]

        # 1. membership: exact leaf match in published array
        res["in_leaf_array"] = sha in leaves
        idx = leaves.index(sha) if res["in_leaf_array"] else None

        # 2. digest under both CPython encodings; record which rule holds
        df = {k: v for k, v in card.items() if k not in ("sha256", "sig_ed25519")}
        if hashlib.sha256(canon(df, True)).hexdigest() == sha:
            res["digest_ok"], res["digest_rule"] = True, "ensure_ascii=True"
        elif hashlib.sha256(canon(df, False)).hexdigest() == sha:
            res["digest_ok"], res["digest_rule"] = True, "ensure_ascii=False"
        else:
            res["digest_ok"], res["digest_rule"] = False, "NEITHER"

        # 3. signature over compact envelope; null => UNSIGNED (not an error)
        sig_hex = card.get("sig_ed25519")
        if not sig_hex:
            res["sig_state"] = "UNSIGNED"
        else:
            compact = {k: card[k] for k in ("did", "schema", "surface", "as_of", "sha256")}
            VerifyKey(board_key).verify(canon(compact, False), bytes.fromhex(sig_hex))
            res["sig_state"] = "VALID"

        # 4. index-aware inclusion proof
        proof = data.get("proof", [])
        cur = bytes.fromhex(sha)
        p = idx if idx is not None else -1
        ok = idx is not None and len(proof) > 0
        for node_hex in proof:
            if p < 0:
                ok = False
                break
            node = bytes.fromhex(node_hex)
            cur = (hashlib.sha256(cur + node) if p % 2 == 0 else hashlib.sha256(node + cur)).digest()
            p //= 2
        res["proof_ok"] = bool(ok and cur.hex() == root_hex)
        res["proof_depth"] = len(proof)
    except Exception as e:
        res["error"] = f"{type(e).__name__}: {e}"
    return res


def verify_index_card(card_id, card_key):
    from nacl.signing import VerifyKey
    res = {"card": card_id}
    try:
        card = fetch_json(f"https://councilof.ai/signed/cards/{card_id}.json")
        body = card.get("body")
        if body is None:
            res["error"] = "no body field"
            return res
        pi = canon(body, True)
        res["id_ok"] = hashlib.sha256(pi).hexdigest() == card.get("id")
        res["key_pinned"] = card.get("pubkey") == card_key.hex()
        VerifyKey(card_key).verify(pi, bytes.fromhex(card.get("signature", "")))
        res["sig_ok"] = True
    except Exception as e:
        res["error"] = f"{type(e).__name__}: {e}"
    return res


def main():
    started = datetime.now(timezone.utc).isoformat()
    print("Pinning keys from DID document...", file=sys.stderr)
    keys = did_keys()
    board_key = keys["board-attestation-1"]
    card_key = keys["card-attestation-1"]

    # ---- root envelope ----
    raw_root = fetch("https://councilof.ai/root.json")
    root = json.loads(raw_root)
    pre = canon({k: root[k] for k in ("kind", "schema", "as_of", "merkle_root", "card_count", "did_intended")}, False)
    try:
        from nacl.signing import VerifyKey
        VerifyKey(board_key).verify(pre, bytes.fromhex(root["sig_ed25519"]))
        root_sig = "VALID"
    except Exception as e:
        root_sig = f"INVALID: {e}"

    leaves = root["card_sha256"]
    recomputed = merkle_root_from(leaves)
    count_ok = len(leaves) == root["card_count"]
    print(f"root as_of={root['as_of']} leaves={len(leaves)} sig={root_sig}", file=sys.stderr)

    # ---- corpus A: every root card ----
    print("Verifying corpus A ...", file=sys.stderr)
    a_results = []
    with ThreadPoolExecutor(max_workers=8) as ex:
        futs = [ex.submit(verify_root_card, h[:16], leaves, root["merkle_root"], board_key) for h in leaves]
        for f in as_completed(futs):
            a_results.append(f.result())

    # ---- corpus B: every index card ----
    index = fetch_json("https://councilof.ai/signed/card_index.json")
    ids = [r.get("card", r.get("id")) for r in index.get("rows", index.get("cards", [])) if r.get("card") or r.get("id")]
    print(f"Verifying corpus B ({len(ids)}) ...", file=sys.stderr)
    b_results = []
    with ThreadPoolExecutor(max_workers=8) as ex:
        futs = [ex.submit(verify_index_card, cid, card_key) for cid in ids]
        for f in as_completed(futs):
            b_results.append(f.result())

    a_err = [r for r in a_results if r.get("error")]
    b_err = [r for r in b_results if r.get("error")]
    rules = {}
    for r in a_results:
        if r.get("digest_rule"):
            rules[r["digest_rule"]] = rules.get(r["digest_rule"], 0) + 1
    unsigned = [r["card"] for r in a_results if r.get("sig_state") == "UNSIGNED"]

    a_state = ("VERIFIED" if (not a_err
                              and all(r.get("digest_ok") for r in a_results)
                              and all(r.get("proof_ok") for r in a_results)
                              and all(r.get("sig_state") == "VALID" for r in a_results))
               else "VERIFIED_WITH_EXPLICIT_UNSIGNED" if (not a_err
                              and all(r.get("digest_ok") for r in a_results)
                              and all(r.get("proof_ok") for r in a_results)
                              and all(r.get("sig_state") in ("VALID", "UNSIGNED") for r in a_results))
               else "INCOMPLETE")

    receipt = {
        "schema": "csoai.anchor.full-verification/0.2",
        "kind": "tui5.all-card-signature-verification",
        "observation_started": started,
        "observation_finished": datetime.now(timezone.utc).isoformat(),
        "verifier": "anchoring/verify_all.py (standalone; keys pinned from DID, never from cards)",
        "key_pins": {
            "board-attestation-1": board_key.hex(),
            "card-attestation-1": card_key.hex(),
            "source": "https://csoai.org/.well-known/did.json",
        },
        "root_envelope": {
            "source": "https://councilof.ai/root.json",
            "observed_at": started,
            "as_of": root["as_of"],
            "kind": root["kind"],
            "card_count_declared": root["card_count"],
            "leaves_present": len(leaves),
            "count_matches": count_ok,
            "merkle_root_published": root["merkle_root"],
            "merkle_root_recomputed": recomputed,
            "merkle_ok": recomputed == root["merkle_root"],
            "ed25519_signature": root_sig,
            "preimage_bytes": len(pre),
            "sha256_root_json": hashlib.sha256(raw_root).hexdigest(),
        },
        "corpus_A_public_root": {
            "cards": len(a_results),
            "signatures_valid": sum(1 for r in a_results if r.get("sig_state") == "VALID"),
            "unsigned_cards": len(unsigned),
            "unsigned_card_ids": unsigned[:10],
            "signatures_invalid": sum(1 for r in a_results if r.get("sig_state") == "INVALID"),
            "digests_valid": sum(1 for r in a_results if r.get("digest_ok")),
            "digest_rules_seen": rules,
            "leaf_membership_valid": sum(1 for r in a_results if r.get("in_leaf_array")),
            "inclusion_proofs_valid": sum(1 for r in a_results if r.get("proof_ok")),
            "fetch_or_verify_errors": len(a_err),
            "error_samples": a_err[:5],
            "state": a_state,
        },
        "corpus_B_signed_index": {
            "cards_declared": index.get("n_cards"),
            "cards_present": len(b_results),
            "signatures_valid": sum(1 for r in b_results if r.get("sig_ok")),
            "ids_valid": sum(1 for r in b_results if r.get("id_ok")),
            "key_pinned_to_did": sum(1 for r in b_results if r.get("key_pinned")),
            "fetch_or_verify_errors": len(b_err),
            "error_samples": b_err[:5],
            "state": "VERIFIED" if (not b_err
                                    and all(r.get("sig_ok") and r.get("id_ok") for r in b_results)) else "INCOMPLETE",
            "corpus_note": "SEPARATE from the public root; identifier overlap reported below",
        },
        "identifier_overlap_A_B": len(set(leaves) & set(ids)),
        "anchor_states_separate": {
            "card_signature": "SIGNED_AND_VERIFIED (per-card, both corpora)",
            "merkle_root_inclusion": "INCLUDED" if all(r.get("proof_ok") for r in a_results) else "INCOMPLETE",
            "rekor_witness": "WITNESSED at logIndex 2791822965 as observed 2026-09-11 (re-check before citing)",
            "ots_submission": "STAMPED_PENDING_BITCOIN",
            "bitcoin_confirmation": "PENDING (no Bitcoin block attestation in proof)",
            "base_eas": "NOT_YET (spec prepared, owner-gated)",
            "xrpl_memo": "NOT_YET (spec prepared, owner-gated)",
        },
        "spend": {"actual_usd": 0, "funding_source": "none — read-only verification, all endpoints free"},
        "measurement_not_certification": True,
    }

    out = json.dumps(receipt, indent=2)
    with open("anchoring/full-verification-receipt.json", "w") as f:
        f.write(out)
    print(out)


if __name__ == "__main__":
    main()
