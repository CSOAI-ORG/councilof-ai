#!/usr/bin/env python3
"""RevLeads brand-pack retry 2. Short timeouts. No networkidle (that hung).
SPA: never hard goto after magic. Ember: real pointer on label.
"""
from playwright.sync_api import sync_playwright
import json, time, datetime

rows = []

def rec(surface, action, ladder, receipt):
    ts = datetime.datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")
    rows.append(dict(ts=ts, surface=surface, action=action, ladder=ladder, receipt=str(receipt)[:500]))
    print(f"{ts} | {surface} | {action} | {ladder} | {str(receipt)[:160]}", flush=True)

REVLEADS_LOGIN = (
    "https://vendor.revleads.com/user/login-email?data="
    "IHsgInRva2VuIjoiNDk3NGZhYjU4ZTRmZmYzYWFjYmNlOGY3ZTA1OWEwMjg4MWIxMzJiN2VkMTdiODIwODJkOTMwY2U5Y2M5MTg5YSIsICJlbWFpbCI6Im5pY2hvbGFzQGNzb2FpLm9yZyJ9IA=="
)

NAME = "GSPC"
TAGLINE = "Open AI measurement board — we measure, never certify"
SHORT = (
    "GSPC is an open AI measurement board from CSOAI Ltd. "
    "23 axes measured, Ed25519-signed cards, free MCP (14 tools). "
    "Measurement, not certification."
)
MEDIUM = (
    "GSPC (Governance · Safety · Provenance · Continuity) is CSOAI's open measurement board for AI systems. "
    "We run frozen, published tests and sign the results so anyone can recompute and challenge them. "
    "Free MCP door: https://councilof.ai/mcp/free (14 tools). Full door adds 5 x402-metered evidence tools. "
    "Measurement, not certification — we never sell a score, rank, grade, or certificate."
)
FEATURES = (
    "23 measured axes (governance, safety, provenance, continuity + financial fact axes). "
    "Ed25519-signed measurement cards on a public chain. "
    "Offline verification at https://councilof.ai/gspc-verify. "
    "Free MCP door (14 tools) at https://councilof.ai/mcp/free. "
    "Full MCP door (19 tools = 14 free + 5 x402-metered evidence tools). "
    "Board API (CC-BY-4.0) at https://councilof.ai/api/gspc. "
    "Public correction ledger. Measurement, not certification."
)
PRICING = (
    "Free to read and verify. Free MCP door (14 tools). "
    "x402 pay-per-evidence on the full door (5 metered tools). "
    "Paid artefacts are signed evidence for already-measured work."
)
FAQS = (
    "Q: What is GSPC?\nA: GSPC is CSOAI Ltd's open AI measurement board (Governance · Safety · Provenance · Continuity). It publishes signed, re-checkable measurements of AI systems against frozen public tests.\n\n"
    "Q: Is GSPC a certification or a grade?\nA: No. GSPC is measurement, not certification. We never sell a score, rank, grade, or certificate.\n\n"
    "Q: How many axes does GSPC measure?\nA: 23 axes are on the board and every one carries a measurement (derived from https://councilof.ai/api/gspc).\n\n"
    "Q: How do I verify a GSPC measurement?\nA: Open https://councilof.ai/gspc-verify. Cards carry Ed25519 signatures on a public chain."
)
WEBSITE = "https://councilof.ai"
EMAIL = "nicholas@csoai.org"
COMPANY = "CSOAI Ltd"


def dismiss(page):
    for sel in ["button:has-text('Got It')", "button:has-text('Got it')", "button:has-text('Close')", "[aria-label='Close']"]:
        try:
            b = page.locator(sel).first
            if b.count() and b.is_visible():
                b.click(timeout=800)
        except Exception:
            pass


def fill_any(page, values):
    n = 0
    for sel, val in values:
        try:
            loc = page.locator(sel)
            for i in range(min(loc.count(), 3)):
                el = loc.nth(i)
                try:
                    if el.is_editable():
                        el.fill(val)
                        n += 1
                except Exception:
                    pass
        except Exception:
            pass
    return n


def save_next(page):
    for btn in ["button:has-text('Save and Next')", "button:has-text('Save & Next')", "button:has-text('Save')", "button:has-text('Next')"]:
        try:
            b = page.locator(btn).first
            if b.count() and b.is_enabled():
                b.click(timeout=2000)
                return btn
        except Exception:
            pass
    return None


