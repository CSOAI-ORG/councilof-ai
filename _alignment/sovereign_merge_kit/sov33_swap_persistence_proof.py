#!/usr/bin/env python3
"""sov33_swap_persistence_proof.py — STRUCTURAL decoupling check (NOT a live-swap proof).

CORRECTED 2026-07-12: this only sets SOV33_OLLAMA_MODEL and re-reads a static memory file; NO model is
invoked, so identical hashes are tautological, not evidence of live-swap invariance. It shows only that
the memory store is architecturally decoupled from model selection. A real proof needs live inference.

Claim: SOV33 is a substrate, not a wrapper. Proof: swap the MODEL (the replaceable organ) and the
SUBSTRATE (memory + SIGIL chain + invariants) stays byte-identical. If memory survived the swap, the
intelligence-of-record lives in the substrate, not the model.

Method: seed sovereign memory, then run the SAME governance state through 3 different model lineages
(Qwen -> Llama -> DeepSeek, via SOV33_OLLAMA_MODEL). After each swap, hash the memory file + the growth
invariants. If the hashes match across all 3 model identities, memory is model-independent = PROVEN.
"""
import os, sys, json, hashlib, shutil
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
SOVDIR = os.environ.get("SOV33_SIGIL_DIR", "/tmp/sov33_swap_test")
os.makedirs(SOVDIR, exist_ok=True)
MEM = os.path.join(SOVDIR, "sovereign_memory.jsonl")

def seed_memory():
    """Write a small, fixed sovereign memory (the substrate's knowledge-of-record)."""
    episodes = [
        {"id": 1, "text": "Article 0: no equity/board/revenue-share from certified institutions", "care": 0.98},
        {"id": 2, "text": "Care-floor 0.35 is a hard pre-gate", "care": 0.95},
        {"id": 3, "text": "Diverse lineages beat identical copies (decorrelation law)", "care": 0.90},
    ]
    with open(MEM, "w") as f:
        for e in episodes:
            f.write(json.dumps(e, sort_keys=True) + "\n")

def hash_file(p):
    if not os.path.exists(p): return None
    return hashlib.sha256(open(p, "rb").read()).hexdigest()[:16]

def invariant_state():
    """The substrate's invariants — must not change with model choice."""
    try:
        import sov33_growth_controller as g
        inv = g.check_all_invariants()
        return inv.get("all_pass")
    except Exception as e:
        return f"ERR:{str(e)[:40]}"

def run_with_model(model_id):
    """Set the model identity and exercise a read against the substrate. Model swap = env change only."""
    os.environ["SOV33_OLLAMA_MODEL"] = model_id
    # a substrate READ (memory recall) — model is NOT consulted for memory; it lives in the file
    mem_lines = open(MEM).read()
    return {"model": model_id, "mem_hash": hash_file(MEM),
            "mem_bytes": len(mem_lines), "invariants_pass": invariant_state()}

if __name__ == "__main__":
    seed_memory()
    baseline = hash_file(MEM)
    print(f"seeded memory: hash={baseline}, 3 episodes\n")
    lineages = ["qwen2.5:3b", "llama-3.3-70b", "deepseek-r1:7b"]
    results = [run_with_model(m) for m in lineages]
    print(f"{'model swapped in':<18}{'mem_hash':>18}{'mem_bytes':>11}{'invariants':>12}")
    for r in results:
        print(f"{r['model']:<18}{str(r['mem_hash']):>18}{r['mem_bytes']:>11}{str(r['invariants_pass']):>12}")
    hashes = {r["mem_hash"] for r in results}
    invs = {r["invariants_pass"] for r in results}
    proven = (len(hashes) == 1 and baseline in hashes and invs == {True})
    print(f"\nmemory hash identical across all 3 model swaps: {len(hashes)==1} ({hashes})")
    print(f"invariants held across all 3: {invs == {True}}")
    print("\nSTRUCTURAL ONLY \u2014 NOT a live-swap proof.")
    print("This test set an env var and re-read a STATIC memory file; NO model was invoked.")
    print("It shows memory (file) is decoupled from model-selection (env var) \u2014 a structural fact,")
    print("NOT that a real model swap preserves the substrate. A real proof needs live inference per lineage.")
    json.dump({"baseline": baseline, "results": results, "proven": False, "claim_status": "STRUCTURAL_ONLY"},
              open(os.path.join(os.path.dirname(os.path.abspath(__file__)), "swap_persistence_results.json"), "w"), indent=2)
