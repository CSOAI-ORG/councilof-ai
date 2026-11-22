#!/usr/bin/env python3
"""Tests for /workspace/ci/indexnow-changed.py's visible-text fingerprint (2026-09-28).
Fixtures are real prerendered bytes of the same URL from two consecutive deploys (57dfceff = ec13a977a at 01:58Z,
44340409 = d06d09837 at 03:27Z). They differ only in build-time /api/momentum reads, so they must fingerprint equal;
a real edit to the page's own text must not. Run: /root/venv/bin/python3 /workspace/ci/tests/test_indexnow_changed.py"""
import hashlib, importlib.util, os
HERE = os.path.dirname(os.path.abspath(__file__))
SCRIPT = os.environ.get("INDEXNOW_SCRIPT", os.path.join(HERE, "..", "indexnow-changed.py"))
spec = importlib.util.spec_from_file_location("inx", SCRIPT); inx = importlib.util.module_from_spec(spec); spec.loader.exec_module(inx)
fp = lambda b: hashlib.sha256(inx.visible(b).encode()).hexdigest()
fx = lambda n: open(os.path.join(HERE, "fixtures", n), "rb").read()

def test_volatile_only_renders_fingerprint_equal():
    for page in ("academy", "tools"):
        a, b = fx(f"{page}.57dfceff.html"), fx(f"{page}.44340409.html")
        assert a != b, page  # the raw bytes really do differ (76 vs 73 corrections, 01:39 vs 03:21 UTC, ...)
        assert fp(a) == fp(b), page

def test_real_content_edit_changes_fingerprint():
    b = fx("academy.44340409.html")
    assert b"Academy" in b
    edited = b.replace(b"Academy", b"Akademie", 1)
    assert fp(edited) != fp(b)
    # an edit to static text that sits next to the stripped figures still counts (only the figures are stripped)
    t = fx("tools.44340409.html")
    assert b"The tools, and how far they travel" in t
    assert fp(t.replace(b"The tools, and how far they travel", b"The tools, and how far they go")) != fp(t)

def test_relative_ages_and_iso_stamps_ignored_but_numbers_elsewhere_count():
    a = b"<main><p>census measured 116.5 h ago</p><p>Last passed 599.2 hours ago</p><p>at 2026-09-28T01:39:00Z</p></main>"
    b = b"<main><p>census measured 118.0 h ago</p><p>Last passed 600.6 hours ago</p><p>at 2026-09-28T03:21:00Z</p></main>"
    assert fp(a) == fp(b)
    assert fp(b"<main><p>73 corrections</p></main>") != fp(b"<main><p>76 corrections</p></main>")

if __name__ == "__main__":
    n = 0
    for k, f in list(globals().items()):
        if k.startswith("test_"): f(); n += 1; print("ok", k)
    print(f"{n} passed")
