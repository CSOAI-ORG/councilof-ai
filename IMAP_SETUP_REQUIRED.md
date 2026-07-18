# AI Reply Agent — IMAP Configuration Required

## Status
- SMTP: ✅ Working (outbound emails)
- IMAP: 🚫 Not configured (cannot read inbound replies)

## What You Need to Provide

Set these environment variables before running the reply agent:

```bash
export IMAP_HOST=imap.gmail.com          # or your email provider's IMAP host
export IMAP_PORT=993                     # typically 993 for SSL, 143 for TLS
export IMAP_USER=your-email@gmail.com    # your full email address
export IMAP_PASSWORD=your-app-password   # app-specific password (NOT account password)
```

### Gmail Setup
1. Enable 2-Factor Authentication on your Google Account
2. Generate an [App Password](https://support.google.com/accounts/answer/185833):
   - Go to Google Account → Security → 2-Step Verification → App passwords
   - Select "Mail" and your device
   - Copy the 16-character password
3. Use that password as `IMAP_PASSWORD`

### Other Providers
| Provider | IMAP Host | Port |
|----------|-----------|------|
| Gmail | imap.gmail.com | 993 |
| Outlook/365 | outlook.office365.com | 993 |
| iCloud | imap.mail.me.com | 993 |
| ProtonMail | imap.protonmail.com | 993 |
| Yahoo | imap.mail.yahoo.com | 993 |

## After Setting Up
```bash
cd ~/clawd/revenue
python3 ai_reply_agent.py --mode check    # Test IMAP connection
python3 ai_reply_agent.py --mode daemon   # Run continuously
```

## How It Works
The agent polls IMAP inbox, classifies inbound replies (interested/objection/timing/referral/unsubscribe), generates personalized responses via Ollama, and sends replies via SMTP.
