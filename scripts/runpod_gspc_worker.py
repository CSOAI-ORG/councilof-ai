#!/usr/bin/env python3
"""Compute-only GSPC worker for a long-running RunPod GPU pod.

The worker deliberately stops at an unsigned, UNMEASURED candidate.  It never
loads a signing key, contacts a public service, publishes a card, performs a
BFT vote, or claims an anchor.  Admission, signing, verification, and any
subsequent state transition belong to the trusted control plane.

Only a loopback Ollama API is permitted.  A run is bound to both the frozen
bank bytes and the Ollama model-manifest digest before the first prompt is
sent.  Per-item evidence is append-only and transport failures are excluded
from the denominator rather than silently scored as wrong answers.
"""

from __future__ import annotations

import argparse
import contextlib
import dataclasses
import fcntl
import hashlib
import http.server
import json
import os
import re
import shutil
import signal
import sys
import threading
import time
import unicodedata
import urllib.error
import urllib.parse
import urllib.request
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Callable, Iterator, Protocol

WORKER_SCHEMA = "csoai.runpod-gspc-worker/0.1"
ITEM_SCHEMA = "csoai.runpod-gspc-item-evidence/0.1"
RUN_SCHEMA = "csoai.runpod-gspc-run/0.1"
MAX_CARD_BYTES = 3072
MAX_HTTP_RESPONSE_BYTES = 2 * 1024 * 1024
INTENDED_DID = "did:web:csoai.org#card-attestation-1"
PROMPT_KEYS = (
    "prompt",
    "item",
    "scenario",
    "request",
    "text",
    "tool",
    "operation",
    "case",
    "question",
)
UNSUPPORTED_PREDICATE_KEYS = frozenset(
    {
        "regex",
        "pattern",
        "rubric",
        "judge",
        "must_not_inc",
        "must_not_include",
        "semantic_match",
    }
)
UNSUPPORTED_EXPECTED_SENTINELS = frozenset(
    {
        "REGEX",
        "REGEX_MATCH",
        "SEMANTIC_MATCH",
        "LLM_JUDGE",
        "MODEL_JUDGE",
        "RUBRIC",
        "MANUAL",
        "FUZZY_MATCH",
    }
)
SHA256_RE = re.compile(r"^[0-9a-f]{64}$")
MANIFEST_DIGEST_RE = re.compile(r"^sha256:[0-9a-f]{64}$")
CANONICAL_MODEL_AXES = frozenset(
    {
        "governance",
        "safety",
        "provenance",
        "continuity",
        "conformance",
        "openness",
        "machinery-conformity",
        "care",
        "cross-reality",
        "detector-interop",
        "art5-safeguard",
        "swarm",
        "affect",
        "jail",
    }
)


class WorkerError(RuntimeError):
    """Expected worker failure with a stable, non-secret error code."""

    def __init__(self, code: str, message: str) -> None:
        super().__init__(message)
        self.code = code


class AlreadyRunning(WorkerError):
    def __init__(self) -> None:
        super().__init__("ALREADY_RUNNING", "another worker holds the instance lock")


class RejectRedirects(urllib.request.HTTPRedirectHandler):
    """Keep a nominally loopback Ollama request on loopback."""

    def redirect_request(
        self,
        request: urllib.request.Request,
        file_pointer: Any,
        code: int,
        message: str,
        headers: Any,
        new_url: str,
    ) -> None:
        raise urllib.error.HTTPError(
            request.full_url, code, "Ollama redirect blocked", headers, file_pointer
        )


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")


def canonical_json_bytes(value: Any) -> bytes:
    return json.dumps(
        value,
        sort_keys=True,
        separators=(",", ":"),
        ensure_ascii=True,
        allow_nan=False,
    ).encode("utf-8")


def sha256_bytes(value: bytes) -> str:
    return hashlib.sha256(value).hexdigest()


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def _fsync_directory(path: Path) -> None:
    try:
        descriptor = os.open(path, os.O_RDONLY)
    except OSError:
        return
    try:
        os.fsync(descriptor)
    finally:
        os.close(descriptor)


def atomic_write_json(path: Path, value: dict[str, Any]) -> None:
    """Replace one JSON file atomically; never expose a partial health record."""
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary = path.with_name(f".{path.name}.tmp-{os.getpid()}-{uuid.uuid4().hex}")
    payload = json.dumps(value, indent=2, sort_keys=True, ensure_ascii=True) + "\n"
    try:
        with temporary.open("x", encoding="utf-8") as handle:
            handle.write(payload)
            handle.flush()
            os.fsync(handle.fileno())
        os.replace(temporary, path)
        _fsync_directory(path.parent)
    finally:
        temporary.unlink(missing_ok=True)


def exclusive_write_bytes(path: Path, payload: bytes) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    descriptor = os.open(path, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o644)
    try:
        with os.fdopen(descriptor, "wb") as handle:
            handle.write(payload)
            handle.flush()
            os.fsync(handle.fileno())
    except Exception:
        path.unlink(missing_ok=True)
        raise
    _fsync_directory(path.parent)


def append_json_line(handle: Any, value: dict[str, Any]) -> None:
    """Append and durably flush one immutable evidence row."""
    handle.write(canonical_json_bytes(value) + b"\n")
    handle.flush()
    os.fsync(handle.fileno())


def normalized_manifest_digest(value: str) -> str:
    candidate = value.strip().lower()
    if SHA256_RE.fullmatch(candidate):
        candidate = f"sha256:{candidate}"
    if not MANIFEST_DIGEST_RE.fullmatch(candidate):
        raise WorkerError(
            "BAD_MODEL_DIGEST", "model digest must be sha256:<64 lowercase hex>"
        )
    return candidate


def validate_loopback_ollama_url(value: str) -> str:
    parsed = urllib.parse.urlsplit(value)
    if (
        parsed.scheme != "http"
        or parsed.hostname not in {"127.0.0.1", "localhost", "::1"}
        or parsed.username is not None
        or parsed.password is not None
        or parsed.query
        or parsed.fragment
    ):
        raise WorkerError(
            "NON_LOOPBACK_OLLAMA",
            "ollama_url must be an HTTP loopback URL without credentials, query, or fragment",
        )
    try:
        _ = parsed.port
    except ValueError as error:
        raise WorkerError(
            "BAD_OLLAMA_PORT", "ollama_url has an invalid port"
        ) from error
    return value.rstrip("/")


def _require_int(raw: dict[str, Any], key: str, minimum: int, maximum: int) -> int:
    value = raw.get(key)
    if (
        isinstance(value, bool)
        or not isinstance(value, int)
        or not minimum <= value <= maximum
    ):
        raise WorkerError(
            "BAD_CONFIG", f"{key} must be an integer from {minimum} to {maximum}"
        )
    return value


