"""Test 1 — signup flow: walk the 5-step wizard, verify i-character is created.

Flow under test
================
1. GET /csoai-os/v2-signup-wizard.html
2. STEP 0 → region is auto-detected on load → click **Next**
3. STEP 1 → fill ``icharName``, ``icharEmail``, ``icharInitial`` → click **Next**
4. STEP 2 → pick a queen archetype → click **Next**
5. STEP 3 → pick an arcana lens + voice + cognition → click **Next**
   (this triggers ``createIchar()`` which POSTs and persists to ``localStorage``)
6. STEP 4 → verify ``#icharCard`` shows the ichar's name + sigil

What proves "ichar is created"
==============================
* The ``#cardName`` element has the entered name.
* The ``#cardSigil`` element contains a ``sigil:`` prefix + an ``ich-`` ID.
* ``localStorage.getItem("meok_ichar")`` parses as JSON and roundtrips the
  full ichar object (id, name, queen_model, archetype, arcana_lens, sigil_hash).

Why ``page.route`` instead of monkey-patching
=============================================
We don't mock the backend — ``createIchar()`` makes a real ``POST
/api/ichar/create`` request which we serve from a local fixture so the suite
works whether or not the FastAPI agent has booted by go-live.
"""
from __future__ import annotations

import json

import pytest

pytestmark = pytest.mark.ui

WIZARD_PATH = "/csoai-os/v2-signup-wizard.html"
ICHAR_NAME = "Sovereign Tester"
ICHAR_EMAIL = "tester@meok.ai"
ICHAR_INITIAL = "I have heard the 12. The 13th is coming."


@pytest.fixture()
def stub_ichar_create(page):
    """Intercept POST /api/ichar/create before navigating to the wizard."""
    captured = {}

    def handler(route):
        body = json.loads(route.request.post_data or b"{}")
        captured["body"] = body
        captured["sigil"] = "abcdef1234567890"
        route.fulfill(
            status=201,
            content_type="application/json",
            body=json.dumps({
                "ichar_id": "ich-stub1234abcd",
                "sigil_hash": captured["sigil"],
                "status": "created",
            }),
        )

    page.route("**/api/ichar/create", handler)
    return captured


def _wizard_step(page, n: int) -> None:
    page.wait_for_function(f"document.querySelectorAll('.wizard-step.active')?.length && Array.from(document.querySelectorAll('.wizard-step')).findIndex(e => e.classList.contains('active')) === {n}", timeout=10_000)


def test_signup_wizard_step_0_region(page, base_url):
    """Step 0: region auto-detects, Next becomes enabled."""
    page.goto(base_url + WIZARD_PATH, wait_until="domcontentloaded")
    page.wait_for_selector('.wizard-step.active[data-step="0"]', timeout=10_000)
    # regionMeta gets populated asynchronously by detectRegion() — give it time
    page.wait_for_function(
        "document.getElementById('regionMeta')?.textContent?.length > 4",
        timeout=15_000,
    )
    meta = page.locator("#regionMeta").text_content() or ""
    assert "x=" in meta and "y=" in meta, f"region meta malformed: {meta!r}"

    # Next button must be enabled after region detection
    page.wait_for_function('document.getElementById("btnNext")?.disabled === false', timeout=5_000)
    page.click("#btnNext")


def test_signup_wizard_step_1_identity(page, base_url):
    """Step 1: name + email + initial message fill out the form."""
    page.goto(base_url + WIZARD_PATH, wait_until="domcontentloaded")
    page.wait_for_function(
        "Array.from(document.querySelectorAll('.wizard-step')).findIndex(e => e.classList.contains('active')) === 1",
        timeout=10_000,
    )
    page.fill("#icharName", ICHAR_NAME)
    page.fill("#icharEmail", ICHAR_EMAIL)
    page.fill("#icharInitial", ICHAR_INITIAL)
    assert page.locator("#icharName").input_value() == ICHAR_NAME
    assert page.locator("#icharEmail").input_value() == ICHAR_EMAIL
    # btnNext becomes enabled after required fields are filled
    page.wait_for_function('document.getElementById("btnNext")?.disabled === false', timeout=5_000)
    page.click("#btnNext")


