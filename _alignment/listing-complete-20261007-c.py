#!/usr/bin/env python3
"""RevLeads wizard walk to status + LaunchStag code entry."""
from playwright.sync_api import sync_playwright
import json, time, datetime

rows = []

def rec(surface, action, ladder, receipt):
    ts = datetime.datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")
    rows.append(dict(ts=ts, surface=surface, action=action, ladder=ladder, receipt=str(receipt)[:500]))
    print(f"{ts} | {surface} | {action} | {ladder} | {str(receipt)[:170]}")

REVLEADS_LOGIN = (
    "https://vendor.revleads.com/user/login-email?data="
    "IHsgInRva2VuIjoiNDk3NGZhYjU4ZTRmZmYzYWFjYmNlOGY3ZTA1OWEwMjg4MWIxMzJiN2VkMTdiODIwODJkOTMwY2U5Y2M5MTg5YSIsICJlbWFpbCI6Im5pY2hvbGFzQGNzb2FpLm9yZyJ9IA=="
)

def dismiss_overlays(page):
    for sel in ["button:has-text('Got It')", "button:has-text('Got it')", "button:has-text('Close')", "button:has-text('×')", "[aria-label='Close']"]:
        try:
            b = page.locator(sel).first
            if b.count() and b.is_visible():
                b.click(timeout=2000)
                time.sleep(0.3)
        except Exception:
            pass


def fill_brand_pack(page):
    fields = {
        "input[name*=name]": "GSPC",
        "input[name*=tagline]": "Open AI measurement board. Measure, never certify.",
        "input[name*=url], input[name*=website], input[type=url]": "https://councilof.ai",
        "textarea": "GSPC is an open AI measurement board from CSOAI Ltd. What was tested, why a route was allowed, what happened, when the conclusion changed. Measurement, not certification. We never sell a score, rank, grade or certificate.",
    }
    n = 0
    for sel, val in fields.items():
        for part in sel.split(","):
            part = part.strip()
            try:
                loc = page.locator(part).first
                if loc.count() and loc.is_editable():
                    loc.fill(val)
                    n += 1
            except Exception:
                pass
    return n


