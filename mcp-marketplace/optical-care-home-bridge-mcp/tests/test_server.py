#!/usr/bin/env python3
"""Smoke tests for optical-care-home-bridge-mcp."""
import sys
import os
import json
import pytest

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
_shared_auth = os.path.expanduser("~/clawd/meok-labs-engine/shared")
if os.path.isdir(_shared_auth):
    sys.path.insert(0, _shared_auth)


def test_server_module_imports():
    import server
    assert server is not None


def test_mcp_object_exists():
    import server
    assert hasattr(server, "mcp")


def test_tools_are_callable():
    import server
    mcp = server.mcp
    tm = getattr(mcp, "_tool_manager", None)
    if tm is not None:
        tools = getattr(tm, "_tools", {})
        assert isinstance(tools, dict)
        assert len(tools) >= 1
    else:
        tools = getattr(mcp, "_tools", {})
        assert isinstance(tools, dict) or callable(tools)


def test_main_function():
    import server
    assert hasattr(server, "main")
    assert callable(server.main)


def test_no_hardcoded_secrets():
    with open(os.path.join(os.path.dirname(__file__), "..", "server.py")) as f:
        content = f.read()
    assert "sk_live_" not in content
    assert "sk_test_" not in content
