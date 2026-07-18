#!/bin/bash
# Customer success ping cron
# Sends day-3, day-14, day-30 check-in emails to recent customers
# Reads from Stripe customer list via API + local cache
# Cron: 0 10 * * * (10am UTC daily)
#
# Requires: STRIPE_SECRET_KEY in env (already in Vercel — pull to local)
# Requires: RESEND_API_KEY in env (need Nick to sign up)

set -e
LOG=~/.hermes/logs/customer-success.log
CACHE=~/.hermes/customer-success-state.json
mkdir -p ~/.hermes/logs

if [ -z "$STRIPE_SECRET_KEY" ] || [ -z "$RESEND_API_KEY" ]; then
  echo "$(date): Missing STRIPE_SECRET_KEY or RESEND_API_KEY — skipping" >> "$LOG"
  echo "Add to ~/.zshrc: export RESEND_API_KEY=..."
  echo "Get free key at: https://resend.com/api-keys (3K emails/mo free)"
  exit 0
fi

echo "===== $(date -u +%Y-%m-%dT%H:%M:%SZ) — Customer Success Ping =====" >> "$LOG"

# Pull active subscribers (created in last 30 days)
python3 << 'PYEOF' >> "$LOG" 2>&1
import os, json, urllib.request, urllib.parse
from datetime import datetime, timedelta
from pathlib import Path

stripe_key = os.environ.get("STRIPE_SECRET_KEY")
resend_key = os.environ.get("RESEND_API_KEY")

if not stripe_key or not resend_key:
    print("Missing keys, exiting")
    exit(0)

cache_file = Path.home() / ".hermes" / "customer-success-state.json"
state = json.loads(cache_file.read_text()) if cache_file.exists() else {}

now = datetime.utcnow()
cutoff = now - timedelta(days=31)
cutoff_ts = int(cutoff.timestamp())

# Stripe list subscriptions
req = urllib.request.Request(
    f"https://api.stripe.com/v1/subscriptions?limit=100&created[gte]={cutoff_ts}&status=active",
    headers={"Authorization": f"Bearer {stripe_key}"}
)
try:
    with urllib.request.urlopen(req, timeout=20) as resp:
        subs = json.load(resp).get("data", [])
except Exception as e:
    print(f"Stripe fetch error: {e}")
    exit(1)

print(f"Active subs created in last 31d: {len(subs)}")

EMAILS = {
    3: ("Quick check-in: how's MEOK working for you?",
        "Hi {name},\n\nIt's been 3 days since you upgraded to MEOK Pro. Quick check — did you manage to:\n\n1. Set MEOK_API_KEY in your shell?\n2. Run your first signed audit?\n3. Verify the cert at meok-attestation-api.vercel.app/verify?\n\nIf anything is stuck, hit reply and tell me. I read every reply.\n\n— Nick\nMEOK AI Labs"),
    14: ("MEOK at day 14: anything missing?",
         "Hi {name},\n\nTwo weeks in. What's working, what isn't?\n\nMost teams at the 2-week mark are running 5-15 audits a week and have stopped touching the manual checklist. If that's you — cool, no action needed.\n\nIf you've stopped using MEOK or only run 1-2 audits a week, something's wrong on our side. Reply with what you wish existed and I'll add it to the roadmap.\n\n— Nick"),
    30: ("MEOK at day 30: would you recommend us?",
         "Hi {name},\n\nMonth one done. Honest question: would you recommend MEOK to a peer? Reply 1-10.\n\nIf 9-10: I'd love a one-sentence quote we can put on the website (anonymized or attributed, your call).\nIf 7-8: tell me what's missing for the 9-10.\nIf 0-6: tell me what broke. I want to fix it before you cancel.\n\n— Nick\nMEOK AI Labs"),
}

def send_email(to, name, day):
    subject, body = EMAILS[day]
    body = body.format(name=name)
    payload = json.dumps({
        "from": "Nick at MEOK <hello@meok.ai>",
        "to": [to],
        "subject": subject,
        "text": body,
    }).encode()
    req = urllib.request.Request(
        "https://api.resend.com/emails",
        data=payload,
        headers={"Authorization": f"Bearer {resend_key}",
                 "Content-Type": "application/json"},
        method="POST"
    )
    try:
        with urllib.request.urlopen(req, timeout=10) as r:
            return r.read().decode()
    except Exception as e:
        return f"ERR: {e}"

sent = 0
for sub in subs:
    customer_id = sub.get("customer")
    created = datetime.fromtimestamp(sub.get("created", 0))
    days_old = (now - created).days

    # Fetch customer email
    creq = urllib.request.Request(
        f"https://api.stripe.com/v1/customers/{customer_id}",
        headers={"Authorization": f"Bearer {stripe_key}"}
    )
    try:
        with urllib.request.urlopen(creq, timeout=10) as r:
            cust = json.load(r)
    except:
        continue

    email = cust.get("email")
    name = (cust.get("name") or email or "there").split()[0]
    if not email:
        continue

    # Decide which check-in to send
    key = f"{email}-{days_old}"
    if days_old in (3, 14, 30) and state.get(key) != "sent":
        result = send_email(email, name, days_old)
        state[key] = "sent" if "id" in result else f"err: {result[:100]}"
        sent += 1
        print(f"  Day {days_old} → {email}: {state[key][:80]}")

cache_file.write_text(json.dumps(state, indent=2))
print(f"Sent {sent} check-ins")
PYEOF

echo "" >> "$LOG"
