#!/usr/bin/env python3
"""rekor_inclusion_verify.py — verify a Rekor entry's SET, inclusion proof, checkpoint.

G4.2 of the TUI-4 "ROOTS & IDENTITY" V3 brief. The estate witnesses its public
root into Rekor hourly (scripts/witness_public_root.py; committed entries at
public/interop/rekor-root-*.json and the pointer at
public/interop/root-witness-latest.json). This script independently verifies
what that witnessing actually claims. Three-state verdicts per check and
  overall: VALID / INVALID / UNCHECKABLE. Network failure, missing material, or
an unpinned construction is UNCHECKABLE, never INVALID and never zero-filled.

HONEST SCOPE — read this before reading a verdict:
  Inclusion in Rekor proves ONE thing: these exact entry bytes existed in the
  transparency log at integratedTime, under a tree head Rekor signed. It does
  NOT prove the bytes are correct, current, unique, complete, or endorsed.
  The publisher could have witnessed a root it never deployed (the drift
  check in witness_public_root.py is the counterweight). Existence and time —
  nothing more. Never a certification.

Constructions pinned to PRIMARY SOURCES (not guessed):

  (a) SET (signedEntryTimestamp) — sigstore/rekor main,
      pkg/verify/verify.go VerifySignedEntryTimestamp: the signed payload is
      the RFC 8785 (JCS) canonicalisation of
      {"body":<base64 string as returned>, "integratedTime":<int>,
       "logID":<hex string>, "logIndex":<int>}
      where logIndex is the entry's TOP-LEVEL (virtual) log index, and the
      signature (base64, ASN.1 DER) is ECDSA P-256 + SHA-256 against the log
      public key from /api/v1/log/publicKey (PEM PKIX). The entry logID MUST
      equal SHA-256(SPKI DER) of that same key; a valid signature under an
      unrelated supplied key is rejected. For this four-field
      payload (ASCII keys, integers, one string) Python's
      json.dumps(sort_keys=True, separators=(",",":")) IS the JCS encoding —
      asserted field-by-field here rather than assumed generally.

  (b) Merkle inclusion — sigstore/rekor pkg/verify/verify.go VerifyInclusion
      delegating to transparency-dev/merkle proof.VerifyInclusion with the
      RFC 6962 hasher: leafHash = SHA256(0x00 || base64decode(body));
      node = SHA256(0x01 || left || right). Proof decomposition (pinned to
      transparency-dev/merkle proof/verify.go):
        inner  = bit_length(logIndex XOR (treeSize-1))
        border = popcount(logIndex >> inner)
        len(hashes) MUST equal inner+border;
        chain inner proof left/right by index bits (LSB first);
        chain border proof on the LEFT only;
        the result must equal rootHash (hex) byte-for-byte.

  (c) Checkpoint — sigstore/rekor pkg/util/checkpoint.go + signed_note.go.
      The checkpoint is a "note": the signed message is the checkpoint text
      itself ("rekor.sigstore.dev - <treeID>\n<size>\n<base64 rootHash>\n
      [Timestamp: <unix nanos>\n]"), followed by a blank line and a
      signature line "— rekor.sigstore.dev <base64>". The decoded signature
      is uint32_be key_hint || ASN.1 DER ECDSA, where key_hint = the first 4
      bytes of SHA-256(x509 SPKI DER of the log public key). Verifies with
      ECDSA P-256 + SHA-256 over the note text. The checkpoint's root hash
      must equal the inclusion proof's rootHash and its size MUST equal the
      proof treeSize — both are fail-closed bindings.

Usage:
  rekor_inclusion_verify.py <entry-uuid>
  rekor_inclusion_verify.py --latest          # uuid from public/interop/root-witness-latest.json
  rekor_inclusion_verify.py --entry-file public/interop/rekor-root-a6f79e25.json [--offline]
  rekor_inclusion_verify.py --selftest        # structural checks, no network

Exit codes: 0 VALID (all checks VALID); 1 INVALID (any check INVALID);
2 UNCHECKABLE (fetch/parse failure or missing material).
"""
from __future__ import annotations

import argparse
import base64
import hashlib
import json
import sys
import urllib.error
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
WITNESS_LATEST = ROOT / "public" / "interop" / "root-witness-latest.json"
REKOR = "https://rekor.sigstore.dev"
UA = "csoai-rekor-inclusion-verify/1 (+https://councilof.ai)"
# Reviewed Rekor production log key ID observed in the public entry/key pair.
# Rotation requires an explicit reviewed update or --expected-log-id override;
# silently trusting whatever key an endpoint returns would defeat offline trust.
PRODUCTION_REKOR_LOG_ID = "c0d23d6ad406973f9559f3ba2d1ca01f84147d8ffc5b8445c224f98b9591801d"

