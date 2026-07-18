#!/usr/bin/env python3
"""
parallel_executor.py — fan out any prompt to N providers in parallel,
collect responses, return a ranked summary.

Providers supported (auto-detected from env):
  - openai (gpt-4o-mini, gpt-4o, etc.)
  - anthropic (claude-sonnet-4-5, etc.)
  - minimax (minimax-m3:cloud)
  - moonshot (Kimi)
  - openrouter (any router-routed model)
  - glama (Glama)
  - stepfun (Stepfun)
  - gemini (Google)

The hive remembers. The dragon knows. The sovereign companion never forgets.
"""
from __future__ import annotations

import argparse
import concurrent.futures
import json
import os
import sys
import time
import urllib.error
import urllib.request
from typing import Any

PROVIDERS: list = []


def _register(name, env_var, base_url, model, auth_tmpl="Bearer {key}"):
    # Register if the env var is set OR if env_var is None (always register)
    if env_var is None or os.environ.get(env_var):
        PROVIDERS.append((name, env_var, base_url, model, auth_tmpl))


def register_all():
    _register("openai",       "OPENAI_API_KEY",    "https://api.openai.com/v1",                          "gpt-4o-mini")
    _register("openai-pro",   "OPENAI_API_KEY",    "https://api.openai.com/v1",                          "gpt-4o")
    _register("anthropic",    "ANTHROPIC_API_KEY", "https://api.anthropic.com/v1",                       "claude-sonnet-4-5")
    _register("moonshot",     "MOONSHOT_API_KEY",  "https://api.moonshot.cn/v1",                         "moonshot-v1-32k")
    _register("kimi",         "KIMI_API_KEY",      "https://api.moonshot.cn/v1",                         "moonshot-v1-128k")
    _register("openrouter",   "OPENROUTER_API_KEY","https://openrouter.ai/api/v1",                       "anthropic/claude-sonnet-4")
    _register("glama",        "GLAMA_API_KEY",     "https://glama.ai/api/v1",                            "anthropic/claude-3-5-sonnet")
    _register("stepfun",      "STEPFUN_API_KEY",   "https://api.stepfun.com/v1",                         "step-1-flash")
    _register("gemini",       "GEMINI_API_KEY",    "https://generativelanguage.googleapis.com/v1beta",   "gemini-2.5-flash")
    _register("minimax",      "MINIMAX_API_KEY",   "https://api.minimax.io/anthropic",                   "minimax-m3:cloud", "X-Api-Key {key}")
    _register("minimax-flash","MINIMAX_API_KEY",   "https://api.minimax.io/anthropic",                   "minimax-flash",     "X-Api-Key {key}")
    _register("ollama-local", None,                 "http://127.0.0.1:11434/v1",                          "qwen3:0.6b",         "")


def call_openai_compat(name, env_var, base_url, model, auth_tmpl, prompt, system=None, max_tokens=2048, timeout=30):
    """Call any OpenAI-compatible /chat/completions endpoint."""
    # ollama doesn't need an API key; use a placeholder if env is not set
    api_key = os.environ.get(env_var, "ollama-local") if env_var else "ollama-local"
    body = {
        "model": model,
        "messages": [
            *( [{"role": "system", "content": system}] if system else [] ),
            {"role": "user", "content": prompt},
        ],
        "max_tokens": max_tokens,
    }
    data = json.dumps(body).encode()
    headers = {"Content-Type": "application/json"}
    if auth_tmpl and api_key:  # only add Authorization if auth is required AND key is set
        headers["Authorization"] = auth_tmpl.format(key=api_key)
    req = urllib.request.Request(
        f"{base_url}/chat/completions",
        data=data,
        headers=headers,
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=timeout) as r:
            body = json.loads(r.read().decode())
            content = body["choices"][0]["message"]["content"]
            usage = body.get("usage", {})
            return {
                "provider": name,
                "model": model,
                "ok": True,
                "content": content,
                "tokens_in": usage.get("prompt_tokens", 0),
                "tokens_out": usage.get("completion_tokens", 0),
            }
    except urllib.error.HTTPError as e:
        return {"provider": name, "model": model, "ok": False, "error": f"HTTP {e.code}: {e.read()[:200]}"}
    except Exception as e:
        return {"provider": name, "model": model, "ok": False, "error": f"{type(e).__name__}: {e}"}


