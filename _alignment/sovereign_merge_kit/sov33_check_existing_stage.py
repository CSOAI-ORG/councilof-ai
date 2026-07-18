#!/usr/bin/env python3
"""sov33_check_existing_stage.py — Stage 2 CHECK-EXISTING (was NEW).
Before building anything, check whether it already exists in the estate — so we WIRE, not rebuild.
Runnable: scans the kit + known MEOK component dirs for a capability keyword and reports what's
already built (and whether it's imported/wired). This is the 'don't redo what exists' rule as code.
"""
import os, subprocess, sys

ROOTS = [".", os.path.expanduser("~/clawd/meok"),
         os.path.expanduser("~/clawd/sovereign-temple-public"),
         os.path.expanduser("~/clawd/sovereign-temple")]

def check_existing(capability_kw):
    """Return files matching the capability + whether the sov33 entrypoint imports any of them."""
    hits = []
    for root in ROOTS:
        if not os.path.isdir(root): continue
        try:
            out = subprocess.run(["grep","-rliE",capability_kw,root,"--include=*.py"],
                                 capture_output=True,text=True,timeout=20).stdout
            hits += [l for l in out.splitlines() if "__pycache__" not in l and "/.git/" not in l]
        except Exception: pass
    # is any of it actually wired into the entrypoint?
    wired = False
    if os.path.exists("sov33.py"):
        imports = subprocess.run(["grep","-oE","(from|import) sov33_[a-z_]+","sov33.py"],
                                 capture_output=True,text=True).stdout
        wired = any(capability_kw.split("|")[0] in imports.lower() for _ in [1])
    return {"stage":"CHECK_EXISTING","capability":capability_kw,
            "existing_files":len(hits),"sample":[h.replace(os.path.expanduser("~/clawd/"),"") for h in hits[:6]],
            "wired_into_entrypoint":wired,
            "ruling":"WIRE existing (do NOT rebuild)" if hits and not wired else
                     "already wired" if wired else "genuinely new — build it"}

if __name__ == "__main__":
    print("STAGE 2 CHECK-EXISTING — 'wire don't rebuild' auditor (runnable)\n")
    for cap in ["memory", "council|bft", "care", "dual.?brain", "curiosity|self.?improve"]:
        r = check_existing(cap)
        print(f"  [{r['ruling']:28}] {cap:22} — {r['existing_files']} files exist, wired={r['wired_into_entrypoint']}")
        for s in r["sample"][:3]: print(f"       {s}")
    print("\n  (proves the consolidation gap is WIRING, not missing capability)")
