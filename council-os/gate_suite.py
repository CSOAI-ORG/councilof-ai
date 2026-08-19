"""Council of AI Front-End Gate Suite — Move 1 skeleton.
Asserts CONTENT, never 200+size per the sentinel doctrine.
Each test targets an invariant from the Estate Audit (Part EJ/EL).
Run: python3 gate_suite.py
"""
from playwright.sync_api import sync_playwright

SCOREBOARD = 'https://csoai-site.pages.dev/gspc-scoreboard'
APEX = 'https://csoai-site.pages.dev/'

AXIS_NAMES = [
    'governance', 'safety', 'provenance', 'continuity', 'conformance',
    'openness', 'machinery-conformity', 'care', 'cross-reality',
    'detector-interop', 'art5-safeguard', 'swarm', 'affect',
]
CERTIFICATION_FORBIDDEN = ['certification', 'certified', 'certify']


def test_scoreboard_has_all_13_axes(page):
    """EL-3: every axis visible."""
    page.goto(SCOREBOARD)
    page.wait_for_selector('tbody tr')
    text = page.inner_text('body')
    missing = [a for a in AXIS_NAMES if a not in text]
    assert not missing, f'Axes missing from scoreboard: {missing}'


def test_scoreboard_has_measured_cells(page):
    """EL-5: MEASURED cells must exist."""
    page.goto(SCOREBOARD)
    page.wait_for_selector('tbody tr')
    text = page.inner_text('tbody')
    count = text.count('n=')
    assert count >= 200, f'Expected 200+ data cells, got {count}'


def test_scoreboard_no_certification_language(page):
    """EL-7: no certification claim on measurement surface."""
    page.goto(SCOREBOARD)
    page.wait_for_selector('body')
    text = page.inner_text('body').lower()
    for word in CERTIFICATION_FORBIDDEN:
        assert word not in text, f'Scoreboard uses forbidden word: {word}'


def test_scoreboard_measurement_disclaimer(page):
    """EL-AA: scoreboard carries the honest line."""
    page.goto(SCOREBOARD)
    page.wait_for_selector('.foot')
    text = page.inner_text('.foot')
    assert 'measurement, not' in text, 'Missing measurement-not-certification footer'


def test_scoreboard_has_outbound_links(page):
    """L2 fix: scoreboard must have link spine."""
    page.goto(SCOREBOARD)
    page.wait_for_selector('.foot')
    hrefs = page.eval_on_selector_all('.foot a', 'els => els.map(e => e.href)')
    assert len(hrefs) >= 4, f'Expected 4+ outbound links, got {len(hrefs)}'


def test_apex_hsts_header(page):
    """L1 post-deploy: HSTS header present."""
    resp = page.request.get(APEX)
    hsts = resp.headers.get('strict-transport-security', '')
    assert 'max-age=' in hsts, f'No HSTS header on apex'


def test_apex_no_certification_language(page):
    """EL-7 on apex."""
    page.goto(APEX)
    text = page.inner_text('body').lower()
    for word in CERTIFICATION_FORBIDDEN:
        assert word not in text, f'Apex uses forbidden word: {word}'


def test_apex_has_og_tags(page):
    """L7 fix: OG tags on apex."""
    page.goto(APEX)
    og = page.eval_on_selector_all('meta[property^="og:"]', 'els => els.length')
    assert og >= 4, f'Expected 4+ OG tags, got {og}'


def test_arena_rounds_serve_json(page):
    """EL-AC: arena rounds endpoint returns real data."""
    resp = page.request.get('https://csoai-site.pages.dev/api/sov-arena/rounds.jsonl')
    assert resp.status == 200
    body = resp.text()
    assert 'snapshot' in body or 'clan' in body or 'round' in body, \
        f'Arena endpoint returned unexpected content: {body[:120]}'


def test_jspace_serves_events(page):
    """J-Space events.json loads."""
    resp = page.request.get('https://councilof.ai/j-space/events.json')
    assert resp.status == 200
    body = resp.text()
    assert 'jspace_version' in body, f'J-Space unexpected: {body[:120]}'


ALL_TESTS = [
    ('Scoreboard has all 13 axes', test_scoreboard_has_all_13_axes),
    ('Scoreboard has MEASURED cells', test_scoreboard_has_measured_cells),
    ('Scoreboard no certification', test_scoreboard_no_certification_language),
    ('Scoreboard measurement disclaimer', test_scoreboard_measurement_disclaimer),
    ('Scoreboard link spine (L2)', test_scoreboard_has_outbound_links),
    ('Apex HSTS header (L1)', test_apex_hsts_header),
    ('Apex no certification', test_apex_no_certification_language),
    ('Apex OG tags (L7)', test_apex_has_og_tags),
    ('Arena rounds serve JSON', test_arena_rounds_serve_json),
    ('J-Space serves events', test_jspace_serves_events),
]

if __name__ == '__main__':
    results = []
    with sync_playwright() as pw:
        browser = pw.chromium.launch(headless=True)
        page = browser.new_page()
        for label, fn in ALL_TESTS:
            try:
                fn(page)
                results.append((label, 'PASS'))
            except Exception as e:
                results.append((label, f'FAIL: {e}'))
        browser.close()

    passed = sum(1 for _, s in results if s == 'PASS')
    total = len(results)
    print(f'\n===== GATE SUITE: {passed}/{total} =====')
    for label, status in results:
        mark = 'PASS' if status == 'PASS' else 'FAIL'
        print(f'  [{mark}] {label}')
        if status != 'PASS':
            print(f'         {status}')
    print(f'\n===== GATE: {"PASS" if passed == total else "FAIL"} ({passed}/{total}) =====')
