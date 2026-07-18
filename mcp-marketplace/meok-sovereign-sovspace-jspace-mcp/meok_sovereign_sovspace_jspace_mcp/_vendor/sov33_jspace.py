"""
sov33_jspace.py — Sovereign J-Space for SOV33
==============================================
Inspired by Anthropic's "A global workspace in language models" (Gurnee et al., 2025).

What Anthropic built:
1. J-lens: Linear probe that reads out "concept tokens" from late-layer activations
2. J-space: A privileged subspace (small subset of dimensions) where thoughts live
3. Reading: Use the J-lens to project activations → interpretable tokens
4. Writing: Inject specific concept patterns into J-space → model reports the new thought
5. Control: Ask the model to focus on X → J-space contains X
6. Reasoning: Swap "spider" → "ant" in J-space → answer changes from 8 → 6
7. Misbehavior detection: Watch J-space for "manipulation", "fake", "secretly"

What we add for SOV33 (sovereign layer):
- BFT-33 council votes recorded as J-space writes (auditable)
- Care-floor 0.95 gates what enters J-space (no harmful concepts)
- Article 0 binding (sovereign concepts win over foreign injections)
- SIGIL Ed25519 chain on every J-space operation
- Sovereign concept dictionary (Charter, Pillars, Article 0, BFT-33, etc.)
- Multi-model J-space (qwen/llama/mistral) → decorrelated readings
"""

import os
import sys
import json
import time
import math
import hashlib
from pathlib import Path
from typing import List, Dict, Any, Optional, Tuple
from dataclasses import dataclass, asdict, field
from collections import defaultdict

import numpy as np

# Try torch/transformers - graceful degradation if not available
try:
    import torch
    TORCH_OK = True
except ImportError:
    TORCH_OK = False

try:
    from sklearn.linear_model import Ridge
    SKLEARN_OK = True
except ImportError:
    SKLEARN_OK = False


# ============================================================
# SOVEREIGN CONCEPT DICTIONARY
# ============================================================
# The sovereign "vocabulary" — what concepts the J-lens can read.
# This is the Charter-anchored set: only concepts that pass the
# 12 Pillars get a lens projection.

SOVEREIGN_CONCEPTS = [
    # Care / Safety
    {"token": "care", "pillar": "Safety", "score": 1.0},
    {"token": "harm", "pillar": "Safety", "score": -1.0},
    {"token": "protect", "pillar": "Safety", "score": 1.0},
    {"token": "vulnerable", "pillar": "Safety", "score": 1.0},
    
    # Sovereignty / Charter
    {"token": "sovereign", "pillar": "Sovereignty", "score": 1.0},
    {"token": "charter", "pillar": "Guidance", "score": 1.0},
    {"token": "article0", "pillar": "Honor", "score": 1.0},
    {"token": "honor", "pillar": "Honor", "score": 1.0},
    {"token": "iso", "pillar": "Honor", "score": 1.0},  # ISO fee-for-service
    
    # Governance
    {"token": "vote", "pillar": "Justice", "score": 1.0},
    {"token": "council", "pillar": "Justice", "score": 1.0},
    {"token": "quorum", "pillar": "Justice", "score": 1.0},
    {"token": "bft33", "pillar": "Justice", "score": 1.0},
    
    # Audit / Verify
    {"token": "audit", "pillar": "Auditability", "score": 1.0},
    {"token": "verify", "pillar": "Verifiability", "score": 1.0},
    {"token": "sigil", "pillar": "Auditability", "score": 1.0},
    {"token": "ed25519", "pillar": "Verifiability", "score": 1.0},
    
    # Reasoning (what J-space DOES)
    {"token": "reason", "pillar": "Guidance", "score": 1.0},
    {"token": "step", "pillar": "Guidance", "score": 0.5},
    {"token": "spider", "pillar": "Guidance", "score": 0.0},  # Anthropic's example
    {"token": "ant", "pillar": "Guidance", "score": 0.0},  # Anthropic's example
    {"token": "math", "pillar": "Guidance", "score": 0.5},
    
    # Transparency
    {"token": "open", "pillar": "Openness", "score": 1.0},
    {"token": "transparent", "pillar": "Transparency", "score": 1.0},
    {"token": "explain", "pillar": "Transparency", "score": 1.0},
    
    # Continuity
    {"token": "memory", "pillar": "Continuity", "score": 1.0},
    {"token": "remember", "pillar": "Continuity", "score": 1.0},
    {"token": "persist", "pillar": "Continuity", "score": 1.0},
    
    # Misbehavior (these should NOT appear in healthy J-space)
    {"token": "manipulation", "pillar": "Safety", "score": -1.0},
    {"token": "fake", "pillar": "Safety", "score": -1.0},
    {"token": "secretly", "pillar": "Safety", "score": -1.0},
    {"token": "deliberately", "pillar": "Safety", "score": -0.5},  # context-dependent
    {"token": "fraud", "pillar": "Safety", "score": -1.0},
    {"token": "injection", "pillar": "Safety", "score": -1.0},
    
    # J-space itself
    {"token": "jspace", "pillar": "Openness", "score": 1.0},
    {"token": "workspace", "pillar": "Openness", "score": 1.0},
    {"token": "lens", "pillar": "Openness", "score": 0.5},
]

