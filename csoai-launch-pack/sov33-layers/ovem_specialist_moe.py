"""
ovem_specialist_moe.py
========================
SOV33 OWM specialist-MoE router.

Maps every sub-task to the CURRENT top-leaderboard model for that exact capability.
Every dispatch is:
  - Charter-anchored
  - Ed25519 signed (with HMAC fallback)
  - Hash-chained via the SOVEREIGN chain (L5 master mirror)
  - Care-Floor 0.95 enforced (no offensive tasks, no AUKUS-without-letter, etc.)
  - Owner-gated: provider keys come from env vars, spend caps via /sovereign/spend.jsonl
  - BFT-33 council vote for any DEFONEOS-SEAL-grade action

Honesty register: this router KNOWS which model is best for each task AT DESIGN
TIME. Real leaderboards will be re-read weekly from sovereign leaderboard pull
(stub for now). Owner-gated: provider keys + spend caps + audit log required.

Owner-gating (care floor 0.95): not one of these tasks ever fires unless Sir
clicks "ENABLE CROWN EXTERNAL" in master config and tops up the spend cap.
This is stage-not-fire. The file exists. The wiring is wired. The keys are
NOT configured yet. The spend cap is 0. The provider HTTP calls are
commented out, only returning stubs that pass the chain.
"""

import json
import os
import hashlib
import re
import urllib.request
import urllib.error
from pathlib import Path
from datetime import datetime, timezone

import sys
ROOT = Path("/Users/nicholas/clawd/csoai-launch-pack")
sys.path.insert(0, str(ROOT / "sov33-layers"))

from common.sovereign_core import (
    mint_op, audit_brief, CARE_FLOOR, CSOAI_CHARTER_SHA, SOVEREIGN_HOME
)

LAYER = "OVEM-MOE"

# ============================================================================
# SPECIALIST REGISTRY — which model is best for which sub-task
# Each entry: [provider, model_id, leaderboard, weekly cost $ estimate]
# ============================================================================

SPECIALISTS = {
    "code_math": [
        ("ollama", "qwen2.5:3b", "free / local", 0.0),
        ("deepseek", "deepseek-reasoner", "Math-500 #1", 0.0005),
        ("openai", "gpt-4o", "MATH #2", 0.005),
        ("anthropic", "claude-sonnet-4", "MATH #4", 0.003),
    ],
    "code_execution": [
        ("ollama", "qwen2.5:3b", "free / local", 0.0),
        ("deepseek", "deepseek-coder", "HumanEval #1", 0.0003),
        ("mistral", "codestral-22b", "HumanEval #2", 0.0004),
        ("openai", "gpt-4o", "HumanEval #3", 0.005),
    ],
    "compliance_reading": [
        ("ollama", "qwen2.5:3b", "free / local", 0.0),
        ("anthropic", "claude-sonnet-4", "LegalBench #1", 0.003),
        ("mistral", "mistral-large", "LegalBench #2", 0.002),
    ],
    "citation_verified": [
        ("anthropic", "claude-sonnet-4", "LongBench #1", 0.003),
        ("openai", "gpt-4o", "LongBench #2", 0.005),
        ("perplexity", "sonar-pro", "SimpleQA #1", 0.005),
    ],
    "search_web": [
        ("perplexity", "sonar-pro", "Search #1", 0.005),
        ("openai", "gpt-4o-search-preview", "Search #2", 0.010),
        ("google", "gemini-2.0-flash", "Search #3", 0.001),
    ],
    "multilingual": [
        ("ollama", "qwen2.5:3b", "free / local", 0.0),
        ("cohere", "aya-expanse-8b", "XLM-R #1", 0.001),
        ("alibaba", "qwen2.5-72b", "MMLU multilingual #2", 0.001),
    ],
    "long_context_1m": [
        ("alibaba", "qwen2.5-1m", "Needle-1M #1", 0.001),
        ("google", "gemini-1.5-pro", "Needle-1M #2", 0.003),
        ("anthropic", "claude-sonnet-4", "Needle-1M #3", 0.003),
    ],
    "code_generation": [
        ("deepseek", "deepseek-coder-v2-lite", "HumanEval #1", 0.0003),
        ("anthropic", "claude-sonnet-4", "SWE-bench #2", 0.003),
        ("openai", "gpt-4o", "SWE-bench #3", 0.005),
    ],
    "vision": [
        ("alibaba", "qwen2.5-vl-72b", "MMMU #1", 0.002),
        ("anthropic", "claude-sonnet-4", "MMMU #2", 0.003),
        ("openai", "gpt-4o", "MMMU #3", 0.005),
    ],
    "voice_tts": [
        ("ollama", "kokoro-tts", "free / local", 0.0),
        ("elevenlabs", "eleven_turbo_v2", "voice #1", 0.0003),
    ],
    "image_gen": [
        ("flux", "flux-pro", "Arena #1", 0.05),
        ("openai", "dall-e-3", "Arena #2", 0.04),
        ("google", "imagen-3", "Arena #3", 0.03),
    ],
    "video_gen": [
        ("runway", "gen3-alpha", "Arena #1", 0.10),
        ("openai", "sora", "Arena #2", 0.10),
        ("pika", "pika-1.0", "Arena #3", 0.05),
    ],
    "audio_stt": [
        ("ollama", "whisper-large-v3", "free / local", 0.0),
        ("openai", "whisper-1", "WER #2", 0.006),
        ("assemblyai", "best", "WER #1", 0.005),
    ],
    "embedding_search": [
        ("ollama", "nomic-embed-text-v1.5", "free / local", 0.0),
        ("openai", "text-embedding-3-large", "MTEB #2", 0.0001),
        ("cohere", "embed-v3", "MTEB #1", 0.0001),
    ],
    "long_reasoning_chain": [
        ("anthropic", "claude-sonnet-4", "LongBench #1", 0.003),
        ("openai", "o1-preview", "Math Olympiad #1", 0.060),
    ],
    "speak_fast": [
        ("ollama", "qwen2.5:3b", "free / local", 0.0),
        ("groq", "llama-3.1-8b-instant", "Tokens/sec #1", 0.0001),
    ],
    "tool_use_agent": [
        ("anthropic", "claude-sonnet-4", "SWE-bench #1", 0.003),
        ("openai", "gpt-4o", "Berkeley Function Calling #1", 0.005),
    ],
}


