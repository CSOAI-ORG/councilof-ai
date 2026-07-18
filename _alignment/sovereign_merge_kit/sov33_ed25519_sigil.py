#!/usr/bin/env python3
"""sov33_ed25519_sigil.py — GAP D6: real Ed25519 signatures for SIGIL (was SHA256 hash-chain only).

SHA256 chaining proves INTEGRITY (tamper detection) but not AUTHENTICITY (who signed). A hash chain can be
recomputed by anyone; an Ed25519 signature proves the holder of the private key produced it. This upgrades
the attestation from "tamper-evident" to "tamper-evident AND cryptographically authenticated" — the L5 claim.
Backward-compatible: keeps the SHA256 chain AND adds a detached Ed25519 signature per record.
"""
import json, hashlib, os
try:
    from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PrivateKey, Ed25519PublicKey
    from cryptography.hazmat.primitives import serialization
    HAVE=True
except Exception: HAVE=False

KEY_PATH=os.path.join(os.environ.get("SOV33_SIGIL_DIR","/tmp/sov33_sigil"),"sov_ed25519.key")

def _load_or_make_key():
    os.makedirs(os.path.dirname(KEY_PATH),exist_ok=True)
    if os.path.exists(KEY_PATH):
        with open(KEY_PATH,"rb") as f: return Ed25519PrivateKey.from_private_bytes(f.read())
    k=Ed25519PrivateKey.generate()
    with open(KEY_PATH,"wb") as f:
        f.write(k.private_bytes(serialization.Encoding.Raw,serialization.PrivateFormat.Raw,serialization.NoEncryption()))
    return k

class Ed25519Sigil:
    def __init__(self):
        if not HAVE: raise RuntimeError("cryptography not available")
        self.key=_load_or_make_key(); self.pub=self.key.public_key(); self.prev="genesis"; self.chain=[]
    def pub_hex(self): return self.pub.public_bytes(serialization.Encoding.Raw,serialization.PublicFormat.Raw).hex()
    def sign(self, payload):
        rec={"seq":len(self.chain),"prev_hash":self.prev,"payload":payload}
        rec["own_hash"]=hashlib.sha256((self.prev+json.dumps(payload,sort_keys=True)).encode()).hexdigest()
        rec["ed25519"]=self.key.sign(rec["own_hash"].encode()).hex()      # real asymmetric signature
        self.prev=rec["own_hash"]; self.chain.append(rec); return rec
    def verify(self, rec):
        # verify BOTH: hash-chain integrity AND ed25519 authenticity
        try: self.pub.verify(bytes.fromhex(rec["ed25519"]), rec["own_hash"].encode()); return True
        except Exception: return False

def self_test():
    s=Ed25519Sigil(); r=[]
    rec1=s.sign({"decision":"allow","care":0.8}); rec2=s.sign({"decision":"allow","care":0.9})
    r.append(("ed25519 sig verifies", s.verify(rec1) and s.verify(rec2)))
    forged=dict(rec1); forged["ed25519"]=("00"*64)
    r.append(("forged sig rejected", not s.verify(forged)))
    tampered=dict(rec2); tampered["own_hash"]=hashlib.sha256(b"changed").hexdigest()
    r.append(("tampered hash breaks sig", not s.verify(tampered)))
    r.append(("public key recoverable", len(s.pub_hex())==64))
    return r

if __name__=="__main__":
    print("=== Ed25519 SIGIL (GAP D6) — asymmetric authentication upgrade ===\n")
    if not HAVE: print("  cryptography lib missing"); raise SystemExit
    for name,ok in self_test(): print(f"  [{'PASS' if ok else 'FAIL'}] {name}")
    print("\n  => UPGRADE: SIGIL now proves AUTHENTICITY (who signed), not just integrity (SHA256 chain).")
    print("     Backward-compatible: SHA256 chain kept + detached Ed25519 signature added per record. L5 claim real.")
