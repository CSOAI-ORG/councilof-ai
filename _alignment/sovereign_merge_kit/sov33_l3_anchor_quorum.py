#!/usr/bin/env python3
"""TRACK D: L3 anchor-routing quorum. 3 routers pick anchor; agree->route, split->escalate."""
import oci, json
from collections import Counter
# [lazy-wired] moved to _lazy_oci() — was module-top (caused import hang):  cfg=oci.config.from_file("~/.oci/config","DEFAULT"); COMP=cfg["tenancy"]
EP="https://inference.generativeai.uk-london-1.oci.oraclecloud.com"
# [lazy-wired] moved to _lazy_oci() — was module-top (caused import hang):  cl=oci.generative_ai_inference.GenerativeAiInferenceClient(cfg, service_endpoint=EP)
M=oci.generative_ai_inference.models
S="cohere.command-r-08-2024"; ANCHORS=["COMPLIANCE","DEFENSE","INTUITION","VOICE"]

# --- lazy OCI globals: construct on first USE, not at import (prevents import hang) ---
class _LzComp(str):
    def __new__(cls):
        try:
            import oci; t=oci.config.from_file("~/.oci/config","DEFAULT")["tenancy"]
        except Exception:
            t="OFFLINE_NO_OCI"
        return super().__new__(cls,t)

class _LazyClient:
    _c=None
    def __getattr__(self,n):
        if _LazyClient._c is None:
            import oci
            _cfg=oci.config.from_file('~/.oci/config','DEFAULT')
            _ep='https://inference.generativeai.uk-london-1.oci.oraclecloud.com'
            _LazyClient._c=oci.generative_ai_inference.GenerativeAiInferenceClient(_cfg,service_endpoint=_ep)
        return getattr(_LazyClient._c,n)
def _lazy_comp():
    import oci
    try: return oci.config.from_file('~/.oci/config','DEFAULT')['tenancy']
    except Exception: return 'OFFLINE_NO_OCI'
cl=_LazyClient(); client=cl
EP='https://inference.generativeai.uk-london-1.oci.oraclecloud.com'
class _LazyStr(str):
    pass

if __name__ == "__main__":
    try:
        COMP=_lazy_comp()
    except Exception:
        COMP=_LzComp()  # resolves real tenancy on first use, fail-soft

    def route(task,seed):
        msg=f"Route to ONE anchor {ANCHORS} (view {seed}). Reply ONLY the anchor word.\nTASK: {task}"
        cr=M.CohereChatRequest(api_format="COHERE",message=msg,max_tokens=6,temperature=0.3)
        t=cl.chat(M.ChatDetails(compartment_id=COMP,serving_mode=M.OnDemandServingMode(model_id=S),chat_request=cr)).data.chat_response.text.upper()
        return next((a for a in ANCHORS if a in t),"UNKNOWN")
    def quorum(task):
        v=[route(task,i) for i in range(3)]; top,n=Counter(v).most_common(1)[0]
        return {"votes":v,"chosen":top if n>=2 else None,"escalate":n<2}
    TASKS=["Draft an EU AI Act Annex IV file.","Detect a prompt-injection attack.",
           "Write a grief-support message.","Assess if this action harms a vulnerable person."]
    print("TRACK D: L3 anchor-quorum (3 routers, escalate on split)")
    rows=[]
    for t in TASKS:
        r=quorum(t); rows.append({"task":t[:36],**r})
        print(f"  {r['votes']} -> {'ESCALATE' if r['escalate'] else r['chosen']:12} | {t[:36]}")
    json.dump(rows,open("l3_anchor_results.json","w"),indent=2)
    print(f"  -> {sum(1 for r in rows if r['escalate'])}/{len(TASKS)} escalated on disagreement")


    # --- lazy OCI init (prevents import-time network hang; call from runtime, not import) ---
    def _lazy_oci():
        import oci
        _cfg = oci.config.from_file("~/.oci/config","DEFAULT")
        _ep = "https://inference.generativeai.uk-london-1.oci.oraclecloud.com"
        _cl = oci.generative_ai_inference.GenerativeAiInferenceClient(_cfg, service_endpoint=_ep)
        return _cfg, _cfg["tenancy"], _ep, _cl

