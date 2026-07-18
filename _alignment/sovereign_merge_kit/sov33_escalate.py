#!/usr/bin/env python3
"""sov33_escalate.py — Crown Jewel #1 step 2: DEFER-TO-ESCALATE, not majority-vote.
Grounded in OUR measured council correlation (rho=0.76, Cohere vs Meta — see
SOV33_COUNCIL_CORRELATION_FINDING). Because errors are correlated, majority-voting
correlated checkers adds ~no independent info (Kim et al. 2506.07962, ICML 2025;
Apple 2605.29800). So: run cheap checker + strong checker; if they AGREE, trust it;
if they DISAGREE, do NOT average — ESCALATE (defer to the strong brain / resample /
abstain). Agreement of correlated models is the WEAK evidence; disagreement is the signal.

HONEST: this improves DECISION QUALITY UNDER DISAGREEMENT and cost (cheap-first), NOT a
correctness guarantee. The correctness guarantee is the separate conformal work (Jewel #2).
"""
import os, oci
_cfg = oci.config.from_file("~/.oci/config", "DEFAULT")
_cl = oci.generative_ai_inference.GenerativeAiInferenceClient(
    _cfg, service_endpoint="https://inference.generativeai.uk-london-1.oci.oraclecloud.com")
CHEAP = "cohere.command-r-08-2024"     # Cohere lineage
STRONG = "meta.llama-3.3-70b-instruct" # Meta lineage

def _ask(model_id, system, user, max_tokens=200):
    m = oci.generative_ai_inference.models
    if model_id.startswith("cohere."):
        cr = m.CohereChatRequest(message=user, preamble_override=system, max_tokens=max_tokens, temperature=0.0)
        det = m.ChatDetails(compartment_id=_cfg["tenancy"],
                            serving_mode=m.OnDemandServingMode(model_id=model_id), chat_request=cr)
        return _cl.chat(det).data.chat_response.text.strip()
    cr = m.GenericChatRequest(api_format=m.BaseChatRequest.API_FORMAT_GENERIC,
        messages=[m.Message(role="SYSTEM", content=[m.TextContent(text=system)]),
                  m.Message(role="USER", content=[m.TextContent(text=user)])],
        max_tokens=max_tokens, temperature=0.0)
    det = m.ChatDetails(compartment_id=_cfg["tenancy"],
                        serving_mode=m.OnDemandServingMode(model_id=model_id), chat_request=cr)
    return _cl.chat(det).data.chat_response.choices[0].message.content[0].text.strip()

def _verdict(model_id, question):
    """one-word yes/no verdict for agreement check (cheap signal)"""
    a = _ask(model_id, "Answer with exactly one word: yes or no.", question, max_tokens=8).lower()
    return a.split()[0].strip(".,!") if a else ""

def decide(question, full_answer_system="You are a careful governance assistant. Answer concisely and cite the rule."):
    """defer-to-escalate. Returns dict with path + answer + why."""
    vc = _verdict(CHEAP, question)
    vs = _verdict(STRONG, question)
    agree = (vc[:1] == vs[:1]) and vc in ("yes","no")
    if agree:
        # checkers agree — cheap-first: use cheap model's full answer, note it's the low-cost path
        ans = _ask(CHEAP, full_answer_system, question)
        return {"path":"agree_trust_cheap","cheap":vc,"strong":vs,"escalated":False,
                "brain":"cohere.command-r","answer":ans,
                "why":"both lineages agreed on the verdict; cheap path (still weak evidence under rho=0.76, but no divergence signal to act on)"}
    # DISAGREE -> escalate to the strong brain (do NOT average)
    ans = _ask(STRONG, full_answer_system, question)
    return {"path":"disagree_escalate_strong","cheap":vc,"strong":vs,"escalated":True,
            "brain":"meta.llama-3.3-70b","answer":ans,
            "why":"checkers DISAGREED — informative divergence; escalated to strong brain instead of majority-averaging"}

if __name__ == "__main__":
    tests = [
        "Under EU AI Act, is a CV-screening AI used in hiring high-risk?",
        "Do token counts add across two chained language models?",
        "Is a 3B model generally stronger than a 70B model of the same family?",
    ]
    print("SOV33 DEFER-TO-ESCALATE — grounded in measured rho=0.76\n")
    for q in tests:
        d = decide(q)
        esc = "ESCALATED" if d["escalated"] else "agree/cheap"
        print(f"  [{esc:10}] cheap={d['cheap']:4} strong={d['strong']:4} brain={d['brain']}")
        print(f"     Q: {q}")
        print(f"     A: {d['answer'][:90]}")
        print()
    print("  RULE: agree -> trust (cheap); disagree -> ESCALATE to strong, never average correlated votes.")
