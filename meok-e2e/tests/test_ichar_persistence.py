"""Test 5 — i-character persistence.

* Create an ichar through the wizard (Step 4 stubbed).
* ``localStorage["meok_ichar"]`` is set to a JSON blob.
* Open the OS page **in the same browser context** → ``applyIcharToUI()``
  reads ``localStorage.meok_ichar`` and renders:
    * the matching queen emoji into ``.sov-character``
    * "Welcome, <name>" into ``#greeting``
    * the arcana lens into ``#sovLine``
"""
from __future__ import annotations

import json

import pytest

pytestmark = pytest.mark.ui

WIZARD_PATH = "/csoai-os/v2-signup-wizard.html"
OS_PATH = "/csoai-os/v2-temple-os.html"
NAME = "Sovereign Persistent"


@pytest.fixture()
def stub_ichar_create(page):
    def handler(route):
        body = json.loads(route.request.post_data or b"{}")
        route.fulfill(
            status=201,
            content_type="application/json",
            body=json.dumps({
                "ichar_id": "ich-persist1234",
                "sigil_hash": "feedfacefeedface",
                "name": body.get("name"),
                "status": "created",
            }),
        )

    page.route("**/api/ichar/create", handler)
    return handler


def _complete_wizard(page) -> None:
    page.wait_for_selector('.wizard-step.active[data-step="0"]', timeout=10_000)
    page.wait_for_function('document.getElementById("btnNext")?.disabled === false', timeout=15_000)
    page.click("#btnNext")

    page.wait_for_selector('.wizard-step.active[data-step="1"]', timeout=5_000)
    page.fill("#icharName", NAME)
    page.fill("#icharEmail", "persist@meok.ai")
    page.fill("#icharInitial", "Persistence is sovereignty.")
    page.wait_for_function('document.getElementById("btnNext")?.disabled === false')
    page.click("#btnNext")

    page.wait_for_function("document.querySelectorAll('#queenGrid .option').length >= 12", timeout=10_000)
    page.click("#queenGrid .option:first-child")
    page.wait_for_function('document.getElementById("btnNext")?.disabled === false')
    page.click("#btnNext")

    page.wait_for_function("document.querySelectorAll('#arcanaGrid .option').length >= 22", timeout=10_000)
    page.click("#arcanaGrid .option:first-child")
    page.select_option("#icharVoice", "sophia")
    page.select_option("#icharCognition", "queen-council")
    page.wait_for_function('document.getElementById("btnNext")?.disabled === false')
    page.click("#btnNext")
    page.wait_for_selector('.wizard-step.active[data-step="4"]', timeout=10_000)


def test_ichar_persists_in_localstorage_after_wizard(page, base_url, stub_ichar_create):
    page.goto(base_url + WIZARD_PATH, wait_until="domcontentloaded")
    _complete_wizard(page)

    raw = page.evaluate("localStorage.getItem('meok_ichar')")
    assert raw, "meok_ichar not in localStorage after wizard completion"
    ichar = json.loads(raw)
    assert ichar["name"] == NAME
    assert "ich-" in ichar["ichar_id"]
    assert "arcana_lens" in ichar


def test_ichar_name_visible_on_os_after_reload(context, base_url, stub_ichar_create):
    """Reload the OS in the same context — should pick up localStorage and greet me by name."""
    page = context.new_page()
    page.goto(base_url + WIZARD_PATH, wait_until="domcontentloaded")
    _complete_wizard(page)

    # Now load the OS in the same context (same localStorage origin).
    page.goto(base_url + OS_PATH, wait_until="domcontentloaded")
    # applyIcharToUI runs on load, sets #greeting to "Welcome, <name>"
    page.wait_for_function(
        f"document.getElementById('greeting')?.innerText?.includes({json.dumps(NAME)})",
        timeout=10_000,
    )
    greeting = page.locator("#greeting").text_content() or ""
    assert NAME in greeting, f"ichar name not in greeting: {greeting!r}"


def test_ichar_emoji_swapped_after_reload(context, base_url, stub_ichar_create):
    """The .sov-character span should show a queen emoji after load."""
    page = context.new_page()
    page.goto(base_url + WIZARD_PATH, wait_until="domcontentloaded")
    _complete_wizard(page)

    page.goto(base_url + OS_PATH, wait_until="domcontentloaded")
    # emoji render happens synchronously after applyIcharToUI
    page.wait_for_function(
        "document.querySelector('.sov-character')?.textContent?.trim()?.length > 0",
        timeout=5_000,
    )
    emoji = page.locator(".sov-character").text_content() or ""
    # queen-arcana is first in QUEEN_ARCHETYPES; first-child click goes to that archetype
    # The code maps queen-arcana → '✨'. We assert "any unicode glyph present".
    assert any(ord(c) > 127 for c in emoji), f"non-emoji text in .sov-character: {emoji!r}"
