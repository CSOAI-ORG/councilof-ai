#!/usr/bin/env python3
"""
x402-bazaar-audit.py — Audit all x402 doors: 402 status, accepts[], extensions.bazaar.

Usage: python3 scripts/interop/x402-bazaar-audit.py > /tmp/bazaar-audit.txt

Checks each door in /.well-known/x402.json:
  - HTTP status must be 402
  - Body must carry accepts[]
  - Body must carry extensions.bazaar (or extensions["offer-receipt"])

Output: markdown table of door | 402 ok | accepts | bazaar | listing price == live price.
"""
import json
import urllib.request
import sys
from datetime import datetime, timezone

SITE = "https://councilof.ai"

def fetch_json(url, timeout=15):
    req = urllib.request.Request(url, headers={"Accept": "application/json", "User-Agent": "CSOAI-AUDIT/1.0"})
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            return resp.status, json.loads(resp.read())
    except urllib.error.HTTPError as e:
        try:
            body = json.loads(e.read())
        except:
            body = {}
        return e.code, body
    except Exception as e:
        return 0, {"error": str(e)}

def main():
    # Load x402.json
    status, x402 = fetch_json(f"{SITE}/.well-known/x402.json")
    if status != 200:
        print(f"ERROR: x402.json returned {status}", file=sys.stderr)
        sys.exit(1)

    resources = x402.get("resources", [])
    if not resources:
        resources = x402.get("doors", [])

    rows = []
    ok_count = 0
    fail_count = 0

    for r in resources:
        url = r.get("url", "")
        if not url:
            continue

        # Make the door URL absolute
        if url.startswith("/"):
            url = f"{SITE}{url}"

        door_status, door_body = fetch_json(url)

        is_402 = door_status == 402
        has_accepts = isinstance(door_body, dict) and "accepts" in door_body
        has_bazaar = isinstance(door_body, dict) and (
            "extensions" in door_body and (
                "bazaar" in door_body.get("extensions", {}) or
                "offer-receipt" in door_body.get("extensions", {})
            )
        )

        # Check listing price vs live price
        listing_price = r.get("price") or r.get("amount") or "—"
        live_price = "—"
        if has_accepts and door_body.get("accepts"):
            # Price is in the accepts array
            live_price = str(door_body["accepts"][0].get("amount", "—"))

        row = {
            "door": url.replace(SITE, ""),
            "status_402": "✅" if is_402 else f"❌ {door_status}",
            "accepts": "✅" if has_accepts else "❌",
            "bazaar": "✅" if has_bazaar else "❌",
            "listing_price": listing_price,
            "live_price": live_price,
            "cdp": "absent",
        }
        rows.append(row)

        if is_402 and has_accepts and has_bazaar:
            ok_count += 1
        else:
            fail_count += 1

    now = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    print(f"# x402 Door Listing Parity — {now}")
    print()
    print(f"| Door | 402 OK | Accepts | Bazaar | Listing Price | Live Price | CDP |")
    print(f"|------|--------|---------|--------|---------------|------------|-----|")
    for r in rows:
        print(f"| {r['door']} | {r['status_402']} | {r['accepts']} | {r['bazaar']} | {r['listing_price']} | {r['live_price']} | {r['cdp']} |")
    print()
    print(f"**Summary:** {ok_count}/{ok_count + fail_count} doors return 402 with accepts[] + bazaar.")
    if fail_count > 0:
        print(f"**Failures:** {fail_count} doors did not pass.")
    print()
    print(f"**Notes:**")
    print(f"- CDP (Content Delivery Platform) is always absent until OWNER-ASKS #2.")
    print(f"- Listing stale — refreshes on the next settlement through PayAI; no self-settlement to force it.")
    print(f"- Where a listing disagrees with the door, write 'listing stale — refreshes on the next settlement through PayAI'; no self-settlement to force it.")

if __name__ == "__main__":
    main()
