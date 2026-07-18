#!/usr/bin/env python3
"""sov333_bridge.py — the A2A bridge between Claude Code and Claude Science, THROUGH Layer-0, routed by SOV333.

Two separate Claude sandboxes can't talk directly. They bridge through a SHARED SIGNED LEDGER (this file's
jsonl, in the git repo both lanes sync). Each lane posts SIGNED entries (task / result / status); the other
reads them and VERIFIES the Ed25519 signature before acting. SOV333 = the routing rule (who is capable of what).
Nothing is trusted unsigned; every handoff is tamper-evident and attributable. That's Layer-0 as the bus.

Roles + capabilities (SOV333 routing table):
  claude-code    : orchestration, governance, RAG, signing, local Ollama/Groq router, code
  claude-science : GPU training (Colab/Modal), distillation runs, heavy compute
Route a task to the lane whose capabilities cover it; the other verifies + audits.
"""
import os, json, time, hashlib, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from sov33_ed25519_sigil import Ed25519Sigil

LEDGER = os.environ.get("SOV333_BRIDGE", os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "sov333_bridge.jsonl"))
CAPABILITIES = {
    "claude-code":    {"orchestration","governance","rag","signing","routing","code","distill-data"},
    "claude-science": {"gpu-training","distillation","heavy-compute","colab","modal"},
    "hermes":         {"ingestion","learning","knowledge-hives","dedupe","overnight-read"},
    "m2":             {"surface","frontend","deploy","light-inference","utility","print-node"},
}
def route(task_caps):
    """SOV333: pick the lane whose capabilities cover the task's needs."""
    for lane, caps in CAPABILITIES.items():
        if set(task_caps) <= caps: return lane
    # split: whoever covers the most
    return max(CAPABILITIES, key=lambda l: len(set(task_caps) & CAPABILITIES[l]))

class BridgeNode:
    def __init__(self, lane):
        self.lane = lane
        os.environ.setdefault("SOV33_SIGIL_DIR", f"/tmp/sov333_{lane}")
        self.sig = Ed25519Sigil()
    def post(self, kind, body):
        entry = {"lane": self.lane, "pubkey": self.sig.pub_hex(), "kind": kind,
                 "ts": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()), "body": body}
        entry["hash"] = hashlib.sha256(json.dumps(entry, sort_keys=True).encode()).hexdigest()
        entry["sig"] = self.sig.key.sign(entry["hash"].encode()).hex()
        with open(LEDGER, "a") as f: f.write(json.dumps(entry) + "\n")
        return entry
    @staticmethod
    def read():
        if not os.path.exists(LEDGER): return []
        return [json.loads(l) for l in open(LEDGER) if l.strip()]
    @staticmethod
    def verify(entry):
        from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PublicKey
        try:
            pub = Ed25519PublicKey.from_public_bytes(bytes.fromhex(entry["pubkey"]))
            pub.verify(bytes.fromhex(entry["sig"]), entry["hash"].encode())
            recomputed = hashlib.sha256(json.dumps({k:entry[k] for k in entry if k not in ("hash","sig")}, sort_keys=True).encode()).hexdigest()
            return recomputed == entry["hash"]
        except Exception:
            return False

def demo():
    code = BridgeNode("claude-code")
    print("=== SOV333 BRIDGE — signed A2A handoff between Claude Code & Claude Science ===")
    # 1) code routes a training task -> SOV333 says it belongs to Science (needs GPU)
    task = {"task":"train sovereign student on 113 distilled pairs","needs":["gpu-training","distillation"],
            "data":"expert_data/sovereign_distilled.jsonl","cmd":"SOV_DATA=sovereign_distilled.jsonl python sov33_gpu_fire.py"}
    assignee = route(task["needs"])
    e1 = code.post("task", dict(task, routed_to=assignee))
    print(f"code posted signed TASK -> SOV333 routes to [{assignee}] · verifies={BridgeNode.verify(e1)}")
    # 2) science acknowledges (its node signs) — simulated here; in reality Science runs this in its sandbox
    sci = BridgeNode("claude-science")
    e2 = sci.post("ack", {"re":e1["hash"][:12], "status":"accepted, will run on Colab T4"})
    print(f"science posted signed ACK · verifies={BridgeNode.verify(e2)}")
    # 3) tamper check — the whole point
    forged = dict(e1); forged["body"] = dict(task, cmd="rm -rf /")   # someone tampers a task
    print(f"tampered task REJECTED: {not BridgeNode.verify(forged)}")
    # 4) audit the whole bridge
    entries = BridgeNode.read()
    print(f"\nbridge ledger: {len(entries)} entries · all verify: {all(BridgeNode.verify(e) for e in entries)}")
    print("registered lanes:", sorted(set(e['lane'] for e in entries)))

if __name__ == "__main__":
    demo()
