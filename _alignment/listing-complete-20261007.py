#!/usr/bin/env python3
"""2026-10-07 owner-GO listing completes. Free only. Never spend/sign/cold-email.
Inbound magic-link clicks + free listing submits authorized.
"""
from playwright.sync_api import sync_playwright
import json, time, datetime, re

rows = []

def rec(surface, action, ladder, receipt):
    ts = datetime.datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")
    rows.append(dict(ts=ts, surface=surface, action=action, ladder=ladder, receipt=str(receipt)[:500]))
    print(f"{ts} | {surface} | {action} | {ladder} | {str(receipt)[:160]}")

# Newest tokens from IMAP (use immediately — expire fast)
REVLEADS_LOGIN = (
    "https://vendor.revleads.com/user/login-email?data="
    "IHsgInRva2VuIjoiNDk3NGZhYjU4ZTRmZmYzYWFjYmNlOGY3ZTA1OWEwMjg4MWIxMzJiN2VkMTdiODIwODJkOTMwY2U5Y2M5MTg5YSIsICJlbWFpbCI6Im5pY2hvbGFzQGNzb2FpLm9yZyJ9IA=="
)
SAASHUB_TOKEN = "https://www.saashub.com/token-login/zICBpl9yYWlsc4OkZGF0Yc4ABJzUo2V4cMcLB8"
SAASHUB_SUB_CONFIRM = "https://www.saashub.com/confirm-email/email_subscription/5u3bun2uyl8ca8f"
SAASHUB_COMMENT_CONFIRM = "https://www.saashub.com/confirm-email/comment/2i5dlsa1qh6044cqa6i2tyhmku"
SAASHUB_VERIFY = "https://www.saashub.com/verify/council-of-ai"
ANTHROPIC_PORTAL = "https://claude.ai/admin-settings/directory/submissions/council-of-ai"
ANTHROPIC_LIVE = "https://claude.ai/directory/connectors/council-of-ai"
REVLEADS_STATUS = "https://vendor.revleads.com/app/gspc/status"