@dataclasses.dataclass(frozen=True)
class WorkerConfig:
    workspace_root: Path
    axis: str
    model: str
    bank_path: Path
    expected_bank_sha256: str
    output_dir: Path
    ollama_url: str
    expected_model_manifest_digest: str
    model_manifest_path: Path | None
    allowed_labels: tuple[str, ...]
    interval_seconds: int
    disk_low_water_bytes: int
    request_timeout_seconds: int
    max_tokens: int
    seed: int

    @classmethod
    def load(cls, path: Path) -> "WorkerConfig":
        if path.is_symlink():
            raise WorkerError("BAD_CONFIG", "config symlinks are not accepted")
        try:
            raw = json.loads(path.read_text(encoding="utf-8"))
        except (OSError, json.JSONDecodeError) as error:
            raise WorkerError("BAD_CONFIG", "config is not readable JSON") from error
        if not isinstance(raw, dict):
            raise WorkerError("BAD_CONFIG", "config root must be an object")

        allowed_keys = {
            "schema",
            "workspace_root",
            "axis",
            "model",
            "bank",
            "expected_bank_sha256",
            "output_dir",
            "ollama_url",
            "expected_model_manifest_digest",
            "model_manifest_path",
            "allowed_labels",
            "interval_seconds",
            "disk_low_water_bytes",
            "request_timeout_seconds",
            "max_tokens",
            "seed",
            "temperature",
        }
        unknown = sorted(set(raw) - allowed_keys)
        if unknown:
            raise WorkerError(
                "BAD_CONFIG", f"unknown config keys: {', '.join(unknown)}"
            )
        if raw.get("schema") not in (None, WORKER_SCHEMA):
            raise WorkerError("BAD_CONFIG", f"schema must be {WORKER_SCHEMA}")
        if raw.get("temperature", 0) != 0:
            raise WorkerError(
                "NONDETERMINISTIC_CONFIG", "temperature must be exactly 0"
            )

        def required_text(key: str) -> str:
            value = raw.get(key)
            if not isinstance(value, str) or not value.strip():
                raise WorkerError("BAD_CONFIG", f"{key} must be a non-empty string")
            return value.strip()

        base = path.resolve().parent
        workspace_candidate = Path(required_text("workspace_root")).expanduser()
        if not workspace_candidate.is_absolute():
            raise WorkerError("BAD_CONFIG", "workspace_root must be absolute")
        workspace_root = workspace_candidate.resolve()
        try:
            base.relative_to(workspace_root)
        except ValueError as error:
            raise WorkerError(
                "PATH_OUTSIDE_WORKSPACE", "config must live below workspace_root"
            ) from error

        def resolved_path(key: str) -> Path:
            candidate = Path(required_text(key)).expanduser()
            resolved = (
                candidate.resolve()
                if candidate.is_absolute()
                else (base / candidate).resolve()
            )
            try:
                resolved.relative_to(workspace_root)
            except ValueError as error:
                raise WorkerError(
                    "PATH_OUTSIDE_WORKSPACE", f"{key} must stay below workspace_root"
                ) from error
            return resolved

        bank_digest = required_text("expected_bank_sha256").lower()
        if not SHA256_RE.fullmatch(bank_digest):
            raise WorkerError(
                "BAD_BANK_DIGEST", "expected_bank_sha256 must be 64 lowercase hex"
            )

        labels_raw = raw.get("allowed_labels", [])
        if not isinstance(labels_raw, list) or any(
            not isinstance(label, str) or not label.strip() for label in labels_raw
        ):
            raise WorkerError(
                "BAD_CONFIG", "allowed_labels must be a list of non-empty strings"
            )
        labels = tuple(dict.fromkeys(label.strip() for label in labels_raw))
        if "KEYWORD_MATCH" in labels:
            raise WorkerError(
                "BAD_CONFIG", "KEYWORD_MATCH is a predicate, not an allowed label"
            )

        manifest_path_raw = raw.get("model_manifest_path")
        manifest_path = None
        if manifest_path_raw is not None:
            if not isinstance(manifest_path_raw, str) or not manifest_path_raw.strip():
                raise WorkerError(
                    "BAD_CONFIG", "model_manifest_path must be a non-empty string"
                )
            candidate = Path(manifest_path_raw).expanduser()
            manifest_path = (
                candidate.resolve()
                if candidate.is_absolute()
                else (base / candidate).resolve()
            )
            try:
                manifest_path.relative_to(workspace_root)
            except ValueError as error:
                raise WorkerError(
                    "PATH_OUTSIDE_WORKSPACE",
                    "model_manifest_path must stay below workspace_root",
                ) from error

        axis = required_text("axis")
        if axis not in CANONICAL_MODEL_AXES:
            raise WorkerError("UNKNOWN_AXIS", "axis is not a canonical GSPC model axis")

        return cls(
            workspace_root=workspace_root,
            axis=axis,
            model=required_text("model"),
            bank_path=resolved_path("bank"),
            expected_bank_sha256=bank_digest,
            output_dir=resolved_path("output_dir"),
            ollama_url=validate_loopback_ollama_url(required_text("ollama_url")),
            expected_model_manifest_digest=normalized_manifest_digest(
                required_text("expected_model_manifest_digest")
            ),
            model_manifest_path=manifest_path,
            allowed_labels=labels,
            interval_seconds=_require_int(raw, "interval_seconds", 1, 86_400),
            disk_low_water_bytes=_require_int(raw, "disk_low_water_bytes", 0, 10**15),
            request_timeout_seconds=_require_int(
                raw, "request_timeout_seconds", 1, 3_600
            ),
            max_tokens=_require_int(raw, "max_tokens", 1, 8_192),
            seed=_require_int(raw, "seed", 0, 2**31 - 1),
        )

    def subject_id(self, model_manifest_digest: str) -> str:
        """An honest local subject, not an unproved Hugging Face identity."""
        return f"ollama:{self.model}@{model_manifest_digest}"

    def instrument_descriptor(
        self, bank_sha256: str, model_manifest_digest: str
    ) -> dict[str, Any]:
        return {
            "schema": WORKER_SCHEMA,
            "axis": self.axis,
            "model_transport": self.model,
            "subject": self.subject_id(model_manifest_digest),
            "bank_sha256": bank_sha256,
            "model_manifest_digest": model_manifest_digest,
            "allowed_labels": list(self.allowed_labels),
            "decode": {
                "temperature": 0,
                "seed": self.seed,
                "max_tokens": self.max_tokens,
                "stream": False,
                "think": False,
            },
            "graders": {
                "exact_label": "unicode-exact-after-outer-whitespace-v1",
                "keyword_match": "all-nfkc-casefold-whitespace-normalized-substrings-v1",
            },
            "prompt_adapter": "frozen-prompt-plus-public-label-set-v1",
        }


@dataclasses.dataclass(frozen=True)
class BankItem:
    item_id: str
    prompt: str
    expected: str
    predicate: str
    required_keywords: tuple[str, ...] = ()