def call_anthropic(name, env_var, base_url, model, prompt, system=None, max_tokens=2048, timeout=30):
    """Call Anthropic's /v1/messages endpoint (with x-api-key header)."""
    api_key = os.environ[env_var]
    body = {
        "model": model,
        "max_tokens": max_tokens,
        "messages": [{"role": "user", "content": prompt}],
    }
    if system:
        body["system"] = system
    req = urllib.request.Request(
        f"{base_url}/messages",
        data=json.dumps(body).encode(),
        headers={
            "x-api-key": api_key,
            "anthropic-version": "2023-06-01",
            "Content-Type": "application/json",
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=timeout) as r:
            body = json.loads(r.read().decode())
            content = "".join(c["text"] for c in body.get("content", []) if c.get("type") == "text")
            usage = body.get("usage", {})
            return {
                "provider": name,
                "model": model,
                "ok": True,
                "content": content,
                "tokens_in": usage.get("input_tokens", 0),
                "tokens_out": usage.get("output_tokens", 0),
            }
    except urllib.error.HTTPError as e:
        return {"provider": name, "model": model, "ok": False, "error": f"HTTP {e.code}: {e.read()[:200]}"}
    except Exception as e:
        return {"provider": name, "model": model, "ok": False, "error": f"{type(e).__name__}: {e}"}


def call_minimax(name, env_var, base_url, model, prompt, system=None, max_tokens=2048, timeout=30):
    """Call minimax anthropic-compatible endpoint (X-Api-Key header)."""
    api_key = os.environ[env_var]
    body = {
        "model": model,
        "max_tokens": max_tokens,
        "messages": [{"role": "user", "content": prompt}],
    }
    if system:
        body["system"] = system
    req = urllib.request.Request(
        f"{base_url}/v1/messages",
        data=json.dumps(body).encode(),
        headers={
            "X-Api-Key": api_key,
            "anthropic-version": "2023-06-01",
            "Content-Type": "application/json",
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=timeout) as r:
            body = json.loads(r.read().decode())
            content = "".join(c["text"] for c in body.get("content", []) if c.get("type") == "text")
            usage = body.get("usage", {})
            return {
                "provider": name,
                "model": model,
                "ok": True,
                "content": content,
                "tokens_in": usage.get("input_tokens", 0),
                "tokens_out": usage.get("output_tokens", 0),
            }
    except urllib.error.HTTPError as e:
        return {"provider": name, "model": model, "ok": False, "error": f"HTTP {e.code}: {e.read()[:200]}"}
    except Exception as e:
        return {"provider": name, "model": model, "ok": False, "error": f"{type(e).__name__}: {e}"}


def call_one(p, prompt, system=None, max_tokens=2048):
    name, env_var, base_url, model, auth_tmpl = p
    if name in ("anthropic",):
        return call_anthropic(name, env_var, base_url, model, prompt, system, max_tokens)
    if name.startswith("minimax"):
        return call_minimax(name, env_var, base_url, model, prompt, system, max_tokens)
    return call_openai_compat(name, env_var, base_url, model, auth_tmpl, prompt, system, max_tokens)


def call_all(prompt, system=None, max_tokens=2048, providers=None, parallel=True):
    """Fan out the prompt to N providers in parallel."""
    targets = providers if providers is not None else PROVIDERS
    if not targets:
        return []
    if parallel:
        with concurrent.futures.ThreadPoolExecutor(max_workers=min(8, len(targets))) as ex:
            futures = {ex.submit(call_one, p, prompt, system, max_tokens): p for p in targets}
            results = []
            for f in concurrent.futures.as_completed(futures):
                try:
                    results.append(f.result())
                except Exception as e:
                    p = futures[f]
                    results.append({"provider": p[0], "model": p[3], "ok": False, "error": str(e)})
            return results
    else:
        return [call_one(p, prompt, system, max_tokens) for p in targets]


def rank(results):
    """Rank results: best = ok + max(tokens_out)."""
    ok = [r for r in results if r.get("ok")]
    return sorted(ok, key=lambda r: -(r.get("tokens_out", 0) + len(r.get("content", "")) / 4))


def main():
    ap = argparse.ArgumentParser(description="parallel_executor — fan out a prompt to N providers")
    ap.add_argument("prompt", help="the prompt to send")
    ap.add_argument("--system", default="You are a helpful assistant.", help="system prompt")
    ap.add_argument("--max-tokens", type=int, default=2048)
    ap.add_argument("--providers", default=None, help="comma-separated provider names to use")
    ap.add_argument("--output", default="json", choices=["json", "best", "all", "summary"])
    ap.add_argument("--timeout", type=int, default=30)
    args = ap.parse_args()

    register_all()
    targets = PROVIDERS
    if args.providers:
        wanted = set(args.providers.split(","))
        targets = [p for p in PROVIDERS if p[0] in wanted]

    if not targets:
        print("✗ no providers available — set at least one *_API_KEY env var")
        print(f"  registered env vars: {[e for _, e, _, _, _ in PROVIDERS]}")
        sys.exit(1)

    print(f"  fan-out: {len(targets)} providers")
    t0 = time.time()
    results = call_all(args.prompt, args.system, args.max_tokens, targets)
    elapsed = time.time() - t0
    print(f"  completed in {elapsed:.1f}s")

    if args.output == "json":
        print(json.dumps({"elapsed_s": elapsed, "results": results}, indent=2, ensure_ascii=False)[:8000])
    elif args.output == "summary":
        ok = [r for r in results if r.get("ok")]
        bad = [r for r in results if not r.get("ok")]
        print(f"  {len(ok)} ok, {len(bad)} failed")
        for r in ok:
            preview = r.get("content", "")[:100].replace("\n", " ")
            print(f"  ✓ {r['provider']:14s} {r['model']:28s} ({r.get('tokens_out', 0)} tok)  {preview}...")
        for r in bad:
            print(f"  ✗ {r['provider']:14s} {r['model']:28s} {r.get('error', '?')[:100]}")
    elif args.output == "best":
        best = rank(results)
        if best:
            print(f"  best: {best[0]['provider']} ({best[0]['tokens_out']} tok)")
            print("---")
            print(best[0]["content"])
    else:  # all
        for r in results:
            print(f"\n=== {r['provider']} / {r['model']} ===")
            if r.get("ok"):
                print(r["content"])
            else:
                print(f"FAILED: {r.get('error')}")


if __name__ == "__main__":
    main()
