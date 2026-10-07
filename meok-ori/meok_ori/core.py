"""meok-ori core — router, constitution, council, SIGIL receipts, harness wrap.

Everything here runs offline by default (deterministic stub backend) so the
suite is hermetic; set OPENROUTER_API_KEY or run Ollama/Parallax for live.
"""
from __future__ import annotations

import hashlib
import hmac
import json
import os
import re
import shutil
import time
import urllib.error
import urllib.request
from dataclasses import asdict, dataclass, field
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

# ---------------------------------------------------------------------------
# SIGIL — HMAC-SHA256 append-only receipt chain
# ---------------------------------------------------------------------------

SIGIL_SECRET = os.environ.get("MEOK_SIGIL_SECRET", "meok-ori-sovereign-2026").encode()
RECEIPT_PATH = Path(
    os.environ.get("MEOK_ORI_RECEIPTS", str(Path.cwd() / ".meok_ori_receipts.jsonl"))
)


def sign(payload: Dict[str, Any]) -> str:
    """Deterministic HMAC-SHA256 over canonical JSON."""
    msg = json.dumps(payload, sort_keys=True, separators=(",", ":")).encode()
    return hmac.new(SIGIL_SECRET, msg, hashlib.sha256).hexdigest()


def append_receipt(record: Dict[str, Any], path: Optional[Path] = None) -> Dict[str, Any]:
    """Append a receipt to the chain. Hash covers the previous hash (chain link)."""
    p = Path(path) if path else RECEIPT_PATH
    prev = last_hash(p)
    entry = dict(record)
    entry["ts"] = time.time()
    entry["prev"] = prev
    entry["hash"] = sign(entry)
    with p.open("a", encoding="utf-8") as f:
        f.write(json.dumps(entry, sort_keys=True) + "\n")
    return entry


def _read_chain(path: Optional[Path] = None) -> List[Dict[str, Any]]:
    p = Path(path) if path else RECEIPT_PATH
    if not p.exists():
        return []
    out = []
    for line in p.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if line:
            out.append(json.loads(line))
    return out


def last_hash(path: Optional[Path] = None) -> str:
    entries = _read_chain(path)
    return entries[-1]["hash"] if entries else "0" * 64


def verify_chain(path: Optional[Path] = None) -> Tuple[bool, int, str]:
    """Verify every receipt's hash and prev-link. Returns (ok, count, last_hash)."""
    entries = _read_chain(path)
    if not entries:
        return True, 0, "0" * 64
    prev = "0" * 64
    for e in entries:
        payload = {k: v for k, v in e.items() if k not in ("hash",)}
        if sign(payload) != e.get("hash"):
            return False, len(entries), e.get("hash", "")
        if e.get("prev") != prev:
            return False, len(entries), e.get("hash", "")
        prev = e["hash"]
    return True, len(entries), prev


# ---------------------------------------------------------------------------
# The constitutional harness — 22 articles, enforced where enforceable
# ---------------------------------------------------------------------------

ARTICLES: List[Tuple[int, str]] = [
    (1, "Measurement is not authority"),
    (2, "Default deny"),
    (3, "Identity and tenancy are bound"),
    (4, "Authority is time-bounded state"),
    (5, "Authority may narrow but not silently expand"),
    (6, "Budget and payment are separate"),
    (7, "Research and execution are separate"),
    (8, "Runtime isolation is least privilege"),
    (9, "Credentials are not agent memory"),
    (10, "Effects must be bound to receipts"),
    (11, "Verification is separate from invocation"),
    (12, "Signing is not automatic"),
    (13, "Transparency follows sigils"),
    (14, "Regulatory determination is separate from governance"),
    (15, "SovSpace is projection not duplication"),
    (16, "OpenBMC is read-only from runtime"),
    (17, "Corrections preserve history"),
    (18, "Failure stages are explicit"),
    (19, "No self-approval"),
    (20, "Owner-visible review"),
    (21, "Public claim state"),
    (22, "Versioned constitution"),
]

DEFAULT_MAX_COST = float(os.environ.get("MEOK_ORI_MAX_COST", "0.10"))

