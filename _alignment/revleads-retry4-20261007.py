#!/usr/bin/env python3
"""RevLeads RETRY4. Feature checkboxes + price 0 + FAQs markdown + Ember + Submit."""
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

FEATURE_KEYWORDS = [
    "api", "mcp", "free", "developer", "open", "analytics", "dashboard",
    "integration", "webhook", "export", "report", "audit", "security",
    "compliance", "measurement", "evidence", "verification", "public",
]


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


def save_next(page):
    for btn in ["button:has-text('Save and Next')", "button:has-text('Save & Next')", "button:has-text('Save')"]:
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

        page.goto(REVLEADS_LOGIN, wait_until="domcontentloaded", timeout=20000)
        u = wait_app(page, 22)
        rec("RevLeads", "landed", "INSTALLED", u)
        dismiss(page)

        # ---- FEATURES: dump checkboxes, tick relevant ----
        goto_step(page, "features")
        dismiss(page)
        try:
            infos = page.evaluate(
                """() => {
                  const out = [];
                  for (const el of document.querySelectorAll('input[type=checkbox]')) {
                    const lab = el.closest('label');
                    const r = el.getBoundingClientRect();
                    out.push({
                      id: el.id||'', name: el.name||'',
                      label: (lab ? lab.innerText : (el.parentElement ? el.parentElement.innerText : '')).slice(0,80).replace(/\\n/g,' '),
                      checked: el.checked, w: Math.round(r.width), h: Math.round(r.height),
                      visible: r.width>0 && r.height>0
                    });
                  }
                  return out;
                }"""
            )
            rec("RevLeads", "feature-cbs", "INSTALLED", json.dumps(infos)[:550])
            ticked = 0
            for i, info in enumerate(infos):
                if not info.get("visible"):
                    continue
                lab = (info.get("label") or "").lower()
                if any(k in lab for k in FEATURE_KEYWORDS) or not lab:
                    try:
                        cb = page.locator("input[type=checkbox]").nth(i)
                        cb.scroll_into_view_if_needed()
                        parent = cb.locator("xpath=ancestor::label[1]")
                        target = parent if parent.count() else cb
                        box = target.bounding_box()
                        if box and box["width"] >= 8:
                            page.mouse.click(box["x"] + min(box["width"] / 2, 30), box["y"] + box["height"] / 2)
                            ticked += 1
                            time.sleep(0.15)
                    except Exception:
                        pass
            rec("RevLeads", "features-tick", "INSTALLED", f"ticked={ticked}")
        except Exception as e:
            rec("RevLeads", "features-err", "DISCOVERED", str(e)[:120])
        via = save_next(page)
        rec("RevLeads", "features-save", "INSTALLED", f"via={via} url={page.url}")

        # ---- PRICING: free tier price 0 + description ----
        goto_step(page, "pricing")
        dismiss(page)
        try:
            infos = page.evaluate(
                """() => {
                  const out = [];
                  for (const el of document.querySelectorAll('input,textarea')) {
                    const r = el.getBoundingClientRect();
                    out.push({tag: el.tagName, id: el.id||'', name: el.name||'', type: el.type||'',
                              ph: el.placeholder||'', val: (el.value||'').slice(0,30),
                              w: Math.round(r.width), visible: r.width>0 && r.height>0});
                  }
                  return out;
                }"""
            )
            rec("RevLeads", "pricing-fields", "INSTALLED", json.dumps(infos)[:500])
            filled = 0
            for info in infos:
                if not info.get("visible") or info.get("w", 0) < 20:
                    continue
                key = (info.get("id", "") + info.get("name", "") + info.get("ph", "")).lower()
                sel = f"#{info['id']}" if info.get("id") else None
                if not sel:
                    continue
                loc = page.locator(sel).first
                try:
                    if not loc.count() or not loc.is_editable():
                        continue
                    if "price" in key or "19.99" in info.get("ph", "") or info.get("type") in ("number", "text") and "e.g." in info.get("ph", ""):
                        loc.fill("0")
                        filled += 1
                    elif info["tag"] == "TEXTAREA":
                        loc.fill("Free to read and verify. Free MCP door (14 tools). x402 pay-per-evidence on the full door (5 metered tools). Paid artefacts are signed evidence for already-measured work.")
                        filled += 1
                except Exception:
                    pass
            # fallback any number/text with e.g. 19.99
            try:
                loc = page.locator("input[placeholder*='19.99']").first
                if loc.count() and loc.is_editable():
                    loc.fill("0")
                    filled += 1
            except Exception:
                pass
            rec("RevLeads", "pricing-fill", "INSTALLED", f"filled={filled}")
        except Exception as e:
            rec("RevLeads", "pricing-err", "DISCOVERED", str(e)[:120])
        via = save_next(page)
        rec("RevLeads", "pricing-save", "INSTALLED", f"via={via} url={page.url}")

        # ---- FAQS: markdown editor ----
        goto_step(page, "faqs")
        dismiss(page)
        try:
            # fill every visible textarea / markdown editor
            filled = 0
            tas = page.locator("textarea")
            for i in range(tas.count()):
                el = tas.nth(i)
                try:
                    box = el.bounding_box()
                    if box and box["width"] > 40 and el.is_editable():
                        el.click()
                        el.fill(FAQ_MD)
                        filled += 1
                except Exception:
                    pass
            rec("RevLeads", "faqs-fill", "INSTALLED", f"filled={filled}")
        except Exception as e:
            rec("RevLeads", "faqs-err", "DISCOVERED", str(e)[:120])
        via = save_next(page)
        rec("RevLeads", "faqs-save", "INSTALLED", f"via={via} url={page.url}")

        # ---- STATUS: Ember + Submit ----
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
                    rec("RevLeads", f"ember-{i}", "INSTALLED", f"checked={checked} box={box}")
                    break
        except Exception as e:
            rec("RevLeads", "ember-err", "DISCOVERED", str(e)[:100])

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
        ok = any(x in low for x in ["submitted for review", "under review", "in review", "pending review", "successfully", "thank"])
        ladder = "INDEXED" if (submitted and ok and not not_yet) else ("PARTIAL" if submitted or ember else "INSTALLED")
        rec("RevLeads", "FINAL", ladder, f"ember={ember} submitted={submitted} not_yet={not_yet} ok={ok} :: {after[:250]}")

        try:
            page.screenshot(path="/Users/nicholas/clawd/_alignment/revleads-retry4-20261007.png", full_page=True)
        except Exception:
            pass

        browser.close()

    out = "/Users/nicholas/clawd/_alignment/REVLEADS-RETRY4-2026-10-07.json"
    with open(out, "w") as f:
        json.dump(rows, f, indent=2)
    print("wrote", out, "n=", len(rows), flush=True)


if __name__ == "__main__":
    main()
