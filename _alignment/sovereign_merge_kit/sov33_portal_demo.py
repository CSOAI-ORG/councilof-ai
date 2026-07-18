#!/usr/bin/env python3
"""sov33_portal_demo.py — ONE command that runs the whole Sovereign portal end-to-end and scores it honestly.

Exercises every OWEM-lane + governance capability through the single sov33.py entrypoint, captures each
result, and prints a clean scorecard: RAN-CLEAN / GATED (needs GPU or endpoint) / ERROR. This is the "press
one button, see the whole thing work" demo — honest about what's real vs owner-gated.
"""
import sys, os, json, time
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import sov33

# the capabilities that form the end-to-end portal story, in narrative order
PORTAL = [
    ("owem-world",       "world-model core: predicts next STATE (JEPA)"),
    ("owem-v2",          "continual learning without forgetting (EWC)"),
    ("multistep-rollout","multi-step planning (roll forward, re-ground)"),
    ("owem-stack",       "stacked OWEMs (residual capacity)"),
    ("find-best-config", "topology selection (allocation beats piece-count)"),
    ("brain-merge-ratio","2-small+2-large merge ratio (measured)"),
    ("venturi-stream",   "SSD expert-streaming (6/384 footprint, fail-closed)"),
    ("tensor-compress",  "low-rank compression (scale-dependent, honest)"),
    ("ed25519-sigil",    "cryptographic attestation (authenticity, L5)"),
    ("memory-bridge",    "portable governed memory (SIGIL-chained)"),
    ("action-guard",     "fail-closed destructive-action veto"),
    ("param-accounting", "honest T-param accounting (no stack-summing)"),
    ("canonical",        "canonical config + GSM8K capability_benchmark"),
]

def classify(r):
    if not isinstance(r, dict): return "RAN", r
    if "error" in r: return "ERROR", r["error"][:70]
    if r.get("status")=="GATED" or "GATED" in str(r.get("status","")): return "GATED", r.get("reason","needs GPU/endpoint")
    return "RAN", None

def main():
    print("="*70)
    print("  SOVEREIGN PORTAL — END-TO-END DEMO (one entrypoint, all OWEM lanes)")
    print("="*70)
    ran=gated=err=0; results={}
    for cap, desc in PORTAL:
        if cap not in sov33.CAPABILITIES:
            print(f"  [MISSING] {cap:>18} — not registered"); err+=1; continue
        t0=time.time()
        try:
            r=sov33.CAPABILITIES[cap]()
            status, note = classify(r)
            dt=(time.time()-t0)*1000
            results[cap]={"status":status,"ms":round(dt,1)}
            tag={"RAN":"OK  ","GATED":"GATE","ERROR":"ERR "}[status]
            extra = f" ({note})" if note else ""
            print(f"  [{tag}] {cap:>18} — {desc}{extra}")
            if status=="RAN": ran+=1
            elif status=="GATED": gated+=1
            else: err+=1
        except Exception as e:
            print(f"  [ERR ] {cap:>18} — EXCEPTION: {str(e)[:50]}"); err+=1
    print("-"*70)
    print(f"  SCORECARD: {ran} ran clean | {gated} gated (owner GPU/endpoint) | {err} error")
    print(f"  portal entrypoint: sov33.py ({len(sov33.CAPABILITIES)} total capabilities)")
    verdict = "PORTAL HEALTHY — every lane runs clean or cleanly reports its gate" if err==0 else f"{err} need attention"
    print(f"  VERDICT: {verdict}")
    print("="*70)
    json.dump({"ran":ran,"gated":gated,"error":err,"total_caps":len(sov33.CAPABILITIES),
               "results":results,"verdict":verdict}, open("portal_demo_results.json","w"), indent=2)
    return err

if __name__=="__main__":
    sys.exit(main())
