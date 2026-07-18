"""Tests for meok-sovereign-training-mcp."""
import os, sys, importlib.util

# Load sovereign_training.py via absolute path (avoids the PyPI 'server' name-clash)
MODULE_PATH = os.path.join(os.path.dirname(__file__), "..", "meok_sovereign_training_mcp", "sovereign_training.py")
spec = importlib.util.spec_from_file_location("sovereign_training", MODULE_PATH)
mod = importlib.util.module_from_spec(spec)
spec.loader.exec_module(mod)

training_list_tracks = mod.training_list_tracks
training_get_track = mod.training_get_track
training_enroll = mod.training_enroll
training_progress = mod.training_progress
training_issue_cert = mod.training_issue_cert
training_verify = mod.training_verify
training_list_user_certs = mod.training_list_user_certs
training_partner_enroll = mod.training_partner_enroll
training_partner_aggregate = mod.training_partner_aggregate
training_metrics_global = mod.training_metrics_global
TRAINING_TRACKS = mod.TRAINING_TRACKS
VERSION = mod.VERSION
TOOLS = mod.TOOLS


def test_version():
    assert VERSION == "1.0.0"


def test_tools_count():
    assert len(TOOLS) == 10


def test_list_tracks_all():
    r = training_list_tracks("all")
    assert r["count"] == 8


def test_list_tracks_foundational():
    r = training_list_tracks("foundational")
    assert r["count"] >= 3


def test_get_track():
    r = training_get_track("ai-governance")
    assert r["free"] is True


def test_get_track_missing():
    r = training_get_track("nonexistent")
    assert "error" in r


def test_enroll():
    r = training_enroll("nick", "ai-governance")
    assert r["status"] == "active"
    assert r["progress"] == 0


def test_progress_complete():
    training_enroll("alice", "mcp-engineer")
    r = training_progress("alice", "mcp-engineer", 50)
    assert r["progress"] == 50
    r = training_progress("alice", "mcp-engineer", 100)
    assert r["status"] == "completed"


def test_progress_invalid():
    training_enroll("bob", "applied-care")
    r = training_progress("bob", "applied-care", 150)
    assert "error" in r


def test_issue_cert_complete():
    training_enroll("carol", "defence-ai")
    training_progress("carol", "defence-ai", 100)
    r = training_issue_cert("carol", "defence-ai")
    assert r["bft_unanimous"] is True
    assert r["passport_id"].startswith("meok-cert-")
    assert r["free"] is True


def test_issue_cert_incomplete():
    training_enroll("dan", "sovereign-substrate")
    r = training_issue_cert("dan", "sovereign-substrate")
    assert "error" in r


def test_verify():
    r = training_verify("meok-cert-test-abc")
    assert r["valid"] is True


def test_list_user_certs():
    r = training_list_user_certs("nick")
    assert "certs" in r


def test_partner_enroll():
    r = training_partner_enroll("partner-1", ["ai-governance", "mcp-engineer"], seats=50)
    assert r["white_label"] is True
    assert r["seats"] == 50
    assert r["cohort_id"].startswith("c-")


def test_partner_aggregate():
    training_partner_enroll("partner-2", ["applied-care"], 100)
    r = training_partner_aggregate("partner-2")
    assert r["partner_id"] == "partner-2"


def test_metrics_global():
    r = training_metrics_global()
    assert r["total_tracks"] == 8
    assert r["total_modules"] == 220
    assert r["free"] is True
