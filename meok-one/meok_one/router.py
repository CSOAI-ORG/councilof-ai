"""
MEOK ONE — Model Router.

"Switch between LLMs / modes with ease" — for end users (opencode-style) AND the
monetisation answer to OpenRouter arbitrage.

The thesis (do NOT resell tokens): MEOK is not a cheaper token broker — that just
makes us the bank we're trying not to be (Character.AI's compute-cost death). Instead
the router is a GOVERNANCE WRAPPER: one ask() over any model, with the character
persona + memory + safety already attached, billed on the user's MEOK tier. The
model call is a COST line, not a profit line. Users on Local run free local models;
paid tiers may bring their own cloud key (BYOK) or use MEOK's at cost-plus-tier.

Backends, in tier-appropriate order:
  local   — Ollama (qwen3:8b/4b/0.6b) on :11434. FREE. The Local-tier engine.
  sov3    — SOV3 MCP tools (hermes_ask live; nemotron_chat when NVIDIA key works).
  cloud   — OpenAI/Anthropic/Gemini/OpenRouter via BYOK env keys (paid tiers only).

ask(prompt, model="auto", tier="free") returns {reply, model, backend, source}.
Honest: never fabricates a reply; if no backend answers, says so plainly.
"""

import json
import os
import re
import urllib.request
import urllib.error

# Load gitignored .env.local FIRST so MEOK_VM_LLM/GOOGLE_API_KEY are in env before we read them.
def _load_env_local():
    """Load meok-one/.env.local (gitignored) so GOOGLE_API_KEY etc. are available."""
    p = os.path.join(os.path.dirname(os.path.dirname(__file__)), ".env.local")
    if os.path.exists(p):
        for line in open(p):
            if "=" in line and not line.strip().startswith("#"):
                k, v = line.split("=", 1)
                os.environ.setdefault(k.strip(), v.strip())
_load_env_local()

# Ollama: prefer the GCP VM (off the M4) when configured, else local. Cloud brain, M4 idle.
_VM = os.environ.get("MEOK_VM_LLM", "").rstrip("/")
OLLAMA = _VM or os.environ.get("OLLAMA_URL", "http://localhost:11434")
_VM_KEY = os.environ.get("MEOK_VM_KEY", "")
SOV3_MCP = os.environ.get("SOV3_MCP", "http://localhost:3101/mcp")

# model alias -> (backend, concrete-id). "auto" resolves per tier.
MODELS = {
    # local (free, Ollama)
    "qwen3":      ("local", "qwen3:8b"),
    "qwen3:8b":   ("local", "qwen3:8b"),
    "qwen3:4b":   ("local", "qwen3:4b"),
    "qwen3:0.6b": ("local", "qwen3:0.6b"),
    "qwen2.5:3b": ("local", "qwen2.5:3b"),   # stronger local (on the VM)
    "llama3.2:3b":("local", "llama3.2:3b"),
    "meok-sov3":  ("local", "meok-sov3"),    # OUR SOV3 care model on the VM (the 'talk to one')
    # sov3 tools
    "hermes":     ("sov3", "hermes_ask"),
    "nemotron":   ("sov3", "nemotron_chat"),
    # cloud (BYOK — paid tiers)
    "gpt-4o":         ("cloud", "openai/gpt-4o"),
    "claude":         ("cloud", "anthropic/claude-3.5-sonnet"),
    "gemini-2.5-pro": ("cloud", "google/gemini-2.5-pro"),
    "deepseek-r1":    ("cloud", "deepseek/deepseek-r1"),
    # direct Gemini (AI Studio key) — the right-brain engine on Nick's credit (verified free quota)
    "gemini":         ("cloud", "gemini-flash-latest"),
    "gemini-flash":   ("cloud", "gemini-flash-latest"),
    "gemini-lite":    ("cloud", "gemini-flash-lite-latest"),
    "gemma":          ("cloud", "gemma-4-31b-it"),
    # frontier via OpenRouter (the BFT-of-MoEs TEST ROSTER — large + small mix, one key).
    # These let the council swap small local reviewers for top MoE models, and add
    # Claude Opus 4.8 (this agent) + DeepSeek/Kimi/Step as real council nodes.
    "deepseek":         ("cloud", "deepseek/deepseek-chat"),          # DeepSeek MoE (stable id)
    "deepseek-v4":      ("cloud", "deepseek/deepseek-v4-pro"),        # V4-Pro (1.6T MoE) if live
    "deepseek-v4-flash":("cloud", "deepseek/deepseek-v4-flash"),
    "kimi":             ("cloud", "moonshotai/kimi-k2.6"),            # Kimi K2.6 MoE
    "kimi-free":        ("cloud", "moonshotai/kimi-k2.6:free"),
    "opus":             ("cloud", "anthropic/claude-opus-4.8"),       # Claude Opus 4.8 — ME, as a node
    "opus-fast":        ("cloud", "anthropic/claude-opus-4.8-fast"),
    "gemini-or":        ("cloud", "google/gemini-2.5-flash"),         # Gemini via OpenRouter (no 429)
    "step":             ("cloud", "stepfun/step-3.5-flash"),          # StepFun Step-3.5 MoE
    "step-3.7":         ("cloud", "stepfun/step-3.7-flash"),          # Step-3.7 vision MoE
    "glm":              ("cloud", "z-ai/glm-4.5"),                    # Zhipu GLM
    "qwen-max":         ("cloud", "qwen/qwen-2.5-72b-instruct"),      # big Qwen
    "llama4":           ("cloud", "meta-llama/llama-4-maverick"),     # Llama 4 Maverick
    # TURBO lenses — served by Groq/Cerebras at 0.3-0.8s (verified 2026-06-01). Pair with
    # provider=["Groq","Cerebras"] for the deep-think council so 11 lenses finish in ~1s.
    "turbo-llama70":    ("cloud", "meta-llama/llama-3.3-70b-instruct"),
    "turbo-llama4s":    ("cloud", "meta-llama/llama-4-scout"),
    "turbo-ossbig":     ("cloud", "openai/gpt-oss-120b"),
    "turbo-oss":        ("cloud", "openai/gpt-oss-20b"),
    "turbo-qwen":       ("cloud", "qwen/qwen3-32b"),
    "turbo-llama8":     ("cloud", "meta-llama/llama-3.1-8b-instruct"),  # Groq instant, non-reasoning
    "minimax":          ("cloud", "minimax/minimax-m3"),               # MiniMax M3 (MSA, 1M ctx)
}

