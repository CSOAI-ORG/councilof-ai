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
    assert receipt["execution"]["model_observed"] is None
    assert receipt["subject"]["model_declared"] == "model-a"
    assert receipt["execution"]["fallback_observed"] is False
    assert receipt["execution"]["latency_ms"] == 842
    assert receipt["execution"]["usage"] == {"input_tokens": 19, "output_tokens": 7, "orchestration_tokens": None}
    assert receipt["integrity"]["signature"]["algorithm"] == "none"
    assert receipt["integrity"]["root"]["anchor_status"] == "unsubmitted"


def receipt_for(document):
    return convert(document, request_sha256="a" * 64, response_sha256="b" * 64,
                   policy_sha256="c" * 64, source_urls=[])


def span_for(document):
    return document["resourceSpans"][0]["scopeSpans"][0]["spans"][0]


def expect_rejected(document):
    try:
        receipt_for(document)
    except ValueError:
        return
    raise AssertionError("invalid evidence was accepted")


def test_observations_do_not_upgrade_declarations():
    document = fixture()
    span_for(document)["attributes"] += [kv("server.address", "api.example.org")]
    receipt = receipt_for(document)
    assert receipt["execution"]["region_observed"] is None
    assert receipt["execution"]["model_observed"] is None
    span_for(document)["attributes"] += [kv("gen_ai.response.model", "actual-model"), kv("cloud.region", "eu-west-1")]
    receipt = receipt_for(document)
    assert receipt["subject"]["model_declared"] == "model-a"
    assert receipt["execution"]["model_observed"] == "actual-model"
    assert receipt["execution"]["region_observed"] == "eu-west-1"


def test_timestamp_is_evidence_not_conversion_time():
    document = fixture()
    span = span_for(document)
    assert receipt_for(document)["observed_at"] == "2026-09-12T08:00:00.842000000Z"
    del span["endTimeUnixNano"]
    receipt = receipt_for(document)
    assert receipt["observed_at"] == "2026-09-12T08:00:00.000000000Z"
    assert receipt["execution"]["latency_ms"] is None
    del span["startTimeUnixNano"]
    expect_rejected(document)
    for invalid in (None, "", "bad", 0, -1, True, 1.5, "1e18", 2**64):
        document = fixture()
        span_for(document)["endTimeUnixNano"] = invalid
        expect_rejected(document)
    document = fixture()
    span_for(document)["endTimeUnixNano"] = "1789199999999999999"
    expect_rejected(document)


def test_invalid_usage_and_cost_are_rejected():
    for key in ("gen_ai.usage.input_tokens", "gen_ai.usage.output_tokens", "csoai.route.orchestration_tokens"):
        for value in (-1, True, 1.5, "12"):
            document = fixture()
            span_for(document)["attributes"] += [kv(key, value)]
            expect_rejected(document)
    for value in (-1, True, float("nan"), float("inf"), "0.02"):
        document = fixture()
        span_for(document)["attributes"] += [kv("gen_ai.usage.cost", value)]
        expect_rejected(document)
    document = fixture()
    span_for(document)["attributes"] += [kv("gen_ai.usage.cost", 0.0), kv("gen_ai.usage.input_tokens", 0)]
    receipt = receipt_for(document)
    assert receipt["execution"]["cost_usd"] == 0
    assert receipt["execution"]["usage"]["input_tokens"] == 0


def test_invalid_digest_is_rejected():
    for invalid in ("", "a" * 63, "A" * 64, "g" * 64):
        try:
            convert(fixture(), request_sha256=invalid, response_sha256="b" * 64,
                    policy_sha256="c" * 64, source_urls=[])
        except ValueError:
            continue
        raise AssertionError("invalid digest was accepted")


if __name__ == "__main__":
    for name, test in list(globals().items()):
        if name.startswith("test_"):
            test()
    print("ALL OTLP ROUTE RECEIPT TESTS PASSED (5 groups)")
