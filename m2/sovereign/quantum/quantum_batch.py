"""
Quantum Batch Scheduler — Sovereign Temple v3.0
================================================
Nightly batch job that runs all three quantum systems on M2,
then writes results back to SOV3's care membrane and memory layer.

Schedule: 03:00 UTC nightly (via Sovereign heartbeat or cron)
Machine:  M2 MacBook (iokfarm@192.168.1.159) — dedicated quantum worker
Runtime:  ~2–5 minutes for full batch

Batch sequence:
  1. QAOA Care Weight Optimizer  — 6 qubits, optimise care dimensions
  2. VQE Memory Scorer           — 8 qubits, rank all memory episodes
  3. Grover Memory Search        — dynamic qubits, surface top memories per domain
  4. Write results to SOV3       — update care_membrane/optimal_weights.json
                                   + quantum/vqe_scores.json
                                   + quantum/grover_results.json
  5. Trigger SOV3 neural retrain — push new importance scores to training data

Usage:
    python3 quantum_batch.py              # run full batch
    python3 quantum_batch.py --dry-run    # show what would run, no execution
    python3 quantum_batch.py --qaoa-only  # run only care weight optimisation
"""

import json
import sys
import time
import argparse
from datetime import datetime
from pathlib import Path

# Add parent dir to path for SOV3 imports
ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

from quantum.qaoa_care_optimizer import run_nightly_optimization
from quantum.vqe_memory_scorer import score_sovereign_memories, VQEMemoryScorer
from quantum.grover_memory_search import run_memory_search, GroverMemorySearch

# Key SOV3 queries to run Grover search on each night
NIGHTLY_GROVER_QUERIES = [
    "care consciousness maternal covenant",
    "council vote consensus governance",
    "threat violation boundary breach",
    "partnership emergence cognitive symbiosis",
    "quantum memory importance scoring",
    "dream synthesis insight pattern",
]


