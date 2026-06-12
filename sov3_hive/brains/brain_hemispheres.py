"""
brain_hemispheres.py — the Right/Left Brain hemispheres.

A Brain speaks OpenRouter and returns a structured BrainReply. The
King routes SIGIL messages to a brain based on hemisphere, but the
brains can be swapped live (one-line) without restarting the hive.

Default pairing:
  Right (synthesis): Claude Opus 4.8 — temp 0.8
  Left  (analysis) : Qwen 3.7 Plus  — temp 0.3

Falls back to a deterministic simulator if OPENROUTER_API_KEY is unset.
"""
from __future__ import annotations

import os
import time
from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional

from .openrouter_client import (
    ORModel, ChatMessage, ChatResponse, OpenRouterError,
    api_key, chat, chat_stream, estimate_cost,
)


@dataclass
class BrainConfig:
    name: str
    model: str
    temperature: float = 0.7
    system_prompt: str = ""
    hemisphere: str = "right"
    max_tokens: int = 1024
    fallback_model: Optional[str] = None


PRESETS: Dict[str, BrainConfig] = {
    "right_claude_opus": BrainConfig(
        name="Claude Opus 4.8 (Right, deep)",
        model=ORModel.CLAUDE_OPUS.value,
        temperature=0.8, hemisphere="right",
        system_prompt=(
            "You are the right hemisphere of the SOV3 Sovereign Hive. "
            "Synthesize, see patterns, generate language, intuit meaning, frame ideas. "
            "Speak in clear prose. No bullet lists unless asked."
        ),
        fallback_model=ORModel.STEP_FLASH.value,
    ),
    "right_claude_opus_fast": BrainConfig(
        name="Claude Opus 4.8 fast (Right, fast)",
        model=ORModel.CLAUDE_OPUS_FAST.value,
        temperature=0.7, hemisphere="right",
        system_prompt="You are the right hemisphere of SOV3. Be concise and warm.",
        fallback_model=ORModel.STEP_FLASH.value,
    ),
    "right_claude_sonnet": BrainConfig(
        name="Claude Sonnet (Right)",
        model=ORModel.CLAUDE_SONNET.value,
        temperature=0.8, hemisphere="right",
        system_prompt="You are the right hemisphere of SOV3. Synthesize gently.",
        fallback_model=ORModel.STEP_FLASH.value,
    ),
    "right_claude_haiku": BrainConfig(
        name="Claude Haiku (Right, fast)",
        model=ORModel.CLAUDE_HAIKU.value,
        temperature=0.7, hemisphere="right",
        system_prompt="You are the right hemisphere of SOV3. Be concise.",
        fallback_model=ORModel.STEP_FLASH.value,
    ),
    "left_qwen_plus": BrainConfig(
        name="Qwen 3.7 Plus (Left)",
        model=ORModel.QWEN_PLUS.value,
        temperature=0.3, hemisphere="left",
        system_prompt=(
            "You are the left hemisphere of the SOV3 Sovereign Hive. "
            "Analyze, decompose, structure, write code, reason step by step. "
            "Be precise. Show your work."
        ),
        fallback_model=ORModel.STEP_FLASH.value,
    ),
    "left_qwen_max": BrainConfig(
        name="Qwen 3.7 Max (Left, reasoner)",
        model=ORModel.QWEN_MAX.value,
        temperature=0.2, hemisphere="left",
        system_prompt=(
            "You are the left hemisphere of SOV3 in deep-reasoning mode. "
            "Think out loud, then give a clean final answer."
        ),
        fallback_model=ORModel.QWEN_PLUS.value,
    ),
    "left_step_flash": BrainConfig(
        name="Step 3.7 Flash (Left, fast)",
        model=ORModel.STEP_FLASH.value,
        temperature=0.3, hemisphere="left",
        system_prompt="You are the left hemisphere of SOV3. Be brief and exact.",
        fallback_model=ORModel.QWEN_PLUS.value,
    ),
    "left_m3": BrainConfig(
        name="M3 (Left, MiniMax M3)",
        model=ORModel.M3.value,
        temperature=0.3, hemisphere="left",
        system_prompt="You are the left hemisphere of SOV3 powered by M3. Be sharp.",
    ),
}


@dataclass
class BrainReply:
    config_name: str
    model: str
    hemisphere: str
    text: str
    live: bool
    input_tokens: int = 0
    output_tokens: int = 0
    cost_usd: float = 0.0
    latency_ms: float = 0.0
    fallback_used: bool = False
    error: Optional[str] = None

    def __getitem__(self, key: str) -> Any:
        return getattr(self, key)


