# MEOK speed research — AirLLM, prior work, web (2026-06-01)

_By Claude (Opus 4.8). Question: can MEOK SIGIL / AirLLM / other techniques speed up the council
+ chat? Findings + what was applied + what's next._

## AirLLM — verdict: NOT for speed
AirLLM runs huge models (70B) on tiny GPUs (4GB) by loading transformer layers from disk one at
a time. It trades **speed for memory**: "significantly slows down inference… impractical for
real-time… not a replacement for vLLM/TensorRT/llama.cpp for speed." On MEOK's CPU VM it would let
us run *bigger* models but *slower* — the opposite of the goal. **Skip for latency.** (Useful only
for offline/batch big-model runs on tiny hardware.)
Sources: [AirLLM explainer](https://rohit-shirke.medium.com/airllm-and-70b-on-a-4gb-gpu-whats-actually-going-on-3bf0e102252e), [BrightCoding](https://www.blog.brightcoding.dev/2026/02/27/airllm-run-70b-models-on-4gb-gpus-without-compromise).

## The real lever — ultra-fast inference providers (matches our prior Groq note)
| Provider | Speed | Via |
|---|---|---|
| **Cerebras** | ~2,000–3,000 tok/s (Llama-3.3-70B >2,500) | OpenRouter |
| **Groq** | 500–800 tok/s, lowest first-token latency | OpenRouter |
| typical (SiliconFlow/Google) | ~20–40 tok/s | OpenRouter default |

**Verified live via our OpenRouter key:** Llama-3.3-70B on **Groq = 0.5–0.9s** vs the council's old
deepseek-v4 (SiliconFlow) **5.1s** / gemini **4.3s**. Cerebras serves gpt-oss-120b @ 0.8s.
Sources: [Groq vs Cerebras (NovaKit)](https://www.novakit.ai/blog/groq-vs-cerebras-vs-together-fast-inference), [Cerebras on OpenRouter](https://openrouter.ai/provider/cerebras), [Inference providers compared](https://infrabase.ai/blog/ai-inference-api-providers-compared).

## Other techniques (web)
- **Speculative decoding** (P-EAGLE 1.69×, DSD 2.5×) — needs control of the inference engine; **N/A**
  through a hosted API like OpenRouter. Only relevant if we self-host vLLM.
- **Prompt/prefix caching** — the council sends an identical `system_prompt + draft` prefix to all
  lenses; caching it cuts cost+latency. **Applicable next** (Anthropic/DeepSeek/OpenAI support it).
- **FP8 + FlashAttention3 + continuous batching** — provider-side; we get it free by using Groq/Cerebras.
Sources: [P-EAGLE (AWS)](https://aws.amazon.com/blogs/machine-learning/p-eagle-faster-llm-inference-with-parallel-speculative-decoding-in-vllm/), [Agentic plan caching](https://arxiv.org/pdf/2506.14852), [LLM inference optimization 2026](https://callsphere.ai/blog/llm-inference-optimization-quantization-speculative-decoding-2026).

## Applied this session (the council: 24s → ~6s, ~4× faster)
1. **SIGIL bounded comms** — `max_tokens` plumbed through every backend; lens verdicts capped at 96
   tokens (terse VERDICT + one line). *(commit 453fe5f)*
2. **Conditional synthesis** — skip the Opus reconcile when all lenses PASS. *(453fe5f)*
3. **Draft fallback** — companion failure tries 3 roster models, no abort. *(453fe5f)*
4. **Turbo routing** — lenses pinned to **Groq** (fast non-reasoning Llamas: 3.3-70B / 4-Scout /
   3.1-8B); reasoning models (gpt-oss/qwen3) dropped (they burn the cap thinking). Opus keeps the
   conditional synthesis for quality. *(this commit)*
Result: **24s → 14s → ~6s** (live 4.6s), reliable, answers still correct.

## Remaining levers (not yet applied)
- **Streaming** the final reply (SSE) → *perceived* latency near-instant; biggest felt win left.
- **Prefix caching** of the shared council prompt → cheaper + a bit faster.
- **Fast synthesizer** (Groq Llama-70B instead of Opus) → ~6s → ~3s, but jittery under rate-limits
  and lower synthesis quality; available now via `orchestrator="turbo-llama70"`.
- **Self-host vLLM on a GPU VM** → unlocks speculative decoding + FP8 (only if we leave the CPU VM).
