#!/usr/bin/env python3
"""Tests for optimize-mcp-readme.py"""
from __future__ import annotations

import importlib.util
import tempfile
import unittest
from pathlib import Path

spec = importlib.util.spec_from_file_location("optimize_mcp_readme", "/Users/nicholas/clawd/scripts/optimize-mcp-readme.py")
optimize_mcp_readme = importlib.util.module_from_spec(spec)
spec.loader.exec_module(optimize_mcp_readme)


class TestOptimizeMCPReadme(unittest.TestCase):
    def test_extract_title(self):
        text = "# meok-test-mcp\n\nDescription here."
        self.assertEqual(optimize_mcp_readme.extract_title(text), "meok-test-mcp")

    def test_extract_first_paragraph(self):
        text = "# Title\n\nFirst paragraph.\n\nSecond paragraph."
        self.assertEqual(optimize_mcp_readme.extract_first_paragraph(text), "First paragraph.")

    def test_detect_keywords(self):
        text = "This MCP helps with EU AI Act and DORA compliance."
        kw = optimize_mcp_readme.detect_keywords(text)
        self.assertIn("EU AI Act", kw)
        self.assertIn("DORA", kw)

    def test_build_readme(self):
        readme = optimize_mcp_readme.build_readme(
            "Test MCP",
            "A test MCP.",
            "## Tools\n\n| Tool | Purpose |",
            {"type": "pypi"},
            ["EU AI Act"],
            "",
        )
        self.assertIn("# Test MCP", readme)
        self.assertIn("pip install test-mcp", readme)
        self.assertIn("EU AI Act", readme)
        self.assertIn("MIT", readme)


if __name__ == "__main__":
    unittest.main()
