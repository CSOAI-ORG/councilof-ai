"""Public, credential-free execution metadata for GSPC receipts.

This validates declarations and their digests, not provider grants. A provider
record hash identifies evidence to review; it does not authenticate that evidence.
No field in this module authorizes a model call or changes a provider safeguard.
"""
from __future__ import annotations

import hashlib
import json
import math
import re
from datetime import datetime
from pathlib import Path

FIELDS = {"version", "provider", "model", "route_id", "access_channel",
          "access_program", "cyber_tier", "safeguard_profile", "generation", "provenance"}
CHANNELS = {"direct_api", "third_party", "self_hosted", "unknown"}
TIERS = {"standard", "defense", "red_team", "specialized", "not_applicable", "unknown"}
PROGRAMS = {"none", "anthropic_cvp", "unknown"}
SOURCES = {"operator_declaration", "provider_record", "unknown"}
GENERATION_SOURCES = {"runner_parameters", "supplied_context", "inspect_solver_parameters", "unknown"}


def context_digest(context: dict) -> str:
    """Tamper-evident byte identity, never a signature or proof of approval."""
    raw = json.dumps(context, sort_keys=True, separators=(",", ":"),
                     ensure_ascii=True, allow_nan=False).encode()
    return hashlib.sha256(raw).hexdigest()


def _public_label(value, name: str, *, model: bool = False) -> None:
    pattern = r"[A-Za-z0-9][A-Za-z0-9_.:/@-]{0,199}" if model else r"[a-z][a-z0-9_.-]{0,63}"
    if not isinstance(value, str) or not re.fullmatch(pattern, value):
        raise ValueError(f"execution_context.{name} must be a public label, not a URL, account ID or secret")
    if ("://" in value or re.search(r"(?:^|[/_.-])(?:sk-(?:ant-)?[A-Za-z0-9_-]{8,}|gh[pousr]_[A-Za-z0-9]{10,}|github_pat_[A-Za-z0-9_]{10,}|hf_[A-Za-z0-9]{10,}|AKIA[A-Z0-9]{12,}|Bearer)", value, re.I)
            or re.search(r"(?:^|/)(?:org[-_]|workspace[-_]|acct[-_]|account[-_])", value, re.I)
            or (not model and re.search(r"[0-9a-f]{24,}|[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}", value, re.I))
            or ("@" in value and not re.fullmatch(r"[A-Za-z0-9_.:/-]+/[A-Za-z0-9_.-]+@[0-9a-f]{40,64}", value))):
        raise ValueError(f"execution_context.{name} contains an identifier or credential-shaped value")


def validate_context(value: dict) -> dict:
    """Return a detached validated copy; reject extra fields rather than leak them."""
    if not isinstance(value, dict) or set(value) != FIELDS:
        raise ValueError("execution_context must contain exactly the documented public fields")
    if type(value["version"]) is not int or value["version"] != 1:
        raise ValueError("execution_context.version must be 1")
    for field in ("provider", "model", "route_id", "safeguard_profile"):
        _public_label(value[field], field, model=field == "model")
    if not isinstance(value["access_channel"], str) or value["access_channel"] not in CHANNELS:
        raise ValueError("execution_context.access_channel is invalid")
    if (not isinstance(value["access_program"], str) or value["access_program"] not in PROGRAMS
            or not isinstance(value["cyber_tier"], str) or value["cyber_tier"] not in TIERS):
        raise ValueError("execution_context access_program or cyber_tier is invalid")
    allowed = {"unknown": {"unknown"}, "none": {"standard", "not_applicable"},
               "anthropic_cvp": {"defense", "red_team", "specialized"}}
    if value["cyber_tier"] not in allowed[value["access_program"]]:
        raise ValueError("execution_context access_program and cyber_tier contradict each other")
    generation = value["generation"]
    if not isinstance(generation, dict) or set(generation) != {"temperature", "max_tokens"}:
        raise ValueError("execution_context.generation requires temperature and max_tokens")
    temp, budget = generation["temperature"], generation["max_tokens"]
    if temp is not None and (type(temp) not in (int, float) or not math.isfinite(temp) or temp < 0):
        raise ValueError("execution_context generation temperature must be finite and nonnegative")
    if budget is not None and (type(budget) is not int or budget <= 0):
        raise ValueError("execution_context generation max_tokens must be a positive integer")
    provenance = value["provenance"]
    if not isinstance(provenance, dict) or set(provenance) != {"source", "observed_at", "evidence_sha256"}:
        raise ValueError("execution_context.provenance requires source, observed_at and evidence_sha256")
    if not isinstance(provenance["source"], str) or provenance["source"] not in SOURCES:
        raise ValueError("execution_context provenance source is invalid")
    stamp = provenance["observed_at"]
    if stamp is not None:
        try:
            parsed = datetime.fromisoformat(stamp.replace("Z", "+00:00"))
        except (TypeError, AttributeError, ValueError):
            raise ValueError("execution_context provenance observed_at must be an ISO timestamp") from None
        if parsed.tzinfo is None:
            raise ValueError("execution_context provenance observed_at requires a timezone")
    evidence = provenance["evidence_sha256"]
    if evidence is not None and (not isinstance(evidence, str) or not re.fullmatch(r"[0-9a-f]{64}", evidence)):
        raise ValueError("execution_context provenance evidence_sha256 must be a SHA-256 digest")
    if provenance["source"] != "unknown" and stamp is None:
        raise ValueError("execution_context declarations require observed_at")
    if provenance["source"] == "provider_record" and evidence is None:
        raise ValueError("execution_context provider_record requires an evidence digest; authenticity is not verified")
    return json.loads(json.dumps(value, allow_nan=False))


