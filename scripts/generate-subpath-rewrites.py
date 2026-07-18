#!/usr/bin/env python3
"""DEPRECATED — use mass-redeploy-meok-subpaths.py instead.

This script used to append rewrites based on the health-check report and default
*-deploy.vercel.app URLs. Those defaults often mismatch the actual Vercel alias,
so the canonical redeploy/rewrite flow is now handled by
clawd/scripts/mass-redeploy-meok-subpaths.py, which captures the real alias from
each `vercel --prod` run.
"""
import sys
from pathlib import Path

if __name__ == "__main__":
    print("generate-subpath-rewrites.py is deprecated.")
    print("Run: python3 clawd/scripts/mass-redeploy-meok-subpaths.py")
    sys.exit(0)
