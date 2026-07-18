#!/usr/bin/env python3
"""first-sale-tracker.py — Poll Stripe for new customers, alert on first sale.
Run: python3 scripts/first-sale-tracker.py
"""
import json, urllib.request, os, sys, time

STRIPE_KEY = os.environ.get("STRIPE_SECRET_KEY", "")
if not STRIPE_KEY:
    # Try to read from .env.local
    try:
        with open(".env.local") as f:
            for line in f:
                if line.startswith("STRIPE_SECRET_KEY="):
                    STRIPE_KEY = line.split("=", 1)[1].strip().strip('"')
                    break
    except FileNotFoundError:
        pass

if not STRIPE_KEY:
    print("❌ No Stripe key found. Set STRIPE_SECRET_KEY or add to .env.local")
    sys.exit(1)

def stripe_get(endpoint):
    req = urllib.request.Request(
        f"https://api.stripe.com/v1/{endpoint}",
        headers={"Authorization": f"Bearer {STRIPE_KEY}"}
    )
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            return json.loads(resp.read())
    except Exception as e:
        return {"error": str(e)}

# Check customers
print("=== Stripe Revenue Check ===")
print(f"Time: {time.strftime('%Y-%m-%d %H:%M:%S')}")
print("")

customers = stripe_get("customers?limit=1")
if "error" in customers:
    print(f"❌ API error: {customers['error']}")
    sys.exit(1)

count = customers.get("data", [])
print(f"Customers: {len(count)}")

# Check payment intents
pi = stripe_get("payment_intents?limit=1")
payments = pi.get("data", [])
if payments:
    p = payments[0]
    print(f"Latest payment: {p.get('amount', 0)/100:.2f} {p.get('currency', '').upper()} — {p.get('status', 'unknown')}")
else:
    print("Payments: 0")

# Check subscriptions
sub = stripe_get("subscriptions?limit=1")
subs = sub.get("data", [])
print(f"Subscriptions: {len(subs)}")

print("")
if len(subs) > 0 or len(payments) > 0:
    print("🎉 REVENUE DETECTED!")
else:
    print("💰 No revenue yet. Keep shipping.")
