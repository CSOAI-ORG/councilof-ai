#!/usr/bin/env python3
"""RevLeads RETRY3. Wait out /loading. Dump real field names. Fill each step. Ember + Submit."""
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

NAME = "GSPC"
TAGLINE = "Open AI measurement board — we measure, never certify"
MEDIUM = (
    "GSPC (Governance · Safety · Provenance · Continuity) is CSOAI's open measurement board for AI systems. "
    "We run frozen, published tests and sign the results so anyone can recompute and challenge them. "
    "Free MCP door: https://councilof.ai/mcp/free (14 tools). "
    "Measurement, not certification — we never sell a score, rank, grade, or certificate."
)
FEATURES = (
    "23 measured axes. Ed25519-signed cards. Offline verify at /gspc-verify. "
    "Free MCP (14 tools) at /mcp/free. Board API CC-BY-4.0 at /api/gspc. Public correction ledger. "
    "Measurement, not certification."
)
PRICING = (
    "Free to read and verify. Free MCP door (14 tools). "
    "x402 pay-per-evidence on the full door (5 metered tools)."
)
FAQS = (
    "Q: What is GSPC? A: CSOAI Ltd's open AI measurement board — signed, re-checkable measurements.\n"
    "Q: Is it a certification? A: No. Measurement, not certification. We never sell a score, rank, grade, or certificate.\n"
    "Q: How many axes? A: 23 axes measured (derived from councilof.ai/api/gspc).\n"
    "Q: How to verify? A: councilof.ai/gspc-verify — Ed25519, offline."
)
WEBSITE = "https://councilof.ai"
EMAIL = "nicholas@csoai.org"
COMPANY = "CSOAI Ltd"


def dismiss(page):
    for sel in ["button:has-text('Got It')", "button:has-text('Got it')", "button:has-text('Close')", "[aria-label='Close']"]:
        try:
            b = page.locator(sel).first
            if b.count() and b.is_visible():
                b.click(timeout=600)
        except Exception:
            pass


def wait_spa(page, timeout_s=20):
    """Wait until URL leaves /loading and lands on /app/gspc"""
    t0 = time.time()
    while time.time() - t0 < timeout_s:
        u = page.url
        if "/app/gspc" in u and "/loading" not in u:
            return u
        time.sleep(0.5)
    return page.url


def dump_fields(page, step):
    try:
        info = page.evaluate(
            """() => {
              const out = [];
              for (const el of document.querySelectorAll('input,textarea,select')) {
                const r = el.getBoundingClientRect();
                out.push({
                  tag: el.tagName, name: el.name||'', id: el.id||'', type: el.type||'',
                  ph: el.placeholder||'', cls: (el.className||'').toString().slice(0,60),
                  val: (el.value||'').slice(0,40), w: Math.round(r.width), h: Math.round(r.height),
                  visible: r.width>0 && r.height>0
                });
              }
              return out;
            }"""
        )
        rec("RevLeads", f"fields-{step}", "INSTALLED", json.dumps(info)[:550])
        return info
    except Exception as e:
        rec("RevLeads", f"fields-{step}", "DISCOVERED", str(e)[:120])
        return []


def fill_visible(page, pairs):
    n = 0
    for sel, val in pairs:
        try:
            loc = page.locator(sel)
            cnt = loc.count()
            for i in range(cnt):
                el = loc.nth(i)
                try:
                    box = el.bounding_box()
                    if not box or box["width"] < 20 or box["height"] < 10:
                        continue
                    if el.is_editable():
                        el.click(timeout=1000)
                        el.fill(val)
                        n += 1
                except Exception:
                    pass
        except Exception:
            pass
    return n


def save_next(page):
    for btn in ["button:has-text('Save and Next')", "button:has-text('Save & Next')", "button:has-text('Save')", "button:has-text('Next')"]:
        try:
            b = page.locator(btn).first
            if b.count() and b.is_enabled():
                b.click(timeout=2000)
                return btn
        except Exception:
            pass
    return None


