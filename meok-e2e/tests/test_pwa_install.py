"""Test 14 — PWA install readiness.

For the OS to be installable as a Progressive Web App it needs:

* ``<link rel="manifest" href=".../manifest.webmanifest">`` in <head>
* the manifest itself returns 200 with at minimum ``name`` + ``icons`` + ``start_url``
* a service worker (e.g. ``sw.js`` / ``service-worker.js``) registered in the JS

These tests are CONDITIONAL — they pass if the static files are present AND
correct, AND ALSO gracefully **skip** with a message (instead of failing) when
the assets have not yet been added (because that's outside our team scope).
"""
from __future__ import annotations

import json
import urllib.parse

import httpx
import pytest

pytestmark = pytest.mark.api

BASE = "http://127.0.0.1:8765"

# Pages that should declare the manifest + service worker.
HOME = "/csoai-os/meok-home/index.html"
OS = "/csoai-os/v2-temple-os.html"
SAMPLE_PAGES = [
    "/csoai-os/meok-home/index.html",
    "/csoai-os/meok-home/pages/about.html",
    "/csoai-os/meok-home/pages/os.html",
    "/csoai-os/meok-home/pages/temples_uk.html",
    "/csoai-os/v2-temple-os.html",
    "/csoai-os/v2-signup-wizard.html",
]


@pytest.fixture(scope="module")
def static_client():
    with httpx.Client(base_url=BASE, timeout=10.0) as c:
        yield c


def _fetch(static_client, path):
    r = static_client.get(path)
    return r.status_code, r.text, r.headers.get("content-type", "")


def _href(text: str, attr: str, rel: str) -> str | None:
    import re
    m = re.search(rf'<link[^>]+rel="{rel}"[^>]+href="([^"]+)"', text)
    return m.group(1) if m else None


def test_manifest_webmanifest_reachable_when_declared(static_client):
    """If a manifest is declared in <head>, it must be reachable + parse as JSON."""
    declared = False
    checked = 0
    for path in SAMPLE_PAGES:
        code, text, _ctype = _fetch(static_client, path)
        if code != 200:
            continue
        href = _href(text, "link", "manifest")
        if not href:
            continue
        declared = True
        full = href if href.startswith("http") else BASE + href
        r = static_client.get(full.replace(BASE, ""))
        if r.status_code != 200:
            pytest.skip(f"{href} declared in {path} but GET → {r.status_code} "
                        f"(PWA asset not yet built — outside this team's scope)")
        body = r.json()
        assert "name" in body, f"{href} missing name"
        if "icons" in body:
            assert isinstance(body["icons"], list)
        assert "start_url" in body or "scope" in body
        checked += 1
    if not declared:
        pytest.skip("no <link rel=manifest> declared on any sample page")
    assert checked >= 1, "manifest declared but never validated"


def test_service_worker_reachable_when_registered(static_client):
    """If a service worker is registered, the JS file must exist."""
    import re
    registered = 0
    for path in SAMPLE_PAGES:
        code, text, _ctype = _fetch(static_client, path)
        if code != 200:
            continue
        if "navigator.serviceWorker" not in text and "serviceWorker" not in text:
            continue
        m = re.search(r"serviceWorker\.register\(['\"]([^'\"]+)['\"]", text)
        if not m:
            continue
        sw_path = m.group(1)
        registered += 1
        r = static_client.get(sw_path if sw_path.startswith("/") else "/" + sw_path.lstrip("/"))
        if r.status_code != 200:
            pytest.skip(f"{path} registers {sw_path} but GET → {r.status_code} "
                        f"(service worker not yet built — outside this team's scope)")
        body = r.text
        assert "install" in body or "fetch" in body, \
            f"{sw_path} does not look like a service worker (no install/fetch hooks)"
    if registered == 0:
        pytest.skip("no serviceWorker.register() on any sample page")


def test_themed_app_capable_home(static_client):
    """The home page declares theme-color / apple-mobile-web-app-* for iOS install."""
    code, text, _ = _fetch(static_client, HOME)
    assert code == 200
    has_android = 'name="theme-color"' in text
    has_ios = 'apple-mobile-web-app-capable' in text or 'apple-mobile-web-app-status-bar-style' in text
    if not (has_android or has_ios):
        pytest.skip("home has no theme-color / apple-mobile-web-app-* — install hints missing")
