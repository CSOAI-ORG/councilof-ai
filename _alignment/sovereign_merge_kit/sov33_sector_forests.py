"""sov33_sector_forests.py — PER-SECTOR evolve forests (your 'different forest for different').

Instead of one flat forest, each SECTOR (governance/defense/intuition/voice/detectors/openworld/reasoning)
compounds its OWN lineage, so a defense gain doesn't muddy the governance gain signal. SOV4 reads ALL
sector forests to know its per-sector maturity ('governance strong, openworld thin -> retrain openworld next').

Thin layer over sov33_evolve_forest: one archive, partitioned by a `sector` tag. Every node still signed.
"""
import os, json, time, hashlib

SECTORS = ["governance", "defense", "intuition", "voice", "judgment", "detectors", "openworld", "reasoning"]

def _archive():
    import sov33_paths as P
    return P.sov_path("sector_forests.jsonl")

def _load():
    a = _archive()
    if not a.exists(): return []
    return [json.loads(l) for l in open(a) if l.strip()]

def _sign(rec):
    try:
        import sov33_ed25519_sigil as s
        r = s.Ed25519Sigil().sign(json.dumps({"id": rec["id"], "sector": rec["sector"]}, sort_keys=True))
        return r.get("own_hash", "")[:16] if isinstance(r, dict) else ""
    except Exception:
        return ""

def add(sector, diff_summary, measured_gain, parent=None):
    """Add a signed gain-node to a SECTOR's forest. measured_gain must be a real held-out number."""
    if sector not in SECTORS:
        return {"error": f"unknown sector {sector}; valid: {SECTORS}"}
    nodes = _load()
    rec = {
        "id": hashlib.sha256(f"{sector}{diff_summary}{time.time()}".encode()).hexdigest()[:12],
        "sector": sector, "diff": diff_summary[:200], "gain": round(float(measured_gain), 4),
        "parent": parent, "ts": time.time(),
    }
    rec["sigil"] = _sign(rec)
    with open(_archive(), "a") as f:
        f.write(json.dumps(rec) + "\n")
    return rec

def sector_status(sector):
    """Maturity of one sector: node count, best gain, whether it's plateaued."""
    nodes = [n for n in _load() if n["sector"] == sector]
    if not nodes:
        return {"sector": sector, "nodes": 0, "best_gain": None, "maturity": "EMPTY"}
    gains = [n["gain"] for n in nodes]
    best = max(gains)
    recent = gains[-3:]
    plateau = len(recent) >= 3 and (max(recent) - min(recent)) < 0.01
    maturity = "PLATEAU" if plateau else ("STRONG" if best >= 0.5 else "GROWING" if best >= 0.2 else "THIN")
    return {"sector": sector, "nodes": len(nodes), "best_gain": round(best, 4), "maturity": maturity}

def all_sectors_status():
    """SOV4 reads this: per-sector maturity across the whole estate + which to retrain next."""
    rows = [sector_status(s) for s in SECTORS]
    # 'retrain next' = the thinnest non-empty, or the first empty
    candidates = [r for r in rows if r["maturity"] in ("THIN", "EMPTY")]
    retrain_next = candidates[0]["sector"] if candidates else min(rows, key=lambda r: r["best_gain"] or 0)["sector"]
    return {"sectors": rows, "total_sectors": len(SECTORS),
            "populated": sum(1 for r in rows if r["nodes"] > 0),
            "retrain_next": retrain_next}

if __name__ == "__main__":
    os.environ.setdefault("SOV33_SIGIL_DIR", os.path.join(os.environ.get("TMPDIR", "/tmp"), "sov33_sigil"))
    # seed with DISK-TRACED numbers only (each verified against the source file this session):
    #   governance 0.09  = charter-student distill +9% held-out grounding (charter-student result)
    #   detectors 0.977  = detector_injection_tfidf held-out acc; 0.871 = detector_toxicity_embed held-out acc
    #   openworld 0.482  = pyramid_4brain_results.json 4brain_better_pct 0.482 (48.2%); NOT 0.728 (that was
    #                      fluid_pyramid_results.json improvement_pct 72.8, a % improvement not a forest gain)
    seed = [
        ("governance", "charter-student distill +9% held-out grounding", 0.09),
        ("detectors", "injection tfidf held-out acc 0.977", 0.977),
        ("detectors", "toxicity embed held-out acc 0.871", 0.871),
        ("openworld", "4brain pyramid better-rate 0.482 (pyramid_4brain_results.json)", 0.482),
    ]
    for sec, diff, gain in seed:
        add(sec, diff, gain)
    import json as _j
    print(_j.dumps(all_sectors_status(), indent=2))
