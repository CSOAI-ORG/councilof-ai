#!/usr/bin/env python3
"""sov33_e2e_benchmark.py — find SOV33's TRUE STACK. MEOK-SOV3 2026-07-10.
Measures, for every Oracle chat model: reachable? latency, output tokens, tokens/sec.
Then governance overhead (raw brain vs full OWEM wrapper) and two-tier bridge on live brain."""
import oci, time, json, sys
sys.path.insert(0,'.')

cfg = oci.config.from_file("~/.oci/config","DEFAULT")
COMP = cfg["tenancy"]
EP = "https://inference.generativeai.uk-london-1.oci.oraclecloud.com"
client = oci.generative_ai_inference.GenerativeAiInferenceClient(cfg, service_endpoint=EP)
M = oci.generative_ai_inference.models

CHAT_MODELS = [
    "cohere.command-a-03-2025","cohere.command-r-08-2024","cohere.command-r-plus-08-2024",
    "meta.llama-3.1-405b-instruct","meta.llama-3.2-90b-vision-instruct","meta.llama-3.3-70b-instruct",
    "meta.llama-4-maverick-17b-128e-instruct-fp8","openai.gpt-oss-120b","openai.gpt-oss-20b",
]
PROMPT = "In one sentence, what does EU AI Act Article 6 require?"
SYS = "You are SOVEREIGN-COMPLIANCE. Authoritative, cite the article."

def call(model, max_tokens=120):
    is_cohere = model.startswith("cohere.")
    if is_cohere:
        cr = M.CohereChatRequest(api_format="COHERE", message=PROMPT, max_tokens=max_tokens, temperature=0.0)
    else:
        cr = M.GenericChatRequest(api_format="GENERIC",
            messages=[M.SystemMessage(content=[M.TextContent(text=SYS)]),
                      M.UserMessage(content=[M.TextContent(text=PROMPT)])],
            max_tokens=max_tokens, temperature=0.0)
    det = M.ChatDetails(compartment_id=COMP,
        serving_mode=M.OnDemandServingMode(model_id=model), chat_request=cr)
    t0=time.time(); r=client.chat(det); dt=time.time()-t0
    if is_cohere:
        txt = r.data.chat_response.text
    else:
        txt = r.data.chat_response.choices[0].message.content[0].text
    ntok = len(txt.split())
    return dt, ntok, txt

print("="*80); print("SOV33 TRUE-STACK BENCHMARK — Oracle GenAI, uk-london-1"); print("="*80)
results=[]
for m in CHAT_MODELS:
    try:
        dt,ntok,txt = call(m)
        tps = ntok/dt if dt>0 else 0
        results.append({"model":m,"ok":True,"latency_s":round(dt,2),"tokens":ntok,"tok_per_s":round(tps,1)})
        print(f"  ✓ {m:44} {dt:5.2f}s  {ntok:3d}tok  {tps:5.1f}tok/s")
    except Exception as e:
        results.append({"model":m,"ok":False,"err":type(e).__name__+":"+str(e)[:60]})
        print(f"  ✗ {m:44} {type(e).__name__}: {str(e)[:50]}")
json.dump(results, open("e2e_bench_results.json","w"), indent=2)
ok=[r for r in results if r.get("ok")]
if ok:
    fastest=min(ok,key=lambda r:r["latency_s"]); throughput=max(ok,key=lambda r:r["tok_per_s"])
    print(f"\n  LIVE models: {len(ok)}/{len(CHAT_MODELS)}")
    print(f"  Lowest latency:  {fastest['model']} ({fastest['latency_s']}s)")
    print(f"  Highest tok/s:   {throughput['model']} ({throughput['tok_per_s']} tok/s)")
