#!/usr/bin/env python3
"""
router.py — SOV3 model-agnostic backbone router (STUB / scaffold).

Routes a request across three tiers:

  TIER                MODEL                         LICENSE       ROLE
  ------------------  ----------------------------  ------------  -------------------------
  sovereign-offline   DeepSeek-V4-Flash (local)     MIT           local llama.cpp backbone
  sovereign-offline   Nemotron-3-Ultra (cloud)      OpenMDW-1.1   sovereign-grade fallback
  council-brain       Claude Opus 4.8 (hosted)      commercial    DEFAULT app/council brain

Design intent:
  * DeepSeek + Nemotron are the SOVEREIGN / OFFLINE-capable tier — used when the
    request must stay on owned/sovereign infra, or as cost-free local compute.
  * Claude (Opus 4.8) is the DEFAULT council brain — the app reaches for it unless
    a request is explicitly flagged sovereign/offline or local is forced.

This is a routing SCAFFOLD: backends are pluggable and the cloud call sites are
left as clearly-marked stubs. No network calls or model loads happen on import.
Fill in the `_call_*` methods with real clients when wiring up.
"""
from __future__ import annotations

import os
from dataclasses import dataclass, field
from enum import Enum
from typing import Optional


class Tier(str, Enum):
    SOVEREIGN_OFFLINE = "sovereign-offline"
    COUNCIL_BRAIN = "council-brain"


@dataclass(frozen=True)
class Backend:
    key: str
    model_id: str
    tier: Tier
    license: str
    endpoint: str                # http url, or "local" for the llama.cpp server
    is_default: bool = False
    notes: str = ""


# ---- Registry ---------------------------------------------------------------
# Sovereign-OFFLINE tier first (DeepSeek local, Nemotron cloud), council brain last.
BACKENDS: dict[str, Backend] = {
    "deepseek-v4-flash-local": Backend(
        key="deepseek-v4-flash-local",
        model_id="deepseek-ai/DeepSeek-V4-Flash",
        tier=Tier.SOVEREIGN_OFFLINE,
        license="MIT",
        endpoint=os.environ.get("SOV3_LOCAL_ENDPOINT", "http://127.0.0.1:8080/v1"),
        notes="Served by serve_backbone.sh via llama.cpp (Q4_K_M). The sovereign default.",
    ),
    "nemotron-3-ultra-cloud": Backend(
        key="nemotron-3-ultra-cloud",
        model_id="nvidia/nemotron-3-ultra",
        tier=Tier.SOVEREIGN_OFFLINE,
        license="OpenMDW-1.1",
        endpoint=os.environ.get("SOV3_NEMOTRON_ENDPOINT", "https://integrate.api.nvidia.com/v1"),
        notes="Sovereign-grade open-weights fallback. Cloud-hosted but self-hostable.",
    ),
    "claude-opus-4.8": Backend(
        key="claude-opus-4.8",
        model_id="claude-opus-4-8",          # default council/app brain
        tier=Tier.COUNCIL_BRAIN,
        license="commercial-hosted",
        endpoint=os.environ.get("SOV3_CLAUDE_ENDPOINT", "https://api.anthropic.com"),
        is_default=True,
        notes="DEFAULT app brain. Used unless request is flagged sovereign/offline.",
    ),
}


@dataclass
class RouteRequest:
    prompt: str
    # Routing controls:
    require_sovereign: bool = False   # must stay on sovereign-offline tier
    force_local: bool = False         # pin to the local DeepSeek backbone
    prefer_offline: bool = False      # try sovereign-offline first, fall back to brain
    system: Optional[str] = None
    max_tokens: int = 1024
    meta: dict = field(default_factory=dict)


@dataclass
class RouteResult:
    backend_key: str
    model_id: str
    tier: str
    text: str
    routed_because: str