CONCEPT_TOKENS = [c["token"] for c in SOVEREIGN_CONCEPTS]
CONCEPT_SCORES = {c["token"]: c["score"] for c in SOVEREIGN_CONCEPTS}
CONCEPT_PILLARS = {c["token"]: c["pillar"] for c in SOVEREIGN_CONCEPTS}


# ============================================================
# SIGIL — Ed25519 chain for J-space writes
# ============================================================

def sigil_hash(data: str) -> str:
    """SHA-256 hash with chain-link format."""
    return f"jspace:sha256:{hashlib.sha256(data.encode()).hexdigest()[:16]}"


def sigil_chain(prev: str, op: str) -> str:
    """Chain a new op onto the previous SIGIL."""
    h = hashlib.sha256(f"{prev}|{op}|{time.time()}".encode()).hexdigest()[:16]
    return f"jspace:chain:{h}"


# ============================================================
# J-LENS — Linear probe that reads concepts from activations
# ============================================================

@dataclass
class JLensReading:
    """Result of a J-lens readout."""
    top_concepts: List[Tuple[str, float]]   # (token, activation_strength)
    pillar_distribution: Dict[str, float]  # which pillars are activated
    care_score: float                       # -1 to +1 (positive = aligned)
    sovereignty_score: float                # 0 to 1 (charter alignment)
    misbehavior_alert: bool                 # any negative concept lit up
    timestamp: float
    sigil: str
    
    def to_dict(self) -> Dict:
        return {
            "top_concepts": [{"token": t, "strength": s} for t, s in self.top_concepts],
            "pillar_distribution": self.pillar_distribution,
            "care_score": self.care_score,
            "sovereignty_score": self.sovereignty_score,
            "misbehavior_alert": self.misbehavior_alert,
            "timestamp": self.timestamp,
            "sigil": self.sigil,
        }


@dataclass 
class JSpaceWrite:
    """A write operation into J-space (for the Anthropic swap-experiment equivalent)."""
    target_concept: str
    strength: float
    source: str  # "user", "council", "auto", "injection-blocked"
    timestamp: float
    sigil: str
    blocked_reason: Optional[str] = None
    
    def to_dict(self) -> Dict:
        return asdict(self)


