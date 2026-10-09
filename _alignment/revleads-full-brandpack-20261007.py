#!/usr/bin/env python3
"""RevLeads full brand-pack wizard fill → Ember → Submit for Review.
Use VERBATIM brand pack. Never invent counts. Never sell score/grade.
SPA: no hard goto after magic login.
"""
from playwright.sync_api import sync_playwright
import json, time, datetime

rows = []

def rec(surface, action, ladder, receipt):
    ts = datetime.datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")
    rows.append(dict(ts=ts, surface=surface, action=action, ladder=ladder, receipt=str(receipt)[:600]))
    print(f"{ts} | {surface} | {action} | {ladder} | {str(receipt)[:170]}")

REVLEADS_LOGIN = (
    "https://vendor.revleads.com/user/login-email?data="
    "IHsgInRva2VuIjoiNDk3NGZhYjU4ZTRmZmYzYWFjYmNlOGY3ZTA1OWEwMjg4MWIxMzJiN2VkMTdiODIwODJkOTMwY2U5Y2M5MTg5YSIsICJlbWFpbCI6Im5pY2hvbGFzQGNzb2FpLm9yZyJ9IA=="
)

# Brand pack VERBATIM (BRAND-PACK-SEO-GEO-AEO.md)
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
LONG = (
    "GSPC is an independent AI measurement board published by CSOAI Ltd (UK, Companies House 16939677). "
    "It measures AI systems on 23 published axes across Governance, Safety, Provenance and Continuity, "
    "plus deterministic financial-fact runs. Every measurement is a signed card on a public Ed25519 chain; "
    "anyone can recompute the result from the frozen split and verify inclusion offline at https://councilof.ai/gspc-verify.\n\n"
    "What GSPC is: a measurement surface with a correction ledger. One connection to discover and request "
    "capabilities; GSPC shows what was actually tested for this task, why a route was allowed, what happened, "
    "and when that conclusion changed.\n\n"
    "What GSPC is not: a certificate authority, a grade shop, or a compliance badge. We never sell a score, "
    "rank, grade, or certificate. Paid artefacts are signed evidence for already-measured work. Payment never "
    "mints a MEASURED cell and never upgrades a grade.\n\n"
    "Try it free: https://councilof.ai/mcp/free (14 MCP tools, no auth). Board API: https://councilof.ai/api/gspc (CC-BY-4.0)."
)
FEATURES = (
    "23 measured axes (governance, safety, provenance, continuity + financial fact axes)\n"
    "Ed25519-signed measurement cards on a public chain\n"
    "Offline verification at https://councilof.ai/gspc-verify\n"
    "Free MCP door (14 tools) at https://councilof.ai/mcp/free\n"
    "Full MCP door (19 tools = 14 free + 5 x402-metered evidence tools)\n"
    "Board API (CC-BY-4.0) at https://councilof.ai/api/gspc\n"
    "Public correction ledger — when a conclusion changes, it is published\n"
    "Measurement, not certification — never a sold score, rank, grade, or certificate"
)
PRICING = (
    "Free to read and verify. Free MCP door (14 tools). "
    "x402 pay-per-evidence on the full door (5 metered tools). "
    "Paid artefacts are signed evidence for already-measured work — payment never mints MEASURED and never upgrades a grade."
)
FAQ1_Q = "What is GSPC?"
FAQ1_A = (
    "GSPC is CSOAI Ltd's open AI measurement board (Governance · Safety · Provenance · Continuity). "
    "It publishes signed, re-checkable measurements of AI systems against frozen public tests."
)
FAQ2_Q = "Is GSPC a certification or a grade?"
FAQ2_A = (
    "No. GSPC is measurement, not certification. We never sell a score, rank, grade, or certificate. "
    "Paid artefacts are signed evidence for already-measured work."
)
FAQ3_Q = "How many axes does GSPC measure?"
FAQ3_A = (
    "23 axes are on the board and every one carries a measurement (derived from https://councilof.ai/api/gspc). "
    "Of the 14 model-comparison axes, 0 have a statistically separated leader (7 TIE · 7 UNTESTED). TIE is never a win."
)
FAQ4_Q = "How do I verify a GSPC measurement?"
FAQ4_A = (
    "Open https://councilof.ai/gspc-verify or recompute from the frozen split. "
    "Cards carry Ed25519 signatures on a public chain. Offline verification needs neither our servers nor our permission."
)
WEBSITE = "https://councilof.ai"
MCP_URL = "https://councilof.ai/mcp/free"
EMAIL = "nicholas@csoai.org"
COMPANY = "CSOAI Ltd"
PROOF = (
    "curl -s https://councilof.ai/api/gspc | jq .totals.public_count\n"
    "curl -s https://councilof.ai/api/gspc | jq .totals.measured_axes\n"
    "curl -s -X POST https://councilof.ai/mcp/free -H 'content-type: application/json' "
    "-H 'accept: application/json, text/event-stream' "
    "-d '{\"jsonrpc\":\"2.0\",\"id\":1,\"method\":\"tools/list\",\"params\":{}}'"
)