# Which backends a billing tier may use. Local tier = local only (free, self-host).
_TIER_BACKENDS = {
    "local": {"local"},                    # self-host, free, their machine
    "free":  {"local", "sov3"},            # hosted free — cheap backends only
    "pro":   {"local", "sov3", "cloud"},   # all, BYOK or cost-plus
    "usage": {"local", "sov3", "cloud"},
    "enterprise": {"local", "sov3", "cloud"},
}


def _strip_thinking(text: str) -> str:
    if not text:
        return text
    cleaned = re.sub(r"<think>.*?</think>", "", text, flags=re.DOTALL)
    if "<think>" in cleaned:
        cleaned = cleaned.split("</think>")[-1] if "</think>" in cleaned else cleaned.split("<think>")[-1]
    cleaned = cleaned.strip()
    # Strip a wrapping markdown code fence (qwen3 et al. sometimes wrap the whole
    # reply in ```text ... ``` — the consumer should see prose, not a code block).
    fence = re.match(r"^```[a-zA-Z]*\s*\n?(.*?)\n?```$", cleaned, flags=re.DOTALL)
    if fence:
        cleaned = fence.group(1).strip()
    return cleaned or text.strip()


def list_models(tier: str = "pro") -> list:
    """Models a tier can switch between — for the UI model picker."""
    allowed = _TIER_BACKENDS.get(tier, {"local"})
    return [{"id": alias, "backend": b, "concrete": c}
            for alias, (b, c) in MODELS.items() if b in allowed]


def _ask_local(model_id: str, prompt: str, max_tokens: "int | None" = None) -> "str | None":
    payload = {"model": model_id, "prompt": prompt, "stream": False}
    if max_tokens:
        payload["options"] = {"num_predict": int(max_tokens)}
    body = json.dumps(payload).encode()
    # The GCP VM is HTTPS+key. macOS Python 3.9 ships LibreSSL which fails Caddy's TLS
    # handshake (curl/system-TLS works fine), so route the VM call through curl. Local
    # http://localhost Ollama uses urllib as normal.
    if OLLAMA.startswith("https"):
        import subprocess
        cmd = ["curl", "-sS", "--max-time", "120", f"{OLLAMA}/api/generate",
               "-H", "Content-Type: application/json"]
        if _VM_KEY:
            cmd += ["-H", f"X-MEOK-Key: {_VM_KEY}"]
        cmd += ["-d", body.decode()]
        try:
            out = subprocess.run(cmd, capture_output=True, timeout=130).stdout.decode()
            return json.loads(out).get("response")
        except (subprocess.SubprocessError, json.JSONDecodeError, OSError):
            return None
    req = urllib.request.Request(f"{OLLAMA}/api/generate", data=body,
                                 headers={"Content-Type": "application/json"})
    try:
        with urllib.request.urlopen(req, timeout=60) as r:
            return json.loads(r.read().decode()).get("response")
    except (urllib.error.URLError, TimeoutError, OSError, json.JSONDecodeError):
        return None