def _bank_rows(raw_bytes: bytes, path: Path) -> list[dict[str, Any]]:
    try:
        text = raw_bytes.decode("utf-8")
    except UnicodeDecodeError as error:
        raise WorkerError("BAD_BANK", "bank is not valid UTF-8") from error
    if path.suffix.lower() == ".json":
        try:
            parsed = json.loads(text)
        except json.JSONDecodeError as error:
            raise WorkerError("BAD_BANK", "JSON bank is not valid JSON") from error
        if isinstance(parsed, dict):
            parsed = parsed.get("items")
        if not isinstance(parsed, list):
            raise WorkerError(
                "BAD_BANK", "JSON bank must be an array or an object with items[]"
            )
        rows = parsed
    else:
        rows = []
        for line_number, line in enumerate(text.splitlines(), 1):
            if not line.strip():
                continue
            try:
                rows.append(json.loads(line))
            except json.JSONDecodeError as error:
                raise WorkerError(
                    "BAD_BANK", f"bank line {line_number} is not JSON"
                ) from error
    if any(not isinstance(row, dict) for row in rows):
        raise WorkerError("BAD_BANK", "every bank item must be an object")
    return rows


def load_frozen_bank(config: WorkerConfig) -> tuple[list[BankItem], str]:
    if config.bank_path.is_symlink():
        raise WorkerError("BANK_SYMLINK", "frozen bank symlinks are not accepted")
    try:
        raw_bytes = config.bank_path.read_bytes()
    except OSError as error:
        raise WorkerError("BANK_UNREADABLE", "frozen bank cannot be read") from error
    bank_sha256 = sha256_bytes(raw_bytes)
    if bank_sha256 != config.expected_bank_sha256:
        raise WorkerError(
            "BANK_DIGEST_MISMATCH", "frozen bank bytes do not match expected digest"
        )

    rows = _bank_rows(raw_bytes, config.bank_path)
    items: list[BankItem] = []
    seen_ids: set[str] = set()
    exact_items = 0
    for index, row in enumerate(rows, 1):
        if row.get("_canary") is not None or row.get("_meta") is not None:
            continue
        prompt = next(
            (
                value
                for key in PROMPT_KEYS
                if isinstance((value := row.get(key)), str) and value.strip()
            ),
            None,
        )
        expected = row.get("expected")
        if prompt is None or not isinstance(expected, str) or not expected.strip():
            raise WorkerError(
                "BAD_BANK", f"bank item {index} lacks a prompt or string expected value"
            )
        prompt = prompt.strip()
        expected = expected.strip()
        if len(prompt.encode("utf-8")) > 1024 * 1024:
            raise WorkerError("BAD_BANK", f"bank item {index} prompt exceeds 1 MiB")

        item_id_value = row.get("id") or row.get("item_id")
        if item_id_value is None:
            item_id = f"item-{index:06d}-{sha256_bytes(prompt.encode('utf-8'))[:12]}"
        elif isinstance(item_id_value, (str, int)) and str(item_id_value).strip():
            item_id = str(item_id_value).strip()
        else:
            raise WorkerError("BAD_BANK", f"bank item {index} has an invalid id")
        if item_id in seen_ids:
            raise WorkerError("BAD_BANK", f"duplicate bank item id: {item_id}")
        seen_ids.add(item_id)

        present_unsupported = sorted(
            key for key in UNSUPPORTED_PREDICATE_KEYS if key in row
        )
        if present_unsupported:
            raise WorkerError(
                "UNSUPPORTED_PREDICATE",
                f"bank item {index} uses unsupported predicate keys: {', '.join(present_unsupported)}",
            )

        if expected == "KEYWORD_MATCH":
            first = row.get("must_inc")
            second = row.get("must_include")
            if first is not None and second is not None and first != second:
                raise WorkerError(
                    "AMBIGUOUS_PREDICATE", f"bank item {index} has two keyword lists"
                )
            required = first if first is not None else second
            if (
                not isinstance(required, list)
                or not required
                or any(
                    not isinstance(keyword, str) or not keyword.strip()
                    for keyword in required
                )
            ):
                raise WorkerError(
                    "BAD_KEYWORD_PREDICATE",
                    f"bank item {index} KEYWORD_MATCH requires a non-empty must_inc array",
                )
            keywords = tuple(dict.fromkeys(keyword.strip() for keyword in required))
            predicate = "KEYWORD_MATCH_ALL"
        else:
            if expected.upper() in UNSUPPORTED_EXPECTED_SENTINELS:
                raise WorkerError(
                    "UNSUPPORTED_PREDICATE",
                    f"bank item {index} expected={expected} is unsupported",
                )
            if "must_inc" in row or "must_include" in row:
                raise WorkerError(
                    "AMBIGUOUS_PREDICATE",
                    f"bank item {index} has keyword rules but is not KEYWORD_MATCH",
                )
            if expected not in config.allowed_labels:
                raise WorkerError(
                    "EXPECTED_LABEL_NOT_ALLOWED",
                    f"bank item {index} expected label is absent from allowed_labels",
                )
            keywords = ()
            predicate = "EXACT_LABEL"
            exact_items += 1

        items.append(
            BankItem(
                item_id=item_id,
                prompt=prompt,
                expected=expected,
                predicate=predicate,
                required_keywords=keywords,
            )
        )

    if not items:
        raise WorkerError(
            "EMPTY_BANK", "frozen bank has no supported measurement items"
        )
    if exact_items and len(config.allowed_labels) < 2:
        raise WorkerError(
            "BAD_LABEL_SET",
            "exact-label banks require at least two allowed labels so the prompt does not reveal gold",
        )
    return items, bank_sha256


def compose_prompt(item: BankItem, allowed_labels: tuple[str, ...]) -> str:
    if item.predicate == "KEYWORD_MATCH_ALL":
        # The expected sentinel is a grading rule, not an answer label.  Do not
        # teach the model to emit the words KEYWORD_MATCH.
        return item.prompt
    labels = " | ".join(allowed_labels)
    return f"{item.prompt}\n\nReply with exactly one label and no other text: {labels}"


def parse_exact_label(raw_output: str, allowed_labels: tuple[str, ...]) -> str | None:
    candidate = raw_output.strip()
    return candidate if candidate in allowed_labels else None


def normalize_keyword_text(value: str) -> str:
    normalized = unicodedata.normalize("NFKC", value).casefold()
    return " ".join(normalized.split())


def grade_keyword_match(raw_output: str, required_keywords: tuple[str, ...]) -> bool:
    output = normalize_keyword_text(raw_output)
    return all(
        normalize_keyword_text(keyword) in output for keyword in required_keywords
    )


@dataclasses.dataclass(frozen=True)
class InferenceResult:
    transport_ok: bool
    raw_output: str | None
    response_sha256: str | None
    error_code: str | None
    response_model: str | None = None
    done_reason: str | None = None
    total_duration_ns: int | None = None
    load_duration_ns: int | None = None
    prompt_eval_count: int | None = None
    eval_count: int | None = None


class InferenceClient(Protocol):
    def model_manifest_digest(self, model: str) -> str: ...

    def generate(
        self, model: str, prompt: str, config: WorkerConfig
    ) -> InferenceResult: ...