STEP_PAYLOADS = {
    "general": [
        ("input[name*=name], input[name*=title], input[placeholder*=name]", NAME),
        ("input[name*=tagline], input[name*=tagline], input[placeholder*=tag]", TAGLINE),
        ("input[name*=url], input[name*=website], input[type=url]", WEBSITE),
        ("input[name*=email], input[type=email]", EMAIL),
        ("input[name*=company], input[name*=vendor]", COMPANY),
        ("textarea[name*=short], textarea[name*=summary]", SHORT),
        ("textarea[name*=desc], textarea[name*=description], textarea[name*=about]", MEDIUM),
        ("textarea", MEDIUM),
    ],
    "assets": [
        ("input[name*=logo], input[name*=image], input[type=url]", "https://councilof.ai/favicon.svg"),
        ("textarea[name*=screenshot], textarea[name*=asset], textarea", "Logo and board screenshots available at https://councilof.ai/ — public board at /board/ · verify at /gspc-verify"),
    ],
    "features": [
        ("textarea[name*=feature], textarea[name*=bullet], textarea", FEATURES),
        ("input[name*=feature]", FEATURES[:120]),
    ],
    "pricing": [
        ("textarea[name*=pricing], textarea[name*=price], textarea", PRICING),
        ("input[name*=pricing], input[name*=price]", "Free to read · x402 pay-per-evidence"),
    ],
    "faqs": [
        ("textarea[name*=faq], textarea[name*=q1], textarea", f"Q: {FAQ1_Q}\nA: {FAQ1_A}\n\nQ: {FAQ2_Q}\nA: {FAQ2_A}\n\nQ: {FAQ3_Q}\nA: {FAQ3_A}\n\nQ: {FAQ4_Q}\nA: {FAQ4_A}"),
        ("input[name*=question], input[name*=q]", FAQ1_Q),
    ],
    "status": [
        ("textarea[name*=note], textarea[name*=proof], textarea", PROOF),
    ],
}


def dismiss_overlays(page):
    for sel in [
        "button:has-text('Got It')",
        "button:has-text('Got it')",
        "button:has-text('Close')",
        "button:has-text('OK')",
        "[aria-label='Close']",
        "[aria-label='close']",
    ]:
        try:
            b = page.locator(sel).first
            if b.count() and b.is_visible():
                b.click(timeout=1500)
                time.sleep(0.25)
        except Exception:
            pass


def dump_fields(page, step):
    try:
        info = page.evaluate(
            """() => {
              const out = [];
              for (const el of document.querySelectorAll('input,textarea,select')) {
                out.push({tag: el.tagName, name: el.name||'', id: el.id||'', type: el.type||'',
                          ph: el.placeholder||'', cls: (el.className||'').toString().slice(0,80),
                          val: (el.value||'').slice(0,60), editable: !el.disabled && !el.readOnly});
              }
              return out;
            }"""
        )
        rec("RevLeads", f"fields-{step}", "INSTALLED", json.dumps(info)[:500])
        return info
    except Exception as e:
        rec("RevLeads", f"fields-{step}", "DISCOVERED", str(e)[:150])
        return []


def fill_step(page, step):
    filled = 0
    for sel, val in STEP_PAYLOADS.get(step, []):
        for part in sel.split(","):
            part = part.strip()
            if not part:
                continue
            try:
                loc = page.locator(part)
                n = min(loc.count(), 4)
                for i in range(n):
                    el = loc.nth(i)
                    if el.is_editable():
                        # Angular/React: use fill (not raw value=)
                        try:
                            el.fill(val)
                            filled += 1
                        except Exception:
                            try:
                                el.click()
                                page.keyboard.press("Control+A")
                                page.keyboard.type(val[:500])
                                filled += 1
                            except Exception:
                                pass
            except Exception:
                pass
    return filled


def save_next(page):
    for btn in [
        "button:has-text('Save and Next')",
        "button:has-text('Save & Next')",
        "button:has-text('Save')",
        "button:has-text('Next')",
    ]:
        try:
            b = page.locator(btn).first
            if b.count() and b.is_enabled():
                b.scroll_into_view_if_needed()
                b.click(timeout=5000)
                return btn
        except Exception:
            pass
    return None