def run_batch(dry_run: bool = False, qaoa_only: bool = False,
              sov3_url: str = "http://localhost:3100") -> dict:
    """
    Run the full quantum batch.
    Returns a summary dict with all results and timings.
    """
    batch_start = time.time()
    run_at = datetime.now().isoformat()

    print("=" * 60)
    print(f"SOVEREIGN QUANTUM BATCH — {run_at}")
    print(f"Machine: M2-iokfarm | SOV3: {sov3_url}")
    print(f"Mode: {'DRY RUN' if dry_run else 'LIVE'}")
    print("=" * 60)

    results = {
        "run_at": run_at,
        "dry_run": dry_run,
        "phases": {}
    }

    # ── Phase 1: QAOA Care Weight Optimisation ────────────────────────────────
    print("\n[Phase 1] QAOA Care Weight Optimisation")
    print("-" * 40)

    phase1_start = time.time()

    if dry_run:
        print("  DRY RUN: Would optimise 6 care dimension weights via QAOA")
        qaoa_result = {"skipped": True, "reason": "dry_run"}
    else:
        # Try to fetch live care scores from SOV3
        care_scores = None
        try:
            import urllib.request
            req = urllib.request.Request(
                f"{sov3_url}/mcp",
                data=json.dumps({
                    "jsonrpc": "2.0", "id": "batch-qaoa",
                    "method": "tools/call",
                    "params": {"name": "get_consciousness_state", "arguments": {}}
                }).encode(),
                headers={"Content-Type": "application/json"},
                method="POST"
            )
            with urllib.request.urlopen(req, timeout=10) as resp:
                data = json.loads(resp.read())
                if "result" in data:
                    state = data["result"]
                    # Extract care scores if available
                    care_data = state.get("care_scores") or state.get("care_membrane")
                    if isinstance(care_data, dict):
                        care_scores = care_data
        except Exception as e:
            print(f"  SOV3 care scores unavailable ({e}), using defaults")

        qaoa_result = run_nightly_optimization(care_scores)
        print(f"  ✅ Converged in {qaoa_result.get('iterations')} iterations, "
              f"{qaoa_result.get('elapsed_seconds')}s")

    results["phases"]["qaoa"] = {
        "elapsed": round(time.time() - phase1_start, 3),
        "result": qaoa_result
    }

    if qaoa_only:
        results["total_elapsed"] = round(time.time() - batch_start, 3)
        _write_summary(results)
        return results

    # ── Phase 2: VQE Memory Scoring ───────────────────────────────────────────
    print("\n[Phase 2] VQE Memory Episode Scoring")
    print("-" * 40)

    phase2_start = time.time()

    if dry_run:
        print("  DRY RUN: Would score all memory episodes with VQE (8 qubits)")
        vqe_result = {"skipped": True, "reason": "dry_run"}
    else:
        memory_dir = ROOT / "consciousness_core" / "memory"
        vqe_result = score_sovereign_memories(memory_dir)
        print(f"  ✅ Scored {vqe_result.get('total_episodes')} episodes, "
              f"mean importance: {vqe_result.get('score_mean')}, "
              f"{vqe_result.get('elapsed_seconds')}s")

    results["phases"]["vqe"] = {
        "elapsed": round(time.time() - phase2_start, 3),
        "result": vqe_result
    }

    # ── Phase 3: Grover Memory Search ─────────────────────────────────────────
    print("\n[Phase 3] Grover Memory Search (all nightly queries)")
    print("-" * 40)

    phase3_start = time.time()
    grover_results = {}

    if dry_run:
        print(f"  DRY RUN: Would run {len(NIGHTLY_GROVER_QUERIES)} Grover queries")
        for q in NIGHTLY_GROVER_QUERIES:
            grover_results[q] = {"skipped": True}
    else:
        memory_dir = ROOT / "consciousness_core" / "memory"
        for query in NIGHTLY_GROVER_QUERIES:
            print(f"  Searching: '{query}'...")
            try:
                r = run_memory_search(query=query, memory_dir=memory_dir)
                grover_results[query] = {
                    "top_result": r["results"][0] if r["results"] else None,
                    "n_results": len(r["results"]),
                    "elapsed": r["elapsed_seconds"]
                }
                print(f"    ✅ {len(r['results'])} results in {r['elapsed_seconds']}s")
            except Exception as e:
                grover_results[query] = {"error": str(e)}
                print(f"    ❌ Failed: {e}")

    results["phases"]["grover"] = {
        "elapsed": round(time.time() - phase3_start, 3),
        "queries_run": len(NIGHTLY_GROVER_QUERIES),
        "results": grover_results
    }

    # ── Phase 4: Push results to SOV3 ─────────────────────────────────────────
    print("\n[Phase 4] Pushing results to SOV3")
    print("-" * 40)

    phase4_start = time.time()

    if dry_run:
        print("  DRY RUN: Would push optimised weights + scores to SOV3")
    else:
        pushed = 0
        # Push QAOA weights to SOV3 memory
        if not qaoa_result.get("skipped"):
            try:
                weights = qaoa_result.get("optimal_weights", {})
                payload = json.dumps({
                    "jsonrpc": "2.0", "id": "batch-push-qaoa",
                    "method": "tools/call",
                    "params": {
                        "name": "record_memory",
                        "arguments": {
                            "content": f"Quantum batch: QAOA optimised care weights — {json.dumps(weights)}",
                            "importance": 0.8,
                            "tags": ["quantum", "qaoa", "care_weights", "nightly_batch"],
                            "source": "quantum_batch"
                        }
                    }
                }).encode()
                import urllib.request
                req = urllib.request.Request(
                    f"{sov3_url}/mcp", data=payload,
                    headers={"Content-Type": "application/json"}, method="POST"
                )
                with urllib.request.urlopen(req, timeout=10) as resp:
                    pushed += 1
                    print("  ✅ QAOA weights recorded in SOV3 memory")
            except Exception as e:
                print(f"  ⚠️  SOV3 push failed (non-fatal): {e}")

        # Push VQE top memories to SOV3
        if not vqe_result.get("skipped"):
            top10 = vqe_result.get("top_10", [])
            if top10:
                try:
                    summary = f"VQE scored {vqe_result.get('total_episodes')} episodes. " \
                              f"Top: {top10[0].get('content','')[:60]}... " \
                              f"(score: {top10[0].get('vqe_score')})"
                    payload = json.dumps({
                        "jsonrpc": "2.0", "id": "batch-push-vqe",
                        "method": "tools/call",
                        "params": {
                            "name": "record_memory",
                            "arguments": {
                                "content": summary,
                                "importance": 0.7,
                                "tags": ["quantum", "vqe", "memory_scoring", "nightly_batch"],
                                "source": "quantum_batch"
                            }
                        }
                    }).encode()
                    req = urllib.request.Request(
                        f"{sov3_url}/mcp", data=payload,
                        headers={"Content-Type": "application/json"}, method="POST"
                    )
                    with urllib.request.urlopen(req, timeout=10) as resp:
                        pushed += 1
                        print("  ✅ VQE scores recorded in SOV3 memory")
                except Exception as e:
                    print(f"  ⚠️  VQE push failed: {e}")

        print(f"  Pushed {pushed} result sets to SOV3")

    results["phases"]["sov3_push"] = {
        "elapsed": round(time.time() - phase4_start, 3)
    }

    # ── Summary ───────────────────────────────────────────────────────────────
    total_elapsed = round(time.time() - batch_start, 3)
    results["total_elapsed"] = total_elapsed

    print("\n" + "=" * 60)
    print(f"BATCH COMPLETE — {total_elapsed}s total")
    print(f"  Phase 1 (QAOA):   {results['phases']['qaoa']['elapsed']}s")
    print(f"  Phase 2 (VQE):    {results['phases']['vqe']['elapsed']}s")
    print(f"  Phase 3 (Grover): {results['phases']['grover']['elapsed']}s")
    print(f"  Phase 4 (Push):   {results['phases']['sov3_push']['elapsed']}s")
    print("=" * 60)

    _write_summary(results)
    return results


def _write_summary(results: dict):
    """Write batch summary to disk."""
    out_path = Path(__file__).resolve().parent / "batch_results.json"
    with open(out_path, "w") as f:
        json.dump(results, f, indent=2, default=str)
    print(f"\nSummary written to: {out_path}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Sovereign Quantum Batch")
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--qaoa-only", action="store_true")
    parser.add_argument("--sov3-url", default="http://localhost:3100")
    args = parser.parse_args()

    run_batch(dry_run=args.dry_run, qaoa_only=args.qaoa_only, sov3_url=args.sov3_url)
