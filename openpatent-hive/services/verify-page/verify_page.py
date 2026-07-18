#!/usr/bin/env python3
"""
OpenPatent.ai Verify Page Renderer
===================================

Public endpoint for verify.openpatent.ai/{hash16} — renders a human-readable
attestation page for any disclosure, with all 6 cryptographic proofs
verified and displayed.

Serves both:
  - HTML for browsers (Jinja2 template)
  - JSON for API clients (/api/{hash16}.json)

This is the "trust" surface — the page a patent examiner, opposing counsel,
or journalist hits to independently verify a disclosure.

Route order matters: specific paths (/, /health, /api/...) are declared
BEFORE the catch-all /{hash16} so the catch-all doesn't shadow them.
"""
import re
import os
import json
from pathlib import Path

import httpx
from fastapi import FastAPI, Request
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.templating import Jinja2Templates

PATENTMCP_URL = os.environ.get("PATENTMCP_URL", "http://patentmcp:3210")
# Template dir: env override, or repo-relative, or container default
TEMPLATE_DIR = os.environ.get(
    "VERIFY_TEMPLATE_DIR",
    str(Path(__file__).parent / "templates"),
)
# Fall back to the container path if neither env nor local path has templates
if not Path(TEMPLATE_DIR).is_dir():
    TEMPLATE_DIR = "/opt/openpatent-verify/templates"

app = FastAPI(title="OpenPatent.ai Verify", version="1.0.0")
templates = Jinja2Templates(directory=TEMPLATE_DIR)

# Hash prefixes are hex (0-9a-f). Restrict the catch-all so it doesn't
# steal /health, /api/, /static/, etc.
HASH_RE = re.compile(r"^[0-9a-fA-F]{8,128}$")


# ── Specific paths (declared FIRST so they aren't shadowed by /{hash16}) ──

@app.get("/", response_class=HTMLResponse)
async def index(request: Request):
    return templates.TemplateResponse(
        request,
        "index.html",
        {
            "site_name": "verify.openpatent.ai",
            "tagline": "Independent cryptographic verification of any OpenPatent.ai disclosure.",
        },
    )


@app.get("/health")
async def health():
    return {"status": "OK", "service": "verify-page"}


@app.get("/api/{hash16}.json")
async def verify_api(hash16: str):
    """JSON endpoint — same data, no HTML."""
    if not HASH_RE.match(hash16):
        return JSONResponse({"status": "BAD_REQUEST", "hash": hash16}, status_code=400)
    async with httpx.AsyncClient(timeout=10) as client:
        try:
            r = await client.get(f"{PATENTMCP_URL}/registry?limit=50")
            registry = r.json() if r.status_code == 200 else {"entries": []}
        except Exception:
            registry = {"entries": []}
    entries = registry.get("entries", [])
    match = next(
        (e for e in entries if str(e.get("document_hash", "")).startswith(hash16)),
        None,
    )
    if not match:
        return JSONResponse({"status": "NOT_FOUND", "hash": hash16}, status_code=404)
    return match


# ── Catch-all (declared LAST so specific routes take priority) ───────────

@app.get("/{hash16}", response_class=HTMLResponse)
async def verify_page(request: Request, hash16: str):
    """Render the verification page for a disclosure hash prefix."""
    if not HASH_RE.match(hash16):
        return templates.TemplateResponse(
            request,
            "not_found.html",
            {"hash16": hash16[:32]},
        )

    # Look up the disclosure via patentmcp (empty query = all entries)
    async with httpx.AsyncClient(timeout=10) as client:
        try:
            r = await client.get(f"{PATENTMCP_URL}/registry?limit=50")
            registry = r.json() if r.status_code == 200 else {"entries": []}
        except Exception:
            registry = {"entries": []}

    entries = registry.get("entries", [])
    match = next(
        (e for e in entries if str(e.get("document_hash", "")).startswith(hash16)),
        None,
    )

    if not match:
        return templates.TemplateResponse(
            request,
            "not_found.html",
            {"hash16": hash16},
        )

    # Run the 6-layer verification
    async with httpx.AsyncClient(timeout=10) as client:
        try:
            v = await client.post(
                f"{PATENTMCP_URL}/verify",
                json={"disclosure_json": json.dumps(match)},
            )
            verification = v.json() if v.status_code == 200 else {}
        except Exception:
            verification = {}

    return templates.TemplateResponse(
        request,
        "verify.html",
        {
            "disclosure": match,
            "verification": verification,
            "site_name": "verify.openpatent.ai",
        },
    )


# ── Prometheus metrics ──────────────────────────────────────────────────────
import sys as _metrics_sys
_metrics_sys.path.insert(0, "/opt/_shared")
try:
    from metrics import instrument
    instrument(app, service_name="verify-page", version="1.0.0", hive="openpatent")
except ImportError:
    pass  # metrics are optional; service still works without them

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=3213, log_level="info")