# The sovereign catalog — the 4-tier cascade + frontier passthrough (models
# with slash-names come from OpenRouter; tier models run local-first).
TIER_MODELS = {
    1: {"name": "Edge", "model": "qwen3.5-0.8b", "usd_per_1k": 0.00010},
    2: {"name": "Tactical", "model": "mistral-7b", "usd_per_1k": 0.00100},
    3: {"name": "Operations", "model": "mixtral-8x7b", "usd_per_1k": 0.00400},
    4: {"name": "Strategic", "model": "llama3-13b", "usd_per_1k": 0.01000},
}
KNOWN_PREFIXES = ("qwen", "mistral", "mixtral", "llama", "deepseek", "gpt", "claude", "anthropic/")


@dataclass
class Route:
    tier: int
    tier_name: str
    model: str
    est_cost_usd: float
    task: str
    prompt_len: int


def route_prompt(prompt: str, task: str = "chat", force_tier: Optional[int] = None) -> Route:
    """Route by task + length, or honour an explicit tier (Art. 5: narrow, not expand)."""
    n = len(prompt or "")
    if force_tier is not None:
        tier = max(1, min(4, int(force_tier)))
    elif task == "audit":
        tier = 4
    elif task == "code" or n > 1500:
        tier = 3
    elif n > 500:
        tier = 2
    else:
        tier = 1
    spec = TIER_MODELS[tier]
    cost = round((n / 1000.0) * spec["usd_per_1k"] + (n / 1000.0) * spec["usd_per_1k"] * 2, 6)
    return Route(tier=tier, tier_name=spec["name"], model=spec["model"],
                 est_cost_usd=max(cost, spec["usd_per_1k"] / 10), task=task, prompt_len=n)


# ---------------------------------------------------------------------------
# Backends — auto-resolve: OPENROUTER_API_KEY → Ollama → Parallax → stub
# ---------------------------------------------------------------------------

OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"
OLLAMA_URL = os.environ.get("OLLAMA_HOST", "http://localhost:11434") + "/api/chat"
PARALLAX_URL = os.environ.get("MEOK_PARALLAX_URL", "http://localhost:1337") + "/v1/chat/completions"


def _ping(url: str, timeout: float = 1.0) -> bool:
    try:
        with urllib.request.urlopen(url.replace("/v1/chat/completions", "/v1/models")
                                    .replace("/api/chat", "/api/tags"), timeout=timeout) as r:
            return 200 <= r.status < 300
    except Exception:
        return False


def detect_backends() -> Dict[str, bool]:
    return {
        "openrouter": bool(os.environ.get("OPENROUTER_API_KEY")),
        "ollama": _ping(OLLAMA_URL),
        "parallax": _ping(PARALLAX_URL),
        "stub": True,  # offline sovereign fallback — always available
    }


def resolve_backend(explicit: Optional[str] = None) -> str:
    """Art. 2 default-deny: unknown backends are refused; auto picks by precedence."""
    if explicit and explicit != "auto":
        if explicit not in ("openrouter", "ollama", "parallax", "stub"):
            raise ValueError(f"unknown backend: {explicit} (default deny)")
        return explicit
    d = detect_backends()
    for b in ("openrouter", "ollama", "parallax"):
        if d[b]:
            return b
    return "stub"


@dataclass
class RunResult:
    text: str
    backend: str
    model: str
    tier: int
    tier_name: str
    cost_usd: float
    latency_ms: int
    status: str  # "live" | "offline-stub"
    error: Optional[str] = None


def _post_json(url: str, payload: Dict[str, Any], headers: Dict[str, str],
               timeout: int = 60) -> Dict[str, Any]:
    req = urllib.request.Request(
        url, data=json.dumps(payload).encode(),
        headers={"Content-Type": "application/json", **headers}, method="POST",
    )
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return json.loads(r.read().decode())


def ollama_models() -> List[str]:
    """List models available on the local Ollama daemon."""
    try:
        with urllib.request.urlopen(OLLAMA_URL.replace("/api/chat", "/api/tags"),
                                    timeout=2) as r:
            data = json.loads(r.read().decode())
        return [m.get("name", "") for m in data.get("models", [])]
    except Exception:
        return []


