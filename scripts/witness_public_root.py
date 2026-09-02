#!/usr/bin/env python3
"""Witness the ONE public root (never N leaves) from PUBLIC bytes only.

After publish_public_root.py commits public/root.json, this script:
  1. rebuilds the exact Ed25519 preimage (same canonicalisation as the signer) and
     verifies sig_ed25519 against did:web:csoai.org#board-attestation-1 (JWK from did.json);
  2. uploads a Rekor `rekord` entry carrying the preimage bytes + the raw signature +
     the board PEM public key (x509 pki format). Pure Ed25519 is rejected only by
     `hashedrekord`; `rekord` verifies it. Duplicate uploads dedupe (409 → existing entry);
  3. OpenTimestamps-stamps root.json bytes when the `ots` client is available and the
     calendars answer; otherwise records PENDING honestly;
  4. writes public/interop/root-witness-latest.json (+ dated copy), the Rekor entry file,
     and refreshes public/interop/root-witness-pointer.json with the drift computed.
No private key is used or needed. Existence/time of bytes — not certification.
"""
from __future__ import annotations
import base64, hashlib, json, os, re, shutil, subprocess, sys, urllib.error, urllib.request
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PUB = ROOT / "public"
ROOT_JSON = PUB / "root.json"
INTEROP = PUB / "interop"
DID_URL = "https://csoai.org/.well-known/did.json"
DID_ID = "did:web:csoai.org#board-attestation-1"
REKOR = "https://rekor.sigstore.dev"
ENVELOPE_FIELDS = ["kind", "schema", "as_of", "merkle_root", "card_count", "did_intended"]


