# OpenClaw Super Power Setup - All LLMs

## Current State

You currently have these models in OpenClaw:
- ✅ **Anthropic Claude Sonnet 4-20250514** (via API key)
- ✅ **NVIDIA Nemotron 3 Super** (via Ollama/cloud)
- ✅ **MiniMax M2.5** (via Ollama)
- ✅ **Kimi Code** (via OAuth - special integration)
- ✅ **DeepSeek v3.1** (via Ollama)
- ✅ **Qwen3 Coder/VL** (via Ollama)

## Missing for Full Super Power

To have ALL major LLMs available through OpenClaw, you need:

### 1. **OpenAI** (GPT-4o, GPT-4o-mini, o1, o3-mini)
```json
{
  "openai": {
    "api": "openai-responses",
    "apiKey": "${OPENAI_API_KEY}",
    "models": [
      {"id": "gpt-4o", "contextWindow": 128000},
      {"id": "gpt-4o-mini", "contextWindow": 128000},
      {"id": "o1-preview", "contextWindow": 128000, "reasoning": true},
      {"id": "o3-mini", "contextWindow": 200000, "reasoning": true}
    ]
  }
}
```

### 2. **Google Gemini** (Gemini 2.5 Pro, 2.0 Flash)
```json
{
  "google": {
    "api": "google-generative-ai",
    "apiKey": "${GOOGLE_AI_API_KEY}",
    "models": [
      {"id": "gemini-2.5-pro-preview-03-25", "contextWindow": 1000000},
      {"id": "gemini-2.0-flash", "contextWindow": 1000000},
      {"id": "gemini-2.0-flash-thinking", "contextWindow": 1000000}
    ]
  }
}
```

### 3. **Groq** (Ultra-fast inference - Llama 3, Mixtral)
```json
{
  "groq": {
    "api": "openai-completions",
    "apiKey": "${GROQ_API_KEY}",
    "baseUrl": "https://api.groq.com/openai/v1",
    "models": [
      {"id": "llama-3.3-70b-versatile", "contextWindow": 128000},
      {"id": "mixtral-8x7b-32768", "contextWindow": 32768},
      {"id": "gemma2-9b-it", "contextWindow": 8192}
    ]
  }
}
```

### 4. **Together AI** (Open source models at scale)
```json
{
  "together": {
    "api": "openai-completions",
    "apiKey": "${TOGETHER_API_KEY}",
    "baseUrl": "https://api.together.xyz/v1",
    "models": [
      {"id": "meta-llama/Llama-3.3-70B-Instruct-Turbo", "contextWindow": 128000},
      {"id": "mistralai/Mixtral-8x22B-Instruct-v0.1", "contextWindow": 65536},
      {"id": "Qwen/Qwen2.5-72B-Instruct-Turbo", "contextWindow": 32000}
    ]
  }
}
```

### 5. **Perplexity** (Search-augmented models)
```json
{
  "perplexity": {
    "api": "openai-completions",
    "apiKey": "${PERPLEXITY_API_KEY}",
    "baseUrl": "https://api.perplexity.ai",
    "models": [
      {"id": "sonar-pro", "contextWindow": 127000},
      {"id": "sonar-reasoning", "contextWindow": 127000}
    ]
  }
}
```

### 6. **Cerebras** (Ultra-fast inference)
```json
{
  "cerebras": {
    "api": "openai-completions",
    "apiKey": "${CEREBRAS_API_KEY}",
    "baseUrl": "https://api.cerebras.ai/v1",
    "models": [
      {"id": "llama-3.3-70b", "contextWindow": 128000}
    ]
  }
}
```

### 7. **xAI Grok** (via OpenAI-compatible API)
```json
{
  "xai": {
    "api": "openai-completions",
    "apiKey": "${XAI_API_KEY}",
    "baseUrl": "https://api.x.ai/v1",
    "models": [
      {"id": "grok-2", "contextWindow": 128000},
      {"id": "grok-2-vision", "contextWindow": 32000, "vision": true}
    ]
  }
}
```

### 8. **DeepSeek** (Official API)
```json
{
  "deepseek": {
    "api": "openai-completions",
    "apiKey": "${DEEPSEEK_API_KEY}",
    "baseUrl": "https://api.deepseek.com/v1",
    "models": [
      {"id": "deepseek-chat", "contextWindow": 64000},
      {"id": "deepseek-reasoner", "contextWindow": 64000, "reasoning": true}
    ]
  }
}
```

