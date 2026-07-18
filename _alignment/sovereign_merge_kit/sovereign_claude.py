#!/usr/bin/env python3
"""sovereign_claude.py — add CLAUDE to the mix as a top-tier reasoning backend (via the Anthropic API).

Claude is closed-weight, so it can't run locally next to the open models — but it CAN be a backend the
router calls, the same way it calls Groq/NVIDIA. This is the honest 'add Claude to the brains' path:
Claude as the deep-reasoning tier, on tap when you want it.

Honest notes:
  - The Anthropic API is NOT OpenAI-compatible (different endpoint/headers), so this is its own small client.
  - Key comes from ANTHROPIC_API_KEY env — never handled/logged here.
  - It is PAID. Off by default (no key = unavailable). The free open stack does the everyday work; reach for
    Claude only when a task genuinely needs the strongest reasoning. Model defaults to a cost-sane choice.
"""
import os, json, urllib.request

MODEL = os.environ.get("CLAUDE_MODEL", "claude-haiku-4-5-20251001")   # cost-sane default; set opus for hardest tasks
API = "https://api.anthropic.com/v1/messages"

def available():
    return bool(os.environ.get("ANTHROPIC_API_KEY"))

def claude_chat(prompt, system=None, max_tokens=400, temperature=0.2, model=None):
    """Call Claude via the Messages API. Returns text, or None if no key / on any error (router falls back)."""
    key = os.environ.get("ANTHROPIC_API_KEY")
    if not key:
        return None
    key = key.strip().strip('"').strip("'")
    body = {"model": model or MODEL, "max_tokens": max_tokens, "temperature": temperature,
            "messages": [{"role": "user", "content": prompt}]}
    if system:
        body["system"] = system
    hdr = {"Content-Type": "application/json", "x-api-key": key, "anthropic-version": "2023-06-01"}
    req = urllib.request.Request(API, data=json.dumps(body).encode(), headers=hdr)
    try:
        r = json.loads(urllib.request.urlopen(req, timeout=90).read())
        # Messages API returns content as a list of blocks; concatenate text blocks
        return "".join(b.get("text", "") for b in r.get("content", []) if b.get("type") == "text").strip() or None
    except Exception:
        return None

if __name__ == "__main__":
    print(f"Claude backend available: {available()}  ·  model: {MODEL}")
    if available():
        print("sample:", claude_chat("In one sentence, what is a signed sovereign AI decision?", max_tokens=60))
    else:
        print("Set ANTHROPIC_API_KEY to add Claude to the mix (paid; off by default).")
