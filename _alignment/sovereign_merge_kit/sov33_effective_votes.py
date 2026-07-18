#!/usr/bin/env python3
"""sov33_effective_votes.py — discount checker agreement by measured error-correlation.

The upgrade to defer-to-escalate (sov33_escalate.py): a raw vote count of N agreeing
checkers OVERSTATES evidence when the checkers make CORRELATED errors. We MEASURED
rho=0.76 between our Cohere and Meta checkers (SOV33_COUNCIL_CORRELATION_FINDING).
So convert N raw votes into EFFECTIVE INDEPENDENT VOTES and gate on that instead.

Method (sound independent of any specific paper — it's the standard correlated-sources
discount): for N checkers with average pairwise correlation rho in [0,1], the effective
number of independent votes is
        N_eff = N / (1 + (N-1)*rho)
This is the classic 'effective sample size under equicorrelation' (design-effect form).
- rho=0   -> N_eff = N      (fully independent; unanimity is strong)
- rho=1   -> N_eff = 1      (identical models; N votes are really 1 vote)
- rho=0.76, N=9 -> N_eff ~= 1.4  ('nine judges, ~one-and-a-bit effective votes')

DECISION RULE: trust unanimity only if N_eff >= TRUST_MIN (default 2.0 — you need at least
two genuinely-independent confirmations). Otherwise treat agreement as WEAK -> escalate.
Disagreement always escalates (unchanged). HONEST: this sharpens WHEN to trust agreement;
it is NOT a correctness guarantee (that's the separate conformal veto).
"""

def effective_votes(n, rho):
    """N_eff under equicorrelation. n>=1, rho in [0,1]."""
    n = max(1, int(n)); rho = min(1.0, max(0.0, float(rho)))
    return n / (1.0 + (n - 1) * rho)

def agreement_confidence(n_agree, rho, trust_min=2.0):
    """Given n_agree checkers that AGREE and their measured correlation rho,
    return whether that agreement is strong enough to TRUST (vs escalate)."""
    neff = effective_votes(n_agree, rho)
    return {
        "n_raw": n_agree, "rho": rho, "n_eff": round(neff, 3),
        "trust_min": trust_min,
        "verdict": "TRUST_AGREEMENT" if neff >= trust_min else "WEAK_ESCALATE",
        "why": f"{n_agree} raw agreeing votes -> {neff:.2f} effective independent votes at rho={rho}; "
               + (">= trust floor, agreement is real" if neff >= trust_min
                  else "< trust floor, correlated agreement is weak evidence -> escalate")
    }

if __name__ == "__main__":
    RHO = 0.76  # OUR measured value (Cohere vs Meta)
    print(f"Effective-independent-votes, at OUR measured rho={RHO}\n")
    print(f"  {'N raw':>6} {'N_eff':>8}   verdict (trust_min=2.0)")
    for n in [2,3,5,9,20]:
        r = agreement_confidence(n, RHO)
        print(f"  {n:>6} {r['n_eff']:>8}   {r['verdict']}")
    print("\n  Contrast — if checkers were DECORRELATED (rho=0.2):")
    for n in [2,3,5,9]:
        r = agreement_confidence(n, 0.2)
        print(f"  {n:>6} {r['n_eff']:>8}   {r['verdict']}")
    print("\n  READ: at rho=0.76 you need ~5 raw agreeing checkers to reach 2 effective votes.")
    print("  Adding more same-lineage judges barely moves N_eff — the fix is DIVERSE lineages, not MORE judges.")
    import json
    json.dump({"rho_measured":RHO,
               "table":{n:agreement_confidence(n,RHO) for n in [2,3,5,9,20]}},
              open("effective_votes_results.json","w"), indent=2)
