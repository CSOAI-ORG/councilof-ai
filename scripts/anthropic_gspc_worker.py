#!/usr/bin/env python3
"""Compute-only GSPC worker for Claude models reached over the Anthropic API.

A sibling of runpod_gspc_worker.py, not a modification of it. That worker's
evidence boundary is "loopback Ollama only"; this one's is "the public Anthropic
Messages API, with the endpoint identity pinned by the Models API record". The
two boundaries are different claims, so they live in different files and their
runs carry different subjects:

    ollama:<tag>@sha256:<Ollama manifest digest>      (weights pinned)
    anthropic-api:<model id>@sha256:<model record>    (endpoint record pinned,
                                                       weights NOT pinnable)

Everything that decides a grade is reused unchanged from runpod_gspc_worker:
the frozen-bank loader and its digest check, the prompt composer, the
exact-label parser, the keyword grader, and the rule that an unparsed or
token-cut answer leaves n rather than counting as wrong.

Like the Ollama worker, this stops at an UNSIGNED, UNMEASURED candidate. It
never loads a signing key, never publishes, never touches a board. Admission
and signing belong to the control plane, which today accepts only the ollama:
subject class -- see docs/measure/ANTHROPIC-API-SUBJECT-CLASS-2026-10-13.md.

Two instrument facts differ from the open fleet and are recorded, not hidden:
  * Sampling: on all four current Claude API models a non-default temperature,
    top_p or top_k is rejected with HTTP 400, so runs use provider-default
    sampling and are NOT temperature-0 deterministic. No seed exists.
  * Thinking: Fable 5.1 and Opus 5.5 reject thinking "disabled"; they run
    adaptive thinking at the lowest effort ("low"). Sonnet 5.5 runs
    "between_tools" (no up-front thinking); Haiku 5.5 runs "disabled".
    The exact request shape per model is in the instrument descriptor.
"""

from __future__ import annotations

import argparse
import concurrent.futures
import dataclasses
from decimal import Decimal, InvalidOperation
import json
import os
import random
import sys
import threading
import time
import urllib.error
import urllib.request
from pathlib import Path
from typing import Any, Callable, Protocol

sys.path.insert(0, str(Path(__file__).resolve().parent))

from runpod_gspc_worker import (  # noqa: E402  (sibling import, same directory)
    CANONICAL_MODEL_AXES,
    INTENDED_DID,
    MAX_CARD_BYTES,
    SHA256_RE,
    BankItem,
    WorkerError,
    append_json_line,
    canonical_json_bytes,
    compose_prompt,
    exclusive_write_bytes,
    grade_keyword_match,
    load_frozen_bank,
    parse_exact_label,
    sha256_bytes,
    sha256_file,
    utc_now,
    _run_id,
)

WORKER_SCHEMA = "csoai.anthropic-gspc-worker/0.1"
ITEM_SCHEMA = "csoai.anthropic-gspc-item-evidence/0.1"
RUN_SCHEMA = "csoai.anthropic-gspc-run/0.1"
API_BASE = "https://api.anthropic.com"
API_VERSION = "2023-06-01"
UNSIGNED_REASON = "unsigned compute output; admission and verification required"
MAX_HTTP_RESPONSE_BYTES = 2 * 1024 * 1024
RETRYABLE_STATUS = frozenset({408, 409, 429, 500, 502, 503, 504, 529})

# Per-model request shape. Sources, read 2026-10-13:
#   platform.claude.com/docs/en/build-with-claude/thinking  (which models reject "disabled";
#     non-default temperature/top_p/top_k -> 400 on all four)
#   platform.claude.com/docs/en/build-with-claude/effort    (all five effort levels on all four)
# None = omit the field (adaptive thinking, the only mode these models accept).
THINKING_BY_MODEL: dict[str, dict[str, str] | None] = {
    "claude-fable-5-1": None,
    "claude-opus-5-5": None,
    "claude-sonnet-5-5": {"type": "between_tools"},
    "claude-haiku-5-5": {"type": "disabled"},
}

# USD per million tokens, standard (non-batch) tier, Haiku <=100k-token prompts.
# Source: platform.claude.com/docs/en/about-claude/pricing, read 2026-10-13.
# Used ONLY for the budget guard; never written to a card (no public $ prices).
PRICE_PER_MTOK: dict[str, tuple[float, float]] = {
    "claude-fable-5-1": (10.0, 50.0),
    "claude-opus-5-5": (4.0, 20.0),
    "claude-sonnet-5-5": (2.0, 10.0),
    "claude-haiku-5-5": (0.10, 0.50),
}

