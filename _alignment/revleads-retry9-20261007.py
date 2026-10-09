#!/usr/bin/env python3
"""RETRY9 auto — cookie banner first, then JS FAQs + Ember model event + save + status submit."""
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


def kill_cookies(page):
    for sel in [
        "button:has-text('ALLOW ALL COOKIES')",
        "button:has-text('Allow all cookies')",
        "button:has-text('Accept all')",
        "button:has-text('Accept All')",
        "button:has-text('Got It')",
        "button:has-text('Got it')",
        "button:has-text('Close')",
    ]:
        try:
            b = page.locator(sel).first
            if b.count() and b.is_visible():
                b.click(timeout=800)
                time.sleep(0.3)
                return sel
        except Exception:
            pass
    return None


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
                loc.click(timeout=2500)
                time.sleep(0.9)
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
        page.set_default_timeout(8000)

        page.goto(REVLEADS_LOGIN, wait_until="domcontentloaded", timeout=20000)
        u = wait_app(page, 22)
        rec("RevLeads", "landed", "INSTALLED", u)
        ck = kill_cookies(page)
        rec("RevLeads", "cookies", "INSTALLED", str(ck))
        kill_cookies(page)

        # FAQs
        goto_step(page, "faqs")
        kill_cookies(page)
        out = page.evaluate(
            """(text) => {
              const tas = [...document.querySelectorAll('textarea')];
              const ta = tas.find(t => (t.id||'').includes('editor') || (t.className||'').includes('markdown')) || tas[0];
              if (!ta) return {ok:false, why:'no-ta'};
              const setter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value').set;
              setter.call(ta, text);
              // full event storm for Ember binding
              for (const type of ['input','change','keyup','keydown','blur','focus']) {
                ta.dispatchEvent(new Event(type, {bubbles:true}));
              }
              ta.dispatchEvent(new KeyboardEvent('keyup', {bubbles:true, key:'a'}));
              // also try jQuery val if present
              if (window.jQuery) {
                try { window.jQuery(ta).val(text).trigger('change').trigger('input'); } catch(e) {}
              }
              return {ok: ta.value.length > 20, len: ta.value.length, id: ta.id};
            }""",
            FAQ,
        )
        rec("RevLeads", "faqs-set", "INSTALLED" if out.get("ok") else "DISCOVERED", json.dumps(out)[:200])

        # Save
        try:
            b = page.locator("button:has-text('Save and Next'), button:has-text('Save')").first
            if b.count():
                b.click(timeout=2500)
                rec("RevLeads", "save", "INSTALLED", "ok")
        except Exception as e:
            rec("RevLeads", "save", "DISCOVERED", str(e)[:80])
        time.sleep(1.2)
        kill_cookies(page)

        # verify persist after save (same session)
        chk = page.evaluate(
            """() => {
              const tas = [...document.querySelectorAll('textarea')];
              const ta = tas.find(t => (t.id||'').includes('editor') || (t.className||'').includes('markdown')) || tas[0];
              return ta ? (ta.value||'').length : -1;
            }"""
        )
        rec("RevLeads", "faqs-after-save", "INSTALLED", f"len={chk}")

        # Status
        goto_step(page, "status")
        kill_cookies(page)
        time.sleep(0.5)

        ember = page.evaluate(
            """() => {
              const cbs = [...document.querySelectorAll('input[type=checkbox]')];
              for (const cb of cbs) {
                const r = cb.getBoundingClientRect();
                if (r.width > 0) {
                  const lab = cb.closest('label');
                  if (lab) lab.click();
                  cb.click();
                  if (cb.checked) return true;
                }
              }
              return false;
            }"""
        )
        rec("RevLeads", "ember", "INSTALLED" if ember else "DISCOVERED", str(ember))

        submitted = page.evaluate(
            """() => {
              const btns = [...document.querySelectorAll('button, a, input[type=submit]')];
              for (const b of btns) {
                const t = ((b.innerText || b.value || '') + ' ' + (b.getAttribute('title')||'')).toLowerCase();
                if (t.includes('submit for review')) { b.click(); return b.innerText||b.value; }
              }
              for (const b of btns) {
                const t = (b.innerText || b.value || '').toLowerCase();
                if (t.trim() === 'submit' || t.includes('submit')) { b.click(); return 'fb:' + t.slice(0,30); }
              }
              return null;
            }"""
        )
        rec("RevLeads", "submit", "INSTALLED" if submitted else "DISCOVERED", str(submitted)[:120])
        time.sleep(3)
        kill_cookies(page)

        after = page.inner_text("body")[:600]
        low = after.lower()
        not_yet = "not yet submitted" in low
        ok = any(x in low for x in ["submitted for review", "under review", "in review", "pending", "successfully", "thank"])
        ladder = "INDEXED" if (submitted and ok and not not_yet) else "PARTIAL"
        rec("RevLeads", "FINAL", ladder, f"faqs_len={chk} ember={ember} sub={bool(submitted)} not_yet={not_yet} ok={ok} :: {after[:200]}")
        try:
            page.screenshot(path="/Users/nicholas/clawd/_alignment/revleads-retry9-20261007.png", full_page=True)
        except Exception:
            pass
        browser.close()

    out = "/Users/nicholas/clawd/_alignment/REVLEADS-RETRY9-2026-10-07.json"
    with open(out, "w") as f:
        json.dump(rows, f, indent=2)
    print("wrote", out, flush=True)


if __name__ == "__main__":
    main()
