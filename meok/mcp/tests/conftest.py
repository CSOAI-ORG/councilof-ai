"""pytest config for MEOK MCP proxy-path tests."""
import os
import pytest


def pytest_configure(config):
    """Configure test env vars."""
    os.environ.setdefault("MEOK_MASTER_API_KEY", "test-key")
    os.environ.setdefault("MEOK_API_URL", "http://127.0.0.1:9999")
    os.environ.setdefault("SOV3_MCP_URL", "http://127.0.0.1:9998/mcp")
    os.environ.setdefault("SOV3_HEALTH_URL", "http://127.0.0.1:9998/health")
    os.environ.setdefault("SOV3_READYZ_URL", "http://127.0.0.1:9998/readyz")
