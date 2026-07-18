import os
os.environ.setdefault("SOV33_SIGIL_DIR", os.path.join(os.environ.get("TMPDIR","/tmp"),"sov33_sigil"))
results = {}
# DRUM
import sov33_drum_clock as drum; drum.tick("E2E"); results["DRUM"]=bool(drum.session_span()["entries"])
# JRUM (journal + log)
import sov33_jrum as jrum; r=jrum.log_decision("e2e test decision","OK",gate="E2E"); results["JRUM"]=bool(r.get("drum"))
# evolve FOREST
import sov33_evolve_forest as forest; a=forest.add("e2e","e2e diff",0.2); results["FOREST"]=a.get("admitted",False)
# co-evaluator
import sov33_coevolve_evaluator as coev; s=coev.saturation([1,1,1,1]); results["COEVAL"]=s["saturated"]
# dream cycle
import sov33_dream_cycle as dream; d=dream.dream("e2e"); results["DREAM"]=("consolidation" in d)
# TRUM (transform)
import sov33_trum as trum; ev=trum.world_events(); results["TRUM"]=len(ev)>0
# CRUM (represent)
import sov33_crum as crum; m=crum.style_map(ev[:3]); results["CRUM"]=m["all_styles_traced_to_real_values"]
print("=== E2E SPINE VERIFICATION ===")
for k,v in results.items(): print(f"  {k:8s} {'PASS' if v else 'FAIL'}")
print("ALL PASS:", all(results.values()))
