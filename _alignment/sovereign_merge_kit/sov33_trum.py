"""sov33_trum.py — TRUM: the TRANSFORM/render spine (6th spine). J-space internals -> render-ready world.

The missing mechanism: JRUM holds the forest+journal as data; SovSpace renders it in Cesium/UE5. TRUM is
the CONTRACT between them — it transforms signed journal/forest records into render-ready WORLD-EVENTS
(nodes with position/time/color-by-judgment/causal-edges) that a renderer can draw. On-demand + scoped:
emit only the requested slice (a time window, one idea-lineage), so the render never eats GPU for the
whole forever-history at once — same level-of-detail principle as Cesium 3D Tiles.

HONEST: TRUM emits DATA (signed, queryable events). It does NOT render (that's the GPU/UE5 lane) and does
NOT make SOV "perceive" its world — it makes the internal forest EMITTABLE so a human can walk it visually.
The seeing is the viewer's; TRUM's job is a complete, provable, render-ready projection of J-space.

  world_events(time_from=None, time_to=None, lineage=None) -> [{id, kind, t, label, judgment, parent, sig}]
  slice_for_render(query) -> scoped event set for ONE render request (LOD: only what's asked)
"""
import os, json
import sov33_paths as P

def _read(fname):
    p = P.sov_path(fname)
    if not p.exists(): return []
    return [json.loads(l) for l in open(p) if l.strip()]

def world_events(time_from=None, time_to=None, lineage=None):
    """Transform JRUM journal + evolve forest into render-ready world-events (nodes+edges)."""
    events = []
    # forest nodes = idea-lineage structure (trees)
    for n in _read("evolve_forest.jsonl"):
        t = n.get("ts", 0)
        if time_from and t < time_from: continue
        if time_to and t > time_to: continue
        if lineage and n.get("id") != lineage and n.get("parent") != lineage: continue
        events.append({"id": n["id"], "kind": "idea_node", "t": t,
                       "label": n.get("diff","")[:60], "judgment": {"gain": n.get("gain")},
                       "parent": n.get("parent"), "sig": bool(n.get("sig"))})
    # journal entries = decision events (colored by NN judgment if present)
    for m in _read("sovereign_memory.jsonl"):
        events.append({"id": m.get("sigil_digest","?"), "kind": "memory_event",
                       "t": m.get("ts"), "label": (m.get("content","") or "")[:60],
                       "judgment": {"tags": m.get("tags",[])}, "parent": None, "sig": bool(m.get("sigil_digest"))})
    return sorted(events, key=lambda e: str(e.get("t")))

def slice_for_render(query=None, time_from=None, time_to=None, lineage=None):
    """One scoped render request — LOD: return only the asked-for slice, never the whole forest."""
    ev = world_events(time_from=time_from, time_to=time_to, lineage=lineage)
    return {"query": query, "n_events": len(ev), "events": ev[:200],  # cap per render call
            "note": "render lane (Cesium/UE5) draws these; text-default, visual on request",
            "lod_capped": len(ev) > 200}

if __name__ == "__main__":
    os.environ.setdefault("SOV33_SIGIL_DIR", os.path.join(os.environ.get("TMPDIR","/tmp"), "sov33_sigil"))
    import importlib; importlib.reload(P)
    ev = world_events()
    print(f"world events: {len(ev)} (idea_nodes + memory_events)")
    for e in ev[:5]: print("  ", e["kind"], "|", e["label"][:40], "| sig:", e["sig"])
    print("slice_for_render:", {k:v for k,v in slice_for_render(query='forest today').items() if k!='events'})