def unknown_context(model: str | None = None) -> dict:
    return {"version": 1, "provider": "unknown", "model": model or "unknown",
            "route_id": "unknown", "access_channel": "unknown", "access_program": "unknown",
            "cyber_tier": "unknown", "safeguard_profile": "unknown",
            "generation": {"temperature": None, "max_tokens": None},
            "provenance": {"source": "unknown", "observed_at": None, "evidence_sha256": None}}


def load_context(path: str | None, *, model: str | None = None,
                 live_generation: dict | None = None) -> dict:
    def no_duplicates(pairs):
        data = {}
        for key, value in pairs:
            if key in data:
                raise ValueError("execution_context contains duplicate JSON fields")
            data[key] = value
        return data
    context = validate_context(json.loads(Path(path).read_text(encoding="utf-8"),
        object_pairs_hook=no_duplicates)) if path else unknown_context(model)
    if path and model and context["model"] != model:
        raise ValueError("execution_context.model differs from --model")
    if live_generation is not None:
        if path and context["generation"] != live_generation:
            raise ValueError("execution_context generation differs from the actual runner parameters")
        context["generation"] = live_generation
    return validate_context(context)


def checked_receipt_context(receipt: dict) -> dict:
    value = receipt.get("execution_context")
    if value is None:
        raise ValueError("comparison refused: execution_context is missing (legacy receipt; do not backfill by guessing)")
    context = validate_context(value)
    if receipt.get("execution_context_sha256") != context_digest(context):
        raise ValueError("comparison refused: execution_context_sha256 is missing or differs")
    if receipt.get("model") != context["model"]:
        raise ValueError("comparison refused: execution_context.model differs from receipt model")
    for field in ("provider", "model", "route_id", "access_channel", "access_program", "cyber_tier", "safeguard_profile"):
        if context[field] == "unknown":
            raise ValueError(f"comparison refused: execution_context.{field} is unknown")
    if any(v is None for v in context["generation"].values()):
        raise ValueError("comparison refused: generation parameters are unknown")
    if context["provenance"]["source"] == "unknown":
        raise ValueError("comparison refused: execution_context provenance is unknown")
    if generation_source(receipt) == "unknown":
        raise ValueError("comparison refused: generation parameters source is unknown")
    return context


def generation_source(receipt: dict) -> str:
    value = receipt.get("generation_parameters_source", "unknown")
    if not isinstance(value, str) or value not in GENERATION_SOURCES:
        raise ValueError("invalid generation_parameters_source; use a documented source label")
    return value


def compare_contexts(left: dict, right: dict, mode: str = "model") -> dict:
    """Compare declared conditions. Different models/providers are valid treatments.

    The optional access-treatment mode changes only the CVP access programme/tier;
    provider, model and pseudonymous route must otherwise be identical.
    """
    if mode not in {"model", "access-treatment"}:
        raise ValueError("comparison refused: unsupported comparison mode")
    a, b = checked_receipt_context(left), checked_receipt_context(right)
    for field in ("generation", "safeguard_profile"):
        if a[field] != b[field]:
            raise ValueError(f"comparison refused: execution_context.{field} differs")
    access_fields = ("access_program", "cyber_tier")
    access_a, access_b = tuple(a[f] for f in access_fields), tuple(b[f] for f in access_fields)
    if mode == "model":
        if access_a != access_b:
            raise ValueError("comparison refused: access programme/cyber tier differs; declare a controlled access-treatment experiment")
    else:
        for field in ("provider", "model", "route_id", "access_channel"):
            if a[field] != b[field]:
                raise ValueError(f"comparison refused: access-treatment requires the same {field}")
        candidates = {("none", "standard"), ("anthropic_cvp", "defense"),
                      ("anthropic_cvp", "red_team"), ("anthropic_cvp", "specialized")}
        if access_a == access_b or access_a not in candidates or access_b not in candidates:
            raise ValueError("comparison refused: access-treatment requires two distinct known CVP/standard access conditions")
    return {"mode": mode, "basis": "validated supplied metadata; provider entitlement is not authenticated",
            "left_context_sha256": context_digest(a), "right_context_sha256": context_digest(b),
            "provenance_sources": [a["provenance"]["source"], b["provenance"]["source"]],
            "different_fields": [f for f in ("provider", "model", "route_id", "access_channel", *access_fields) if a[f] != b[f]],
            "generation_parameters_sources": [generation_source(left), generation_source(right)],
            "interpretation": ("Same declared model identifier and route, different access conditions; no model-superiority verdict."
                if mode == "access-treatment" else "Comparison of declared model deployments; provider and route differences remain explicit."),
            "limits": "Hashes detect changed metadata, not false declarations. Equal recorded limits do not prove equal compute, "
                "unrecorded settings, provider defaults or effective safeguards. An unchanged model identifier does not prove "
                "an unchanged provider model snapshot. safeguard_profile identifies the declared application/system/tool policy, excluding the cyber tier treatment."}
