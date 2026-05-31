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


def _ask_local(model_id: str, prompt: str) -> "str | None":
    body = json.dumps({"model": model_id, "prompt": prompt, "stream": False}).encode()
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
    req = urllib.request.Request(SOV3_MCP, method="POST", data=json.dumps(payload).encode(),
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


def _load_env_local():
    """Load meok-one/.env.local (gitignored) so GOOGLE_API_KEY etc. are available."""
    p = os.path.join(os.path.dirname(os.path.dirname(__file__)), ".env.local")
    if os.path.exists(p):
        for line in open(p):
            if "=" in line and not line.strip().startswith("#"):
                k, v = line.split("=", 1)
                os.environ.setdefault(k.strip(), v.strip())
_load_env_local()


def _ask_gemini(model_id: str, prompt: str) -> "tuple":
    """Direct Google Gemini (AI Studio key, AIza...). The right-brain engine on Nick's
    £742/free-tier credit — no OpenRouter needed. Returns (reply, note)."""
    key = os.environ.get("GOOGLE_API_KEY", "")
    if not key.startswith("AIza"):
        return None, "gemini not configured (set GOOGLE_API_KEY=AIza... in .env.local)"
    # accept ids like 'google/gemini-flash-latest' or 'gemini-flash-latest'
    m = model_id.split("/")[-1]
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{m}:generateContent?key={key}"
    body = json.dumps({"contents": [{"parts": [{"text": prompt}]}]}).encode()
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


def _ask_cloud(model_id: str, prompt: str) -> "tuple":
    """Cloud. Gemini direct (Google AI Studio key) takes priority when the model is a
    Gemini/Gemma id or only GOOGLE_API_KEY is set; else OpenRouter (BYOK). Honest 'not
    configured' rather than pretending. Governance-wrapper path, NOT token resale."""
    mlow = model_id.lower()
    if "gemini" in mlow or "gemma" in mlow or (os.environ.get("GOOGLE_API_KEY", "").startswith("AIza")
                                               and not os.environ.get("OPENROUTER_API_KEY")):
        reply, note = _ask_gemini(model_id, prompt)
        if reply:
            return reply, note
        # if gemini failed AND no openrouter, return the gemini note honestly
        if not os.environ.get("OPENROUTER_API_KEY"):
            return None, note
    key = os.environ.get("OPENROUTER_API_KEY", "")
    if not key:
        return None, "cloud not configured (set GOOGLE_API_KEY=AIza... or OPENROUTER_API_KEY)"
    body = json.dumps({"model": model_id,
                       "messages": [{"role": "user", "content": prompt}]}).encode()
    req = urllib.request.Request("https://openrouter.ai/api/v1/chat/completions",
                                 data=body, headers={"Authorization": f"Bearer {key}",
                                                     "Content-Type": "application/json"})
    try:
        with urllib.request.urlopen(req, timeout=60) as r:
            data = json.loads(r.read().decode())
            return data["choices"][0]["message"]["content"], "openrouter"
    except Exception as e:
        return None, f"cloud error: {type(e).__name__}"


def ask(prompt: str, model: str = "auto", tier: str = "free") -> dict:
    """Route a prompt to a model the tier is allowed to use. Returns
    {reply, model, backend, source}. model='auto' picks the best allowed backend
    (local→sov3→cloud). Honest: no fabrication; says when nothing answered."""
    allowed = _TIER_BACKENDS.get(tier, {"local"})

    # resolve which (backend, id) to try
    if model == "auto":
        order = []
        if "local" in allowed: order.append(("local", "qwen3:8b"))
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
            reply = _ask_local(mid, prompt)
            if reply:
                return {"reply": _strip_thinking(reply), "model": mid,
                        "backend": "local", "source": "ollama"}
        elif backend == "sov3":
            reply = _ask_sov3(mid, prompt)
            if reply:
                return {"reply": _strip_thinking(reply), "model": mid,
                        "backend": "sov3", "source": f"sov3:{mid}"}
        elif backend == "cloud":
            reply, note = _ask_cloud(mid, prompt)
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