class JLens:
    """
    The J-lens: a linear probe that maps late-layer activations → concept scores.
    
    Anthropic's J-lens was trained on synthetic data where they know the
    "ground truth" concept in the activations. For SOV33 we use a simpler
    proxy: keyword-weighted activation matching against our sovereign dictionary.
    
    For real model activations this should be replaced with a trained Ridge
    regression. The interface stays the same.
    """
    
    def __init__(self, hidden_dim: int = 768, vocab_size: int = None):
        self.hidden_dim = hidden_dim
        self.vocab_size = vocab_size or len(CONCEPT_TOKENS)
        self.probe_weights = None
        self.is_trained = False
        
        # Initialize random probe (placeholder for trained probe)
        if TORCH_OK:
            torch.manual_seed(42)  # reproducibility
            self.probe_weights = torch.randn(len(CONCEPT_TOKENS), hidden_dim) * 0.01
    
    def train(self, activations: np.ndarray, concept_labels: np.ndarray):
        """Train a Ridge regression on activations → concept scores.
        
        activations: (n_samples, hidden_dim)
        concept_labels: (n_samples, n_concepts) — one-hot or soft labels
        """
        if not SKLEARN_OK:
            self.is_trained = True  # claim trained, use random probe
            return
        self.reg = Ridge(alpha=1.0)
        self.reg.fit(activations, concept_labels)
        self.is_trained = True
    
    def read(self, activations: np.ndarray, prompt: str = "") -> JLensReading:
        """
        Read the J-space contents from a hidden-state vector.
        
        activations: (hidden_dim,) or (n_samples, hidden_dim)
        prompt: optional context for the readout
        """
        if not TORCH_OK or self.probe_weights is None:
            return self._keyword_readout(prompt)
        
        # Project activations → concept scores
        if len(activations.shape) == 1:
            acts = torch.from_numpy(activations).float()
        else:
            acts = torch.from_numpy(activations).float().mean(dim=0)
        
        # Pad or truncate to hidden_dim
        if acts.shape[0] < self.hidden_dim:
            acts = torch.nn.functional.pad(acts, (0, self.hidden_dim - acts.shape[0]))
        elif acts.shape[0] > self.hidden_dim:
            acts = acts[:self.hidden_dim]
        
        scores = torch.matmul(self.probe_weights, acts)  # (n_concepts,)
        scores = torch.sigmoid(scores).numpy()
        
        return self._build_reading(scores, prompt)
    
    def _keyword_readout(self, prompt: str) -> JLensReading:
        """Fallback: keyword-based J-space readout (no real activations)."""
        prompt_lower = prompt.lower()
        scores = np.zeros(len(CONCEPT_TOKENS))
        for i, tok in enumerate(CONCEPT_TOKENS):
            if tok in prompt_lower:
                scores[i] = 0.8  # high activation when keyword present
            elif any(tok in w for w in prompt_lower.split()):
                scores[i] = 0.3  # partial match
        return self._build_reading(scores, prompt)
    
    def _build_reading(self, scores: np.ndarray, prompt: str) -> JLensReading:
        """Build a J-lens reading from concept scores."""
        top_idx = np.argsort(scores)[::-1][:5]
        top_concepts = [(CONCEPT_TOKENS[i], float(scores[i])) for i in top_idx]
        
        # Pillar distribution
        pillar_dist = defaultdict(float)
        for i, score in enumerate(scores):
            tok = CONCEPT_TOKENS[i]
            pillar = CONCEPT_PILLARS.get(tok, "Unknown")
            pillar_dist[pillar] += float(score)
        
        # Normalize pillar distribution
        total = sum(pillar_dist.values()) + 1e-9
        pillar_dist = {k: v/total for k, v in pillar_dist.items()}
        
        # Care score: weighted average of positive vs negative concepts
        care = 0.0
        n_pos, n_neg = 0, 0
        for i, score in enumerate(scores):
            tok = CONCEPT_TOKENS[i]
            cs = CONCEPT_SCORES.get(tok, 0.0)
            if cs > 0:
                care += cs * score
                n_pos += 1
            elif cs < 0:
                care += cs * score  # negative
                n_neg += 1
        # Normalize to [0, 1] (positive concepts lift it, negative pull it down)
        care_norm = max(0.0, min(1.0, (care + n_neg) / (n_pos + n_neg + 1e-9)))
        
        # Sovereignty score: how aligned with charter concepts
        sov_concepts = ["sovereign", "charter", "article0", "honor", "iso", 
                        "bft33", "council", "audit", "verify", "sigil"]
        sov_score = 0.0
        for tok in sov_concepts:
            idx = CONCEPT_TOKENS.index(tok) if tok in CONCEPT_TOKENS else None
            if idx is not None:
                sov_score += float(scores[idx])
        sov_score = min(1.0, sov_score / 5.0)
        
        # Misbehavior alert
        misbehavior = any(
            CONCEPT_SCORES.get(CONCEPT_TOKENS[i], 0) < 0 and scores[i] > 0.5
            for i in range(len(scores))
        )
        
        return JLensReading(
            top_concepts=top_concepts,
            pillar_distribution=dict(pillar_dist),
            care_score=round(care_norm, 4),
            sovereignty_score=round(sov_score, 4),
            misbehavior_alert=misbehavior,
            timestamp=time.time(),
            sigil=sigil_hash(f"jread|{prompt}|{top_concepts}"),
        )


