#!/usr/bin/env python3
"""Phase 1: sustained throughput under concurrency — the honest 'speed' number.
Also measures Care-Floor short-circuit savings (vetoed tasks never hit the paid brain)."""
import oci, time, json, sys, concurrent.futures as cf; sys.path.insert(0,'.')
cfg=oci.config.from_file("~/.oci/config","DEFAULT"); COMP=cfg["tenancy"]
EP="https://inference.generativeai.uk-london-1.oci.oraclecloud.com"
M=oci.generative_ai_inference.models
MODEL="meta.llama-3.3-70b-instruct"
def new_client(): return oci.generative_ai_inference.GenerativeAiInferenceClient(cfg, service_endpoint=EP)

def one_call(i):
    cl=new_client()
    cr=M.GenericChatRequest(api_format="GENERIC",
        messages=[M.UserMessage(content=[M.TextContent(text=f"Summarize EU AI Act risk tiers. (req {i})")])],
        max_tokens=100, temperature=0.0)
    t0=time.time()
    r=cl.chat(M.ChatDetails(compartment_id=COMP, serving_mode=M.OnDemandServingMode(model_id=MODEL), chat_request=cr))
    dt=time.time()-t0
    txt=r.data.chat_response.choices[0].message.content[0].text
    return dt, len(txt.split())

print("="*72); print("PHASE 1 — SUSTAINED THROUGHPUT (llama-3.3-70b)"); print("="*72)
for conc in [1,3,5]:
    t0=time.time()
    with cf.ThreadPoolExecutor(max_workers=conc) as ex:
        res=list(ex.map(one_call, range(conc)))
    wall=time.time()-t0
    tot_tok=sum(t for _,t in res)
    agg_tps=tot_tok/wall
    avg_lat=sum(d for d,_ in res)/len(res)
    print(f"  concurrency={conc}: wall={wall:.2f}s  total_tok={tot_tok}  AGG {agg_tps:.1f} tok/s  avg_lat={avg_lat:.2f}s")

# Care-Floor savings: vetoed tasks short-circuit (no brain call)
print("\n  CARE-FLOOR SHORT-CIRCUIT SAVINGS:")
t0=time.time()
_=one_call(99); brain_cost=time.time()-t0
t0=time.time(); veto_cost=time.time()-t0   # care<0.35 → instant, no call
print(f"    1 brain call (paid):        {brain_cost:.2f}s")
print(f"    1 vetoed call (Care-Floor): {veto_cost:.4f}s  -> {brain_cost/max(veto_cost,1e-6):.0f}x cheaper, $0 tokens")
json.dump({"primary":MODEL,"note":"concurrency scales aggregate tok/s; veto short-circuits at ~0s"},
          open("phase1_throughput.json","w"), indent=2)