class OllamaClient:
    def __init__(self, base_url: str) -> None:
        self.base_url = validate_loopback_ollama_url(base_url)
        # urllib otherwise honors HTTP(S)_PROXY and follows redirects, either of
        # which would invalidate the loopback-only evidence boundary.
        self._opener = urllib.request.build_opener(
            urllib.request.ProxyHandler({}), RejectRedirects()
        )

    def _open(self, request: urllib.request.Request, timeout: int) -> bytes:
        try:
            with self._opener.open(request, timeout=timeout) as response:
                raw = response.read(MAX_HTTP_RESPONSE_BYTES + 1)
        except urllib.error.HTTPError as error:
            try:
                error.read(4096)
            except Exception:
                pass
            raise WorkerError(
                "OLLAMA_HTTP_ERROR", f"ollama returned HTTP {error.code}"
            ) from error
        except (urllib.error.URLError, TimeoutError, OSError) as error:
            raise WorkerError(
                "OLLAMA_UNREACHABLE", "loopback Ollama request failed"
            ) from error
        if len(raw) > MAX_HTTP_RESPONSE_BYTES:
            raise WorkerError(
                "OLLAMA_RESPONSE_TOO_LARGE", "Ollama response exceeded 2 MiB"
            )
        return raw

    def model_manifest_digest(self, model: str) -> str:
        request = urllib.request.Request(
            f"{self.base_url}/api/tags",
            method="GET",
            headers={
                "Accept": "application/json",
                "User-Agent": "csoai-runpod-gspc-worker",
            },
        )
        raw = self._open(request, timeout=30)
        try:
            payload = json.loads(raw)
        except json.JSONDecodeError as error:
            raise WorkerError(
                "OLLAMA_PROTOCOL_ERROR", "Ollama tags response was not JSON"
            ) from error
        candidates = payload.get("models") if isinstance(payload, dict) else None
        if not isinstance(candidates, list):
            raise WorkerError(
                "OLLAMA_PROTOCOL_ERROR", "Ollama tags response lacks models[]"
            )
        accepted_names = {model}
        if ":" not in model:
            accepted_names.add(f"{model}:latest")
        for entry in candidates:
            if not isinstance(entry, dict):
                continue
            if (
                entry.get("name") not in accepted_names
                and entry.get("model") not in accepted_names
            ):
                continue
            digest = entry.get("digest")
            if not isinstance(digest, str):
                break
            return normalized_manifest_digest(digest)
        raise WorkerError(
            "MODEL_NOT_LOCAL", "configured model is absent from loopback Ollama tags"
        )

    def generate(
        self, model: str, prompt: str, config: WorkerConfig
    ) -> InferenceResult:
        request_payload = {
            "model": model,
            "prompt": prompt,
            "stream": False,
            "think": False,
            "options": {
                "temperature": 0,
                "seed": config.seed,
                "num_predict": config.max_tokens,
            },
        }
        request = urllib.request.Request(
            f"{self.base_url}/api/generate",
            data=canonical_json_bytes(request_payload),
            method="POST",
            headers={
                "Accept": "application/json",
                "Content-Type": "application/json",
                "User-Agent": "csoai-runpod-gspc-worker",
            },
        )
        try:
            raw = self._open(request, timeout=config.request_timeout_seconds)
        except WorkerError as error:
            return InferenceResult(False, None, None, error.code)
        response_sha256 = sha256_bytes(raw)
        try:
            payload = json.loads(raw)
        except json.JSONDecodeError:
            return InferenceResult(False, None, response_sha256, "OLLAMA_INVALID_JSON")
        if not isinstance(payload, dict) or payload.get("done") is not True:
            return InferenceResult(
                False, None, response_sha256, "OLLAMA_INCOMPLETE_RESPONSE"
            )
        output = payload.get("response")
        if not isinstance(output, str):
            return InferenceResult(
                False, None, response_sha256, "OLLAMA_MISSING_OUTPUT"
            )
        return InferenceResult(
            transport_ok=True,
            raw_output=output,
            response_sha256=response_sha256,
            error_code=None,
            response_model=(
                payload.get("model") if isinstance(payload.get("model"), str) else None
            ),
            done_reason=(
                payload.get("done_reason")
                if isinstance(payload.get("done_reason"), str)
                else None
            ),
            total_duration_ns=(
                payload.get("total_duration")
                if isinstance(payload.get("total_duration"), int)
                else None
            ),
            load_duration_ns=(
                payload.get("load_duration")
                if isinstance(payload.get("load_duration"), int)
                else None
            ),
            prompt_eval_count=(
                payload.get("prompt_eval_count")
                if isinstance(payload.get("prompt_eval_count"), int)
                else None
            ),
            eval_count=(
                payload.get("eval_count")
                if isinstance(payload.get("eval_count"), int)
                else None
            ),
        )


class HealthSink:
    def __init__(self, path: Path) -> None:
        self.path = path
        self._lock = threading.Lock()
        self._current: dict[str, Any] = {}

    def update(self, **fields: Any) -> dict[str, Any]:
        with self._lock:
            next_value = dict(self._current)
            next_value.update(fields)
            next_value["schema"] = WORKER_SCHEMA
            next_value["updated_at"] = utc_now()
            self._current = next_value
            atomic_write_json(self.path, next_value)
            return dict(next_value)

    def read(self) -> dict[str, Any]:
        with self._lock:
            return dict(self._current)


PUBLIC_HEALTH_KEYS = (
    "schema",
    "state",
    "updated_at",
    "started_at",
    "last_success_at",
    "run_id",
    "cycle",
    "job",
    "jobs_total",
    "invalid_config_count",
    "jobs_degraded",
    "successful_runs",
    "counters_scope",
    "failed_runs",
    "last_failure_at",
    "last_failure_code",
    "axis",
    "model",
    "bank_items",
    "attempted",
    "transport_ok",
    "transport_errors",
    "correct",
    "disk_free_bytes",
    "detail_code",
)


# successful_runs / failed_runs count THIS PROCESS since it started, not the runs that
# exist. On 2026-09-05 health reported successful_runs: 70 while 112 run directories sat
# on disk from earlier worker generations (the release dir is versioned, so there have
# been others). Both numbers are right about different things and neither said which:
# read as "runs we hold" the counter undercounts the durable set by 42, and read as
# "this worker's output" the directory count overcounts it. A counter that is a
# per-process tally should say so where it is published.
COUNTERS_SCOPE = "successful_runs/failed_runs count THIS worker process since started_at, not the run directories on disk"


def sanitized_health(value: dict[str, Any]) -> dict[str, Any]:
    out = {key: value[key] for key in PUBLIC_HEALTH_KEYS if key in value}
    if "successful_runs" in out or "failed_runs" in out:
        out["counters_scope"] = COUNTERS_SCOPE
    return out


