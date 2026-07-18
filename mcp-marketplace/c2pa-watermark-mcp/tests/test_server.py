#!/usr/bin/env python3
"""Smoke tests for c2pa-watermark-mcp."""
import sys
import os
import json
import pytest

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "src"))

# Skip the whole module if the c2pa native dep is not installed (requires exiv2).
pytest.importorskip("c2pa", reason="c2pa (exiv2 native) not installed in this env")


def test_server_module_imports():
    from c2pa_watermark_mcp import server
    assert server is not None


def test_mcp_object_exists():
    from c2pa_watermark_mcp import server
    assert hasattr(server, "mcp")


def test_tools_are_callable():
    from c2pa_watermark_mcp import server
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
    from c2pa_watermark_mcp import server
    assert hasattr(server, "main")
    assert callable(server.main)


def test_no_hardcoded_secrets():
    src = os.path.join(os.path.dirname(__file__), "..", "src", "c2pa_watermark_mcp", "server.py")
    with open(src) as f:
        content = f.read()
    assert "sk_live_" not in content
    assert "sk_test_" not in content