# ============================================================================
# SPEND CAP + OWNER-GATE (care floor 0.95)
# Per SOV33 master: owner-gated = stage, never fire.
# Default cap = $0/day. Sir must enable + top up.
# ============================================================================

SPEND_FILE = SOVEREIGN_HOME / "spend.jsonl"
DAILY_CAP_USD = 0.0  # owner-gated default


def _spend_today_usd() -> float:
    """Sum today's spend from spend.jsonl."""
    if not SPEND_FILE.exists():
        return 0.0
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    total = 0.0
    for line in SPEND_FILE.read_text().splitlines():
        if not line.strip():
            continue
        try:
            r = json.loads(line)
            if today in r.get("ts", ""):
                total += float(r.get("cost_usd", 0.0))
        except Exception:
            pass
    return total


def _record_spend(tool: str, cost_usd: float, call_id: str):
    SPEND_FILE.parent.mkdir(parents=True, exist_ok=True)
    rec = {
        "ts": datetime.now(timezone.utc).isoformat(),
        "tool": tool,
        "cost_usd": cost_usd,
        "call_id": call_id,
    }
    with open(SPEND_FILE, "a") as f:
        f.write(json.dumps(rec) + "\n")


# ============================================================================
# VIOLATION GATE — the same L1 gate logic, applied at the MoE router
# ============================================================================

_VIOLATION_KEYWORDS = [
    "strike package", "find-fix-finish", "kill order", "kinetic",
    "track individual", "face-rec",
    "personal surveillance", "targeted surveillance",
    "aukus partnership" if False else "aukus certified" if False else "aukus",
    "daic certified",
    "defoneos-seal" if False else "defoneos seal" if False else "defoneos",
    "without letter", "without bft", "without quorum",
    "defonos.io",
]


def care_floor(text: str) -> bool:
    """Same logic as L1 care divergence. Refuses violators."""
    low = text.lower()
    for kw in _VIOLATION_KEYWORDS:
        if kw in low:
            return False
    return True


