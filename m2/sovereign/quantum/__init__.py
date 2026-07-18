"""
Sovereign Temple v3.0 — Quantum Computing Layer
================================================
Three quantum systems running on M2 MacBook (192.168.1.159):

  qaoa_care_optimizer   — 6-qubit QAOA, nightly care weight optimisation
  vqe_memory_scorer     — 8-qubit VQE, memory episode importance ranking
  grover_memory_search  — dynamic qubits, quantum-accelerated memory retrieval
  quantum_batch         — nightly scheduler wiring all three into SOV3

Hardware ceiling: 25 qubits on M2 Apple Silicon 16GB.
Benchmarks (R2 validated 2026-03-28):
  QAOA 6-qubit:  0.06–0.07s
  VQE 8-qubit:   ~0.15s per batch of 20
  Grover 12-qubit: ~0.3s per query
"""

from .qaoa_care_optimizer import run_nightly_optimization, optimize_care_weights
from .vqe_memory_scorer import VQEMemoryScorer, score_sovereign_memories
from .grover_memory_search import GroverMemorySearch, run_memory_search
from .quantum_batch import run_batch

__all__ = [
    "run_nightly_optimization",
    "optimize_care_weights",
    "VQEMemoryScorer",
    "score_sovereign_memories",
    "GroverMemorySearch",
    "run_memory_search",
    "run_batch",
]
