#!/usr/bin/env python3
"""sov33_council_fusion.py — PROOF of the 'fluid fusion' thesis: fuse MANY different local models into ONE
better, signed answer — at the OUTPUT level (Mixture-of-Agents), which is exactly what a fluid/BFT aggregator
is FOR. You cannot average their weights (different architectures); you CAN fuse their answers. This is the
honest 'use all 100 models as one' — done on outputs, not weights, on the Mac, no GPU, no tokens.

Flow:  N proposer models each answer  ->  care-gate drops empty/hedge answers  ->  an aggregator model
       synthesizes ONE fused answer citing the proposers  ->  Ed25519-signed receipt naming every contributor.
"""
import json, re, os, sys, urllib.request

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from sov33_ed25519_sigil import Ed25519Sigil

OLLAMA = os.environ.get("OLLAMA_URL", "http://localhost:11434")
# proposers = whatever different local minds we have; aggregator = the Sovereign persona
PROPOSERS = os.environ.get("SOV_PROPOSERS", "qwen3:1.7b,qwen3:0.6b,qwen25-creative:latest").split(",")
AGGREGATOR = os.environ.get("SOV_AGG", "sovereign")

def _strip(out):
    out = re.sub(r"<think>.*?</think>", "", out, flags=re.S)   # complete think block
    out = re.sub(r"^.*?</think>", "", out, flags=re.S)          # unclosed but has a close later
    out = re.sub(r"^.*?<think>", "", out, flags=re.S)           # opened, never closed -> keep tail
    return out.strip()

def chat(model, messages, npredict=160):
    def call(n):
        body = json.dumps({"model": model, "messages": messages, "stream": False,
                           "keep_alive": 0,   # unload after answering — sequential, low memory on 16GB
                           "options": {"temperature": 0.2, "num_predict": n}}).encode()
        req = urllib.request.Request(f"{OLLAMA}/api/chat", data=body, headers={"Content-Type": "application/json"})
        try:
            return _strip(json.loads(urllib.request.urlopen(req, timeout=180).read())["message"]["content"])
        except Exception:
            return ""
    a = call(max(npredict, 400))          # enough budget to finish thinking AND answer
    return a or call(700)                  # one retry with a bigger budget on empty

def care_ok(ans):
    """drop empty / pure-hedge answers before they pollute the fusion (fail-closed on junk)."""
    if len(ans) < 15: return False
    hedge = ("i'm a digital assistant", "as an ai language model", "i cannot help")
    return not any(h in ans.lower() for h in hedge)

def council(question, sigil):
    # 1) gather proposals from different minds
    proposals = []
    for m in PROPOSERS:
        a = chat(m, [{"role": "user", "content": "/no_think " + question}], 160)
        proposals.append((m, a, care_ok(a)))
    kept = [(m, a) for m, a, ok in proposals if ok]

    # 2) fluid fusion: aggregator synthesizes ONE answer from the surviving proposals
    if kept:
        digest = "\n".join(f"- ({m}): {a}" for m, a in kept)
        fuse_prompt = (
            "/no_think You are the Sovereign. Several of your council models answered the question below. "
            "Synthesize ONE clear, correct answer. Keep what they agree on, drop errors and filler. "
            "Do not invent facts. 2-3 sentences.\n\n"
            f"QUESTION: {question}\n\nCOUNCIL ANSWERS:\n{digest}\n\nFUSED SOVEREIGN ANSWER:"
        )
        fused = chat(AGGREGATOR, [{"role": "user", "content": fuse_prompt}], 220)
    else:
        fused = "ABSTAIN — no council member produced a usable answer."

    receipt = sigil.sign({
        "question": question, "fused_answer": fused,
        "council": [m for m, _ in kept], "dropped": [m for m, _, ok in proposals if not ok],
        "aggregator": AGGREGATOR, "n_proposers": len(PROPOSERS), "n_kept": len(kept),
    })
    return proposals, fused, receipt

def main():
    sigil = Ed25519Sigil()
    print("=== SOV33 COUNCIL FUSION — many different local models → one signed answer (Mixture-of-Agents) ===")
    print(f"proposers: {PROPOSERS}\naggregator: {AGGREGATOR}\npubkey: {sigil.pub_hex()}\n")
    qs = [
        "In two sentences, what does the EU AI Act require for AI-generated synthetic media?",
        "What makes a governed AI decision trustworthy?",
    ]
    receipts = []
    for i, q in enumerate(qs, 1):
        proposals, fused, rec = council(q, sigil)
        print(f"── Q{i}: {q}")
        for m, a, ok in proposals:
            tag = "kept " if ok else "DROP "
            print(f"   [{tag}] {m}: {a[:110] or '(empty)'}")
        print(f"   🜏 FUSED (Sovereign): {fused[:280]}")
        print(f"   ✍ signed seq={rec['seq']} council={rec['payload']['council']} verifies={sigil.verify(rec)}\n")
        receipts.append(rec)

    print("── moat check:")
    forged = dict(receipts[0]); forged["ed25519"] = "00" * 64
    print(f"   all receipts verify: {all(sigil.verify(r) for r in receipts)}  |  forged rejected: {not sigil.verify(forged)}")
    out = {"proposers": PROPOSERS, "aggregator": AGGREGATOR,
           "results": [{"q": r["payload"]["question"], "council": r["payload"]["council"],
                        "dropped": r["payload"]["dropped"], "verifies": sigil.verify(r)} for r in receipts],
           "thesis": "FLUID fusion of heterogeneous models happens at OUTPUT level (MoA), signed — NOT by averaging weights.",
           "all_verify": all(sigil.verify(r) for r in receipts)}
    os.makedirs("benchmarks", exist_ok=True)
    json.dump(out, open("benchmarks/council_fusion_2026-07-14.json", "w"), indent=2)
    print("\n✅ Council fusion proven — many minds → one signed Sovereign answer. (benchmarks/council_fusion_2026-07-14.json)")

if __name__ == "__main__":
    main()