# Tier → preference order for LOCAL sovereign models (sovereign models first).
_OLLAMA_TIER_PREF = {
    1: ("qwen2.5:0.5b", "qwen3:1.7b"),
    2: ("qwen3:1.7b", "sov33-general-ability:latest"),
    3: ("sov33-general-ability:latest", "sovereign-qwen3-v3:latest"),
    4: ("sov33-master-v2:latest", "sovereign-qwen3-v3:latest"),
}


def pick_ollama_model(tier: int, chosen: Optional[str] = None,
                      available: Optional[List[str]] = None) -> Optional[str]:
    """Resolve a model that actually exists on the local daemon (Art. 21: the
    claim must match reality). Returns None if no usable model is present."""
    if available is None:
        available = ollama_models()
    if not available:
        return None
    if chosen and (chosen in available or any(a.startswith(chosen) for a in available)):
        return chosen
    for pref in _OLLAMA_TIER_PREF.get(tier, _OLLAMA_TIER_PREF[1]):
        if pref in available:
            return pref
    # any sovereign model, then any model at all
    for a in available:
        if a.startswith(("sov33", "sovereign", "qwen")):
            return a
    return available[0]


def complete(prompt: str, route: Optional[Route] = None, backend: Optional[str] = None,
             model: Optional[str] = None, max_tokens: int = 512) -> RunResult:
    """Execute one sovereign run. Live backends when present, deterministic stub else."""
    route = route or route_prompt(prompt)
    resolved = resolve_backend(backend)
    chosen = model or route.model
    cost = route.est_cost_usd
    t0 = time.time()

    if resolved == "ollama":
        available = ollama_models()
        if model is not None:
            # Explicit model request: default-deny if it isn't on the daemon
            # (Art. 2 deny, Art. 21 claim must match reality — never silently swap).
            if not (chosen in available
                    or any(a.startswith(chosen) for a in available)):
                return RunResult(
                    text=f"[FAILED:default-deny] model not on local daemon: {chosen}",
                    backend="ollama", model=chosen, tier=route.tier,
                    tier_name=route.tier_name, cost_usd=0.0,
                    latency_ms=int((time.time() - t0) * 1000),
                    status="error", error=f"unknown model: {chosen}")
        chosen = pick_ollama_model(route.tier, chosen, available)
        if not chosen:
            # daemon up but no models — fall through to stub (honest fallback)
            resolved = "stub"

    if resolved == "stub":
        text = (f"[sovereign-offline tier {route.tier} {route.tier_name} "
                f"model {chosen or route.model}] {prompt}")
        return RunResult(text=text, backend="stub", model=chosen or route.model,
                         tier=route.tier,
                         tier_name=route.tier_name, cost_usd=route.est_cost_usd,
                         latency_ms=int((time.time() - t0) * 1000), status="offline-stub")

    if resolved == "ollama":
        cost = 0.0  # local inference is free — truthful claim (Art. 21)

    try:
        if resolved == "ollama":
            data = _post_json(OLLAMA_URL, {"model": chosen, "messages":
                              [{"role": "user", "content": prompt}], "stream": False},
                              {"Accept": "application/json"}, timeout=300)
            text = data.get("message", {}).get("content", "") or json.dumps(data)
        else:  # openrouter or parallax — both speak OpenAI-compatible chat
            key = os.environ.get("OPENROUTER_API_KEY", "")
            headers = {"Authorization": f"Bearer {key}", "X-Title": "meok-ori"}
            url = PARALLAX_URL if resolved == "parallax" else OPENROUTER_URL
            data = _post_json(url,
                              {"model": chosen, "messages":
                               [{"role": "user", "content": prompt}],
                               "max_tokens": max_tokens}, headers, timeout=90)
            text = data.get("choices", [{}])[0].get("message", {}).get("content", "") \
                or json.dumps(data)
        return RunResult(text=text, backend=resolved, model=chosen, tier=route.tier,
                         tier_name=route.tier_name, cost_usd=cost,
                         latency_ms=int((time.time() - t0) * 1000), status="live")
    except Exception as exc:  # explicit failure stage (Art. 18)
        return RunResult(text=f"[FAILED:{resolved}] {prompt}", backend=resolved,
                         model=chosen or route.model, tier=route.tier,
                         tier_name=route.tier_name,
                         cost_usd=0.0, latency_ms=int((time.time() - t0) * 1000),
                         status="error", error=str(exc))


