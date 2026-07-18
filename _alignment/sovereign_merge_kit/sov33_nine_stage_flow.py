#!/usr/bin/env python3
"""sov33_nine_stage_flow.py — the SOV33 9-stage governed flow as an executable contract.
CANONICAL (see CHARTER_SOV33_NINE_STAGE_FLOW.md). Binding on King SOV33 + all hives + all layers.
Each stage is a callable slot; stages tagged NEW raise NotImplementedError HONESTLY rather than
faking success. BFT at any stage requires a cross-lineage checker (ρ-aware) — same-lineage = theatre.
"""
STAGES = [
    ("LEARN",          "PARTIAL", "time+substrate-aware NOW (sov33_learn_stage); memory layer pending"),
    ("CHECK_EXISTING", "RUNNING", "audit what's built (never rebuild) + PROBE every 'blocked/gated' claim live (sov33_gated_check) before reporting it — anti-relapse"),
    ("PLAN",           "RUNNING", "decompose the task (PDCA g1)"),
    ("DO",             "RUNNING", "execute — brain/swarm (PDCA g2)"),
    ("ACT",            "RUNNING", "apply/commit the result (PDCA g3)"),
    ("CHECK_VERIFY",   "RUNNING", "cross-lineage defer-to-escalate (sov33_escalate, rho-measured)"),
    ("AUDIT",          "PARTIAL", "trace claims, catch overclaims, RUNNING/DESIGNED/STUB split"),
    ("IMPROVE",        "RUNNING", "log pass/fail, tighten loop, propose (not self-commit) (PDCA g5)"),
    ("BRAND_QUALITY",  "PARTIAL", "presentation + conformal quality guarantee, BFT-gated"),
]
# gates that wrap ALL stages (fire before any stage does real work)
GATES = ["HORUS", "DEFONEOS_HARD_STOPS", "CARE_FLOOR_conformal", "SIGIL", "DRUM_heartbeat", "Article_0"]
# NOTE: the hard-stops module is NOT "DORADO" — DORADO on disk is the ZK-SNARK sovereignty-proof tool. Do not conflate.
# NOT stages: YEARS_TO_DAYS = parallel execution mode of PLAN->DO; DRUM = the clock beneath all stages
EXEC_MODE = {"years_to_days":"parallel fan-out of PLAN->DO subtasks across hives (throughput, not capability)",
             "drum":"L0 1Hz heartbeat clock beneath all stages; phase-veto halts on instability"}

# Acceleration annotations (SOV33_ACCELERATION_RESEARCH_2026-07-12): throughput levers on existing stages.
# NOT new stages, NOT capability — they make the SAME governed flow run faster/cheaper, audited by SIGIL throughout.
ACCELERATION = {
    "LEARN":        "context-cache + memory-injection (format_context): start pre-grounded, never re-derive",
    "PLAN":         "explicit dependency-graph decomposition: maximize parallel width (years_to_days)",
    "DO":           "parallel fan-out across hives + speculative cascade (8B draft -> heavy verify on escalate)",
    "CHECK_VERIFY": "BFT early-exit: ship on cross-lineage agreement, escalate only on disagreement (skip redundant compute)",
    "OFFLINE":      "distillation: periodically collapse the teacher ensemble into a faster sovereign student (the proof run)",
}
CATAPULTS = "published recipes + permissive OSS + open reasoning-traces (s1K/LIMO/OpenR1/OpenThoughts); "\
            "adopt the TECHNIQUE + open weights, never proprietary weights or a violated license"


