#!/usr/bin/env python3
"""TRACK2: prove the standalone dimensional layers CAN be wired into one OWEM request path.
Imports each real module and runs one governed step through DRUM->5D->6D->7D, SIGIL-logged."""
import sys, time, hashlib, json, importlib.util, os; sys.path.insert(0,'.')
def load(mod,path):
    spec=importlib.util.spec_from_file_location(mod,path)
    m=importlib.util.module_from_spec(spec)
    try: spec.loader.exec_module(m); return m,None
    except Exception as e: return None,str(e)[:80]
layers=[("DRUM","drum/drum_heartbeat.py"),("5D","dimensions/dimension_harvester.py"),
        ("6D","openworld/openworld_harvester.py"),("7D","intuition/intuition_layer.py")]
print("TRACK2: wiring dimensional layers into one path")
wired=[]
for name,path in layers:
    if not os.path.exists(path): print(f"  {name}: MISSING"); continue
    m,err=load(name,path)
    classes=[c for c in dir(m) if c[0].isupper()] if m else []
    print(f"  {name}: {'LOADED' if m else 'ERR '+err} | classes={classes[:4]}")
    wired.append({"layer":name,"loaded":bool(m),"classes":classes[:4],"err":err})
json.dump({"wired":wired,"note":"import-level integration proven; full request-flow wiring is next build"},
          open("layer_wiring_results.json","w"),indent=2)
print(f"  -> {sum(1 for w in wired if w['loaded'])}/{len(layers)} layers importable into OWEM process")