def test_signup_wizard_step_2_queen(page, base_url):
    """Step 2: select a queen archetype."""
    page.goto(base_url + WIZARD_PATH, wait_until="domcontentloaded")
    page.wait_for_function(
        "document.querySelectorAll('#queenGrid .option').length >= 12",
        timeout=10_000,
    )
    # click the first queen in the grid
    page.click("#queenGrid .option:first-child")
    assert page.locator("#queenGrid .option.selected").count() == 1
    page.wait_for_function('document.getElementById("btnNext")?.disabled === false', timeout=5_000)
    page.click("#btnNext")


def test_signup_wizard_step_3_arcana(page, base_url):
    """Step 3: pick an arcana lens + voice + cognition."""
    page.goto(base_url + WIZARD_PATH, wait_until="domcontentloaded")
    page.wait_for_function(
        "document.querySelectorAll('#arcanaGrid .option').length >= 22",
        timeout=10_000,
    )
    page.click("#arcanaGrid .option:first-child")
    page.select_option("#icharVoice", "sophia")
    page.select_option("#icharCognition", "queen-council")
    page.wait_for_function('document.getElementById("btnNext")?.disabled === false', timeout=5_000)
    page.click("#btnNext")


def test_signup_full_flow_creates_ichar(page, base_url, stub_ichar_create):
    """End-to-end: walking all 5 steps MUST create an ichar and persist it."""
    page.goto(base_url + WIZARD_PATH, wait_until="domcontentloaded")
    page.wait_for_selector('.wizard-step.active[data-step="0"]', timeout=10_000)
    page.wait_for_function('document.getElementById("btnNext")?.disabled === false', timeout=15_000)
    page.click("#btnNext")

    # Step 1
    page.wait_for_selector('.wizard-step.active[data-step="1"]', timeout=5_000)
    page.fill("#icharName", ICHAR_NAME)
    page.fill("#icharEmail", ICHAR_EMAIL)
    page.fill("#icharInitial", ICHAR_INITIAL)
    page.wait_for_function('document.getElementById("btnNext")?.disabled === false')
    page.click("#btnNext")

    # Step 2
    page.wait_for_function("document.querySelectorAll('#queenGrid .option').length >= 12", timeout=10_000)
    page.click("#queenGrid .option:first-child")
    page.wait_for_function('document.getElementById("btnNext")?.disabled === false')
    page.click("#btnNext")

    # Step 3
    page.wait_for_function("document.querySelectorAll('#arcanaGrid .option').length >= 22", timeout=10_000)
    page.click("#arcanaGrid .option:first-child")
    page.select_option("#icharVoice", "sophia")
    page.select_option("#icharCognition", "queen-council")
    page.wait_for_function('document.getElementById("btnNext")?.disabled === false')
    page.click("#btnNext")

    # Step 4 — confirmation card
    page.wait_for_selector('.wizard-step.active[data-step="4"]', timeout=10_000)
    page.wait_for_function(
        "document.getElementById('cardName')?.textContent && document.getElementById('cardName').textContent.length > 1",
        timeout=5_000,
    )
    card_name = page.locator("#cardName").text_content() or ""
    card_sigil = page.locator("#cardSigil").text_content() or ""

    assert card_name == ICHAR_NAME, f"card shows {card_name!r}, expected {ICHAR_NAME!r}"
    assert "sigil:" in card_sigil and "ich-" in card_sigil, f"sigil malformed: {card_sigil!r}"

    # localStorage must contain the persisted ichar
    ichar_json = page.evaluate("localStorage.getItem('meok_ichar')")
    assert ichar_json, "meok_ichar was not written to localStorage"
    ichar = json.loads(ichar_json)
    assert ichar["name"] == ICHAR_NAME
    assert ichar["queen_model"].startswith("queen-")
    assert "sigil_hash" in ichar
    assert "ichar_id" in ichar
    assert "arcana_lens" in ichar

    # the POST we intercepted was actually called
    assert "body" in stub_ichar_create, "POST /api/ichar/create was never made"
    body = stub_ichar_create["body"]
    assert body.get("name") == ICHAR_NAME
    assert body.get("email") == ICHAR_EMAIL
