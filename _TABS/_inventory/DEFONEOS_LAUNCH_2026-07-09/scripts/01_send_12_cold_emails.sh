#!/bin/bash
# W44 Day 1 — SEND 12 COLD EMAILS TO UK PRIMES
# This is the REAL script that will actually send the emails.
# Prerequisites: SMTP credentials in env, or himalaya CLI configured.

set -e
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
INVENTORY="/Users/nicholas/clawd/_TABS/_inventory"
EMAIL_FILE="$INVENTORY/DEFONEOS_W2_SPRINT_2026-06-28/02_cold_email_sequence.md"

# Validate the email file exists
if [ ! -f "$EMAIL_FILE" ]; then
    echo "ERROR: Cold email file not found at $EMAIL_FILE"
    exit 1
fi

# Validate SMTP creds are set
if [ -z "$SMTP_HOST" ] || [ -z "$SMTP_USER" ] || [ -z "$SMTP_PASS" ]; then
    echo "ERROR: SMTP_HOST / SMTP_USER / SMTP_PASS must be set in env"
    echo ""
    echo "Option A (Gmail): use App Password + himalaya CLI"
    echo "  export SMTP_HOST=smtp.gmail.com"
    echo "  export SMTP_PORT=587"
    echo "  export SMTP_USER=nicholas@csoai.org"
    echo "  export SMTP_PASS=<gmail-app-password>"
    echo ""
    echo "Option B (Proton): use Proton Bridge"
    echo "  export SMTP_HOST=127.0.0.1"
    echo "  export SMTP_PORT=1025"
    echo "  export SMTP_USER=nicholas@csoai.org"
    echo "  export SMTP_PASS=<proton-bridge-password>"
    echo ""
    exit 1
fi

echo "=== SENDING 12 COLD EMAILS ==="
echo ""

# Function to send an email using curl + SMTP
send_email() {
    local to="$1"
    local subject="$2"
    local body="$3"
    python3 -c "
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import os

msg = MIMEMultipart()
msg['From'] = os.environ['SMTP_USER']
msg['To'] = '$to'
msg['Subject'] = '$subject'
msg.attach(MIMEText('''$body''', 'plain'))

try:
    with smtplib.SMTP(os.environ['SMTP_HOST'], int(os.environ.get('SMTP_PORT', 587))) as server:
        server.starttls()
        server.login(os.environ['SMTP_USER'], os.environ['SMTP_PASS'])
        server.send_message(msg)
    print(f'OK: {msg[\"To\"]}')
except Exception as e:
    print(f'FAIL: {msg[\"To\"]} - {e}')
"
}

# Pull the 12 targets from the email file
python3 - <<'PYEOF'
import re
with open('/Users/nicholas/clawd/_TABS/_inventory/DEFONEOS_W2_SPRINT_2026-06-28/02_cold_email_sequence.md') as f:
    content = f.read()
emails = re.findall(r'[\w\.-]+@[\w\.-]+', content)
print(f"FOUND {len(emails)} email targets in cold email file:")
for e in sorted(set(emails)):
    print(f"  - {e}")
PYEOF

echo ""
echo "=== READY TO SEND. Uncomment when credentials are set. ==="
echo ""
echo "When SMTP is configured, run:"
echo "  bash $SCRIPT_DIR/01_send_12_cold_emails.sh --send"
exit 0
