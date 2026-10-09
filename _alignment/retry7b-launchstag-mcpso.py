#!/usr/bin/env python3
"""RETRY7b auto — LaunchStag real fill+Verify + mcp.so full submit. No ask."""
from playwright.sync_api import sync_playwright
import json, time, datetime, imaplib, ssl, subprocess, email, re

rows = []

def rec(surface, action, ladder, receipt):
    ts = datetime.datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")
    rows.append(dict(ts=ts, surface=surface, action=action, ladder=ladder, receipt=str(receipt)[:600]))
    print(f"{ts} | {surface} | {action} | {ladder} | {str(receipt)[:170]}", flush=True)


def imap_codes():
    pw = subprocess.check_output(["security", "find-generic-password", "-a", "PRIVATEMAIL_PASSWORD", "-w"], text=True).strip()
    ctx = ssl.create_default_context()
    m = imaplib.IMAP4_SSL("mail.privateemail.com", 993, ssl_context=ctx)
    m.login("nicholas@csoai.org", pw)
    m.select("INBOX")
    typ, data = m.search(None, '(FROM "launchstag")')
    ids = data[0].split()
    found = []
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
        found.extend(re.findall(r"\b(\d{8})\b", body))
    m.logout()
    return found


def kill_ui(page):
    page.evaluate(
        """() => {
          for (const b of document.querySelectorAll('button,a')) {
            const t = (b.innerText||'').toLowerCase();
            if (t.includes('allow all') || t.includes('got it') || t.includes('close') || t.includes('accept')) {
              try { b.click(); } catch(e) {}
            }
          }
        }"""
    )


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
        page.set_default_timeout(12000)

        # ---- LAUNCHSTAG ----
        try:
            before = set(imap_codes())
            page.goto(
                "https://launchstag.com/claim/ca14035d-7e6e-421a-9eb4-0a1ee5d67768",
                wait_until="domcontentloaded",
                timeout=25000,
            )
            time.sleep(1.2)
            kill_ui(page)
            # dump inputs
            infos = page.evaluate(
                """() => [...document.querySelectorAll('input,button')].map(el => ({
                  tag: el.tagName, type: el.type||'', ph: el.placeholder||'',
                  text: (el.innerText||el.value||'').slice(0,30)
                }))"""
            )
            rec("LaunchStag", "dom", "INSTALLED", json.dumps(infos)[:400])

            # step 1 email via locator.fill
            page.locator("input[type=email]").first.fill("nicholas@csoai.org")
            # click Send code specifically
            for label in ["Send code", "Send", "Verify", "Continue"]:
                try:
                    b = page.get_by_role("button", name=label, exact=False).first
                    if b.count():
                        b.click(timeout=3000)
                        rec("LaunchStag", "btn1", "INSTALLED", label)
                        break
                except Exception:
                    pass
            time.sleep(2.5)
            rec("LaunchStag", "step1", "INSTALLED", page.inner_text("body")[:140].replace("\n", " "))

            # step 2: wait for code input (not email)
            code = None
            for _ in range(12):
                time.sleep(2)
                fresh = [c for c in imap_codes() if c not in before]
                if fresh:
                    code = fresh[-1]
                    break
            rec("LaunchStag", "code", "INSTALLED" if code else "DISCOVERED", str(code))

            if code:
                # Playwright fill on non-email input
                locs = page.locator("input:not([type=email])")
                n = locs.count()
                rec("LaunchStag", "code-inputs", "INSTALLED", str(n))
                if n:
                    locs.first.fill(code)
                    val = locs.first.input_value()
                    rec("LaunchStag", "code-val", "INSTALLED", val)
                    for label in ["Verify", "Confirm", "Claim", "Continue", "Submit"]:
                        try:
                            b = page.get_by_role("button", name=label, exact=False).first
                            if b.count() and b.is_enabled():
                                b.click(timeout=3000)
                                rec("LaunchStag", "btn2", "INSTALLED", label)
                                break
                        except Exception:
                            pass
                    time.sleep(3)
                    body = page.inner_text("body")[:450]
                    low = body.lower()
                    ok = any(x in low for x in ["success", "claimed", "confirmed", "congrat", "now live", "published", "listing is live"])
                    if "we sent a verification" in low:
                        ok = False
                    rec("LaunchStag", "FINAL", "INDEXED" if ok else "PARTIAL", f"{body[:200].replace(chr(10),' ')}")
        except Exception as e:
            rec("LaunchStag", "ERR", "DISCOVERED", str(e)[:180])

        # ---- MCP.SO full submit ----
        try:
            page.goto("https://mcp.so/submit?type=server", wait_until="domcontentloaded", timeout=25000)
            time.sleep(2)
            kill_ui(page)
            infos = page.evaluate(
                """() => {
                  const out = [];
                  for (const el of document.querySelectorAll('input,textarea,select,button')) {
                    const r = el.getBoundingClientRect();
                    out.push({tag: el.tagName, type: el.type||'', name: el.name||'', id: el.id||'',
                              ph: el.placeholder||'', text: (el.innerText||el.value||'').slice(0,40),
                              vis: r.width>0 && r.height>0});
                  }
                  return out;
                }"""
            )
            rec("mcp.so", "dom", "INSTALLED", json.dumps(infos)[:550])
            filled = 0
            for sel, val in [
                ("input[name*='name' i]", "GSPC"),
                ("input[name*='title' i]", "GSPC"),
                ("input[type=url]", "https://councilof.ai"),
                ("input[name*='url' i]", "https://councilof.ai/mcp/free"),
                ("input[name*='repo' i]", "https://councilof.ai"),
                ("input[type=email]", "nicholas@csoai.org"),
                ("textarea", "GSPC is an open AI measurement board from CSOAI Ltd. 23 axes measured, Ed25519-signed cards, free MCP (14 tools) at https://councilof.ai/mcp/free. Measurement, not certification."),
            ]:
                try:
                    loc = page.locator(sel)
                    for i in range(min(loc.count(), 2)):
                        el = loc.nth(i)
                        if el.is_editable():
                            el.fill(val)
                            filled += 1
                except Exception:
                    pass
            # submit
            sub = None
            for label in ["Submit", "Publish", "Add", "Send"]:
                try:
                    b = page.get_by_role("button", name=label, exact=False).first
                    if b.count() and b.is_enabled():
                        b.click(timeout=3000)
                        sub = label
                        break
                except Exception:
                    pass
            time.sleep(3)
            after = page.inner_text("body")[:400]
            low = after.lower()
            ok = any(x in low for x in ["thank", "submitted", "received", "success", "pending", "review"])
            ladder = "INDEXED" if (sub and filled and ok) else ("PARTIAL" if sub or filled else "DISCOVERED")
            rec("mcp.so", "FINAL", ladder, f"filled={filled} sub={sub} ok={ok} :: {after[:180].replace(chr(10),' ')}")
        except Exception as e:
            rec("mcp.so", "ERR", "DISCOVERED", str(e)[:180])

        try:
            page.screenshot(path="/Users/nicholas/clawd/_alignment/retry7b-20261007.png", full_page=True)
        except Exception:
            pass
        browser.close()

    out = "/Users/nicholas/clawd/_alignment/RETRY7B-2026-10-07.json"
    with open(out, "w") as f:
        json.dump(rows, f, indent=2)
    print("wrote", out, flush=True)


if __name__ == "__main__":
    main()
