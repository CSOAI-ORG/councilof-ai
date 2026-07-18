"""sov33_tritier_memory.py — TLM (Tiered Living Memory): the memory system, honestly named.

NAMING (anti-collision, checked on disk): TRUM is ALREADY the render/transform spine (slice_for_render,
SovSpace world-events) and JRUM is ALREADY the memory-decision vertebra. So this is NOT "TRUM" — it's TLM,
the tiered-memory MECHANISM that JRUM's decisions draw on. Prior art cited (MemGPT/MemoryOS/Memory-R1):
tiered memory is a converged pattern; OUR novelty = signed + governed + capillary working-memory substrate.

Three tiers, each the right representation for its job:
  T1 WORKING  — capillary tau-ladder (leaky integrators, graded timescales) — recent continuous history
  T2 CONCEPT  — embedding/sigil recall (content-addressable by meaning) — the 'true sigil' (dense vector)
  T3 LONGTERM — Ed25519-signed forest (verifiable, branchable episodic archive) — RUNNING on disk
"""
import numpy as np

class CapillaryWorkingMemory:
    """T1: leaky-integrator ladder. Each unit has its own tau => graded timescales of recent history."""
    def __init__(self, dim, taus=(1.0, 4.0, 16.0, 64.0)):
        self.taus = np.array(taus); self.dim = dim
        self.state = np.zeros((len(taus), dim))
    def write(self, x):
        x = np.asarray(x, float)
        a = np.exp(-1.0/self.taus)[:, None]        # decay per tau
        self.state = a*self.state + (1-a)*x[None, :]
        return self.state.copy()
    def read(self):
        return self.state.reshape(-1)              # concat all timescales

class ConceptMemory:
    """T2: content-addressable embedding store. read-by-meaning (cosine)."""
    def __init__(self):
        self.keys = []; self.vals = []
    def write(self, emb, payload):
        self.keys.append(np.asarray(emb, float)); self.vals.append(payload)
    def read(self, query_emb, k=1):
        if not self.keys: return []
        K = np.vstack(self.keys); q = np.asarray(query_emb, float)
        sims = K @ q / (np.linalg.norm(K, axis=1)*np.linalg.norm(q) + 1e-9)
        idx = np.argsort(-sims)[:k]
        return [(self.vals[i], float(sims[i])) for i in idx]

def longterm_status():
    """T3: the signed forest (already RUNNING). Returns node/tree count — verifiable episodic archive."""
    try:
        import sov33_evolve_forest as forest
        return forest.forest_status()
    except Exception as e:
        return {"error": str(e)[:60]}

def manifest():
    return {"system": "TLM (Tiered Living Memory)", "not_trum": "TRUM=render spine; JRUM=memory-decision — this is the mechanism beneath JRUM",
            "tiers": {"T1": "capillary tau-ladder (working)", "T2": "embedding/sigil (concept)", "T3": "signed forest (longterm)"},
            "longterm": longterm_status(),
            "novelty": "signed + governed + capillary substrate; tiering itself is prior art (MemGPT/MemoryOS)"}

if __name__ == "__main__":
    # OWN compose measurement — do NOT cite another tab's numbers. Task needs BOTH recent history AND concept recall.
    rng = np.random.default_rng(0); D = 16; N = 300
    # signal = slow drift (needs working memory) + concept-keyed spikes (needs concept recall)
    concepts = rng.normal(size=(5, D)); concepts /= np.linalg.norm(concepts, axis=1, keepdims=True)
    def gen():
        drift = np.cumsum(rng.normal(0, 0.1, size=(N, D)), axis=0)     # slow history
        cid = rng.integers(0, 5, size=N)
        spike = concepts[cid] * rng.normal(1.0, 0.2, size=(N,1))       # concept-keyed
        target = drift + spike
        return drift, cid, spike, target
    drift, cid, spike, target = gen()
    t1 = CapillaryWorkingMemory(D); t2 = ConceptMemory()
    # teach concept memory the concept->spike mapping
    for c in range(5): t2.write(concepts[c], concepts[c])
    def nrmse(pred, tgt):
        return float(np.sqrt(np.mean((pred-tgt)**2)) / (np.std(tgt)+1e-9))
    p_t1, p_t2, p_comp = [], [], []
    for i in range(N):
        w = t1.write(drift[i]); working = w.mean(axis=0)               # T1 estimate of current drift
        rec = t2.read(concepts[cid[i]], k=1); concept = rec[0][0] if rec else np.zeros(D)  # T2 concept
        p_t1.append(working); p_t2.append(concept); p_comp.append(working + concept)
    import json
    res = {"t1_working_only": round(nrmse(np.array(p_t1), target),4),
           "t2_concept_only": round(nrmse(np.array(p_t2), target),4),
           "composed_t1_t2":  round(nrmse(np.array(p_comp), target),4)}
    res["compose_gain_vs_best_single_pct"] = round(100*(min(res["t1_working_only"],res["t2_concept_only"]) - res["composed_t1_t2"]) / min(res["t1_working_only"],res["t2_concept_only"]),1)
    res["verdict"] = "GO" if res["composed_t1_t2"] < min(res["t1_working_only"],res["t2_concept_only"]) else "NO-GO"
    print(json.dumps(res, indent=2))
    json.dump(res, open("tritier_compose_result.json","w"), indent=2)