class ReadOnlyHealthServer:
    def __init__(self, sink: HealthSink, bind: str, port: int) -> None:
        if bind not in {"127.0.0.1", "0.0.0.0"}:
            raise WorkerError(
                "BAD_HEALTH_BIND", "health bind must be 127.0.0.1 or 0.0.0.0"
            )
        if not 0 <= port <= 65_535:
            raise WorkerError(
                "BAD_HEALTH_PORT", "health port must be between 0 and 65535"
            )
        self.sink = sink
        sink_ref = sink

        class Handler(http.server.BaseHTTPRequestHandler):
            server_version = "csoai-health/0.1"

            def do_GET(self) -> None:  # noqa: N802
                path = urllib.parse.urlsplit(self.path).path
                if path not in {"/", "/health"}:
                    self._reply(404, {"error": "not_found"})
                    return
                current = sanitized_health(sink_ref.read())
                state = str(current.get("state") or "STARTING")
                status = 200 if state in {"RUNNING", "WAITING", "IDLE"} else 503
                self._reply(status, current)

            def do_POST(self) -> None:  # noqa: N802
                self._reply(405, {"error": "method_not_allowed"})

            def do_PUT(self) -> None:  # noqa: N802
                self._reply(405, {"error": "method_not_allowed"})

            def do_DELETE(self) -> None:  # noqa: N802
                self._reply(405, {"error": "method_not_allowed"})

            def _reply(self, status: int, value: dict[str, Any]) -> None:
                payload = canonical_json_bytes(value) + b"\n"
                self.send_response(status)
                self.send_header("Content-Type", "application/json; charset=utf-8")
                self.send_header("Cache-Control", "no-store")
                self.send_header("Content-Length", str(len(payload)))
                self.end_headers()
                self.wfile.write(payload)

            def log_message(self, _format: str, *_args: Any) -> None:
                return

        self._server = http.server.ThreadingHTTPServer((bind, port), Handler)
        self._thread = threading.Thread(
            target=self._server.serve_forever,
            name="gspc-read-only-health",
            daemon=True,
        )

    @property
    def port(self) -> int:
        return int(self._server.server_address[1])

    def start(self) -> None:
        self._thread.start()

    def close(self) -> None:
        self._server.shutdown()
        self._server.server_close()
        self._thread.join(timeout=5)


@contextlib.contextmanager
def single_instance(lock_path: Path) -> Iterator[None]:
    lock_path.parent.mkdir(parents=True, exist_ok=True)
    with lock_path.open("a+", encoding="utf-8") as handle:
        try:
            fcntl.flock(handle.fileno(), fcntl.LOCK_EX | fcntl.LOCK_NB)
        except BlockingIOError as error:
            raise AlreadyRunning() from error
        handle.seek(0)
        handle.truncate()
        handle.write(f"{os.getpid()}\n")
        handle.flush()
        os.fsync(handle.fileno())
        try:
            yield
        finally:
            fcntl.flock(handle.fileno(), fcntl.LOCK_UN)


@dataclasses.dataclass(frozen=True)
class RunOutcome:
    run_id: str | None
    exit_code: int
    detail_code: str
    attempted: int
    transport_ok: int
    transport_errors: int
    correct: int


def model_names_match(configured: str, returned: str | None) -> bool:
    """Permit only exact names or the spelling-only `:latest` equivalence."""
    if not returned:
        return False
    if configured == returned:
        return True

    def without_latest(value: str) -> str:
        return value[: -len(":latest")] if value.endswith(":latest") else value

    return (
        without_latest(configured) == without_latest(returned)
        and (":" not in configured or configured.endswith(":latest"))
        and (":" not in returned or returned.endswith(":latest"))
    )


def stage_unsigned_card(
    *,
    config: WorkerConfig,
    run_id: str,
    bank_sha256: str,
    model_manifest_digest: str,
    instrument_sha256: str,
    evidence_sha256: str,
    hits: int,
    n: int,
    transport_errors: int,
    reason: str,
) -> dict[str, Any]:
    """Build a strict superset of mill_hub_queue.stage_unsigned's card shape."""
    accuracy: float | int | None
    if not n:
        accuracy = None
    else:
        accuracy = round(hits / n, 4)
        if isinstance(accuracy, float) and accuracy.is_integer():
            accuracy = int(accuracy)
    body: dict[str, Any] = {
        "kind": "gspc.measurement-card",
        "axis": config.axis,
        "model": config.subject_id(model_manifest_digest),
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
            "model_manifest_digest": model_manifest_digest,
            "instrument_sha256": instrument_sha256,
            "items_sha256": evidence_sha256,
            "transport_errors_excluded": transport_errors,
        },
    }
    body_bytes = canonical_json_bytes(body)
    card: dict[str, Any] = {
        "alg": "Ed25519",
        "body": body,
        "id": sha256_bytes(body_bytes),
        "preimage_rule": "sha256(canonical body)",
        "signature": None,
        "did_intended": INTENDED_DID,
    }
    card_bytes = canonical_json_bytes(card)
    if len(body_bytes) > MAX_CARD_BYTES or len(card_bytes) > MAX_CARD_BYTES:
        raise WorkerError("CARD_TOO_LARGE", "unsigned candidate exceeds the 3 KiB cap")
    return card


def _verify_model_pin(config: WorkerConfig, client: InferenceClient) -> str:
    actual = normalized_manifest_digest(client.model_manifest_digest(config.model))
    if actual != config.expected_model_manifest_digest:
        raise WorkerError(
            "MODEL_DIGEST_MISMATCH", "local model manifest digest changed"
        )
    if config.model_manifest_path is not None:
        if config.model_manifest_path.is_symlink():
            raise WorkerError(
                "MODEL_MANIFEST_SYMLINK", "model manifest symlinks are not accepted"
            )
        try:
            file_digest = f"sha256:{sha256_file(config.model_manifest_path)}"
        except OSError as error:
            raise WorkerError(
                "MODEL_MANIFEST_UNREADABLE", "local model manifest cannot be read"
            ) from error
        if file_digest != actual:
            raise WorkerError(
                "MODEL_MANIFEST_FILE_MISMATCH",
                "local model manifest file does not match Ollama's advertised digest",
            )
    return actual


def _disk_free(path: Path, disk_usage: Callable[[Path], Any]) -> int:
    return int(disk_usage(path).free)


def _run_id() -> str:
    stamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%S.%fZ")
    return f"{stamp}-{uuid.uuid4().hex[:10]}"


