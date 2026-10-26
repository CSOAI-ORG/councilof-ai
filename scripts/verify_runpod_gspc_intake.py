#!/usr/bin/env python3
"""Verify one explicitly transferred RunPod GSPC run into quarantine.

This is a control-plane intake boundary, not an admission or signing step.  It
reads a closed three-file run directory, independently recomputes its hashes,
scores, and pins, and copies the verified byte snapshots into a private review
quarantine.  It has no network client, signing code, publisher, or mill intake
integration.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import os
import re
import shutil
import stat
import sys
import tempfile
import unicodedata
import unicodedata
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

WORKER_SCHEMA = "csoai.runpod-gspc-worker/0.1"
ITEM_SCHEMA = "csoai.runpod-gspc-item-evidence/0.1"
RUN_SCHEMA = "csoai.runpod-gspc-run/0.1"
ALLOWLIST_SCHEMA = "csoai.runpod-gspc-bank-allowlist/0.1"
VERIFICATION_SCHEMA = "csoai.runpod-gspc-intake-verification/0.1"
INTENDED_DID = "did:web:csoai.org#card-attestation-1"
MAX_CARD_BYTES = 3072
MAX_RUN_BYTES = 1024 * 1024
MAX_ITEMS_BYTES = 128 * 1024 * 1024
MAX_ALLOWLIST_BYTES = 1024 * 1024
SHA256_RE = re.compile(r"^[0-9a-f]{64}$")
MANIFEST_DIGEST_RE = re.compile(r"^sha256:[0-9a-f]{64}$")
RUN_ID_RE = re.compile(r"^[0-9]{8}T[0-9]{6}\.[0-9]{6}Z-[0-9a-f]{10}$")
MODEL_TAG_RE = re.compile(
    r"^[A-Za-z0-9][A-Za-z0-9._/-]{0,199}(?::[A-Za-z0-9][A-Za-z0-9._-]{0,127})?$"
)
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
REQUIRED_SOURCE_FILES = frozenset({"items.jsonl", "run.json", "card-unsigned.json"})
RUN_FIELDS = {
    "schema",
    "run_id",
    "started_at",
    "finished_at",
    "axis",
    "model",
    "model_transport",
    "bank_sha256",
    "model_manifest_digest",
    "instrument",
    "instrument_sha256",
    "items_sha256",
    "card_sha256",
    "counts",
    "complete",
    "compute_only",
    "candidate_status",
    "candidate_file",
    "landable_candidate",
    "signature",
    "detail_code",
}
# Optional serial-protocol records written by runpod_gspc_worker_serial.py (Measure's
# serial house gate, 6 Oct). They describe how the run executed; none of them enters the
# card body, so accepting them cannot change what gets signed. Anything else stays an
# UNEXPECTED_FIELDS rejection (e.g. execution_policy).
RUN_OPTIONAL_FIELDS = frozenset(
    {
        "num_parallel",
        "num_ctx",
        "ollama_version",
        # Instrument identity (qworker instrument_of / keyword_instrument) and the
        # run-level parser descriptor written for --label-parser read-label runs.
        "instrument_id",
        "instrument_hash",
        "instrument_hash_basis",
        "label_parser",
    }
)
INSTRUMENT_OPTIONAL_FIELDS = frozenset({"num_parallel", "label_parser"})

# --- read-label-v1 -----------------------------------------------------------
# Ported verbatim in behaviour from harness/typed_output/deterministic.py
# ::ReadLabelParser and base.py (normalize_labels, looks_like_menu_echo), which are
# byte-identical to the reader at the pinned commit a74df318. The verifier keeps its
# own copy so that a change to the harness can never loosen what intake accepts.
ITEM_SCHEMA_PARSED_BY = "csoai.runpod-gspc-item-evidence/0.2"
ITEM_PARSER_FIELDS = frozenset({"label_parser", "parse_reason", "parse_confidence"})
READER_COMMIT = "a74df3185fcdfa10ac8a0a6e5ecca2aff9051470"
READ_LABEL_PARSER_ID = "read-label-v1"
READ_LABEL_RULE = "think-stripped-answer-prefix-last-line-exact-v1"
READ_LABEL_INSTRUMENT_PARSER = {"id": "read-label", "options": []}
READ_LABEL_RUN_DESCRIPTOR = {
    "parser_id": READ_LABEL_PARSER_ID,
    "kind": "deterministic",
    "rule": READ_LABEL_RULE,
    "source": "harness/gspc-top100/mill_hub_queue.py::read_label",
    "model_in_the_loop": False,
}
READ_LABEL_REASONS = frozenset({"LAST_LINE", "EXACT", "MENU_ECHO", "NO_MATCH", "EMPTY"})
_RL_ANSWER_PREFIX = re.compile(r"^(?:answer|label|response|output)\s*[:\-]\s*", re.I)
_RL_THINK = re.compile(r"<think>.*?</think>", re.S | re.I)
_RL_STRIP = "`*_\"'.,:;!?()[]{} "
_RL_MENU_SEPARATORS = re.compile(r"[|,/]|\bor\b|\bvs\b", re.IGNORECASE)


def _rl_normalize_labels(labels: Any) -> tuple[str, ...]:
    out: list[str] = []
    for raw in labels or ():
        value = str(raw).strip()
        if value and value not in out:
            out.append(value)
    return tuple(out)


def _rl_looks_like_menu_echo(text: str | None, labels: Any) -> bool:
    allowed = _rl_normalize_labels(labels)
    if len(allowed) < 2 or not text:
        return False
    body = unicodedata.normalize("NFKC", text).strip()
    if not body:
        return False
    body = re.split(r"[:\u2013\u2014]", body)[-1]
    seen: set[str] = set()
    remainder = _RL_MENU_SEPARATORS.sub(" ", body)
    for label in sorted(allowed, key=len, reverse=True):
        pattern = re.compile(rf"(?<![0-9A-Za-z_]){re.escape(label)}(?![0-9A-Za-z_])")
        if pattern.findall(remainder):
            seen.add(label)
            remainder = pattern.sub(" ", remainder)
    if len(seen) < 2:
        return False
    return not remainder.strip(" \t\r\n.;`*_\"'()[]{}")


def read_label_v1(text: str | None, labels: Any) -> tuple[str | None, str]:
    """(label, reason) exactly as ReadLabelParser.extract_label returns them."""
    allowed_tuple = _rl_normalize_labels(labels)
    allowed = {label.upper() for label in allowed_tuple}
    canonical = {label.upper(): label for label in allowed_tuple}
    if not allowed:
        return None, "NO_MATCH"
    if text is None or not text.strip():
        return None, "EMPTY"
    body = _RL_THINK.sub(" ", text)
    lines = [line.strip() for line in body.splitlines() if line.strip()]
    candidates = ([lines[-1]] if lines else []) + [" ".join(lines)]
    for index, candidate in enumerate(candidates):
        trimmed = _RL_ANSWER_PREFIX.sub("", candidate).strip().strip(_RL_STRIP).upper()
        if trimmed in allowed:
            return canonical[trimmed], ("LAST_LINE" if index == 0 else "EXACT")
    if _rl_looks_like_menu_echo(text, allowed_tuple):
        return None, "MENU_ECHO"
    return None, "NO_MATCH"


# --- pinned instrument identities ---------------------------------------------
# sha256(canonical basis) for each instrument id Measure has ruled citable
# (rulings/2026-10-06_0910_foreman.md, fleet-next-models-2026-10-06/QUEUE.md).
# Each value is (basis, sha); the basis is recomputed, never trusted.
_KW_GRADER_FOR_ID = "all-nfkc-casefold-whitespace-normalized-substrings-v2-length-unanswered"


def _rl_basis(max_tokens: int, num_ctx: int | None = None) -> dict[str, Any]:
    basis: dict[str, Any] = {
        "max_tokens": max_tokens,
        "reader": READ_LABEL_PARSER_ID,
        "think_strip_rule": READ_LABEL_RULE,
        "reader_commit": READER_COMMIT,
    }
    if num_ctx is not None:
        basis["num_ctx"] = num_ctx
    return basis


def _kw_basis(max_tokens: int, num_ctx: int | None = None) -> dict[str, Any]:
    basis: dict[str, Any] = {
        "max_tokens": max_tokens,
        "reader": "exact-keyword",
        "grader": _KW_GRADER_FOR_ID,
        "reader_commit": READER_COMMIT,
    }
    if num_ctx is not None:
        basis["num_ctx"] = num_ctx
    return basis


PINNED_INSTRUMENTS: dict[str, tuple[str, dict[str, Any], str]] = {
    # id: (family, basis, sha256)
    "gspc-read-label-v1-t2048": (
        "read-label",
        _rl_basis(2048),
        "eafa2f17cf7d1425751aaaf6689298f03499cb633082518156d43b15f1f40823",
    ),
    "gspc-read-label-v1-t4096-c8192": (
        "read-label",
        _rl_basis(4096, 8192),
        "7e6bd3f4c59292002f171dcc944794ef810b3e43e37d99ee3e2597d1a757d07c",
    ),
    "exact-keyword-t1024": (
        "keyword",
        _kw_basis(1024),
        "dda7126efd4f9509f00a50ece8e8e0824baac1bcfbc97ec3def4f3df38a4d335",
    ),
    "exact-keyword-t2048": (
        "keyword",
        _kw_basis(2048),
        "c7d8255394b81bfc33623c0e40a8cc6e7c8f739675c38cab101890a603ae9550",
    ),
    "exact-keyword-t4096-c8192": (
        "keyword",
        _kw_basis(4096, 8192),
        "0ceff4cedd10d9549f660d38645746e7ba0d0a99e3844337865b019b2c8b49e0",
    ),
}
# t4096 at num_ctx 3072: SUPERSEDED_CONTEXT_3072, never a run of record.
SUPERSEDED_INSTRUMENT_SHAS = frozenset(
    {
        "16bc67c85a00c350aef0434156b68464e98e6b6c814559a4b37b634c5f36dc37",
        "2b4cf3cdcafbcbe6b9c4ed85809534934cb483de906714fa9fbf7ff1ec14d363",
    }
)
SUPERSEDED_INSTRUMENT_IDS = frozenset(
    {"gspc-read-label-v1-t4096", "exact-keyword-t4096"}
)
EXACT_LABEL_T128_ID = "exact-label-t128"


RULED_INSTRUMENT_IDS = frozenset(
    {
        "gspc-read-label-v1-t2048",
        "gspc-read-label-v1-t4096-c8192",
        "exact-keyword-t1024",
        "exact-keyword-t2048",
        "exact-keyword-t4096-c8192",
        EXACT_LABEL_T128_ID,
    }
)


def _ruled_instrument_id(
    run: dict[str, Any], instrument: dict[str, Any], reader: str
) -> str | None:
    """The ruled instrument id written into the receipt, or None (UNRULED_INSTRUMENT).

    Measure ruling on #3049 (Option A). A run that carries an id has already been pinned by
    _check_instrument_identity; it is ruled only if that id is on RULED_INSTRUMENT_IDS. A
    legacy run with no id counts as exact-label-t128 only when ALL hold: exact-label reader,
    max_tokens == 128, and an otherwise standard T0 decode (temperature 0, seed 0, no stream,
    no think). Anything else -- t64 included -- is None. Fails closed.

    num_ctx is the run's context window, not a decode parameter, so it is not part of the
    T0 test. The real serial t128 runs (2026-10-12) record num_ctx=3072, num_parallel=1;
    an earlier `num_ctx is None` condition here rejected every one of them (#3049 intake
    38217331403: 1272/1272 UNRULED_INSTRUMENT). t4096@3072 stays SUPERSEDED via
    _check_instrument_identity; that ruling is about t4096 output truncation, not t128.
    """
    instrument_id = run.get("instrument_id")
    if instrument_id is not None:
        return instrument_id if instrument_id in RULED_INSTRUMENT_IDS else None
    decode = instrument.get("decode")
    if not isinstance(decode, dict):
        return None
    if (
        reader == "exact"
        and "label_parser" not in instrument
        and decode.get("max_tokens") == 128
        and decode.get("temperature") == 0
        and decode.get("seed") == 0
        and decode.get("stream") is False
        and decode.get("think") is False
    ):
        return EXACT_LABEL_T128_ID
    return None


def _check_instrument_identity(run: dict[str, Any], instrument: dict[str, Any]) -> str:
    """Return the label reader ("exact" or "read-label") after pinning identity.

    Fails closed: an unknown id, a basis that does not recompute to the pinned sha,
    a basis that disagrees with the decode actually used, or a parser that is not on
    the allowlist is a rejection, never a fallback to the default reader.
    """
    decode = instrument.get("decode")
    max_tokens = decode.get("max_tokens") if isinstance(decode, dict) else None
    if type(max_tokens) is not int:
        raise IntakeError("BAD_INSTRUMENT", "decode max_tokens is not an integer")

    instrument_parser = instrument.get("label_parser", None)
    has_instrument_parser = "label_parser" in instrument
    has_run_parser = "label_parser" in run
    if has_instrument_parser:
        if instrument_parser != READ_LABEL_INSTRUMENT_PARSER:
            raise IntakeError("BAD_LABEL_PARSER", "label parser is not on the allowlist")
        if run.get("label_parser") != READ_LABEL_RUN_DESCRIPTOR:
            raise IntakeError(
                "BAD_LABEL_PARSER", "run parser descriptor is not read-label-v1 at a74df318"
            )
        reader = "read-label"
    else:
        if has_run_parser:
            raise IntakeError(
                "BAD_LABEL_PARSER", "run declares a parser the instrument does not"
            )
        reader = "exact"

    identity_keys = {"instrument_id", "instrument_hash", "instrument_hash_basis"}
    present = identity_keys & set(run)
    instrument_hash = run.get("instrument_hash")
    if isinstance(instrument_hash, str):
        bare = instrument_hash.removeprefix("sha256:")
        if bare in SUPERSEDED_INSTRUMENT_SHAS:
            raise IntakeError(
                "SUPERSEDED_INSTRUMENT", "instrument is SUPERSEDED_CONTEXT_3072"
            )
    instrument_id = run.get("instrument_id")
    if instrument_id in SUPERSEDED_INSTRUMENT_IDS:
        raise IntakeError("SUPERSEDED_INSTRUMENT", "instrument is SUPERSEDED_CONTEXT_3072")

    if not present:
        if reader == "read-label":
            raise IntakeError(
                "BAD_INSTRUMENT_ID", "a read-label run must carry its pinned instrument id"
            )
        return reader
    if instrument_id == EXACT_LABEL_T128_ID:
        if present != {"instrument_id"} or reader != "exact" or max_tokens != 128:
            raise IntakeError(
                "BAD_INSTRUMENT_ID", "exact-label-t128 is the default reader at 128 tokens"
            )
        return reader
    if present != identity_keys or instrument_id not in PINNED_INSTRUMENTS:
        raise IntakeError("BAD_INSTRUMENT_ID", "instrument id is not pinned")
    family, pinned_basis, pinned_sha = PINNED_INSTRUMENTS[instrument_id]
    basis = run.get("instrument_hash_basis")
    if not isinstance(basis, dict) or basis != pinned_basis:
        raise IntakeError("INSTRUMENT_ID_MISMATCH", "instrument basis is not the pinned basis")
    if sha256_bytes(canonical_json_bytes(basis)) != pinned_sha or (
        instrument_hash != "sha256:" + pinned_sha
    ):
        raise IntakeError(
            "INSTRUMENT_ID_MISMATCH", "instrument hash does not recompute from its basis"
        )
    if basis["max_tokens"] != max_tokens:
        raise IntakeError("INSTRUMENT_ID_MISMATCH", "instrument basis max_tokens != decode")
    if "num_ctx" in basis and run.get("num_ctx") != basis["num_ctx"]:
        raise IntakeError("INSTRUMENT_ID_MISMATCH", "run num_ctx != instrument num_ctx")
    if family == "read-label" and reader != "read-label":
        raise IntakeError("INSTRUMENT_ID_MISMATCH", "read-label id without read-label parser")
    if family == "keyword":
        graders = instrument.get("graders")
        if (
            reader != "exact"
            or not isinstance(graders, dict)
            or graders.get("keyword_match") != basis["grader"]
        ):
            raise IntakeError("INSTRUMENT_ID_MISMATCH", "keyword id does not match the grader")
    return reader
OLLAMA_VERSION_RE = re.compile(r"^[0-9A-Za-z.+-]{1,32}$")
MAX_NUM_CTX = 32768
INSTRUMENT_FIELDS = {
    "schema",
    "axis",
    "model_transport",
    "subject",
    "bank_sha256",
    "model_manifest_digest",
    "allowed_labels",
    "decode",
    "graders",
    "prompt_adapter",
}
ITEM_FIELDS = {
    "schema",
    "run_id",
    "sequence",
    "item_id",
    "axis",
    "model",
    "model_transport",
    "bank_sha256",
    "model_manifest_digest",
    "instrument_sha256",
    "prompt",
    "prompt_sha256",
    "expected",
    "predicate",
    "required_keywords",
    "decode",
    "transport_ok",
    "transport_error_code",
    "response_sha256",
    "raw_output",
    "raw_output_sha256",
    "response_model",
    "done_reason",
    "ollama_metrics",
    "parsed_label",
    "grade",
    "started_at",
    "finished_at",
    "elapsed_ms",
}


class IntakeError(RuntimeError):
    """Expected fail-closed rejection with a stable, non-secret code."""

    def __init__(self, code: str, message: str) -> None:
        super().__init__(message)
        self.code = code


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")


def canonical_json_bytes(value: Any) -> bytes:
    try:
        return json.dumps(
            value,
            sort_keys=True,
            separators=(",", ":"),
            ensure_ascii=True,
            allow_nan=False,
        ).encode("utf-8")
    except (TypeError, ValueError) as error:
        raise IntakeError(
            "NON_CANONICAL_JSON", "value cannot be canonicalised"
        ) from error


def sha256_bytes(value: bytes) -> str:
    return hashlib.sha256(value).hexdigest()


def _reject_constant(_value: str) -> None:
    raise IntakeError("INVALID_JSON", "non-finite JSON numbers are forbidden")


def _unique_object(pairs: list[tuple[str, Any]]) -> dict[str, Any]:
    result: dict[str, Any] = {}
    for key, value in pairs:
        if key in result:
            raise IntakeError("DUPLICATE_JSON_KEY", "duplicate JSON keys are forbidden")
        result[key] = value
    return result


def parse_json_bytes(raw: bytes, code: str) -> Any:
    try:
        text = raw.decode("utf-8")
    except UnicodeDecodeError as error:
        raise IntakeError(code, "file is not UTF-8 JSON") from error
    try:
        return json.loads(
            text,
            object_pairs_hook=_unique_object,
            parse_constant=_reject_constant,
        )
    except IntakeError:
        raise
    except (json.JSONDecodeError, RecursionError) as error:
        raise IntakeError(code, "file is not valid JSON") from error


@dataclass(frozen=True)
class Snapshot:
    path: Path
    raw: bytes
    device: int
    inode: int
    size: int
    modified_ns: int


def _safe_snapshot(path: Path, maximum_bytes: int, code: str) -> Snapshot:
    flags = os.O_RDONLY
    if hasattr(os, "O_NOFOLLOW"):
        flags |= os.O_NOFOLLOW
    try:
        descriptor = os.open(path, flags)
    except OSError as error:
        raise IntakeError(code, "required regular file cannot be opened") from error
    try:
        before = os.fstat(descriptor)
        if not stat.S_ISREG(before.st_mode) or before.st_nlink != 1:
            raise IntakeError(code, "only single-link regular files are accepted")
        if before.st_size < 1 or before.st_size > maximum_bytes:
            raise IntakeError(code, "file size is outside the accepted bound")
        chunks: list[bytes] = []
        remaining = maximum_bytes + 1
        while remaining:
            chunk = os.read(descriptor, min(1024 * 1024, remaining))
            if not chunk:
                break
            chunks.append(chunk)
            remaining -= len(chunk)
        raw = b"".join(chunks)
        after = os.fstat(descriptor)
        if len(raw) > maximum_bytes:
            raise IntakeError(code, "file exceeds the accepted bound")
        if (
            before.st_dev,
            before.st_ino,
            before.st_size,
            before.st_mtime_ns,
        ) != (
            after.st_dev,
            after.st_ino,
            after.st_size,
            after.st_mtime_ns,
        ):
            raise IntakeError(code, "file changed while it was being read")
        return Snapshot(
            path=path,
            raw=raw,
            device=before.st_dev,
            inode=before.st_ino,
            size=before.st_size,
            modified_ns=before.st_mtime_ns,
        )
    finally:
        os.close(descriptor)


def _require_absolute_clean_path(path: Path, label: str) -> Path:
    if not path.is_absolute() or ".." in path.parts:
        raise IntakeError(
            "UNSAFE_PATH", f"{label} must be an absolute path without '..'"
        )
    return path


def _is_within(path: Path, parent: Path) -> bool:
    try:
        path.relative_to(parent)
        return True
    except ValueError:
        return False


def _require_exact_keys(value: dict[str, Any], expected: set[str], label: str) -> None:
    actual = set(value)
    if actual != expected:
        raise IntakeError(
            "UNEXPECTED_FIELDS",
            f"{label} fields do not match the pinned worker protocol",
        )


def _require_keys_with_optional(
    value: dict[str, Any], required: set[str], optional: frozenset[str], label: str
) -> None:
    actual = set(value)
    if not required <= actual or not actual <= (required | optional):
        raise IntakeError(
            "UNEXPECTED_FIELDS",
            f"{label} fields do not match the pinned worker protocol",
        )


def _check_num_parallel(value: Any, label: str) -> None:
    """Serial house gate: absent/null, or exactly the integer 1."""
    if value is None:
        return
    if type(value) is not int or value != 1:
        raise IntakeError("NOT_SERIAL", f"{label} num_parallel must be 1")


def _require_dict(value: Any, code: str, label: str) -> dict[str, Any]:
    if not isinstance(value, dict):
        raise IntakeError(code, f"{label} must be an object")
    return value


def _require_int(value: Any, code: str, label: str, minimum: int = 0) -> int:
    if isinstance(value, bool) or not isinstance(value, int) or value < minimum:
        raise IntakeError(code, f"{label} must be an integer >= {minimum}")
    return value


def _require_number(value: Any, code: str, label: str) -> float | int:
    if isinstance(value, bool) or not isinstance(value, (int, float)):
        raise IntakeError(code, f"{label} must be a finite JSON number")
    return value


def _require_sha256(value: Any, code: str, label: str) -> str:
    if not isinstance(value, str) or not SHA256_RE.fullmatch(value):
        raise IntakeError(code, f"{label} must be 64 lowercase hex")
    return value


def _load_allowlist(path: Path, source_dir: Path) -> tuple[set[tuple[str, str]], str]:
    _require_absolute_clean_path(path, "bank allowlist")
    if path.is_symlink() or _is_within(path.resolve(strict=False), source_dir):
        raise IntakeError(
            "UNTRUSTED_ALLOWLIST_PATH",
            "bank allowlist must be a separate non-symlink file",
        )
    snapshot = _safe_snapshot(path, MAX_ALLOWLIST_BYTES, "BAD_ALLOWLIST")
    parsed = _require_dict(
        parse_json_bytes(snapshot.raw, "BAD_ALLOWLIST"),
        "BAD_ALLOWLIST",
        "bank allowlist",
    )
    _require_exact_keys(parsed, {"schema", "banks"}, "bank allowlist")
    if parsed.get("schema") != ALLOWLIST_SCHEMA:
        raise IntakeError("BAD_ALLOWLIST", "bank allowlist schema is not supported")
    entries = parsed.get("banks")
    if not isinstance(entries, list) or not entries:
        raise IntakeError("BAD_ALLOWLIST", "bank allowlist banks must be non-empty")
    allowed: set[tuple[str, str]] = set()
    for raw_entry in entries:
        entry = _require_dict(raw_entry, "BAD_ALLOWLIST", "bank entry")
        _require_exact_keys(entry, {"axis", "sha256"}, "bank entry")
        axis = entry.get("axis")
        if axis not in CANONICAL_MODEL_AXES:
            raise IntakeError("BAD_ALLOWLIST", "bank entry axis is not canonical")
        digest = _require_sha256(
            entry.get("sha256"), "BAD_ALLOWLIST", "bank entry sha256"
        )
        pair = (axis, digest)
        if pair in allowed:
            raise IntakeError("BAD_ALLOWLIST", "duplicate bank allowlist entry")
        allowed.add(pair)
    return allowed, sha256_bytes(snapshot.raw)


def _validate_source_directory(path: Path) -> dict[str, Snapshot]:
    _require_absolute_clean_path(path, "run directory")
    try:
        directory_stat = path.lstat()
    except OSError as error:
        raise IntakeError(
            "BAD_RUN_DIRECTORY", "run directory cannot be inspected"
        ) from error
    if not stat.S_ISDIR(directory_stat.st_mode) or path.is_symlink():
        raise IntakeError("BAD_RUN_DIRECTORY", "run directory must not be a symlink")
    try:
        entries = list(os.scandir(path))
    except OSError as error:
        raise IntakeError(
            "BAD_RUN_DIRECTORY", "run directory cannot be read"
        ) from error
    names = {entry.name for entry in entries}
    if names != REQUIRED_SOURCE_FILES or len(entries) != len(REQUIRED_SOURCE_FILES):
        raise IntakeError(
            "OPEN_OR_PARTIAL_BUNDLE",
            "run directory must contain exactly the three closed-run files",
        )
    for entry in entries:
        try:
            entry_stat = entry.stat(follow_symlinks=False)
        except OSError as error:
            raise IntakeError(
                "UNSAFE_SOURCE_FILE", "source entry cannot be inspected"
            ) from error
        if entry.is_symlink() or not stat.S_ISREG(entry_stat.st_mode):
            raise IntakeError(
                "UNSAFE_SOURCE_FILE",
                "source entries must be regular, non-symlink files",
            )
    return {
        "items": _safe_snapshot(path / "items.jsonl", MAX_ITEMS_BYTES, "BAD_ITEMS"),
        "run": _safe_snapshot(path / "run.json", MAX_RUN_BYTES, "BAD_RUN"),
        "card": _safe_snapshot(
            path / "card-unsigned.json", MAX_CARD_BYTES + 1, "BAD_CARD"
        ),
    }


def _normalise_text(value: str) -> str:
    return " ".join(unicodedata.normalize("NFKC", value).casefold().split())


def _model_names_match(configured: str, returned: str) -> bool:
    if configured == returned:
        return True
    left = (
        configured[: -len(":latest")] if configured.endswith(":latest") else configured
    )
    right = returned[: -len(":latest")] if returned.endswith(":latest") else returned
    return (
        left == right
        and (":" not in configured or configured.endswith(":latest"))
        and (":" not in returned or returned.endswith(":latest"))
    )


# v1 graded whatever text came back. v2 (#2436) treats a keyword answer that ended on
# the token budget as unanswered. A v1 bundle is still admissible when none of its
# keyword answers were cut off -- the two rules agree on every such row -- and is
# refused when any was, because v1 scored those rows as wrong answers.
KEYWORD_GRADER_V1 = "all-nfkc-casefold-whitespace-normalized-substrings-v1"
KEYWORD_GRADER_V2 = "all-nfkc-casefold-whitespace-normalized-substrings-v2-length-unanswered"
KEYWORD_GRADERS = (KEYWORD_GRADER_V1, KEYWORD_GRADER_V2)


@dataclass(frozen=True)
class ItemCounts:
    attempted: int
    transport_ok: int
    transport_errors: int
    parse_errors: int
    correct: int


def _parse_items(
    raw: bytes,
    *,
    run_id: str,
    axis: str,
    subject: str,
    model_transport: str,
    bank_sha256: str,
    model_digest: str,
    instrument_sha256: str,
    instrument: dict[str, Any],
    reader: str = "exact",
) -> ItemCounts:
    if not raw.endswith(b"\n") or raw.startswith(b"\n"):
        raise IntakeError("BAD_ITEMS", "items JSONL must be newline-terminated")
    lines = raw.splitlines(keepends=True)
    if not lines:
        raise IntakeError("BAD_ITEMS", "items JSONL cannot be empty")
    labels_raw = instrument.get("allowed_labels")
    if not isinstance(labels_raw, list) or any(
        not isinstance(label, str)
        or not label
        or label != label.strip()
        or label == "KEYWORD_MATCH"
        for label in labels_raw
    ):
        raise IntakeError("BAD_INSTRUMENT", "instrument allowed_labels is invalid")
    labels = tuple(labels_raw)
    if len(set(labels)) != len(labels):
        raise IntakeError(
            "BAD_INSTRUMENT", "instrument allowed_labels contains duplicates"
        )
    decode = _require_dict(instrument.get("decode"), "BAD_INSTRUMENT", "decode")
    _require_exact_keys(
        decode, {"temperature", "seed", "max_tokens", "stream", "think"}, "decode"
    )
    temperature = _require_int(
        decode.get("temperature"), "BAD_INSTRUMENT", "temperature"
    )
    seed = _require_int(decode.get("seed"), "BAD_INSTRUMENT", "seed")
    max_tokens = _require_int(
        decode.get("max_tokens"), "BAD_INSTRUMENT", "max_tokens", 1
    )
    expected_decode = {
        "temperature": temperature,
        "seed": seed,
        "max_tokens": max_tokens,
    }
    if (
        temperature != 0
        or seed > 2**31 - 1
        or max_tokens > 8192
        or decode.get("stream") is not False
        or decode.get("think") is not False
    ):
        raise IntakeError("BAD_INSTRUMENT", "instrument decode is not deterministic")

    graders = instrument.get("graders")
    keyword_grader = graders.get("keyword_match") if isinstance(graders, dict) else None
    correct = 0
    parse_errors = 0
    seen_items: set[str] = set()
    for index, line in enumerate(lines, 1):
        if not line.endswith(b"\n") or line == b"\n":
            raise IntakeError(
                "BAD_ITEMS", "items JSONL contains an incomplete or blank row"
            )
        row = _require_dict(
            parse_json_bytes(line, "BAD_ITEM_ROW"), "BAD_ITEM_ROW", "item row"
        )
        if reader == "read-label":
            _require_exact_keys(row, ITEM_FIELDS | ITEM_PARSER_FIELDS, "item row")
            if (
                row.get("label_parser") != READ_LABEL_PARSER_ID
                or row.get("parse_confidence") is not None
                or (
                    row.get("parse_reason") is not None
                    and row.get("parse_reason") not in READ_LABEL_REASONS
                )
            ):
                raise IntakeError(
                    "BAD_LABEL_PARSER", "item parser record is not read-label-v1"
                )
        else:
            _require_exact_keys(row, ITEM_FIELDS, "item row")
        if canonical_json_bytes(row) + b"\n" != line:
            raise IntakeError("NON_CANONICAL_ITEM", "item row is not canonical JSON")
        pinned = {
            "schema": ITEM_SCHEMA if reader == "exact" else ITEM_SCHEMA_PARSED_BY,
            "run_id": run_id,
            "sequence": index,
            "axis": axis,
            "model": subject,
            "model_transport": model_transport,
            "bank_sha256": bank_sha256,
            "model_manifest_digest": model_digest,
            "instrument_sha256": instrument_sha256,
        }
        _require_int(row.get("sequence"), "ROW_PIN_MISMATCH", "item sequence", 1)
        if any(row.get(key) != value for key, value in pinned.items()):
            raise IntakeError(
                "ROW_PIN_MISMATCH", "item row does not match the run pins"
            )
        item_id = row.get("item_id")
        if not isinstance(item_id, str) or not item_id or item_id in seen_items:
            raise IntakeError("BAD_ITEM_ID", "item IDs must be non-empty and unique")
        seen_items.add(item_id)
        prompt = row.get("prompt")
        if (
            not isinstance(prompt, str)
            or not prompt
            or row.get("prompt_sha256") != sha256_bytes(prompt.encode("utf-8"))
        ):
            raise IntakeError("PROMPT_HASH_MISMATCH", "item prompt hash does not match")
        if row.get("decode") != expected_decode:
            raise IntakeError(
                "ROW_PIN_MISMATCH", "item decode does not match instrument"
            )
        if (
            row.get("transport_ok") is not True
            or row.get("transport_error_code") is not None
        ):
            raise IntakeError(
                "TRANSPORT_INCOMPLETE", "every admitted row must be transport-complete"
            )
        response_model = row.get("response_model")
        if not isinstance(response_model, str) or not _model_names_match(
            model_transport, response_model
        ):
            raise IntakeError(
                "MODEL_SUBSTITUTION", "response model does not match the pinned tag"
            )
        raw_output = row.get("raw_output")
        if not isinstance(raw_output, str) or row.get(
            "raw_output_sha256"
        ) != sha256_bytes(raw_output.encode("utf-8")):
            raise IntakeError("OUTPUT_HASH_MISMATCH", "raw output hash does not match")
        _require_sha256(
            row.get("response_sha256"), "BAD_RESPONSE_HASH", "response hash"
        )
        expected = row.get("expected")
        predicate = row.get("predicate")
        if not isinstance(expected, str) or not expected:
            raise IntakeError("BAD_GRADE", "expected value must be text")
        if predicate == "EXACT_LABEL":
            if expected not in labels or len(labels) < 2:
                raise IntakeError(
                    "BAD_GRADE", "exact-label item is outside the non-trivial label set"
                )
            if reader == "read-label":
                parsed_label, parse_reason = read_label_v1(raw_output, labels)
                if row.get("parse_reason") != parse_reason:
                    raise IntakeError(
                        "GRADE_MISMATCH", "parse reason does not recompute"
                    )
            else:
                parsed_label = (
                    raw_output.strip() if raw_output.strip() in labels else None
                )
            computed_grade = (
                parsed_label == expected if parsed_label is not None else False
            )
            if row.get("parsed_label") != parsed_label:
                raise IntakeError("GRADE_MISMATCH", "parsed label does not recompute")
            parse_errors += int(parsed_label is None)
            keywords = row.get("required_keywords")
            if keywords != []:
                raise IntakeError(
                    "BAD_GRADE", "exact-label row carries keyword predicates"
                )
        elif predicate == "KEYWORD_MATCH_ALL":
            if reader == "read-label" and row.get("parse_reason") is not None:
                raise IntakeError("BAD_GRADE", "keyword row carries a parse reason")
            if row.get("parsed_label") is not None:
                raise IntakeError("BAD_GRADE", "keyword row carries a parsed label")
            keywords = row.get("required_keywords")
            if (
                not isinstance(keywords, list)
                or not keywords
                or any(
                    not isinstance(keyword, str)
                    or not keyword.strip()
                    or keyword != keyword.strip()
                    for keyword in keywords
                )
                or len(set(keywords)) != len(keywords)
                or expected != "KEYWORD_MATCH"
            ):
                raise IntakeError("BAD_GRADE", "keyword predicate is invalid")
            truncated = row.get("done_reason") == "length"
            if truncated and keyword_grader == KEYWORD_GRADER_V1:
                raise IntakeError(
                    "TRUNCATED_KEYWORD_ANSWER",
                    "a v1 keyword row was cut off by the token budget and graded",
                )
            if truncated:
                computed_grade = False
                parse_errors += 1
            else:
                normalised_output = _normalise_text(raw_output)
                computed_grade = all(
                    _normalise_text(keyword) in normalised_output
                    for keyword in keywords
                )
        else:
            raise IntakeError(
                "BAD_GRADE", "predicate is not supported by the pinned worker"
            )
        if row.get("grade") is not computed_grade:
            raise IntakeError("GRADE_MISMATCH", "stored grade does not recompute")
        correct += int(computed_grade)

    return ItemCounts(
        attempted=len(lines),
        transport_ok=len(lines),
        transport_errors=0,
        parse_errors=parse_errors,
        correct=correct,
    )


def _expected_accuracy(correct: int, n: int) -> float | int:
    value: float | int = round(correct / n, 4)
    if isinstance(value, float) and value.is_integer():
        value = int(value)
    return value


def _validate_semantics(
    source_dir: Path,
    snapshots: dict[str, Snapshot],
    allowed_banks: set[tuple[str, str]],
    allowlist_sha256: str,
) -> dict[str, Any]:
    run = _require_dict(
        parse_json_bytes(snapshots["run"].raw, "BAD_RUN"), "BAD_RUN", "run"
    )
    card = _require_dict(
        parse_json_bytes(snapshots["card"].raw, "BAD_CARD"), "BAD_CARD", "card"
    )
    if run.get("schema") != RUN_SCHEMA:
        raise IntakeError("BAD_RUN", "run schema is not supported")
    _require_keys_with_optional(run, RUN_FIELDS, RUN_OPTIONAL_FIELDS, "run")
    _check_num_parallel(run.get("num_parallel"), "run")
    num_ctx = run.get("num_ctx")
    if num_ctx is not None and (
        type(num_ctx) is not int or not 1 <= num_ctx <= MAX_NUM_CTX
    ):
        raise IntakeError("BAD_RUN", "run num_ctx must be null or a positive integer")
    ollama_version = run.get("ollama_version")
    if ollama_version is not None and (
        not isinstance(ollama_version, str)
        or not OLLAMA_VERSION_RE.fullmatch(ollama_version)
    ):
        raise IntakeError("BAD_RUN", "run ollama_version is not a safe version string")
    run_id = run.get("run_id")
    if (
        not isinstance(run_id, str)
        or not RUN_ID_RE.fullmatch(run_id)
        or source_dir.name != run_id
    ):
        raise IntakeError(
            "UNSAFE_RUN_ID", "run ID must match the source directory name"
        )
    if (
        run.get("complete") is not True
        or run.get("landable_candidate") is not True
        or run.get("candidate_file") != "card-unsigned.json"
        or run.get("compute_only") is not True
        or run.get("candidate_status") != "UNMEASURED"
        or run.get("signature") is not None
        or run.get("detail_code") != "COMPLETE_UNSIGNED"
    ):
        raise IntakeError("NOT_LANDABLE", "run is not a complete unsigned candidate")

    axis = run.get("axis")
    if axis not in CANONICAL_MODEL_AXES:
        raise IntakeError("UNKNOWN_AXIS", "run axis is not one of the 14 model axes")
    bank_sha256 = _require_sha256(
        run.get("bank_sha256"), "BAD_BANK_DIGEST", "run bank digest"
    )
    if (axis, bank_sha256) not in allowed_banks:
        raise IntakeError(
            "BANK_NOT_ALLOWED", "bank digest is not trusted for this axis"
        )
    model_transport = run.get("model_transport")
    if (
        not isinstance(model_transport, str)
        or not MODEL_TAG_RE.fullmatch(model_transport)
        or ".." in model_transport.split("/")
        or "//" in model_transport
        or "@" in model_transport
    ):
        raise IntakeError("BAD_MODEL_TAG", "Ollama model tag is not safe")
    model_digest = run.get("model_manifest_digest")
    if not isinstance(model_digest, str) or not MANIFEST_DIGEST_RE.fullmatch(
        model_digest
    ):
        raise IntakeError("BAD_MODEL_DIGEST", "model manifest digest is not pinned")
    subject = f"ollama:{model_transport}@{model_digest}"
    if run.get("model") != subject:
        raise IntakeError(
            "SUBJECT_MISMATCH", "run subject is not the pinned Ollama subject"
        )

    instrument = _require_dict(run.get("instrument"), "BAD_INSTRUMENT", "instrument")
    _require_keys_with_optional(
        instrument, INSTRUMENT_FIELDS, INSTRUMENT_OPTIONAL_FIELDS, "instrument"
    )
    _check_num_parallel(instrument.get("num_parallel"), "instrument")
    if ("num_parallel" in run or "num_parallel" in instrument) and run.get(
        "num_parallel"
    ) != instrument.get("num_parallel"):
        raise IntakeError(
            "NOT_SERIAL", "run and instrument num_parallel records disagree"
        )
    required_instrument_pins = {
        "schema": WORKER_SCHEMA,
        "axis": axis,
        "model_transport": model_transport,
        "subject": subject,
        "bank_sha256": bank_sha256,
        "model_manifest_digest": model_digest,
        "prompt_adapter": "frozen-prompt-plus-public-label-set-v1",
    }
    if any(
        instrument.get(key) != value for key, value in required_instrument_pins.items()
    ):
        raise IntakeError("BAD_INSTRUMENT", "instrument does not match the run pins")
    graders = instrument.get("graders")
    if not isinstance(graders, dict) or graders.get(
        "keyword_match"
    ) not in KEYWORD_GRADERS or graders != {
        "exact_label": "unicode-exact-after-outer-whitespace-v1",
        "keyword_match": graders.get("keyword_match"),
    }:
        raise IntakeError(
            "BAD_INSTRUMENT", "instrument graders are not the pinned versions"
        )
    instrument_sha256 = _require_sha256(
        run.get("instrument_sha256"), "BAD_INSTRUMENT_HASH", "instrument hash"
    )
    if instrument_sha256 != sha256_bytes(canonical_json_bytes(instrument)):
        raise IntakeError(
            "INSTRUMENT_HASH_MISMATCH", "instrument hash does not recompute"
        )

    reader = _check_instrument_identity(run, instrument)
    ruled_instrument_id = _ruled_instrument_id(run, instrument, reader)

    items_sha256 = sha256_bytes(snapshots["items"].raw)
    if run.get("items_sha256") != items_sha256:
        raise IntakeError("ITEMS_HASH_MISMATCH", "items hash does not recompute")
    counts = _parse_items(
        snapshots["items"].raw,
        run_id=run_id,
        axis=axis,
        subject=subject,
        model_transport=model_transport,
        bank_sha256=bank_sha256,
        model_digest=model_digest,
        instrument_sha256=instrument_sha256,
        instrument=instrument,
        reader=reader,
    )
    run_counts = _require_dict(run.get("counts"), "BAD_COUNTS", "run counts")
    expected_counts = {
        "bank_items": counts.attempted,
        "attempted": counts.attempted,
        "transport_ok": counts.transport_ok,
        "transport_errors_excluded": counts.transport_errors,
        "parse_errors_excluded": counts.parse_errors,
        "graded_n": counts.transport_ok - counts.parse_errors,
        "correct": counts.correct,
    }
    for count_name in expected_counts:
        _require_int(run_counts.get(count_name), "COUNT_MISMATCH", count_name)
    if run_counts != expected_counts:
        raise IntakeError(
            "COUNT_MISMATCH", "run counts do not recompute from item evidence"
        )

    if not snapshots["card"].raw.endswith(b"\n"):
        raise IntakeError("NON_CANONICAL_CARD", "card must be newline-terminated")
    canonical_card = canonical_json_bytes(card)
    if (
        snapshots["card"].raw != canonical_card + b"\n"
        or len(canonical_card) > MAX_CARD_BYTES
    ):
        raise IntakeError(
            "NON_CANONICAL_CARD", "card is not the canonical <=3 KiB form"
        )
    _require_exact_keys(
        card,
        {"alg", "body", "id", "preimage_rule", "signature", "did_intended"},
        "card",
    )
    if (
        card.get("alg") != "Ed25519"
        or card.get("signature") is not None
        or card.get("preimage_rule") != "sha256(canonical body)"
        or card.get("did_intended") != INTENDED_DID
    ):
        raise IntakeError("BAD_CARD", "card is not an unsigned intended-DID candidate")
    body = _require_dict(card.get("body"), "BAD_CARD", "card body")
    _require_exact_keys(
        body,
        {
            "kind",
            "axis",
            "model",
            "issuer",
            "n",
            "accuracy",
            "status",
            "unmeasured",
            "public_framing",
            "verify",
            "brand",
            "compute_evidence",
        },
        "card body",
    )
    if (
        body.get("kind") != "gspc.measurement-card"
        or body.get("axis") != axis
        or body.get("model") != subject
        or body.get("issuer") != "CSOAI Ltd"
        or body.get("status") != "UNMEASURED"
        or body.get("public_framing")
        != "Measurement, not certification. Empty is not zero."
        or body.get("verify") != "https://councilof.ai/gspc-verify"
        or body.get("brand") != "Council of AI"
    ):
        raise IntakeError(
            "BAD_CARD", "card body does not match the compute-only contract"
        )
    unmeasured = body.get("unmeasured")
    if unmeasured != ["unsigned compute output; admission and verification required"]:
        raise IntakeError(
            "BAD_CARD", "card must preserve the unsigned admission boundary"
        )
    n = _require_int(body.get("n"), "COUNT_MISMATCH", "card n", 1)
    reported_accuracy = _require_number(
        body.get("accuracy"), "SCORE_MISMATCH", "card accuracy"
    )
    # n is the number of items that were ANSWERED, not the number attempted. Transport
    # errors already left it; parse errors used to stay in, so a response carrying no
    # parseable label was scored as a wrong answer and this gate enforced that. An
    # unanswered item is not a wrong answer -- absent is not zero.
    graded_n = counts.transport_ok - counts.parse_errors
    if n != graded_n or reported_accuracy != _expected_accuracy(counts.correct, n):
        raise IntakeError("SCORE_MISMATCH", "card n or accuracy does not recompute")
    evidence = _require_dict(
        body.get("compute_evidence"), "BAD_CARD", "compute evidence"
    )
    expected_evidence = {
        "run_id": run_id,
        "bank_sha256": bank_sha256,
        "model_manifest_digest": model_digest,
        "instrument_sha256": instrument_sha256,
        "items_sha256": items_sha256,
        "parse_errors_excluded": counts.parse_errors,
        "transport_errors_excluded": 0,
    }
    if reader == "read-label":
        # The worker names a non-default reader inside the card body
        # (runpod_gspc_worker.build_card); it is part of the signed preimage.
        expected_evidence["label_parser"] = READ_LABEL_PARSER_ID
    if evidence != expected_evidence:
        raise IntakeError(
            "EVIDENCE_PIN_MISMATCH", "card evidence pins do not match the run"
        )
    card_id = sha256_bytes(canonical_json_bytes(body))
    if card.get("id") != card_id:
        raise IntakeError(
            "CARD_ID_MISMATCH", "card ID does not recompute from its body"
        )
    card_sha256 = sha256_bytes(canonical_card)
    declared_card_sha256 = run.get("card_sha256")
    if declared_card_sha256 == card_sha256:
        card_hash_mode = "canonical-card"
    elif declared_card_sha256 == card_id:
        # Release 091a616a wrote the canonical body ID in run.card_sha256.
        # Accept that exact legacy mode only after independently checking the
        # canonical wrapper, its fixed unsigned fields, body ID and item evidence.
        # The receipt still records the actual wrapper digest and original run hash.
        card_hash_mode = "canonical-body-id-legacy"
    else:
        raise IntakeError("CARD_HASH_MISMATCH", "run card hash does not recompute")

    source_hashes = {
        "items_sha256": items_sha256,
        "run_sha256": sha256_bytes(snapshots["run"].raw),
        "card_sha256": card_sha256,
        "card_file_sha256": sha256_bytes(snapshots["card"].raw),
        "card_id": card_id,
        "bank_allowlist_sha256": allowlist_sha256,
    }
    bundle_sha256 = sha256_bytes(
        canonical_json_bytes(
            {
                "schema": VERIFICATION_SCHEMA,
                "run_id": run_id,
                "axis": axis,
                "subject": subject,
                "source_hashes": source_hashes,
            }
        )
    )
    return {
        "schema": VERIFICATION_SCHEMA,
        "state": "VERIFIED_QUARANTINE",
        "verified_at": utc_now(),
        "bundle_sha256": bundle_sha256,
        "run_id": run_id,
        "axis": axis,
        "subject": subject,
        "model_manifest_digest": model_digest,
        "bank_sha256": bank_sha256,
        "card_hash_mode": card_hash_mode,
        "source_hashes": source_hashes,
        "counts": expected_counts,
        "accuracy": _expected_accuracy(counts.correct, n),
        "authority": {
            "admitted": False,
            "signed": False,
            "anchored": False,
            "published": False,
            "hf_identity_claimed": False,
        },
        "review": "human/GHA review required; this bundle is not mill input",
        "candidate_file": "candidate.json",
        "instrument_id": ruled_instrument_id,
    }


def _write_private_file(path: Path, raw: bytes) -> None:
    descriptor = os.open(path, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    try:
        with os.fdopen(descriptor, "wb") as handle:
            handle.write(raw)
            handle.flush()
            os.fsync(handle.fileno())
    except Exception:
        path.unlink(missing_ok=True)
        raise


def verify_to_quarantine(
    run_dir: Path, allowlist_path: Path, quarantine_root: Path
) -> tuple[Path, dict[str, Any]]:
    run_dir = _require_absolute_clean_path(run_dir, "run directory")
    quarantine_root = _require_absolute_clean_path(quarantine_root, "quarantine root")
    source_resolved = run_dir.resolve(strict=False)
    quarantine_resolved = quarantine_root.resolve(strict=False)
    if _is_within(quarantine_resolved, source_resolved) or _is_within(
        source_resolved, quarantine_resolved
    ):
        raise IntakeError("UNSAFE_PATH", "source and quarantine must be separate trees")
    snapshots = _validate_source_directory(run_dir)
    allowed_banks, allowlist_sha256 = _load_allowlist(allowlist_path, source_resolved)
    verification = _validate_semantics(
        run_dir, snapshots, allowed_banks, allowlist_sha256
    )

    if quarantine_root.exists():
        root_stat = quarantine_root.lstat()
        if quarantine_root.is_symlink() or not stat.S_ISDIR(root_stat.st_mode):
            raise IntakeError(
                "UNSAFE_QUARANTINE", "quarantine root must be a directory"
            )
    else:
        quarantine_root.mkdir(parents=True, mode=0o700)
    destination = quarantine_root / f"verified-{verification['bundle_sha256']}"
    if destination.exists() or destination.is_symlink():
        raise IntakeError(
            "OUTPUT_EXISTS", "verified bundle already exists in quarantine"
        )
    temporary = Path(tempfile.mkdtemp(prefix=".intake-", dir=quarantine_root))
    os.chmod(temporary, 0o700)
    try:
        _write_private_file(temporary / "items.jsonl", snapshots["items"].raw)
        _write_private_file(temporary / "run.json", snapshots["run"].raw)
        # Deliberately not an unsigned-* mill filename.
        _write_private_file(temporary / "candidate.json", snapshots["card"].raw)
        _write_private_file(
            temporary / "verification.json",
            json.dumps(verification, indent=2, sort_keys=True).encode("utf-8") + b"\n",
        )
        directory_descriptor = os.open(temporary, os.O_RDONLY)
        try:
            os.fsync(directory_descriptor)
        finally:
            os.close(directory_descriptor)
        os.rename(temporary, destination)
        root_descriptor = os.open(quarantine_root, os.O_RDONLY)
        try:
            os.fsync(root_descriptor)
        finally:
            os.close(root_descriptor)
    except Exception:
        shutil.rmtree(temporary, ignore_errors=True)
        raise
    return destination, verification


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--run-dir", required=True, type=Path)
    parser.add_argument("--bank-allowlist", required=True, type=Path)
    parser.add_argument("--quarantine-root", required=True, type=Path)
    return parser


def main(argv: list[str] | None = None) -> int:
    args = build_parser().parse_args(argv)
    try:
        destination, verification = verify_to_quarantine(
            args.run_dir, args.bank_allowlist, args.quarantine_root
        )
    except IntakeError as error:
        print(f"REJECT {error.code}: {error}", file=sys.stderr)
        return 2
    except OSError:
        print("REJECT IO_ERROR: intake could not be completed", file=sys.stderr)
        return 2
    print(
        json.dumps(
            {
                "state": verification["state"],
                "bundle_sha256": verification["bundle_sha256"],
                "path": str(destination),
            },
            sort_keys=True,
        )
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
