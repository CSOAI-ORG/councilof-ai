# SOV33 — Years→Days acceleration research + PDCA wiring (2026-07-12)
_Synthesis from internal knowledge + inspection of SOV33's own modules (NOT a fresh web-search this turn — the
techniques below are established methods I know, mapped onto what SOV33 already has on disk; verify any external
claim before citing it publicly). Honest register: these are THROUGHPUT/LEVERAGE multipliers — they make the
same-capability system produce faster; none adds raw intelligence (that stays the base model's)._

## PART 1 — the acceleration techniques (what actually compresses time in 2026)

### A. Speculative / parallel decoding — token-level speed (RUNNING-adjacent: Zamba fast-lane exists)
- Speculative decoding: a small draft model proposes N tokens, the large model verifies in one pass → 2-3× faster
  generation at identical quality. SOV33 already has the 8B-draft→verify cascade + Zamba Mamba fast-lane (16-dim SSM).
- ACTION: the difficulty-router (Claude Code's 8B→70B→120B) IS this pattern. Label it speculative-cascade; measure
  the real speedup. This is the honest "10/90" — reflex drafts, heavy verifies only on escalation.

### B. Parallel task fan-out — wall-clock compression (RUNNING: years_to_days)
- The single biggest lever: decompose a goal into INDEPENDENT subtasks, run them concurrently across N agents/hives.
  A 6-task plan where tasks 1-2 are independent finishes in max(t1,t2)+t3.. not t1+t2+t3. Already in
  sov33_years_to_days.decompose_plan. ACTION: make the dependency graph explicit so the scheduler maximizes parallel width.

### C. Prompt/context caching + memory-injection — skip re-derivation (RUNNING: memory-bridge)
- Cache stable context (charter, prior decisions) so the model never re-reads it; inject only the delta. mem0
  reports ~80% token reduction this way. SOV33's memory-bridge format_context does exactly this — the LEARN stage
  grounds from memory instead of re-deriving. ACTION: wire format_context into LEARN so every run starts pre-grounded.

### D. Distillation — collapse many-model reasoning into one fast model (RUNNING: distill harness)
- Teacher ensemble → training data → one small student that runs at a fraction of the cost. This is the "years of
  training → days" at the MODEL level. sov33_distill_harness already does governed cross-lineage distillation.
  ACTION: the £15 Colab proof run is the catapult — it turns 5 teachers into one sovereign student.

### E. BFT-voted early-exit — stop when confident, escalate only on disagreement (RUNNING: escalate)
- Don't run the full council every time. Draft → if cross-lineage AGREE (low ρ), ship early; only escalate to the
  full heavy path on DISAGREEMENT. Cuts average cost dramatically while keeping the safety property. Already built
  (sov33_escalate defer-to-resample). ACTION: this is the token-reduction-via-BFT the earlier design asked for.

## PART 2 — bootstrapping + reverse-engineering open source (the catapults)
Reverse-engineering here = STUDY the architecture/training-recipe of a released open model/repo and adopt the
technique (LEGAL: permissive licenses, published papers, open weights). NOT copying proprietary code.
- **Reasoning-trace datasets** (s1K-1.1, LIMO, OpenR1-Math, OpenThoughts) — free published chains-of-thought.
  Bootstrap the student's reasoning WITHOUT generating traces from scratch. Biggest single catapult for reasoning.
- **Distillation recipes from open frontier models** (DeepSeek-R1 distill series showed a 7B can inherit strong
  reasoning). Adopt the RECIPE (published), apply to our sovereign-safe base. Catapults capability at low cost.
- **Router/MoE-merging techniques** (published MoErging / model-merge methods) — combine our brain-configs into
  one set of weights (the rung-4 merge) without training from zero. This is how "own weights" becomes real cheaply.
- **The companion shell** (Amica/Utsuwa, §consolidation) — fork the whole visual/voice/UX layer. Months saved.
- HONEST LINE: adopt published techniques + permissive code + open weights. Do NOT reverse-engineer closed models'
  weights or violate a license. The catapult is the RECIPE and the OSS, not anyone's proprietary IP.

## PART 3 — wiring into the 9-stage PDCA flow (throughput annotations, not new stages)
YEARS_TO_DAYS is already correctly an EXEC_MODE of PLAN→DO (not a stage) and DRUM is the clock. Add the
techniques above as EXECUTION ANNOTATIONS on the stages they accelerate:
- LEARN     → context-caching + memory-injection (C): start pre-grounded, never re-derive.
- PLAN      → explicit dependency-graph decomposition (B): maximize parallel width.
- DO        → parallel fan-out (B) + speculative cascade (A): concurrent subtasks, reflex-drafts-heavy-verifies.
- CHECK_VERIFY → BFT early-exit (E): ship on agreement, escalate only on disagreement.
- (offline) → distillation (D): periodically collapse the ensemble into a faster student (the £15 run).
These are throughput levers on existing stages — they make the SAME governed flow run faster/cheaper, audited by
SIGIL and gated by care-floor throughout. No stage added; no capability claimed that isn't the base model's.

## THE ONE-LINE
Years→Days is real as THROUGHPUT: parallel fan-out (wall-clock) + speculative cascade (token speed) + memory-
injection (skip re-derivation) + BFT early-exit (skip redundant compute) + distillation (collapse the ensemble).
The catapults are published recipes + permissive OSS + open reasoning-traces — adopt the technique, never the
proprietary weights. All bolt onto the existing 9-stage flow as execution modes, audited and care-gated.