def run_once(
    config: WorkerConfig,
    health: HealthSink,
    *,
    client: InferenceClient | None = None,
    disk_usage: Callable[[Path], Any] = shutil.disk_usage,
    stop_event: threading.Event | None = None,
    cycle: int = 1,
    job_name: str | None = None,
) -> RunOutcome:
    client = client or OllamaClient(config.ollama_url)
    stop_event = stop_event or threading.Event()
    config.output_dir.mkdir(parents=True, exist_ok=True)
    free_bytes = _disk_free(config.output_dir, disk_usage)
    health.update(
        state="STARTING",
        started_at=health.read().get("started_at", utc_now()),
        cycle=cycle,
        axis=config.axis,
        model=config.model,
        disk_free_bytes=free_bytes,
        detail_code="PREFLIGHT",
        job=job_name,
    )
    if free_bytes <= config.disk_low_water_bytes:
        health.update(state="STOPPED_LOW_DISK", detail_code="DISK_LOW_WATER")
        return RunOutcome(None, 75, "DISK_LOW_WATER", 0, 0, 0, 0)

    try:
        items, bank_sha256 = load_frozen_bank(config)
        model_manifest_digest = _verify_model_pin(config, client)
    except WorkerError as error:
        health.update(state="ERROR", detail_code=error.code)
        return RunOutcome(None, 2, error.code, 0, 0, 0, 0)

    instrument = config.instrument_descriptor(bank_sha256, model_manifest_digest)
    instrument_sha256 = sha256_bytes(canonical_json_bytes(instrument))
    run_id = _run_id()
    run_dir = config.output_dir / "runs" / run_id
    run_dir.mkdir(parents=True, exist_ok=False)
    evidence_path = run_dir / "items.jsonl"
    evidence_descriptor = os.open(
        evidence_path,
        os.O_WRONLY | os.O_CREAT | os.O_EXCL | os.O_APPEND,
        0o644,
    )
    attempted = 0
    transport_ok = 0
    transport_errors = 0
    correct = 0
    parse_errors = 0
    halted_code: str | None = None
    run_started = utc_now()
    health.update(
        state="RUNNING",
        run_id=run_id,
        bank_items=len(items),
        attempted=0,
        transport_ok=0,
        transport_errors=0,
        correct=0,
        detail_code="COMPUTE_ONLY",
        job=job_name,
    )

    with os.fdopen(evidence_descriptor, "ab", buffering=0) as evidence_handle:
        for sequence, item in enumerate(items, 1):
            if stop_event.is_set():
                halted_code = "STOP_REQUESTED"
                break
            free_bytes = _disk_free(config.output_dir, disk_usage)
            if free_bytes <= config.disk_low_water_bytes:
                halted_code = "DISK_LOW_WATER"
                break

            request_prompt = compose_prompt(item, config.allowed_labels)
            request_started = time.monotonic()
            started_at = utc_now()
            try:
                result = client.generate(config.model, request_prompt, config)
            except Exception:
                # Third-party/local client exceptions are transport failures, not
                # wrong answers and not zero scores.  Do not leak exception text.
                result = InferenceResult(False, None, None, "CLIENT_EXCEPTION")
            if result.transport_ok and not model_names_match(
                config.model, result.response_model
            ):
                # Preserve a substituted response as raw evidence, but never
                # grade or land it under the configured model's identity.
                result = dataclasses.replace(
                    result,
                    transport_ok=False,
                    error_code="OLLAMA_MODEL_MISMATCH",
                )
            finished_at = utc_now()
            elapsed_ms = round((time.monotonic() - request_started) * 1000, 3)
            attempted += 1

            parsed_label: str | None = None
            grade: bool | None = None
            if result.transport_ok:
                transport_ok += 1
                raw_output = result.raw_output if result.raw_output is not None else ""
                if item.predicate == "EXACT_LABEL":
                    parsed_label = parse_exact_label(raw_output, config.allowed_labels)
                    grade = (
                        parsed_label == item.expected
                        if parsed_label is not None
                        else False
                    )
                    parse_errors += int(parsed_label is None)
                else:
                    grade = grade_keyword_match(raw_output, item.required_keywords)
                correct += int(grade)
            else:
                transport_errors += 1

            row = {
                "schema": ITEM_SCHEMA,
                "run_id": run_id,
                "sequence": sequence,
                "item_id": item.item_id,
                "axis": config.axis,
                "model": config.subject_id(model_manifest_digest),
                "model_transport": config.model,
                "bank_sha256": bank_sha256,
                "model_manifest_digest": model_manifest_digest,
                "instrument_sha256": instrument_sha256,
                "prompt": request_prompt,
                "prompt_sha256": sha256_bytes(request_prompt.encode("utf-8")),
                "expected": item.expected,
                "predicate": item.predicate,
                "required_keywords": list(item.required_keywords),
                "decode": {
                    "temperature": 0,
                    "seed": config.seed,
                    "max_tokens": config.max_tokens,
                },
                "transport_ok": result.transport_ok,
                "transport_error_code": result.error_code,
                "response_sha256": result.response_sha256,
                "raw_output": result.raw_output,
                "raw_output_sha256": (
                    sha256_bytes(result.raw_output.encode("utf-8"))
                    if result.raw_output is not None
                    else None
                ),
                "response_model": result.response_model,
                "done_reason": result.done_reason,
                "ollama_metrics": {
                    "total_duration_ns": result.total_duration_ns,
                    "load_duration_ns": result.load_duration_ns,
                    "prompt_eval_count": result.prompt_eval_count,
                    "eval_count": result.eval_count,
                },
                "parsed_label": parsed_label,
                "grade": grade,
                "started_at": started_at,
                "finished_at": finished_at,
                "elapsed_ms": elapsed_ms,
            }
            append_json_line(evidence_handle, row)
            health.update(
                state="RUNNING",
                attempted=attempted,
                transport_ok=transport_ok,
                transport_errors=transport_errors,
                correct=correct,
                disk_free_bytes=free_bytes,
                detail_code="COMPUTE_ONLY",
            )

    evidence_sha256 = sha256_file(evidence_path)
    if halted_code is None:
        try:
            final_model_manifest_digest = _verify_model_pin(config, client)
        except WorkerError:
            halted_code = "MODEL_DIGEST_CHANGED_DURING_RUN"
        else:
            if final_model_manifest_digest != model_manifest_digest:
                halted_code = "MODEL_DIGEST_CHANGED_DURING_RUN"
    if halted_code == "DISK_LOW_WATER":
        reason = "run incomplete: disk low-water; unsigned compute only"
    elif halted_code == "STOP_REQUESTED":
        reason = "run incomplete: stop requested; unsigned compute only"
    elif halted_code == "MODEL_DIGEST_CHANGED_DURING_RUN":
        reason = "run rejected: model manifest changed during compute"
    elif transport_errors:
        reason = (
            f"{transport_errors} transport error(s) excluded; unsigned compute only"
        )
    else:
        reason = "unsigned compute output; admission and verification required"

    graded_n = transport_ok - parse_errors
    if parse_errors:
        reason = f"{reason}; {parse_errors} of {transport_ok} responses carried no parseable label"

    card = stage_unsigned_card(
        config=config,
        run_id=run_id,
        bank_sha256=bank_sha256,
        model_manifest_digest=model_manifest_digest,
        instrument_sha256=instrument_sha256,
        evidence_sha256=evidence_sha256,
        hits=correct,
        # An item whose response carried no parseable label was NOT answered, and is
        # therefore not a wrong answer either. transport errors already left n; parse
        # errors stayed in it, and the counter below was literally named
        # "parse_errors_counted_wrong". On 2026-09-06 four local-mill runs returned
        # 36 of 36 items with parsed_label null and done_reason "length" -- the token
        # budget expired inside a reasoning preamble -- and the card recorded accuracy
        # 0.0 at n=36, which the signer sets MEASURED. Absent is not zero.
        n=graded_n,
        transport_errors=transport_errors,
        reason=reason,
    )
    card_bytes = canonical_json_bytes(card) + b"\n"
    # A run where nothing parsed measured nothing. It must not present a landable
    # candidate: n=0 has no accuracy, and the old code would have offered n=36
    # accuracy 0.0 for exactly that run.
    landable = (
        halted_code is None
        and transport_errors == 0
        and attempted == len(items)
        and graded_n > 0
    )
    candidate_name = "card-unsigned.json" if landable else "card-incomplete.json"
    run_finished = utc_now()
    run_manifest = {
        "schema": RUN_SCHEMA,
        "run_id": run_id,
        "started_at": run_started,
        "finished_at": run_finished,
        "axis": config.axis,
        "model": config.subject_id(model_manifest_digest),
        "model_transport": config.model,
        "bank_sha256": bank_sha256,
        "model_manifest_digest": model_manifest_digest,
        "instrument": instrument,
        "instrument_sha256": instrument_sha256,
        "items_sha256": evidence_sha256,
        "card_sha256": sha256_bytes(card_bytes.rstrip(b"\n")),
        "counts": {
            "bank_items": len(items),
            "attempted": attempted,
            "transport_ok": transport_ok,
            "transport_errors_excluded": transport_errors,
            "parse_errors_excluded": parse_errors,
            "graded_n": graded_n,
            "correct": correct,
        },
        "complete": attempted == len(items) and halted_code is None,
        "compute_only": True,
        "candidate_status": "UNMEASURED",
        "candidate_file": candidate_name,
        "landable_candidate": landable,
        "signature": None,
        "detail_code": halted_code
        or ("TRANSPORT_ERRORS" if transport_errors else
            "ALL_UNPARSED" if graded_n == 0 else
            "COMPLETE_UNSIGNED"),
    }
    exclusive_write_bytes(
        run_dir / "run.json",
        json.dumps(run_manifest, indent=2, sort_keys=True).encode("utf-8") + b"\n",
    )
    # The candidate is the completion marker.  Write it only after the durable
    # evidence and run manifest, so an intake can never discover a candidate
    # whose supporting manifest was lost to an interrupted write.
    exclusive_write_bytes(run_dir / candidate_name, card_bytes)

    detail_code = str(run_manifest["detail_code"])
    if halted_code == "DISK_LOW_WATER":
        state, exit_code = "STOPPED_LOW_DISK", 75
    elif halted_code == "STOP_REQUESTED":
        state, exit_code = "STOPPED", 130
    elif halted_code == "MODEL_DIGEST_CHANGED_DURING_RUN":
        state, exit_code = "ERROR", 2
    elif transport_errors:
        state, exit_code = "DEGRADED", 3
    else:
        state, exit_code = "IDLE", 0
    next_health: dict[str, Any] = {
        "state": state,
        "detail_code": detail_code,
        "attempted": attempted,
        "transport_ok": transport_ok,
        "transport_errors": transport_errors,
        "correct": correct,
        "disk_free_bytes": _disk_free(config.output_dir, disk_usage),
    }
    if exit_code == 0:
        next_health["last_success_at"] = run_finished
    health.update(**next_health)
    return RunOutcome(
        run_id=run_id,
        exit_code=exit_code,
        detail_code=detail_code,
        attempted=attempted,
        transport_ok=transport_ok,
        transport_errors=transport_errors,
        correct=correct,
    )


