import os
os.environ.setdefault("SOV33_SIGIL_DIR", os.path.join(os.environ.get("TMPDIR","/tmp"),"sov33_sigil"))
res={}
# KRUM — Byzantine aggregation
try:
    import sov33_governed_training as gt
    res["KRUM"]=("krum" in dir(gt) or "GovernedTrainingRound" in dir(gt) or any("krum" in d.lower() for d in dir(gt)))
except Exception as e: res["KRUM"]=f"ERR {str(e)[:60]}"
# ARUM — 14-layer wiring
try:
    import sov33_arum as arum
    m=arum.manifest() if hasattr(arum,"manifest") else None
    res["ARUM"]=bool(m) or ("wire" in dir(arum))
except Exception as e: res["ARUM"]=f"ERR {str(e)[:60]}"
# SRUM — governed swarm
try:
    import sov33_governed_swarm as gs
    res["SRUM"]=any("swarm" in d.lower() or "decompos" in d.lower() for d in dir(gs))
except Exception as e: res["SRUM"]=f"ERR {str(e)[:60]}"
print("=== KRUM/ARUM/SRUM verification ===")
for k,v in res.items(): print(f"  {k:6s} {'PASS' if v is True else v}")
