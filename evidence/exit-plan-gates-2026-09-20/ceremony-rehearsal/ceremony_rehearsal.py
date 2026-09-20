#!/usr/bin/env python3
"""Ceremony rehearsal — evidence-audit item 6. NO secrets, NO network writes, fixtures only.

Rehearses the corrected release loop:
  build -> verify exact bytes -> sign with documented authority -> publish ->
  anonymous readback -> bind timestamp proof to those bytes -> record state.

Every external dependency (signer, mirror, transparency service) is an INJECTED
fixture, and every failure must FAIL CLOSED: refuse, emit no partial attestation,
and record an honest state (UNSIGNED_DECLARED / UNREACHABLE / UNCHECKABLE) rather
than a fabricated success.

Run: python3 ceremony_rehearsal.py   (exit 0 = all rehearsals behaved as required)
"""
import hashlib, json, sys
from pathlib import Path

from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PrivateKey, Ed25519PublicKey

HERE = Path(__file__).resolve().parent


def canonical(o) -> bytes:
    return json.dumps(o, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode("utf-8")


def sha256(b: bytes) -> str:
    return hashlib.sha256(b).hexdigest()


class SignerUnavailable(Exception): pass


def build_manifest(files: dict, *, signer_available: bool) -> dict:
    file_rows = [
        {"path": name, "sha256": sha256(data), "bytes": len(data)}
        for name, data in sorted(files.items())
    ]
    manifest = {
        "schema": "csoai.signed-release-manifest/0.1",
        "release_id": "rehearsal-2026-09-20",
        "created_at": "2026-09-20T00:00:00Z",
        "source": {"repo": "fixture://local", "commit": "0" * 40, "dirty_tree": False,
                   "build_command": "fixture", "build_runner": "rehearsal"},
        "files": file_rows,
        "signer": {"did": "did:web:example.invalid", "key_id": "rehearsal-throwaway-1",
                   "alg": "Ed25519",
                   "authority_doc": "evidence/exit-plan-gates-2026-09-20/ceremony-rehearsal/README.md",
                   "preimage_rule": "Ed25519 over raw UTF-8 of canonical JSON of this manifest minus 'signature' and 'signature_state', keys sorted recursively, no whitespace, ensure_ascii=false"},
        "timestamp_proofs": [],
        "mirrors": [],
        "verification": {"self_check": {"files_hashed": len(file_rows), "verifier": "ceremony_rehearsal.py/0.1",
                                        "verdict": "UNCHECKABLE"},
                         "what_this_does_not_establish": "A signature proves custody of bytes by the rehearsal key, nothing more; no timestamp proof is claimed unless CONFIRMED against the bound bytes; mirrors count only after anonymous readback."},
        "not_a_certification": True,
    }
    if not signer_available:
        # FAIL CLOSED: honest unsigned state, no fabricated signature field, raise.
        manifest["signature_state"] = "UNSIGNED_DECLARED"
        raise SignerUnavailable("signer unavailable — nothing signed, no partial artifact emitted")
    key = Ed25519PrivateKey.generate()  # throwaway: exists only for this process
    preimage = canonical(manifest)      # BEFORE any signature field exists on the object
    manifest["signature_state"] = "SIGNED"
    manifest["signature"] = key.sign(preimage).hex()
    manifest["signer"]["_rehearsal_pubkey"] = key.public_key().public_bytes_raw().hex()
    return manifest


def verify_manifest(manifest: dict) -> str:
    """Stranger-side check over exact bytes. Three states only."""
    try:
        if manifest.get("signature_state") != "SIGNED":
            return "UNCHECKABLE"
        pub = Ed25519PublicKey.from_public_bytes(bytes.fromhex(manifest["signer"]["_rehearsal_pubkey"]))
        body = {k: v for k, v in manifest.items() if k not in ("signature", "signature_state")}
        body["signer"] = {k: v for k, v in body["signer"].items() if k != "_rehearsal_pubkey"}
        pub.verify(bytes.fromhex(manifest["signature"]), canonical(body))
        return "VALID"
    except Exception as e:
        return f"INVALID({e.__class__.__name__})"


def mirror_readback(manifest: dict, *, mirror_up: bool, mirror_bytes: bytes | None) -> dict:
    """Publication is real only after anonymous readback of correct bytes."""
    if not mirror_up:
        return {"url": "fixture://mirror-a", "state": "UNREACHABLE"}
    got = sha256(mirror_bytes or b"")
    ok = mirror_bytes is not None and any(f["sha256"] == got for f in manifest["files"])
    return {"url": "fixture://mirror-a",
            "state": "PUBLISHED_READBACK_VERIFIED" if ok else "PUBLISHED_READBACK_MISMATCH",
            "readback_sha256": got, "readback_at": "2026-09-20T00:00:00Z"}


def timestamp_proof(manifest: dict, *, service_up: bool, confirmed: bool) -> dict:
    """Existence-before evidence bound to exact bytes. Pending stays pending."""
    if not service_up:
        return {"kind": "opentimestamps", "binds_sha256": "0" * 64, "state": "UNCHECKABLE"}
    proof = {"kind": "opentimestamps",
             "binds_sha256": sha256(canonical(manifest)),
             "state": "CONFIRMED" if confirmed else "PENDING"}
    if confirmed:
        proof["confirmed_at"] = "2026-09-20T00:00:00Z"
        proof["block_or_log_ref"] = "fixture-block-0"
    return proof


def main() -> int:
    failures = []
    def check(name, cond):
        print(("PASS " if cond else "FAIL ") + name)
        if not cond: failures.append(name)

    fixtures = {"index.html": b"<html>rehearsal</html>", "data.json": b'{"n": 1}'}

    # 1. happy path: sign, verify from exact bytes
    m = build_manifest(fixtures, signer_available=True)
    check("happy path verifies VALID from exact bytes", verify_manifest(m) == "VALID")

    # 2. tamper -> INVALID, never silently VALID
    m2 = json.loads(json.dumps(m)); m2["files"][0]["bytes"] += 1
    check("tampered manifest is INVALID", verify_manifest(m2).startswith("INVALID"))

    # 3. signer unavailable -> fail closed: raise, no artifact
    try:
        build_manifest(fixtures, signer_available=False)
        check("signer outage fails closed", False)
    except SignerUnavailable:
        check("signer outage fails closed (refuses; UNSIGNED_DECLARED; no signature emitted)", True)

    # 4. mirror states: outage -> UNREACHABLE; right bytes -> VERIFIED; wrong bytes -> MISMATCH
    check("mirror outage -> UNREACHABLE (no publication claim)",
          mirror_readback(m, mirror_up=False, mirror_bytes=None)["state"] == "UNREACHABLE")
    check("mirror serving released bytes -> READBACK_VERIFIED",
          mirror_readback(m, mirror_up=True, mirror_bytes=fixtures["index.html"])["state"] == "PUBLISHED_READBACK_VERIFIED")
    check("mirror serving wrong bytes -> MISMATCH (HTTP 200 != correct bytes)",
          mirror_readback(m, mirror_up=True, mirror_bytes=b"<html>different</html>")["state"] == "PUBLISHED_READBACK_MISMATCH")

    # 5. transparency states: outage -> UNCHECKABLE; pending stays pending; confirmed binds bytes
    check("timestamp service outage -> UNCHECKABLE",
          timestamp_proof(m, service_up=False, confirmed=False)["state"] == "UNCHECKABLE")
    check("unconfirmed stamp stays PENDING",
          timestamp_proof(m, service_up=True, confirmed=False)["state"] == "PENDING")
    p = timestamp_proof(m, service_up=True, confirmed=True)
    check("confirmed stamp binds the exact manifest bytes",
          p["state"] == "CONFIRMED" and p["binds_sha256"] == sha256(canonical(m)))

    print()
    print("FAIL-CLOSED SUMMARY:", "all rehearsals behaved as required" if not failures else f"{len(failures)} FAILURES: {failures}")
    return 0 if not failures else 1


if __name__ == "__main__":
    sys.exit(main())