def _ask_sov3(tool: str, prompt: str) -> "str | None":
    args = {"prompt": prompt} if tool == "hermes_ask" else {"message": prompt, "system_prompt": ""}
    payload = {"jsonrpc": "2.0", "id": 1, "method": "tools/call",
               "params": {"name": tool, "arguments": args}}
    data = json.dumps(payload).encode()
    # The VM SOV3 is HTTPS+key behind Caddy. macOS Python 3.9 LibreSSL fails Caddy's TLS
    # handshake (curl/system-TLS works), so route HTTPS SOV3 calls through curl, mirroring
    # _ask_local. Local http://localhost SOV3 uses urllib as normal.
    if SOV3_MCP.startswith("https"):
        import subprocess
        cmd = ["curl", "-sS", "--max-time", "120", SOV3_MCP,
               "-H", "Content-Type: application/json",
               "-H", "Accept: application/json, text/event-stream"]
        if _VM_KEY:
            cmd += ["-H", f"X-MEOK-Key: {_VM_KEY}"]
        cmd += ["-d", data.decode()]
        try:
            body = subprocess.run(cmd, capture_output=True, timeout=130).stdout.decode()
        except (subprocess.SubprocessError, OSError):
            return None
    else:
        req = urllib.request.Request(SOV3_MCP, method="POST", data=data,
                                     headers={"Content-Type": "application/json",
                                              "Accept": "application/json, text/event-stream"})
        try:
            with urllib.request.urlopen(req, timeout=60) as r:
                body = r.read().decode()
        except (urllib.error.URLError, TimeoutError, OSError):
            return None
    if "data:" in body:
        lines = [l[5:].strip() for l in body.splitlines() if l.startswith("data:")]
        body = lines[-1] if lines else body
    try:
        env = json.loads(body)
        content = env.get("result", {}).get("content", [])
        if content and content[0].get("type") == "text":
            return json.loads(content[0]["text"]).get("response")
    except (json.JSONDecodeError, KeyError, IndexError):
        return None
    return None




def _ask_gemini(model_id: str, prompt: str, max_tokens: "int | None" = None) -> "tuple":
    """Direct Google Gemini (AI Studio key, AIza...). The right-brain engine on Nick's
    £742/free-tier credit — no OpenRouter needed. Returns (reply, note)."""
    key = os.environ.get("GOOGLE_API_KEY", "")
    if not key.startswith("AIza"):
        return None, "gemini not configured (set GOOGLE_API_KEY=AIza... in .env.local)"
    # accept ids like 'google/gemini-flash-latest' or 'gemini-flash-latest'
    m = model_id.split("/")[-1]
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{m}:generateContent?key={key}"
    _payload = {"contents": [{"parts": [{"text": prompt}]}]}
    if max_tokens:
        _payload["generationConfig"] = {"maxOutputTokens": int(max_tokens)}
    body = json.dumps(_payload).encode()
    req = urllib.request.Request(url, data=body,
                                 headers={"Content-Type": "application/json"}, method="POST")
    try:
        with urllib.request.urlopen(req, timeout=60) as r:
            d = json.loads(r.read().decode())
        return d["candidates"][0]["content"]["parts"][0]["text"], f"gemini:{m}"
    except urllib.error.HTTPError as e:
        return None, f"gemini {e.code}"
    except Exception as e:
        return None, f"gemini error: {type(e).__name__}"