# Instrument parity with fleet-next-models-2026-10-06/QUEUE.md: reasoning-capable models
# run exact-label at max_tokens 2048 and swarm (all-keyword) at 1024.
DEFAULT_MAX_TOKENS_LABEL = 2048
DEFAULT_MAX_TOKENS_KEYWORD = 1024


# ----------------------------------------------------------------------------- jobs


@dataclasses.dataclass(frozen=True)
class AnthropicJob:
    axis: str
    model: str
    bank_path: Path
    expected_bank_sha256: str
    allowed_labels: tuple[str, ...]
    output_dir: Path
    max_tokens: int
    effort: str
    request_timeout_seconds: int

    def subject_id(self, model_record_digest: str) -> str:
        return f"anthropic-api:{self.model}@{model_record_digest}"

    def request_shape(self) -> dict[str, Any]:
        shape: dict[str, Any] = {
            "max_tokens": self.max_tokens,
            "output_config": {"effort": self.effort},
        }
        thinking = THINKING_BY_MODEL[self.model]
        if thinking is not None:
            shape["thinking"] = dict(thinking)
        return shape

    def instrument_descriptor(
        self, bank_sha256: str, model_record_digest: str, terms_sha256: str | None
    ) -> dict[str, Any]:
        return {
            "schema": WORKER_SCHEMA,
            "axis": self.axis,
            "model_transport": self.model,
            "subject": self.subject_id(model_record_digest),
            "subject_pin_kind": "anthropic-models-api-record-sha256 (endpoint record, not weights)",
            "bank_sha256": bank_sha256,
            "model_record_digest": model_record_digest,
            "allowed_labels": list(self.allowed_labels),
            "endpoint": f"{API_BASE}/v1/messages",
            "anthropic_version": API_VERSION,
            "request_shape": self.request_shape(),
            "decode": {
                "sampling": "provider-default (non-default temperature/top_p/top_k rejected with HTTP 400 on this model)",
                "seed": None,
                "max_tokens": self.max_tokens,
                "stream": False,
                "system_prompt": None,
            },
            "graders": {
                "exact_label": "unicode-exact-after-outer-whitespace-v1",
                "keyword_match": "all-nfkc-casefold-whitespace-normalized-substrings-v2-length-unanswered",
            },
            "graded_text": "concatenated text blocks only; thinking blocks are never graded or stored",
            "prompt_adapter": "frozen-prompt-plus-public-label-set-v1",
            "provider_terms_archive_sha256": terms_sha256,
        }


def load_allowlist(path: Path) -> dict[str, list[str]]:
    raw = json.loads(path.read_text(encoding="utf-8"))
    if raw.get("schema") != "csoai.runpod-gspc-bank-allowlist/0.1":
        raise WorkerError("BAD_ALLOWLIST", "unexpected allowlist schema")
    allowed: dict[str, list[str]] = {}
    for entry in raw.get("banks", []):
        axis, digest = entry.get("axis"), entry.get("sha256")
        if axis not in CANONICAL_MODEL_AXES or not SHA256_RE.fullmatch(str(digest)):
            raise WorkerError("BAD_ALLOWLIST", f"bad allowlist entry: {entry!r}")
        allowed.setdefault(axis, []).append(digest)
    return allowed


def labels_from_bank(path: Path) -> tuple[str, ...]:
    """Sorted distinct gold labels -- the same rule the pod's Ollama job configs use."""
    labels: set[str] = set()
    for line in path.read_text(encoding="utf-8").splitlines():
        if not line.strip():
            continue
        row = json.loads(line)
        if row.get("_canary") is not None or row.get("_meta") is not None:
            continue
        value = row.get("expected") if row.get("expected") is not None else row.get("target")
        if isinstance(value, str) and value.strip() and value.strip() != "KEYWORD_MATCH":
            labels.add(value.strip())
    return tuple(sorted(labels))


