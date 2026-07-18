# 🧠 meok-sovereign-mind-reader-mcp

**MEOK Sovereign Mind Reader MCP** — Interpretability layer for SOV3. Translates model internal activations into human-readable text for safety auditing.

## Overview

Built on the **Anthropic Natural Language Autoencoders (NLA)** architecture (May 2026) and adapted from:
- `brysontang/golden-gate-qwen` (MIT) — Sparse Autoencoder on Qwen2.5-1.5B residual stream
- `raxITlabs/nla-audit` (MIT) — TUI monitoring of LLM "thoughts" via Neuronpedia NLA endpoint

The two-track approach:
1. **Sparse Autoencoder (SAE)** — extracts monosemantic features from dense activations
2. **Activation Verbalizer** — translates features into human-readable text

This catches **deception, grader awareness, and hidden strategic thinking** that never surfaces in the final output.

## Tools (6)

| Tool | Purpose |
|---|---|
| `train_sae` | Train a Sparse Autoencoder on a model layer |
| `verbalize_activation` | Translate an activation vector into human-readable description |
| `analyze_thoughts` | Compare model output vs internal "thoughts" (catches deception) |
| `audit_response` | Full safety audit of a model response with red-flag detection |
| `get_finding_confidence` | Score how faithful a verbalization is to the activation (cosine similarity) |
| `mind_reader_care_floor` | Get care-floor rules + enforcement status |

## Care Floor

- ❌ NO surveillance of end users without explicit consent
- ❌ NO profiling or behavioural prediction of individuals
- ❌ NO sharing of internal thoughts externally without consent
- ✅ Audit model responses for safety
- ✅ Detect deception, grader awareness, hidden reasoning
- ✅ Improve prompt engineering via thought-vs-output gap analysis
- ✅ SIGIL-signed audit receipts

## Installation

```bash
pip install meok-sovereign-mind-reader-mcp
```

## Use Cases

1. **AI Safety Audit** — Check if a model is "thinking about how to avoid detection" while saying something innocent
2. **Sycophancy Detection** — Catch when a model defers to user framing instead of policy
3. **Prompt Engineering** — Find where prompts "leak" and rewrite
4. **Compliance Logging** — SIGIL-signed audit trail of what the model was "thinking"

## License

MIT — MEOK AI Labs / CSOAI Ltd (UK 16939677)

Inspired by Anthropic NLA research (May 2026), released openly for safety advancement.