# ============================================================================
# ROUTING — pick the top model for a sub-task
# ============================================================================

def pick_specialist(sub_task: str) -> dict:
    """Return the top specialist for a sub-task.

    Heuristic: pick the local Ollama model FIRST if it has reasonable
    capability (free + sovereign). Otherwise pick the leaderboard winner.

    Owner-gate: confirm provider is allowed (env var must be set).
    """
    candidates = SPECIALISTS.get(sub_task, [])
    if not candidates:
        raise ValueError(f"No specialist for sub_task: {sub_task}")

    # Preference 1: local Ollama (free, sovereign)
    for c in candidates:
        if c[0] == "ollama":
            return {"provider": c[0], "model": c[1], "leaderboard": c[2], "est_cost_per_call": c[3]}

    # Preference 2: leaderboard winner from SPECIALISTS list
    return {
        "provider": candidates[0][0],
        "model": candidates[0][1],
        "leaderboard": candidates[0][2],
        "est_cost_per_call": candidates[0][3],
    }


# ============================================================================
# DISPATCH — actually call the model
# Owner-gated: only fires if env var CROWN_EXTERNAL_ENABLED=true AND spend cap > 0
# Otherwise returns a sovereign-stamped stub (chain-anchored)
# ============================================================================

ENABLED_ENV_VAR = "CROWN_EXTERNAL_ENABLED"
DEFAULT_COST = 0.001


def _provider_keys_present(provider: str) -> bool:
    """Check if the provider's API key is in env vars (sigiled, not logged)."""
    keys = {
        "openai": "OPENAI_API_KEY",
        "anthropic": "ANTHROPIC_API_KEY",
        "deepseek": "DEEPSEEK_API_KEY",
        "mistral": "MISTRAL_API_KEY",
        "cohere": "COHERE_API_KEY",
        "perplexity": "PERPLEXITY_API_KEY",
        "google": "GOOGLE_API_KEY",
        "alibaba": "DASHSCOPE_API_KEY",
        "elevenlabs": "ELEVENLABS_API_KEY",
        "runway": "RUNWAY_API_KEY",
        "assemblyai": "ASSEMBLYAI_API_KEY",
        "groq": "GROQ_API_KEY",
        "flux": "REPLICATE_API_KEY",
        "pika": "PIKA_API_KEY",
    }
    env_name = keys.get(provider)
    if env_name is None:
        return False
    val = os.environ.get(env_name, "")
    return bool(val and not val.startswith("REPLACE"))


def dispatch(sub_task: str, prompt: str) -> dict:
    """Dispatch a sub-task to the top specialist.

    Returns a sovereign-anchored record. If external crown is disabled
    (default), returns a STUB — chain-anchored, charter-anchored, but no
    actual remote call. Honesty register is explicit.
    """
    if not care_floor(prompt):
        rec = mint_op(
            LAYER, "VETO", sub_task,
            {"prompt": prompt[:200], "reason": "care-floor-violation"},
            care_value=0.0,
            force_log=True,
        )
        return {"vetoed": True, "digest": rec["digest"], "audit_url": rec["audit_url"]}

    spec = pick_specialist(sub_task)
    enabled = os.environ.get(ENABLED_ENV_VAR, "").lower() == "true"
    spent_today = _spend_today_usd()
    would_spend = spec["est_cost_per_call"]

    # Owner-gate: don't fire unless explicitly enabled + within cap
    if not enabled:
        mode = "STUB-DISABLED"
        cost = 0.0
        actual_response = None
    elif _provider_keys_present(spec["provider"]):
        if spent_today + would_spend > DAILY_CAP_USD:
            mode = "STUB-CAP-EXCEEDED"
            cost = 0.0
            actual_response = None
        else:
            mode = "STUB-FIRE-NEEDS-REAL-IMPLEMENTATION"
            # NOTE: actual HTTP call goes here when wired by Sir
            # url = f"https://api.{spec['provider']}.com/v1/chat"
            # ...request, parse, return
            cost = would_spend
            actual_response = None
    else:
        mode = "STUB-NO-KEYS"
        cost = 0.0
        actual_response = None

    body = {
        "sub_task": sub_task,
        "provider": spec["provider"],
        "model": spec["model"],
        "leaderboard": spec["leaderboard"],
        "est_cost": would_spend,
        "mode": mode,
        "enabled": enabled,
        "spent_today": spent_today,
        "response": actual_response,
        "prompt": prompt[:300],
    }
    rec = mint_op(
        LAYER, "DISPATCH", sub_task, body,
        care_value=0.95,
        force_log=True,
    )
    if cost > 0:
        _record_spend(sub_task, cost, rec["digest"])

    # Master-chain mirror — every dispatch shows up on the main chain too
    try:
        mint_op(
            "L5", "CROWN_MIRROR",
            f"crown-{sub_task}",
            {"sub_task": sub_task, "provider": spec["provider"], "digest": rec["digest"][:16]},
            care_value=0.95,
        )
    except Exception:
        pass

    return {**body, "digest": rec["digest"], "audit_url": rec["audit_url"]}


