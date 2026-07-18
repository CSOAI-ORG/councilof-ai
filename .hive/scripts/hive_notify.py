#!/usr/bin/env python3
"""hive_notify.py — notification dispatcher for the Hive.

Supports email (SMTP), Discord webhook, Slack webhook, generic HTTP webhooks,
and macOS Notification Center. Reads channel configuration from
.hive/config.yaml and respects a global dry_run flag.
"""
from __future__ import annotations

import json
import os
import smtplib
import subprocess
import urllib.request
from datetime import datetime, timezone
from email.message import EmailMessage
from pathlib import Path
from typing import Any

ROOT = Path(os.environ.get("HIVE_ROOT", "/Users/nicholas/clawd"))
CONFIG = ROOT / ".hive" / "config.yaml"
LOG = ROOT / ".hive" / "logs" / "notifier.log"


def load_config() -> dict[str, Any]:
    try:
        import yaml

        return yaml.safe_load(CONFIG.read_text(encoding="utf-8")) or {}
    except Exception:
        return {}


def log(msg: str) -> None:
    LOG.parent.mkdir(parents=True, exist_ok=True)
    with LOG.open("a", encoding="utf-8") as f:
        f.write(f"[{datetime.now(timezone.utc).isoformat()}] {msg}\n")


def _smtp_config() -> dict[str, Any] | None:
    cfg = load_config().get("notifications", {})
    email = cfg.get("email", {})
    if not email.get("enabled"):
        return None
    host = email.get("host") or os.environ.get("SMTP_HOST")
    port = int(email.get("port") or os.environ.get("SMTP_PORT", 587))
    user = email.get("user") or os.environ.get("SMTP_USER")
    password = email.get("password") or os.environ.get("SMTP_PASSWORD")
    from_addr = email.get("from") or user
    to_addrs = email.get("to", [])
    if not (host and user and password and from_addr and to_addrs):
        return None
    if isinstance(to_addrs, str):
        to_addrs = [a.strip() for a in to_addrs.split(",")]
    return {
        "host": host,
        "port": port,
        "user": user,
        "password": password,
        "from": from_addr,
        "to": to_addrs,
    }


def send_email(subject: str, body: str) -> bool:
    cfg = _smtp_config()
    if not cfg:
        log("email skipped: incomplete SMTP config")
        return False
    try:
        msg = EmailMessage()
        msg["Subject"] = subject
        msg["From"] = cfg["from"]
        msg["To"] = ", ".join(cfg["to"])
        msg.set_content(body)
        with smtplib.SMTP(cfg["host"], cfg["port"], timeout=15) as server:
            server.starttls()
            server.login(cfg["user"], cfg["password"])
            server.send_message(msg)
        log(f"email sent: {subject}")
        return True
    except Exception as e:
        log(f"email failed: {e}")
        return False


def _webhook_post(url: str, payload: dict[str, Any]) -> bool:
    try:
        data = json.dumps(payload).encode("utf-8")
        req = urllib.request.Request(url, data=data, headers={"Content-Type": "application/json"}, method="POST")
        with urllib.request.urlopen(req, timeout=10) as resp:
            return resp.status in (200, 204)
    except Exception as e:
        log(f"webhook failed ({url[:40]}...): {e}")
        return False


def send_discord(subject: str, body: str) -> bool:
    cfg = load_config().get("notifications", {}).get("discord", {})
    if not cfg.get("enabled"):
        return False
    url = cfg.get("webhook_url")
    if not url:
        log("discord skipped: no webhook_url")
        return False
    ok = _webhook_post(url, {"content": f"**{subject}**\n{body[:1900]}"})
    if ok:
        log(f"discord sent: {subject}")
    return ok


def send_slack(subject: str, body: str) -> bool:
    cfg = load_config().get("notifications", {}).get("slack", {})
    if not cfg.get("enabled"):
        return False
    url = cfg.get("webhook_url")
    if not url:
        log("slack skipped: no webhook_url")
        return False
    ok = _webhook_post(url, {"text": f"*{subject}*\n{body}"})
    if ok:
        log(f"slack sent: {subject}")
    return ok


def send_generic_webhook(subject: str, body: str) -> bool:
    cfg = load_config().get("notifications", {}).get("webhook", {})
    if not cfg.get("enabled"):
        return False
    url = cfg.get("url")
    if not url:
        log("generic webhook skipped: no url")
        return False
    payload = cfg.get("payload", {})
    payload.setdefault("subject", subject)
    payload.setdefault("body", body)
    payload.setdefault("ts", datetime.now(timezone.utc).isoformat())
    ok = _webhook_post(url, payload)
    if ok:
        log(f"generic webhook sent: {subject}")
    return ok


def send_macos_notification(title: str, body: str) -> bool:
    cfg = load_config().get("notifications", {})
    if not cfg.get("macos", False):
        return False
    try:
        script = f'display notification "{body[:200]}" with title "{title[:60]}"'
        subprocess.run(["osascript", "-e", script], check=False, capture_output=True)
        log(f"macos notification sent: {title}")
        return True
    except Exception as e:
        log(f"macos notification failed: {e}")
        return False


def notify(subject: str, body: str, level: str = "info") -> dict[str, bool]:
    """Dispatch a notification through all configured channels.

    Returns a map of channel -> success status. dry_run mode logs but does not send.
    """
    cfg = load_config().get("notifications", {})
    dry_run = cfg.get("dry_run", True)

    log(f"notify [{level}]: {subject}")
    if dry_run:
        log("dry_run mode — no channels dispatched")
        return {"dry_run": True}

    results: dict[str, bool] = {}
    if cfg.get("email", {}).get("enabled"):
        results["email"] = send_email(subject, body)
    if cfg.get("discord", {}).get("enabled"):
        results["discord"] = send_discord(subject, body)
    if cfg.get("slack", {}).get("enabled"):
        results["slack"] = send_slack(subject, body)
    if cfg.get("webhook", {}).get("enabled"):
        results["webhook"] = send_generic_webhook(subject, body)
    if cfg.get("macos"):
        results["macos"] = send_macos_notification(subject, body)

    if not results:
        log("no notification channels enabled")
    return results


def main() -> None:
    """CLI test: python3 hive_notify.py 'subject' 'body'"""
    import sys

    subject = sys.argv[1] if len(sys.argv) > 1 else "Hive notification test"
    body = sys.argv[2] if len(sys.argv) > 2 else "This is a test notification from the CSOAI Hive."
    print(notify(subject, body))


if __name__ == "__main__":
    main()
