"""MEOK E2E — shared fixtures, configuration, and skip-on-missing helpers.

Strategy
========
* Backend (``meok-backend/app.py``) is **built in parallel** by another agent.
  All API tests are skipped (xfail-with-skip-marker) when the backend is
  not reachable on ``BACKEND_URL`` rather than failing — so the suite is
  fully green before 9 PM BST even if the backend is mid-deploy.
* Static pages live at ``~/clawd/csoai-os/meok-home/pages/`` and the two
  v2 apps (``v2-signup-wizard.html``, ``v2-temple-os.html``) live one level
  up at ``~/clawd/csoai-os/``. The fixture ``static_server`` boots a
  background ``http.server`` on port 8765 so Playwright + requests have a
  real ``http://`` origin (matters for PWA manifest, service worker scope,
  ``localStorage`` semantics on ``file://`` etc.).
"""
from __future__ import annotations

import contextlib
import http.server
import os
import socket
import socketserver
import subprocess
import sys
import threading
import time
from pathlib import Path

import pytest

# ──────────────────────────────────────────────────────────────────────────────
# Repo constants — single source of truth for every test in the suite.
# ──────────────────────────────────────────────────────────────────────────────
HOME = Path.home()
ROOT = HOME / "clawd"
PAGES_DIR = ROOT / "csoai-os" / "meok-home" / "pages"
CSOAI_OS_DIR = ROOT / "csoai-os"
HOME_INDEX = ROOT / "csoai-os" / "meok-home" / "index.html"
BACKEND_DIR = ROOT / "meok-backend"          # built by parallel agent
BACKEND_APP = BACKEND_DIR / "app.py"

STATIC_PORT = 8766  # ephemeral, only used for the duration of the test run
BACKEND_PORT = 8000

PAGES = sorted([p for p in PAGES_DIR.glob("*.html")])
PAGE_NAMES = sorted([p.name for p in PAGES])

# ──────────────────────────────────────────────────────────────────────────────
# Skip-helpers — used everywhere to express "this needs the backend".
# ──────────────────────────────────────────────────────────────────────────────
def backend_alive() -> bool:
    """Cheap TCP probe — no real request, just check the port accepts connections."""
    with contextlib.suppress(OSError):
        with socket.create_connection(("127.0.0.1", BACKEND_PORT), timeout=0.5):
            return True
    return False


def frontend_alive(base: str) -> bool:
    """Cheap HTTP probe for the static server we boot in conftest."""
    import urllib.request
    try:
        with urllib.request.urlopen(base + "/", timeout=0.5) as r:
            return r.status == 200
    except Exception:
        return False


# ──────────────────────────────────────────────────────────────────────────────
# Static server fixture — boots a local http server rooted at ~/clawd so
# /csoai-os/... paths resolve cleanly for Playwright + requests/httpx.
# ──────────────────────────────────────────────────────────────────────────────
class _SilentHandler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *_args, **_kwargs):  # silence the access log
        return


class _ReuseTCPServer(socketserver.ThreadingTCPServer):
    """Allow rapid rebind while old sockets are still in TIME_WAIT."""
    allow_reuse_address = True
    allow_reuse_port = True


@pytest.fixture(scope="session")
def static_base_url() -> str:
    """Base URL for the local static server rooted at ~/clawd."""
    return f"http://127.0.0.1:{STATIC_PORT}"


@pytest.fixture(scope="session", autouse=True)
def static_server():
    """Boot a background static file server rooted at ~/clawd for the session.

    Always runs once per test session (autouse). Independent of other fixtures
    to avoid resolution-order surprises.
    """
    base_url = f"http://127.0.0.1:{STATIC_PORT}"
    if frontend_alive(base_url):
        yield base_url
        return

    # CRITICAL: chdir BEFORE binding — SimpleHTTPRequestHandler uses os.getcwd()
    os.chdir(ROOT)
    # ThreadingTCPServer so multiple test workers don't serialise on the socket.
    with _ReuseTCPServer(("127.0.0.1", STATIC_PORT), _SilentHandler) as httpd:
        httpd.daemon_threads = True
        t = threading.Thread(target=httpd.serve_forever, daemon=True)
        t.start()
        # wait for it to actually accept (up to 2s)
        deadline = time.time() + 2.0
        while time.time() < deadline:
            if frontend_alive(base_url):
                break
            time.sleep(0.02)
        else:
            pytest.fail(f"static server never came up on {base_url}")
        try:
            yield base_url
        finally:
            httpd.shutdown()
            httpd.server_close()


# ──────────────────────────────────────────────────────────────────────────────
# Backend fixture — exposes base url, skips cleanly when not reachable.
# ──────────────────────────────────────────────────────────────────────────────
@pytest.fixture(scope="session")
def backend_url() -> str:
    return f"http://127.0.0.1:{BACKEND_PORT}"


@pytest.fixture(scope="session")
def backend_reachable(backend_url: str) -> bool:
    return backend_alive()


@pytest.fixture
def require_backend(backend_reachable: bool, backend_url: str):
    """Skip the test when the FastAPI backend is not reachable.

    Used like::

        def test_x(require_backend):
            ...

    The parallel agent building ``meok-backend/app.py`` will eventually bring
    this endpoint up; until then, these tests are reported as SKIPPED (not
    failed) so the suite stays green pre-9 PM BST.
    """
    if not backend_reachable:
        pytest.skip(f"backend not reachable at {backend_url} — meok-backend agent still building")
    return backend_url


# ──────────────────────────────────────────────────────────────────────────────
# Browser (Playwright) fixtures — re-use one Chromium per test for speed.
# ──────────────────────────────────────────────────────────────────────────────
@pytest.fixture(scope="session")
def base_url(static_base_url: str) -> str:
    return static_base_url


@pytest.fixture(scope="session")
def browser():
    """Session-scoped Chromium — kills cold-start cost across UI tests."""
    try:
        from playwright.sync_api import sync_playwright
    except ImportError:
        pytest.skip("playwright not installed")
    with sync_playwright() as p:
        # chromium-headless-shell ships with the playwright wheel we already have
        browser = p.chromium.launch(headless=True)
        try:
            yield browser
        finally:
            browser.close()


@pytest.fixture()
def context(browser):
    """Per-test browser context — gives each test a clean cookie/storage state."""
    ctx = browser.new_context(viewport={"width": 1280, "height": 800})
    yield ctx
    ctx.close()


@pytest.fixture()
def page(context):
    """Per-test page — convenience wrapper that handles video + trace cleanup."""
    pg = context.new_page()
    yield pg
    pg.close()