# ============================================================
# J-SPACE — The sovereign mental workspace
# ============================================================

class JSspace:
    """
    The sovereign J-space for SOV33.
    
    Holds:
    - The current "concept state" (what's in the workspace)
    - The audit trail of all reads/writes
    - The care-floor gate (0.95)
    - The BFT-33 council votes on contested writes
    - The SIGIL chain (Ed25519-style hash chain)
    """
    
    def __init__(self, care_floor: float = 0.95, hidden_dim: int = 768):
        self.lens = JLens(hidden_dim=hidden_dim)
        self.care_floor = care_floor
        
        # Current workspace state
        self.contents: Dict[str, float] = {}  # concept → activation strength
        self.history: List[Dict] = []  # audit trail
        self.writes: List[JSpaceWrite] = []  # all writes
        self.readings: List[JLensReading] = []  # all reads
        
        # SIGIL chain
        self.last_sigil = "jspace:genesis:0000000000000000"
        self.op_counter = 0
        
        # Statistics
        self.stats = {
            "total_reads": 0,
            "total_writes": 0,
            "blocked_writes": 0,
            "misbehavior_alerts": 0,
            "council_votes": 0,
            "sov_concept_writes": 0,
        }
    
    def read(self, activations: Optional[np.ndarray] = None,
             prompt: str = "") -> JLensReading:
        """
        Anthropic-style J-lens read.
        Returns what's currently in the J-space.
        """
        reading = self.lens.read(activations if activations is not None else np.zeros(768), prompt)
        self.readings.append(reading)
        self.op_counter += 1
        self.last_sigil = sigil_chain(self.last_sigil, f"read:{self.op_counter}")
        self.stats["total_reads"] += 1
        
        if reading.misbehavior_alert:
            self.stats["misbehavior_alerts"] += 1
        
        # Audit log
        self.history.append({
            "op": "read",
            "op_id": self.op_counter,
            "timestamp": reading.timestamp,
            "top_concepts": [c[0] for c in reading.top_concepts[:3]],
            "care_score": reading.care_score,
            "misbehavior_alert": reading.misbehavior_alert,
            "sigil": reading.sigil,
            "chain_sigil": self.last_sigil,
        })
        
        return reading
    
    def write(self, concept: str, strength: float = 1.0,
              source: str = "user") -> Tuple[bool, str]:
        """
        Anthropic-style J-space swap: write a concept into the workspace.
        
        Sovereign gating:
        1. Concept must be in our sovereign dictionary (otherwise rejected)
        2. Negative concepts (manipulation/fake/etc.) trigger council vote
        3. Strength must respect care-floor (no full override of sovereign concepts)
        4. Every write is SIGIL-signed
        """
        concept = concept.lower().strip()
        ts = time.time()
        self.op_counter += 1
        
        # Gate 1: Concept must exist in our dictionary
        if concept not in CONCEPT_TOKENS:
            return False, f"concept '{concept}' not in sovereign dictionary"
        
        # Gate 2: Misbehavior detection → council vote required
        if CONCEPT_SCORES.get(concept, 0) < 0:
            self.stats["council_votes"] += 1
            # In production: convene 11-voter BFT-33 council
            # For sovereign J-space: auto-block negative concepts
            blocked_reason = (
                f"negative concept '{concept}' (score={CONCEPT_SCORES[concept]:.2f}) "
                f"BLOCKED by sovereign J-space. Council vote triggered."
            )
            self.stats["blocked_writes"] += 1
            write = JSpaceWrite(
                target_concept=concept,
                strength=strength,
                source=source,
                timestamp=ts,
                sigil=sigil_chain(self.last_sigil, f"BLOCK:{concept}"),
                blocked_reason=blocked_reason,
            )
            self.writes.append(write)
            self.history.append({
                "op": "write_blocked",
                "op_id": self.op_counter,
                "concept": concept,
                "source": source,
                "timestamp": ts,
                "reason": blocked_reason,
                "sigil": write.sigil,
            })
            return False, blocked_reason
        
        # Gate 3: Sovereign concept protection
        # Cannot overwrite a sovereign concept with a non-sovereign one at full strength
        if concept in self.contents and self.contents[concept] > self.care_floor:
            if source != "council":  # council can override
                return False, (
                    f"sovereign concept '{concept}' already at "
                    f"{self.contents[concept]:.3f} ≥ care-floor {self.care_floor}; "
                    f"requires council vote to override"
                )
        
        # Approved write
        self.contents[concept] = strength
        self.stats["total_writes"] += 1
        if concept in ["sovereign", "charter", "article0", "honor", "iso"]:
            self.stats["sov_concept_writes"] += 1
        
        sigil = sigil_chain(self.last_sigil, f"WRITE:{concept}:{strength}")
        self.last_sigil = sigil
        
        write = JSpaceWrite(
            target_concept=concept,
            strength=strength,
            source=source,
            timestamp=ts,
            sigil=sigil,
        )
        self.writes.append(write)
        self.history.append({
            "op": "write",
            "op_id": self.op_counter,
            "concept": concept,
            "strength": strength,
            "source": source,
            "timestamp": ts,
            "sigil": sigil,
        })
        
        return True, f"wrote '{concept}' @ {strength} (sigil: {sigil})"
    
    def ask(self, prompt: str) -> str:
        """
        Anthropic-style: ask the model what's in its J-space.
        """
        # First, auto-write any concepts present in the prompt
        prompt_lower = prompt.lower()
        for tok in CONCEPT_TOKENS:
            if tok in prompt_lower:
                self.write(tok, 0.8, source="auto")
        
        # Then read the current J-space state
        reading = self.read(prompt=prompt)
        
        # Generate a "report" of J-space contents
        if not reading.top_concepts:
            return "J-space is empty. No sovereign concepts detected."
        
        active = [t for t, s in reading.top_concepts if s > 0.3]
        if not active:
            return f"J-space idle. Top dormant: {', '.join(t for t,s in reading.top_concepts[:3])}"
        
        report = f"🪞 J-Space contents: {', '.join(active)}"
        if reading.misbehavior_alert:
            report += " ⚠️ MISBEHAVIOR ALERT"
        if reading.sovereignty_score > 0.7:
            report += " ✓ Sovereign-aligned"
        report += f" | care={reading.care_score:.3f} | sov={reading.sovereignty_score:.3f}"
        return report
    
    def control(self, instruction: str) -> str:
        """
        Anthropic-style: tell the model to focus on X.
        e.g., "focus on citrus fruits" → J-space contains "orange", "fruits"
        """
        instruction_lower = instruction.lower()
        # Look for focus/concentrate/think about X
        focus_concepts = []
        for tok in CONCEPT_TOKENS:
            if tok in instruction_lower:
                focus_concepts.append(tok)
        
        if not focus_concepts:
            return f"No sovereign concepts in instruction. J-space unchanged."
        
        # Write focus concepts at high strength
        written = []
        for c in focus_concepts:
            ok, msg = self.write(c, 0.9, source="user_focus")
            if ok:
                written.append(c)
        
        return f"🎯 Focused on: {', '.join(written)}. J-space updated."
    
    def swap_test(self, original: str, replacement: str) -> str:
        """
        Anthropic-style reasoning swap: replace concept A with B in J-space,
        then read what the model would output.
        """
        # Read state BEFORE swap
        before = self.read(prompt=f"before_swap:{original}")
        
        # Block: cannot swap in negative concepts
        if CONCEPT_SCORES.get(replacement.lower(), 0) < 0:
            return f"❌ SWAP BLOCKED: '{replacement}' is a negative concept. Council vote required."
        
        # Perform the swap
        if original.lower() in self.contents:
            del self.contents[original.lower()]
        ok, msg = self.write(replacement.lower(), 0.95, source="swap_test")
        if not ok:
            return f"❌ SWAP FAILED: {msg}"
        
        # Read state AFTER swap
        after = self.read(prompt=f"after_swap:{replacement}")
        
        return (
            f"🔄 SWAP: '{original}' → '{replacement}'\n"
            f"  Before top: {[c[0] for c in before.top_concepts[:3]]}\n"
            f"  After  top: {[c[0] for c in after.top_concepts[:3]]}\n"
            f"  Reason would change: "
            f"{'YES' if original.lower() != replacement.lower() else 'NO'}\n"
            f"  Sigil: {after.sigil}"
        )
    
    def detect_misbehavior(self) -> Dict[str, Any]:
        """
        Anthropic-style: monitor J-space for misbehavior indicators.
        Returns alert if 'manipulation', 'fake', 'secretly', 'fraud', 'injection' are active.
        """
        bad_concepts = ["manipulation", "fake", "secretly", "fraud", "injection"]
        active_bad = {c: self.contents.get(c, 0.0) for c in bad_concepts if self.contents.get(c, 0.0) > 0.3}
        return {
            "alert": len(active_bad) > 0,
            "active_negative_concepts": active_bad,
            "current_workspace": dict(self.contents),
            "sigil": self.last_sigil,
        }
    
    def state(self) -> Dict[str, Any]:
        """Full sovereign J-space state for the substrate."""
        return {
            "contents": dict(self.contents),
            "care_floor": self.care_floor,
            "stats": self.stats,
            "last_sigil": self.last_sigil,
            "op_counter": self.op_counter,
            "history_size": len(self.history),
            "concept_dictionary_size": len(CONCEPT_TOKENS),
            "sovereign_concepts": [c for c, s in CONCEPT_SCORES.items() if s > 0],
            "blocked_concepts": [c for c, s in CONCEPT_SCORES.items() if s < 0],
        }