def main():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True, channel="chrome")
        ctx = browser.new_context(
            user_agent=(
                "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 "
                "(KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36"
            )
        )
        page = ctx.new_page()
        page.set_default_timeout(8000)

        # Magic login — domcontentloaded only (NOT networkidle)
        page.goto(REVLEADS_LOGIN, wait_until="domcontentloaded", timeout=20000)
        time.sleep(3)
        dismiss(page)
        rec("RevLeads", "login", "INSTALLED", page.url)

        # Soft-nav steps
        payloads = {
            "general": [
                ("input[name*='name']", NAME),
                ("input[name*='tagline']", TAGLINE),
                ("input[name*='url']", WEBSITE),
                ("input[name*='website']", WEBSITE),
                ("input[type=email]", EMAIL),
                ("input[name*='company']", COMPANY),
                ("textarea", MEDIUM),
            ],
            "assets": [
                ("textarea", "Public board screenshots and logo at https://councilof.ai/ — verify at /gspc-verify"),
                ("input[type=url]", WEBSITE),
            ],
            "features": [("textarea", FEATURES)],
            "pricing": [
                ("textarea", PRICING),
                ("input[name*='price']", "Free · x402 pay-per-evidence"),
            ],
            "faqs": [("textarea", FAQS)],
            "status": [("textarea", "https://councilof.ai/api/gspc · https://councilof.ai/mcp/free · https://councilof.ai/gspc-verify")],
        }

        for step in ["general", "assets", "features", "pricing", "faqs", "status"]:
            # soft click tab
            for sel in [f"a[href*='{step}']", f"button:has-text('{step.title()}')", f"a:has-text('{step.title()}')"]:
                try:
                    loc = page.locator(sel).first
                    if loc.count():
                        loc.click(timeout=2000)
                        time.sleep(0.8)
                        break
                except Exception:
                    pass
            dismiss(page)
            filled = fill_any(page, payloads.get(step, []))
            try:
                page.keyboard.press("Tab")
            except Exception:
                pass
            via = save_next(page)
            time.sleep(1.2)
            rec("RevLeads", f"fill-{step}", "INSTALLED", f"url={page.url} filled={filled} via={via}")
            if "status" in page.url and step != "status":
                # already on status early
                pass

        # Force status tab
        for sel in ["a[href*='status']", "button:has-text('Status')", "a:has-text('Status')"]:
            try:
                loc = page.locator(sel).first
                if loc.count():
                    loc.click(timeout=2000)
                    time.sleep(0.8)
                    break
            except Exception:
                pass
        dismiss(page)

        # Ember real pointer
        ember = False
        try:
            cbs = page.locator("input[type=checkbox]")
            rec("RevLeads", "cb-count", "INSTALLED", str(cbs.count()))
            for i in range(min(cbs.count(), 10)):
                try:
                    cb = cbs.nth(i)
                    cb.scroll_into_view_if_needed()
                    label = cb.locator("xpath=ancestor::label[1]")
                    target = label if label.count() else cb
                    box = target.bounding_box()
                    if not box or box["width"] < 10:
                        continue
                    page.mouse.click(box["x"] + min(box["width"] / 2, 30), box["y"] + box["height"] / 2)
                    time.sleep(0.25)
                    ember = True
                    rec("RevLeads", f"ember-{i}", "INSTALLED", f"{box}")
                    break
                except Exception:
                    pass
        except Exception as e:
            rec("RevLeads", "ember-err", "DISCOVERED", str(e)[:100])

        # Submit for Review
        submitted = False
        for btn in ["button:has-text('Submit for Review')", "button:has-text('Submit for review')", "button:has-text('Submit')"]:
            try:
                b = page.locator(btn).first
                if b.count() and b.is_enabled():
                    b.scroll_into_view_if_needed()
                    b.click(timeout=3000)
                    submitted = True
                    rec("RevLeads", "submit-click", "INSTALLED", btn)
                    break
            except Exception as e:
                rec("RevLeads", "submit-err", "DISCOVERED", str(e)[:80])
        time.sleep(2)
        after = page.inner_text("body")[:600]
        low = after.lower()
        not_yet = "not yet submitted" in low
        ok = any(x in low for x in ["submitted for review", "under review", "in review", "pending review", "successfully", "thank"])
        ladder = "INDEXED" if (submitted and ok and not not_yet) else ("PARTIAL" if submitted or ember else "INSTALLED")
        rec("RevLeads", "FINAL", ladder, f"ember={ember} submitted={submitted} not_yet={not_yet} ok={ok} :: {after[:220]}")

        try:
            page.screenshot(path="/Users/nicholas/clawd/_alignment/revleads-retry2-20261007.png", full_page=True)
        except Exception:
            pass

        browser.close()

    out = "/Users/nicholas/clawd/_alignment/REVLEADS-RETRY2-2026-10-07.json"
    with open(out, "w") as f:
        json.dump(rows, f, indent=2)
    print("wrote", out, "n=", len(rows), flush=True)


if __name__ == "__main__":
    main()
