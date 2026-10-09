#!/usr/bin/env python3
"""RETRY6 auto — FAQs force-click + type on #ember*-editor. Then Ember+Submit. No ask."""
from playwright.sync_api import sync_playwright
import json, time, datetime

rows = []

def rec(surface, action, ladder, receipt):
    ts = datetime.datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")
    rows.append(dict(ts=ts, surface=surface, action=action, ladder=ladder, receipt=str(receipt)[:600]))
    print(f"{ts} | {surface} | {action} | {ladder} | {str(receipt)[:170]}", flush=True)

REVLEADS_LOGIN = (
    "https://vendor.revleads.com/user/login-email?data="
    "IHsgInRva2VuIjoiNDk3NGZhYjU4ZTRmZmYzYWFjYmNlOGY3ZTA1OWEwMjg4MWIxMzJiN2VkMTdiODIwODJkOTMwY2U5Y2M5MTg5YSIsICJlbWFpbCI6Im5pY2hvbGFzQGNzb2FpLm9yZyJ9IA=="
)
FAQ = (
    "### What is GSPC?\nGSPC is CSOAI Ltd's open AI measurement board. Measurement, not certification.\n\n"
    "### Is GSPC a certification?\nNo. We never sell a score, rank, grade, or certificate.\n\n"
    "### How many axes?\n23 axes measured (https://councilof.ai/api/gspc).\n\n"
    "### How to verify?\nhttps://councilof.ai/gspc-verify\n\n"
    "### Free MCP?\nhttps://councilof.ai/mcp/free (14 tools)."
)
LAUNCH_EMAIL = "nicholas@csoai.org"


def dismiss(page):
    for sel in ["button:has-text('Got It')", "button:has-text('Got it')", "button:has-text('Close')"]:
        try:
            b = page.locator(sel).first
            if b.count() and b.is_visible():
                b.click(timeout=500)
        except Exception:
            pass


def wait_app(page, timeout_s=18):
    t0 = time.time()
    while time.time() - t0 < timeout_s:
        u = page.url
        if "/app/gspc" in u and "/loading" not in u and "login" not in u:
            return u
        time.sleep(0.4)
    return page.url