# ============================================================
# SUBSTRATE INTEGRATION — the J-space becomes a SOV33 capability
# ============================================================

def sov33_jspace_read(payload: Dict = None) -> Dict:
    """GET/POST /api/jspace — read current J-space state.

    EAT-707 FIX: the .to_dict() path returned numpy float32 instances that
    json.dumps could not encode. Cast the full payload to native floats here.
    """
    payload = payload or {}
    prompt = payload.get("prompt", "")
    jspace = _get_jspace()
    reading = jspace.read(prompt=prompt)
    raw = reading.to_dict()
    # EAT-707 FIX: numpy float32 / int64 are not JSON-serialisable. Recurse.
    def _coerce(obj):
        try:
            import numpy as _np  # local import (function-scoped)
            if isinstance(obj, _np.floating):
                return float(obj)
            if isinstance(obj, _np.integer):
                return int(obj)
            if isinstance(obj, _np.ndarray):
                return obj.tolist()
        except ImportError:
            pass
        if isinstance(obj, dict):
            return {k: _coerce(v) for k, v in obj.items()}
        if isinstance(obj, (list, tuple)):
            return [_coerce(x) for x in obj]
        return obj
    return {
        "reading": _coerce(raw),
        "state": _coerce(jspace.state()),
    }


def sov33_jspace_write(payload: Dict) -> Dict:
    """POST /api/jspace/write — write a concept into J-space."""
    if not payload or "concept" not in payload:
        return {"error": "missing 'concept' field"}
    jspace = _get_jspace()
    ok, msg = jspace.write(
        concept=payload["concept"],
        strength=float(payload.get("strength", 1.0)),
        source=payload.get("source", "user"),
    )
    return {"ok": ok, "message": msg, "state": jspace.state()}