def goto_step(page, step):
    # soft click only
    for sel in [
        f"a[href*='{step}']",
        f"button:has-text('{step.title()}')",
        f"a:has-text('{step.title()}')",
        f"text={step.title()}",
    ]:
        try:
            loc = page.locator(sel).first
            if loc.count():
                loc.click(timeout=2000)
                time.sleep(1.0)
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
        u = wait_spa(page, 25)
        rec("RevLeads", "spa-settled", "INSTALLED", u)
        dismiss(page)

        step_payloads = {
            "general": [
                ("input", NAME),  # will refine after dump
                ("textarea", MEDIUM),
                ("input[type=email]", EMAIL),
                ("input[type=url]", WEBSITE),
            ],
            "assets": [
                ("textarea", "Logo and board screenshots at https://councilof.ai/"),
                ("input[type=url]", WEBSITE),
            ],
            "features": [("textarea", FEATURES)],
            "pricing": [
                ("textarea", PRICING),
                ("input", "Free · x402 pay-per-evidence"),
            ],
            "faqs": [("textarea", FAQS)],
        }

        for step in ["general", "assets", "features", "pricing", "faqs"]:
            goto_step(page, step)
            dismiss(page)
            u = page.url
            fields = dump_fields(page, step)
            # smarter fill: match by name/id/placeholder keywords
            filled = 0
            for f in fields:
                if not f.get("visible") or f.get("w", 0) < 20:
                    continue
                key = (f.get("name", "") + f.get("id", "") + f.get("ph", "") + f.get("cls", "")).lower()
                val = None
                if any(x in key for x in ["name", "title", "product"]) and "company" not in key:
                    val = NAME
                elif "tagline" in key or "tag" in key:
                    val = TAGLINE
                elif any(x in key for x in ["url", "website", "link", "domain"]):
                    val = WEBSITE
                elif "email" in key:
                    val = EMAIL
                elif any(x in key for x in ["company", "vendor", "org"]):
                    val = COMPANY
                elif f["tag"] == "TEXTAREA":
                    if step == "features":
                        val = FEATURES
                    elif step == "pricing":
                        val = PRICING
                    elif step == "faqs":
                        val = FAQS
                    elif step == "assets":
                        val = "Public board screenshots and logo at https://councilof.ai/"
                    else:
                        val = MEDIUM
                elif "price" in key or "pricing" in key:
                    val = "Free · x402 pay-per-evidence"
                if not val:
                    continue
                try:
                    sel = f"#{f['id']}" if f.get("id") else (f"[name='{f['name']}']" if f.get("name") else None)
                    if not sel:
                        continue
                    loc = page.locator(sel).first
                    if loc.count() and loc.is_editable():
                        loc.fill(val)
                        filled += 1
                except Exception:
                    pass
            # fallback generic
            if filled == 0:
                filled = fill_visible(page, step_payloads.get(step, []))
            via = save_next(page)
            time.sleep(1.0)
            rec("RevLeads", f"fill-{step}", "INSTALLED", f"url={u} filled={filled} via={via}")

        # status
        goto_step(page, "status")
        dismiss(page)
        u = page.url
        dump_fields(page, "status")

        # Ember real pointer
        ember = False
        try:
            cbs = page.locator("input[type=checkbox]")
            rec("RevLeads", "cb-count", "INSTALLED", str(cbs.count()))
            for i in range(min(cbs.count(), 8)):
                cb = cbs.nth(i)
                cb.scroll_into_view_if_needed()
                label = cb.locator("xpath=ancestor::label[1]")
                target = label if label.count() else cb
                box = target.bounding_box()
                if not box or box["width"] < 10:
                    continue
                page.mouse.click(box["x"] + min(box["width"] / 2, 40), box["y"] + box["height"] / 2)
                time.sleep(0.3)
                try:
                    checked = cb.is_checked()
                except Exception:
                    checked = None
                ember = True
                rec("RevLeads", f"ember-{i}", "INSTALLED", f"box={box} checked={checked}")
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
            page.screenshot(path="/Users/nicholas/clawd/_alignment/revleads-retry3-20261007.png", full_page=True)
        except Exception:
            pass

        browser.close()

    out = "/Users/nicholas/clawd/_alignment/REVLEADS-RETRY3-2026-10-07.json"
    with open(out, "w") as f:
        json.dump(rows, f, indent=2)
    print("wrote", out, "n=", len(rows), flush=True)


if __name__ == "__main__":
    main()
