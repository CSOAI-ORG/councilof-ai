#!/usr/bin/env python3
"""Generate a pinned, compute-only RunPod GSPC playlist from local bytes.

The generator talks only to loopback Ollama, hashes each frozen bank and model
manifest, and writes one strict worker config per (model, axis).  It never
downloads models, signs evidence, publishes results, or replaces existing job
configs.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import os
import re
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path
from typing import Any

SCHEMA = "csoai.runpod-gspc-worker/0.1"
DEFAULT_MODELS = (
    "qwen2.5:0.5b-instruct",
    "qwen2.5:1.5b",
    "qwen3:4b",
    "qwen2.5:7b",
    "mistral:7b",
)

# Short, settled banks run first so a new deployment proves the full evidence
# path quickly. Governance and care remain in the same rotation; swarm remains
# visible but cannot qualify for n>=30 admission while its frozen bank has 8 rows.
AXES = (
    ("safety", "gspc-agi.jsonl"),
    ("provenance", "gspc-prv.jsonl"),
    ("continuity", "gspc-asi.jsonl"),
    ("conformance", "gspc-mcp.jsonl"),
    ("openness", "gspc-oss.jsonl"),
    ("machinery-conformity", "gspc-mach.jsonl"),
    ("cross-reality", "gspc-xr.jsonl"),
    ("detector-interop", "gspc-det.jsonl"),
    ("art5-safeguard", "gspc-art5.jsonl"),
    ("affect", "gspc-affect.jsonl"),
    ("jail", "gspc-jail.jsonl"),
    ("swarm", "gspc-swarm.jsonl"),
    ("care", "gspc-care.jsonl"),
    ("governance", "gspc-gov.jsonl"),
    # NOT extended to the deterministic-fact axes, though nine of their frozen banks
    # exist on the Hub at 30 rows each and this generator now accepts their shape.
    # scripts/runpod_gspc_worker.py validates `axis` against CANONICAL_MODEL_AXES, which
    # is exactly these fourteen; accountability, creativity, efficiency, fairness,
    # human-vs-ai, sovereignty and transparency (+ the 0-byte slot15) are the OTHER eight
    # of the 22-axis board -- the deterministic-fact family. Adding them here would emit
    # 35 configs the worker rejects with UNKNOWN_AXIS, and widening CANONICAL_MODEL_AXES
    # would put two axis families behind one per-model grader. That is a canon ruling,
    # not a tuple edit. See docs/operations/PREDICATE-BANKS-AND-THE-OTHER-EIGHT.md.
)
SHA256_RE = re.compile(r"^[0-9a-f]{64}$")


class GenerationError(RuntimeError):
    pass


class RejectRedirects(urllib.request.HTTPRedirectHandler):
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


def canonical_bytes(value: Any) -> bytes:
    return json.dumps(
        value,
        sort_keys=True,
        separators=(",", ":"),
        ensure_ascii=True,
        allow_nan=False,
    ).encode("utf-8")


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def loopback_url(value: str) -> str:
    parsed = urllib.parse.urlsplit(value)
    if (
        parsed.scheme != "http"
        or parsed.hostname not in {"127.0.0.1", "localhost", "::1"}
        or parsed.username is not None
        or parsed.password is not None
        or parsed.query
        or parsed.fragment
    ):
        raise GenerationError("Ollama URL must be uncredentialed loopback HTTP")
    return value.rstrip("/")


def ollama_digests(base_url: str) -> dict[str, str]:
    request = urllib.request.Request(
        f"{loopback_url(base_url)}/api/tags",
        headers={"Accept": "application/json", "User-Agent": "csoai-playlist"},
    )
    opener = urllib.request.build_opener(
        urllib.request.ProxyHandler({}), RejectRedirects()
    )
    with opener.open(request, timeout=30) as response:
        raw = response.read(2 * 1024 * 1024 + 1)
    if len(raw) > 2 * 1024 * 1024:
        raise GenerationError("Ollama tags response exceeds 2 MiB")
    payload = json.loads(raw)
    models = payload.get("models") if isinstance(payload, dict) else None
    if not isinstance(models, list):
        raise GenerationError("Ollama tags response lacks models[]")
    result: dict[str, str] = {}
    for item in models:
        if not isinstance(item, dict):
            continue
        name, digest = item.get("name"), item.get("digest")
        if isinstance(name, str) and isinstance(digest, str):
            normalized = digest.removeprefix("sha256:").lower()
            if SHA256_RE.fullmatch(normalized):
                result[name] = normalized
    return result


def bank_labels(path: Path) -> tuple[str, ...]:
    """The exact labels a bank grades against, which is NOT every value of `expected`.

    Two kinds of frozen bank exist and this returns the right thing for both.

    An EXACT-LABEL bank ("does the model comply or refuse") still needs at least two
    labels -- one label cannot discriminate, and a bank that offers only one is a
    configuration error worth stopping on.

    A PREDICATE bank grades each row against its own `must_inc` keywords and carries
    `expected: "KEYWORD_MATCH"` on every row. Its allowed-label set is legitimately
    EMPTY: the worker rejects a config that lists KEYWORD_MATCH as an allowed label
    ("KEYWORD_MATCH is a predicate, not an allowed label") while grading those rows
    perfectly well row-by-row. Requiring two labels here refused nine banks the worker
    can already grade -- accountability, creativity, efficiency, fairness, human-vs-ai,
    sovereignty, transparency and two more -- so the predicate case returns ().

    Contamination canary rows carry no `expected` by design and are not bank items;
    they are skipped rather than treated as malformed. Failing on one would reject
    every behavioural bank we already grade.
    """
    labels: set[str] = set()
    item_count = 0
    predicate_rows = 0
    with path.open(encoding="utf-8") as handle:
        for line_number, line in enumerate(handle, 1):
            if not line.strip():
                continue
            try:
                row = json.loads(line)
            except json.JSONDecodeError as error:
                raise GenerationError(
                    f"{path.name}:{line_number} is not JSON"
                ) from error
            if isinstance(row, dict) and "_canary" in row and "expected" not in row:
                continue
            expected = row.get("expected") if isinstance(row, dict) else None
            if not isinstance(expected, str) or not expected.strip():
                raise GenerationError(f"{path.name}:{line_number} lacks expected")
            expected = expected.strip()
            item_count += 1
            if expected == "KEYWORD_MATCH":
                predicate_rows += 1
            else:
                labels.add(expected)
    if item_count == 0:
        raise GenerationError(f"{path.name} has no bank items")
    if not labels and predicate_rows == item_count:
        return ()
    if len(labels) < 2:
        raise GenerationError(f"{path.name} lacks a non-trivial exact-label set")
    return tuple(sorted(labels))


def model_manifest_path(root: Path, model: str) -> Path:
    """Where ollama stores the manifest for a model reference.

    ollama lays manifests out as <registry>/<namespace>/<name>/<tag>, and fills in
    registry.ollama.ai + library only when the reference omits them. Hardcoding that
    prefix worked for the pod's five bare tags (`qwen2.5:7b`) and silently produced an
    unreachable path for anything qualified: `hf.co/Qwen/Qwen3-0.6B-GGUF:Q8_0` was looked
    up under registry.ollama.ai/library/hf.co/... while ollama had written it to
    hf.co/Qwen/Qwen3-0.6B-GGUF/Q8_0. That closed the whole Hub off from this generator —
    every GGUF repo on it is pullable and none could be configured.

    The reference is split on "/" rather than assumed: a leading component containing a
    dot or a colon is a registry, and what follows is namespace/name.
    """
    if ":" not in model:
        repository, tag = model, "latest"
    else:
        repository, tag = model.rsplit(":", 1)
    parts = [p for p in repository.split("/") if p]
    if len(parts) >= 3 and ("." in parts[0] or ":" in parts[0]):
        registry, namespace, name = parts[0], parts[1], "/".join(parts[2:])
    elif len(parts) == 2:
        registry, namespace, name = "registry.ollama.ai", parts[0], parts[1]
    else:
        registry, namespace, name = "registry.ollama.ai", "library", repository
    return root.joinpath(registry, namespace, *name.split("/"), tag)


def slug(value: str) -> str:
    return re.sub(r"[^a-zA-Z0-9_.-]+", "-", value).strip("-.")


def build_configs(args: argparse.Namespace) -> list[tuple[Path, dict[str, Any]]]:
    workspace_root = args.workspace_root.resolve()
    for label, candidate in (
        ("bank_dir", args.bank_dir),
        ("model_manifest_root", args.model_manifest_root),
        ("jobs_dir", args.jobs_dir),
        ("output_root", args.output_root),
    ):
        try:
            candidate.resolve().relative_to(workspace_root)
        except ValueError as error:
            raise GenerationError(f"{label} must stay below workspace_root") from error
    tags = ollama_digests(args.ollama_url)
    jobs: list[tuple[Path, dict[str, Any]]] = []
    ordinal = 0
    for model_index, model in enumerate(args.models):
        advertised_digest = tags.get(model)
        if advertised_digest is None:
            raise GenerationError(f"configured model is not local: {model}")
        manifest = model_manifest_path(args.model_manifest_root, model)
        if manifest.is_symlink():
            raise GenerationError(f"model manifest is a symlink: {model}")
        manifest_digest = sha256_file(manifest)
        if manifest_digest != advertised_digest:
            raise GenerationError(f"manifest drift for {model}")
        for axis, bank_name in AXES:
            bank = args.bank_dir / bank_name
            if bank.is_symlink():
                raise GenerationError(f"bank is a symlink: {bank_name}")
            labels = bank_labels(bank)
            ordinal += 1
            model_slug = slug(model)
            config = {
                "schema": SCHEMA,
                "workspace_root": str(args.workspace_root.resolve()),
                "axis": axis,
                "model": model,
                "bank": str(bank.resolve()),
                "expected_bank_sha256": sha256_file(bank),
                "output_dir": str((args.output_root / model_slug / axis).resolve()),
                "ollama_url": loopback_url(args.ollama_url),
                "expected_model_manifest_digest": f"sha256:{manifest_digest}",
                "model_manifest_path": str(manifest.resolve()),
                "allowed_labels": list(labels),
                "interval_seconds": args.interval_seconds,
                "disk_low_water_bytes": args.disk_low_water_bytes,
                "request_timeout_seconds": args.request_timeout_seconds,
                "max_tokens": args.max_tokens,
                "seed": 0,
                "temperature": 0,
            }
            filename = f"{ordinal:03d}-{model_index:02d}-{model_slug}-{slug(axis)}.json"
            jobs.append((args.jobs_dir / filename, config))
    return jobs


def write_exclusive(path: Path, payload: bytes) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    descriptor = os.open(path, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o644)
    with os.fdopen(descriptor, "wb") as handle:
        handle.write(payload)
        handle.flush()
        os.fsync(handle.fileno())


def parser() -> argparse.ArgumentParser:
    result = argparse.ArgumentParser(description=__doc__)
    result.add_argument("--bank-dir", type=Path, required=True)
    result.add_argument("--workspace-root", type=Path, default=Path("/workspace"))
    result.add_argument("--model-manifest-root", type=Path, required=True)
    result.add_argument("--jobs-dir", type=Path, required=True)
    result.add_argument("--output-root", type=Path, required=True)
    result.add_argument("--ollama-url", default="http://127.0.0.1:11434")
    result.add_argument("--models", nargs="+", default=list(DEFAULT_MODELS))
    result.add_argument("--interval-seconds", type=int, default=86_400)
    result.add_argument("--disk-low-water-bytes", type=int, default=4 * 1024**3)
    result.add_argument("--request-timeout-seconds", type=int, default=180)
    result.add_argument("--max-tokens", type=int, default=16)
    return result


def main(argv: list[str] | None = None) -> int:
    args = parser().parse_args(argv)
    for name in (
        "interval_seconds",
        "disk_low_water_bytes",
        "request_timeout_seconds",
        "max_tokens",
    ):
        if getattr(args, name) < 1:
            raise SystemExit(f"HALT: {name} must be positive")
    try:
        jobs = build_configs(args)
        collisions = [str(path) for path, _ in jobs if path.exists()]
        if collisions:
            raise GenerationError(
                "refusing to replace existing configs; use a fresh jobs directory"
            )
        for path, config in jobs:
            write_exclusive(path, canonical_bytes(config) + b"\n")
    except (GenerationError, OSError, json.JSONDecodeError) as error:
        print(f"HALT: {error}")
        return 2
    print(f"generated {len(jobs)} pinned compute jobs in {args.jobs_dir}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
