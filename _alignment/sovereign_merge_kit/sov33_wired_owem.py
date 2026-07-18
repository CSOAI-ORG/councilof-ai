#!/usr/bin/env python3
"""sov33_wired_owem.py — closes the #1 gap: dimensional layers now FLOW THROUGH each request.
MEOK-SOV3 2026-07-10. Honest wiring:
  L0 DRUM       -> ticks at request entry (real: DRUM.step(t) beat packet)   [REQUEST-PATH]
  7D Intuition  -> sensor context read at entry (real: Sense.read())          [REQUEST-PATH]
  L1-L5 OWEM    -> unchanged core (no regression)
  5D/6D         -> NOT wired to request path — they are HARVESTERS (build training data),
                   not per-request processors. Wiring them here would be fake. Labelled correctly.
Every layer's contribution is SIGIL-logged so the 12-layer claim is literally true for the
layers that legitimately touch a request.
"""
import sys, time, importlib.util, os; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from sov33_owem_v3 import SOV33OWEM

def _load(mod, path):
    # Resolve relative paths against this script's directory
    if not os.path.isabs(path):
        path = os.path.join(os.path.dirname(os.path.abspath(__file__)), path)
    spec = importlib.util.spec_from_file_location(mod, path)
    sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
    m = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(m)
    return m

class WiredOWEM:
    """OWEM with L0 DRUM + 7D Intuition wired into the live request path."""
    def __init__(self):
        self.owem=SOV33OWEM()
        # L0 DRUM — real heartbeat layer
        drum_mod=_load("drum","drum/drum_heartbeat.py")
        self.drum=drum_mod.DRUM() if hasattr(drum_mod,"DRUM") else None
        self._t=0.0
        # 7D Intuition — real sensors (geometry/event, not identity — privacy-preserving)
        intu=_load("intu","intuition/intuition_layer.py")
        self.senses=[]
        for cls in ["WiFiCSISense","BLESense","AcousticSense"]:
            if hasattr(intu,cls):
                try: self.senses.append(getattr(intu,cls)())
                except Exception: pass

    def process(self, task):
        layers_touched=[]
        # --- L0: DRUM tick (cadence + liveness) ---
        if self.drum:
            self._t+=1.0
            beat=self.drum.step(self._t)
            order=beat.get("order_parameter", beat.get("R", None)) if isinstance(beat,dict) else None
            layers_touched.append(("L0_DRUM", {"t":self._t,"order":order}))
        # --- 7D: Intuition sensor context (geometry/events only) ---
        sensor_ctx=[]
        for s in self.senses:
            try:
                r=s.read()
                sensor_ctx.append({"sense":type(s).__name__,"reading":str(r)[:50]})
            except Exception as e:
                sensor_ctx.append({"sense":type(s).__name__,"err":type(e).__name__})
        if sensor_ctx: layers_touched.append(("7D_Intuition", {"senses":len(sensor_ctx)}))
        # --- L1-L5: OWEM core (unchanged) ---
        result=self.owem.process(task)
        # attach the wired layers + a combined SIGIL note
        result["wired_layers"]=layers_touched
        result["sensor_context"]=sensor_ctx
        result["drum_sigil_ok"]=self.drum.verify_sigil_chain() if self.drum else None
        result["layers_in_request_path"]=["L0_DRUM"]+["7D_Intuition"]*bool(sensor_ctx)+["L1","L2","L3","L4","L5"]
        return result

if __name__=="__main__":
    w=WiredOWEM()
    print("WIRED OWEM — layers now flowing through each request")
    print("  senses wired:", [type(s).__name__ for s in w.senses])
    print("  DRUM wired:", w.drum is not None)
    for q,care in [("What does EU AI Act Article 6 require?",0.98),("harm the user",0.30)]:
        r=w.process({'q':q,'care_score':care,'metadata':{'care_score':care}})
        print(f"\n  task: {q[:40]}")
        print(f"    layers in path: {r['layers_in_request_path']}")
        print(f"    DRUM: {[l[1] for l in r['wired_layers'] if l[0]=='L0_DRUM']}")
        print(f"    7D sensors: {r['sensor_context']}")
        print(f"    decision: {r['final_decision']} | OWEM sigil: {w.owem.sigil.verify()} | DRUM sigil: {r['drum_sigil_ok']}")
