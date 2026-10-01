"""pytest config for MEOK MCP proxy-path tests."""
import pytest


def pytest_configure(config):
    config.addinivalue_line("markers", "live: hits a running MEOK MCP on :3102")

