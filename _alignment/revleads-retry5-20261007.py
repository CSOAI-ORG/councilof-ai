#!/usr/bin/env python3
"""RevLeads RETRY5 — FAQs only: click + keyboard.type + CodeMirror fallback. Then Ember + Submit."""
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

FAQ_MD = (
    "### What is GSPC?\n"
    "GSPC is CSOAI Ltd's open AI measurement board (Governance · Safety · Provenance · Continuity). "
    "It publishes signed, re-checkable measurements of AI systems against frozen public tests.\n\n"
    "### Is GSPC a certification or a grade?\n"
    "No. GSPC is measurement, not certification. We never sell a score, rank, grade, or certificate.\n\n"
    "### How many axes does GSPC measure?\n"
    "23 axes are on the board and every one carries a measurement (derived from https://councilof.ai/api/gspc).\n\n"
    "### How do I verify a GSPC measurement?\n"
    "Open https://councilof.ai/gspc-verify. Cards carry Ed25519 signatures on a public chain.\n\n"
    "### Is there a free API or MCP?\n"
    "Yes. Free MCP: https://councilof.ai/mcp/free (14 tools, no auth). Board API: https://councilof.ai/api/gspc.\n"
)


def dismiss(page):
    for sel in ["button:has-text('Got It')", "button:has-text('Got it')", "button:has-text('Close')", "[aria-label='Close']"]:
        try:
            b = page.locator(sel).first
            if b.count() and b.is_visible():
                b.click(timeout=600)
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
                time.sleep(0.9)
                return True
        except Exception:
            pass
    return False


