# Security Policy

## Reporting a Vulnerability
Email **security@meok.ai** with details (affected tool, reproduction, impact).
We acknowledge within 48 hours and aim to patch verified issues within 7 days.
Please do **not** open public issues for security-sensitive reports.

## Supported Versions
The latest version published on PyPI (`optical-care-home-bridge-mcp`) is supported.

## Design
This MCP server is read-only / stateless by default and ships no secrets. Each
tool documents its side effects, authentication, rate limits and data handling
in its docstring. Builds are gate-verified (clean install + import) before release.
