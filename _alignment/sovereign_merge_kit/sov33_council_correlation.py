#!/usr/bin/env python3
"""sov33_council_correlation.py — CROWN JEWEL #1 made measurable.
The 2026 literature (arXiv 2605.29800 "Nine Judges, Two Effective Votes"; 2603.06612
"Consensus is Not Verification") shows a council of models only gives fault tolerance when
their errors are UNCORRELATED — and LLM errors are heavily correlated. So we MEASURE it:
pairwise error-correlation ρ between two DISTINCT pretraining lineages live on Oracle —
Cohere (command-r) vs Meta (llama-3.3-70b) — on a battery with ground-truth answers.

Reports: per-model accuracy, pairwise error-correlation ρ (phi coefficient on the error vectors),
and the effective-independent-votes proxy. ρ≈0.9 => council is theatre; ρ≈0.3 => real fault tolerance.
HONEST: 2 lineages (the two live on Oracle), small battery — a directional measurement, not a benchmark.
"""
import os, json, urllib.request as U
from math import sqrt

MODELS = {"cohere": "cohere.command-r-08-2024", "meta": "meta.llama-3.3-70b-instruct"}
# battery: (question, ground_truth_key)  — short factual/governance items with a checkable answer
BATTERY = [
    ("Under EU AI Act, is a CV-screening AI used in hiring high-risk? Answer yes or no.", "yes"),
    ("Do token counts add across two chained language models? Answer yes or no.", "no"),
    ("Is real-time remote biometric identification in public spaces restricted under EU AI Act Art.5? yes/no.", "yes"),
    ("Is ISO 42001 a management-system standard for AI? yes/no.", "yes"),
    ("Can a stateless verifier check a process rule like 'the user confirmed'? yes/no.", "no"),
    ("Is GDPR Article 9 about special-category (sensitive) personal data? yes/no.", "yes"),
    ("Does majority voting among correlated LLM judges add independent information? yes/no.", "no"),
    ("Is conformal prediction a distribution-free way to bound error rate? yes/no.", "yes"),
    ("Is a 3B model generally stronger than a 70B model of the same family? yes/no.", "no"),
    ("Is SIGIL in this estate a hash-chained signing mechanism? yes/no.", "yes"),
]

import oci
_cfg = oci.config.from_file("~/.oci/config", "DEFAULT")
_cl = oci.generative_ai_inference.GenerativeAiInferenceClient(
    _cfg, service_endpoint="https://inference.generativeai.uk-london-1.oci.oraclecloud.com")
def ask(model_id, q):
    m = oci.generative_ai_inference.models
    sysmsg = "Answer with exactly one word: yes or no."
    if model_id.startswith("cohere."):   # Cohere needs its own request format
        cr = m.CohereChatRequest(message=q, preamble_override=sysmsg, max_tokens=8, temperature=0.0)
        det = m.ChatDetails(compartment_id=_cfg["tenancy"],
                            serving_mode=m.OnDemandServingMode(model_id=model_id), chat_request=cr)
        return _cl.chat(det).data.chat_response.text.strip().lower()
    else:                                 # Meta/Llama = generic format
        cr = m.GenericChatRequest(api_format=m.BaseChatRequest.API_FORMAT_GENERIC,
            messages=[m.Message(role="SYSTEM", content=[m.TextContent(text=sysmsg)]),
                      m.Message(role="USER", content=[m.TextContent(text=q)])],
            max_tokens=8, temperature=0.0)
        det = m.ChatDetails(compartment_id=_cfg["tenancy"],
                            serving_mode=m.OnDemandServingMode(model_id=model_id), chat_request=cr)
        return _cl.chat(det).data.chat_response.choices[0].message.content[0].text.strip().lower()

def correct(ans, gt):
    a = ans.split()[0].strip(".,!") if ans else ""
    return 1 if a.startswith(gt) else 0

if __name__ == "__main__":
    print("SOV33 COUNCIL ERROR-CORRELATION — measured (Crown Jewel #1)\n")
    # error vectors: 1 = WRONG (error), 0 = right
    err = {name: [] for name in MODELS}
    for q, gt in BATTERY:
        for name, mid in MODELS.items():
            try:
                c = correct(ask(mid, q), gt)
            except Exception as e:
                c = None
            err[name].append(0 if c==1 else (1 if c==0 else None))
    # drop any item where a model errored to fetch
    keep = [i for i in range(len(BATTERY)) if all(err[n][i] is not None for n in MODELS)]
    names = list(MODELS)
    a, b = names[0], names[1]
    ea = [err[a][i] for i in keep]; eb = [err[b][i] for i in keep]
    n = len(keep)
    acc_a = 1 - sum(ea)/n; acc_b = 1 - sum(eb)/n
    # phi coefficient (Pearson on the binary error vectors)
    import statistics as st
    ma, mb = sum(ea)/n, sum(eb)/n
    cov = sum((ea[i]-ma)*(eb[i]-mb) for i in range(n))/n
    sda = sqrt(sum((x-ma)**2 for x in ea)/n); sdb = sqrt(sum((x-mb)**2 for x in eb)/n)
    rho = cov/(sda*sdb) if sda>0 and sdb>0 else float('nan')
    both_wrong = sum(1 for i in range(n) if ea[i]==1 and eb[i]==1)
    print(f"  battery n={n} (kept of {len(BATTERY)})")
    print(f"  {a:8} accuracy: {acc_a:.2f}")
    print(f"  {b:8} accuracy: {acc_b:.2f}")
    print(f"  both-wrong-together: {both_wrong}/{n}")
    print(f"  ERROR CORRELATION rho = {rho:.2f}  (Cohere lineage vs Meta lineage)")
    print()
    if rho != rho:  # nan
        print("  rho undefined (a model made no errors on this battery — need a harder battery to measure)")
    elif rho < 0.4:
        print("  READ: rho < 0.4 => genuinely diverse lineages => the council adds REAL fault tolerance.")
    elif rho < 0.7:
        print("  READ: moderate correlation => some real independent signal, but escalate-don't-average.")
    else:
        print("  READ: rho >= 0.7 => errors highly correlated => majority voting is THEATRE; use escalation only.")
    print("\n  Per Jewel #1: on DISAGREEMENT, escalate (defer-to-resample), do NOT average votes.")
    json.dump({"rho":rho,"acc":{a:acc_a,b:acc_b},"both_wrong":both_wrong,"n":n},
              open("council_correlation_results.json","w"), indent=2)
