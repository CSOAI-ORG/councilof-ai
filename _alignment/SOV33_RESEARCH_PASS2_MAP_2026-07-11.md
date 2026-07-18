# 🜏 SOV33 — RESEARCH PASS 2, ACTIONABLE MAP (2026-07-11)
Source: another-lane deep-research report (compass_artifact wf-8985c2d8). Rigorous, self-caveating.
Provenance: NOT my own web research; HF paths/arXiv IDs quoted from the report, not independently re-verified here.
Mapped to SOV33's actual open threads. Split: DO-NOW (grounded) vs NEEDS-GPU vs VERIFY-FIRST.

## DONE THIS SESSION (from the report's #1 Area-1 rec)
- Built a HELD-OUT governance eval (sov33_governance_eval.py) — real DORADO+care gate, ground-truth labels,
  NOT answer-keyed. Result 18/18 (recall 1.00 prec 1.00) on fresh prompts.
  CAVEATS: I wrote prompts+labels (not independent); known hypothetical-framing evasion NOT in set
  (adversarial-battery recall stays 0.80). This REPLACES the invalid answer-keyed config-test governance claim.

## DO-NOW (grounded, no GPU)
- HORUS upgrade: the report says build it on LINEAR PROBES / CAA steering vectors on local activations,
  NOT SAEs/paid APIs. Anthropic "simple probes catch sleeper agents" reproducible on an 8B in seconds.
  Our current HORUS is string-matching signatures — probes are a real upgrade (needs a local 8B + activations).
- MCP hardening for the 200+ tools: run mcp-scan (static + local proxy guardrails) now; ToolHive as gateway
  (container isolation, egress control, OTel, semantic tool-search cuts token bloat). OAuth 2.1 resource-server
  posture (RFC 8707 resource indicators, no token passthrough) per 2025-06-18 spec.
- SIGIL: sign entries with Sigstore + a Rekor-style append-only transparency log (mature, buildable).

## NEEDS-GPU (the £0 own-weights thread, now UNBLOCKED in principle)
- Own-weights WITHOUT the Oracle teacher: bootstrap a student on FREE permissive reasoning-trace sets
  (s1K-1.1 Apache-2.0, LIMO, OpenR1-Math-220k, OpenThoughts3 — clean the ~62% truncated </think>).
  SFT with Unsloth QLoRA on a free T4 = genuine weekend task. GRPO on 1.5-4B feasible-but-slow on T4; 8B wants A100.
  This is a SECOND path to own-weights alongside the 4-expert merge — neither needs the Oracle teacher.

## VERIFY-FIRST (do not adopt on report's word)
- Guardrail models (Granite-Guardian-3.3-8B, Qwen3Guard-8B, WildGuard) as ENSEMBLE pre-filter — but the
  report's own strongest source shows Qwen3Guard drops 57pp on novel prompts and LlamaGuard "rubber-stamps".
  KEEP our care-scorer as the veto; any guard is a logging signal until it beats care-scorer precision on OUR traffic.
- Structured verdicts: XGrammar (fixed schema, our case) via vLLM guided decoding; llguidance if schema varies.
- Embeddings/retrieval: Qwen3-Embedding-0.6B + Qwen3-Reranker-0.6B on pgvector HNSW+halfvec (Graphiti upgrade).
- MCP "2026-07-28 spec": report could NOT verify it; latest confirmed is 2025-11-25. Treat 2026-07-28 as UNCONFIRMED.

## THRESHOLDS (the report's discipline, adopted)
- care-scorer false-veto >5% on held-out -> stop scaling data, fix scorer first (precision-over-recall).
- GRPO no gain over SFT after a weekend -> drop RL, stay SFT.
- any guard's precision < care-scorer's on OUR traffic -> remove from veto path, keep as logging only.
