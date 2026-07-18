#!/usr/bin/env python3
"""Health check for the patentmcp service. Used by Docker HEALTHCHECK + cron."""
import sys
import urllib.request
import json

try:
    with urllib.request.urlopen("http://localhost:3210/health", timeout=3) as r:
        data = json.loads(r.read())
        if data.get("status") == "OK" and data.get("chain_integrity"):
            sys.exit(0)
except Exception as e:
    print(f"health check failed: {e}", file=sys.stderr)
    sys.exit(1)