VALID, INVALID, UNCHECKABLE = "VALID", "INVALID", "UNCHECKABLE"


def _get(url: str, timeout: int = 60) -> bytes:
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": "application/json"})
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return r.read()


def load_entry(args) -> tuple[str | None, dict | None, str | None]:
    """Return (uuid, entry, error)."""
    if args.entry_file:
        try:
            blob = json.loads(Path(args.entry_file).read_text(encoding="utf-8"))
            uuid = next(iter(blob))
            return uuid, blob[uuid], None
        except Exception as exc:
            return None, None, f"cannot read entry file: {type(exc).__name__}: {exc}"
    if args.offline:
        return None, None, "--offline requires --entry-file"
    uuid = args.uuid
    if args.latest:
        try:
            uuid = (json.loads(WITNESS_LATEST.read_text(encoding="utf-8"))
                    .get("witnesses", {}).get("rekor", {}).get("uuid"))
        except Exception as exc:
            return None, None, f"cannot read {WITNESS_LATEST}: {type(exc).__name__}"
        if not uuid:
            return None, None, "root-witness-latest.json carries no rekor uuid"
    if not uuid:
        return None, None, "no uuid given (positional, --latest, or --entry-file)"
    try:
        blob = json.loads(_get(f"{REKOR}/api/v1/log/entries/{uuid}"))
        return uuid, blob[uuid], None
    except (urllib.error.URLError, KeyError, json.JSONDecodeError, TimeoutError) as exc:
        return uuid, None, f"cannot fetch entry: {type(exc).__name__}: {str(exc)[:160]}"


def load_log_pubkey(args):
    """Rekor log public key (ECDSA P-256, PEM PKIX)."""
    if args.pubkey_file:
        pem = Path(args.pubkey_file).read_bytes()
    else:
        if args.offline:
            raise ValueError("--offline requires --pubkey-file")
        pem = _get(f"{REKOR}/api/v1/log/publicKey")
        # Content negotiation: with Accept: application/json the API returns a
        # JSON-quoted PEM string; with a browser UA it returns raw PEM
        # (application/x-pem-file). Accept both — pinned empirically 2026-09-12.
        if pem.startswith(b'"'):
            pem = json.loads(pem.decode("utf-8")).encode("utf-8")
    from cryptography.hazmat.primitives.serialization import load_pem_public_key
    return load_pem_public_key(pem)


def _spki_der(pubkey) -> bytes:
    from cryptography.hazmat.primitives import serialization
    return pubkey.public_bytes(
        serialization.Encoding.DER,
        serialization.PublicFormat.SubjectPublicKeyInfo,
    )


def expected_log_id(pubkey) -> str:
    """Rekor log ID: SHA-256 of the log key's PKIX SubjectPublicKeyInfo DER."""
    return hashlib.sha256(_spki_der(pubkey)).hexdigest()


def check_log_identity(entry: dict, pubkey,
                       pinned_log_id: str = PRODUCTION_REKOR_LOG_ID) -> dict:
    log_id = entry.get("logID")
    expected = expected_log_id(pubkey)
    if not isinstance(log_id, str) or len(log_id) != 64:
        return {"check": "log_identity", "verdict": UNCHECKABLE,
                "reason": "entry.logID is missing or not a 32-byte hex string"}
    try:
        bytes.fromhex(log_id)
    except ValueError:
        return {"check": "log_identity", "verdict": UNCHECKABLE,
                "reason": "entry.logID is not hexadecimal"}
    if log_id.lower() != expected or expected != pinned_log_id.lower():
        return {"check": "log_identity", "verdict": INVALID,
                "detail": "entry.logID, sha256(SPKI DER), and the pinned expected Rekor log ID do not all match",
                "entry_log_id": log_id.lower(), "key_log_id": expected,
                "expected_log_id": pinned_log_id.lower()}
    return {"check": "log_identity", "verdict": VALID,
            "detail": "entry.logID binds the same SPKI key used for SET and checkpoint verification",
            "log_id": expected}


