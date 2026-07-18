"""Tests for meok-sovereign-deploy-mcp (canary + blue-green)."""
import meok_sovereign_deploy_mcp as d_mod
from meok_sovereign_deploy_mcp import (
    deploy_validate, deploy_stage, deploy_production,
    deploy_rollback, deploy_status,
)


def reset_state():
    d_mod._DEPLOYS.clear()
    d_mod._PROMOTIONS.clear()
    d_mod._ROLLBACKS.clear()


def test_validate_basic():
    reset_state()
    r = deploy_validate("api", "1.0.0", strategy="canary")
    assert r["validated"] is True
    assert r["stage"] == "validated"


def test_validate_blue_green():
    reset_state()
    r = deploy_validate("api", "2.0.0", strategy="blue-green")
    assert r["strategy"] == "blue-green"


def test_validate_unknown_strategy():
    r = deploy_validate("api", "1.0", strategy="chaos")
    assert "error" in r


def test_validate_empty_service():
    r = deploy_validate("", "1.0")
    assert "error" in r


def test_validate_empty_version():
    r = deploy_validate("api", "")
    assert "error" in r


def test_validate_care_floor_errors():
    reset_state()
    r = deploy_validate("api", "1.0", health_checks={
        "required_passing": False,
        "max_error_rate": 0.10,
        "max_p95_ms": 9999,
    })
    assert r["validated"] is False
    assert len(r["validation_errors"]) >= 3


def test_stage_canary():
    reset_state()
    v = deploy_validate("api", "1.0", strategy="canary")
    r = deploy_stage(v["deploy_id"], stage="canary", traffic_pct=10)
    assert r["status"] == "staged"
    assert r["traffic_pct"] == 10


def test_stage_blue_green():
    reset_state()
    v = deploy_validate("api", "1.0", strategy="blue-green")
    r = deploy_stage(v["deploy_id"], stage="blue")
    assert r["traffic_pct"] == 100


def test_stage_canary_invalid_pct():
    reset_state()
    v = deploy_validate("api", "1.0", strategy="canary")
    r = deploy_stage(v["deploy_id"], stage="canary", traffic_pct=0)
    assert "error" in r


def test_stage_unknown_deploy():
    r = deploy_stage("nope")
    assert "error" in r


def test_stage_unvalidated_deploy():
    reset_state()
    v = deploy_validate("api", "1.0", health_checks={"max_error_rate": 0.99})
    r = deploy_stage(v["deploy_id"])
    assert "error" in r


def test_stage_unknown_stage():
    reset_state()
    v = deploy_validate("api", "1.0")
    r = deploy_stage(v["deploy_id"], stage="chaos")
    assert "error" in r


def test_promotion_3_voters():
    reset_state()
    v = deploy_validate("api", "1.0")
    deploy_stage(v["deploy_id"])
    did = v["deploy_id"]
    r1 = deploy_production(did, "scribe")
    assert r1["promoted"] is False
    r2 = deploy_production(did, "shield")
    assert r2["promoted"] is False
    r3 = deploy_production(did, "lex")
    assert r3["promoted"] is True
    assert r3["service"] == "api"


def test_promotion_unknown():
    r = deploy_production("nope", "scribe")
    assert "error" in r


def test_promotion_without_staging_still_validated():
    """Promotion is allowed from 'validated' OR 'staged'; from neither it errors."""
    reset_state()
    v = deploy_validate("api", "1.0")
    did = v["deploy_id"]
    # First call returns error (not in staged/validated) if we reject — actually
    # the function permits both validated and staged, so 3 votes are enough.
    # Just verify the round-trip works without explicit stage call.
    r1 = deploy_production(did, "scribe")
    r2 = deploy_production(did, "shield")
    r3 = deploy_production(did, "lex")
    assert r3["promoted"] is True


def test_rollback_basic():
    reset_state()
    v1 = deploy_validate("api", "1.0")
    deploy_stage(v1["deploy_id"])
    for approver in ["a", "b", "c"]:
        deploy_production(v1["deploy_id"], approver)

    v2 = deploy_validate("api", "2.0")
    deploy_stage(v2["deploy_id"])
    for approver in ["a", "b", "c"]:
        deploy_production(v2["deploy_id"], approver)

    r = deploy_rollback(v2["deploy_id"], reason="high error rate")
    assert r["rolled_back"] is True
    assert r["rolled_back_to"] == v1["deploy_id"]


def test_rollback_unknown_deploy():
    r = deploy_rollback("nope")
    assert "error" in r


def test_rollback_not_in_production():
    reset_state()
    v = deploy_validate("api", "1.0")
    r = deploy_rollback(v["deploy_id"])
    assert "error" in r


def test_rollback_first_deploy_no_previous():
    reset_state()
    v = deploy_validate("api", "1.0")
    deploy_stage(v["deploy_id"])
    for approver in ["a", "b", "c"]:
        deploy_production(v["deploy_id"], approver)
    r = deploy_rollback(v["deploy_id"])
    assert r["rolled_back"] is True
    assert r["rolled_back_to"] is None


def test_status_basic():
    reset_state()
    deploy_validate("api", "1.0")
    deploy_validate("web", "1.0")
    r = deploy_status()
    assert r["count"] == 2


def test_status_filtered_by_service():
    reset_state()
    deploy_validate("api", "1.0")
    deploy_validate("web", "1.0")
    r = deploy_status(service="api")
    assert r["count"] == 1


def test_status_by_deploy_id():
    reset_state()
    v = deploy_validate("api", "1.0")
    r = deploy_status(deploy_id=v["deploy_id"])
    assert r["count"] == 1


def test_no_external_deps():
    src = open(d_mod.__file__).read()
    assert "import ollama" not in src
    assert "import urllib" not in src
    assert "import requests" not in src


def test_signed_outputs():
    reset_state()
    v = deploy_validate("api", "1.0")
    did = v["deploy_id"]
    deploy_stage(did)
    for r in [
        deploy_status(),
        deploy_production(did, "a"),
        deploy_rollback(did),
    ]:
        assert "kid" in r and "sig" in r and "ts" in r


def test_full_lifecycle():
    """Validate → stage → promote v1 → validate/stage/promote v2 → rollback."""
    reset_state()
    v1 = deploy_validate("api", "1.0", strategy="blue-green")
    deploy_stage(v1["deploy_id"], stage="blue")
    for approver in ["a", "b", "c"]:
        deploy_production(v1["deploy_id"], approver)
    v2 = deploy_validate("api", "2.0", strategy="canary")
    deploy_stage(v2["deploy_id"], stage="canary", traffic_pct=20)
    for approver in ["a", "b", "c"]:
        deploy_production(v2["deploy_id"], approver)
    rb = deploy_rollback(v2["deploy_id"], reason="regression")
    assert rb["rolled_back_to"] == v1["deploy_id"]
    final = deploy_status(service="api")
    assert final["count"] == 2