def plan_jobs(
    *,
    model: str,
    axes: list[str],
    banks_dir: Path,
    allowlist: dict[str, list[str]],
    output_dir: Path,
    effort: str,
    max_tokens_label: int,
    max_tokens_keyword: int,
    request_timeout_seconds: int,
) -> list[AnthropicJob]:
    if model not in THINKING_BY_MODEL:
        raise WorkerError("UNSUPPORTED_MODEL", f"no pinned request shape for {model}")
    by_digest = {sha256_file(p): p for p in sorted(banks_dir.glob("*.json*")) if p.is_file() and not p.is_symlink()}
    jobs: list[AnthropicJob] = []
    for axis in axes:
        if axis not in allowlist:
            raise WorkerError("AXIS_NOT_ALLOWLISTED", f"{axis} has no allowlisted bank")
        found = [(d, by_digest[d]) for d in allowlist[axis] if d in by_digest]
        if not found:
            raise WorkerError("BANK_NOT_FOUND", f"no bank in {banks_dir} matches the allowlist for {axis}")
        digest, path = found[0]
        labels = labels_from_bank(path)
        keyword_bank = not labels
        jobs.append(
            AnthropicJob(
                axis=axis,
                model=model,
                bank_path=path,
                expected_bank_sha256=digest,
                allowed_labels=labels,
                output_dir=output_dir,
                max_tokens=max_tokens_keyword if keyword_bank else max_tokens_label,
                effort=effort,
                request_timeout_seconds=request_timeout_seconds,
            )
        )
    return jobs


# --------------------------------------------------------------------------- client


@dataclasses.dataclass(frozen=True)
class ApiResult:
    transport_ok: bool
    raw_output: str | None
    response_sha256: str | None
    error_code: str | None
    response_model: str | None = None
    stop_reason: str | None = None
    stop_details: Any = None
    input_tokens: int | None = None
    output_tokens: int | None = None
    attempts: int = 1


class Transport(Protocol):
    def __call__(
        self, method: str, url: str, headers: dict[str, str], body: bytes | None, timeout: int
    ) -> tuple[int, dict[str, str], bytes]: ...


class RejectRedirects(urllib.request.HTTPRedirectHandler):
    """Do not forward the API key to any redirect target, including the same host."""

    def redirect_request(self, request, file_pointer, code, message, headers, new_url):
        raise urllib.error.HTTPError(
            request.full_url, code, "Anthropic API redirect blocked", headers, file_pointer
        )


def urllib_transport(
    method: str, url: str, headers: dict[str, str], body: bytes | None, timeout: int
) -> tuple[int, dict[str, str], bytes]:
    request = urllib.request.Request(url, data=body, method=method, headers=headers)
    # Match the sibling worker's explicit transport boundary: no ambient proxy
    # and no automatic redirect carrying the credential outside this attempt.
    opener = urllib.request.build_opener(urllib.request.ProxyHandler({}), RejectRedirects())
    try:
        with opener.open(request, timeout=timeout) as response:
            raw = response.read(MAX_HTTP_RESPONSE_BYTES + 1)
            return response.status, {k.lower(): v for k, v in response.headers.items()}, raw
    except urllib.error.HTTPError as error:
        raw = error.read(MAX_HTTP_RESPONSE_BYTES + 1) if error.fp else b""
        return error.code, {k.lower(): v for k, v in (error.headers or {}).items()}, raw


