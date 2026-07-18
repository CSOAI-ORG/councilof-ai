#!/usr/bin/env python3
"""layer0_sandbox_bootstrap.py — make ANY sandbox (Colab/Kaggle/Claude-Science/remote box) a GOVERNED, SIGNED
sovereign node. Self-contained: paste into a cell or `curl | python`. Turns scattered/ephemeral compute into
Layer-0 nodes whose work returns SIGNED and offline-verifiable — the moat travels to the compute.

SECURITY (non-negotiable): the sandbox generates its OWN ephemeral Ed25519 key and NEVER sees the root/King key.
It prints its public key so the sovereign ROOT can register/countersign it (delegated trust, certificate-chain
style). A leaked sandbox key compromises only that sandbox's future sigs, never the root.
"""
import os, json, hashlib, time, base64

def _crypto():
    from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PrivateKey
    from cryptography.hazmat.primitives import serialization
    return Ed25519PrivateKey, serialization

class SovereignSandboxNode:
    def __init__(self, node_id=None, key_path=None):
        Ed25519PrivateKey, serialization = _crypto()
        self.node_id = node_id or os.environ.get("SOV_NODE_ID", "sandbox-" + hashlib.sha256(os.urandom(8)).hexdigest()[:8])
        kp = key_path or f"/tmp/sov_node_{self.node_id}.key"
        if os.path.exists(kp):
            self.key = Ed25519PrivateKey.from_private_bytes(open(kp, "rb").read())
        else:
            self.key = Ed25519PrivateKey.generate()
            open(kp, "wb").write(self.key.private_bytes(serialization.Encoding.Raw, serialization.PrivateFormat.Raw, serialization.NoEncryption()))
        self.pub = self.key.public_key(); self._ser = serialization; self.prev = "genesis"; self.chain = []
    def pub_hex(self):
        return self.pub.public_bytes(self._ser.Encoding.Raw, self._ser.PublicFormat.Raw).hex()
    def sign_work(self, payload):
        rec = {"node": self.node_id, "node_pubkey": self.pub_hex(), "seq": len(self.chain),
               "prev": self.prev, "ts": payload.get("ts"), "payload": payload}
        rec["hash"] = hashlib.sha256((self.prev + json.dumps(payload, sort_keys=True)).encode()).hexdigest()
        rec["sig"] = self.key.sign(rec["hash"].encode()).hex()
        self.prev = rec["hash"]; self.chain.append(rec); return rec
    def verify(self, rec):
        try:
            self.pub.verify(bytes.fromhex(rec["sig"]), rec["hash"].encode()); return True
        except Exception:
            return False
    def attestation(self):
        """what the sovereign ROOT registers to trust this node (pubkey only — no secret leaves the sandbox)."""
        return {"node": self.node_id, "pubkey": self.pub_hex(),
                "note": "register this pubkey in the root ledger to trust this sandbox's signed work"}

def demo():
    node = SovereignSandboxNode(node_id="demo-colab-t4")
    print("=== Layer-0 sandbox node online ===")
    print("node:", node.node_id, "\npubkey:", node.pub_hex())
    # sign a piece of REAL work done in this sandbox (e.g. a training/eval result)
    work = {"task": "gsm8k_eval", "model": "qwen2.5-3b", "score": 0.71, "ts": "2026-07-14T00:00:00Z"}
    rec = node.sign_work(work)
    print(f"\nsigned work: seq={rec['seq']} sig={rec['sig'][:16]}…  verifies={node.verify(rec)}")
    # tamper check
    forged = dict(rec); forged["payload"] = dict(work, score=0.99)
    forged["hash"] = hashlib.sha256((rec["prev"] + json.dumps(forged["payload"], sort_keys=True)).encode()).hexdigest()
    print("tampered result rejected:", not node.verify(forged))
    print("\nroot registers (pubkey only, no secret):", json.dumps(node.attestation()))
    return node

if __name__ == "__main__":
    try:
        demo()
    except Exception as e:
        print("needs 'cryptography' (pip install cryptography):", e)