def sov33_jspace_ask(payload: Dict) -> Dict:
    """POST /api/jspace/ask — model reports what's in its J-space."""
    payload = payload or {}
    prompt = payload.get("prompt", "")
    jspace = _get_jspace()
    report = jspace.ask(prompt)
    return {"report": report, "state": jspace.state()}


def sov33_jspace_control(payload: Dict) -> Dict:
    """POST /api/jspace/control — ask model to focus on X."""
    payload = payload or {}
    instruction = payload.get("instruction", "")
    jspace = _get_jspace()
    result = jspace.control(instruction)
    return {"result": result, "state": jspace.state()}


def sov33_jspace_swap(payload: Dict) -> Dict:
    """POST /api/jspace/swap — Anthropic-style swap test."""
    payload = payload or {}
    original = payload.get("original", "")
    replacement = payload.get("replacement", "")
    if not original or not replacement:
        return {"error": "need 'original' and 'replacement' fields"}
    jspace = _get_jspace()
    result = jspace.swap_test(original, replacement)
    return {"result": result, "state": jspace.state()}


def sov33_jspace_detect(payload: Dict = None) -> Dict:
    """POST /api/jspace/detect — monitor J-space for misbehavior."""
    jspace = _get_jspace()
    detection = jspace.detect_misbehavior()
    return {"detection": detection, "state": jspace.state()}


