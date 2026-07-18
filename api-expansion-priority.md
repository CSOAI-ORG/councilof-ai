# API Provider Expansion - Priority Setup

## IMMEDIATE IMPACT PROVIDERS

### 1. OpenAI (GPT-4o, o1 reasoning)
```bash
# Get API key from: https://platform.openai.com/api-keys
openclaw configure
# Add provider: openai
# API key: sk-xxxxx
# Models: gpt-4o, gpt-4o-mini, o1-preview
```

### 2. Google Gemini (1M context window)
```bash
# Get API key from: https://makersuite.google.com/app/apikey
openclaw configure  
# Add provider: google
# API key: AIzaxxxxx
# Models: gemini-2.5-pro-preview, gemini-2.0-flash
```

### 3. Groq (Ultra-fast inference)
```bash
# Get API key from: https://console.groq.com/keys
openclaw configure
# Add provider: groq  
# API key: gsk_xxxxx
# Models: llama-3.3-70b-versatile, mixtral-8x7b-32768
```

## SMART ROUTING STRATEGY

```json
{
  "routing": {
    "reasoning_tasks": ["o1-preview", "gemini-2.5-pro"],
    "code_generation": ["gpt-4o", "claude-sonnet-4"],
    "quick_responses": ["groq/llama-3.3-70b", "gpt-4o-mini"],
    "long_context": ["gemini-2.5-pro", "claude-sonnet-4"],
    "cost_effective": ["groq/mixtral-8x7b", "gpt-4o-mini"]
  }
}
```

**Expected Result:** 10+ premium LLM providers in OpenClaw, intelligent routing