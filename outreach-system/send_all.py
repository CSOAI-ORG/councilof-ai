#!/usr/bin/env python3
"""Send staged outreach emails from outreach-system/emails/.txt files.

Usage:
    python3 outreach-system/send_all.py --dry-run
    python3 outreach-system/send_all.py --limit 5 --delay 30
    python3 outreach-system/send_all.py

Env (from ~/clawd/.env.local):
    EMAIL_ADDRESS, EMAIL_PASSWORD, EMAIL_SMTP_HOST, EMAIL_SMTP_PORT
"""
from __future__ import annotations

import argparse
import json
import os
import re
import json
import os
import smtplib
import sys
import time
import urllib.error
import urllib.request
from datetime import datetime, timezone
from email.mime.text import MIMEText
from pathlib import Path

# macOS Python often lacks system certs; prefer certifi if available.
if not os.environ.get("SSL_CERT_FILE"):
    try:
        import certifi
        os.environ.setdefault("SSL_CERT_FILE", certifi.where())
    except Exception:
        pass

ROOT = Path("/Users/nicholas/clawd")
ENV_FILE = ROOT / ".env.local"
EMAIL_DIR = ROOT / "outreach-system" / "emails"
SENT_LOG = ROOT / "outreach-system" / "sent-log.jsonl"


def load_env() -> dict:
    env = dict(os.environ)
    if ENV_FILE.exists():
        for line in ENV_FILE.read_text(encoding="utf-8").splitlines():
            line = line.strip()
            if not line or line.startswith("#"):
                continue
            if "=" in line:
                k, v = line.split("=", 1)
                v = v.strip().strip('"').strip("'")
                env.setdefault(k, v)
    return env


def parse_email_file(path: Path) -> dict | None:
    text = path.read_text(encoding="utf-8", errors="ignore")
    to_match = re.search(r"^TO:\s*(.+)$", text, re.MULTILINE | re.IGNORECASE)
    subject_match = re.search(r"^SUBJECT:\s*(.+)$", text, re.MULTILINE | re.IGNORECASE)
    if not to_match or not subject_match:
        return None
    to = to_match.group(1).strip()
    subject = subject_match.group(1).strip()
    # Body starts after subject line and separator
    body_start = subject_match.end()
    body = text[body_start:].lstrip()
    # Remove common separator lines
    body = re.sub(r"^=+\n", "", body, count=1)
    try:
        rel_file = str(path.relative_to(ROOT))
    except ValueError:
        rel_file = str(path)
    return {
        "file": rel_file,
        "to": to,
        "subject": subject,
        "body": body.strip(),
    }


def discover_emails() -> list[dict]:
    emails = []
    for path in sorted(EMAIL_DIR.rglob("*.txt")):
        parsed = parse_email_file(path)
        if parsed:
            emails.append(parsed)
    return emails