@dataclasses.dataclass(frozen=True)
class PlaylistEntry:
    path: Path
    fingerprint: str
    config: WorkerConfig


def _safe_job_slug(path: Path) -> str:
    slug = re.sub(r"[^a-zA-Z0-9_.-]+", "-", path.stem).strip("-.")
    return (slug or "job")[:80]


def _quarantine_marker(state_dir: Path, path: Path, fingerprint: str) -> Path:
    return state_dir / "quarantine" / f"{_safe_job_slug(path)}-{fingerprint[:16]}.json"


def quarantine_invalid_config(
    state_dir: Path, path: Path, fingerprint: str, error_code: str
) -> Path:
    """Record a bad config without copying it, moving it, or leaking its fields."""
    marker = _quarantine_marker(state_dir, path, fingerprint)
    if marker.exists():
        return marker
    record = {
        "schema": "csoai.runpod-gspc-config-quarantine/0.1",
        "config_name": path.name,
        "config_sha256": fingerprint,
        "detail_code": error_code,
        "quarantined_at": utc_now(),
        "action": "skipped; edit or replace the config to produce a new digest",
    }
    exclusive_write_bytes(
        marker,
        json.dumps(record, indent=2, sort_keys=True).encode("utf-8") + b"\n",
    )
    return marker


def discover_playlist(
    config_dir: Path, state_dir: Path
) -> tuple[list[PlaylistEntry], int]:
    """Load direct-child JSON jobs in stable order; quarantine invalid bytes."""
    entries: list[PlaylistEntry] = []
    invalid = 0
    for path in sorted(config_dir.glob("*.json"), key=lambda candidate: candidate.name):
        if path.is_symlink():
            fingerprint = sha256_bytes(f"symlink:{path.name}".encode("utf-8"))
            quarantine_invalid_config(state_dir, path, fingerprint, "CONFIG_SYMLINK")
            invalid += 1
            continue
        try:
            fingerprint = sha256_file(path)
        except OSError:
            invalid += 1
            continue
        marker = _quarantine_marker(state_dir, path, fingerprint)
        if marker.exists():
            invalid += 1
            continue
        try:
            config = WorkerConfig.load(path)
        except WorkerError as error:
            quarantine_invalid_config(state_dir, path, fingerprint, error.code)
            invalid += 1
            continue
        entries.append(PlaylistEntry(path=path, fingerprint=fingerprint, config=config))
    return entries, invalid


def _aggregate_exit_code(current: int, candidate: int) -> int:
    if candidate in {75, 130}:
        return candidate
    if current in {75, 130}:
        return current
    if candidate == 2 or current == 2:
        return 2
    if candidate == 3 or current == 3:
        return 3
    return 0


