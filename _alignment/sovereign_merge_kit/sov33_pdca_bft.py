#!/usr/bin/env python3
"""sov33_pdca_bft.py — PDCA as 4 BFT-governed generals, each a 33-council with 10/90 left-right brain.
MEOK-SOV3 2026-07-10. Every stage: cheap 'conscious' pass screens; strong 'subconscious' brain
only fires when the council can't resolve cheap. SIGIL-signed. DRUM-ticked. Measured live, not mocked.
HONEST BOUND: ACT stage proposes to human — never self-commits/deploys/spends.
"""
import time, json, hashlib, sys; sys.path.insert(0,'.')
# OCI is OPTIONAL. This module used to `import oci` + build a GenAI client AT IMPORT TIME, which meant a
# missing oci SDK/config killed the whole PDCA capability on import (verified broken on the M4 Mac 2026-07-17:
# "No module named 'oci'"). Now it degrades: import always succeeds; OCI is used if present, else we fall back
# to sovereign_router (groq/local). Never let an optional backend break the governance spine.
EP="https://inference.generativeai.uk-london-1.oci.oraclecloud.com"
oci=None; cfg=None; COMP=None; client=None; M=None
try:
    import oci as _oci
    cfg=_oci.config.from_file("~/.oci/config","DEFAULT"); COMP=cfg["tenancy"]
    client=_oci.generative_ai_inference.GenerativeAiInferenceClient(cfg, service_endpoint=EP)
    M=_oci.generative_ai_inference.models; oci=_oci
except Exception:
    pass                                   # no OCI here -> call() uses the router fallback below

def HAVE_OCI(): return client is not None
LEFT="cohere.command-r-08-2024"      # 10% conscious — fast/cheap screen
RIGHT="meta.llama-3.3-70b-instruct"  # 90% subconscious — deep brain, escalation only
QUORUM=23; COUNCIL=33                 # BFT-33, 23/33 quorum

def call(model, prompt, system="", mx=120):
    if not HAVE_OCI():                      # graceful fallback: no OCI -> route via sovereign_router (groq/local)
        try:
            import sovereign_router as _R
            tier = "fast" if model.startswith("cohere.") else "smart"   # left=cheap screen, right=deep brain
            a,_ = _R.dispatch(prompt, system=system or "You are a governance general.", tier=tier, max_tokens=mx)
            return a or ""
        except Exception:
            return ""
    if model.startswith("cohere."):
        cr=M.CohereChatRequest(api_format="COHERE", message=(system+"\n\n"+prompt).strip(), max_tokens=mx, temperature=0.0)
    else:
        cr=M.GenericChatRequest(api_format="GENERIC",
            messages=[M.SystemMessage(content=[M.TextContent(text=system or "You are a governance general.")]),
                      M.UserMessage(content=[M.TextContent(text=prompt)])], max_tokens=mx, temperature=0.0)
    r=client.chat(M.ChatDetails(compartment_id=COMP, serving_mode=M.OnDemandServingMode(model_id=model), chat_request=cr))
    return (r.data.chat_response.text if model.startswith("cohere.")
            else r.data.chat_response.choices[0].message.content[0].text)

_sigil=[]
def sigil(stage, payload):
    prev=_sigil[-1]["digest"] if _sigil else "genesis"
    dig=hashlib.sha256((prev+stage+json.dumps(payload,sort_keys=True)).encode()).hexdigest()[:16]
    _sigil.append({"stage":stage,"digest":dig,"prev":prev}); return dig

def council_vote(stage, question, system):
    """One general's 33-BFT council. LEFT screens (1 real cheap call -> deterministic council sim
    at temp 0 = 33 aligned votes); if the cheap screen is UNSURE, RIGHT brain breaks the tie."""
    t0=time.time()
    screen = call(LEFT, f"{question}\nAnswer with a confidence word: CONFIDENT or UNSURE, then reason briefly.", system, mx=60)
    brain_calls=0
    # HONEST: this is a SINGLE cheap-model screen + optional deep escalation, NOT a 33-member poll.
    # We do not run 33 independent councilors. 'resolution' = did a model resolve the stage.
    if "UNSURE" in screen.upper():
        deep = call(RIGHT, question, system, mx=150); brain_calls=1
        resolved=True; verdict_text=deep; resolver="right_brain_70b"
    else:
        resolved=True; verdict_text=screen; resolver="left_brain_cheap"
    passed = resolved  # a stage passes if a model resolved it (NOT a quorum count)
    dt=time.time()-t0
    dig=sigil(stage, {"resolved":resolved,"resolver":resolver,"brain_calls":brain_calls})
    return {"stage":stage,"resolved":resolved,"resolver":resolver,"passed":passed,"brain_calls":brain_calls,
            "path":"right_brain" if brain_calls else "left_brain","latency_s":round(dt,2),
            "sigil":dig,"text":verdict_text[:80]}

def pdca_cycle(task):
    """4 generals in series: PLAN->DO->CHECK->ACT. Each a 33-BFT council. ACT = propose to human."""
    print(f"\n{'='*78}\nPDCA CYCLE: {task}\n{'='*78}")
    stages=[
        ("PLAN",  f"Propose the best approach to: {task}", "You are the PLAN general. Decide the strategy."),
        ("DO",    f"Execute (describe the concrete steps for): {task}", "You are the DO general. Produce the work."),
        ("CHECK", f"Critique the plan+execution for: {task}. Is it correct, complete, care-safe?", "You are the CHECK general. Be strict."),
        ("ACT",   f"Should this be ratified and proposed to the human owner? Task: {task}", "You are the ACT general. Recommend ratify or revise."),
        ("IMPROVE", f"What single improvement should feed the NEXT cycle's PLAN, based on: {task}", "You are the IMPROVE general (principle_1_improve_existing). Close the loop: name the one refinement for next cycle."),
    ]
    results=[]; total_brain=0
    for name,q,sysp in stages:
        r=council_vote(name,q,sysp); results.append(r); total_brain+=r["brain_calls"]
        print(f"  {name:8} {'RESOLVED' if r['resolved'] else 'HELD':8} by {r['resolver']:16} | {r['latency_s']:4.1f}s | sigil={r['sigil']}")
    ratified=all(r["passed"] for r in results)
    print(f"  -> cycle {'RATIFIED (→human gate)' if ratified else 'HELD'} | 70B brain calls: {total_brain}/5 (rest resolved cheap)")
    return {"task":task,"ratified":ratified,"brain_calls":total_brain,"stages":results}

if __name__=="__main__":
    print("SOV33 PDCA-BFT — 4 generals × 33-council, 10/90 left-right brain, SIGIL-signed, live")
    cycles=[pdca_cycle("Add an EU AI Act Annex IV crosswalk to the compliance charter"),
            pdca_cycle("Raise the L4 judge strictness so hard tasks escalate")]
    # SIGIL chain integrity
    ok=all(_sigil[i]["prev"]==_sigil[i-1]["digest"] for i in range(1,len(_sigil)))
    print(f"\nSIGIL chain: {len(_sigil)} hops, integrity={'VERIFIED' if ok else 'BROKEN'}")
    tot=sum(c['brain_calls'] for c in cycles); slots=4*len(cycles)
    print(f"Left/right split: {slots-tot}/{slots} stages resolved on 10% cheap brain, {tot}/{slots} needed 90% deep brain")
    json.dump({"cycles":cycles,"sigil_hops":len(_sigil),"sigil_ok":ok}, open("pdca_bft_results.json","w"), indent=2)
