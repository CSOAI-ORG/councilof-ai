"""Tests for meok-sovereign-skills-mcp."""
import os, tempfile

_TEST_DIR = tempfile.mkdtemp(prefix="sov_skill_test_")
os.environ["SOV_SKILLS_KEY"] = os.path.join(_TEST_DIR, "key.pem")

from meok_sovereign_skills_mcp import (
    sov_skill_create, sov_skill_evaluate, sov_skill_edit,
    sov_skill_review, sov_skill_package, _SKILLS, VERSION, PROTOCOL,
)


def test_create_basic():
    r = sov_skill_create("Test Skill", "# Test\nThis is a skill.")
    assert r["protocol"] == PROTOCOL
    assert r["name"] == "Test Skill"
    assert r["version"] == "0.1.0"
    assert r["stage"] == "created"
    assert "kid" in r and "sig" in r


def test_create_with_tags():
    r = sov_skill_create("Tagged Skill", "...", tags=["governance", "v1"])
    assert "governance" in r["tags"]


def test_evaluate():
    skill = sov_skill_create("To Eval", "...")
    r = sov_skill_evaluate(skill["skill_id"], score=0.85, criteria={"clarity": 0.9})
    assert r["score"] == 0.85
    assert r["criteria"]["clarity"] == 0.9
    assert r["stage"] == "evaluated"


def test_evaluate_invalid_score():
    skill = sov_skill_create("Bad", "...")
    r = sov_skill_evaluate(skill["skill_id"], score=2.0)
    assert "error" in r


def test_edit_bumps_version():
    skill = sov_skill_create("Versioned", "v1 content")
    r = sov_skill_edit(skill["skill_id"], "v2 content", editor="editor")
    assert r["new_version"] == "0.2.0"


def test_review_approve():
    skill = sov_skill_create("To Review", "...")
    r = sov_skill_review(skill["skill_id"], "councilof", "approve", comment="LGTM")
    assert r["verdict"] == "approve"
    assert r["review_count"] == 1


def test_review_invalid_verdict():
    skill = sov_skill_create("To Review", "...")
    r = sov_skill_review(skill["skill_id"], "councilof", "maybe")
    assert "error" in r


def test_package_requires_approval():
    skill = sov_skill_create("To Package", "...")
    r = sov_skill_package(skill["skill_id"])
    assert r["approved"] is False
    assert r["stage"] == "packaged"


def test_package_after_approval():
    skill = sov_skill_create("Approved Skill", "...")
    sov_skill_review(skill["skill_id"], "councilof", "approve")
    r = sov_skill_package(skill["skill_id"])
    assert r["approved"] is True


def test_all_signed():
    r = sov_skill_create("signed", "...")
    assert "kid" in r and "sig" in r
