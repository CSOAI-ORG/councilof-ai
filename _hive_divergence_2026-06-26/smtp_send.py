#!/usr/bin/env python3
"""
smtp_send.py — send via mail.privateemail.com:587 (STARTTLS)
for nicholas@councilof.ai (the csoai.org alias).

Usage:
  # First, edit smtp_config.yaml to fill in YOUR_PASSWORD
  # Then:
  python3 /home/nicholas/meok-compliance-gateway/smtp_send.py \
    --to "enquiries@british-business-bank.co.uk" \
    --subject "MEOK ships first open-source EU Code-of-Practice-Ready AI compliance stack" \
    --body-file /home/nicholas/clawd/UK_FUND_APPLICATION_EMAIL_2026-06-16.md \
    --attachments-dir /home/nicholas/clawd/press-outreach-15jun/ \
    --account councilof_ai

This uses smtplib + email.message.EmailMessage (the modern MIME handler).
STARTTLS on port 587. Rate-limit: 50/hour (per smtp_config.yaml).
"""

import argparse
import os
import smtplib
import ssl
import time
import yaml
from email.message import EmailMessage
from pathlib import Path

def load_config(config_path):
    with open(config_path) as f:
        return yaml.safe_load(f)

def build_email(to, subject, body_text, attachments_dir):
    msg = EmailMessage()
    msg["From"] = "Nick Templeman <nicholas@councilof.ai>"
    msg["To"] = to
    msg["Subject"] = subject
    msg.set_content(body_text)
    if attachments_dir:
        attach_path = Path(attachments_dir)
        for f in attach_path.iterdir():
            if f.is_file() and f.suffix in (".md", ".py", ".txt"):
                msg.add_attachment(
                    f.read_bytes(),
                    maintype="text",
                    subtype="markdown" if f.suffix == ".md" else "plain",
                    filename=f.name
                )
    return msg

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--to", required=True, help="Recipient email")
    parser.add_argument("--subject", required=True, help="Email subject")
    parser.add_argument("--body-file", required=True, help="Path to body text file")
    parser.add_argument("--attachments-dir", help="Optional dir to attach all .md/.py/.txt files")
    parser.add_argument("--account", default="councilof_ai", help="Account in smtp_config.yaml")
    parser.add_argument("--dry-run", action="store_true", help="Print what would send, don't send")
    parser.add_argument("--config", default="/home/nicholas/clawd/revenue/outreach/smtp_config.yaml")
    args = parser.parse_args()

    cfg = load_config(args.config)
    account = cfg["namecheap"][args.account]
    host = account["host"]
    port = account["port"]
    username = account["username"]
    password = account["password"]
    from_name = account["from_name"]

    if password == "YOUR_PASSWORD":
        print(f"❌ Password not set in {args.config}")
        print(f"   Edit the {args.account} block and set the real password.")
        print(f"   Then re-run this script.")
        return 1

    body = Path(args.body_file).read_text()
    msg = build_email(args.to, args.subject, body, args.attachments_dir)

    if args.dry_run:
        print(f"=== DRY RUN ===")
        print(f"From: {from_name} <{username}>")
        print(f"To: {args.to}")
        print(f"Subject: {args.subject}")
        print(f"Body: {len(body)} chars from {args.body_file}")
        print(f"Attachments: {list(Path(args.attachments_dir).iterdir()) if args.attachments_dir else 'none'}")
        return 0

    print(f"=== SENDING ===")
    print(f"From: {from_name} <{username}>")
    print(f"To: {args.to}")
    print(f"Subject: {args.subject}")
    print(f"Host: {host}:{port} (STARTTLS)")

    ctx = ssl.create_default_context()
    with smtplib.SMTP(host, port) as server:
        server.ehlo()
        server.starttls(context=ctx)
        server.ehlo()
        server.login(username, password)
        rejected = server.send_message(msg)
        if rejected:
            print(f"⚠️  Server rejected: {rejected}")
            return 1
        else:
            print(f"✅ SENT")

    return 0

if __name__ == "__main__":
    raise SystemExit(main())
