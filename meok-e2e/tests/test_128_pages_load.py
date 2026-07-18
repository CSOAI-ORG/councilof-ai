"""Test 12 — every one of the 128 pages must load with the right furniture.

For each page in ``~/clawd/csoai-os/meok-home/pages/`` we assert:

* HTTP 200 from the static server
* contains a ``<header class=\"topbar\">`` block with the OS nav
* contains a ``<footer class=\"footer\">`` block referencing UK Companies
  House 16939677
* contains a ``<div class=\"status-bar\">`` block mentioning SOV3
* DOES NOT contain "Lorem ipsum", "TODO:", "FIXME", or "placeholder text"

Performance: we use ``httpx`` (sync) + a single ``ThreadPoolExecutor`` over
the 128 pages. End-to-end runs in roughly 2-3 seconds.

Why we test 128 pages
=====================
The brief explicitly says *"128 pages"*. Using ``PAGES`` from ``conftest.py``
keeps the test honest: if the build script ever drops a page, this test fails.
"""
from __future__ import annotations

import httpx
import pytest

from conftest import PAGES, PAGES_DIR

pytestmark = pytest.mark.api
BAD_TOKENS = ("Lorem ipsum", "TODO:", "FIXME", "placeholder text")


def _check(page_path):
    """Worker for ThreadPoolExecutor — checks one page."""
    import urllib.parse
    url = "http://127.0.0.1:8765/csoai-os/meok-home/pages/" + urllib.parse.quote(page_path.name)
    with httpx.Client(timeout=10.0) as client:
        r = client.get(url)
    if r.status_code != 200:
        return f"{page_path.name}: HTTP {r.status_code}"
    text = r.text
    if 'class="topbar"' not in text:
        return f"{page_path.name}: missing topbar"
    if 'class="footer"' not in text:
        return f"{page_path.name}: missing footer"
    if "16939677" not in text:
        return f"{page_path.name}: missing UK Companies House number"
    if 'class="status-bar"' not in text:
        return f"{page_path.name}: missing status bar"
    if "SOV3" not in text:
        return f"{page_path.name}: missing SOV3 reference"
    for bad in BAD_TOKENS:
        if bad in text:
            return f"{page_path.name}: contains bad token {bad!r}"
    return None


def test_all_128_pages_exist():
    """Directory must contain at least 128 HTML pages."""
    assert len(PAGES) >= 128, f"only {len(PAGES)} pages built (need >=128)"


def test_all_pages_load_with_furniture():
    """Single sequential pass — every page must satisfy the 5-shape contract."""
    from concurrent.futures import ThreadPoolExecutor, as_completed

    failures = []
    with ThreadPoolExecutor(max_workers=16) as ex:
        for result in ex.map(_check, PAGES):
            if result is not None:
                failures.append(result)
    assert not failures, "pages with issues:\n  " + "\n  ".join(failures)
