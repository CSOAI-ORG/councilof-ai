# Hermes key recheck — 18 September 2026

Observed locally on the Mac. No credential values are included.

## What was verified

- `~/.hermes/.env` exists, has 51 non-empty assignments, and contains no `${...}` placeholders or duplicate assignments.
- The file was last modified **16 September 2026 at 15:52 BST**. There is no filesystem evidence that Claude added new values to this file on 17 September.
- `HERMES-KEY-INVENTORY-16Sep2026.md` records ten provider keys that were previously proved against provider metadata endpoints. The dead xAI API-key, Gemini, Qwen, DashScope and StepFun values were intentionally removed from the env file on 16 September; xAI is intended to use OAuth.
- `hermes doctor` currently reports API connectivity checks green for OpenRouter, Anthropic, Z.AI, Kimi, StepFun, DeepSeek, Hugging Face, NVIDIA, MiniMax, Gemini, Ollama Cloud and Xiaomi. These are metadata/configuration checks, not proof of funded inference.
- `csoai_keys.py --probe --force` reports metadata-live candidates for inference: NVIDIA, DeepSeek, OpenRouter, Groq and Hugging Face; LLM metadata probes also find Anthropic, OpenRouter, DeepSeek, NVIDIA, Groq and OpenAI. It reports publish, GitHub and Apify metadata paths live. The resolver's Moonshot and Google names are mismatched with Hermes' current env names, so those two negative rows are not treated as authoritative.
- `~/.csoai-keys.env` was modified **17 September 2026 at 16:04 BST** and contains 15 key names. Three are absent from Hermes' env: `CEREBRAS_API_KEY`, `GOOGLE_AI_API_KEY`, and `ZENODO_TOKEN`. The first two returned 401 in the resolver probe; Zenodo returned metadata HTTP 200. Stripe and Cloudflare credentials were deliberately not copied into Hermes.

## Changes made

- Restarted the launchd-supervised Hermes gateway twice so it reloads the current env/config. Current process was confirmed by `hermes gateway status`.
- Replaced the dead fallback order (OpenAI → OpenAI mini) with this order:
  1. Groq `openai/gpt-oss-120b`
  2. StepFun `step-3.5-flash-2603`
  3. Z.AI `glm-4.7`
  4. OpenAI `gpt-5`
  5. OpenAI `gpt-5-mini`
- The first three fallback routes have live provider/model discovery, but no paid completion probe was run. This avoids spending or claiming usable inference without a real, owner-authorised test.

## Remaining blockers

- The active xAI OAuth route is returning HTTP 402 `personal-team-blocked:spending-limit`.
- OpenAI and OpenRouter fallback calls are returning HTTP 402 credit exhaustion.
- The gateway service definition is stale relative to the installed Hermes version.
- Hermes reports an outdated config schema and SQLite 3.50.4 WAL-reset exposure; `hermes update` is an owner-reviewed maintenance action and was not run here. `~/.hermes/state.db` was not touched.
- Optional integrations still without keys include MiniMax-CN, DeepInfra, Tavily, Perplexity, Firecrawl, FAL, Browserbase, Browser Use and ElevenLabs.

## Proof commands

```text
hermes status
hermes doctor
hermes gateway status
hermes fallback list
python3 /Users/nicholas/clawd/csoai-reach-pack-01Sep2026/tools/csoai_keys.py --probe --cap inference --force
```