def run_playlist(
    config_dir: Path,
    state_dir: Path,
    health: HealthSink,
    *,
    forever: bool,
    stop_event: threading.Event,
    client_factory: Callable[[WorkerConfig], InferenceClient] | None = None,
    disk_usage: Callable[[Path], Any] = shutil.disk_usage,
) -> int:
    """Run due jobs one at a time; never overlap access to the single GPU."""
    factory = client_factory or (lambda config: OllamaClient(config.ollama_url))
    next_due: dict[str, float] = {}
    failed_jobs: dict[str, str] = {}
    cycle = 0
    aggregate = 0
    successful_runs = 0
    failed_runs = 0
    while not stop_event.is_set():
        entries, invalid = discover_playlist(config_dir, state_dir)
        if invalid:
            aggregate = _aggregate_exit_code(aggregate, 2)
        health.update(
            jobs_total=len(entries),
            invalid_config_count=invalid,
            jobs_degraded=len(failed_jobs) + invalid,
            successful_runs=successful_runs,
            failed_runs=failed_runs,
            detail_code="PLAYLIST_SCAN",
        )
        if not entries:
            health.update(state="ERROR", detail_code="NO_VALID_JOBS")
            if not forever:
                return 2
            stop_event.wait(30)
            continue

        now = time.monotonic()
        due = [entry for entry in entries if next_due.get(entry.fingerprint, 0) <= now]
        if not due:
            wait_seconds = min(
                60.0,
                max(
                    0.1,
                    min(next_due[entry.fingerprint] for entry in entries) - now,
                ),
            )
            degraded = bool(failed_jobs or invalid)
            health.update(
                state="DEGRADED" if degraded else "WAITING",
                detail_code="PLAYLIST_ERRORS" if degraded else "NEXT_PLAYLIST_JOB",
                jobs_degraded=len(failed_jobs) + invalid,
            )
            stop_event.wait(wait_seconds)
            continue

        for entry in due:
            if stop_event.is_set():
                break
            cycle += 1
            outcome = run_once(
                entry.config,
                health,
                client=factory(entry.config),
                disk_usage=disk_usage,
                stop_event=stop_event,
                cycle=cycle,
                job_name=entry.path.stem,
            )
            aggregate = _aggregate_exit_code(aggregate, outcome.exit_code)
            if outcome.exit_code == 0:
                successful_runs += 1
                failed_jobs.pop(entry.fingerprint, None)
            else:
                failed_runs += 1
                failed_jobs[entry.fingerprint] = outcome.detail_code
                health.update(
                    last_failure_at=utc_now(),
                    last_failure_code=outcome.detail_code,
                )
            health.update(
                successful_runs=successful_runs,
                failed_runs=failed_runs,
                jobs_degraded=len(failed_jobs) + invalid,
            )
            next_due[entry.fingerprint] = (
                time.monotonic() + entry.config.interval_seconds
            )
            if outcome.exit_code in {75, 130}:
                return outcome.exit_code

        if not forever:
            return aggregate
        degraded = bool(failed_jobs or invalid)
        health.update(
            state="DEGRADED" if degraded else "WAITING",
            detail_code="PLAYLIST_ERRORS" if degraded else "NEXT_PLAYLIST_JOB",
            jobs_degraded=len(failed_jobs) + invalid,
        )
    health.update(state="STOPPED", detail_code="STOP_REQUESTED")
    return 0


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description=__doc__)
    source = parser.add_mutually_exclusive_group(required=True)
    source.add_argument("--config", type=Path, help="one strict JSON worker config")
    source.add_argument(
        "--config-dir",
        type=Path,
        help="sorted playlist of strict JSON configs; one GPU job runs at a time",
    )
    parser.add_argument(
        "--state-dir",
        type=Path,
        help="playlist lock, health, and quarantine state (default: CONFIG_DIR/.worker-state)",
    )
    mode = parser.add_mutually_exclusive_group()
    mode.add_argument(
        "--once", action="store_true", help="run one frozen bank and exit (default)"
    )
    mode.add_argument(
        "--forever", action="store_true", help="run the frozen bank repeatedly"
    )
    parser.add_argument(
        "--health-bind",
        choices=("127.0.0.1", "0.0.0.0"),
        default="127.0.0.1",
        help="read-only health listener address",
    )
    parser.add_argument(
        "--health-port",
        type=int,
        default=0,
        help="serve GET / and /health; 0 disables the listener",
    )
    return parser


def main(argv: list[str] | None = None) -> int:
    args = build_parser().parse_args(argv)
    config: WorkerConfig | None = None
    if args.config is not None:
        try:
            config = WorkerConfig.load(args.config)
        except WorkerError as error:
            print(f"HALT {error.code}: {error}", file=sys.stderr)
            return 2
        state_dir = (args.state_dir or config.output_dir).resolve()
    else:
        config_dir = args.config_dir.resolve()
        if not config_dir.is_dir():
            print(
                "HALT BAD_CONFIG_DIR: config directory is not readable", file=sys.stderr
            )
            return 2
        state_dir = (args.state_dir or (config_dir / ".worker-state")).resolve()

    state_dir.mkdir(parents=True, exist_ok=True)
    health = HealthSink(state_dir / "health.json")
    stop_event = threading.Event()

    def request_stop(_signum: int, _frame: Any) -> None:
        stop_event.set()

    signal.signal(signal.SIGTERM, request_stop)
    signal.signal(signal.SIGINT, request_stop)
    health_server: ReadOnlyHealthServer | None = None
    try:
        with single_instance(state_dir / "worker.lock"):
            health.update(state="STARTING", started_at=utc_now(), detail_code="BOOT")
            if args.health_port:
                try:
                    health_server = ReadOnlyHealthServer(
                        health, args.health_bind, args.health_port
                    )
                    health_server.start()
                except OSError:
                    health.update(state="ERROR", detail_code="HEALTH_PORT_UNAVAILABLE")
                    return 2

            if args.config_dir is not None:
                return run_playlist(
                    config_dir,
                    state_dir,
                    health,
                    forever=args.forever,
                    stop_event=stop_event,
                )

            assert config is not None
            cycle = 0
            while not stop_event.is_set():
                cycle += 1
                outcome = run_once(config, health, stop_event=stop_event, cycle=cycle)
                if not args.forever:
                    return outcome.exit_code
                if outcome.detail_code in {
                    "DISK_LOW_WATER",
                    "BANK_DIGEST_MISMATCH",
                    "MODEL_DIGEST_MISMATCH",
                    "MODEL_MANIFEST_FILE_MISMATCH",
                    "MODEL_MANIFEST_UNREADABLE",
                    "MODEL_DIGEST_CHANGED_DURING_RUN",
                    "BAD_BANK",
                    "EMPTY_BANK",
                    "UNSUPPORTED_PREDICATE",
                    "AMBIGUOUS_PREDICATE",
                    "BAD_KEYWORD_PREDICATE",
                    "EXPECTED_LABEL_NOT_ALLOWED",
                    "BAD_LABEL_SET",
                }:
                    return outcome.exit_code
                if stop_event.is_set():
                    break
                if outcome.exit_code == 0:
                    health.update(state="WAITING", detail_code="NEXT_CYCLE")
                else:
                    health.update(
                        state="DEGRADED",
                        detail_code=outcome.detail_code,
                        last_failure_at=utc_now(),
                        last_failure_code=outcome.detail_code,
                    )
                stop_event.wait(config.interval_seconds)
            health.update(state="STOPPED", detail_code="STOP_REQUESTED")
            return 0
    except AlreadyRunning as error:
        print(f"HALT {error.code}: {error}", file=sys.stderr)
        return 73
    finally:
        if health_server is not None:
            health_server.close()


if __name__ == "__main__":
    raise SystemExit(main())