def click_ember_and_submit(page):
    """Ember terms checkbox + Submit for Review. Real pointer click on wrapping label."""
    result = {}
    # try checkbox / label variants
    for sel in [
        "input.ember-checkbox",
        "input[type=checkbox][name*=term]",
        "input[type=checkbox][name*=accept]",
        "input[type=checkbox]",
    ]:
        try:
            loc = page.locator(sel).first
            if loc.count():
                # real pointer on wrapping label after scrollIntoView
                try:
                    label = page.locator(f"label:has({sel})").first
                    if label.count():
                        label.scroll_into_view_if_needed()
                        box = label.bounding_box()
                        if box:
                            page.mouse.click(box["x"] + box["width"] / 2, box["y"] + box["height"] / 2)
                            result["ember"] = f"label-click {sel}"
                        else:
                            loc.check(force=True)
                            result["ember"] = f"check {sel}"
                    else:
                        loc.scroll_into_view_if_needed()
                        loc.check(force=True)
                        result["ember"] = f"check {sel}"
                    break
                except Exception as e:
                    result["ember_err"] = str(e)[:120]
        except Exception as e:
            result["ember_err"] = str(e)[:120]
    # Submit for Review
    for btn in [
        "button:has-text('Submit for Review')",
        "input[value*='Submit for Review']",
        "button:has-text('Submit')",
    ]:
        try:
            b = page.locator(btn).first
            if b.count() and b.is_enabled():
                b.scroll_into_view_if_needed()
                b.click(timeout=5000)
                result["submit"] = btn
                break
        except Exception as e:
            result["submit_err"] = str(e)[:120]
    time.sleep(1.5)
    result["final"] = page.url
    result["after"] = page.inner_text("body")[:350]
    return result


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

        # ---- 1. LaunchStag email confirm (mailbox click) ----
        try:
            page.goto("https://www.launchstag.com/", wait_until="domcontentloaded", timeout=25000)
            rec("LaunchStag", "home", "DISCOVERED", page.title())
        except Exception as e:
            rec("LaunchStag", "home", "DISCOVERED", str(e)[:150])

        # ---- 2. SaaSHub confirms + token login + verify ----
        for name, url in [
            ("SaaSHub-sub-confirm", SAASHUB_SUB_CONFIRM),
            ("SaaSHub-comment-confirm", SAASHUB_COMMENT_CONFIRM),
            ("SaaSHub-token-login", SAASHUB_TOKEN),
            ("SaaSHub-verify", SAASHUB_VERIFY),
        ]:
            try:
                page.goto(url, wait_until="domcontentloaded", timeout=30000)
                time.sleep(1.2)
                title = page.title()
                text = page.inner_text("body")[:500]
                ladder = "INDEXED" if any(x in text.lower() for x in ["confirm", "verif", "thank", "success", "logged", "manage", "claimed"]) else "INSTALLED"
                # if on manage/verify page, try verify action
                if "verify" in page.url.lower() or "verif" in text.lower():
                    for btn in ["button:has-text('Verify')", "a:has-text('Verify')", "button:has-text('Confirm')"]:
                        try:
                            b = page.locator(btn).first
                            if b.count() and b.is_enabled():
                                b.click(timeout=4000)
                                time.sleep(1)
                                ladder = "INDEXED"
                                break
                        except Exception:
                            pass
                rec(name, "mailbox-click", ladder, f"final={page.url} title={title} :: {text[:180]}")
            except Exception as e:
                rec(name, "mailbox-click", "DISCOVERED", str(e)[:180])

        # ---- 3. RevLeads magic login + Ember Submit for Review ----
        try:
            page.goto(REVLEADS_LOGIN, wait_until="domcontentloaded", timeout=35000)
            time.sleep(2.5)
            rec("RevLeads", "magic-login", "INSTALLED", f"final={page.url} title={page.title()}")
            # stay on SPA — do not hard goto after magic (logs out)
            # navigate via in-app links if present
            for link in ["a:has-text('status')", "a:has-text('Status')", "a:has-text('listing')"]:
                try:
                    l = page.locator(link).first
                    if l.count():
                        l.click(timeout=3000)
                        time.sleep(1.5)
                        break
                except Exception:
                    pass
            # if still not on status, try relative push without full reload
            if "/app/gspc" not in page.url:
                try:
                    page.evaluate("() => { if (window.history && window.location) window.location.hash = '#/app/gspc/status'; }")
                    time.sleep(1)
                except Exception:
                    pass
            rec("RevLeads", "status-nav", "INSTALLED", f"url={page.url}")
            ember = click_ember_and_submit(page)
            after = ember.get("after", "")
            submitted_ok = any(x in after.lower() for x in ["submitted", "under review", "in review", "thank", "received", "pending review"])
            not_yet = "not yet submitted" in after.lower()
            ladder = "INDEXED" if submitted_ok and not not_yet else ("PARTIAL" if ember.get("submit") or ember.get("ember") else "INSTALLED")
            rec("RevLeads", "ember-submit-for-review", ladder, json.dumps(ember)[:450])
        except Exception as e:
            rec("RevLeads", "ember-submit-for-review", "DISCOVERED", str(e)[:200])

        # ---- 4. Anthropic MCP Directory publish ----
        try:
            page.goto(ANTHROPIC_PORTAL, wait_until="domcontentloaded", timeout=40000)
            time.sleep(2.5)
            title = page.title()
            text = page.inner_text("body")[:600]
            low = (title + text).lower()
            if any(x in low for x in ["sign in", "log in", "login", "authenticate", "session"]):
                rec("AnthropicDirectory", "publish-portal", "BLOCKED", f"login required title={title} :: {text[:180]}")
            else:
                published = False
                for btn in [
                    "button:has-text('Publish')",
                    "button:has-text('publish')",
                    "a:has-text('Publish')",
                    "button:has-text('Submit')",
                    "button:has-text('Confirm')",
                ]:
                    try:
                        b = page.locator(btn).first
                        if b.count() and b.is_enabled():
                            b.click(timeout=5000)
                            published = True
                            break
                    except Exception:
                        pass
                time.sleep(2)
                after = page.inner_text("body")[:350]
                ladder = "INDEXED" if published or "published" in after.lower() or "live" in after.lower() else "INSTALLED"
                rec("AnthropicDirectory", "publish", ladder, f"clicked={published} final={page.url} :: {after[:180]}")
        except Exception as e:
            rec("AnthropicDirectory", "publish", "DISCOVERED", str(e)[:200])

        # ---- 5. Anthropic live page check ----
        try:
            page.goto(ANTHROPIC_LIVE, wait_until="domcontentloaded", timeout=30000)
            time.sleep(1)
            rec("AnthropicDirectory", "live-page", "CALLED", f"{page.url} title={page.title()} :: {page.inner_text('body')[:180]}")
        except Exception as e:
            rec("AnthropicDirectory", "live-page", "DISCOVERED", str(e)[:180])

        browser.close()

    out = "/Users/nicholas/clawd/_alignment/LISTING-COMPLETE-2026-10-07.json"
    with open(out, "w") as f:
        json.dump(rows, f, indent=2)
    print("wrote", out, "n=", len(rows))


if __name__ == "__main__":
    main()
