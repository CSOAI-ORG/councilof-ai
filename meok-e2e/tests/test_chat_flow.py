"""Test 3 — chat flow: type into #chatInput, verify the Sovereign replies.

``sendChat()`` reads ``#chatInput``, escapes it, and writes into ``#sovLine``
with the form::

    You: <user>
    Sovereign: Acknowledged. <reply>

The reply comes from ``generateSovReply(q)`` which has special handlers
for the phrases "article 12", "cascade", "region", "i-character", "cyber"
and a generic fallback. We hit the generic-fallback path so the test
doesn't depend on what was last said.
"""
from __future__ import annotations

import pytest

pytestmark = pytest.mark.ui

OS_PATH = "/csoai-os/v2-temple-os.html"
TEST_MESSAGE = "Sovereign, run a cybersecurity audit"


@pytest.fixture()
def chat_page(page, base_url):
    page.goto(base_url + OS_PATH, wait_until="domcontentloaded")
    page.wait_for_selector("#chatInput", timeout=10_000)
    return page


def test_chat_input_present(chat_page):
    """Smoke: the chat input must exist before we can type into it."""
    assert chat_page.locator("#chatInput").count() == 1


def test_chat_typing_sends_sovereign_reply(chat_page):
    """Type → press Enter → expect Sovereign to acknowledge."""
    chat_page.fill("#chatInput", TEST_MESSAGE)
    assert chat_page.locator("#chatInput").input_value() == TEST_MESSAGE

    # Fire the chat — Enter handler calls sendChat()
    chat_page.evaluate("document.getElementById('chatInput').dispatchEvent(new KeyboardEvent('keydown', {key: 'Enter'}))")
    # sendChat() reads the value then sets #sovLine — give the browser one tick
    chat_page.wait_for_function(
        "document.getElementById('sovLine')?.textContent?.includes('Sovereign')",
        timeout=5_000,
    )

    sov_text = chat_page.locator("#sovLine").text_content() or ""
    assert "Sovereign" in sov_text, f"no Sovereign reply in: {sov_text!r}"
    # our typed message must show up (escaped) somewhere in the line
    assert "cybersecurity" in sov_text or "cyber" in sov_text, f"echoed user message missing: {sov_text[:200]!r}"
    # the "cyber" handler in generateSovReply() should mention security
    assert "security" in sov_text.lower() or "audit" in sov_text.lower(), \
        f"expected a security/audit mention in reply: {sov_text[:200]!r}"

    # input must be cleared after sending
    assert chat_page.locator("#chatInput").input_value() == "", "input not cleared after send"


def test_chat_empty_input_does_not_send(chat_page):
    """Pressing Enter on an empty input must NOT add a Sovereign reply."""
    initial_text = chat_page.locator("#sovLine").text_content() or ""
    chat_page.evaluate("document.getElementById('chatInput').dispatchEvent(new KeyboardEvent('keydown', {key: 'Enter'}))")
    # Wait briefly to detect any change.
    chat_page.wait_for_timeout(200)
    after_text = chat_page.locator("#sovLine").text_content() or ""
    assert after_text == initial_text, "empty input triggered a reply"