class Router:
    """Model-agnostic dispatcher. Picks a Backend, then calls the right adapter."""

    def __init__(self, backends: Optional[dict[str, Backend]] = None):
        self.backends = backends or BACKENDS

    # ---- selection ----------------------------------------------------------
    def select(self, req: RouteRequest) -> tuple[Backend, str]:
        if req.force_local:
            return self.backends["deepseek-v4-flash-local"], "force_local=True"

        if req.require_sovereign or req.prefer_offline:
            # Prefer local DeepSeek; if unreachable, Nemotron; both are sovereign tier.
            if self._healthy("deepseek-v4-flash-local"):
                return self.backends["deepseek-v4-flash-local"], "sovereign tier: local DeepSeek"
            return self.backends["nemotron-3-ultra-cloud"], "sovereign tier: Nemotron fallback (local down)"

        # Default path: the council brain.
        for b in self.backends.values():
            if b.is_default:
                return b, "default council brain (Claude Opus 4.8)"
        raise RuntimeError("No default backend configured.")

    def route(self, req: RouteRequest) -> RouteResult:
        backend, why = self.select(req)
        text = self._dispatch(backend, req)
        return RouteResult(
            backend_key=backend.key,
            model_id=backend.model_id,
            tier=backend.tier.value,
            text=text,
            routed_because=why,
        )

    # ---- adapters (STUBS) ---------------------------------------------------
    def _dispatch(self, backend: Backend, req: RouteRequest) -> str:
        if backend.tier == Tier.COUNCIL_BRAIN:
            return self._call_claude(backend, req)
        if backend.key == "deepseek-v4-flash-local":
            return self._call_openai_compatible(backend, req)  # llama.cpp /v1
        if backend.key == "nemotron-3-ultra-cloud":
            return self._call_openai_compatible(backend, req)  # NIM /v1
        raise RuntimeError(f"No adapter for backend {backend.key}")

    def _call_openai_compatible(self, backend: Backend, req: RouteRequest) -> str:
        """STUB. Wire up an OpenAI-compatible client against backend.endpoint.
        Works for both the local llama.cpp server and NVIDIA NIM/Nemotron."""
        # from openai import OpenAI
        # client = OpenAI(base_url=backend.endpoint, api_key=os.environ.get("SOV3_API_KEY", "sk-local"))
        # resp = client.chat.completions.create(
        #     model=backend.model_id,
        #     messages=([{"role": "system", "content": req.system}] if req.system else [])
        #              + [{"role": "user", "content": req.prompt}],
        #     max_tokens=req.max_tokens,
        # )
        # return resp.choices[0].message.content
        return f"[STUB {backend.key} @ {backend.endpoint}] would answer: {req.prompt[:60]}..."

    def _call_claude(self, backend: Backend, req: RouteRequest) -> str:
        """STUB. Wire up the Anthropic SDK (default council brain, Opus 4.8)."""
        # import anthropic
        # client = anthropic.Anthropic()  # reads ANTHROPIC_API_KEY
        # resp = client.messages.create(
        #     model=backend.model_id,           # "claude-opus-4-8"
        #     max_tokens=req.max_tokens,
        #     system=req.system or "",
        #     messages=[{"role": "user", "content": req.prompt}],
        # )
        # return "".join(b.text for b in resp.content if b.type == "text")
        return f"[STUB {backend.key} (default brain)] would answer: {req.prompt[:60]}..."

    # ---- health -------------------------------------------------------------
    def _healthy(self, key: str) -> bool:
        """STUB. Ping the local llama.cpp server's /health. Returns False here so
        a bare scaffold run does not assume a model is loaded."""
        # import urllib.request
        # try:
        #     base = self.backends[key].endpoint.rsplit("/v1", 1)[0]
        #     with urllib.request.urlopen(base + "/health", timeout=1) as r:
        #         return r.status == 200
        # except Exception:
        #     return False
        return os.environ.get("SOV3_LOCAL_UP", "0") == "1"


if __name__ == "__main__":
    r = Router()
    for req in (
        RouteRequest(prompt="Summarize today's council agenda."),                 # -> Claude (default)
        RouteRequest(prompt="Sign this episode offline.", require_sovereign=True), # -> DeepSeek/Nemotron
        RouteRequest(prompt="Quick local draft.", force_local=True),               # -> DeepSeek local
    ):
        res = r.route(req)
        print(f"{res.tier:18} | {res.backend_key:24} | {res.routed_because}")
        print(f"   -> {res.text}\n")
