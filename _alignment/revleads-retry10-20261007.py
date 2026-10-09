#!/usr/bin/env python3
"""RETRY10 auto — all-JS save/nav/ember/submit. Cookies first. FAQs native-setter."""
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
    return page.evaluate(
        """() => {
          for (const b of document.querySelectorAll('button, a')) {
            const t = (b.innerText||'').toLowerCase();
            if (t.includes('allow all') || t.includes('accept all') || t.includes('got it') || t.includes('allow all cookies')) {
              b.click(); return t.slice(0,30);
            }
          }
          return null;
        }"""
    )


def js_click_text(page, needles):
    return page.evaluate(
        """(needles) => {
          const btns = [...document.querySelectorAll('button, a, input[type=submit]')];
          for (const b of btns) {
            const t = ((b.innerText||b.value||'') + ' ' + (b.getAttribute('title')||'')).toLowerCase();
            if (needles.some(n => t.includes(n))) {
              try { b.click(); return (b.innerText||b.value||'').slice(0,40); } catch(e) {}
            }
          }
          return null;
        }""",
        needles,
    )


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
        rec("RevLeads", "cookies", "INSTALLED", str(kill_cookies(page)))
        kill_cookies(page)

        # FAQs via native setter
        out = page.evaluate(
            """(text) => {
              const tas = [...document.querySelectorAll('textarea')];
              const ta = tas.find(t => (t.id||'').includes('editor') || (t.className||'').includes('markdown')) || tas[0];
              if (!ta) return {ok:false};
              const setter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value').set;
              setter.call(ta, text);
              for (const type of ['input','change','keyup','blur']) ta.dispatchEvent(new Event(type, {bubbles:true}));
              if (window.jQuery) { try { window.jQuery(ta).val(text).trigger('change').trigger('input'); } catch(e) {} }
              return {ok: ta.value.length>20, len: ta.value.length, id: ta.id};
            }""",
            FAQ,
        )
        rec("RevLeads", "faqs", "INSTALLED" if out.get("ok") else "DISCOVERED", json.dumps(out)[:150])

        # Save via JS
        saved = js_click_text(page, ["save and next", "save & next", "save"])
        rec("RevLeads", "save", "INSTALLED" if saved else "DISCOVERED", str(saved))
        time.sleep(1.5)
        kill_cookies(page)

        # Nav status via JS
        nav = page.evaluate(
            """() => {
              for (const a of document.querySelectorAll('a, button')) {
                const t = (a.innerText||'').toLowerCase().trim();
                const h = (a.getAttribute('href')||'').toLowerCase();
                if (t === 'status' || h.includes('status')) { a.click(); return t || h; }
              }
              return null;
            }"""
        )
        rec("RevLeads", "nav", "INSTALLED" if nav else "DISCOVERED", str(nav))
        time.sleep(1.5)
        kill_cookies(page)

        # Ember via JS
        ember = page.evaluate(
            """() => {
              for (const cb of document.querySelectorAll('input[type=checkbox]')) {
                const r = cb.getBoundingClientRect();
                if (r.width > 0) {
                  const lab = cb.closest('label');
                  if (lab) lab.click();
                  cb.click();
                  cb.dispatchEvent(new Event('change', {bubbles:true}));
                  if (cb.checked) return true;
                }
              }
              return false;
            }"""
        )
        rec("RevLeads", "ember", "INSTALLED" if ember else "DISCOVERED", str(ember))

        # Submit for Review via JS (exact-ish)
        submitted = js_click_text(page, ["submit for review"])
        rec("RevLeads", "submit", "INSTALLED" if submitted else "DISCOVERED", str(submitted))
        time.sleep(3)
        kill_cookies(page)

        after = page.inner_text("body")[:600]
        low = after.lower()
        not_yet = "not yet submitted" in low
        ok = any(x in low for x in ["submitted for review", "under review", "in review", "pending", "successfully", "thank"])
        ladder = "INDEXED" if (submitted and ok and not not_yet) else "PARTIAL"
        rec("RevLeads", "FINAL", ladder, f"faqs={out.get('len')} ember={ember} sub={bool(submitted)} not_yet={not_yet} ok={ok} url={page.url} :: {after[:180]}")
        try:
            page.screenshot(path="/Users/nicholas/clawd/_alignment/revleads-retry10-20261007.png", full_page=True)
        except Exception:
            pass
        browser.close()

    outp = "/Users/nicholas/clawd/_alignment/REVLEADS-RETRY10-2026-10-07.json"
    with open(outp, "w") as f:
        json.dump(rows, f, indent=2)
    print("wrote", outp, flush=True)


if __name__ == "__main__":
    main()
