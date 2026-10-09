#!/usr/bin/env python3
"""RETRY7 auto — FAQs via JS only (no scroll). Re-Submit. IMAP LaunchStag code."""
from playwright.sync_api import sync_playwright
import json, time, datetime, imaplib, ssl, subprocess, email, re

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
    # ---- IMAP: newest LaunchStag codes ----
    try:
        pw = subprocess.check_output(["security", "find-generic-password", "-a", "PRIVATEMAIL_PASSWORD", "-w"], text=True).strip()
        ctx = ssl.create_default_context()
        m = imaplib.IMAP4_SSL("mail.privateemail.com", 993, ssl_context=ctx)
        m.login("nicholas@csoai.org", pw)
        m.select("INBOX")
        typ, data = m.search(None, '(FROM "launchstag")')
        ids = data[0].split()
        codes = []
        for i in ids[-6:]:
            typ, msgd = m.fetch(i, "(RFC822)")
            msg = email.message_from_bytes(msgd[0][1])
            body = ""
            if msg.is_multipart():
                for part in msg.walk():
                    if part.get_content_type() == "text/plain":
                        body = (part.get_payload(decode=True) or b"").decode("utf-8", "replace")
                        break
            else:
                body = (msg.get_payload(decode=True) or b"").decode("utf-8", "replace")
            found = re.findall(r"\b(\d{8})\b", body)
            if found:
                codes.extend(found)
        rec("IMAP", "launchstag-codes", "INSTALLED", f"n_mail={len(ids)} codes={codes[-6:]}")
        m.logout()
    except Exception as e:
        codes = []
        rec("IMAP", "launchstag-codes", "DISCOVERED", str(e)[:150])

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True, channel="chrome")
        ctxb = browser.new_context(
            user_agent=(
                "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 "
                "(KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36"
            )
        )
        page = ctxb.new_page()
        page.set_default_timeout(7000)

        # LaunchStag code entry if we have codes
        if codes:
            try:
                page.goto("https://launchstag.com/claim/ca14035d-7e6e-421a-9eb4-0a1ee5d67768", wait_until="domcontentloaded", timeout=20000)
                time.sleep(1)
                for code in reversed(codes):  # newest first
                    try:
                        loc = page.locator("input").first
                        if loc.count() and loc.is_editable():
                            loc.fill(code)
                            for btn in ["button[type=submit]", "button:has-text('Confirm')", "button:has-text('Verify')", "button:has-text('Continue')"]:
                                try:
                                    b = page.locator(btn).first
                                    if b.count() and b.is_enabled():
                                        b.click(timeout=2000)
                                        break
                                except Exception:
                                    pass
                            time.sleep(1.5)
                            body = page.inner_text("body")[:250]
                            ok = any(x in body.lower() for x in ["success", "claimed", "confirmed", "thank", "live", "verified"])
                            rec("LaunchStag", f"code-{code}", "INDEXED" if ok else "PARTIAL", f"{page.url} :: {body[:120]}")
                            if ok:
                                break
                    except Exception as e:
                        rec("LaunchStag", f"code-{code}", "DISCOVERED", str(e)[:80])
            except Exception as e:
                rec("LaunchStag", "code-flow", "DISCOVERED", str(e)[:120])

        # RevLeads FAQs JS-only
        page.goto(REVLEADS_LOGIN, wait_until="domcontentloaded", timeout=20000)
        u = wait_app(page, 22)
        rec("RevLeads", "landed", "INSTALLED", u)
        dismiss(page)
        goto_step(page, "faqs")
        dismiss(page)

        out = page.evaluate(
            """(text) => {
              const tas = [...document.querySelectorAll('textarea')];
              const ta = tas.find(t => (t.id||'').includes('editor') || (t.className||'').includes('markdown')) || tas[0];
              if (!ta) return {ok:false, why:'no-ta'};
              // native setter — no scroll, no click
              const setter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value').set;
              setter.call(ta, text);
              ta.dispatchEvent(new Event('input', {bubbles:true}));
              ta.dispatchEvent(new Event('change', {bubbles:true}));
              // Ember sometimes wants keyup too
              ta.dispatchEvent(new KeyboardEvent('keyup', {bubbles:true}));
              return {ok: ta.value.length > 20, len: ta.value.length, head: ta.value.slice(0,60), id: ta.id};
            }""",
            FAQ,
        )
        rec("RevLeads", "js-faqs", "INSTALLED" if out.get("ok") else "DISCOVERED", json.dumps(out)[:300])
        faqs_ok = bool(out.get("ok"))

        try:
            b = page.locator("button:has-text('Save and Next'), button:has-text('Save')").first
            if b.count():
                b.click(timeout=2000)
                rec("RevLeads", "save", "INSTALLED", "ok")
        except Exception:
            pass
        time.sleep(0.8)

        goto_step(page, "status")
        dismiss(page)
        ember = False
        try:
            cbs = page.locator("input[type=checkbox]")
            for i in range(min(cbs.count(), 5)):
                cb = cbs.nth(i)
                label = cb.locator("xpath=ancestor::label[1]")
                target = label if label.count() else cb
                box = target.bounding_box()
                if box and box["width"] >= 10:
                    page.mouse.click(box["x"] + 30, box["y"] + box["height"] / 2)
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
                b.click(timeout=3000, force=True)
                submitted = True
        except Exception as e:
            rec("RevLeads", "sub-err", "DISCOVERED", str(e)[:80])
        time.sleep(2.5)
        after = page.inner_text("body")[:500]
        low = after.lower()
        not_yet = "not yet submitted" in low
        ok = any(x in low for x in ["submitted for review", "under review", "in review", "pending", "successfully", "thank"])
        ladder = "INDEXED" if (submitted and ok and not not_yet) else "PARTIAL"
        rec("RevLeads", "FINAL", ladder, f"faqs={faqs_ok} ember={ember} sub={submitted} not_yet={not_yet} ok={ok} :: {after[:180]}")
        try:
            page.screenshot(path="/Users/nicholas/clawd/_alignment/revleads-retry7-20261007.png", full_page=True)
        except Exception:
            pass
        browser.close()

    outp = "/Users/nicholas/clawd/_alignment/REVLEADS-RETRY7-2026-10-07.json"
    with open(outp, "w") as f:
        json.dump(rows, f, indent=2)
    print("wrote", outp, flush=True)


if __name__ == "__main__":
    main()
