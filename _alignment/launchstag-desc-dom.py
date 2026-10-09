#!/usr/bin/env python3
"""LaunchStag Description editor DOM dump + type. No ask."""
from playwright.sync_api import sync_playwright
import time, imaplib, ssl, subprocess, email, re, json

DESC = (
    "GSPC is an open AI measurement board published by CSOAI Ltd (UK, Companies House 16939677). "
    "It measures AI systems on 23 published axes across Governance, Safety, Provenance and Continuity. "
    "Every measurement is a signed card on a public Ed25519 chain; anyone can recompute and verify offline at https://councilof.ai/gspc-verify. "
    "Free MCP: https://councilof.ai/mcp/free (14 tools). Measurement, not certification - we never sell a score, rank, grade, or certificate."
)


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
            body = (part.get_payload(decode=True) or b"").decode("utf-8", "replace") if False else (msg.get_payload(decode=True) or b"").decode("utf-8", "replace")
        found.extend(re.findall(r"\b(\d{8})\b", body))
    m.logout()
    return found


def main():
    with sync_playwright() as p:
        b = p.chromium.launch(headless=True, channel="chrome")
        page = b.new_page()
        page.set_default_timeout(12000)
        before = set(imap_codes())
        page.goto("https://launchstag.com/claim/ca14035d-7e6e-421a-9eb4-0a1ee5d67768", wait_until="domcontentloaded", timeout=25000)
        time.sleep(1)
        page.locator("input[type=email]").first.fill("nicholas@csoai.org")
        page.get_by_role("button", name="Send code", exact=False).first.click()
        time.sleep(2)
        code = None
        for _ in range(12):
            time.sleep(2)
            fresh = [c for c in imap_codes() if c not in before]
            if fresh:
                code = fresh[-1]
                break
        print("CODE", code, flush=True)
        page.locator("input:not([type=email])").first.fill(code)
        page.get_by_role("button", name="Verify", exact=False).first.click()
        time.sleep(3)

        dump = page.evaluate(
            """() => {
              const out = [];
              const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_ELEMENT);
              let n;
              while (n = walker.nextNode()) {
                const t = (n.innerText||'').slice(0,100);
                if (t.includes('0 / 1,000') || t.includes('100 minimum')) {
                  out.push({tag: n.tagName, cls: (n.className||'').toString().slice(0,80), id: n.id||'',
                            html: n.outerHTML.slice(0,500), kids: n.children.length});
                  if (out.length >= 8) break;
                }
              }
              for (const el of document.querySelectorAll('[contenteditable], iframe, .ProseMirror, [role=textbox], .ql-editor, .tiptap, .cm-content, [maxlength="1000"]')) {
                const r = el.getBoundingClientRect();
                out.push({ed: el.tagName, cls: (el.className||'').toString().slice(0,70),
                          ce: el.contentEditable||'', ml: el.getAttribute('maxlength')||'',
                          w: Math.round(r.width), h: Math.round(r.height), ph: el.placeholder||''});
              }
              return out;
            }"""
        )
        print("DUMP", json.dumps(dump)[:1500], flush=True)

        # click the description counter / toolbar then type
        try:
            page.get_by_text("100 minimum", exact=False).first.click(timeout=2000)
            time.sleep(0.3)
            page.keyboard.type(DESC, delay=1)
            print("typed", flush=True)
        except Exception as e:
            print("type-err", e, flush=True)

        r2 = page.evaluate(
            """(text) => {
              for (const el of document.querySelectorAll('[maxlength="1000"]')) {
                el.focus();
                const setter = Object.getOwnPropertyDescriptor(
                  el instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype, 'value'
                ).set;
                setter.call(el, text);
                el.dispatchEvent(new Event('input', {bubbles:true}));
                return 'ml1000:' + el.tagName + ':' + el.value.length;
              }
              const pm = document.querySelector('.ProseMirror');
              if (pm) {
                pm.focus(); pm.innerText = text;
                pm.dispatchEvent(new Event('input', {bubbles:true}));
                return 'pm:' + pm.innerText.length;
              }
              return 'none';
            }""",
            DESC,
        )
        print("R2", r2, flush=True)

        body = page.inner_text("body")
        idx = body.find("Description")
        print("REGION", body[idx : idx + 300].replace("\n", " | ") if idx >= 0 else "no-desc", flush=True)
        page.screenshot(path="/Users/nicholas/clawd/_alignment/launchstag-desc-dom-20261007.png", full_page=True)
        b.close()
    print("done", flush=True)


if __name__ == "__main__":
    main()