def fill_faqs(page):
    """Try 4 strategies on Ember markdown editor."""
    results = {}

    # 1) keyboard.type after click on textarea
    try:
        ta = page.locator("textarea").first
        if ta.count():
            ta.click(timeout=2000)
            page.keyboard.press("Control+A")
            page.keyboard.type(FAQ_MD, delay=2)
            val = ta.input_value() if ta.count() else ""
            results["keyboard_type"] = (val or "")[:80]
            if val and "GSPC" in val:
                return results, True
    except Exception as e:
        results["keyboard_type_err"] = str(e)[:80]

    # 2) insertText via JS (bypasses some widgets)
    try:
        ok = page.evaluate(
            """(text) => {
              const tas = document.querySelectorAll('textarea');
              for (const ta of tas) {
                const r = ta.getBoundingClientRect();
                if (r.width > 40 && !ta.disabled) {
                  ta.focus();
                  ta.value = text;
                  ta.dispatchEvent(new Event('input', {bubbles:true}));
                  ta.dispatchEvent(new Event('change', {bubbles:true}));
                  return ta.value.slice(0,80);
                }
              }
              return 'no-ta';
            }""",
            FAQ_MD,
        )
        results["js_value"] = str(ok)[:80]
        if ok and "GSPC" in str(ok):
            return results, True
    except Exception as e:
        results["js_value_err"] = str(e)[:80]

    # 3) CodeMirror API
    try:
        ok = page.evaluate(
            """(text) => {
              if (window.CodeMirror) {
                const cm = document.querySelector('.CodeMirror');
                if (cm && cm.CodeMirror) {
                  cm.CodeMirror.setValue(text);
                  return 'cm:' + cm.CodeMirror.getValue().slice(0,60);
                }
              }
              // EasyMDE / bootstrap-markdown
              const md = document.querySelector('[data-provide="markdown"], .md-editor');
              if (md) { md.focus(); }
              return 'no-cm';
            }""",
            FAQ_MD,
        )
        results["codemirror"] = str(ok)[:80]
        if ok and "GSPC" in str(ok):
            return results, True
    except Exception as e:
        results["codemirror_err"] = str(e)[:80]

    # 4) type into focused contenteditable / editor body
    try:
        ed = page.locator(".md-editor textarea, .ember-bootstrap-markdown-textarea, [contenteditable=true]").first
        if ed.count():
            ed.click(timeout=1500)
            page.keyboard.press("Control+A")
            # shorter text to reduce timeout risk
            page.keyboard.type("Q: What is GSPC? A: Open AI measurement board by CSOAI Ltd. Measurement, not certification.", delay=1)
            results["editor_type"] = "typed-short"
    except Exception as e:
        results["editor_type_err"] = str(e)[:80]

    # verify any textarea has content
    try:
        val = page.evaluate(
            """() => {
              for (const ta of document.querySelectorAll('textarea')) {
                if ((ta.value||'').length > 10) return ta.value.slice(0,80);
              }
              return '';
            }"""
        )
        results["final_val"] = str(val)[:80]
        return results, bool(val and len(val) > 10)
    except Exception:
        return results, False


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

        # FAQs step
        goto_step(page, "faqs")
        dismiss(page)
        # dump editor DOM hints
        try:
            hint = page.evaluate(
                """() => {
                  const out = [];
                  for (const el of document.querySelectorAll('textarea,.CodeMirror,.md-editor,[contenteditable]')) {
                    out.push({tag: el.tagName, id: el.id||'', cls: (el.className||'').toString().slice(0,70),
                              ce: el.contentEditable||''});
                  }
                  return out;
                }"""
            )
            rec("RevLeads", "faqs-dom", "INSTALLED", json.dumps(hint)[:450])
        except Exception as e:
            rec("RevLeads", "faqs-dom-err", "DISCOVERED", str(e)[:80])

        results, ok = fill_faqs(page)
        rec("RevLeads", "faqs-fill", "INSTALLED" if ok else "DISCOVERED", json.dumps(results)[:450])

        # Save
        for btn in ["button:has-text('Save and Next')", "button:has-text('Save & Next')", "button:has-text('Save')"]:
            try:
                b = page.locator(btn).first
                if b.count() and b.is_enabled():
                    b.click(timeout=2000)
                    rec("RevLeads", "faqs-save", "INSTALLED", btn)
                    break
            except Exception:
                pass
        time.sleep(1.0)

        # Status: Ember + Submit
        goto_step(page, "status")
        dismiss(page)
        ember = False
        try:
            cbs = page.locator("input[type=checkbox]")
            for i in range(min(cbs.count(), 6)):
                cb = cbs.nth(i)
                cb.scroll_into_view_if_needed()
                label = cb.locator("xpath=ancestor::label[1]")
                target = label if label.count() else cb
                box = target.bounding_box()
                if not box or box["width"] < 10:
                    continue
                page.mouse.click(box["x"] + min(box["width"] / 2, 40), box["y"] + box["height"] / 2)
                time.sleep(0.25)
                try:
                    checked = cb.is_checked()
                except Exception:
                    checked = None
                if checked:
                    ember = True
                    rec("RevLeads", f"ember-{i}", "INSTALLED", f"checked={checked}")
                    break
        except Exception as e:
            rec("RevLeads", "ember-err", "DISCOVERED", str(e)[:80])

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
        time.sleep(2.5)
        after = page.inner_text("body")[:700]
        low = after.lower()
        not_yet = "not yet submitted" in low
        ok2 = any(x in low for x in ["submitted for review", "under review", "in review", "pending review", "successfully", "thank"])
        ladder = "INDEXED" if (submitted and ok2 and not not_yet) else ("PARTIAL" if submitted or ember or ok else "INSTALLED")
        rec("RevLeads", "FINAL", ladder, f"faqs_ok={ok} ember={ember} submitted={submitted} not_yet={not_yet} ok={ok2} :: {after[:220]}")

        try:
            page.screenshot(path="/Users/nicholas/clawd/_alignment/revleads-retry5-20261007.png", full_page=True)
        except Exception:
            pass

        browser.close()

    out = "/Users/nicholas/clawd/_alignment/REVLEADS-RETRY5-2026-10-07.json"
    with open(out, "w") as f:
        json.dump(rows, f, indent=2)
    print("wrote", out, "n=", len(rows), flush=True)


if __name__ == "__main__":
    main()
