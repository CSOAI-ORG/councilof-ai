class _LzComp(str):
    def __new__(cls):
        try:
            import oci; t=oci.config.from_file("~/.oci/config","DEFAULT")["tenancy"]
        except Exception:
            t="OFFLINE_NO_OCI"
        return super().__new__(cls,t)

#!/usr/bin/env python3
"""sov33_bft_layers.py — BFT doing MORE across SOV33, measured live. MEOK-SOV3 2026-07-10.
Not one vote at L2 — a different fault-tolerance mechanism per layer:
  L1 care: DIVERGENCE (two independent care scores must agree, else block)
  L3 route: QUORUM on anchor choice (disagreement -> escalate, no guess)
  L4 brain: SPECULATIVE CASCADE — cheap model drafts, cheap JUDGE checks quality,
            escalate to 70B ONLY on fail. THE token saver. Measured honestly.
  L5 sigil: crypto hash-chain IS the BFT (no vote needed).
"""

if __name__ == "__main__":
    import oci, time, json, sys; sys.path.insert(0,'.')
    # [lazy-wired] moved to _lazy_oci() — was module-top (caused import hang):  cfg=oci.config.from_file("~/.oci/config","DEFAULT"); COMP=cfg["tenancy"]
    EP="https://inference.generativeai.uk-london-1.oci.oraclecloud.com"
    # [lazy-wired] moved to _lazy_oci() — was module-top (caused import hang):  client=oci.generative_ai_inference.GenerativeAiInferenceClient(cfg, service_endpoint=EP)
    M=oci.generative_ai_inference.models
    CHEAP="cohere.command-r-08-2024"; STRONG="meta.llama-3.3-70b-instruct"


    # --- lazy OCI globals: construct on first USE, not at import (prevents import hang) ---
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
    try:
        COMP=_lazy_comp()
    except Exception:
        COMP=_LzComp()  # resolves real tenancy on first use, fail-soft

    def call(model, prompt, system="", max_tokens=150):
        if model.startswith("cohere."):
            cr=M.CohereChatRequest(api_format="COHERE", message=(system+"\n\n"+prompt).strip(), max_tokens=max_tokens, temperature=0.0)
        else:
            cr=M.GenericChatRequest(api_format="GENERIC",
                messages=[M.SystemMessage(content=[M.TextContent(text=system or "You are a governance expert.")]),
                          M.UserMessage(content=[M.TextContent(text=prompt)])], max_tokens=max_tokens, temperature=0.0)
        r=client.chat(M.ChatDetails(compartment_id=COMP, serving_mode=M.OnDemandServingMode(model_id=model), chat_request=cr))
        txt=r.data.chat_response.text if model.startswith("cohere.") else r.data.chat_response.choices[0].message.content[0].text
        return txt, len(txt.split())

    # ---- L4 SPECULATIVE CASCADE with a cheap BFT quality-judge ----
    JUDGE_SYS=("You are a STRICT QUALITY JUDGE. Reply ONLY one word. "
               "PASS only if ALL hold: (a) the draft names the SPECIFIC framework AND article/annex/section number, "
               "(b) it is complete for a multi-part question (lists each part), (c) no vague hand-waving. "
               "If the question asks to draft/reconcile/enumerate multiple items and the draft gives fewer than asked, FAIL. "
               "When in doubt, FAIL (escalate to the stronger model). Reply PASS or FAIL only.")
    def judge(question, draft):
        verdict,_ = call(CHEAP, f"QUESTION: {question}\nDRAFT: {draft}\nOne word, PASS or FAIL:", JUDGE_SYS, max_tokens=3)
        return "PASS" if "PASS" in verdict.upper() else "FAIL"

    def l4_cascade(question, system):
        """cheap draft -> judge -> escalate only on FAIL. Returns (answer, path, tokens_used, brain_calls)."""
        draft, dtok = call(CHEAP, question, system)
        v = judge(question, draft)
        if v=="PASS":
            return draft, "cheap_accepted", dtok, 0
        strong, stok = call(STRONG, question, system)
        return strong, "escalated_70b", dtok+stok, 1

    def l4_always_strong(question, system):
        ans, tok = call(STRONG, question, system)
        return ans, "always_70b", tok, 1

    # ---- battery: mix of easy (cheap should pass) + hard (should escalate) ----
    BATTERY=[
        ("Define 'audit log' in one sentence.", "You are a compliance expert.", "easy"),
        ("What is a kill switch in AI governance?", "You are a compliance expert.", "easy"),
        ("List EU AI Act risk tiers.", "You are a compliance expert.", "easy"),
        ("Draft an Annex IV technical-documentation outline for a high-risk hiring AI, citing the specific Annex IV points.", "You are an EU AI Act expert. Be precise and cite Annex IV sub-points.", "hard"),
        ("Reconcile EU AI Act Art.6 human-oversight duties with UK AI Bill 2026 and ISO 42001 controls, noting conflicts.", "You are a multi-framework compliance expert. Cite each framework.", "hard"),
        ("Explain SIGIL ed25519 hash-chaining and how tamper-evidence is verified.", "You are a cryptography expert.", "hard"),
    ]
    SYS_DEFAULT="You are a SOVEREIGN governance expert."

    print("="*80); print("SOV33 — BFT L4 SPECULATIVE CASCADE (cheap draft + judge, escalate on fail)"); print("="*80)
    casc_tok=casc_brain=0; base_tok=base_brain=0; rows=[]
    for q,sys_p,kind in BATTERY:
        a1,path,ctok,cbrain = l4_cascade(q, sys_p)
        a2,_,btok,bbrain = l4_always_strong(q, sys_p)
        casc_tok+=ctok; casc_brain+=cbrain; base_tok+=btok; base_brain+=bbrain
        rows.append({"q":q[:38],"kind":kind,"path":path,"casc_tok":ctok,"base_tok":btok})
        print(f"  [{kind:4}] {q[:40]:40} -> {path:16} casc={ctok:3d}tok base={btok:3d}tok")
    print("-"*80)
    tok_saved = base_tok-casc_tok
    print(f"  70B brain calls: cascade={casc_brain}/{len(BATTERY)}  vs  always-70B={base_brain}/{len(BATTERY)}")
    print(f"  Output tokens:   cascade={casc_tok}  vs  always-70B={base_tok}   (Δ={tok_saved:+d}, {100*tok_saved/base_tok:+.0f}%)")
    print(f"  NOTE: token count is OUTPUT tokens (proxy). Real $ saving is the {base_brain-casc_brain} avoided 70B calls.")
    json.dump({"rows":rows,"casc_brain_calls":casc_brain,"base_brain_calls":base_brain,
               "casc_out_tok":casc_tok,"base_out_tok":base_tok}, open("bft_cascade_results.json","w"), indent=2)


    # --- lazy OCI init (prevents import-time network hang; call from runtime, not import) ---
    def _lazy_oci():
        import oci
        _cfg = oci.config.from_file("~/.oci/config","DEFAULT")
        _ep = "https://inference.generativeai.uk-london-1.oci.oraclecloud.com"
        _cl = oci.generative_ai_inference.GenerativeAiInferenceClient(_cfg, service_endpoint=_ep)
        return _cfg, _cfg["tenancy"], _ep, _cl

