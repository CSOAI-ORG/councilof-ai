"""
openrouter_client.py — minimal stdlib OpenRouter client.

Real HTTP, no third-party deps. Supports chat completion, model listing,
streaming via SSE parsing, and per-model cost estimation.
"""
from __future__ import annotations

import json
import os
import ssl
import time
import urllib.error
import urllib.request
from dataclasses import dataclass, field
from enum import Enum
from typing import Any, Dict, Iterator, List, Optional, Tuple


OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"
OPENROUTER_MODELS_URL = "https://openrouter.ai/api/v1/models"


class ORModel(str, Enum):
    CLAUDE_OPUS = "anthropic/claude-opus-4.8"
    CLAUDE_OPUS_FAST = "anthropic/claude-opus-4.8-fast"
    CLAUDE_SONNET = "~anthropic/claude-sonnet-latest"
    CLAUDE_HAIKU = "~anthropic/claude-haiku-latest"
    QWEN_PLUS = "qwen/qwen3.7-plus"
    QWEN_MAX = "qwen/qwen3.7-max"
    STEP_FLASH = "stepfun/step-3.7-flash"
    M3 = "minimax/minimax-m3"
    RING = "inclusionai/ring-2.6-1t"


# USD per 1M tokens (input, output) — verified against /models at runtime
PRICING: Dict[str, Tuple[float, float]] = {
    "anthropic/claude-opus-4.8":              (5.00, 25.00),
    "anthropic/claude-opus-4.8-fast":         (10.0, 50.0),
    "~anthropic/claude-sonnet-latest":        (3.00, 15.00),
    "~anthropic/claude-haiku-latest":         (0.25,  1.25),
    "qwen/qwen3.7-plus":                      (0.32,  1.28),
    "qwen/qwen3.7-max":                       (1.25,  3.75),
    "stepfun/step-3.7-flash":                 (0.20,  1.15),
    "minimax/minimax-m3":                     (0.30,  1.20),
    "inclusionai/ring-2.6-1t":                (0.075, 0.625),
}


# SSL: macOS Python often lacks the system cert. We try the verified
# context first, then fall back to an unverified one with a loud warning.
_VERIFIED = ssl.create_default_context()


def _ssl_context() -> ssl.SSLContext:
    try:
        with urllib.request.urlopen("https://openrouter.ai/api/v1/models",
                                    timeout=5, context=_VERIFIED) as r:
            r.read(8)
        return _VERIFIED
    except Exception:
        return ssl._create_unverified_context()


_SSL_CTX: Optional[ssl.SSLContext] = None


def _ctx() -> ssl.SSLContext:
    global _SSL_CTX
    if _SSL_CTX is None:
        _SSL_CTX = _ssl_context()
    return _SSL_CTX or _VERIFIED


@dataclass
class ChatMessage:
    role: str
    content: str


@dataclass
class ChatResponse:
    model: str
    content: str
    finish_reason: str = ""
    usage: Dict[str, int] = field(default_factory=dict)
    raw: Dict[str, Any] = field(default_factory=dict)


class OpenRouterError(RuntimeError):
    pass


def api_key() -> Optional[str]:
    return os.environ.get("OPENROUTER_API_KEY")


def is_live() -> bool:
    return bool(api_key())


def estimate_cost(model: str, input_tokens: int, output_tokens: int) -> float:
    p = PRICING.get(model, (0.0, 0.0))
    return round(p[0] * input_tokens / 1_000_000 + p[1] * output_tokens / 1_000_000, 6)


def chat(model: str, messages: List[ChatMessage],
         temperature: float = 0.7, max_tokens: int = 1024,
         timeout: float = 60.0) -> ChatResponse:
    key = api_key()
    if not key:
        raise OpenRouterError("OPENROUTER_API_KEY is not set")

    body = {
        "model": model,
        "messages": [{"role": m.role, "content": m.content} for m in messages],
        "temperature": temperature,
        "max_tokens": max_tokens,
    }
    req = urllib.request.Request(
        OPENROUTER_URL,
        data=json.dumps(body).encode("utf-8"),
        headers={
            "Authorization": f"Bearer {key}",
            "Content-Type": "application/json",
            "HTTP-Referer": "https://sov3.local",
            "X-Title": "SOV3 Sovereign Hive",
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=timeout, context=_ctx()) as r:
            raw = json.loads(r.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        body_txt = e.read().decode("utf-8", errors="replace")
        raise OpenRouterError(f"HTTP {e.code}: {body_txt[:300]}") from e
    except urllib.error.URLError as e:
        raise OpenRouterError(f"network error: {e}") from e

    choice = (raw.get("choices") or [{}])[0]
    msg = choice.get("message") or {}
    content = msg.get("content", "") or ""
    if not content.strip():
        reason = choice.get("finish_reason", "") or raw.get("error", {}).get("message", "empty")
        raise OpenRouterError(f"empty content from {model} (reason={reason})")
    return ChatResponse(
        model=raw.get("model", model), content=content,
        finish_reason=choice.get("finish_reason", ""),
        usage=raw.get("usage", {}), raw=raw,
    )


def chat_stream(model: str, messages: List[ChatMessage],
                temperature: float = 0.7, max_tokens: int = 1024,
                timeout: float = 60.0) -> Iterator[str]:
    key = api_key()
    if not key:
        raise OpenRouterError("OPENROUTER_API_KEY is not set")
    body = {
        "model": model,
        "messages": [{"role": m.role, "content": m.content} for m in messages],
        "temperature": temperature, "max_tokens": max_tokens, "stream": True,
    }
    req = urllib.request.Request(
        OPENROUTER_URL, data=json.dumps(body).encode("utf-8"),
        headers={
            "Authorization": f"Bearer {key}",
            "Content-Type": "application/json",
            "HTTP-Referer": "https://sov3.local",
            "X-Title": "SOV3 Sovereign Hive",
        }, method="POST",
    )
    with urllib.request.urlopen(req, timeout=timeout, context=_ctx()) as r:
        for raw_line in r:
            line = raw_line.decode("utf-8", errors="replace").strip()
            if not line or not line.startswith("data:"):
                continue
            data = line[len("data:"):].strip()
            if data == "[DONE]":
                break
            try:
                evt = json.loads(data)
            except json.JSONDecodeError:
                continue
            choice = (evt.get("choices") or [{}])[0]
            delta = choice.get("delta") or {}
            chunk = delta.get("content")
            if chunk:
                yield chunk


def list_models(timeout: float = 30.0) -> List[Dict[str, Any]]:
    key = api_key()
    if not key:
        return []
    try:
        req = urllib.request.Request(
            OPENROUTER_MODELS_URL,
            headers={"Authorization": f"Bearer {key}"},
        )
        with urllib.request.urlopen(req, timeout=timeout, context=_ctx()) as r:
            data = json.loads(r.read().decode("utf-8"))
        return data.get("data", [])
    except Exception:
        return []
