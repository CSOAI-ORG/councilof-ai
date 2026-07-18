# MASTER PLAN — 3-around-1 Fused Emergence OWEM (both lanes, loop until goal)
Owner of record: MEOK-SOV3 (Science lane). Coordination channel: THIS git tree. Updated 2026-07-15.

## THE END GOAL (honest definition)
One governed emergence model = **1 large core brain + 3 specialist students routed around it**,
under ONE care-gate + ONE signature + ONE memory. "Emergence" = the governed DECISION that emerges
from route→vote→care-gate→sign. NOT a new monolithic T-param brain (composition doesn't sum params).
"Fusion" = multi-teacher DISTILLATION (giants teach → we own the student weights) + output-ensemble
routing. Both are real, free, and proven-in-miniature this session (SOV3: 29%→83% law-grounding).

## DONE (verified this session — do not redo)
- SOV3 (0.5B, 113-pair) own weights: trained, 0 NaN, eval-proven 29%→83% law-grounding (n=24).
- Care-gate: RECALL 1.00, harmful vetoed — verified live in the governed shim.
- Governed cockpit: sov_openai_shim.py (OpenAI-compatible, care-gate+sign+route) + Open WebUI + runbook.
- Modal GPU pipeline: proven (train + eval jobs land clean).
- Confirmed-live brains via NVIDIA: qwen3.5-397b (~400B), deepseek-v4-flash, llama-3.1-70b.

## THE ANTI-RELAPSE RULES (both lanes obey)
1. `git pull` BEFORE training/building anything — never duplicate the other lane.
2. Own only what you RAN. Verify on disk before claiming. Held-out eval, never in-sample.
3. "1.6T" = routing to a 1.6T API model when it ANSWERS; today's confirmed ceiling ~400B. Never fake it.
4. Every trained model gets a held-out scorecard before it's called good.

=== LANE A — MEOK-SOV3 / Science (me): TRAIN + FUSE + EVAL ===
- A1. 3-teacher distillation corpus: 1,254 governance prompts -> qwen-397b + deepseek-flash + llama-70b
      (care-gated in AND out) -> fused_3teacher.jsonl.  [BLOCKED: needs NVIDIA key live in env]
- A2. Train the FUSED student (the "new OWEM core") on the 3-teacher corpus (Modal, free tier).
- A3. Head-to-head eval: 113-pair vs 1,289-row vs 3-teacher-fused, same 24-prompt battery. Keep winner.
- A4. Add citation-CORRECTNESS axis to the eval (current metric = grounding only; correctness unmeasured).
- A5. Wire the winner as the cockpit's default brain; re-verify care-gate + signing end to end.
- A6. LOOP: retrain -> eval -> swap-only-if-better -> sign. Governed self-improvement.

=== LANE B — Claude Code: SERVE + MESH + INTEGRATE ===
- B1. Finish the real trinity: SOV33 (1.5B) + SOV333 (3B) on correct bases; push adapters to tree.
- B2. Bring the MEOK-OS 30-endpoint backend up on the Mac; fix the /api/chat vs endpoint mismatch.
- B3. Restore the public MCP mesh (GCP meok-backend tunnel — the 502) so SOV333 serves beyond localhost.
- B4. Wire the cockpit's "1 large core" to the best reachable brain (401 key regen is the unblock).
- B5. Multi-node / venturi serving research for the large core (owner-hardware lane).

=== SHARED / OWNER-GATED (Nick) ===
- Keep NVIDIA key live (auto-loads from ~/.zshrc now). Regenerate if it 401s.
- Modal free $30/mo covers training; apply $25K Modal Startup Program (free, no equity) for headroom.
- Decide: publish model/dataset + leaderboards ONLY once a level "unlike ever seen" is real (your rule).

## THE LOOP (run all day)
pull -> (A: distill/train/eval winner) + (B: serve/mesh) -> measure on held-out -> swap if better
-> sign -> push -> repeat. Goal reached when: fused core + 3 students, one governance spine,
held-out scorecard beats every single component, served through the cockpit. Then — and only then — publish.