def _ask_cloud(model_id: str, prompt: str, max_tokens: "int | None" = None,
               provider: "list | None" = None) -> "tuple":
    """Cloud. Gemini direct (Google AI Studio key) takes priority when the model is a
    Gemini/Gemma id or only GOOGLE_API_KEY is set; else OpenRouter (BYOK). Honest 'not
    configured' rather than pretending. Governance-wrapper path, NOT token resale."""
    mlow = model_id.lower()
    _has_or = bool(os.environ.get("OPENROUTER_API_KEY"))
    # PRIORITY FIX: if OpenRouter is configured, use it FIRST (it's fast + not free-tier
    # rate-limited). Direct Gemini (Google AI Studio free key) 429s constantly and the
    # fall-through added a ~19s tax that made chat "hang". Only use direct Gemini when
    # there's NO OpenRouter key. (Was: Gemini-first-then-fallback → slow.)
    if ("gemini" in mlow or "gemma" in mlow) and not _has_or:
        reply, note = _ask_gemini(model_id, prompt, max_tokens)
        return (reply, note) if reply else (None, note)
    key = os.environ.get("OPENROUTER_API_KEY", "")
    if not key:
        return None, "cloud not configured (set GOOGLE_API_KEY=AIza... or OPENROUTER_API_KEY)"
    # normalise bare provider ids to OpenRouter's "provider/model" form
    _OR_MAP = {"gemini-flash-latest": "google/gemini-2.5-flash",
               "gemini-flash-lite-latest": "google/gemini-2.5-flash-lite",
               "gemini-pro-latest": "google/gemini-2.5-pro",
               "gemma-4-31b-it": "google/gemini-2.5-flash"}
    or_model = _OR_MAP.get(model_id, model_id)
    if "/" not in or_model:  # last-resort: a bare id OpenRouter won't know → use a safe default
        or_model = "google/gemini-2.5-flash"
    _orp = {"model": or_model, "messages": [{"role": "user", "content": prompt}]}
    if max_tokens:
        _orp["max_tokens"] = int(max_tokens)
    if provider:  # route to ultra-fast inference (Groq/Cerebras ~5x); fall back if unserved
        _orp["provider"] = {"order": list(provider), "allow_fallbacks": True}
    body = json.dumps(_orp).encode()
    req = urllib.request.Request("https://openrouter.ai/api/v1/chat/completions",
                                 data=body, headers={"Authorization": f"Bearer {key}",
                                                     "Content-Type": "application/json"})
    try:
        with urllib.request.urlopen(req, timeout=60) as r:
            data = json.loads(r.read().decode())
            return data["choices"][0]["message"]["content"], "openrouter"
    except Exception as e:
        return None, f"cloud error: {type(e).__name__}"


def ask(prompt: str, model: str = "auto", tier: str = "free", max_tokens: "int | None" = None,
        provider: "list | None" = None) -> dict:
    """Route a prompt to a model the tier is allowed to use. Returns
    {reply, model, backend, source}. model='auto' picks the best allowed backend
    (local→sov3→cloud). Honest: no fabrication; says when nothing answered.
    max_tokens caps the output (SIGIL bounded-verdict: terse lens reviews → far faster).
    provider pins OpenRouter inference providers, e.g. ["Groq","Cerebras"] (~5x faster)."""
    allowed = _TIER_BACKENDS.get(tier, {"local"})

    # resolve which (backend, id) to try
    if model == "auto":
        order = []
        if "local" in allowed: order.append(("local", "qwen2.5:3b"))   # present on the GCP VM (qwen3:8b is not)
        if "sov3" in allowed:  order.append(("sov3", "hermes_ask"))
        if "cloud" in allowed:
            # prefer direct Gemini when its key is present (Nick's credit); else OpenRouter
            order.append(("cloud", "gemini-flash-latest"
                          if os.environ.get("GOOGLE_API_KEY", "").startswith("AIza")
                          else "openai/gpt-4o"))
    else:
        if model not in MODELS:
            return {"reply": None, "model": model, "backend": None,
                    "source": "error", "note": f"unknown model {model!r}; see list_models()"}
        backend, mid = MODELS[model]
        if backend not in allowed:
            return {"reply": None, "model": model, "backend": backend, "source": "tier-blocked",
                    "note": f"tier {tier!r} can't use {backend} models; upgrade or pick a local model"}
        order = [(backend, mid)]

    for backend, mid in order:
        if backend == "local":
            reply = _ask_local(mid, prompt, max_tokens)
            if reply:
                return {"reply": _strip_thinking(reply), "model": mid,
                        "backend": "local", "source": "ollama"}
        elif backend == "sov3":
            reply = _ask_sov3(mid, prompt)
            if reply:
                return {"reply": _strip_thinking(reply), "model": mid,
                        "backend": "sov3", "source": f"sov3:{mid}"}
        elif backend == "cloud":
            reply, note = _ask_cloud(mid, prompt, max_tokens, provider)
            if reply:
                return {"reply": _strip_thinking(reply), "model": mid,
                        "backend": "cloud", "source": note}

    return {"reply": None, "model": model, "backend": None, "source": "no-backend",
            "note": f"no allowed backend answered for tier {tier!r}. "
                    f"Local needs Ollama on :11434; cloud needs OPENROUTER_API_KEY."}


if __name__ == "__main__":
    import sys
    m = sys.argv[1] if len(sys.argv) > 1 else "auto"
    q = sys.argv[2] if len(sys.argv) > 2 else "Say hello in 5 words."
    print(f"=== MEOK ONE router: model={m} ===")
    out = ask(q, model=m, tier="pro")
    print(f"  backend={out['backend']} source={out['source']}")
    print(f"  reply: {out['reply'] or out.get('note')}")
