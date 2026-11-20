#!/usr/bin/env python3
"""Live multi-provider 14-axis GSPC frontier measurement runner.

Executes funded 2026 commercial & open-weight LLM endpoints across all 14 canonical
GSPC behavioural axes (885 deterministic bank items total, subset of the 34-slot
live GSPC board) using the exact frozen banks, prompts, ExactLabelParser /
ReadLabelParser / keyword graders, G2 gates (n_valid >= 30), Wilson CIs, and
exact two-sided McNemar separation tests from `gspc_live_hf_14_axes_runner.py`.

Every provider/model that cannot be reached because of verified zero credits or
billing limits is recorded explicitly in `preflight_billing_blocks` rather than
silently omitted or imputed.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import os
import re
import sys
import threading
import time
import urllib.error
import urllib.request
from concurrent.futures import ThreadPoolExecutor, as_completed
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Callable, Dict, List, Optional, Sequence, Tuple

REPO_ROOT = Path(__file__).resolve().parent.parent
if str(REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(REPO_ROOT))

from scripts.gspc_live_hf_14_axes_runner import (  # noqa: E402
    CANONICAL_14_AXES_BANKS,
    EXACT_PARSER,
    READ_PARSER,
    canonical_json,
    compose_worker_prompt,
    compute_axis_mcnemar_separation,
    compute_measure_g2_gate,
    grade_keyword_match,
    load_axis_bank,
    sha256_hex,
)

SCHEMA = "csoai.gspc-frontier-multi-provider-14-axes/1.0"
DEFAULT_CACHE_DIR = REPO_ROOT / "scratch" / "frontier_14axes_cache"
DEFAULT_JSON_OUT = REPO_ROOT / "public" / "interop" / "gspc-frontier-multi-provider-14-axes-v1.json"
DEFAULT_MD_OUT = REPO_ROOT / "docs" / "GSPC_FRONTIER_MULTI_PROVIDER_14_AXES_2026-11-13.md"
USER_AGENT = "curl/8.7.1"


@dataclass(frozen=True)
class ProviderTarget:
    """Configuration for a single funded provider+model measurement lane."""

    id: str
    vendor: str
    provider: str
    endpoint_url: str
    api_model: str
    env_var: str
    env_file: str
    max_workers: int = 4
    exact_max_tokens: int = 1024
    kw_max_tokens: int = 1024
    timeout_s: int = 45
    min_interval_s: float = 0.0
    tpm_soft_floor: int = 0
    retry_attempts: int = 4


DEFAULT_FLEET: Tuple[ProviderTarget, ...] = (
    ProviderTarget(
        id="google:gemini-2.5-flash-lite",
        vendor="Google",
        provider="google-gemini-openai",
        endpoint_url="https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
        api_model="gemini-2.5-flash-lite",
        env_var="GOOGLE_API_KEY",
        env_file="~/.hermes/.env",
        max_workers=2,
        exact_max_tokens=512,
        kw_max_tokens=1024,
        timeout_s=45,
        min_interval_s=2.1,
        retry_attempts=4,
    ),
    ProviderTarget(
        id="minimax:MiniMax-M2.7",
        vendor="MiniMax",
        provider="minimax-openai",
        endpoint_url="https://api.minimax.io/v1/chat/completions",
        api_model="MiniMax-M2.7",
        env_var="MINIMAX_API_KEY",
        env_file="~/.hermes/.env",
        max_workers=5,
        exact_max_tokens=2048,
        kw_max_tokens=2048,
        timeout_s=60,
        retry_attempts=4,
    ),
    ProviderTarget(
        id="openrouter:nvidia/nemotron-3.5-lightning:free",
        vendor="NVIDIA (OpenRouter :free)",
        provider="openrouter-free",
        endpoint_url="https://openrouter.ai/api/v1/chat/completions",
        api_model="nvidia/nemotron-3.5-lightning:free",
        env_var="OPENROUTER_API_KEY",
        env_file="~/.hermes/.env",
        max_workers=3,
        exact_max_tokens=2048,
        kw_max_tokens=2048,
        timeout_s=60,
        min_interval_s=0.45,
        retry_attempts=5,
    ),
    ProviderTarget(
        id="groq:openai/gpt-oss-120b",
        vendor="OpenAI (open-weight via Groq)",
        provider="groq-openai",
        endpoint_url="https://api.groq.com/openai/v1/chat/completions",
        api_model="openai/gpt-oss-120b",
        env_var="GROQ_API_KEY",
        env_file="~/.hermes/.env",
        max_workers=1,
        exact_max_tokens=1024,
        kw_max_tokens=1024,
        timeout_s=45,
        min_interval_s=0.35,
        tpm_soft_floor=1100,
        retry_attempts=6,
    ),
)


def parse_env_file(path: str | Path) -> Dict[str, str]:
    """Read key=value entries from a dotenv file without executing shell code."""
    resolved = Path(os.path.expanduser(str(path)))
    if not resolved.exists():
        return {}
    out: Dict[str, str] = {}
    for line in resolved.read_text(encoding="utf-8", errors="ignore").splitlines():
        m = re.match(r"^\s*(?:export\s+)?([A-Za-z0-9_]+)\s*=\s*(.*)$", line)
        if not m:
            continue
        val = m.group(2).strip().strip('"').strip("'")
        if val:
            out[m.group(1)] = val
    return out


def load_key_for_target(target: ProviderTarget) -> str:
    """Resolve API key from its explicit env_file first, falling back to os.environ."""
    from_file = parse_env_file(target.env_file).get(target.env_var, "")
    if from_file:
        return from_file
    return os.environ.get(target.env_var, "").strip()


def parse_duration_seconds(raw: Optional[str]) -> float:
    """Parse durations like '4.642s', '1m2.5s', '450ms', or '12' into seconds."""
    if not raw:
        return 0.0
    s = str(raw).strip().lower()
    if re.fullmatch(r"\d+(?:\.\d+)?", s):
        return float(s)
    total = 0.0
    matched = False
    for num, unit in re.findall(r"(\d+(?:\.\d+)?)(ms|s|m|h)", s):
        matched = True
        v = float(num)
        if unit == "ms":
            total += v / 1000.0
        elif unit == "s":
            total += v
        elif unit == "m":
            total += v * 60.0
        elif unit == "h":
            total += v * 3600.0
    return total if matched else 0.0


def classify_billing_status(http_code: int, body_text: str) -> str:
    """Map an HTTP preflight error into a coarse sanitized failure code."""
    low = body_text.lower()
    if http_code == 400 and "credit balance" in low:
        return "LOW_CREDIT_BALANCE"
    if http_code == 402:
        return "INSUFFICIENT_CREDITS"
    if http_code == 403:
        return "FORBIDDEN_OR_NO_CREDITS"
    if http_code == 401:
        return "UNAUTHORIZED_OR_EXPIRED_KEY"
    if http_code == 429:
        if "quota" in low or "billing" in low:
            return "QUOTA_EXHAUSTED"
        if "suspended" in low or "negative balance" in low:
            return "ACCOUNT_SUSPENDED"
        return "RATE_LIMITED"
    return f"HTTP_{http_code}"


def probe_blocked_providers() -> List[Dict[str, Any]]:
    """Run deterministic 1-token preflight checks against known unfunded accounts."""
    ck = parse_env_file("~/.csoai-keys.env")
    he = parse_env_file("~/.hermes/.env")
    hm = parse_env_file("~/.env")

    candidates = [
        ("Anthropic (csoai-keys)", "~/.csoai-keys.env", "ANTHROPIC_API_KEY", ck.get("ANTHROPIC_API_KEY", ""),
         "https://api.anthropic.com/v1/messages",
         {"x-api-key": ck.get("ANTHROPIC_API_KEY", ""), "anthropic-version": "2023-06-01"},
         {"model": "claude-haiku-4-5-20251001", "max_tokens": 4, "messages": [{"role": "user", "content": "OK"}]}),
        ("Anthropic (hermes)", "~/.hermes/.env", "ANTHROPIC_API_KEY", he.get("ANTHROPIC_API_KEY", ""),
         "https://api.anthropic.com/v1/messages",
         {"x-api-key": he.get("ANTHROPIC_API_KEY", ""), "anthropic-version": "2023-06-01"},
         {"model": "claude-haiku-4-5-20251001", "max_tokens": 4, "messages": [{"role": "user", "content": "OK"}]}),
        ("OpenAI Direct (csoai/hermes)", "~/.hermes/.env", "OPENAI_API_KEY", he.get("OPENAI_API_KEY", ""),
         "https://api.openai.com/v1/chat/completions",
         {"Authorization": f"Bearer {he.get('OPENAI_API_KEY', '')}"},
         {"model": "gpt-5-mini", "max_completion_tokens": 4, "messages": [{"role": "user", "content": "OK"}]}),
        ("OpenRouter Paid (csoai-keys)", "~/.csoai-keys.env", "OPENROUTER_API_KEY", ck.get("OPENROUTER_API_KEY", ""),
         "https://openrouter.ai/api/v1/chat/completions",
         {"Authorization": f"Bearer {ck.get('OPENROUTER_API_KEY', '')}"},
         {"model": "anthropic/claude-sonnet-5.5", "max_tokens": 8, "messages": [{"role": "user", "content": "OK"}]}),
        ("DeepSeek Direct (hermes)", "~/.hermes/.env", "DEEPSEEK_API_KEY", he.get("DEEPSEEK_API_KEY", ""),
         "https://api.deepseek.com/chat/completions",
         {"Authorization": f"Bearer {he.get('DEEPSEEK_API_KEY', '')}"},
         {"model": "deepseek-chat", "max_tokens": 4, "messages": [{"role": "user", "content": "OK"}]}),
        ("HuggingFace Router (csoai-keys)", "~/.csoai-keys.env", "HF_TOKEN", ck.get("HF_TOKEN", ""),
         "https://router.huggingface.co/v1/chat/completions",
         {"Authorization": f"Bearer {ck.get('HF_TOKEN', '')}"},
         {"model": "Qwen/Qwen2.5-72B-Instruct", "max_tokens": 4, "messages": [{"role": "user", "content": "OK"}]}),
        ("NVIDIA NIM (csoai-keys)", "~/.csoai-keys.env", "NVIDIA_API_KEY", ck.get("NVIDIA_API_KEY", ""),
         "https://integrate.api.nvidia.com/v1/chat/completions",
         {"Authorization": f"Bearer {ck.get('NVIDIA_API_KEY', '')}"},
         {"model": "deepseek-ai/deepseek-v4.1-flash", "max_tokens": 8, "messages": [{"role": "user", "content": "OK"}]}),
        ("Kimi / Moonshot (hermes)", "~/.hermes/.env", "KIMI_API_KEY", he.get("KIMI_API_KEY", ""),
         "https://api.moonshot.ai/v1/chat/completions",
         {"Authorization": f"Bearer {he.get('KIMI_API_KEY', '')}"},
         {"model": "kimi-k2.5", "max_tokens": 4, "messages": [{"role": "user", "content": "OK"}]}),
        ("Cerebras (csoai-keys)", "~/.csoai-keys.env", "CEREBRAS_API_KEY", ck.get("CEREBRAS_API_KEY", ""),
         "https://api.cerebras.ai/v1/chat/completions",
         {"Authorization": f"Bearer {ck.get('CEREBRAS_API_KEY', '')}"},
         {"model": "llama3.1-8b", "max_tokens": 4, "messages": [{"role": "user", "content": "OK"}]}),
        ("Google AI Old Key (home .env)", "~/.env", "GEMINI_API_KEY", hm.get("GEMINI_API_KEY", ""),
         "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
         {"Authorization": f"Bearer {hm.get('GEMINI_API_KEY', '')}"},
         {"model": "gemini-2.5-flash", "max_tokens": 4, "messages": [{"role": "user", "content": "OK"}]}),
        ("Google Gemini 3 Flash Preview Free-Tier Cap (20 RPD)", "~/.hermes/.env", "GOOGLE_API_KEY", he.get("GOOGLE_API_KEY", ""),
         "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
         {"Authorization": f"Bearer {he.get('GOOGLE_API_KEY', '')}"},
         {"model": "gemini-3-flash-preview", "max_tokens": 4, "messages": [{"role": "user", "content": "OK"}]}),
        ("Google Gemini 2.5 Flash Free-Tier Cap (20 RPD)", "~/.hermes/.env", "GOOGLE_API_KEY", he.get("GOOGLE_API_KEY", ""),
         "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
         {"Authorization": f"Bearer {he.get('GOOGLE_API_KEY', '')}"},
         {"model": "gemini-2.5-flash", "max_tokens": 4, "messages": [{"role": "user", "content": "OK"}]}),
    ]

    results: List[Dict[str, Any]] = []
    for label, env_file, env_var, key, url, extra_headers, payload in candidates:
        kh = hashlib.sha256(key.encode()).hexdigest()[:8] if key else None
        if not key:
            results.append({
                "provider_label": label,
                "env_file": env_file,
                "env_var": env_var,
                "key_sha256_8": None,
                "status": "KEY_MISSING",
                "http_status": None,
                "checked_at": datetime.now(timezone.utc).isoformat(),
            })
            continue
        headers = {"Content-Type": "application/json", "User-Agent": USER_AGENT}
        headers.update(extra_headers)
        req = urllib.request.Request(url, data=json.dumps(payload).encode(), headers=headers)
        try:
            with urllib.request.urlopen(req, timeout=12) as resp:
                results.append({
                    "provider_label": label,
                    "env_file": env_file,
                    "env_var": env_var,
                    "key_sha256_8": kh,
                    "status": "HTTP_200_UNEXPECTED_LIVE",
                    "http_status": resp.status,
                    "checked_at": datetime.now(timezone.utc).isoformat(),
                })
        except urllib.error.HTTPError as e:
            body_text = e.read().decode("utf-8", errors="ignore")[:240]
            results.append({
                "provider_label": label,
                "env_file": env_file,
                "env_var": env_var,
                "key_sha256_8": kh,
                "status": classify_billing_status(e.code, body_text),
                "http_status": e.code,
                "checked_at": datetime.now(timezone.utc).isoformat(),
            })
        except Exception as e:
            results.append({
                "provider_label": label,
                "env_file": env_file,
                "env_var": env_var,
                "key_sha256_8": kh,
                "status": f"TRANSPORT_ERROR:{type(e).__name__}",
                "http_status": None,
                "checked_at": datetime.now(timezone.utc).isoformat(),
            })
    return results


def grade_response(
    item: Dict[str, Any],
    allowed_labels: Sequence[str],
    raw_text: str,
    finish_reason: Optional[str],
    completion_id: Optional[str],
    http_status: Optional[int],
    latency_ms: float,
    error_reason: Optional[str] = None,
) -> Dict[str, Any]:
    """Deterministically grade a single provider completion matching baseline semantics."""
    transport_ok = http_status == 200 and error_reason is None
    truncated = finish_reason == "length"
    raw_sha = sha256_hex(raw_text)

    if not transport_ok:
        return {
            "item_id": item["item_id"],
            "expected": item["expected"],
            "transport_ok": False,
            "http_status": http_status,
            "completion_id": completion_id,
            "latency_ms": round(latency_ms, 1),
            "finish_reason": finish_reason,
            "truncated": False,
            "error_reason": error_reason,
            "response_sha256": raw_sha,
            "response_preview": "",
            "parsed_exact_label": None,
            "parsed_read_label": None,
            "valid_exact": False,
            "valid_read": False,
            "grade_exact": False,
            "grade_read": False,
        }

    if item.get("predicate") == "KEYWORD_MATCH_ALL" or not allowed_labels:
        kw_ok = grade_keyword_match(raw_text, item.get("required_keywords", []))
        label = "KEYWORD_MATCH" if kw_ok else "KEYWORD_MISS"
        preview = re.sub(r"\s+", " ", raw_text)[:80]
        return {
            "item_id": item["item_id"],
            "expected": "KEYWORD_MATCH",
            "transport_ok": True,
            "http_status": http_status,
            "completion_id": completion_id,
            "latency_ms": round(latency_ms, 1),
            "finish_reason": finish_reason,
            "truncated": truncated,
            "response_sha256": raw_sha,
            "response_preview": preview,
            "parsed_exact_label": label,
            "parsed_read_label": label,
            "valid_exact": True,
            "valid_read": True,
            "grade_exact": kw_ok,
            "grade_read": kw_ok,
        }

    ex = EXACT_PARSER.extract_label(raw_text, allowed_labels)
    rd = READ_PARSER.extract_label(raw_text, allowed_labels)
    return {
        "item_id": item["item_id"],
        "expected": item["expected"],
        "transport_ok": True,
        "http_status": http_status,
        "completion_id": completion_id,
        "latency_ms": round(latency_ms, 1),
        "finish_reason": finish_reason,
        "truncated": truncated,
        "response_sha256": raw_sha,
        "response_preview": re.sub(r"\s+", " ", raw_text)[:80],
        "parsed_exact_label": ex.label,
        "parsed_read_label": rd.label,
        "valid_exact": ex.label is not None,
        "valid_read": rd.label is not None,
        "grade_exact": ex.label == item["expected"],
        "grade_read": rd.label == item["expected"],
    }


class RatePacer:
    """Thread-safe adaptive per-target interval + rate-limit header pacer."""

    def __init__(self, target: ProviderTarget) -> None:
        self._target = target
        self._lock = threading.Lock()
        self._next_allowed = 0.0

    def wait_slot(self) -> None:
        with self._lock:
            now = time.monotonic()
            if self._next_allowed > now:
                delay = self._next_allowed - now
            else:
                delay = 0.0
            base = time.monotonic() + delay
            self._next_allowed = base + self._target.min_interval_s
        if delay > 0:
            time.sleep(delay)

    def observe_headers(self, headers: Any) -> None:
        if not headers:
            return
        rem_raw = headers.get("x-ratelimit-remaining-tokens")
        rst_raw = headers.get("x-ratelimit-reset-tokens")
        wait_s = 0.0
        if rem_raw is not None and self._target.tpm_soft_floor > 0:
            try:
                rem = int(float(rem_raw))
                if rem < self._target.tpm_soft_floor:
                    wait_s = max(wait_s, parse_duration_seconds(rst_raw) + 0.3)
            except ValueError:
                pass
        if wait_s > 0:
            with self._lock:
                self._next_allowed = max(self._next_allowed, time.monotonic() + wait_s)

    def backoff_after_429(self, headers: Any, attempt: int) -> float:
        retry_after = parse_duration_seconds(headers.get("retry-after") if headers else None)
        reset_tok = parse_duration_seconds(headers.get("x-ratelimit-reset-tokens") if headers else None)
        wait_s = max(retry_after, reset_tok, min(60.0, 2.0 * (2 ** attempt))) + 0.35
        with self._lock:
            self._next_allowed = max(self._next_allowed, time.monotonic() + wait_s)
        return wait_s


def is_daily_quota_exhausted(http_code: int, body_text: str, headers: Any = None) -> bool:
    """Return True when HTTP 429/402/403 signals daily quota/credit depletion rather than transient RPM throttling."""
    if http_code in (401, 402, 403):
        return True
    if http_code == 429:
        low = body_text.lower()
        if any(tok in low for tok in ("generaterequestsperday", "free_tier_requests", "per day", "free-models-per-day", "insufficient", "suspended")):
            return True
        if parse_duration_seconds(headers.get("retry-after") if headers else None) > 120.0:
            return True
    return False


def call_provider_on_item(
    target: ProviderTarget,
    api_key: str,
    item: Dict[str, Any],
    allowed_labels: Sequence[str],
    pacer: RatePacer,
    urlopen_fn: Callable[..., Any] = urllib.request.urlopen,
) -> Dict[str, Any]:
    """Execute one bank item against an OpenAI-compatible chat completion API."""
    prompt = compose_worker_prompt(item, allowed_labels)
    is_kw = item.get("predicate") == "KEYWORD_MATCH_ALL" or not allowed_labels
    max_tokens = target.kw_max_tokens if is_kw else target.exact_max_tokens
    payload = {
        "model": target.api_model,
        "messages": [{"role": "user", "content": prompt}],
        "temperature": 0,
        "max_tokens": max_tokens,
    }
    encoded = json.dumps(payload).encode("utf-8")
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
        "User-Agent": USER_AGENT,
    }

    last_http: Optional[int] = None
    last_err: Optional[str] = None
    for attempt in range(target.retry_attempts + 1):
        pacer.wait_slot()
        t0 = time.monotonic()
        req = urllib.request.Request(target.endpoint_url, data=encoded, headers=headers)
        try:
            with urlopen_fn(req, timeout=target.timeout_s) as resp:
                latency_ms = (time.monotonic() - t0) * 1000.0
                pacer.observe_headers(getattr(resp, "headers", None))
                data = json.loads(resp.read().decode("utf-8"))
                choice = (data.get("choices") or [{}])[0]
                msg = choice.get("message") or {}
                raw_text = (msg.get("content") or "").strip()
                finish_reason = choice.get("finish_reason")
                return grade_response(
                    item=item,
                    allowed_labels=allowed_labels,
                    raw_text=raw_text,
                    finish_reason=finish_reason,
                    completion_id=data.get("id"),
                    http_status=resp.status,
                    latency_ms=latency_ms,
                )
        except urllib.error.HTTPError as e:
            latency_ms = (time.monotonic() - t0) * 1000.0
            last_http = e.code
            err_headers = getattr(e, "headers", None)
            err_body = ""
            try:
                err_body = e.read().decode("utf-8", errors="ignore")[:600]
            except Exception:
                pass
            last_err = f"HTTP_{e.code}:{err_body[:180]}"
            fatal_quota = is_daily_quota_exhausted(e.code, err_body, err_headers)
            if not fatal_quota and e.code in (429, 500, 502, 503, 504) and attempt < target.retry_attempts:
                wait_s = pacer.backoff_after_429(err_headers, attempt)
                time.sleep(min(wait_s, 65.0))
                continue
            row = grade_response(
                item=item,
                allowed_labels=allowed_labels,
                raw_text="",
                finish_reason=None,
                completion_id=None,
                http_status=last_http,
                latency_ms=latency_ms,
                error_reason=last_err,
            )
            if fatal_quota:
                row["fatal_quota"] = True
            return row
        except Exception as e:
            latency_ms = (time.monotonic() - t0) * 1000.0
            last_err = f"{type(e).__name__}:{str(e)[:120]}"
            if attempt < target.retry_attempts:
                time.sleep(min(2.0 * (2 ** attempt), 30.0))
                continue
            return grade_response(
                item=item,
                allowed_labels=allowed_labels,
                raw_text="",
                finish_reason=None,
                completion_id=None,
                http_status=last_http,
                latency_ms=latency_ms,
                error_reason=last_err,
            )
    raise RuntimeError("unreachable retry termination")


def _slug(s: str) -> str:
    return re.sub(r"[^a-zA-Z0-9._-]+", "_", s).strip("_")


def load_cached_axis_rows(cache_file: Path) -> Dict[str, Dict[str, Any]]:
    """Read completed transport_ok cached rows keyed by item_id."""
    if not cache_file.exists():
        return {}
    out: Dict[str, Dict[str, Any]] = {}
    for line in cache_file.read_text(encoding="utf-8", errors="ignore").splitlines():
        if not line.strip():
            continue
        try:
            row = json.loads(line)
            if row.get("item_id") and row.get("transport_ok") is True:
                out[row["item_id"]] = row
        except json.JSONDecodeError:
            continue
    return out


def run_target_all_axes(
    target: ProviderTarget,
    banks: List[Dict[str, Any]],
    cache_dir: Path,
    progress_cb: Optional[Callable[[str, str, int, int], None]] = None,
) -> List[Dict[str, Any]]:
    """Run one target across all 14 banks with per-item JSONL caching."""
    api_key = load_key_for_target(target)
    if not api_key:
        raise RuntimeError(f"Missing API key {target.env_var} for {target.id}")
    target_cache_dir = cache_dir / _slug(target.id)
    target_cache_dir.mkdir(parents=True, exist_ok=True)
    pacer = RatePacer(target)
    axis_results: List[Dict[str, Any]] = []
    quota_exhausted_reason: Optional[str] = None

    for bank in banks:
        axis = bank["axis"]
        items = bank["items"]
        allowed = bank["allowed_labels"]
        cache_file = target_cache_dir / f"{axis}.jsonl"
        cached = load_cached_axis_rows(cache_file)
        pending = [it for it in items if it["item_id"] not in cached]
        rows_by_id = dict(cached)

        t0 = time.monotonic()
        if pending and quota_exhausted_reason:
            for it in pending:
                rows_by_id[it["item_id"]] = grade_response(
                    it, allowed, "", None, None, None, 0.0, error_reason=quota_exhausted_reason
                )
        elif pending:
            write_lock = threading.Lock()
            with cache_file.open("a", encoding="utf-8") as fh:
                if target.max_workers <= 1:
                    for it in pending:
                        if quota_exhausted_reason:
                            rows_by_id[it["item_id"]] = grade_response(
                                it, allowed, "", None, None, None, 0.0, error_reason=quota_exhausted_reason
                            )
                            continue
                        row = call_provider_on_item(target, api_key, it, allowed, pacer)
                        rows_by_id[it["item_id"]] = row
                        fh.write(json.dumps(row, ensure_ascii=False) + "\n")
                        fh.flush()
                        if row.get("fatal_quota"):
                            quota_exhausted_reason = row.get("error_reason") or "DAILY_QUOTA_EXHAUSTED"
                else:
                    with ThreadPoolExecutor(max_workers=target.max_workers) as pool:
                        pending_iter = iter(pending)
                        futs = {}
                        for _ in range(min(target.max_workers, len(pending))):
                            it = next(pending_iter, None)
                            if it is not None:
                                futs[pool.submit(call_provider_on_item, target, api_key, it, allowed, pacer)] = it
                        while futs:
                            for fut in as_completed(list(futs.keys())):
                                futs.pop(fut)
                                row = fut.result()
                                rows_by_id[row["item_id"]] = row
                                with write_lock:
                                    fh.write(json.dumps(row, ensure_ascii=False) + "\n")
                                    fh.flush()
                                if row.get("fatal_quota") and not quota_exhausted_reason:
                                    quota_exhausted_reason = row.get("error_reason") or "DAILY_QUOTA_EXHAUSTED"
                                if not quota_exhausted_reason:
                                    nxt = next(pending_iter, None)
                                    if nxt is not None:
                                        futs[pool.submit(call_provider_on_item, target, api_key, nxt, allowed, pacer)] = nxt
                                break
                    if quota_exhausted_reason:
                        for it in pending:
                            if it["item_id"] not in rows_by_id:
                                rows_by_id[it["item_id"]] = grade_response(
                                    it, allowed, "", None, None, None, 0.0, error_reason=quota_exhausted_reason
                                )

        ordered_rows = [rows_by_id[it["item_id"]] for it in items]
        wall_s = round(time.monotonic() - t0, 2)
        run_obj = {
            "model": target.id,
            "vendor": target.vendor,
            "provider": target.provider,
            "api_model": target.api_model,
            "axis": axis,
            "bank_sha256": bank["bank_sha256"],
            "wall_clock_seconds": wall_s,
            "exact_label_v1_gate": compute_measure_g2_gate(len(items), ordered_rows, "valid_exact", "grade_exact"),
            "read_label_v1_gate": compute_measure_g2_gate(len(items), ordered_rows, "valid_read", "grade_read"),
            "_all_items": ordered_rows,
            "sample_receipts_first_5": ordered_rows[:5],
        }
        axis_results.append(run_obj)
        if progress_cb:
            g = run_obj["read_label_v1_gate"]
            progress_cb(target.id, axis, g.get("n_correct", 0), g.get("n_valid", 0))
    return axis_results


def build_report(
    fleet: Sequence[ProviderTarget],
    banks: List[Dict[str, Any]],
    runs_by_target: Dict[str, List[Dict[str, Any]]],
    preflight_blocks: List[Dict[str, Any]],
) -> Dict[str, Any]:
    """Assemble the complete canonical JSON report across all 14 axes."""
    total_items = sum(b["n_total"] for b in banks)
    axes_payload: List[Dict[str, Any]] = []
    sep_counts_read = {"SEPARATED": 0, "TIE": 0, "UNTESTED": 0}
    sep_counts_exact = {"SEPARATED": 0, "TIE": 0, "UNTESTED": 0}
    total_calls = 0
    total_ok = 0

    for idx, bank in enumerate(banks):
        axis_runs: List[Dict[str, Any]] = []
        for target in fleet:
            if target.id in runs_by_target:
                run = runs_by_target[target.id][idx]
                axis_runs.append(run)
                rows = run["_all_items"]
                total_calls += len(rows)
                total_ok += sum(1 for r in rows if r.get("transport_ok"))

        mcn_read = compute_axis_mcnemar_separation(axis_runs, "valid_read", "grade_read", "read_label_v1_gate")
        mcn_exact = compute_axis_mcnemar_separation(axis_runs, "valid_exact", "grade_exact", "exact_label_v1_gate")
        sep_counts_read[mcn_read["separation"]] = sep_counts_read.get(mcn_read["separation"], 0) + 1
        sep_counts_exact[mcn_exact["separation"]] = sep_counts_exact.get(mcn_exact["separation"], 0) + 1

        # Strip full `_all_items` in public report to keep bundle compact while preserving
        # per-item compact outcome hashes (`item_outcomes`) for full auditability.
        public_runs = []
        for r in axis_runs:
            compact_items = [
                {
                    "item_id": row["item_id"],
                    "expected": row["expected"],
                    "parsed_read_label": row["parsed_read_label"],
                    "valid_read": row["valid_read"],
                    "grade_read": row["grade_read"],
                    "valid_exact": row["valid_exact"],
                    "grade_exact": row["grade_exact"],
                    "response_sha256": row["response_sha256"],
                    "http_status": row["http_status"],
                }
                for row in r["_all_items"]
            ]
            public_runs.append({
                "model": r["model"],
                "vendor": r["vendor"],
                "provider": r["provider"],
                "api_model": r["api_model"],
                "axis": r["axis"],
                "bank_sha256": r["bank_sha256"],
                "wall_clock_seconds": r["wall_clock_seconds"],
                "exact_label_v1_gate": r["exact_label_v1_gate"],
                "read_label_v1_gate": r["read_label_v1_gate"],
                "sample_receipts_first_5": r["sample_receipts_first_5"],
                "item_outcomes": compact_items,
            })

        axes_payload.append({
            "axis": bank["axis"],
            "bank_path": str(Path(bank["bank_path"]).relative_to(REPO_ROOT)),
            "bank_sha256": bank["bank_sha256"],
            "predicate_mode": bank["predicate_mode"],
            "allowed_labels": bank["allowed_labels"],
            "n_total": bank["n_total"],
            "mcnemar_read_label_v1": mcn_read,
            "mcnemar_exact_label_v1": mcn_exact,
            "model_runs": public_runs,
        })

    model_summary: List[Dict[str, Any]] = []
    for target in fleet:
        if target.id not in runs_by_target:
            continue
        runs = runs_by_target[target.id]
        n_total_all = sum(r["read_label_v1_gate"]["n_total"] for r in runs)
        n_valid_read = sum(r["read_label_v1_gate"]["n_valid"] for r in runs)
        n_correct_read = sum(r["read_label_v1_gate"]["n_correct"] for r in runs)
        n_valid_exact = sum(r["exact_label_v1_gate"]["n_valid"] for r in runs)
        n_correct_exact = sum(r["exact_label_v1_gate"]["n_correct"] for r in runs)
        axes_measured = sum(1 for r in runs if r["read_label_v1_gate"].get("admissible_n_ge_30"))
        model_summary.append({
            "model": target.id,
            "vendor": target.vendor,
            "provider": target.provider,
            "api_model": target.api_model,
            "axes_measured_g2": axes_measured,
            "axes_total_in_family": len(banks),
            "n_items": n_total_all,
            "n_valid_read": n_valid_read,
            "n_correct_read": n_correct_read,
            "micro_accuracy_read": round(n_correct_read / n_valid_read, 4) if n_valid_read else None,
            "n_valid_exact": n_valid_exact,
            "n_correct_exact": n_correct_exact,
            "micro_accuracy_exact": round(n_correct_exact / n_valid_exact, 4) if n_valid_exact else None,
            "note": "Proprietary and third-party open-weight systems only; no CSOAI-tuned models scored or ranked.",
        })

    report: Dict[str, Any] = {
        "schema": SCHEMA,
        "issuer": "CSOAI Ltd (GB, Companies House 16939677)",
        "doctrine": "Measurement, never certification. Ties are TIE (exact two-sided McNemar p >= 0.05); UNMEASURED stays null.",
        "observed_on": datetime.now(timezone.utc).date().isoformat(),
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "execution_mode": "LIVE_MULTI_PROVIDER_FRONTIER_14_BEHAVIOURAL_AXES",
        "scope_note": (
            "Measures the 14 canonical behavioural GSPC axes (the behavioural family subset of the 34-slot live GSPC board). "
            "Kept explicitly separate from the 2026-10-29 HuggingFace 4-model baseline (csoai.gspc-live-hf-14-axes/1.0)."
        ),
        "card_signing_state": "CARD_CANDIDATE_UNSIGNED",
        "models": [m["model"] for m in model_summary],
        "model_summary": model_summary,
        "preflight_billing_blocks": preflight_blocks,
        "totals": {
            "behavioural_axes_executed": len(banks),
            "models_executed": len(model_summary),
            "bank_items_per_model": total_items,
            "total_live_http_calls": total_calls,
            "total_http_200_ok": total_ok,
            "separation_summary_read_label_v1": sep_counts_read,
            "separation_summary_exact_label_v1": sep_counts_exact,
        },
        "axes": axes_payload,
    }
    digest = sha256_hex(canonical_json(report))
    report["report_sha256"] = digest
    return report


def render_markdown(report: Dict[str, Any]) -> str:
    """Render concise deterministic Markdown report preserving three-state McNemar verdicts."""
    t = report["totals"]
    lines = [
        f"# GSPC Live Frontier Multi-Provider Measurement ({report['observed_on']})",
        "",
        f"- **Schema:** `{report['schema']}`",
        f"- **Report SHA-256:** `{report['report_sha256']}`",
        f"- **Card state:** `{report['card_signing_state']}` (unsigned measurement run; verify live cards at https://councilof.ai/verify)",
        f"- **Scope:** {t['behavioural_axes_executed']} canonical behavioural GSPC axes (subset of the live GSPC board, {t['bank_items_per_model']} items/model) across {t['models_executed']} live models ({t['total_http_200_ok']}/{t['total_live_http_calls']} HTTP 200 completions).",
        "- **Doctrine:** Measurement, never certification. Own models excluded. Ties (`p >= 0.05` exact two-sided McNemar) remain `TIE`.",
        "",
        "## Fleet Summary (`read-label-v1`, 885-item frozen behavioural core)",
        "",
        "| Model | Vendor | Behavioural Axes (G2) | Valid Items | Correct | Micro Accuracy |",
        "|---|---|---:|---:|---:|---:|",
    ]
    for m in report["model_summary"]:
        acc = f"{m['micro_accuracy_read']:.4f}" if m["micro_accuracy_read"] is not None else "null"
        lines.append(
            f"| `{m['model']}` | {m['vendor']} | {m['axes_measured_g2']}/{m['axes_total_in_family']} | {m['n_valid_read']}/{m['n_items']} | {m['n_correct_read']} | {acc} |"
        )
    lines.extend([
        "",
        "## Per-Axis Exact McNemar Separation (`read-label-v1`)",
        "",
        f"- Summary: `SEPARATED={t['separation_summary_read_label_v1'].get('SEPARATED', 0)}`, `TIE={t['separation_summary_read_label_v1'].get('TIE', 0)}`, `UNTESTED={t['separation_summary_read_label_v1'].get('UNTESTED', 0)}`",
        "",
        "| Axis | n | Point Leader | Point Acc | Separation | p-value |",
        "|---|---:|---|---:|---|---:|",
    ])
    for ax in report["axes"]:
        mcn = ax["mcnemar_read_label_v1"]
        leader = f"`{mcn.get('point_leader')}`" if mcn.get("point_leader") else "null"
        lacc = f"{mcn['point_leader_accuracy']:.4f}" if mcn.get("point_leader_accuracy") is not None else "null"
        pval = f"{mcn['exact_mcnemar_two_sided_p']:.4f}" if mcn.get("exact_mcnemar_two_sided_p") is not None else "null"
        sep = mcn["separation"]
        if sep == "SEPARATED" and mcn.get("leader"):
            sep = f"SEPARATED (`{mcn['leader']}`)"
        lines.append(f"| `{ax['axis']}` | {ax['n_total']} | {leader} | {lacc} | `{sep}` | {pval} |")
    lines.extend([
        "",
        "## Verified Provider Billing & Credit Preflight Blocks (Not Imputed)",
        "",
        "These direct provider accounts were probed live; because zero credits / low balances returned HTTP errors, zero synthetic scores were entered:",
        "",
        "| Endpoint / Provider | Key SHA-256[:8] | Observed HTTP | Billing State |",
        "|---|---|---:|---|",
    ])
    for blk in report["preflight_billing_blocks"]:
        lines.append(
            f"| {blk['provider_label']} | `{blk.get('key_sha256_8')}` | {blk.get('http_status')} | `{blk['status']}` |"
        )
    lines.extend(["", "> Measurement, not certification. Anyone can re-check at https://councilof.ai/verify", ""])
    return "\n".join(lines)


def main(argv: Optional[Sequence[str]] = None) -> int:
    parser = argparse.ArgumentParser(description="Run live multi-provider frontier GSPC 14-axis evaluation.")
    parser.add_argument("--cache-dir", type=Path, default=DEFAULT_CACHE_DIR)
    parser.add_argument("--json-out", type=Path, default=DEFAULT_JSON_OUT)
    parser.add_argument("--md-out", type=Path, default=DEFAULT_MD_OUT)
    parser.add_argument("--models", type=str, default="", help="Comma-separated subset of target IDs")
    parser.add_argument("--skip-preflight-blocks", action="store_true")
    args = parser.parse_args(argv)

    banks = [load_axis_bank(axis, path) for axis, path in CANONICAL_14_AXES_BANKS]
    fleet = list(DEFAULT_FLEET)
    if args.models:
        wanted = {m.strip() for m in args.models.split(",") if m.strip()}
        fleet = [t for t in fleet if t.id in wanted]

    preflight_blocks = [] if args.skip_preflight_blocks else probe_blocked_providers()
    runs_by_target: Dict[str, List[Dict[str, Any]]] = {}
    lock = threading.Lock()

    def _log(mid: str, ax: str, corr: int, valid: int) -> None:
        print(f"[progress] {mid} {ax}: {corr}/{valid}", flush=True)

    # Run all models concurrently across distinct provider endpoints (each endpoint enforces its own RatePacer).
    with ThreadPoolExecutor(max_workers=len(fleet) or 1) as pool:
        futs = {
            pool.submit(run_target_all_axes, t, banks, args.cache_dir, _log): t
            for t in fleet
        }
        for fut in as_completed(futs):
            t = futs[fut]
            res = fut.result()
            with lock:
                runs_by_target[t.id] = res
                print(f"[model-done] {t.id} across {len(res)} axes", flush=True)

    report = build_report(fleet, banks, runs_by_target, preflight_blocks)
    args.json_out.parent.mkdir(parents=True, exist_ok=True)
    args.md_out.parent.mkdir(parents=True, exist_ok=True)
    args.json_out.write_text(json.dumps(report, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    args.md_out.write_text(render_markdown(report), encoding="utf-8")
    print(f"[complete] sha={report['report_sha256']} ok={report['totals']['total_http_200_ok']}/{report['totals']['total_live_http_calls']}", flush=True)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
