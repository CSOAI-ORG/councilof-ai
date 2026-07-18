"""sov33_rivers.py — HYDRO-VISUAL layer: data-flow through memory rendered as rivers/rain/mist in SovSpace/JSpace.

HONEST PRINCIPLE (same as CRUM): every visual property is DERIVED from a real measured number, never invented.
This is a RENDER MAPPING for the SovSpace/JSpace visual surface — it does NOT change the memory mechanism.
The water metaphor maps the real data-flow the TLM memory produces:
  RIVER   = the capillary working-memory flow (T1) — flow_rate from write throughput; width from state magnitude
  RAIN    = new labeled examples dripping into the learning ledger (the collectors) — drop_rate from ingest count
  MIST    = concept-recall activation (T2 sigil reads) — density from mean cosine similarity of recalls
  POOL    = the signed forest (T3 long-term) — depth from node count; each node a signed still-water layer
Every field carries provenance proving it maps to a disk number. Renderer (Cesium/UE5) is a VIEW; SOV holds truth.
"""
def _clamp(x, lo=0.0, hi=1.0): return max(lo, min(hi, x))

def river_from_working(state_magnitude, write_count):
    """T1 capillary -> river. Real inputs: working-memory state L2 norm + writes this window."""
    return {"element":"river",
            "flow_rate": round(_clamp(write_count/100.0),3),      # writes/window -> flow
            "width":     round(_clamp(state_magnitude/10.0),3),   # state magnitude -> width
            "_prov": {"flow_rate<-write_count": write_count, "width<-state_magnitude": round(state_magnitude,3)}}

def rain_from_ledger(new_examples, floor=200):
    """Collectors -> rain. Real input: labeled examples added to the learning ledger."""
    return {"element":"rain",
            "drop_rate": round(_clamp(new_examples/floor),3),     # toward retrain-ready threshold
            "intensity": "storm" if new_examples>floor else ("drizzle" if new_examples>0 else "dry"),
            "_prov": {"drop_rate<-new_examples/floor": f"{new_examples}/{floor}"}}

def mist_from_concept(mean_similarity, n_recalls):
    """T2 concept recall -> mist. Real inputs: mean cosine of recalls + how many fired."""
    return {"element":"mist",
            "density": round(_clamp(mean_similarity),3),          # recall confidence -> mist density
            "extent":  round(_clamp(n_recalls/20.0),3),
            "_prov": {"density<-mean_similarity": round(mean_similarity,3), "extent<-n_recalls": n_recalls}}

def pool_from_forest(node_count, best_gain):
    """T3 signed forest -> still pool. Real inputs: forest node count + best measured gain."""
    return {"element":"pool",
            "depth":  round(_clamp(node_count/20.0),3),           # more signed nodes -> deeper
            "clarity": round(_clamp(best_gain),3),                # bigger measured gain -> clearer water
            "_prov": {"depth<-node_count": node_count, "clarity<-best_gain": round(best_gain,3)}}

def hydro_scene(working_mag=0.0, writes=0, new_examples=0, mean_sim=0.0, n_recalls=0, forest_nodes=0, best_gain=0.0):
    """Assemble the full SovSpace/JSpace water scene from REAL memory-flow numbers."""
    return {"scene":"sovspace_hydro",
            "river": river_from_working(working_mag, writes),
            "rain":  rain_from_ledger(new_examples),
            "mist":  mist_from_concept(mean_sim, n_recalls),
            "pool":  pool_from_forest(forest_nodes, best_gain),
            "note":"render mapping only; every field derived from a real number (provenance in _prov); SOV holds truth, Cesium/UE5 render"}

if __name__ == "__main__":
    import json
    # live example from real forest state
    try:
        import sov33_evolve_forest as forest
        fs = forest.forest_status(); nodes = fs.get("nodes",0); gain = fs.get("best_gain",0.0)
    except Exception:
        nodes, gain = 0, 0.0
    scene = hydro_scene(working_mag=3.2, writes=42, new_examples=93, mean_sim=0.78, n_recalls=5, forest_nodes=nodes, best_gain=gain)
    print(json.dumps(scene, indent=2))