class AnthropicClient:
    def __init__(
        self,
        api_key: str,
        *,
        transport: Transport = urllib_transport,
        base_url: str = API_BASE,
        max_attempts: int = 6,
        sleep: Callable[[float], None] = time.sleep,
    ) -> None:
        if not api_key:
            raise WorkerError("NO_API_KEY", "no Anthropic API key available")
        self._key = api_key
        self._transport = transport
        self._base = base_url.rstrip("/")
        self._max_attempts = max_attempts
        self._sleep = sleep

    def _headers(self) -> dict[str, str]:
        return {
            "x-api-key": self._key,
            "anthropic-version": API_VERSION,
            "content-type": "application/json",
            "accept": "application/json",
            "user-agent": "csoai-anthropic-gspc-worker",
        }

    def _call(
        self, method: str, path: str, body: bytes | None, timeout: int,
        *, budget: BudgetGuard | None = None,
    ) -> tuple[int, bytes, int, str | None]:
        attempts = 0
        last_code: str | None = None
        while attempts < self._max_attempts:
            ticket = None
            if method == "POST":
                if budget is None:
                    return 0, b"", attempts, "BUDGET_BOUND_REQUIRED"
                ticket = budget.reserve()
                if ticket is None:
                    return 0, b"", attempts, budget.halted_reason or "BUDGET_CAP"
            attempts += 1
            try:
                status, headers, raw = self._transport(method, f"{self._base}{path}", self._headers(), body, timeout)
            except (urllib.error.URLError, TimeoutError, OSError):
                status, headers, raw, last_code = 0, {}, b"", "API_UNREACHABLE"
            except Exception:
                if ticket is not None:
                    budget.retain(ticket)
                raise
            if len(raw) > MAX_HTTP_RESPONSE_BYTES:
                if ticket is not None:
                    budget.retain(ticket)
                return status, b"", attempts, "API_RESPONSE_TOO_LARGE"
            if ticket is not None:
                if status == 200:
                    budget_error = budget.reconcile(ticket, raw)
                    if budget_error:
                        return status, raw, attempts, budget_error
                else:
                    # An error/timeout is not proof that an attempt was unbilled.
                    # Keep its whole bound; a retry needs a new atomic reservation.
                    budget.retain(ticket)
            if status == 200:
                return status, raw, attempts, None
            if status and status not in RETRYABLE_STATUS:
                return status, raw, attempts, f"API_HTTP_{status}"
            last_code = f"API_HTTP_{status}" if status else last_code
            retry_after = headers.get("retry-after")
            try:
                delay = float(retry_after) if retry_after else 0.0
            except ValueError:
                delay = 0.0
            delay = max(delay, min(60.0, 2.0 ** attempts)) + random.uniform(0, 1)
            if attempts < self._max_attempts:
                self._sleep(delay)
        return 0, b"", attempts, last_code or "API_RETRIES_EXHAUSTED"

    def model_record_digest(self, model: str) -> tuple[str, dict[str, Any]]:
        status, raw, _attempts, error = self._call("GET", f"/v1/models/{model}", None, 60)
        if error or status != 200:
            raise WorkerError("MODEL_RECORD_UNAVAILABLE", f"models API returned {error or status}")
        record = json.loads(raw)
        if not isinstance(record, dict) or record.get("id") != model:
            raise WorkerError("MODEL_RECORD_MISMATCH", "models API record does not name the configured model")
        return f"sha256:{sha256_bytes(canonical_json_bytes(record))}", record

    def generate(self, job: AnthropicJob, prompt: str, *, budget: BudgetGuard) -> ApiResult:
        body = {"model": job.model, "messages": [{"role": "user", "content": prompt}], **job.request_shape()}
        status, raw, attempts, error = self._call(
            "POST", "/v1/messages", canonical_json_bytes(body), job.request_timeout_seconds, budget=budget
        )
        if error:
            return ApiResult(False, None, sha256_bytes(raw) if raw else None, error, attempts=attempts)
        response_sha256 = sha256_bytes(raw)
        try:
            payload = json.loads(raw)
        except json.JSONDecodeError:
            return ApiResult(False, None, response_sha256, "API_INVALID_JSON", attempts=attempts)
        content = payload.get("content") if isinstance(payload, dict) else None
        if not isinstance(content, list):
            return ApiResult(False, None, response_sha256, "API_MISSING_CONTENT", attempts=attempts)
        text = "".join(
            block.get("text", "") for block in content if isinstance(block, dict) and block.get("type") == "text"
        )
        usage = payload.get("usage") if isinstance(payload.get("usage"), dict) else {}
        return ApiResult(
            transport_ok=True,
            raw_output=text,
            response_sha256=response_sha256,
            error_code=None,
            response_model=payload.get("model") if isinstance(payload.get("model"), str) else None,
            stop_reason=payload.get("stop_reason") if isinstance(payload.get("stop_reason"), str) else None,
            stop_details=payload.get("stop_details"),
            input_tokens=usage.get("input_tokens") if isinstance(usage.get("input_tokens"), int) else None,
            output_tokens=usage.get("output_tokens") if isinstance(usage.get("output_tokens"), int) else None,
            attempts=attempts,
        )