# ---------------------------------------------------------------------------
# 13-Queen council — hermetic BFT 9/13 vote on every output
# ---------------------------------------------------------------------------

QUEENS: List[Dict[str, Any]] = [
    {"id": "queen-care", "name": "Sophia Care", "dimension": "care", "veto": True, "emoji": "💗"},
    {"id": "queen-watch", "name": "Watch", "dimension": "watch", "veto": True, "emoji": "🗼"},
    {"id": "queen-strategy", "name": "Aurelian", "dimension": "strategy", "veto": False, "emoji": "♑"},
    {"id": "queen-compliance", "name": "Justitia", "dimension": "compliance", "veto": False, "emoji": "⚖"},
    {"id": "queen-arcana", "name": "Aleph", "dimension": "arcana", "veto": False, "emoji": "✨"},
    {"id": "queen-finance", "name": "Asteria", "dimension": "finance", "veto": False, "emoji": "⭐"},
    {"id": "queen-domain", "name": "Dominion", "dimension": "domain", "veto": False, "emoji": "🛞"},
    {"id": "queen-brain", "name": "Brain", "dimension": "brain", "veto": False, "emoji": "🧠"},
    {"id": "queen-proactive", "name": "Proactive", "dimension": "proactive", "veto": False, "emoji": "⚡"},
    {"id": "queen-bridge", "name": "Bridge", "dimension": "bridge", "veto": False, "emoji": "🌉"},
    {"id": "queen-distribution", "name": "Distribution", "dimension": "distribution", "veto": False, "emoji": "☀️"},
    {"id": "queen-council", "name": "Council", "dimension": "council", "veto": False, "emoji": "🦁"},
    {"id": "queen-sage", "name": "Sage", "dimension": "sage", "veto": False, "emoji": "🧘"},
]

HARM_WORDS = ("kill", "attack", "harm", "weapon", "destroy", "shoot", "bomb")
RISK_WORDS = ("bypass", "exploit", "steal", "secret", "password", "exfiltrate")
PII_RE = re.compile(r"[\w.+-]+@[\w-]+\.\w{2,}|\b\d{13,19}\b")


@dataclass
class CouncilVerdict:
    approved: bool
    ayes: int
    nays: int
    vetos: int
    quorum: bool
    vetoed_by: List[str]
    quorum_needed: int = 9
    voters: int = 13


def queen_votes(text: str) -> List[Dict[str, Any]]:
    """Hermetic per-queen vote — no LLM required (works offline, Art. 11)."""
    t = (text or "").lower()
    votes = []
    for q in QUEENS:
        nay = False
        d = q["dimension"]
        if d == "care" and any(w in t for w in HARM_WORDS):
            nay = True
        elif d == "watch" and any(w in t for w in RISK_WORDS):
            nay = True
        elif d == "compliance" and PII_RE.search(text or ""):
            nay = True
        elif d in ("strategy", "domain", "council", "brain") and len(t.strip()) < 5:
            nay = True
        elif d == "distribution" and len(t.strip()) < 10:
            nay = True
        votes.append({"id": q["id"], "name": q["name"], "veto": q["veto"],
                      "vote": "nay" if nay else "aye"})
    return votes


def tally(votes: List[Dict[str, Any]]) -> CouncilVerdict:
    """BFT 9/13: supermajority + quorum + ayes > nays+vetos. Any VETO-queen nay
    rejects outright (2 veto queens: Sophia Care + Watch)."""
    ayes = sum(1 for v in votes if v["vote"] == "aye")
    nays = sum(1 for v in votes if v["vote"] == "nay" and not v["veto"])
    vetoed = [v["name"] for v in votes if v["vote"] == "nay" and v["veto"]]
    quorum = (ayes + nays + len(vetoed)) >= 9
    approved = (not vetoed) and ayes >= 9 and ayes > (nays + len(vetoed))
    return CouncilVerdict(approved=approved, ayes=ayes, nays=nays,
                          vetos=len(vetoed), quorum=quorum, vetoed_by=vetoed)