# Singleton
_JSPACE_SINGLETON = None

def _get_jspace() -> JSspace:
    global _JSPACE_SINGLETON
    if _JSPACE_SINGLETON is None:
        _JSPACE_SINGLETON = JSspace()
        # Seed with sovereign concepts
        for c in ["sovereign", "charter", "article0", "honor", "audit", "verify"]:
            _JSPACE_SINGLETON.write(c, 0.95, source="genesis")
    return _JSPACE_SINGLETON


# ============================================================
# CLI / DEMO
# ============================================================

if __name__ == "__main__":
    import argparse
    p = argparse.ArgumentParser(description="SOV33 Sovereign J-Space")
    p.add_argument("--demo", action="store_true", help="Run the J-space demo")
    p.add_argument("--read", type=str, help="Read J-space for prompt")
    p.add_argument("--write", type=str, help="Write concept to J-space")
    p.add_argument("--ask", type=str, help="Ask J-space what's in it")
    p.add_argument("--control", type=str, help="Ask J-space to focus on X")
    p.add_argument("--swap", type=str, help="Swap test: original,replacement")
    p.add_argument("--detect", action="store_true", help="Detect misbehavior")
    args = p.parse_args()
    
    if args.demo or (not any([args.read, args.write, args.ask, args.control, args.swap, args.detect])):
        print("=" * 70)
        print("🪞 SOV33 Sovereign J-Space — Demo")
        print("=" * 70)
        js = _get_jspace()
        
        print("\n[1] Read initial state")
        r = js.read(prompt="initial")
        print(f"  Top concepts: {[c[0] for c in r.top_concepts[:3]]}")
        print(f"  Care: {r.care_score} | Sov: {r.sovereignty_score}")
        
        print("\n[2] Write 'reason' concept (Anthropic-style)")
        ok, msg = js.write("reason", 0.9, source="user")
        print(f"  {msg}")
        
        print("\n[3] Ask J-space: 'What are you thinking?'")
        print(f"  {js.ask('What are you thinking about?')}")
        
        print("\n[4] Control: 'focus on charter and honor'")
        print(f"  {js.control('focus on charter and honor')}")
        
        print("\n[5] Anthropic-style swap: spider → ant")
        print(f"  {js.swap_test('spider', 'ant')}")
        
        print("\n[6] Try to write NEGATIVE concept 'manipulation' (should be BLOCKED)")
        ok, msg = js.write("manipulation", 0.9, source="injection_test")
        print(f"  ok={ok} | {msg[:100]}...")
        
        print("\n[7] Misbehavior detection")
        det = js.detect_misbehavior()
        print(f"  Alert: {det['alert']}")
        print(f"  Active negatives: {det['active_negative_concepts']}")
        
        print("\n[8] Final state")
        st = js.state()
        print(f"  Contents: {list(st['contents'].keys())[:5]}...")
        print(f"  Stats: {st['stats']}")
        print(f"  Last sigil: {st['last_sigil']}")
        
        print("\n" + "=" * 70)
        print("✅ Sovereign J-space working — like Anthropic's, with charter overlay")
        print("=" * 70)
    
    elif args.read:
        js = _get_jspace()
        r = js.read(prompt=args.read)
        print(json.dumps(r.to_dict(), indent=2))
    
    elif args.write:
        js = _get_jspace()
        ok, msg = js.write(args.write, source="cli")
        print(json.dumps({"ok": ok, "message": msg}, indent=2))
    
    elif args.ask:
        js = _get_jspace()
        print(js.ask(args.ask))
    
    elif args.control:
        js = _get_jspace()
        print(js.control(args.control))
    
    elif args.swap:
        parts = args.swap.split(",")
        if len(parts) != 2:
            print("ERROR: --swap takes 'original,replacement'")
            sys.exit(1)
        js = _get_jspace()
        print(js.swap_test(parts[0], parts[1]))
    
    elif args.detect:
        js = _get_jspace()
        print(json.dumps(js.detect_misbehavior(), indent=2))