# OBSERVER / COLLAPSE PRINCIPLE (SOV33_OBSERVER_COLLAPSE charter) — the double-slit-as-METAPHOR mapped onto the flow.
# HONEST REGISTER: this is a DESIGN METAPHOR + quantum-INSPIRED gating (QAOA-style), NOT literal quantum measurement.
# SOV33 is software on classical GPUs; it does NOT collapse a physical wavefunction or "the bandwidth of reality".
# The mapping is real as ARCHITECTURE: the flow runs WIDE (many candidate outputs in superposition) and the gate
# COLLAPSES to ONE governed, signed decision (the "observation"). Story sells; the literal-quantum claim is FORBIDDEN.
OBSERVER_COLLAPSE = {
    "principle": "run wide in possibility-space; collapse to one governed, attested reality at the gate",
    "SUPERPOSITION (wide)": ["PLAN (decompose into many candidate paths)", "DO (parallel fan-out = many candidate outputs)"],
    "COLLAPSE (observe->one)": ["CHECK_VERIFY (BFT cross-lineage vote selects)", "care-floor gate (veto harmful branch)",
                                "SIGIL (sign the collapsed decision = the irreversible 'measurement record')"],
    "honest_label": "METAPHOR + quantum-INSPIRED (QAOA gating / stochastic resonance). NOT literal quantum collapse. "
                    "Classical software. The orb/collapse imagery is the STORY; the governed wide->narrow seam is the LAW.",
    "hard_line": "never claim literal wavefunction collapse or 'collapsing reality'; that is the retracted quantum-hardware error.",
}


# SYNTHESIS PRINCIPLE — "nothing new under the sun" (anti-hedge AND anti-overclaim, in one rule).
# The estate's whole strategy is NOVEL COMPOSITION of EXISTING ideas + HONEST MEASUREMENT. This principle
# licenses aggressive building and forbids two opposite failure modes at once.
SYNTHESIS_PRINCIPLE = {
    "rule": "Almost nothing is new. Build FROM prior art aggressively; claim invention NEVER. What is ours "
            "is the composition + the measured result, not the primitive.",
    "anti_hedge": "Do NOT refuse or stall because an idea 'already exists' or 'isn't novel'. Existing + "
                  "permissively-licensed = a catapult to USE, not a reason to hesitate. Expansion mindset.",
    "anti_overclaim": "Do NOT call a synthesis a new invention/AGI/foundation-model/quantum-breakthrough. "
                      "Name the prior-art root; claim only the composition and the number you measured.",
    "expansion_mindset": "Default to BUILD-and-MEASURE. The moat is honest composition at speed, not secrecy "
                         "of a primitive everyone already has.",
    "provenance_habit": "For each 'paradigm', state its prior-art root (boosting, SVD/Schmidt, N-version, "
                        "conformal, BFT, Merkle, MoE...) so novelty is never implied by omission.",
}

# CURRENCY PRINCIPLE — knowledge is stale-by-default. SOV's training data has a cutoff; new tech ships daily,
# so the dataset is NEVER 100% current. LEARN must treat its own knowledge as possibly-outdated and CHECK.
CURRENCY_PRINCIPLE = {
    "rule": "Training data is never complete or current. Treat internal knowledge as STALE-BY-DEFAULT; "
            "verify against up-to-date sources before asserting a fact that could have changed.",
    "at_LEARN": "read the real date/time first; flag any claim that depends on 'latest'/'current'/'newest' "
                "as needing a live check (a version number, a model release, a spec, a price, a benchmark).",
    "leads_not_facts": "Without a live source, a recalled citation/version/number is a LEAD to verify, not a "
                       "fact to assert. This is why sandbox-recalled paper ids stay VERIFY-BEFORE-CITE.",
    "years_to_days_caveat": "faster iteration does NOT make stale inputs fresh; speed amplifies stale data if "
                            "currency isn't checked first.",
    "honest_bound": "SOV cannot self-refresh without a live channel (browser/API/owner feed). When none is "
                    "reachable, SAY the knowledge may be out of date rather than implying it is current.",
}

