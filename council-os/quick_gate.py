"""Quick front-end gate — 8 assertions against the live councilof.ai."""
from playwright.sync_api import sync_playwright
import urllib.request, urllib.error, json

UA = {"User-Agent": "Mozilla/5.0 (X11; Linux x86_64) CouncilGate/1.0"}
results = []

def check(name, fn):
    try:
        fn()
        results.append((name, "PASS"))
    except Exception as e:
        results.append((name, f"FAIL: {e}"))

def t1_homepage_h1():
    p.goto("https://councilof.ai")
    h1 = p.inner_text("h1")
    assert "measure" in h1.lower(), h1[:80]

def t2_homepage_stats():
    p.goto("https://councilof.ai")
    p.wait_for_selector("text=statutory provisions", timeout=10000)
    body = p.inner_text("body")
    assert "13" in body and "statutory provisions" in body, body[:200]

def t3_scoreboard():
    p.goto("https://councilof.ai/gspc-scoreboard")
    assert "Scoreboard" in p.title(), p.title()
    body = p.inner_text("body")
    assert "MEASURED" in body.upper() or "Wilson" in body

def t4_api_health():
    req = urllib.request.Request("https://councilof.ai/api/health", headers=UA)
    r = json.loads(urllib.request.urlopen(req, timeout=10).read())
    assert r.get("status") == "ok", r

def t5_api_404():
    try:
        req = urllib.request.Request("https://councilof.ai/api/nope", headers=UA)
        urllib.request.urlopen(req, timeout=10)
        raise AssertionError("expected 404")
    except urllib.error.HTTPError as e:
        assert e.code == 404, e.code

def t6_remediation():
    p.goto("https://councilof.ai/remediation-partners")
    body = p.inner_text("body")
    assert "measure" in body.lower(), "page text missing"

def t7_arena():
    p.goto("https://councilof.ai/sov-space/?view=arena")
    body = p.inner_text("body")
    assert "MEASURED" in body.upper() or "arena" in body.lower()

def t8_verify():
    p.goto("https://councilof.ai/gspc-verify")
    body = p.inner_text("body")
    assert "verify" in body.lower(), "verify page missing content"

with sync_playwright() as pw:
    b = pw.chromium.launch()
    p = b.new_page()
    check("Homepage H1", t1_homepage_h1)
    check("Homepage stat bar", t2_homepage_stats)
    check("Scoreboard renders", t3_scoreboard)
    check("/api/health JSON", t4_api_health)
    check("/api/nope 404", t5_api_404)
    check("Remediation page", t6_remediation)
    check("Arena renders", t7_arena)
    check("Verify page", t8_verify)
    b.close()

passed = sum(1 for _, s in results if s == "PASS")
print(f"===== GATE: {passed}/{len(results)} =====")
for n, s in results:
    print(f"  [{'PASS' if s=='PASS' else 'FAIL'}] {n}" + (f" — {s}" if s != "PASS" else ""))
