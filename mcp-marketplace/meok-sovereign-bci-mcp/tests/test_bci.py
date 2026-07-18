import sys
import os
import importlib
import importlib.util
sys.path.insert(0, os.path.expanduser("~/clawd/mcp-marketplace/meok-sovereign-shared-core"))
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))) + "/../meok-sovereign-shared-core")
"""Tests for meok-sovereign-bci-mcp."""
import os

MODULE_PATH = os.path.join(os.path.dirname(__file__), "..", "sovereign_bci.py")
spec = importlib.util.spec_from_file_location("sovereign_bci", MODULE_PATH)
mod = importlib.util.module_from_spec(spec)
spec.loader.exec_module(mod)

bci_list_boards = mod.bci_list_boards
bci_list_states = mod.bci_list_states
bci_session_start = mod.bci_session_start
bci_classify = mod.bci_classify
bci_control_robot = mod.bci_control_robot
bci_session_stop = mod.bci_session_stop
bci_status = mod.bci_status
VERSION = mod.VERSION
TOOLS = mod.TOOLS


def test_version():
    assert VERSION == "1.0.0"


def test_tools_count():
    assert len(TOOLS) == 7


def test_list_boards():
    r = bci_list_boards()
    assert r["count"] >= 5
    assert "ads1299-esp32" in r["boards"]


def test_list_states():
    r = bci_list_states()
    assert r["count"] >= 8
    assert "focus" in r["states"]


def test_session_no_consent():
    r = bci_session_start("nick", consent_given=False)
    assert "error" in r


def test_session_banned_use():
    r = bci_session_start("nick", purpose="interrogation", consent_given=True)
    assert "error" in r


def test_session_start():
    r = bci_session_start("nick", "ads1299-esp32", "assistive", consent_given=True)
    assert r["consent"] is True
    assert r["channels"] == 8
    assert r["status"] == "recording"


def test_classify():
    r = bci_classify("session-1", "focus")
    assert r["confidence"] >= 0.85


def test_classify_invalid():
    r = bci_classify("session-1", "invalid")
    assert "error" in r


def test_control_robot():
    r = bci_control_robot("session-1", "forward")
    assert r["safety_interlock"] is True


def test_control_invalid():
    r = bci_control_robot("session-1", "jump")
    assert "error" in r


def test_stop():
    r = bci_session_stop("session-1")
    assert r["status"] == "stopped"


def test_status():
    r = bci_status()
    assert r["consent_required"] is True
    assert r["assistive_only"] is True



if __name__ == "__main__":
    test_version()
    print("PASS: test_version")
    test_tools_count()
    print("PASS: test_tools_count")
    test_list_boards()
    print("PASS: test_list_boards")
    test_list_states()
    print("PASS: test_list_states")
    test_session_no_consent()
    print("PASS: test_session_no_consent")
    test_session_banned_use()
    print("PASS: test_session_banned_use")
    test_session_start()
    print("PASS: test_session_start")
    test_classify()
    print("PASS: test_classify")
    test_classify_invalid()
    print("PASS: test_classify_invalid")
    test_control_robot()
    print("PASS: test_control_robot")
    test_control_invalid()
    print("PASS: test_control_invalid")
    test_stop()
    print("PASS: test_stop")
    test_status()
    print("PASS: test_status")
    print("\n" + str(13) + " tests complete")


