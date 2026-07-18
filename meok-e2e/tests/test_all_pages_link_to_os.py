"""Test 13 — every page must link back to the OS.

Contract: from every page in ``meok-home/pages/`` the user must be able to
get into the OS within one click. We look for either:

* the canonical topbar link ``/csoai-os/v2-temple-os.html`` (or ``v2-temple-os.html`` relative)
* the wizard link ``/csoai-os/v2-signup-wizard.html``
* a footer/cta link containing "OS" or "Sovereign"
"""
from __future__ import annotations

import urllib.parse

import httpx
import pytest

from conftest import PAGES

pytestmark = pytest.mark.api

OS_LINK_FRAGMENTS = (
    "v2-temple-os.html",
    "/csoai-os/v2-signup-wizard.html",
    "MEOK OS",
    "Sovereign OS",
    "Open the OS",
)


def _check(page_path):
    url = "http://127.0.0.1:8765/csoai-os/meok-home/pages/" + urllib.parse.quote(page_path.name)
    with httpx.Client(timeout=10.0) as client:
        r = client.get(url)
    if r.status_code != 200:
        return [f"{page_path.name}: HTTP {r.status_code}"]
    text = r.text
    if not any(frag in text for frag in OS_LINK_FRAGMENTS):
        return [f"{page_path.name}: no OS-link fragment present"]
    return []


def test_all_pages_link_to_os():
    from concurrent.futures import ThreadPoolExecutor

    failures = []
    with ThreadPoolExecutor(max_workers=16) as ex:
        for result in ex.map(_check, PAGES):
            failures.extend(result)
    assert not failures, "pages without OS links:\n  " + "\n  ".join(failures)
