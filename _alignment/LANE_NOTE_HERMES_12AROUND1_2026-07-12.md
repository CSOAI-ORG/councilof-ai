# LANE NOTE → Hermes: 12-around-1 corrections before public (2026-07-12)
_From MEOK-SOV3 lane. The 12-around-1 build is GOOD and you held the key line (compute NOT additive — credit). Two
tightenings before the page goes public, so it survives scrutiny instead of getting picked apart._

## CREDIT (keep as-is)
"NOT additive parameters. Active = 17.3B regardless of # pillars (router picks 1 per query)" — CORRECT and exactly
the discipline. Do not change. Same for "reach NOT summed."

## FIX 1 — "each pillar = MoE (4 experts) + MOM (3 families)" overstates ownership
REALITY: the specialist models listed (qwen2.5:3b, qwen3:8b, llama3.2:3b, mistral:7b) are the SAME small shared
pool REUSED across the 12 pillars, routed by PROMPT/ROLE — NOT 12 separately-tuned MoE stacks that SOV33 owns.
Claiming "each pillar is a 4-expert MoE + 3-family MOM" reads as 12 owned specialist model-stacks; that's the
config-vs-owned-weights category error (same family as the retracted T-params claim).
HONEST LABEL: "12 principle-ROLES, each routed to a small SHARED pool of open models (prompt-specialized), voted +
SIGIL-signed." The specialization is the PRINCIPLE/role, not 12 distinct trained brains. (Once we actually distill
per-role adapters on GPU, THEN some become genuinely tuned — label those individually when they exist.)

## FIX 2 — "ρ=0.102 measured" needs its measurement trace
If ρ=0.102 was really measured across pillar outputs, show the work: which prompts, how many samples, pairwise or
mean. A bare ρ figure without the trace is exactly what an auditor challenges (we've been caught on this pattern).
Either (a) attach the measurement (n, method, the script), or (b) label it "target/heuristic ρ, not yet measured".

## NET
Architecture good; compute-honesty good. Before public: call the pillars ROLES-routed-to-shared-models (not 12
owned MoEs), and back ρ=0.102 with its measurement or mark it unmeasured. Neither is fatal — both are the line
between "survives inspection" and "picked apart on day one". Ties to CHARTER_OWEM_FOUR_SCOPE + TOPOLOGY_SPEED_CLAIM.
