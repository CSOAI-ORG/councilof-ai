> **SUPERSEDED ROSTER NOTICE (2026-07-16):** model versions below are one generation old (DeepSeek-V3/Kimi-K2/GLM-4.5). Current-gen canonical roster is in `SOV_FRONTIER_COMPUTE_GATES.md`: Kimi-K2.6 1.059T / DeepSeek-V4-Pro 861B MIT / GLM-5.2 753B MIT / DeepSeek-V4-Flash 158B MIT (1-GPU) / Qwen3.6-35B Apache (1-GPU). Use those. The phases/method below still hold; only the version strings changed.

# HERMES E2E — Tab-per-Model Fusion Build (SOV4 = 3-around-1)
# Handoff for Claude Code (Hermes lane). Grounded in CONFIRMED HuggingFace model cards (2026-07-16), not snippets.
# Science lane (this agent) owns: training jobs + evals on Modal. Hermes lane owns: serving tabs + UI + mesh.

## CONFIRMED NUMBERS (from HF safetensors API — verified, not guessed)
| Expert | Model | Total params | License | Arch | Reachability |
|---|---|---|---|---|---|
| A (small/dense) | XiaomiMiMo/MiMo-7B-RL | 7.83B | MIT ✓ | dense | 1 GPU — START HERE |
| B (mid/MoE) | tencent/Hunyuan-A13B-Instruct | 80.4B | "other" (READ TERMS FIRST) | MoE 13B active | 1×80GB int4 |
| C (frontier/MoE) | deepseek-ai/DeepSeek-V3 | 684B | (confirm from card) | MoE | multi-GPU node |
NOTE: "1.6T" = DeepSeek **V4-Pro** (separate newer model). Prove pipeline on A+B before spending on C/V4.

## THE ARCHITECTURE (honest)
- 3 experts = 3 DIFFERENT architectures, each LoRA-tuned on the SAME corpus (5,573 governance examples).
  Different archs -> decorrelated errors -> fusion can beat any single (the thing same-base Node1 merge lacked).
- SOV4 = the governor/router (the "1"): routes prompt->best expert; on hard prompts fuses all 3 via care-gate+BFT, signs.
- Governance baked in: each LoRA trains on the governance corpus; SOV4 routing runs through the anti-drift gate.
- HONEST LIMIT: this is a governed fusion of open bases. NOT a from-scratch 1.6T. Value = the governor, not the params.

## TAB LAYOUT (one per model tune + the two dev tabs)
- TAB SOV3   : existing 0.5B student — keep developing (citation->RAG fix already 95%). Serve via governed shim.
- TAB MiMo-A : Expert A. LoRA MiMo-7B on corpus. Serve. Real, reachable now.
- TAB Hun-B  : Expert B. LoRA Hunyuan-A13B (after license read). Serve.
- TAB DS-C   : Expert C. LoRA DeepSeek-V3 (multi-GPU). Serve.
- TAB SOV4   : the King — router/fusion over A+B+C. Keep developing (117 caps, anti-drift gate wired).

## PHASES (E2E, each phase has a CHECKABLE gate — no phase "done" without a test)
PHASE 1 — Expert A (MiMo-7B, MIT) [Science trains / Hermes serves]
  1.1 Science: Modal LoRA MiMo-7B on merged_corpus.jsonl (1289) + expert corpora. Adapter out.
  1.2 Science: held-out eval (law-grounding + citation). Gate: tuned > base, measured.
  1.3 Hermes: serve MiMo-A behind governed shim as a tab. Gate: real prompt in -> governed+signed answer out.
PHASE 2 — Expert B (Hunyuan-A13B)
  2.1 Hermes: READ Tencent license; confirm derivative+publish allowed. Gate: license verdict written down.
  2.2 Science: LoRA Hunyuan on same corpus. Eval. Gate: tuned>base.
  2.3 Hermes: serve Hun-B tab.
PHASE 3 — Expert C (DeepSeek-V3, 684B)
  3.1 Science: confirm license from card. Gate: license written.
  3.2 Science: multi-GPU Modal LoRA (prove A+B fusion FIRST — don't spend here until phase 4 shows fusion wins).
PHASE 4 — SOV4 fusion (the payoff)
  4.1 Science: MoA fuse A+B (2 real different-arch experts). Measure: fused vs best-single on held-out.
      Gate: fused >= best single expert (the emergence proof same-base merge FAILED). If not, fusion is decoration — say so.
  4.2 Hermes: SOV4 tab routes a prompt to A/B/C + shows which expert + care-score + signature.
  4.3 E2E: one request -> SOV4 routes -> expert answers -> care-gate -> sign -> shown in tab. Gate: full path works on a real prompt.
PHASE 5 — Publish (only after Gate 4.1 passes)
  Publish the cleanest MIT expert (MiMo-A governed) with honest card: "MiMo-7B + SOV governance layer". Name on the governor.

## STANDING RULES (from the anti-drift gate — binds both lanes)
- No "done" without a functional test in the same message. File-exists != done.
- No unverified "yes". Confirm license/size from source before spending GPU.
- Tag every output progress(money/user/test) vs motion(doc/commit). This doc is MOTION until Phase 1.3 serves a real tab.
- No scope-inflation: prove on 7B before spending on 684B. Smallest real unit first.
- Fusion claim only valid if MEASURED fused>=best-single. No emergence claim before that number.

## FIRST REAL ACTION (Science lane, reachable now)
Modal LoRA MiMo-7B (MIT, 7.8B) on the 5,573-example corpus -> first real fusion expert. Cheap, single-GPU, publishable.
