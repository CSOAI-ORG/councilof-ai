#!/usr/bin/env python3
"""Convert one OTLP/JSON GenAI span into an unsigned CSOAI Route Receipt.

The adapter is deliberately fail-closed. It reads routing metadata and numeric usage only;
it never copies prompts, responses, tool arguments, or tool results. Callers provide the
three content digests, so the adapter does not need the underlying content.
"""
from __future__ import annotations

import argparse
import datetime as dt
import json
from pathlib import Path
from typing import Any


def _value(node: dict[str, Any]) -> Any:
    for key in ("stringValue", "intValue", "doubleValue", "boolValue"):
        if key in node:
            value = node[key]
            return int(value) if key == "intValue" else value
    return None


def _attributes(items: list[dict[str, Any]] | None) -> dict[str, Any]:
    return {str(item["key"]): _value(item.get("value", {})) for item in (items or []) if "key" in item}


def _first_span(document: dict[str, Any]) -> tuple[dict[str, Any], dict[str, Any], dict[str, Any]]:
    try:
        resource_span = document["resourceSpans"][0]
        scope_span = resource_span["scopeSpans"][0]
        span = scope_span["spans"][0]
    except (KeyError, IndexError, TypeError) as exc:
        raise ValueError("input must contain at least one OTLP resourceSpans/scopeSpans/spans entry") from exc
    resource = _attributes(resource_span.get("resource", {}).get("attributes"))
    attrs = _attributes(span.get("attributes"))
    return span, attrs, resource


def _iso_from_nanos(value: Any) -> str:
    try:
        nanos = int(value)
    except (TypeError, ValueError):
        return dt.datetime.now(dt.timezone.utc).isoformat().replace("+00:00", "Z")
    return dt.datetime.fromtimestamp(nanos / 1_000_000_000, dt.timezone.utc).isoformat().replace("+00:00", "Z")


def _duration_ms(span: dict[str, Any]) -> int | None:
    try:
        return max(0, round((int(span["endTimeUnixNano"]) - int(span["startTimeUnixNano"])) / 1_000_000))
    except (KeyError, TypeError, ValueError):
        return None


def _status(span: dict[str, Any]) -> str:
    # OTLP StatusCode: UNSET=0, OK=1, ERROR=2. An error is observable; an unset
    # terminal state is not enough to claim success.
    code = span.get("status", {}).get("code")
    if code == 1:
        return "completed"
    if code == 2:
        return "failed"
    return "unobservable"


def convert(document: dict[str, Any], *, request_sha256: str, response_sha256: str,
            policy_sha256: str, source_urls: list[str], service_revision: str | None = None,
            frozen_bank_id: str | None = None, relationship: str = "independent_measurement",
            region_constraint: str | None = None) -> dict[str, Any]:
    span, attrs, resource = _first_span(document)
    trace_id = span.get("traceId")
    span_id = span.get("spanId")
    service = str(resource.get("service.name") or attrs.get("service.name") or "unidentified-service")
    provider = attrs.get("gen_ai.provider.name") or attrs.get("gen_ai.system")
    model = attrs.get("gen_ai.response.model") or attrs.get("gen_ai.request.model")
    limitations = [
        "Converted from one OTLP/JSON span; no behavioral or regulatory grade is inferred.",
        "Prompt, response, tool arguments, and tool results were excluded; caller-supplied SHA-256 digests bind the content.",
    ]
    if not provider:
        limitations.append("Provider identity was unavailable in the span.")
    if not model:
        limitations.append("Model identity was unavailable in the span.")
    if not trace_id:
        limitations.append("Transport trace identifier was unavailable in the span.")

    fallback = attrs.get("csoai.route.fallback_observed")
    if not isinstance(fallback, bool):
        fallback = None
    cost = attrs.get("gen_ai.usage.cost")
    if not isinstance(cost, (int, float)):
        cost = None

    return {
        "schema": "csoai.route-receipt/0.1",
        "receipt_id": f"otel-{trace_id or 'unobservable'}-{span_id or 'unobservable'}",
        "observed_at": _iso_from_nanos(span.get("endTimeUnixNano") or span.get("startTimeUnixNano")),
        "subject": {
            "service": service,
            "service_revision": service_revision or resource.get("service.version"),
            "relationship": relationship,
            "provider_declared": attrs.get("csoai.route.provider_declared"),
            "model_declared": attrs.get("csoai.route.model_declared"),
        },
        "request": {
            "sha256": request_sha256,
            "frozen_bank_id": frozen_bank_id,
            "content_retained": False,
        },
        "route_policy": {
            "policy_sha256": policy_sha256,
            "data_collection": "unobservable",
            "zero_data_retention": "unobservable",
            "region_constraint": region_constraint,
            "provider_allowlist": [],
            "provider_blocklist": [],
        },
        "execution": {
            "status": _status(span),
            "provider_observed": provider,
            "model_observed": model,
            "fallback_observed": fallback,
            "region_observed": attrs.get("cloud.region") or attrs.get("server.address"),
            "latency_ms": _duration_ms(span),
            "cost_usd": cost,
            "usage": {
                "input_tokens": attrs.get("gen_ai.usage.input_tokens"),
                "output_tokens": attrs.get("gen_ai.usage.output_tokens"),
                "orchestration_tokens": attrs.get("csoai.route.orchestration_tokens"),
            },
        },
        "evidence": {
            "response_sha256": response_sha256,
            "transport_trace_id": trace_id,
            "source_urls": source_urls,
            "limitations": limitations,
        },
        "disclosure": {
            "route_identity": "public" if provider else "unobservable",
            "request_content": "withheld_digest_only",
            "response_content": "withheld_digest_only",
            "independence_note": "Independent evidence conversion only; no partnership, endorsement, certification, or legal conclusion is implied.",
        },
        "integrity": {
            "payload_sha256": None,
            "signature": {"algorithm": "none", "kid": None, "value": None},
            "root": {"sha256": None, "inclusion_proof_url": None, "anchor_status": "unsubmitted"},
            "corrections_url": "https://councilof.ai/api/corrections",
        },
    }


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("input", type=Path, help="OTLP/JSON file containing at least one span")
    parser.add_argument("--output", type=Path, required=True)
    parser.add_argument("--request-sha256", required=True)
    parser.add_argument("--response-sha256", required=True)
    parser.add_argument("--policy-sha256", required=True)
    parser.add_argument("--source-url", action="append", required=True)
    parser.add_argument("--service-revision")
    parser.add_argument("--frozen-bank-id")
    parser.add_argument("--region-constraint")
    parser.add_argument("--relationship", choices=("independent_measurement", "design_partner", "first_party"), default="independent_measurement")
    args = parser.parse_args()
    document = json.loads(args.input.read_text(encoding="utf-8"))
    receipt = convert(
        document,
        request_sha256=args.request_sha256,
        response_sha256=args.response_sha256,
        policy_sha256=args.policy_sha256,
        source_urls=args.source_url,
        service_revision=args.service_revision,
        frozen_bank_id=args.frozen_bank_id,
        relationship=args.relationship,
        region_constraint=args.region_constraint,
    )
    args.output.write_text(json.dumps(receipt, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
