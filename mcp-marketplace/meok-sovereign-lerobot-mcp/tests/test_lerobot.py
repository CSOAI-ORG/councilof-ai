import sys
import os
import importlib
import importlib.util
sys.path.insert(0, os.path.expanduser("~/clawd/mcp-marketplace/meok-sovereign-shared-core"))
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))) + "/../meok-sovereign-shared-core")
"""Tests for meok-sovereign-lerobot-mcp."""
import os

MODULE_PATH = os.path.join(os.path.dirname(__file__), "..", "sovereign_lerobot.py")
spec = importlib.util.spec_from_file_location("sovereign_lerobot", MODULE_PATH)
mod = importlib.util.module_from_spec(spec)
spec.loader.exec_module(mod)

lerobot_list_tasks = mod.lerobot_list_tasks
lerobot_list_models = mod.lerobot_list_models
lerobot_train = mod.lerobot_train
lerobot_record_demo = mod.lerobot_record_demo
lerobot_status = mod.lerobot_status
lerobot_emit_sigil = mod.lerobot_emit_sigil
VERSION = mod.VERSION
TOOLS = mod.TOOLS


def test_version():
    assert VERSION == "1.0.0"


def test_tools_count():
    assert len(TOOLS) == 6


def test_list_tasks():
    r = lerobot_list_tasks()
    assert r["count"] >= 6
    assert "pick-microgreen" in r["tasks"]


def test_list_models():
    r = lerobot_list_models()
    assert "diffusion-policy" in r["models"]


def test_train_ready():
    r = lerobot_train("pick-microgreen", "diffusion-policy", demos_recorded=50)
    assert r["ready_to_train"] is True


def test_train_not_ready():
    r = lerobot_train("pick-microgreen", demos_recorded=10)
    assert r["ready_to_train"] is False


def test_train_invalid_task():
    r = lerobot_train("invalid")
    assert "error" in r


def test_record_demo():
    r = lerobot_record_demo("water-plant", "nick", 10)
    assert r["recorded"] is True


def test_status():
    r = lerobot_status()
    assert r["uk_soil"] is True
    assert r["upstream"] == "huggingface/lerobot"


def test_emit_sigil():
    r = lerobot_emit_sigil("pick-microgreen")
    assert len(r["digest"]) == 16



if __name__ == "__main__":
    test_version()
    print("PASS: test_version")
    test_tools_count()
    print("PASS: test_tools_count")
    test_list_tasks()
    print("PASS: test_list_tasks")
    test_list_models()
    print("PASS: test_list_models")
    test_train_ready()
    print("PASS: test_train_ready")
    test_train_not_ready()
    print("PASS: test_train_not_ready")
    test_train_invalid_task()
    print("PASS: test_train_invalid_task")
    test_record_demo()
    print("PASS: test_record_demo")
    test_status()
    print("PASS: test_status")
    test_emit_sigil()
    print("PASS: test_emit_sigil")
    print("\n" + str(10) + " tests complete")