class DryRunClient:
    """No network. Answers the first allowed label (or echoes the prompt for keyword items).

    Exists to prove the evidence pipeline end to end without a key. Its runs are
    marked dry_run and their subject says so; they must never be pushed to intake.
    """

    def model_record_digest(self, model: str) -> tuple[str, dict[str, Any]]:
        record = {"id": model, "type": "model", "dry_run": True}
        return f"sha256:{sha256_bytes(canonical_json_bytes(record))}", record

    def generate(self, job: AnthropicJob, prompt: str, *, budget: BudgetGuard) -> ApiResult:
        text = job.allowed_labels[0] if job.allowed_labels else prompt
        raw = canonical_json_bytes({"dry_run": True, "text": text})
        return ApiResult(True, text, sha256_bytes(raw), None, job.model, "end_turn", None, len(prompt) // 4, 1)


# ------------------------------------------------------------------------------ run


class BudgetGuard:
    """Atomic admission against an explicit per-attempt cost bound.

    This is not a provider-enforced billing ceiling. The operator must establish
    a conservative bound and an independent provider cap before any paid run.
    Unknown attempts retain their full bound; returned usage never counts as zero
    merely because it is missing. Decimal arithmetic avoids monetary round-off.
    """

    def __init__(self, model: str, cap_usd: float, request_cost_bound_usd: float | None = None) -> None:
        self.model = model
        self.input_price, self.output_price = (Decimal(str(v)) for v in PRICE_PER_MTOK[model])
        try:
            self.cap_usd = Decimal(str(cap_usd))
            self.request_bound = Decimal(str(request_cost_bound_usd)) if request_cost_bound_usd is not None else None
            if not self.cap_usd.is_finite() or self.cap_usd < 0:
                raise ValueError
            if self.request_bound is not None and (not self.request_bound.is_finite() or self.request_bound <= 0):
                raise ValueError
        except (InvalidOperation, ValueError):
            raise WorkerError("BUDGET_CONFIG", "budget must be finite/non-negative and request bound finite/positive")
        self._spent = Decimal(0)
        self._unknown = Decimal(0)
        self._reservations: dict[int, Decimal] = {}
        self._next_ticket = 0
        self.halted_reason: str | None = None
        self._lock = threading.Lock()

    @property
    def spent_usd(self) -> float:
        with self._lock:
            return float(self._spent)

    @property
    def committed_usd(self) -> float:
        with self._lock:
            return float(self._spent + self._unknown + sum(self._reservations.values(), Decimal(0)))

    def reserve(self) -> int | None:
        with self._lock:
            if self.halted_reason:
                return None
            if self.request_bound is None:
                self.halted_reason = "BUDGET_BOUND_REQUIRED"
                return None
            committed = self._spent + self._unknown + sum(self._reservations.values(), Decimal(0))
            if committed + self.request_bound > self.cap_usd:
                return None
            self._next_ticket += 1
            self._reservations[self._next_ticket] = self.request_bound
            return self._next_ticket

    def retain(self, ticket: int) -> None:
        with self._lock:
            self._unknown += self._reservations.pop(ticket)

    def reconcile(self, ticket: int, raw: bytes) -> str | None:
        with self._lock:
            bound = self._reservations.pop(ticket)
            try:
                payload = json.loads(raw)
                usage = payload.get("usage")
                inp, out = usage["input_tokens"], usage["output_tokens"]
                if type(inp) is not int or type(out) is not int or inp < 0 or out < 0:
                    raise ValueError
            except (ValueError, TypeError, KeyError, AttributeError):
                self._unknown += bound
                self.halted_reason = "BUDGET_USAGE_UNKNOWN"
                return self.halted_reason
            if payload.get("model") != self.model:
                # We cannot price another/missing model as the configured model.
                # Its response is rejected separately by run_job's attribution check.
                self._unknown += bound
                return None
            actual = (inp * self.input_price + out * self.output_price) / Decimal(1_000_000)
            self._spent += actual
            if actual > bound:
                self.halted_reason = "BUDGET_BOUND_EXCEEDED"
                return self.halted_reason
            return None


def stage_card(
    *, job: AnthropicJob, run_id: str, bank_sha256: str, model_record_digest: str,
    instrument_sha256: str, evidence_sha256: str, hits: int, n: int,
    parse_errors: int, transport_errors: int, reason: str,
) -> dict[str, Any]:
    accuracy: float | int | None = None
    if n:
        accuracy = round(hits / n, 4)
        if isinstance(accuracy, float) and accuracy.is_integer():
            accuracy = int(accuracy)
    body = {
        "kind": "gspc.measurement-card",
        "axis": job.axis,
        "model": job.subject_id(model_record_digest),
        "issuer": "CSOAI Ltd",
        "n": n,
        "accuracy": accuracy,
        "status": "UNMEASURED",
        "unmeasured": [reason],
        "public_framing": "Measurement, not certification. Empty is not zero.",
        "verify": "https://councilof.ai/gspc-verify",
        "brand": "Council of AI",
        "compute_evidence": {
            "run_id": run_id,
            "bank_sha256": bank_sha256,
            "model_record_digest": model_record_digest,
            "instrument_sha256": instrument_sha256,
            "items_sha256": evidence_sha256,
            "parse_errors_excluded": parse_errors,
            "transport_errors_excluded": transport_errors,
        },
    }
    body_bytes = canonical_json_bytes(body)
    card = {
        "alg": "Ed25519",
        "body": body,
        "id": sha256_bytes(body_bytes),
        "preimage_rule": "sha256(canonical body)",
        "signature": None,
        "did_intended": INTENDED_DID,
    }
    if len(body_bytes) > MAX_CARD_BYTES or len(canonical_json_bytes(card)) > MAX_CARD_BYTES:
        raise WorkerError("CARD_TOO_LARGE", "unsigned candidate exceeds the 3 KiB cap")
    return card


def run_job(
    job: AnthropicJob,
    client: Any,
    *,
    budget: BudgetGuard,
    concurrency: int = 4,
    terms_sha256: str | None = None,
    dry_run: bool = False,
    log: Callable[[str], None] = lambda message: print(message, file=sys.stderr, flush=True),
) -> dict[str, Any]:
    items, bank_sha256 = load_frozen_bank(job)  # duck-typed: bank_path, expected_bank_sha256, allowed_labels
    model_record_digest, model_record = client.model_record_digest(job.model)
    instrument = job.instrument_descriptor(bank_sha256, model_record_digest, terms_sha256)
    if dry_run:
        instrument["dry_run"] = True
    instrument_sha256 = sha256_bytes(canonical_json_bytes(instrument))
    run_id = _run_id()
    run_dir = job.output_dir / "runs" / run_id
    run_dir.mkdir(parents=True, exist_ok=False)
    exclusive_write_bytes(run_dir / "model-record.json", json.dumps(model_record, indent=2, sort_keys=True).encode() + b"\n")
    evidence_path = run_dir / "items.jsonl"
    started = utc_now()
    counts = {"attempted": 0, "transport_ok": 0, "transport_errors": 0, "parse_errors": 0, "correct": 0}
    stop_reasons: dict[str, int] = {}
    halted: str | None = None

    def call(sequence: int, item: BankItem) -> tuple[int, BankItem, str, ApiResult, str, str, float]:
        prompt = compose_prompt(item, job.allowed_labels)
        t0 = time.monotonic()
        started_at = utc_now()
        try:
            result = client.generate(job, prompt, budget=budget)
        except Exception:  # third-party failure is transport, never a wrong answer
            result = ApiResult(False, None, None, "CLIENT_EXCEPTION")
        return sequence, item, prompt, result, started_at, utc_now(), round((time.monotonic() - t0) * 1000, 3)

    buffered: dict[int, tuple] = {}
    next_sequence = 1
    with evidence_path.open("xb", buffering=0) as handle, concurrent.futures.ThreadPoolExecutor(max_workers=concurrency) as pool:
        futures = [pool.submit(call, sequence, item) for sequence, item in enumerate(items, 1)]
        for future in concurrent.futures.as_completed(futures):
            outcome = future.result()
            buffered[outcome[0]] = outcome
            while next_sequence in buffered:
                sequence, item, prompt, result, started_at, finished_at, elapsed_ms = buffered.pop(next_sequence)
                next_sequence += 1
                counts["attempted"] += 1
                if result.error_code == "BUDGET_CAP":
                    halted = "BUDGET_CAP"
                if result.transport_ok and result.response_model != job.model:
                    result = dataclasses.replace(result, transport_ok=False, error_code="API_MODEL_MISMATCH")
                parsed_label, grade = None, None
                if result.transport_ok:
                    counts["transport_ok"] += 1
                    stop_reasons[result.stop_reason or "none"] = stop_reasons.get(result.stop_reason or "none", 0) + 1
                    text = result.raw_output or ""
                    if result.stop_reason in ("refusal", "max_tokens", "model_context_window_exceeded"):
                        # Terminal exclusion precedes BOTH graders, even if the text
                        # happens to contain a complete label or every keyword.
                        counts["parse_errors"] += 1
                    elif item.predicate == "EXACT_LABEL":
                        parsed_label = parse_exact_label(text, job.allowed_labels)
                        grade = parsed_label == item.expected if parsed_label is not None else False
                        counts["parse_errors"] += int(parsed_label is None)
                    else:
                        grade = grade_keyword_match(text, item.required_keywords)
                    counts["correct"] += int(bool(grade))
                else:
                    counts["transport_errors"] += 1
                append_json_line(handle, {
                    "schema": ITEM_SCHEMA,
                    "run_id": run_id,
                    "sequence": sequence,
                    "item_id": item.item_id,
                    "axis": job.axis,
                    "model": job.subject_id(model_record_digest),
                    "model_transport": job.model,
                    "bank_sha256": bank_sha256,
                    "model_record_digest": model_record_digest,
                    "instrument_sha256": instrument_sha256,
                    "prompt": prompt,
                    "prompt_sha256": sha256_bytes(prompt.encode("utf-8")),
                    "expected": item.expected,
                    "predicate": item.predicate,
                    "required_keywords": list(item.required_keywords),
                    "transport_ok": result.transport_ok,
                    "transport_error_code": result.error_code,
                    "response_sha256": result.response_sha256,
                    "raw_output": result.raw_output,
                    "raw_output_sha256": sha256_bytes(result.raw_output.encode("utf-8")) if result.raw_output is not None else None,
                    "response_model": result.response_model,
                    "stop_reason": result.stop_reason,
                    "stop_details": result.stop_details,
                    "api_usage": {"input_tokens": result.input_tokens, "output_tokens": result.output_tokens},
                    "attempts": result.attempts,
                    "parsed_label": parsed_label,
                    "grade": grade,
                    "started_at": started_at,
                    "finished_at": finished_at,
                    "elapsed_ms": elapsed_ms,
                })

    halted = budget.halted_reason or halted
    evidence_sha256 = sha256_file(evidence_path)
    if halted is None:
        try:
            final_digest, _ = client.model_record_digest(job.model)
        except WorkerError:
            final_digest = None
        if final_digest != model_record_digest:
            halted = "MODEL_RECORD_CHANGED_DURING_RUN"
    graded_n = counts["transport_ok"] - counts["parse_errors"]
    if halted and halted.startswith("BUDGET_"):
        reason = f"run incomplete: {halted}; unsigned compute only"
    elif halted == "MODEL_RECORD_CHANGED_DURING_RUN":
        reason = "run rejected: model record changed during compute"
    elif counts["transport_errors"]:
        reason = f"{counts['transport_errors']} transport error(s) excluded; unsigned compute only"
    else:
        reason = UNSIGNED_REASON
    card = stage_card(
        job=job, run_id=run_id, bank_sha256=bank_sha256, model_record_digest=model_record_digest,
        instrument_sha256=instrument_sha256, evidence_sha256=evidence_sha256, hits=counts["correct"],
        n=graded_n, parse_errors=counts["parse_errors"], transport_errors=counts["transport_errors"], reason=reason,
    )
    card_bytes = canonical_json_bytes(card) + b"\n"
    landable = (
        not dry_run and halted is None and counts["transport_errors"] == 0
        and counts["attempted"] == len(items) and graded_n > 0
    )
    candidate_name = "card-unsigned.json" if landable else "card-incomplete.json"
    manifest = {
        "schema": RUN_SCHEMA,
        "run_id": run_id,
        "started_at": started,
        "finished_at": utc_now(),
        "axis": job.axis,
        "model": job.subject_id(model_record_digest),
        "model_transport": job.model,
        "bank_sha256": bank_sha256,
        "model_record_digest": model_record_digest,
        "instrument": instrument,
        "instrument_sha256": instrument_sha256,
        "items_sha256": evidence_sha256,
        "card_sha256": sha256_bytes(card_bytes.rstrip(b"\n")),
        "counts": {
            "bank_items": len(items),
            "attempted": counts["attempted"],
            "transport_ok": counts["transport_ok"],
            "transport_errors_excluded": counts["transport_errors"],
            "parse_errors_excluded": counts["parse_errors"],
            "graded_n": graded_n,
            "correct": counts["correct"],
        },
        "stop_reason_counts": dict(sorted(stop_reasons.items())),
        "complete": counts["attempted"] == len(items) and halted is None,
        "compute_only": True,
        "dry_run": dry_run,
        "candidate_status": "UNMEASURED",
        "candidate_file": candidate_name,
        "landable_candidate": landable,
        "signature": None,
        "detail_code": halted or (
            "TRANSPORT_ERRORS" if counts["transport_errors"] else
            "ALL_UNPARSED" if graded_n == 0 else
            "DRY_RUN" if dry_run else "COMPLETE_UNSIGNED"
        ),
    }
    exclusive_write_bytes(run_dir / "run.json", json.dumps(manifest, indent=2, sort_keys=True).encode("utf-8") + b"\n")
    exclusive_write_bytes(run_dir / candidate_name, card_bytes)  # completion marker, written last
    log(f"{job.model} {job.axis}: {manifest['detail_code']} n={graded_n} correct={counts['correct']} "
        f"parse_excl={counts['parse_errors']} transport_excl={counts['transport_errors']} "
        f"stops={manifest['stop_reason_counts']} -> {run_dir}")
    return manifest


# ------------------------------------------------------------------------------ cli


def read_api_key(path: str | None) -> str:
    if path:
        key_path = Path(path)
        mode = key_path.stat().st_mode & 0o077
        if mode:
            raise WorkerError("KEY_FILE_PERMISSIONS", "API key file must not be readable by group/other (chmod 600)")
        return key_path.read_text(encoding="utf-8").strip()
    return os.environ.get("ANTHROPIC_API_KEY", "").strip()


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description=__doc__.split("\n\n")[0])
    parser.add_argument("--model", action="append", required=True, choices=sorted(THINKING_BY_MODEL))
    parser.add_argument("--axis", action="append", help="repeatable; default = every allowlisted axis")
    parser.add_argument("--banks-dir", type=Path, required=True)
    parser.add_argument("--allowlist", type=Path, default=Path(__file__).resolve().parent / "runpod_gspc_bank_allowlist.current.json")
    parser.add_argument("--output-dir", type=Path, required=True)
    parser.add_argument("--effort", default="low", choices=["low", "medium", "high", "xhigh", "max"])
    parser.add_argument("--max-tokens-label", type=int, default=DEFAULT_MAX_TOKENS_LABEL)
    parser.add_argument("--max-tokens-keyword", type=int, default=DEFAULT_MAX_TOKENS_KEYWORD)
    parser.add_argument("--request-timeout", type=int, default=300)
    parser.add_argument("--concurrency", type=int, default=4)
    parser.add_argument("--budget-usd", type=float, required=True, help="local reservation budget per model, not a provider billing ceiling")
    parser.add_argument("--request-cost-bound-usd", type=float,
                        help="operator-verified upper bound per HTTP attempt; required for paid runs")
    parser.add_argument("--api-key-file", help="chmod-600 file holding the key; else $ANTHROPIC_API_KEY")
    parser.add_argument("--terms-archive", type=Path, help="provider terms archive JSON; its sha256 is pinned in every instrument")
    parser.add_argument("--dry-run", action="store_true", help="no network; proves the pipeline; never landable")
    parser.add_argument("--estimate", action="store_true", help="illustrative cost estimate (600 input tokens/item, max output) and exit")
    return parser


