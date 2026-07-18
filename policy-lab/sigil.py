#!/usr/bin/env python3
"""
SIGIL — hierarchical sovereign identity + signed attestation for the MEOK hive.

The blueprint's "serialization point" foundation (Kimi dim08/sec07): a deterministic
SLIP-0010 Ed25519 key tree so every entity in the hive — keystone nodes (M4/M2),
BFT generals, products, users — has a verifiable identity derived from ONE master
seed, and can sign/verify content ("emit a sigil"). This is the trust anchor the
keystone, BFT voting, and proofof.ai attestation all build on.

Real crypto, no fantasy: Ed25519 (RFC 8032) via `cryptography`, SLIP-0010 hardened
derivation. Everything here is deterministic and verifiable.

Run `python3.11 sigil.py selftest` to prove it.
"""
from __future__ import annotations
import hashlib, hmac, sys, base64, json
from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PrivateKey, Ed25519PublicKey
from cryptography.hazmat.primitives import serialization

ED25519_SEED_KEY = b"ed25519 seed"


def _hardened_index(component: str) -> int:
    # Map a path component (e.g. "argus") to a deterministic hardened index.
    h = int.from_bytes(hashlib.sha256(component.encode()).digest()[:4], "big")
    return (h % (2**31)) | 0x80000000  # all ed25519 derivations are hardened


def master_from_seed(seed: bytes) -> tuple[bytes, bytes]:
    I = hmac.new(ED25519_SEED_KEY, seed, hashlib.sha512).digest()
    return I[:32], I[32:]  # (key, chaincode)


def _ckd_priv(key: bytes, chaincode: bytes, index: int) -> tuple[bytes, bytes]:
    # SLIP-0010 hardened child derivation: data = 0x00 || key || ser32(index)
    data = b"\x00" + key + index.to_bytes(4, "big")
    I = hmac.new(chaincode, data, hashlib.sha512).digest()
    return I[:32], I[32:]


def derive(seed: bytes, path: str) -> Ed25519PrivateKey:
    """Derive the Ed25519 private key for a path like 'keystone/m4' or 'general/argus'."""
    key, cc = master_from_seed(seed)
    for comp in [c for c in path.strip("/").split("/") if c]:
        key, cc = _ckd_priv(key, cc, _hardened_index(comp))
    return Ed25519PrivateKey.from_private_bytes(key)


def pub_bytes(priv: Ed25519PrivateKey) -> bytes:
    return priv.public_key().public_bytes(serialization.Encoding.Raw,
                                           serialization.PublicFormat.Raw)


def entity_id(priv_or_pub) -> str:
    """Content-addressable id for an entity (sigil:<base32 of sha256(pubkey)>)."""
    pk = pub_bytes(priv_or_pub) if isinstance(priv_or_pub, Ed25519PrivateKey) else priv_or_pub
    return "sigil:" + base64.b32encode(hashlib.sha256(pk).digest()[:15]).decode().lower()


def emit(priv: Ed25519PrivateKey, content: bytes | str) -> dict:
    """Emit a sigil: a signed attestation over content. Returns a verifiable record."""
    if isinstance(content, str):
        content = content.encode()
    digest = hashlib.sha256(content).digest()
    sig = priv.sign(digest)
    return {
        "id": entity_id(priv),
        "pub": base64.b64encode(pub_bytes(priv)).decode(),
        "digest": digest.hex(),
        "sig": base64.b64encode(sig).decode(),
    }


def verify(record: dict, content: bytes | str) -> bool:
    """Verify a sigil record against content. False on any tamper."""
    if isinstance(content, str):
        content = content.encode()
    try:
        if hashlib.sha256(content).hexdigest() != record["digest"]:
            return False
        pub = Ed25519PublicKey.from_public_bytes(base64.b64decode(record["pub"]))
        pub.verify(base64.b64decode(record["sig"]), bytes.fromhex(record["digest"]))
        return True
    except Exception:
        return False


def _selftest() -> int:
    seed = hashlib.sha256(b"MEOK-SOVEREIGN-MASTER-SEED-demo").digest()
    p, f = 0, 0
    def ck(name, cond):
        nonlocal p, f
        print(f"  {'✅' if cond else '❌'} {name}"); p += cond; f += (not cond)

    m4 = derive(seed, "keystone/m4")
    m2 = derive(seed, "keystone/m2")
    argus = derive(seed, "general/argus")
    ck("distinct entities get distinct ids", len({entity_id(m4), entity_id(m2), entity_id(argus)}) == 3)
    ck("derivation is deterministic", entity_id(derive(seed, "keystone/m4")) == entity_id(m4))

    rec = emit(argus, "BFT vote: proposal-42 APPROVE")
    ck("valid sigil verifies", verify(rec, "BFT vote: proposal-42 APPROVE"))
    ck("tampered content fails", not verify(rec, "BFT vote: proposal-42 REJECT"))
    ck("wrong signer fails", not verify({**rec, "pub": base64.b64encode(pub_bytes(m2)).decode()},
                                        "BFT vote: proposal-42 APPROVE"))
    ck("id is content-addressable + stable", entity_id(argus) == entity_id(pub_bytes(argus)))
    print(f"  == {p} passed, {f} failed ==")
    return 0 if f == 0 else 1


def _seed_from_env() -> bytes:
    import os
    hexseed = os.environ.get("SIGIL_SEED_HEX")
    if hexseed:
        return bytes.fromhex(hexseed.strip())
    raw = os.environ.get("SIGIL_SEED")
    if raw:
        return hashlib.sha256(raw.encode()).digest()
    raise SystemExit("sigil: set SIGIL_SEED_HEX (preferred) or SIGIL_SEED in env")


if __name__ == "__main__":
    cmd = sys.argv[1] if len(sys.argv) > 1 else ""
    if cmd == "selftest":
        sys.exit(_selftest())
    elif cmd == "derive":
        seed = hashlib.sha256(sys.argv[3].encode()).digest() if len(sys.argv) > 3 else hashlib.sha256(b"demo").digest()
        print(entity_id(derive(seed, sys.argv[2])))
    elif cmd == "attest":           # sigil.py attest <entity_path>  (content on stdin) -> attestation JSON
        path = sys.argv[2] if len(sys.argv) > 2 else "master"
        content = sys.stdin.buffer.read()
        print(json.dumps(emit(derive(_seed_from_env(), path), content)))
    elif cmd == "verify":           # sigil.py verify <record_file>  (content on stdin) -> ok/fail
        rec = json.load(open(sys.argv[2]))
        content = sys.stdin.buffer.read()
        ok = verify(rec, content)
        print("ok" if ok else "FAIL"); sys.exit(0 if ok else 1)
    else:
        print(__doc__)