def ember_click(page):
    """Real pointer on wrapping label after scrollIntoView. JS .check() fails on Ember."""
    try:
        cbs = page.locator("input[type=checkbox]")
        n = cbs.count()
        rec("RevLeads", "ember-scan", "INSTALLED", f"checkboxes={n}")
        for i in range(min(n, 12)):
            try:
                cb = cbs.nth(i)
                cb.scroll_into_view_if_needed()
                time.sleep(0.15)
                label = cb.locator("xpath=ancestor::label[1]")
                target = label if label.count() else cb
                box = target.bounding_box()
                if not box:
                    continue
                # skip tiny/hidden
                if box["width"] < 8 or box["height"] < 8:
                    continue
                page.mouse.click(box["x"] + min(box["width"] / 2, 40), box["y"] + box["height"] / 2)
                time.sleep(0.3)
                # verify checked
                try:
                    checked = cb.is_checked()
                except Exception:
                    checked = None
                rec("RevLeads", f"ember-click-{i}", "INSTALLED", f"box={box} checked={checked}")
                if checked or checked is None:
                    return True
            except Exception as e:
                rec("RevLeads", f"ember-{i}", "DISCOVERED", str(e)[:80])
    except Exception as e:
        rec("RevLeads", "ember-fail", "DISCOVERED", str(e)[:120])
    return False


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

        # Magic login — stay on SPA
        page.goto(REVLEADS_LOGIN, wait_until="networkidle", timeout=50000)
        time.sleep(4)
        dismiss_overlays(page)
        rec("RevLeads", "magic-login", "INSTALLED", page.url)

        # Soft-nav through wizard tabs (never hard goto)
        steps = ["general", "assets", "features", "pricing", "faqs", "status"]
        for step in steps:
            dismiss_overlays(page)
            # try soft tab click
            for sel in [
                f"a[href*='{step}']",
                f"button:has-text('{step.title()}')",
                f"a:has-text('{step.title()}')",
                f"[data-step='{step}']",
            ]:
                try:
                    loc = page.locator(sel).first
                    if loc.count():
                        loc.click(timeout=3000)
                        time.sleep(1.2)
                        break
                except Exception:
                    pass
            dismiss_overlays(page)
            dump_fields(page, step)
            filled = fill_step(page, step)
            # blur to clear validation (Angular)
            try:
                page.keyboard.press("Tab")
                page.keyboard.press("Tab")
            except Exception:
                pass
            via = save_next(page)
            time.sleep(1.8)
            dismiss_overlays(page)
            rec("RevLeads", f"fill-{step}", "INSTALLED", f"url={page.url} filled={filled} via={via}")

            if step == "status" or "status" in page.url:
                break

        # Ensure we are on status
        for sel in ["a[href*='status']", "button:has-text('Status')", "a:has-text('Status')"]:
            try:
                loc = page.locator(sel).first
                if loc.count():
                    loc.click(timeout=3000)
                    time.sleep(1.5)
                    break
            except Exception:
                pass
        dismiss_overlays(page)

        ember = ember_click(page)
        time.sleep(0.4)
        submitted = False
        for btn in [
            "button:has-text('Submit for Review')",
            "button:has-text('Submit for review')",
            "button:has-text('Submit')",
        ]:
            try:
                b = page.locator(btn).first
                if b.count() and b.is_enabled():
                    b.scroll_into_view_if_needed()
                    b.click(timeout=6000)
                    submitted = True
                    rec("RevLeads", "submit-click", "INSTALLED", btn)
                    break
            except Exception as e:
                rec("RevLeads", "submit-err", "DISCOVERED", str(e)[:100])
        time.sleep(3)
        dismiss_overlays(page)
        after = page.inner_text("body")[:700]
        low = after.lower()
        not_yet = "not yet submitted" in low
        ok = any(
            x in low
            for x in [
                "submitted for review",
                "under review",
                "in review",
                "pending review",
                "successfully submitted",
                "thank you",
                "submission received",
            ]
        )
        ladder = "INDEXED" if (submitted and ok and not not_yet) else ("PARTIAL" if submitted or ember else "INSTALLED")
        rec(
            "RevLeads",
            "SUBMIT-FOR-REVIEW",
            ladder,
            f"ember={ember} submitted={submitted} not_yet={not_yet} ok={ok} final={page.url} :: {after[:280]}",
        )

        # screenshot for receipt
        try:
            page.screenshot(path="/Users/nicholas/clawd/_alignment/revleads-status-20261007.png", full_page=True)
            rec("RevLeads", "screenshot", "INSTALLED", "revleads-status-20261007.png")
        except Exception as e:
            rec("RevLeads", "screenshot", "DISCOVERED", str(e)[:80])

        browser.close()

    out = "/Users/nicholas/clawd/_alignment/LISTING-COMPLETE-REVLEADS-FULL-2026-10-07.json"
    with open(out, "w") as f:
        json.dump(rows, f, indent=2)
    print("wrote", out, "n=", len(rows))


if __name__ == "__main__":
    main()
