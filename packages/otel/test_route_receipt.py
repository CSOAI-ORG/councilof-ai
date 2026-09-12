#!/usr/bin/env python3
import hashlib
import json

from route_receipt import convert


def kv(key, value):
    if isinstance(value, bool):
        node = {"boolValue": value}
    elif isinstance(value, int):
        node = {"intValue": str(value)}
    elif isinstance(value, float):
        node = {"doubleValue": value}
    else:
        node = {"stringValue": value}
    return {"key": key, "value": node}


def fixture():
    return {
        "resourceSpans": [{
            "resource": {"attributes": [kv("service.name", "fixture-router"), kv("service.version", "1.2.3")]},
            "scopeSpans": [{"spans": [{
                "traceId": "a" * 32,
                "spanId": "b" * 16,
                "startTimeUnixNano": "1789200000000000000",
                "endTimeUnixNano": "1789200000842000000",
                "status": {"code": 1},
                "attributes": [
                    kv("gen_ai.provider.name", "provider-a"),
                    kv("gen_ai.request.model", "model-a"),
                    kv("gen_ai.usage.input_tokens", 19),
                    kv("gen_ai.usage.output_tokens", 7),
                    kv("csoai.route.fallback_observed", False),
                    kv("gen_ai.input.messages", "SECRET PROMPT MUST NOT ESCAPE"),
                    kv("gen_ai.tool.call.arguments", "SECRET TOOL ARGUMENTS MUST NOT ESCAPE"),
                ],
            }]}],
        }]
    }


def test_converter_is_privacy_preserving_and_truthful():
    digest = hashlib.sha256(b"fixture").hexdigest()
    receipt = convert(
        fixture(),
        request_sha256=digest,
        response_sha256=digest,
        policy_sha256=digest,
        source_urls=["https://example.org/public-fixture"],
        frozen_bank_id="fixture-v1",
    )
    encoded = json.dumps(receipt)
    assert "SECRET PROMPT" not in encoded
    assert "SECRET TOOL" not in encoded
    assert receipt["subject"]["service"] == "fixture-router"
    assert receipt["subject"]["service_revision"] == "1.2.3"
    assert receipt["execution"]["status"] == "completed"
    assert receipt["execution"]["provider_observed"] == "provider-a"
    assert receipt["execution"]["model_observed"] == "model-a"
    assert receipt["execution"]["fallback_observed"] is False
    assert receipt["execution"]["latency_ms"] == 842
    assert receipt["execution"]["usage"] == {"input_tokens": 19, "output_tokens": 7, "orchestration_tokens": None}
    assert receipt["integrity"]["signature"]["algorithm"] == "none"
    assert receipt["integrity"]["root"]["anchor_status"] == "unsubmitted"


if __name__ == "__main__":
    test_converter_is_privacy_preserving_and_truthful()
    print("ALL OTLP ROUTE RECEIPT TESTS PASSED")