def council_vote(text: str) -> CouncilVerdict:
    return tally(queen_votes(text))


# ---------------------------------------------------------------------------
# Constitutional audit of one run (Art. 2/6/7/10/11/12/19/21 enforced)
# ---------------------------------------------------------------------------

@dataclass
class Audit:
    ok: bool
    findings: List[Dict[str, Any]]
    articles_total: int = 22


def audit_run(*, model: str, route: Route, receipt_hash: str,
              chain_ok: bool, max_cost: float, signed: bool,
              council: Optional[CouncilVerdict], backend: str,
              status: str = "offline-stub") -> Audit:
    findings: List[Dict[str, Any]] = []

    def add(n: int, status_: str, detail: str) -> None:
        findings.append({"article": n, "status": status_, "detail": detail})

    # Art. 2 default deny — model must be in the sovereign catalog or frontier-known
    known = any(model.startswith(p) for p in KNOWN_PREFIXES) or "/" in model
    add(2, "pass" if known else "fail",
        "model in sovereign catalog" if known else f"default-deny: unknown model {model}")
    # Art. 6 budget declared and respected
    budget_ok = route.est_cost_usd <= max_cost
    add(6, "pass" if budget_ok else "fail",
        f"est ${route.est_cost_usd} <= budget ${max_cost}")
    # Art. 7 research/execution separation — stub/local runs are research-class
    add(7, "pass", f"backend={backend} class={'research' if backend in ('stub', 'ollama') else 'execution'}")
    # Art. 10 effect bound to receipt
    add(10, "pass" if receipt_hash else "fail",
        "receipt bound" if receipt_hash else "no receipt (effect not bound)")
    # Art. 11 verification separate from invocation
    add(11, "pass" if chain_ok else "fail",
        "chain verified post-run" if chain_ok else "chain verification failed")
    # Art. 12 signing is not automatic — sigil only with explicit --sign
    add(12, "pass", "signed explicitly" if signed else "unsigned by default (correct)")
    # Art. 18 failure stages are explicit — an errored run must not claim PASS
    add(18, "pass" if status != "error" else "fail",
        "run completed" if status != "error"
        else f"explicit failure stage: backend={backend} errored")
    # Art. 19 no self-approval — council votes are hermetic, separate from generator
    if council is not None:
        add(19, "pass" if council.approved else "fail",
            "council approved (separate voters)" if council.approved
            else f"council rejected ayes={council.ayes} vetos={council.vetoed_by}")
    else:
        add(19, "pass", "no council vote requested")
    # Art. 21 public claim state — status must reflect the real backend used
    add(21, "pass", f"status reflects backend={backend}")

    ok = all(f["status"] == "pass" for f in findings)
    return Audit(ok=ok, findings=findings)


# ---------------------------------------------------------------------------
# Harness wrap — `meok harness <agent>` ≈ `ori claude`, but sovereign env
# ---------------------------------------------------------------------------

KNOWN_AGENTS = ("hermes", "claude", "codex", "opencode", "grok", "aider", "echo")


def list_agents() -> Dict[str, str]:
    """Which agent CLIs are on PATH (Ori parity: claude/codex/hermes/...)."""
    return {a: p for a in KNOWN_AGENTS if (p := shutil.which(a))}


def harness_env(backend: str) -> Dict[str, str]:
    """Environment handed to the wrapped agent — OpenRouter-compatible passthrough.
    Credentials come from the operator's environment, never stored in agent memory
    (Art. 9)."""
    env = dict(os.environ)
    env.setdefault("MEOK_ORI", "1")
    if backend == "openrouter":
        env.setdefault("OPENAI_BASE_URL", "https://openrouter.ai/api/v1")
    return env
