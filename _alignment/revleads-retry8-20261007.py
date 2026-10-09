#!/usr/bin/env python3
"""RETRY8 auto — FAQs already saved. Status: Ember + Submit only."""
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
        dismiss(page)

        # verify FAQs persisted
        try:
            val = page.evaluate(
                """() => {
                  const tas = [...document.querySelectorAll('textarea')];
                  const ta = tas.find(t => (t.id||'').includes('editor') || (t.className||'').includes('markdown')) || tas[0];
                  return ta ? {id: ta.id, len: (ta.value||'').length, head: (ta.value||'').slice(0,50)} : null;
                }"""
            )
            rec("RevLeads", "faqs-check", "INSTALLED", json.dumps(val))
        except Exception as e:
            rec("RevLeads", "faqs-check", "DISCOVERED", str(e)[:80])

        # go status via every soft path
        for sel in [
            "a[href*='status']",
            "button:has-text('Status')",
            "a:has-text('Status')",
            "a[href*='/status']",
            "text=Status",
        ]:
            try:
                loc = page.locator(sel).first
                if loc.count():
                    loc.click(timeout=2500)
                    time.sleep(1.2)
                    rec("RevLeads", "nav-status", "INSTALLED", f"{sel} -> {page.url}")
                    break
            except Exception:
                pass
        dismiss(page)

        # dump status page controls
        try:
            ctrls = page.evaluate(
                """() => {
                  const out = [];
                  for (const el of document.querySelectorAll('button,a.btn,input[type=submit],input[type=checkbox]')) {
                    const r = el.getBoundingClientRect();
                    out.push({tag: el.tagName, id: el.id||'', type: el.type||'',
                              text: (el.innerText||el.value||'').slice(0,40).replace(/\\n/g,' '),
                              w: Math.round(r.width), vis: r.width>0 && r.height>0});
                  }
                  return out;
                }"""
            )
            rec("RevLeads", "status-ctrls", "INSTALLED", json.dumps(ctrls)[:550])
        except Exception as e:
            rec("RevLeads", "status-ctrls", "DISCOVERED", str(e)[:80])

        # Ember checkbox via JS click (no scroll)
        ember = page.evaluate(
            """() => {
              const cbs = [...document.querySelectorAll('input[type=checkbox]')];
              for (const cb of cbs) {
                const lab = cb.closest('label') || cb.parentElement;
                const box = cb.getBoundingClientRect();
                if (box.width > 0) {
                  cb.click();
                  if (lab) lab.click();
                  if (cb.checked) return true;
                }
              }
              return false;
            }"""
        )
        rec("RevLeads", "ember-js", "INSTALLED" if ember else "DISCOVERED", str(ember))

        # Submit for Review via JS click
        submitted = page.evaluate(
            """() => {
              const btns = [...document.querySelectorAll('button, a.btn, input[type=submit]')];
              for (const b of btns) {
                const t = (b.innerText || b.value || '').toLowerCase();
                if (t.includes('submit for review') || t.includes('submit for rev')) {
                  b.scrollIntoView({block:'center'});
                  b.click();
                  return t.trim().slice(0,40);
                }
              }
              // fallback any submit
              for (const b of btns) {
                const t = (b.innerText || b.value || '').toLowerCase();
                if (t.includes('submit')) { b.click(); return 'fb:'+t.trim().slice(0,30); }
              }
              return null;
            }"""
        )
        rec("RevLeads", "submit-js", "INSTALLED" if submitted else "DISCOVERED", str(submitted))
        time.sleep(3)

        after = page.inner_text("body")[:600]
        low = after.lower()
        not_yet = "not yet submitted" in low
        ok = any(x in low for x in ["submitted for review", "under review", "in review", "pending", "successfully", "thank"])
        ladder = "INDEXED" if (submitted and ok and not not_yet) else "PARTIAL"
        rec("RevLeads", "FINAL", ladder, f"ember={ember} sub={bool(submitted)} not_yet={not_yet} ok={ok} :: {after[:200]}")
        try:
            page.screenshot(path="/Users/nicholas/clawd/_alignment/revleads-retry8-20261007.png", full_page=True)
        except Exception:
            pass
        browser.close()

    out = "/Users/nicholas/clawd/_alignment/REVLEADS-RETRY8-2026-10-07.json"
    with open(out, "w") as f:
        json.dump(rows, f, indent=2)
    print("wrote", out, flush=True)


if __name__ == "__main__":
    main()