def goto_step(page, step):
    for sel in [f"a[href*='{step}']", f"button:has-text('{step.title()}')", f"a:has-text('{step.title()}')"]:
        try:
            loc = page.locator(sel).first
            if loc.count():
                loc.click(timeout=2000)
                time.sleep(0.8)
                return True
        except Exception:
            pass
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
        page.set_default_timeout(7000)

        # ========== 1. LaunchStag email-first claim ==========
        try:
            page.goto("https://launchstag.com/claim/ca14035d-7e6e-421a-9eb4-0a1ee5d67768", wait_until="domcontentloaded", timeout=20000)
            time.sleep(1)
            inp = page.locator("input[type=email], input[placeholder*='@']").first
            if inp.count() and inp.is_editable():
                inp.fill(LAUNCH_EMAIL)
                rec("LaunchStag", "email-fill", "INSTALLED", LAUNCH_EMAIL)
            for btn in ["button[type=submit]", "button:has-text('Send')", "button:has-text('Continue')", "button:has-text('Verify')", "button:has-text('Claim')"]:
                try:
                    b = page.locator(btn).first
                    if b.count() and b.is_enabled():
                        b.click(timeout=2500)
                        rec("LaunchStag", "email-submit", "INSTALLED", btn)
                        break
                except Exception:
                    pass
            time.sleep(1.5)
            rec("LaunchStag", "after", "INSTALLED", f"{page.url} :: {page.inner_text('body')[:150]}")
        except Exception as e:
            rec("LaunchStag", "claim", "DISCOVERED", str(e)[:150])

        # ========== 2. RevLeads FAQs force type ==========
        page.goto(REVLEADS_LOGIN, wait_until="domcontentloaded", timeout=20000)
        u = wait_app(page, 22)
        rec("RevLeads", "landed", "INSTALLED", u)
        dismiss(page)
        goto_step(page, "faqs")
        dismiss(page)

        # force click + type on #ember*-editor
        filled = False
        try:
            # find editor id dynamically
            eid = page.evaluate(
                """() => {
                  for (const ta of document.querySelectorAll('textarea')) {
                    if (ta.id && (ta.className||'').includes('markdown')) return ta.id;
                    if (ta.id && ta.id.includes('editor')) return ta.id;
                  }
                  const ta = document.querySelector('textarea');
                  return ta ? ta.id : '';
                }"""
            )
            rec("RevLeads", "editor-id", "INSTALLED", str(eid))
            if eid:
                loc = page.locator(f"#{eid}")
                loc.scroll_into_view_if_needed()
                loc.click(force=True, timeout=3000)
                time.sleep(0.2)
                page.keyboard.press("Control+A")
                page.keyboard.type(FAQ[:500], delay=1)
                time.sleep(0.3)
                val = loc.input_value()
                rec("RevLeads", "force-type", "INSTALLED", f"len={len(val)} head={val[:80]!r}")
                filled = len(val) > 20
            if not filled:
                # JS native setter (avoid Illegal invocation via prototype call on HTMLTextAreaElement)
                out = page.evaluate(
                    """(text) => {
                      const tas = [...document.querySelectorAll('textarea')];
                      const ta = tas.find(t => t.id.includes('editor') || (t.className||'').includes('markdown')) || tas[0];
                      if (!ta) return 'none';
                      const proto = window.HTMLTextAreaElement.prototype;
                      const setter = Object.getOwnPropertyDescriptor(proto, 'value').set;
                      setter.call(ta, text);
                      ta.dispatchEvent(new Event('input', {bubbles:true}));
                      ta.dispatchEvent(new Event('change', {bubbles:true}));
                      return ta.value.slice(0,80);
                    }""",
                    FAQ,
                )
                rec("RevLeads", "native-setter", "INSTALLED", str(out)[:120])
                filled = bool(out and "GSPC" in str(out))
        except Exception as e:
            rec("RevLeads", "faqs-err", "DISCOVERED", str(e)[:150])

        # save
        try:
            b = page.locator("button:has-text('Save and Next'), button:has-text('Save')").first
            if b.count():
                b.click(timeout=2000)
                rec("RevLeads", "save", "INSTALLED", "Save")
        except Exception:
            pass
        time.sleep(0.8)

        # status: ember + submit
        goto_step(page, "status")
        dismiss(page)
        ember = False
        try:
            cbs = page.locator("input[type=checkbox]")
            for i in range(min(cbs.count(), 5)):
                cb = cbs.nth(i)
                cb.scroll_into_view_if_needed()
                label = cb.locator("xpath=ancestor::label[1]")
                target = label if label.count() else cb
                box = target.bounding_box()
                if box and box["width"] >= 10:
                    page.mouse.click(box["x"] + min(box["width"] / 2, 40), box["y"] + box["height"] / 2)
                    time.sleep(0.2)
                    try:
                        if cb.is_checked():
                            ember = True
                            break
                    except Exception:
                        ember = True
                        break
        except Exception:
            pass
        submitted = False
        try:
            b = page.locator("button:has-text('Submit for Review')").first
            if b.count() and b.is_enabled():
                b.click(timeout=3000)
                submitted = True
        except Exception:
            pass
        time.sleep(2)
        after = page.inner_text("body")[:500]
        low = after.lower()
        not_yet = "not yet submitted" in low
        ok = any(x in low for x in ["submitted for review", "under review", "in review", "pending", "successfully", "thank"])
        ladder = "INDEXED" if (submitted and ok and not not_yet) else "PARTIAL"
        rec("RevLeads", "FINAL", ladder, f"faqs={filled} ember={ember} sub={submitted} not_yet={not_yet} :: {after[:180]}")
        try:
            page.screenshot(path="/Users/nicholas/clawd/_alignment/revleads-retry6-20261007.png", full_page=True)
        except Exception:
            pass

        browser.close()

    out = "/Users/nicholas/clawd/_alignment/REVLEADS-RETRY6-2026-10-07.json"
    with open(out, "w") as f:
        json.dump(rows, f, indent=2)
    print("wrote", out, flush=True)


if __name__ == "__main__":
    main()