def canonical_bytes(obj) -> bytes:
    return json.dumps(obj, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode("utf-8")


def now() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def board_pubkey() -> bytes:
    """Raw 32-byte Ed25519 public key for #board-attestation-1, from the live DID document."""
    req = urllib.request.Request(DID_URL, headers={"User-Agent": "csoai-root-witness/1 (+https://councilof.ai)", "Accept": "application/json"})
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            did = json.loads(r.read())
    except Exception as ex:  # DID apex is edge-protected for some clients; the repo mirrors it
        local = PUB / ".well-known" / "did.json"
        if not local.exists():
            raise SystemExit(f"did.json unreachable ({ex}) and no local mirror")
        did = json.loads(local.read_text())
    for vm in did.get("verificationMethod", []):
        if vm.get("id") == DID_ID:
            x = vm["publicKeyJwk"]["x"]
            return base64.urlsafe_b64decode(x + "=" * (-len(x) % 4))
    raise SystemExit(f"{DID_ID} not in {DID_URL}")


def verify(preimage: bytes, sig: bytes, raw_pub: bytes) -> bool:
    from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PublicKey
    try:
        Ed25519PublicKey.from_public_bytes(raw_pub).verify(sig, preimage)
        return True
    except Exception:
        return False


def pem_of(raw_pub: bytes) -> bytes:
    from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PublicKey
    from cryptography.hazmat.primitives import serialization
    return Ed25519PublicKey.from_public_bytes(raw_pub).public_bytes(
        serialization.Encoding.PEM, serialization.PublicFormat.SubjectPublicKeyInfo)


def rekor_upload(preimage: bytes, sig: bytes, pem: bytes) -> dict:
    body = {"apiVersion": "0.0.1", "kind": "rekord", "spec": {
        "data": {"content": base64.b64encode(preimage).decode()},
        "signature": {"format": "x509", "content": base64.b64encode(sig).decode(),
                       "publicKey": {"content": base64.b64encode(pem).decode()}}}}
    req = urllib.request.Request(f"{REKOR}/api/v1/log/entries", data=json.dumps(body).encode(),
                                 headers={"Content-Type": "application/json", "Accept": "application/json", "User-Agent": "csoai-root-witness/1"}, method="POST")
    try:
        with urllib.request.urlopen(req, timeout=60) as r:
            out = json.loads(r.read()); uuid = next(iter(out)); e = out[uuid]
            return {"status": "WITNESSED", "uuid": uuid, "logIndex": e.get("logIndex"), "integratedTime": e.get("integratedTime"),
                    "logID": e.get("logID"), "entry": out, "new": True}
    except urllib.error.HTTPError as err:
        text = err.read().decode("utf-8", "replace")
        if err.code == 409:
            m = re.search(r"[0-9a-f]{80}", text + " " + (err.headers.get("Location") or ""))
            if m:
                uuid = m.group(0)
                with urllib.request.urlopen(f"{REKOR}/api/v1/log/entries/{uuid}", timeout=60) as r:
                    out = json.loads(r.read()); e = out[uuid]
                return {"status": "WITNESSED", "uuid": uuid, "logIndex": e.get("logIndex"), "integratedTime": e.get("integratedTime"),
                        "logID": e.get("logID"), "entry": out, "new": False}
        return {"status": "UNCHECKABLE", "reason": f"rekor HTTP {err.code}: {text[:160]}"}
    except Exception as ex:  # network — never fake a witness
        return {"status": "UNCHECKABLE", "reason": f"rekor unreachable: {ex}"[:200]}


def ots_stamp(path: Path, out: Path) -> dict:
    exe = shutil.which("ots")
    if not exe:
        return {"status": "PENDING", "reason": "ots client not installed on this runner"}
    tmp = path.with_suffix(path.suffix + ".ots")
    tmp.unlink(missing_ok=True)
    try:
        subprocess.run([exe, "--no-cache", "stamp", "--timeout", "90", str(path)], check=True, capture_output=True, text=True, timeout=240)
        if tmp.exists():
            out.parent.mkdir(parents=True, exist_ok=True); shutil.move(str(tmp), str(out))
            return {"status": "STAMPED_PENDING_BITCOIN", "path": str(out.relative_to(ROOT)), "url": "https://councilof.ai/" + str(out.relative_to(PUB)),
                    "note": "run `ots upgrade` after a Bitcoin block; `ots verify` then names the block"}
    except Exception as ex:
        return {"status": "PENDING", "reason": f"calendars did not answer: {str(ex)[:120]}"}
    return {"status": "PENDING", "reason": "no .ots produced"}


def main() -> int:
    raw = ROOT_JSON.read_bytes(); root = json.loads(raw)
    sha = hashlib.sha256(raw).hexdigest(); short = sha[:8]
    preimage = canonical_bytes({k: root[k] for k in ENVELOPE_FIELDS})
    sig = bytes.fromhex(root["sig_ed25519"])
    pub = board_pubkey(); ok = verify(preimage, sig, pub)
    print(f"root.json sha256={sha[:16]} merkle={root['merkle_root'][:16]} sig_verifies={ok}")
    if not ok:
        print("signature does not verify against the DID key — refusing to witness (nothing written)"); return 2
    rek = rekor_upload(preimage, sig, pem_of(pub))
    print("rekor:", {k: v for k, v in rek.items() if k != "entry"})
    INTEROP.mkdir(parents=True, exist_ok=True)
    if rek.get("entry"):
        (INTEROP / f"rekor-root-{short}.json").write_text(json.dumps(rek["entry"], indent=1) + "\n")
    ots = ots_stamp(ROOT_JSON, INTEROP / f"root-{short}.json.ots")
    print("ots:", ots)
    side = {
        "kind": "csoai.root-witness/v1", "as_of": now(),
        "note": "Witnesses for the live signed public root — existence/time of these exact bytes. Not certification, not endorsement, not a rank sale. Never mint a token. ONE root anchor, never N leaves.",
        "artifact": {"url": "https://councilof.ai/root.json", "also": "https://councilof.ai/api/root", "sha256": sha, "bytes": len(raw),
                      "merkle_root": root["merkle_root"], "card_count": root.get("card_count"), "as_of": root.get("as_of")},
        "signature": {"did": DID_ID, "field": "sig_ed25519", "preimage_fields": ENVELOPE_FIELDS,
                       "preimage_canonical": "JSON sorted keys, separators (',',':'), ensure_ascii=false, UTF-8",
                       "preimage_sha256": hashlib.sha256(preimage).hexdigest(), "preimage_bytes": len(preimage), "verified_against_did_json": ok},
        "witnesses": {
            "rekor": {k: v for k, v in rek.items() if k != "entry"} | ({"url": f"{REKOR}/api/v1/log/entries?logIndex={rek['logIndex']}", "type": "rekord/x509 over the preimage bytes with the board signature", "entry_file": f"https://councilof.ai/interop/rekor-root-{short}.json"} if rek.get("logIndex") is not None else {}),
            "ots": ots,
            "eas_base": {"status": "NOT_YET", "reason": "needs a funded wallet (owner); schema {sha256, as_of, did}"},
            "xrpl_memo": {"status": "NOT_YET", "reason": "needs a funded XRPL account (owner); one memo tx carrying sha256(root.json)"},
        },
        "verify_hints": ["https://councilof.ai/signed/HOW-TO-VERIFY-ROOT.md"],
    }
    latest = INTEROP / "root-witness-latest.json"; dated = INTEROP / f"root-witness-{now()[:10]}-{short}.json"
    for p in (latest, dated): p.write_text(json.dumps(side, indent=1, ensure_ascii=False) + "\n")
    ptr_path = INTEROP / "root-witness-pointer.json"
    ptr = json.loads(ptr_path.read_text()) if ptr_path.exists() else {"kind": "csoai.root-witness-pointer/v0"}
    ptr.update({"as_of": now(),
                "note": "Honest pointer for the current root witness. Existence/time of bytes — not certification, not endorsement, not a rank sale. Never mint a token.",
                "live_root": side["artifact"],
                "witness_sidecar": {"url": "https://councilof.ai/interop/root-witness-latest.json", "path": str(latest.relative_to(ROOT)), "status": "PUBLISHED", "dated_copy": str(dated.relative_to(ROOT))},
                "drift": {"status": "MATCH", "witness_artifact_sha256": sha, "live_root_sha256": sha, "witness_artifact_merkle_root": root["merkle_root"], "live_root_merkle_root": root["merkle_root"], "match_sha256": True, "match_merkle_root": True,
                           "reason": "witness computed from the same root.json bytes this publish committed"},
                "witnesses": {"rekor": side["witnesses"]["rekor"].get("status"), "ots": ots.get("status"), "eas_base": "NOT_YET", "xrpl_memo": "NOT_YET"}})
    ptr_path.write_text(json.dumps(ptr, indent=1, ensure_ascii=False) + "\n")
    print("wrote", latest.name, dated.name, ptr_path.name)
    return 0


if __name__ == "__main__":
    sys.exit(main())