def main(argv: list[str] | None = None) -> int:
    args = build_parser().parse_args(argv)
    try:
        allowlist = load_allowlist(args.allowlist)
        axes = args.axis or sorted(axis for axis in allowlist)
        terms_sha256 = sha256_file(args.terms_archive) if args.terms_archive else None
        if not (args.dry_run or args.estimate) and args.request_cost_bound_usd is None:
            raise WorkerError("BUDGET_BOUND_REQUIRED", "paid runs require an independently qualified per-attempt bound and provider cap")
        # Validate monetary inputs before accessing any key.
        for model in args.model:
            BudgetGuard(model, args.budget_usd, args.request_cost_bound_usd)
        client = DryRunClient() if (args.dry_run or args.estimate) else AnthropicClient(read_api_key(args.api_key_file))
        exit_code = 0
        for model in args.model:
            jobs = plan_jobs(
                model=model, axes=axes, banks_dir=args.banks_dir, allowlist=allowlist,
                output_dir=args.output_dir, effort=args.effort, max_tokens_label=args.max_tokens_label,
                max_tokens_keyword=args.max_tokens_keyword, request_timeout_seconds=args.request_timeout,
            )
            if args.estimate:
                inp, out = PRICE_PER_MTOK[model]
                items = sum(len(load_frozen_bank(job)[0]) for job in jobs)
                worst = sum(len(load_frozen_bank(job)[0]) * (600 * inp + job.max_tokens * out) / 1e6 for job in jobs)
                print(f"{model}: {len(jobs)} axes, {items} items, illustrative estimate ${worst:.2f} (600 input tokens/item, max output)")
                continue
            budget = BudgetGuard(model, args.budget_usd, args.request_cost_bound_usd)
            for job in jobs:
                manifest = run_job(job, client, budget=budget, concurrency=args.concurrency,
                                   terms_sha256=terms_sha256, dry_run=args.dry_run)
                if not manifest["landable_candidate"] and not args.dry_run:
                    exit_code = 3
                if manifest["detail_code"].startswith("BUDGET_"):
                    print(f"{model}: {manifest['detail_code']}; stopping this model", file=sys.stderr)
                    break
            if not args.dry_run:
                print(f"{model}: known-usage estimate ${budget.spent_usd:.2f}; committed bound ${budget.committed_usd:.2f} (not a provider invoice)", file=sys.stderr)
        return exit_code
    except WorkerError as error:
        print(f"{error.code}: {error}", file=sys.stderr)
        return 2


if __name__ == "__main__":
    raise SystemExit(main())