def check_set(entry: dict, pubkey) -> dict:
    """(a) SET over the JCS-canonical bundle; construction pinned in the docstring."""
    need = [entry.get("body"), entry.get("integratedTime"), entry.get("logID"), entry.get("logIndex")]
    set_b64 = (entry.get("verification") or {}).get("signedEntryTimestamp")
    if not all(v is not None for v in need) or not set_b64:
        return {"check": "set", "verdict": UNCHECKABLE,
                "reason": "entry omits body/integratedTime/logID/logIndex or verification.signedEntryTimestamp"}
    # Field-type assertions: JCS equality with Python's canonical form is only
    # claimed for THIS shape (ints, ASCII-keyed strings). Asserted, not assumed.
    if not (isinstance(entry["body"], str) and isinstance(entry["integratedTime"], int)
            and isinstance(entry["logID"], str) and isinstance(entry["logIndex"], int)):
        return {"check": "set", "verdict": UNCHECKABLE,
                "reason": "entry field types differ from the pinned construction; refusing to guess"}
    bundle = {"body": entry["body"], "integratedTime": entry["integratedTime"],
              "logID": entry["logID"], "logIndex": entry["logIndex"]}
    canonical = json.dumps(bundle, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode("utf-8")
    try:
        from cryptography.hazmat.primitives.asymmetric import ec
        from cryptography.hazmat.primitives import hashes
        pubkey.verify(base64.b64decode(set_b64), canonical, ec.ECDSA(hashes.SHA256()))
        return {"check": "set", "verdict": VALID,
                "detail": "ECDSA P-256/SHA-256 over JCS({body,integratedTime,logID,logIndex})",
                "integratedTime": entry["integratedTime"]}
    except Exception:
        return {"check": "set", "verdict": INVALID,
                "detail": "signature does not verify against the Rekor log public key"}


def _node(l: bytes, r: bytes) -> bytes:
    return hashlib.sha256(b"\x01" + l + r).digest()


def check_inclusion(entry: dict) -> dict:
    """(b) RFC 6962 inclusion proof, transparency-dev algorithm (pinned in docstring)."""
    ip = (entry.get("verification") or {}).get("inclusionProof") or {}
    if not all(k in ip for k in ("hashes", "logIndex", "rootHash", "treeSize")) or not entry.get("body"):
        return {"check": "inclusion", "verdict": UNCHECKABLE,
                "reason": "entry omits verification.inclusionProof (hashes/logIndex/rootHash/treeSize) or body"}
    try:
        leaf = hashlib.sha256(b"\x00" + base64.b64decode(entry["body"])).digest()
        index, size = int(ip["logIndex"]), int(ip["treeSize"])
        hashes = [bytes.fromhex(h) for h in ip["hashes"]]
        want_root = bytes.fromhex(ip["rootHash"])
    except Exception as exc:
        return {"check": "inclusion", "verdict": UNCHECKABLE,
                "reason": f"proof material undecodable: {type(exc).__name__}"}
    if index >= size:
        return {"check": "inclusion", "verdict": INVALID,
                "detail": f"logIndex {index} >= treeSize {size}"}
    inner = (index ^ (size - 1)).bit_length()
    border = bin(index >> inner).count("1")
    if len(hashes) != inner + border:
        return {"check": "inclusion", "verdict": INVALID,
                "detail": f"proof length {len(hashes)} != inner+border {inner}+{border}"}
    node = leaf
    for i, h in enumerate(hashes[:inner]):
        node = _node(node, h) if ((index >> i) & 1) == 0 else _node(h, node)
    for h in hashes[inner:]:
        node = _node(h, node)
    if node != want_root:
        return {"check": "inclusion", "verdict": INVALID,
                "detail": "chained proof does not reach rootHash",
                "calculated_root": node.hex(), "claimed_root": ip["rootHash"]}
    return {"check": "inclusion", "verdict": VALID,
            "detail": f"RFC6962 audit path: leaf@index {index} of tree size {size} reaches rootHash",
            "leaf_sha256": leaf.hex(), "rootHash": ip["rootHash"], "treeSize": size}


def check_checkpoint(entry: dict, pubkey) -> dict:
    """(c) note-format checkpoint signature + root-hash agreement (pinned in docstring)."""
    ip = (entry.get("verification") or {}).get("inclusionProof") or {}
    cp = ip.get("checkpoint")
    if not cp:
        return {"check": "checkpoint", "verdict": UNCHECKABLE,
                "reason": "inclusionProof carries no checkpoint"}
    try:
        text, sep, sigblock = cp.partition("\n\n")
        if not sep:
            return {"check": "checkpoint", "verdict": INVALID, "detail": "no blank line before signature block"}
        note_text = (text + "\n").encode("utf-8")
        lines = [ln for ln in sigblock.strip().split("\n") if ln.strip()]
        name, sig_b64 = None, None
        for ln in lines:
            if ln.startswith("— "):
                name, sig_b64 = ln[2:].rsplit(" ", 1)
        if not sig_b64:
            return {"check": "checkpoint", "verdict": INVALID, "detail": "no '— name sig' line"}
        raw = base64.b64decode(sig_b64)
        hint, sig = int.from_bytes(raw[:4], "big"), raw[4:]
        origin, size_s, root_b64 = text.split("\n")[:3]
        cp_root = base64.b64decode(root_b64)
    except Exception as exc:
        return {"check": "checkpoint", "verdict": INVALID,
                "detail": f"checkpoint unparseable: {type(exc).__name__}"}
    spki = _spki_der(pubkey)
    if hint != int.from_bytes(hashlib.sha256(spki).digest()[:4], "big"):
        return {"check": "checkpoint", "verdict": INVALID,
                "detail": "key hint != first 4 bytes of sha256(SPKI DER) of the Rekor log key"}
    try:
        from cryptography.hazmat.primitives.asymmetric import ec
        from cryptography.hazmat.primitives import hashes
        pubkey.verify(sig, note_text, ec.ECDSA(hashes.SHA256()))
    except Exception:
        return {"check": "checkpoint", "verdict": INVALID,
                "detail": f"ECDSA signature over checkpoint text does not verify (signer '{name}')"}
    root_match = cp_root.hex() == (ip.get("rootHash") or "")
    if not root_match:
        return {"check": "checkpoint", "verdict": INVALID,
                "detail": "signed checkpoint root != inclusionProof.rootHash"}
    try:
        checkpoint_size = int(size_s)
        proof_size = int(ip.get("treeSize"))
    except (TypeError, ValueError):
        return {"check": "checkpoint", "verdict": INVALID,
                "detail": "checkpoint size or proof treeSize is not an integer"}
    if checkpoint_size != proof_size:
        return {"check": "checkpoint", "verdict": INVALID,
                "detail": "signed checkpoint size != inclusionProof.treeSize",
                "checkpoint_size": checkpoint_size, "proof_tree_size": proof_size}
    if name != "rekor.sigstore.dev" or not origin.startswith("rekor.sigstore.dev - "):
        return {"check": "checkpoint", "verdict": INVALID,
                "detail": "checkpoint origin/signer is not the pinned Rekor production identity",
                "origin": origin, "signer": name}
    return {"check": "checkpoint", "verdict": VALID,
            "detail": f"note signed by '{name}'; key hint matches; signed root == proof root",
            "origin": origin, "checkpoint_size": checkpoint_size,
            "size_matches_proof": True}


def verify_entry(entry: dict, pubkey,
                 pinned_log_id: str = PRODUCTION_REKOR_LOG_ID) -> dict:
    checks = [check_log_identity(entry, pubkey, pinned_log_id), check_set(entry, pubkey),
              check_inclusion(entry), check_checkpoint(entry, pubkey)]
    verdicts = [c["verdict"] for c in checks]
    overall = INVALID if INVALID in verdicts else (UNCHECKABLE if UNCHECKABLE in verdicts else VALID)
    return {"overall": overall, "checks": checks,
            "scope": "timestamped existence of these exact entry bytes in the Rekor log — nothing more; never a certification"}


def selftest() -> int:
    """Cryptographic positive case plus fail-closed identity/size negatives."""
    from cryptography.hazmat.primitives.asymmetric import ec
    from cryptography.hazmat.primitives import hashes

    private = ec.generate_private_key(ec.SECP256R1())
    key = private.public_key()
    body = base64.b64encode(b"{}").decode()
    leaf = hashlib.sha256(b"\x00" + b"{}").digest()
    log_id = expected_log_id(key)
    note = f"rekor.sigstore.dev - 123\n1\n{base64.b64encode(leaf).decode()}\n"
    hint = hashlib.sha256(_spki_der(key)).digest()[:4]
    cp_sig = hint + private.sign(note.encode(), ec.ECDSA(hashes.SHA256()))
    checkpoint = note + "\n— rekor.sigstore.dev " + base64.b64encode(cp_sig).decode() + "\n"
    entry = {
        "body": body, "integratedTime": 1, "logID": log_id, "logIndex": 0,
        "verification": {"inclusionProof": {
            "hashes": [], "logIndex": 0, "treeSize": 1,
            "rootHash": leaf.hex(), "checkpoint": checkpoint,
        }},
    }
    bundle = {k: entry[k] for k in ("body", "integratedTime", "logID", "logIndex")}
    canonical = json.dumps(bundle, sort_keys=True, separators=(",", ":")).encode()
    entry["verification"]["signedEntryTimestamp"] = base64.b64encode(
        private.sign(canonical, ec.ECDSA(hashes.SHA256()))
    ).decode()
    assert verify_entry(entry, key, log_id)["overall"] == VALID

    wrong_id = json.loads(json.dumps(entry))
    wrong_id["logID"] = "00" * 32
    assert check_log_identity(wrong_id, key, log_id)["verdict"] == INVALID
    assert verify_entry(wrong_id, key, log_id)["overall"] == INVALID

    unrelated_key = ec.generate_private_key(ec.SECP256R1()).public_key()
    assert check_log_identity(entry, unrelated_key, log_id)["verdict"] == INVALID

    wrong_size = json.loads(json.dumps(entry))
    wrong_note = f"rekor.sigstore.dev - 123\n2\n{base64.b64encode(leaf).decode()}\n"
    wrong_cp_sig = hint + private.sign(wrong_note.encode(), ec.ECDSA(hashes.SHA256()))
    wrong_size["verification"]["inclusionProof"]["checkpoint"] = (
        wrong_note + "\n— rekor.sigstore.dev " + base64.b64encode(wrong_cp_sig).decode() + "\n"
    )
    assert check_checkpoint(wrong_size, key)["verdict"] == INVALID
    assert verify_entry(wrong_size, key, log_id)["overall"] == INVALID

    wrong_index = json.loads(json.dumps(entry))
    wrong_index["verification"]["inclusionProof"]["logIndex"] = 1
    assert check_inclusion(wrong_index)["verdict"] == INVALID
    missing = check_set({"verification": {}}, key)
    assert missing["verdict"] == UNCHECKABLE
    print("selftest: valid bundle accepted; wrong logID/SPKI, checkpoint size, and proof index rejected")
    return 0


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("uuid", nargs="?", default=None, help="Rekor entry UUID")
    ap.add_argument("--latest", action="store_true",
                    help="use the uuid committed in public/interop/root-witness-latest.json")
    ap.add_argument("--entry-file", help="use a committed entry JSON instead of fetching")
    ap.add_argument("--pubkey-file", help="PEM of the Rekor log public key (default: fetch)")
    ap.add_argument("--offline", action="store_true",
                    help="forbid network access; requires --entry-file and --pubkey-file")
    ap.add_argument("--rekor-url", default=None, help="override the Rekor base URL")
    ap.add_argument("--expected-log-id", default=PRODUCTION_REKOR_LOG_ID,
                    help="reviewed sha256(SPKI DER) trust anchor; defaults to Rekor production")
    ap.add_argument("--selftest", action="store_true")
    args = ap.parse_args()
    if args.rekor_url:
        global REKOR
        REKOR = args.rekor_url.rstrip("/")
    if args.selftest:
        return selftest()

    uuid, entry, err = load_entry(args)
    if err:
        print(json.dumps({"overall": UNCHECKABLE, "uuid": uuid, "reason": err,
                          "scope": "network/fetch failure says nothing about the entry"}, indent=1))
        return 2
    try:
        pubkey = load_log_pubkey(args)
    except Exception as exc:
        print(json.dumps({"overall": UNCHECKABLE, "uuid": uuid,
                          "reason": f"log public key unavailable: {type(exc).__name__}: {str(exc)[:120]}"}, indent=1))
        return 2
    try:
        if len(args.expected_log_id) != 64:
            raise ValueError("expected log ID must be 32-byte hex")
        bytes.fromhex(args.expected_log_id)
    except ValueError as exc:
        print(json.dumps({"overall": UNCHECKABLE, "uuid": uuid,
                          "reason": f"invalid expected log ID: {exc}"}, indent=1))
        return 2
    out = verify_entry(entry, pubkey, args.expected_log_id)
    out["uuid"] = uuid
    out["rekor"] = REKOR
    out["expected_log_id"] = args.expected_log_id.lower()
    print(json.dumps(out, indent=1, ensure_ascii=False))
    return {VALID: 0, INVALID: 1, UNCHECKABLE: 2}[out["overall"]]


if __name__ == "__main__":
    sys.exit(main())