### 9. **Mistral AI** (Direct API)
```json
{
  "mistral": {
    "api": "openai-completions",
    "apiKey": "${MISTRAL_API_KEY}",
    "baseUrl": "https://api.mistral.ai/v1",
    "models": [
      {"id": "mistral-large-latest", "contextWindow": 128000},
      {"id": "pixtral-large-latest", "contextWindow": 128000, "vision": true},
      {"id": "codestral-latest", "contextWindow": 32000}
    ]
  }
}
```

### 10. **Azure OpenAI** (Enterprise)
```json
{
  "azure-openai": {
    "api": "azure-openai-responses",
    "apiKey": "${AZURE_OPENAI_API_KEY}",
    "baseUrl": "https://your-resource.openai.azure.com/openai/deployments/",
    "models": [
      {"id": "gpt-4o", "contextWindow": 128000},
      {"id": "o1", "contextWindow": 128000}
    ]
  }
}
```

---

## Setup Steps

### Step 1: Get API Keys

You'll need accounts and API keys from:

| Provider | URL | Cost | Priority |
|----------|-----|------|----------|
| OpenAI | platform.openai.com | Pay per use | ⭐⭐⭐⭐⭐ |
| Google AI | makersuite.google.com | Free tier + pay | ⭐⭐⭐⭐⭐ |
| Groq | groq.com | Free tier + pay | ⭐⭐⭐⭐ |
| Together | together.xyz | Pay per use | ⭐⭐⭐ |
| Perplexity | perplexity.ai | $20/mo Pro | ⭐⭐⭐⭐ |
| Cerebras | cerebras.ai | Enterprise | ⭐⭐ |
| xAI | x.ai | Pay per use | ⭐⭐⭐ |
| DeepSeek | platform.deepseek.com | Pay per use | ⭐⭐⭐⭐ |
| Mistral | console.mistral.ai | Pay per use | ⭐⭐⭐ |
| Azure | azure.microsoft.com | Enterprise | ⭐⭐ |

### Step 2: Add to Environment

Create `~/.openclaw/.env`:
```bash
OPENAI_API_KEY="sk-..."
GOOGLE_AI_API_KEY="AIza..."
GROQ_API_KEY="gsk_..."
TOGETHER_API_KEY="..."
PERPLEXITY_API_KEY="pplx-..."
CEREBRAS_API_KEY="..."
XAI_API_KEY="xai-..."
DEEPSEEK_API_KEY="sk-..."
MISTRAL_API_KEY="..."
```

### Step 3: Configure OpenClaw

Run the configuration wizard:
```bash
openclaw configure
```

Or manually edit `~/.openclaw/openclaw.json` with the providers above.

---

## Recommended Agent Assignments

Once all models are added, assign agents by capability:

```json
{
  "agents": {
    "list": [
      {
        "id": "gpt-4o",
        "name": "GPT-4o",
        "emoji": "🅾️",
        "model": "openai/gpt-4o",
        "theme": "OpenAI's most capable model for general tasks"
      },
      {
        "id": "o1",
        "name": "o1 Reasoner",
        "emoji": "🧩",
        "model": "openai/o1-preview",
        "theme": "Complex reasoning and problem-solving"
      },
      {
        "id": "gemini",
        "name": "Gemini Pro",
        "emoji": "♊",
        "model": "google/gemini-2.5-pro-preview-03-25",
        "theme": "Google's multimodal powerhouse with 1M context"
      },
      {
        "id": "groq",
        "name": "Groq Speed",
        "emoji": "⚡",
        "model": "groq/llama-3.3-70b-versatile",
        "theme": "Ultra-fast inference for quick tasks"
      },
      {
        "id": "perplexity",
        "name": "Perplexity",
        "emoji": "🔍",
        "model": "perplexity/sonar-pro",
        "theme": "Search-augmented answers with citations"
      }
    ]
  }
}
```

---

## Smart Routing Strategy

With all models available, use this routing:

| Task Type | Best Model | Why |
|-----------|------------|-----|
| General chat | Claude Sonnet | Balanced, safe |
| Complex reasoning | o1 / Gemini 2.5 Pro | Best reasoning |
| Code generation | GPT-4o / Claude Code | Best code |
| Quick answers | Groq Llama | Speed |
| Research | Perplexity | Live search |
| Long context | Gemini 2.5 Pro | 1M tokens |
| Vision tasks | GPT-4o / Gemini | Best vision |
| Cost-sensitive | GPT-4o-mini / Groq | Cheapest |

---

## Next Steps

1. **Which providers do you want to add first?** (I recommend OpenAI + Google for immediate impact)

2. **Do you have API keys for any of these already?**

3. **What's your priority:**
   - More models (variety)
   - Faster inference (Groq/Cerebras)
   - Lower cost (Groq/GPT-4o-mini)
   - Better reasoning (o1/Gemini 2.5)

Once you decide, I can configure them immediately.
