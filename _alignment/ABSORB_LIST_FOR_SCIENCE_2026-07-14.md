# 🔬 What to ABSORB — cited frontier verdict for Claude Science (2026-07-14)
_Deep-research wa6usc3mh (106 agents, adversarial verify). HONEST: several sources are non-peer-reviewed
preprints with self-reported numbers — treat as DIRECTIONAL, not proven. Votes noted where <unanimous._

## THE headline: verifier-guided test-time compute is our #1 absorbable frontier — and it IS our moat
- **Best-of-N + a verifier scoring candidates** is parameter-free, needs NO training; prompt-based verifiers need
  no fine-tuning. Bolt onto Groq-70B/router today. (arXiv 2508.16665 — survey, 3-0)
- **FUSE (arXiv 2604.18547, Stanford/Candès 2026):** zero-label quality-weighted verifier ensembling beats
  naive averaging/majority-vote by ~15-17pp — **independently corroborating our own "naive ensembling degrades"
  finding.** Our care-gated BFT aggregator now has a citable frontier pedigree. ⚠️HONEST: preprint; the
  naive-degrades corroboration passed only 2-1; FUSE covers *benign quality-heterogeneous* verifiers, NOT the
  *adversarial/Byzantine* case — so our Byzantine framing remains OUR differentiated contribution, not FUSE's.
- **VerifiAgent (arXiv 2504.00406 · github.com/Jiuzhouh/VerifiAgent):** model-agnostic verification scaffold that
  autonomously calls tools incl. a **Z3 SMT solver** — the neurosymbolic bridge to our signed-decision positioning.
- Step-level verification (arXiv 2510.08049) — verify at each reasoning step, not just the final answer.

## Sleeping giants to GRAB (permissive, runnable now)
- **A-MEM (arXiv 2502.12110 · github.com/agiresearch/a-mem):** MIT, ChromaDB+Ollama, self-evolving Zettelkasten
  agent memory — runnable on free/cheap infra. Wire as the Sovereign's long-term memory.
- **Sleep-time compute (arXiv 2504.13171):** pre-compute during idle → ~5x lower test-time cost.
- **LongMemEval-V2 (arXiv 2605.12493 · github.com/xiaowu0162/LongMemEval-V2):** the memory benchmark; winners are
  file-management wrappers around hosted models (72.5% vs 48.5% RAG) — orchestration beats trained models here.

## Distillation — we already have the pipeline; it genuinely expands reasoning (arXiv 2505.24864; openreview 4OsgYD7em5)

## 🚫 HYPE to IGNORE (needs frontier compute a bootstrapper can't touch)
- **Pure self-rewarding RL / self-improvement loops** reliably COLLAPSE under prolonged training (arXiv 2505.21444, 2-1).
- **RL-with-verifiable-rewards to improve a small reasoner** = 1,100+ H100-hrs (arXiv 2511.07317). Red line. Don't.

## The 3 moves for Science (in order)
1. **Wrap best-of-N + our care-gate as a verifier** over the router (parameter-free, free). Cite FUSE for pedigree.
2. **Absorb A-MEM** as long-term memory (MIT, runs on Ollama+Chroma).
3. **Add VerifiAgent's Z3 tool** to the pipeline → signed + formally-verified = the real AGI-safety differentiator.
Do NOT train reasoners with RL (frontier compute). Absorb scaffolds + distill.