def send_via_sendgrid(env: dict, email: dict) -> dict:
    """Send via SendGrid REST API. Returns updated result dict."""
    api_key = env.get("SENDGRID_API_KEY", "")
    sender = env.get("EMAIL_ADDRESS", env.get("EMAIL_FROM", ""))
    result = {
        "file": email["file"],
        "to": email["to"],
        "subject": email["subject"],
        "sent_at": datetime.now(timezone.utc).isoformat(),
        "dry_run": False,
    }
    if not api_key:
        result["error"] = "SENDGRID_API_KEY not set"
        return result
    payload = json.dumps({
        "personalizations": [{"to": [{"email": email["to"]}]}],
        "from": {"email": sender},
        "subject": email["subject"],
        "content": [{"type": "text/plain", "value": email["body"]}],
    }).encode("utf-8")
    req = urllib.request.Request(
        "https://api.sendgrid.com/v3/mail/send",
        data=payload,
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            _ = resp.read()
        result["status"] = "sent"
        result["provider"] = "sendgrid"
    except urllib.error.HTTPError as e:
        result["status"] = "failed"
        result["provider"] = "sendgrid"
        result["error"] = f"HTTP {e.code}: {e.read().decode('utf-8', errors='ignore')}"
    except Exception as e:
        result["status"] = "failed"
        result["provider"] = "sendgrid"
        result["error"] = str(e)
    return result


def send_via_resend(env: dict, email: dict) -> dict:
    """Send via Resend REST API. Returns updated result dict."""
    api_key = env.get("RESEND_API_KEY", "")
    sender = env.get("EMAIL_ADDRESS", env.get("EMAIL_FROM", "onboarding@resend.dev"))
    result = {
        "file": email["file"],
        "to": email["to"],
        "subject": email["subject"],
        "sent_at": datetime.now(timezone.utc).isoformat(),
        "dry_run": False,
    }
    if not api_key:
        result["error"] = "RESEND_API_KEY not set"
        return result
    payload = json.dumps({
        "from": sender,
        "to": [email["to"]],
        "subject": email["subject"],
        "text": email["body"],
    }).encode("utf-8")
    req = urllib.request.Request(
        "https://api.resend.com/emails",
        data=payload,
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            body = resp.read().decode("utf-8")
        result["status"] = "sent"
        result["provider"] = "resend"
        result["response"] = body
    except urllib.error.HTTPError as e:
        result["status"] = "failed"
        result["provider"] = "resend"
        result["error"] = f"HTTP {e.code}: {e.read().decode('utf-8', errors='ignore')}"
    except Exception as e:
        result["status"] = "failed"
        result["provider"] = "resend"
        result["error"] = str(e)
    return result


def send_email(env: dict, email: dict, dry_run: bool = False) -> dict:
    smtp_host = env.get("EMAIL_SMTP_HOST", "smtp.privatemail.com")
    smtp_port = int(env.get("EMAIL_SMTP_PORT", "587"))
    sender = env.get("EMAIL_ADDRESS", env.get("EMAIL_FROM", ""))
    password = env.get("EMAIL_PASSWORD", "")

    result = {
        "file": email["file"],
        "to": email["to"],
        "subject": email["subject"],
        "sent_at": datetime.now(timezone.utc).isoformat(),
        "dry_run": dry_run,
    }

    if dry_run:
        result["status"] = "dry_run_ok"
        return result

    # Prefer Resend API, then SendGrid, then SMTP.
    if env.get("RESEND_API_KEY"):
        res = send_via_resend(env, email)
        res["sent_at"] = result["sent_at"]
        if res.get("status") == "sent":
            return res
        result["fallback_error"] = res.get("error")

    if env.get("SENDGRID_API_KEY"):
        res = send_via_sendgrid(env, email)
        res["sent_at"] = result["sent_at"]
        if res.get("status") == "sent":
            return res
        result["fallback_error"] = res.get("error")

    if not sender or not password:
        err = result.get("fallback_error") or "EMAIL_ADDRESS or EMAIL_PASSWORD not set"
        result["error"] = err
        return result

    try:
        msg = MIMEText(email["body"], "plain", "utf-8")
        msg["Subject"] = email["subject"]
        msg["From"] = sender
        msg["To"] = email["to"]

        with smtplib.SMTP(smtp_host, smtp_port, timeout=30) as server:
            server.starttls()
            server.login(sender, password)
            server.sendmail(sender, [email["to"]], msg.as_string())
        result["status"] = "sent"
    except Exception as e:
        result["status"] = "failed"
        result["error"] = str(e)

    return result


def log_result(result: dict):
    SENT_LOG.parent.mkdir(parents=True, exist_ok=True)
    with SENT_LOG.open("a", encoding="utf-8") as f:
        f.write(json.dumps(result) + "\n")


def main():
    parser = argparse.ArgumentParser(description="Send staged outreach emails")
    parser.add_argument("--dry-run", action="store_true", help="Parse and validate without sending")
    parser.add_argument("--limit", type=int, default=0, help="Max emails to send (0 = all)")
    parser.add_argument("--delay", type=int, default=10, help="Seconds between sends")
    parser.add_argument("--batch", type=str, choices=["keystone", "care", "followup"], help="Only send one batch")
    args = parser.parse_args()

    env = load_env()
    emails = discover_emails()

    if args.batch:
        if args.batch == "keystone":
            emails = [e for e in emails if "keystone-warm-intro" in e["file"]]
        elif args.batch == "care":
            emails = [e for e in emails if re.search(r"CH-\d+_initial", e["file"])]
        elif args.batch == "followup":
            emails = [e for e in emails if "keystone-d10-followup" in e["file"]]

    if args.limit:
        emails = emails[: args.limit]

    print(f"Discovered {len(emails)} email(s) to process")
    print(f"Dry run: {args.dry_run}")
    print(f"Sender: {env.get('EMAIL_ADDRESS') or 'NOT SET'}")
    print("-" * 60)

    if not emails:
        print("No emails matched filters.")
        sys.exit(0)

    results = []
    for i, email in enumerate(emails, 1):
        print(f"[{i}/{len(emails)}] {email['file']} -> {email['to']}")
        result = send_email(env, email, dry_run=args.dry_run)
        results.append(result)
        log_result(result)
        status = result.get("status", "unknown")
        if "error" in result:
            print(f"   ⚠️ {status}: {result['error']}")
        else:
            print(f"   ✅ {status}")
        if i < len(emails) and not args.dry_run:
            time.sleep(args.delay)

    print("-" * 60)
    sent = sum(1 for r in results if r.get("status") == "sent")
    dry_ok = sum(1 for r in results if r.get("status") == "dry_run_ok")
    failed = sum(1 for r in results if r.get("status") == "failed")
    print(f"Done — sent: {sent}, dry_run_ok: {dry_ok}, failed: {failed}")
    print(f"Log: {SENT_LOG}")


if __name__ == "__main__":
    main()