def click_save_next(page):
    for btn in ["button:has-text('Save and Next')", "button:has-text('Save & Next')", "button:has-text('Next')", "button:has-text('Save')"]:
        try:
            b = page.locator(btn).first
            if b.count() and b.is_enabled():
                b.click(timeout=4000)
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

        # --- LaunchStag: inspect form then enter code ---
        try:
            page.goto("https://launchstag.com/claim/ca14035d-7e6e-421a-9eb4-0a1ee5d67768", wait_until="networkidle", timeout=35000)
            time.sleep(1)
            inputs = page.locator("input")
            n = inputs.count()
            rec("LaunchStag", "input-scan", "INSTALLED", f"n={n}")
            for i in range(min(n, 8)):
                try:
                    inp = inputs.nth(i)
                    meta = page.evaluate(
                        """(el) => ({name: el.name, type: el.type, id: el.id, ph: el.placeholder, cls: el.className})""",
                        inp.element_handle(),
                    )
                    rec("LaunchStag", f"input-{i}", "INSTALLED", str(meta))
                except Exception as e:
                    rec("LaunchStag", f"input-{i}", "DISCOVERED", str(e)[:80])
            # fill first editable text-like input with newest code
            for i in range(min(n, 8)):
                try:
                    inp = inputs.nth(i)
                    if inp.is_editable():
                        inp.click()
                        inp.fill("07995675")
                        rec("LaunchStag", "code-fill", "INSTALLED", f"idx={i}")
                        break
                except Exception:
                    pass
            for btn in ["button:has-text('Confirm')", "button:has-text('Verify')", "button:has-text('Continue')", "button:has-text('Claim')", "button[type=submit]"]:
                try:
                    b = page.locator(btn).first
                    if b.count() and b.is_enabled():
                        b.click(timeout=4000)
                        rec("LaunchStag", "code-submit", "INSTALLED", btn)
                        break
                except Exception:
                    pass
            time.sleep(2)
            after = page.inner_text("body")[:400]
            ok = any(x in after.lower() for x in ["success", "confirmed", "claimed", "thank", "verified", "live"])
            rec("LaunchStag", "code-result", "INDEXED" if ok else "PARTIAL", f"final={page.url} :: {after[:200]}")
        except Exception as e:
            rec("LaunchStag", "code-flow", "DISCOVERED", str(e)[:200])

        # --- RevLeads wizard walk ---
        try:
            page.goto(REVLEADS_LOGIN, wait_until="networkidle", timeout=45000)
            time.sleep(4)
            dismiss_overlays(page)
            rec("RevLeads", "login", "INSTALLED", page.url)

            steps = ["general", "assets", "features", "pricing", "faqs", "status"]
            for step in steps:
                # soft-click wizard tabs if present
                for sel in [f"a[href*='{step}']", f"button:has-text('{step.title()}')", f"a:has-text('{step.title()}')"]:
                    try:
                        loc = page.locator(sel).first
                        if loc.count():
                            loc.click(timeout=3000)
                            time.sleep(1.5)
                            break
                    except Exception:
                        pass
                dismiss_overlays(page)
                filled = fill_brand_pack(page)
                nxt = click_save_next(page)
                time.sleep(1.5)
                dismiss_overlays(page)
                body = page.inner_text("body")[:350]
                rec("RevLeads", f"step-{step}", "INSTALLED", f"url={page.url} filled={filled} via={nxt} :: {body[:140]}")

                if step == "status" or "status" in page.url:
                    # Ember + Submit for Review
                    ember = False
                    cbs = page.locator("input[type=checkbox]")
                    for i in range(min(cbs.count(), 8)):
                        try:
                            cb = cbs.nth(i)
                            cb.scroll_into_view_if_needed()
                            parent = cb.locator("xpath=ancestor::label[1]")
                            box = (parent if parent.count() else cb).bounding_box()
                            if box:
                                page.mouse.click(box["x"] + box["width"] / 2, box["y"] + box["height"] / 2)
                                ember = True
                                rec("RevLeads", f"ember-{i}", "INSTALLED", str(box))
                                break
                        except Exception:
                            pass
                    submitted = False
                    for btn in ["button:has-text('Submit for Review')", "button:has-text('Submit for review')", "button:has-text('Submit')"]:
                        try:
                            b = page.locator(btn).first
                            if b.count() and b.is_enabled():
                                b.scroll_into_view_if_needed()
                                b.click(timeout=5000)
                                submitted = True
                                rec("RevLeads", "submit-click", "INSTALLED", btn)
                                break
                        except Exception as e:
                            rec("RevLeads", "submit-err", "DISCOVERED", str(e)[:80])
                    time.sleep(2.5)
                    after = page.inner_text("body")[:500]
                    low = after.lower()
                    not_yet = "not yet submitted" in low
                    ok = any(x in low for x in ["submitted for review", "under review", "in review", "pending review", "successfully", "thank"])
                    ladder = "INDEXED" if (submitted and ok and not not_yet) else ("PARTIAL" if submitted or ember else "INSTALLED")
                    rec("RevLeads", "SUBMIT-FOR-REVIEW", ladder, f"ember={ember} submitted={submitted} not_yet={not_yet} :: {after[:220]}")
                    break

            # if never hit status, try direct soft path via Save and Next chain already done
            if "status" not in page.url:
                # last attempt: look for any submit for review on current page
                body = page.inner_text("body")[:500]
                rec("RevLeads", "no-status-end", "PARTIAL", f"url={page.url} :: {body[:200]}")

        except Exception as e:
            rec("RevLeads", "wizard", "DISCOVERED", str(e)[:200])

        browser.close()

    out = "/Users/nicholas/clawd/_alignment/LISTING-COMPLETE-2026-10-07-c.json"
    with open(out, "w") as f:
        json.dump(rows, f, indent=2)
    print("wrote", out, "n=", len(rows))


if __name__ == "__main__":
    main()
