"""sov33_evolve_forest.py — turn the evolve layer's linear tree into a FOREST (DGM archive-branching).

Working tree = one lineage (vN -> vN+1 -> ...). A single plateau kills it.
FOREST = an archive of ALL past versions as branchable "species". A new proposal can branch from ANY
prior node, not just the latest — so a stepping-stone from 10 versions ago can parent a new direction.
This is the Darwin Godel Machine's core mechanism (arXiv:2505.22954): grow an archive, branch open-endedly.

HONEST: this archives CODE/CONFIG proposals (propose-only, human-gated — FORBIDDEN_AUTO still holds).
It does NOT evolve weights and does NOT auto-apply anything. The forest is a genealogy over the JRUM
journal; "branch" = create a new proposal whose parent is a chosen archived node. A human still ratifies.

  add(node)          -> admit a version to the archive (only if it beat its parent OR is interestingly-new)
  branch_from(id)    -> pick any archived node as the parent for a new proposal (open-ended, not linear)
  best()             -> highest-gain living node   | lineage(id) -> path back to root
  forest_status()    -> #trees (roots), #nodes, plateau check
"""
import os, json, time, hashlib
import sov33_paths as P

ARCHIVE = P.sov_path("evolve_forest.jsonl")

def _load():
    if not ARCHIVE.exists(): return []
    return [json.loads(l) for l in open(ARCHIVE) if l.strip()]

def _sign(rec):
    try:
        import sov33_ed25519_sigil as s
        return s.Ed25519Sigil().sign(json.dumps({"id":rec["id"],"parent":rec["parent"]}, sort_keys=True))
    except Exception: return None

def add(target, diff_summary, measured_gain, parent=None, interestingly_new=False):
    """Admit a version to the forest. DGM rule: keep if it beat its parent OR is interestingly-new."""
    nodes = _load()
    par = next((n for n in nodes if n["id"]==parent), None) if parent else None
    par_gain = par["gain"] if par else -1.0
    if measured_gain <= par_gain and not interestingly_new:
        return {"rejected": True, "reason": f"gain {measured_gain} <= parent {par_gain} and not interestingly-new"}
    nid = hashlib.sha256(f"{target}|{diff_summary}|{time.time()}".encode()).hexdigest()[:12]
    rec = {"id": nid, "parent": parent, "target": target, "diff": diff_summary,
           "gain": measured_gain, "ts": time.time(), "interestingly_new": interestingly_new}
    rec["sig"] = _sign(rec)
    with open(ARCHIVE, "a") as f: f.write(json.dumps(rec) + "\n")
    return {"admitted": True, "id": nid, "parent": parent, "gain": measured_gain}

def branch_from(node_id):
    """Open-ended branching: return a node to use as parent for a NEW proposal (any node, not just latest)."""
    nodes = _load()
    n = next((x for x in nodes if x["id"]==node_id), None)
    if not n: return {"error": f"node {node_id} not in archive"}
    return {"branch_parent": node_id, "parent_gain": n["gain"], "note": "propose a new diff with this as parent; human ratifies"}

def best():
    nodes = _load()
    return max(nodes, key=lambda n: n["gain"]) if nodes else None

def lineage(node_id):
    nodes = {n["id"]: n for n in _load()}
    path, cur = [], node_id
    while cur and cur in nodes:
        path.append(cur); cur = nodes[cur].get("parent")
    return path

def forest_status():
    nodes = _load()
    if not nodes: return {"trees": 0, "nodes": 0, "note": "empty forest"}
    roots = [n for n in nodes if not n.get("parent")]
    gains = [n["gain"] for n in nodes]
    # plateau check: last 3 admits show no improvement
    recent = sorted(nodes, key=lambda n: n["ts"])[-3:]
    plateaued = len(recent)>=3 and len({round(r["gain"],3) for r in recent})==1
    return {"trees": len(roots), "nodes": len(nodes), "best_gain": max(gains),
            "plateaued": plateaued, "note": "branch from an older node if plateaued (DGM open-endedness)"}

if __name__ == "__main__":
    os.environ.setdefault("SOV33_SIGIL_DIR", os.path.join(os.environ.get("TMPDIR","/tmp"), "sov33_sigil"))
    import importlib; importlib.reload(P); ARCHIVE = P.sov_path("evolve_forest.jsonl")
    if ARCHIVE.exists(): ARCHIVE.unlink()
    r1 = add("router", "keyword->trained tiny router", 0.12, parent=None)                 # root/tree 1
    r2 = add("router", "add confidence signal", 0.15, parent=r1["id"])                     # branch off 1
    r3 = add("care_gate", "framed-harm patterns", 0.09, parent=None, interestingly_new=True) # root/tree 2 (forest!)
    print("add1:", r1); print("add2:", r2); print("add3:", r3)
    print("best:", best())
    print("lineage(r2):", lineage(r2["id"]))
    print("forest:", forest_status())
    print("branch_from root1:", branch_from(r1["id"]))
