# OpenClaw Full Super Power Setup - Complete Guide

## 🎯 Goal
Route ALL your LLM calls through OpenClaw with intelligent model selection.

## ✅ Current Status

You have these models working:
| Model | Provider | Status | Best For |
|-------|----------|--------|----------|
| Claude Sonnet 4 | Anthropic | ✅ Active | General, safety, coding |
| Nemotron 3 Super | NVIDIA/Ollama | ✅ Active | Agentic tasks, reasoning |
| MiniMax M2.5 | MiniMax/Ollama | ✅ Active | Cost-effective reasoning |
| Kimi Code | Moonshot | ✅ Active | Coding (OAuth) |

## 🚀 To Add (Full Super Power)

### Priority 1: Core Models (Add These First)

1. **OpenAI GPT-4o/o1** 
   - Best multimodal model
   - o1 for complex reasoning
   - Get key: platform.openai.com

2. **Google Gemini 2.5 Pro**
   - 1 million token context
   - Best for long documents
   - Get key: makersuite.google.com (free tier)

3. **Groq Llama 3.3**
   - Fastest inference
   - Free tier available
   - Get key: groq.com

### Priority 2: Specialized Models

4. **Perplexity Sonar** - Live web search + answers
5. **DeepSeek V3/R1** - Best value (very cheap)
6. **Mistral Large** - European alternative
7. **Together AI** - Open source at scale

---

## 📋 Quick Start

### Step 1: Run Setup Wizard
```bash
~/clawd/bin/setup-openclaw-superpower
```

### Step 2: Get API Keys
Minimum recommended:
1. Google AI (free): https://makersuite.google.com
2. Groq (free tier): https://groq.com
3. OpenAI (pay): https://platform.openai.com (optional but recommended)

### Step 3: Add to Shell
```bash
# Add to ~/.zshrc
echo 'source ~/.openclaw/.env' >> ~/.zshrc
source ~/.zshrc
```

### Step 4: Configure OpenClaw
```bash
# I can add the providers for you once you have API keys
# Or run:
openclaw configure
```

---

## 🤖 How to Use

### Direct Model Access
```bash
# Use specific models
openclaw agent --agent gpt-4o --message "Hello"
openclaw agent --agent gemini --message "Summarize this doc" 
openclaw agent --agent groq --message "Quick answer"
```

### Via `claw` Launcher
```bash
claw gpt-4o "Complex task"
claw gemini "Long document analysis"
claw groq "Fast response needed"
```

### Intelligent Routing
```bash
# Auto-select best model
~/clawd/automation/model_router.py "Debug this Python code"
~/clawd/automation/model_router.py "Research latest AI news" --cost-sensitive
~/clawd/automation/model_router.py "Quick classification" --speed-priority
```

---

## 🧠 Smart Routing Examples

| Task | Best Model | Why |
|------|------------|-----|
| "Debug this error" | Claude/GPT-4o | Best code understanding |
| "Summarize 500-page PDF" | Gemini 2.5 Pro | 1M context window |
| "Quick yes/no" | Groq Llama | Fastest response |
| "Research current events" | Perplexity | Live web search |
| "Math proof" | o1/o3-mini | Chain-of-thought reasoning |
| "Cheap bulk processing" | DeepSeek V3 | $0.27/1M tokens |

---

## 🔧 Configuration Files

### Provider Config Template
`~/clawd/openclaw-providers-config.json` - Ready to merge

### Environment Variables
Create `~/.openclaw/.env`:
```bash
OPENAI_API_KEY="sk-..."
GOOGLE_AI_API_KEY="AIza..."
GROQ_API_KEY="gsk_..."
PERPLEXITY_API_KEY="pplx-..."
DEEPSEEK_API_KEY="sk-..."
MISTRAL_API_KEY="..."
```

---

## 💰 Cost Comparison

| Model | Input | Output | Best For |
|-------|-------|--------|----------|
| GPT-4o | $2.50 | $10.00 | General, vision |
| GPT-4o Mini | $0.15 | $0.60 | Simple tasks |
| o1 | $15.00 | $60.00 | Complex reasoning |
| Gemini 2.5 Pro | $1.25 | $10.00 | Long context |
| Gemini Flash | $0.10 | $0.40 | Fast tasks |
| Groq Llama | $0.59 | $0.79 | Speed |
| DeepSeek V3 | $0.27 | $1.10 | Cost-effective |
| Perplexity | $3.00 | $15.00 | Research |

---

## 🎛️ Advanced: Intelligent Router

The model router automatically picks the best model:

```python
from automation.model_router import ModelRouter

router = ModelRouter()

# Route based on task
result = router.route("Debug this Python code")
# Returns: Claude or GPT-4o

result = router.route("Analyze 1000-page document")
# Returns: Gemini 2.5 Pro

result = router.route("Quick classification")
# Returns: Groq or GPT-4o Mini
```

### Router CLI
```bash
# See routing decision
~/clawd/automation/model_router.py "Your task here"

# Prefer cheaper models
~/clawd/automation/model_router.py "Your task" --cost-sensitive

# Prefer faster models
~/clawd/automation/model_router.py "Your task" --speed-priority

# JSON output
~/clawd/automation/model_router.py "Your task" --json
```

---

## 📊 Full Stack Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    YOUR APPLICATION                          │
├─────────────────────────────────────────────────────────────┤
│  claw "task"  →  Intelligent Router  →  Best LLM            │
│  sov3-kimi    →  Unified Stack       →  Any Agent           │
│  OpenClaw UI  →  Gateway             →  All Models          │
├─────────────────────────────────────────────────────────────┤
│                    OPENCLAW GATEWAY                          │
│                         (Port 18789)                         │
├─────────────────────────────────────────────────────────────┤
│  Agents: JARVIS | Claude | GPT-4o | Gemini | Groq | etc     │
├─────────────────────────────────────────────────────────────┤
│                    LLM PROVIDERS                             │
│  Anthropic | OpenAI | Google | Groq | Mistral | DeepSeek    │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎯 Next Steps

**Which providers do you want to add?**

**Quick wins (free/cheap):**
1. ✅ Google Gemini (free tier, 1M context)
2. ✅ Groq (free tier, super fast)

**Best quality:**
3. OpenAI GPT-4o + o1 (industry standard)
4. Perplexity (research with citations)

**Best value:**
5. DeepSeek (cheapest good quality)

**Tell me:**
- Which API keys do you already have?
- Which should I configure first?
- Do you want me to run the setup wizard?

---

## 📁 Files Created

```
~/clawd/
├── OPENCLAW_SUPER_POWER_SETUP.md      # This guide
├── openclaw-providers-config.json     # Provider configs
├── bin/
│   └── setup-openclaw-superpower      # Setup wizard
└── automation/
    └── model_router.py                # Intelligent router
```

**Ready to configure?** Just tell me which API keys you have!
