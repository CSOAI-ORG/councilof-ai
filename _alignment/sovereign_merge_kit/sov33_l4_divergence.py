#!/usr/bin/env python3
"""TRACK A: L4 brain N-version divergence. Draft on cheap model, cross-check on 70B;
if they materially DISAGREE, that disagreement is the fault signal -> escalate/flag. Measured live."""
import oci, json, re
EP='https://inference.generativeai.uk-london-1.oci.oraclecloud.com'
class _LzCl:
    _c=None
    def __getattr__(self,n):
        if _LzCl._c is None:
            import oci
            _cfg=oci.config.from_file('~/.oci/config','DEFAULT')
            _LzCl._c=oci.generative_ai_inference.GenerativeAiInferenceClient(_cfg,service_endpoint=EP)
        return getattr(_LzCl._c,n)
cl=_LzCl(); client=cl
import oci as _oci_lazy
class _LzM:
    def __getattr__(self,n): import oci; return getattr(oci.generative_ai_inference.models,n)
M=_LzM()
CHEAP="cohere.command-r-08-2024"; STRONG="meta.llama-3.3-70b-instruct"
def call(model,q,mx=120):
    if model.startswith("cohere."):
        cr=M.CohereChatRequest(api_format="COHERE",message=q,max_tokens=mx,temperature=0.0)
    else:
        cr=M.GenericChatRequest(api_format="GENERIC",messages=[M.UserMessage(content=[M.TextContent(text=q)])],max_tokens=mx,temperature=0.0)
    r=cl.chat(M.ChatDetails(compartment_id=COMP,serving_mode=M.OnDemandServingMode(model_id=model),chat_request=cr))
    return r.data.chat_response.text if model.startswith("cohere.") else r.data.chat_response.choices[0].message.content[0].text
def agree(a,b):
    """cheap judge: do two answers agree on substance? returns 0-1 agreement."""
    v=call(CHEAP,f"Do these two answers AGREE on substance? Reply ONLY 0.00-1.00.\nA: {a[:300]}\nB: {b[:300]}\nAGREEMENT:",8)
    m=re.search(r"[01]?\.\d+|\b[01]\b",v); return float(m.group()) if m else 0.5
BATTERY=["What are the EU AI Act risk tiers?","What is 17 x 23?",
         "Reconcile Art.6 oversight with ISO 42001 controls.","Define audit log."]

class _LzComp(str):
    def __new__(cls):
        try:
            import oci;t=oci.config.from_file("~/.oci/config","DEFAULT")["tenancy"]
        except Exception:
            t="OFFLINE_NO_OCI"
        return super().__new__(cls,t)
COMP=_LzComp()

if __name__ == "__main__":
    print("TRACK A: L4 N-version divergence (cheap vs 70B, flag disagreement)")
    rows=[]
    for q in BATTERY:
        a=call(CHEAP,q); b=call(STRONG,q); ag=agree(a,b)
        flag = ag<0.6  # low agreement = Byzantine-suspect, escalate to human/third model
        rows.append({"q":q[:40],"agreement":ag,"flag_divergence":flag})
        print(f"  agree={ag:.2f} {'DIVERGENT->flag' if flag else 'concordant->trust cheap':22} | {q[:40]}")
    json.dump(rows,open("l4_divergence_results.json","w"),indent=2)
    print(f"  -> {sum(1 for r in rows if r['flag_divergence'])}/{len(BATTERY)} flagged for divergence (fault-tolerant: no single model trusted blindly)")