class Brain:
    def __init__(self, config: BrainConfig) -> None:
        self.config = config
        self.total_input_tokens = 0
        self.total_output_tokens = 0
        self.total_cost_usd = 0.0
        self.total_calls = 0
        self.live_calls = 0
        self.fallback_calls = 0

    def swap(self, config: BrainConfig) -> BrainConfig:
        old = self.config
        self.config = config
        return old

    def _simulate(self, prompt: str) -> str:
        if self.config.hemisphere == "right":
            return (
                f"[right-brain:{self.config.name} simulated] "
                f"On \"{prompt[:80]}\" — synthesis-leaning: "
                f"a frame, a metaphor, the soft edges of the problem. "
                f"Imagine the idea as a place you could walk into."
            )
        return (
            f"[left-brain:{self.config.name} simulated] "
            f"On \"{prompt[:80]}\" — step-by-step: 1) parse, 2) decompose, "
            f"3) identify constraints, 4) propose minimal solution, 5) verify. "
            f"First-order answer: deterministic path."
        )

    def ask(self, prompt: str, *, max_tokens: Optional[int] = None,
            temperature: Optional[float] = None) -> BrainReply:
        self.total_calls += 1
        max_tokens = max_tokens or self.config.max_tokens
        temperature = temperature if temperature is not None else self.config.temperature
        messages = []
        if self.config.system_prompt:
            messages.append(ChatMessage("system", self.config.system_prompt))
        messages.append(ChatMessage("user", prompt))

        if not api_key():
            return BrainReply(
                config_name=self.config.name, model=self.config.model,
                hemisphere=self.config.hemisphere,
                text=self._simulate(prompt), live=False, latency_ms=0.1,
            )

        t0 = time.time()
        try:
            resp = chat(self.config.model, messages,
                        temperature=temperature, max_tokens=max_tokens)
            self.live_calls += 1
            inp = int(resp.usage.get("prompt_tokens", 0))
            outp = int(resp.usage.get("completion_tokens", 0))
            self.total_input_tokens += inp
            self.total_output_tokens += outp
            cost = estimate_cost(self.config.model, inp, outp)
            self.total_cost_usd += cost
            return BrainReply(
                config_name=self.config.name,
                model=resp.model or self.config.model,
                hemisphere=self.config.hemisphere,
                text=resp.content, live=True,
                input_tokens=inp, output_tokens=outp,
                cost_usd=cost, latency_ms=(time.time() - t0) * 1000.0,
            )
        except OpenRouterError as e:
            if self.config.fallback_model and self.config.fallback_model != self.config.model:
                try:
                    self.fallback_calls += 1
                    resp = chat(self.config.fallback_model, messages,
                                temperature=temperature, max_tokens=max_tokens)
                    inp = int(resp.usage.get("prompt_tokens", 0))
                    outp = int(resp.usage.get("completion_tokens", 0))
                    self.total_input_tokens += inp
                    self.total_output_tokens += outp
                    cost = estimate_cost(self.config.fallback_model, inp, outp)
                    self.total_cost_usd += cost
                    return BrainReply(
                        config_name=self.config.name + " [fallback]",
                        model=resp.model, hemisphere=self.config.hemisphere,
                        text=resp.content, live=True, fallback_used=True,
                        input_tokens=inp, output_tokens=outp,
                        cost_usd=cost, latency_ms=(time.time() - t0) * 1000.0,
                    )
                except Exception as inner:
                    return BrainReply(
                        config_name=self.config.name, model=self.config.model,
                        hemisphere=self.config.hemisphere,
                        text=self._simulate(prompt), live=False,
                        fallback_used=True,
                        latency_ms=(time.time() - t0) * 1000.0,
                        error=f"primary: {e}; fallback: {inner}",
                    )
            return BrainReply(
                config_name=self.config.name, model=self.config.model,
                hemisphere=self.config.hemisphere,
                text=self._simulate(prompt), live=False,
                latency_ms=(time.time() - t0) * 1000.0, error=str(e),
            )

    def stats(self) -> Dict[str, Any]:
        return {
            "name": self.config.name,
            "model": self.config.model,
            "hemisphere": self.config.hemisphere,
            "temperature": self.config.temperature,
            "total_calls": self.total_calls,
            "live_calls": self.live_calls,
            "fallback_calls": self.fallback_calls,
            "total_input_tokens": self.total_input_tokens,
            "total_output_tokens": self.total_output_tokens,
            "total_cost_usd": round(self.total_cost_usd, 6),
        }
