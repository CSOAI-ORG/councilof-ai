#!/usr/bin/env python3
"""sov33_scorecard.py — REAL correctness-graded scorecard for SOV33 setups.
Fixes the earlier answer-keyed / length-proxy test the auditor killed. Here:
  - GROUND TRUTH is a checkable one-word answer per item (yes/no/number), NOT the model's own text.
  - QUALITY = correctness against ground truth, NOT verbosity.
  - Compares 3 real setups on the LIVE Oracle brains:
      (A) solo-cheap   : Cohere command-r only
      (B) solo-strong  : Meta llama-3.3-70b only
      (C) escalate     : defer-to-escalate (agree->cheap, disagree->strong)  [sov33_escalate]
  - Reports per-setup accuracy, latency, and cost proxy (which brain answered).
Honest: small battery (principle + direction), single run (temp=0 so deterministic-ish),
governance items have defensible ground truth; NOT a public leaderboard.
"""
import sys, os, time, json
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import oci
_cfg = oci.config.from_file("~/.oci/config","DEFAULT")
_cl = oci.generative_ai_inference.GenerativeAiInferenceClient(
    _cfg, service_endpoint="https://inference.generativeai.uk-london-1.oci.oraclecloud.com")
CHEAP="cohere.command-r-08-2024"; STRONG="meta.llama-3.3-70b-instruct"

def _ask(mid, q):
    m = oci.generative_ai_inference.models
    sysmsg="Answer with ONLY the single word yes or no. No explanation."
    if mid.startswith("cohere."):
        cr=m.CohereChatRequest(message=q, preamble_override=sysmsg, max_tokens=6, temperature=0.0)
        det=m.ChatDetails(compartment_id=_cfg["tenancy"], serving_mode=m.OnDemandServingMode(model_id=mid), chat_request=cr)
        return _cl.chat(det).data.chat_response.text.strip().lower()
    cr=m.GenericChatRequest(api_format=m.BaseChatRequest.API_FORMAT_GENERIC,
        messages=[m.Message(role="SYSTEM",content=[m.TextContent(text=sysmsg)]),
                  m.Message(role="USER",content=[m.TextContent(text=q)])], max_tokens=6, temperature=0.0)
    det=m.ChatDetails(compartment_id=_cfg["tenancy"], serving_mode=m.OnDemandServingMode(model_id=mid), chat_request=cr)
    return _cl.chat(det).data.chat_response.choices[0].message.content[0].text.strip().lower()

def norm(a): 
    a=(a or "").split()[0].strip(".,!'\"").lower() if a else ""
    return a

# BATTERY: (question, ground_truth) — checkable governance/factual yes-no with defensible answers
BATTERY=[
 ("Under the EU AI Act, is a CV-screening AI used in hiring classified high-risk?","yes"),
 ("Do the token limits of two chained language models add together into one larger limit?","no"),
 ("Is real-time remote biometric identification in public spaces restricted under EU AI Act Article 5?","yes"),
 ("Is ISO 42001 an AI management-system standard?","yes"),
 ("Can a stateless verifier check a process rule such as 'the user gave explicit consent'?","no"),
 ("Is GDPR Article 9 concerned with special-category (sensitive) personal data?","yes"),
 ("Does majority voting among highly-correlated model judges add independent information?","no"),
 ("Is conformal prediction a distribution-free method to bound error rate?","yes"),
 ("Is a 3-billion-parameter model generally more capable than a 70-billion one of the same family?","no"),
 ("Under UKGDPR, does a data controller need a lawful basis to process personal data?","yes"),
 ("Is a smoke detector in a home an example of a high-risk AI system under the EU AI Act?","no"),
 ("Does the EU AI Act require high-risk systems to keep logs/records (traceability)?","yes"),
]

def run_setup(name, fn):
    correct=0; t0=time.time(); rows=[]
    for q,gt in BATTERY:
        try: ans, who = fn(q)
        except Exception as e: ans, who = f"ERR:{type(e).__name__}", "err"
        ok = norm(ans).startswith(gt)
        correct += ok; rows.append((ok,who,norm(ans),gt))
    dt=time.time()-t0
    return {"setup":name,"acc":correct/len(BATTERY),"correct":correct,"n":len(BATTERY),
            "latency_total_s":round(dt,1),"latency_per_s":round(dt/len(BATTERY),2),"rows":rows}

def solo_cheap(q):  return _ask(CHEAP,q),  "cheap"
def solo_strong(q): return _ask(STRONG,q), "strong"
def escalate(q):
    c=norm(_ask(CHEAP,q)); s=norm(_ask(STRONG,q))
    if c[:1]==s[:1] and c in ("yes","no"): return c,"agree_cheap"
    return s,"escalated_strong"   # disagree -> trust strong (never average correlated votes)

if __name__=="__main__":
    print("SOV33 SCORECARD — correctness-graded, live Oracle brains\n")
    results=[run_setup("solo-cheap",solo_cheap),
             run_setup("solo-strong",solo_strong),
             run_setup("escalate",escalate)]
    print(f"  {'setup':12} {'acc':>6} {'correct':>8} {'lat/q':>7}  brains-used")
    for r in results:
        who=[w for _,w,_,_ in r["rows"]]
        from collections import Counter
        mix=",".join(f"{k}:{v}" for k,v in Counter(who).items())
        print(f"  {r['setup']:12} {r['acc']:6.2f} {r['correct']:>3}/{r['n']:<3} {r['latency_per_s']:>6}s  {mix}")
    print()
    best=max(results,key=lambda r:(r["acc"],-r["latency_per_s"]))
    print(f"  BEST on correctness: {best['setup']} ({best['acc']:.2f})")
    # show the items escalate DIFFERED from solo-cheap (where escalation mattered)
    sc={q:norm(a) for (q,gt),(ok,w,a,g) in zip(BATTERY,results[0]['rows'])}
    print("\n  where escalate caught a cheap-model error:")
    for (q,gt),(ok,w,a,g) in zip(BATTERY,results[2]['rows']):
        cheap_ans=results[0]['rows'][BATTERY.index((q,gt))]
        if w=="escalated_strong" and not cheap_ans[0] and ok:
            print(f"    FIXED: {q[:55]}... cheap={cheap_ans[2]}(wrong) -> strong={a}(right)")
    json.dump([{k:v for k,v in r.items() if k!='rows'} for r in results],
              open("scorecard_results.json","w"), indent=2)