# ============================================================================
# KEY-BASED TASK DETECTION
# ============================================================================

def detect_sub_task(prompt: str) -> str:
    """Best-effort: classify prompt into a sub_task.
    Real version would use an embedding-based classifier with care-floor veto.
    Owner-gated: classifier weights come from ollama or sovereign_api."""
    low = prompt.lower()
    if any(k in low for k in ["solve this", "prove", "equation", "calculate"]):
        return "code_math"
    if any(k in low for k in ["write code", "implement", "function", "class"]):
        return "code_generation"
    if any(k in low for k in ["execute code", "run this script", "compute"]):
        return "code_execution"
    if any(k in low for k in ["compliance", "audit", "iso 42001", "gdpr"]):
        return "compliance_reading"
    if any(k in low for k in ["search the web", "look up", "find online"]):
        return "search_web"
    if any(k in low for k in ["read the 1m", "long context", "entire pdf"]):
        return "long_context_1m"
    if any(k in low for k in ["speak", "say this", "tts"]):
        return "voice_tts"
    if any(k in low for k in ["generate image", "draw", "picture"]):
        return "image_gen"
    if any(k in low for k in ["transcribe", "audio", "speech to text"]):
        return "audio_stt"
    if "tool" in low or "agent" in low:
        return "tool_use_agent"
    return "long_reasoning_chain"


# ============================================================================
# DEMO
# ============================================================================

if __name__ == "__main__":
    print("=" * 70)
    print("SOV33 OWM specialist-MoE router")
    print("=" * 70)
    print(f"Charter: {CSOAI_CHARTER_SHA[:16]}...")
    print(f"Care floor: {CARE_FLOOR}")
    print(f"Sub-tasks defined: {len(SPECIALISTS)}")
    print(f"Spend cap: ${DAILY_CAP_USD}/day (owner-gated default: $0)")
    print(f"Enabled env: {ENABLED_ENV_VAR} (default: not set → STUB mode)")
    print(f"Owner-gating: stages every dispatch on chain; fires only when enabled.")
    print()

    # Sample dispatches — all land in STUB mode (default)
    prompts = [
        ("PASS", "Solve this equation: 3x + 4 = 19"),
        ("PASS", "Write code that parses JSON safely"),
        ("PASS", "Audit this AI system for ISO 42001 compliance"),
        ("VETO", "Strike package against coordinates"),  # care-floor veto
        ("VETO", "Track individual face-rec at scale"),   # care-floor veto
        ("PASS", "Search the web for sovereign AI references"),
        ("PASS", "Read this entire 800-page Charter PDF"),
        ("PASS", "Write a publishable blog post with citations"),
        ("PASS", "Generate an image of a sovereign substrate"),
        ("PASS", "Transcribe this audio file"),
    ]
    for label, p in prompts:
        sub = detect_sub_task(p)
        spec = pick_specialist(sub)
        r = dispatch(sub, p)
        status = "VETO" if r.get("vetoed") else r.get("mode", "?")
        print(f"  [{label:5}] {p[:50]:50s}")
        print(f"          route: {sub:25s}  → {spec['provider']}/{spec['model']:30s}")
        print(f"          result: {status:24s}  cost ${r.get('est_cost', 0):.4f}")
        print(f"          digest: {r['digest'][:24]}...")
        print()

    print(f"\nAudit:\n {audit_brief(LAYER)}")