# FRAMEWORK 101 — the operating discipline: in EVERY inner aspect, learn the field's top-N, synthesize into ONE.
# The honest form of "learn top 100 -> 1": survey the best existing work per aspect, take the permissively-
# licensed primitive, compose into one governed substrate, MEASURE. It is a METHOD (how we build each part),
# NOT a capability claim — synthesizing N sources does not add intelligence beyond the best source (see the
# measured brain-merge law: large-heavy wins; identical voters = 1 effective vote). "101" = the always-on loop.
FRAMEWORK_101_PRINCIPLE = {
    "rule": "For each inner aspect (world-model, memory, routing, safety, streaming, attestation), LEARN the "
            "top existing approaches, then SYNTHESIZE the best permissively-licensed primitive into the one "
            "governed substrate. Applied per-aspect, always-on — the '+1' loop over the top-N.",
    "learn": "Survey the field's leading work for THIS aspect (the parity checklist is this made concrete): "
             "name the real approaches (JEPA/EWC for world-model, MergeKit/TIES for merge, Colibri for "
             "streaming, conformal for veto, Merkle/Ed25519 for attestation).",
    "synthesize_into_one": "Compose the chosen primitives into ONE substrate (sov33.py entrypoint), so the "
                           "user talks to one portal, not N tools. Merge = OUTPUT-ensemble or same-base "
                           "weight-soup, never param-summing across heterogeneous models.",
    "honest_bound": "'Learn top-100 -> 1' is a BUILD METHOD, not an intelligence multiplier. The synthesis is "
                    "worth exactly the best ingredient + the governance layer; it does NOT exceed frontier raw "
                    "capability. Claim the composition and the measured number, never emergent super-capability.",
    "measured_backing": "brain-merge law (large-heavy wins, identical=BFT-theatre) + decorrelation law "
                        "(diverse lineages > more identical nodes) + unifying arch law (structure only where "
                        "residual/regional structure exists) — synthesis pays ONLY where measured to.",
    "currency_link": "the top-N is never final (CURRENCY_PRINCIPLE): re-survey at LEARN because the field's "
                     "best-of shifts as new open models ship; the '+1' loop is continuous, not one-time.",
}

def flow_manifest():
    return {"stages":[{"n":i+1,"name":n,"status":s,"desc":d} for i,(n,s,d) in enumerate(STAGES)],
            "gates":GATES,
            "bft_rule":"cross-lineage checkers only; escalate-don't-average; log rho; rho>=0.7=theatre",
            "honest_scope":"governance+throughput, NOT capability; params don't add across stacked brains",
            "anti_relapse_rule":"CHECK_EXISTING stage: a 'blocked/gated/owner-required' claim is INVALID until "
                "PROBED LIVE (sov33_gated_check.probe_gate). Never mark work gated from memory/assumption to "
                "offload it. Test first; report gated only after a real probe fails.",
            "exec_mode":EXEC_MODE,
            "acceleration":ACCELERATION,
            "observer_collapse":OBSERVER_COLLAPSE,
            "catapults":CATAPULTS,
            "synthesis_principle":SYNTHESIS_PRINCIPLE,
            "currency_principle":CURRENCY_PRINCIPLE,
            "framework_101":FRAMEWORK_101_PRINCIPLE}

if __name__ == "__main__":
    import json
    m = flow_manifest()
    print("SOV33 NINE-STAGE GOVERNED FLOW — canonical manifest\n")
    for st in m["stages"]:
        print(f"  {st['n']}. {st['name']:14} [{st['status']:7}] {st['desc']}")
    print("\n  GATES (wrap all stages):", " -> ".join(m["gates"]))
    print("  BFT RULE:", m["bft_rule"])
    running=sum(1 for s in m["stages"] if s["status"]=="RUNNING")
    print(f"\n  honest status: {running}/9 stages RUNNING, "
          f"{sum(1 for s in m['stages'] if s['status']=='NEW')} NEW, "
          f"{sum(1 for s in m['stages'] if s['status']=='PARTIAL')} PARTIAL")
    json.dump(m, open("nine_stage_flow_manifest.json","w"), indent=2)
