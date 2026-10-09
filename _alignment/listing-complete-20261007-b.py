#!/usr/bin/env python3
"""Follow-up: LaunchStag codes, SaaSHub full-token verify, RevLeads SPA-soft nav."""
from playwright.sync_api import sync_playwright
import json, time, datetime

rows = []

def rec(surface, action, ladder, receipt):
    ts = datetime.datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")
    rows.append(dict(ts=ts, surface=surface, action=action, ladder=ladder, receipt=str(receipt)[:500]))
    print(f"{ts} | {surface} | {action} | {ladder} | {str(receipt)[:160]}")

SAASHUB_FULL_TOKEN = (
    "https://www.saashub.com/token-login/"
    "zICBpl9yYWlsc4OkZGF0Yc4ABJzUo2V4cMcLB85qtQ1azhe9WnQAo3B1cqt0b2tlbl9s"
)
LAUNCHSTAG_CLAIM = "https://launchstag.com/claim/ca14035d-7e6e-421a-9eb4-0a1ee5d67768"
LAUNCHSTAG_CODES = ["07995675", "43027340"]  # newest first
REVLEADS_LOGIN = (
    "https://vendor.revleads.com/user/login-email?data="
    "IHsgInRva2VuIjoiNDk3NGZhYjU4ZTRmZmYzYWFjYmNlOGY3ZTA1OWEwMjg4MWIxMzJiN2VkMTdiODIwODJkOTMwY2U5Y2M5MTg5YSIsICJlbWFpbCI6Im5pY2hvbGFzQGNzb2FpLm9yZyJ9IA=="
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

        # --- LaunchStag claim + verification codes ---
        try:
            page.goto(LAUNCHSTAG_CLAIM, wait_until="networkidle", timeout=35000)
            time.sleep(1.5)
            title = page.title()
            text = page.inner_text("body")[:500]
            rec("LaunchStag", "claim-page", "INSTALLED", f"title={title} :: {text[:160]}")
            filled = False
            for code in LAUNCHSTAG_CODES:
                for sel in [
                    "input[name*=code]",
                    "input[name*=verif]",
                    "input[placeholder*=code]",
                    "input[placeholder*=Code]",
                    "input[type=text]",
                    "input[type=tel]",
                    "input[type=number]",
                ]:
                    try:
                        loc = page.locator(sel).first
                        if loc.count() and loc.is_editable():
                            loc.fill(code)
                            filled = True
                            rec("LaunchStag", f"code-{code}", "INSTALLED", f"filled {sel}")
                            break
                    except Exception:
                        pass
                if filled:
                    break
            submitted = False
            for btn in [
                "button:has-text('Confirm')",
                "button:has-text('Verify')",
                "button:has-text('Submit')",
                "button:has-text('Continue')",
                "button[type=submit]",
            ]:
                try:
                    b = page.locator(btn).first
                    if b.count() and b.is_enabled():
                        b.click(timeout=4000)
                        submitted = True
                        break
                except Exception:
                    pass
            time.sleep(2)
            after = page.inner_text("body")[:400]
            ok = any(x in after.lower() for x in ["success", "confirmed", "claimed", "thank", "live", "published"])
            ladder = "INDEXED" if (submitted and filled and ok) else ("PARTIAL" if submitted or filled else "INSTALLED")
            rec("LaunchStag", "code-submit", ladder, f"filled={filled} submitted={submitted} final={page.url} :: {after[:180]}")
        except Exception as e:
            rec("LaunchStag", "claim", "DISCOVERED", str(e)[:200])

        # --- SaaSHub full token login + verify flow ---
        try:
            page.goto(SAASHUB_FULL_TOKEN, wait_until="domcontentloaded", timeout=30000)
            time.sleep(2)
            rec("SaaSHub", "full-token-login", "INSTALLED", f"final={page.url} title={page.title()}")
            # go to verify page while session may be live
            page.goto("https://www.saashub.com/verify/council-of-ai", wait_until="domcontentloaded", timeout=30000)
            time.sleep(1.5)
            text = page.inner_text("body")[:600]
            rec("SaaSHub", "verify-page", "INSTALLED", text[:250])
            # look for verify/email form
            filled = 0
            for sel, val in [
                ("input[type=email]", "nicholas@councilof.ai"),
                ("input[name*=email]", "nicholas@councilof.ai"),
                ("input[name*=domain]", "councilof.ai"),
            ]:
                try:
                    loc = page.locator(sel).first
                    if loc.count() and loc.is_editable():
                        loc.fill(val)
                        filled += 1
                except Exception:
                    pass
            clicked = False
            for btn in [
                "button:has-text('Verify')",
                "button:has-text('Send')",
                "button:has-text('Confirm')",
                "button:has-text('Submit')",
                "input[type=submit]",
            ]:
                try:
                    b = page.locator(btn).first
                    if b.count() and b.is_enabled():
                        b.click(timeout=4000)
                        clicked = True
                        break
                except Exception:
                    pass
            time.sleep(1.5)
            after = page.inner_text("body")[:350]
            ladder = "INDEXED" if clicked and filled else ("PARTIAL" if filled or clicked else "INSTALLED")
            rec("SaaSHub", "verify-action", ladder, f"filled={filled} clicked={clicked} final={page.url} :: {after[:180]}")
        except Exception as e:
            rec("SaaSHub", "verify", "DISCOVERED", str(e)[:200])

        # --- RevLeads: soft SPA nav, no hard goto after magic ---
        try:
            # open login-email in same tab, wait for SPA settle
            page.goto(REVLEADS_LOGIN, wait_until="networkidle", timeout=45000)
            time.sleep(4)  # let SPA finish /loading
            rec("RevLeads", "magic-login-settled", "INSTALLED", f"url={page.url}")
            # soft navigations only (click, never goto)
            for sel in [
                "a[href*='status']",
                "a[href*='listing']",
                "a:has-text('Status')",
                "a:has-text('Listing')",
                "a:has-text('Dashboard')",
                "nav a",
            ]:
                try:
                    loc = page.locator(sel).first
                    if loc.count():
                        loc.click(timeout=3000)
                        time.sleep(2)
                        break
                except Exception:
                    pass
            rec("RevLeads", "soft-nav", "INSTALLED", f"url={page.url} title={page.title()}")
            body = page.inner_text("body")[:800]
            rec("RevLeads", "status-body", "INSTALLED", body[:300])

            # Ember checkbox — real pointer on wrapping label
            ember_ok = False
            try:
                # find any checkbox
                cbs = page.locator("input[type=checkbox]")
                n = cbs.count()
                rec("RevLeads", "checkbox-count", "INSTALLED", f"n={n}")
                for i in range(min(n, 6)):
                    cb = cbs.nth(i)
                    try:
                        cb.scroll_into_view_if_needed()
                        # wrapping label
                        parent = cb.locator("xpath=ancestor::label[1]")
                        if parent.count():
                            box = parent.bounding_box()
                        else:
                            box = cb.bounding_box()
                        if box:
                            page.mouse.click(box["x"] + box["width"] / 2, box["y"] + box["height"] / 2)
                            ember_ok = True
                            rec("RevLeads", f"ember-label-click-{i}", "INSTALLED", f"box={box}")
                            break
                    except Exception as e:
                        rec("RevLeads", f"ember-{i}", "DISCOVERED", str(e)[:100])
            except Exception as e:
                rec("RevLeads", "ember-scan", "DISCOVERED", str(e)[:150])

            # Submit for Review
            submitted = False
            for btn in [
                "button:has-text('Submit for Review')",
                "button:has-text('Submit for review')",
                "a:has-text('Submit for Review')",
                "button:has-text('Submit')",
            ]:
                try:
                    b = page.locator(btn).first
                    if b.count() and b.is_enabled():
                        b.scroll_into_view_if_needed()
                        b.click(timeout=5000)
                        submitted = True
                        rec("RevLeads", "submit-click", "INSTALLED", btn)
                        break
                except Exception as e:
                    rec("RevLeads", "submit-err", "DISCOVERED", str(e)[:100])
            time.sleep(2.5)
            after = page.inner_text("body")[:500]
            low = after.lower()
            not_yet = "not yet submitted" in low
            ok = any(x in low for x in ["submitted for review", "under review", "in review", "pending review", "thank you", "successfully"])
            ladder = "INDEXED" if (submitted and ok and not not_yet) else ("PARTIAL" if submitted or ember_ok else "INSTALLED")
            rec("RevLeads", "final-submit", ladder, f"ember={ember_ok} submitted={submitted} not_yet={not_yet} final={page.url} :: {after[:220]}")
        except Exception as e:
            rec("RevLeads", "ember-flow", "DISCOVERED", str(e)[:200])

        browser.close()

    out = "/Users/nicholas/clawd/_alignment/LISTING-COMPLETE-2026-10-07-b.json"
    with open(out, "w") as f:
        json.dump(rows, f, indent=2)
    print("wrote", out, "n=", len(rows))


if __name__ == "__main__":
    main()
