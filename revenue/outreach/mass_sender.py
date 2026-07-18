#!/usr/bin/env python3
"""
Mass Outreach Email Sender for MEOK AI Labs
Supports: SendGrid, Namecheap PrivateEmail, Gmail SMTP, AWS SES
Usage: python3 mass_sender.py --vertical aquaculture --dry-run
"""

import yaml
import csv
import time
import random
import argparse
import sys
from datetime import datetime, timedelta
from pathlib import Path

# Try to import email libraries
try:
    import smtplib
    from email.mime.text import MIMEText
    from email.mime.multipart import MIMEMultipart
    SMTP_AVAILABLE = True
except ImportError:
    SMTP_AVAILABLE = False
    print("WARNING: smtplib not available. Install with: pip install secure-smtplib")

try:
    import sendgrid
    from sendgrid.helpers.mail import Mail, Email, To, Content
    SENDGRID_AVAILABLE = True
except ImportError:
    SENDGRID_AVAILABLE = False

try:
    import boto3
    AWS_AVAILABLE = True
except ImportError:
    AWS_AVAILABLE = False

CONFIG_PATH = Path(__file__).parent / "smtp_config.yaml"
LOG_PATH = Path(__file__).parent / "sent_log.csv"

class OutreachSender:
    def __init__(self, config_path=None):
        self.config = self._load_config(config_path)
        self.sent_count = 0
        self.hour_count = 0
        self.hour_start = datetime.now()
        self.log_file = open(LOG_PATH, 'a', newline='') if LOG_PATH.exists() else open(LOG_PATH, 'w', newline='')
        self.log_writer = csv.writer(self.log_file)
        if not LOG_PATH.exists():
            self.log_writer.writerow(['timestamp', 'vertical', 'recipient', 'subject', 'provider', 'status', 'message_id'])
    
    def _load_config(self, path):
        if path and Path(path).exists():
            with open(path) as f:
                return yaml.safe_load(f)
        # Try default path
        if CONFIG_PATH.exists():
            with open(CONFIG_PATH) as f:
                return yaml.safe_load(f)
        print(f"ERROR: No config found at {CONFIG_PATH}")
        print("Fill in smtp_config.yaml with your credentials first.")
        sys.exit(1)
    
    def _check_rate_limit(self, provider, limit):
        now = datetime.now()
        if now - self.hour_start > timedelta(hours=1):
            self.hour_count = 0
            self.hour_start = now
        if self.hour_count >= limit:
            wait = 3600 - (now - self.hour_start).seconds
            print(f"Rate limit hit for {provider}. Waiting {wait}s...")
            time.sleep(wait)
            self.hour_count = 0
            self.hour_start = datetime.now()
    
    def _log(self, vertical, recipient, subject, provider, status, message_id=""):
        self.log_writer.writerow([
            datetime.now().isoformat(),
            vertical,
            recipient,
            subject,
            provider,
            status,
            message_id
        ])
        self.log_file.flush()
    
    def send_sendgrid(self, to_email, subject, body, from_name, from_email, api_key):
        if not SENDGRID_AVAILABLE:
            print("SendGrid library not installed. Run: pip install sendgrid")
            return False
        
        sg = sendgrid.SendGridAPIClient(api_key=api_key)
        message = Mail(
            from_email=Email(from_email, from_name),
            to_emails=To(to_email),
            subject=subject,
            html_content=Content("text/html", body.replace('\n', '<br>'))
        )
        
        try:
            response = sg.client.mail.send.post(request_body=message.get())
            success = response.status_code == 202
            self._log("sendgrid", to_email, subject, "sendgrid", "sent" if success else f"error_{response.status_code}")
            return success
        except Exception as e:
            self._log("sendgrid", to_email, subject, "sendgrid", f"error: {e}")
            return False
    
    def send_smtp(self, to_email, subject, body, host, port, username, password, from_name):
        if not SMTP_AVAILABLE:
            print("smtplib not available.")
            return False
        
        msg = MIMEMultipart('alternative')
        msg['Subject'] = subject
        msg['From'] = f"{from_name} <{username}>"
        msg['To'] = to_email
        
        msg.attach(MIMEText(body, 'plain'))
        msg.attach(MIMEText(body.replace('\n', '<br>'), 'html'))
        
        try:
            with smtplib.SMTP(host, port) as server:
                server.starttls()
                server.login(username, password)
                server.sendmail(username, [to_email], msg.as_string())
            self._log("smtp", to_email, subject, f"smtp:{host}", "sent")
            return True
        except Exception as e:
            self._log("smtp", to_email, subject, f"smtp:{host}", f"error: {e}")
            return False
    
    def send_aws_ses(self, to_email, subject, body, from_email, aws_config):
        if not AWS_AVAILABLE:
            print("boto3 not installed. Run: pip install boto3")
            return False
        
        client = boto3.client(
            'ses',
            region_name=aws_config['region'],
            aws_access_key_id=aws_config['access_key'],
            aws_secret_access_key=aws_config['secret_key']
        )
        
        try:
            response = client.send_email(
                Source=from_email,
                Destination={'ToAddresses': [to_email]},
                Message={
                    'Subject': {'Data': subject},
                    'Body': {
                        'Text': {'Data': body},
                        'Html': {'Data': body.replace('\n', '<br>')}
                    }
                }
            )
            self._log("aws_ses", to_email, subject, "aws_ses", "sent", response['MessageId'])
            return True
        except Exception as e:
            self._log("aws_ses", to_email, subject, "aws_ses", f"error: {e}")
            return False
    
    def send(self, to_email, subject, body, vertical="default", provider="sendgrid"):
        """Send one email using the configured provider."""
        
        if provider == "sendgrid" and 'sendgrid' in self.config:
            cfg = self.config['sendgrid']
            limit = cfg.get('rate_limit', 100)
            self._check_rate_limit("sendgrid", limit)
            
            result = self.send_sendgrid(
                to_email, subject, body,
                cfg['from_name'], cfg['from_email'], cfg['api_key']
            )
            if result:
                self.hour_count += 1
                self.sent_count += 1
            return result
        
        elif provider.startswith("namecheap") and 'namecheap' in self.config:
            domain = provider.split(":")[1] if ":" in provider else "meok_ai"
            cfg = self.config['namecheap'][domain]
            limit = cfg.get('rate_limit', 50)
            self._check_rate_limit(f"namecheap:{domain}", limit)
            
            result = self.send_smtp(
                to_email, subject, body,
                cfg['host'], cfg['port'],
                cfg['username'], cfg['password'],
                cfg['from_name']
            )
            if result:
                self.hour_count += 1
                self.sent_count += 1
            return result
        
        elif provider == "gmail" and 'gmail' in self.config:
            cfg = self.config['gmail']
            limit = cfg.get('rate_limit', 100)
            self._check_rate_limit("gmail", limit)
            
            result = self.send_smtp(
                to_email, subject, body,
                "smtp.gmail.com", 587,
                cfg['username'], cfg['password'],
                cfg['from_name']
            )
            if result:
                self.hour_count += 1
                self.sent_count += 1
            return result
        
        elif provider == "aws_ses" and 'aws_ses' in self.config:
            cfg = self.config['aws_ses']
            limit = cfg.get('rate_limit', 500)
            self._check_rate_limit("aws_ses", limit)
            
            result = self.send_aws_ses(
                to_email, subject, body,
                cfg['from_email'], cfg
            )
            if result:
                self.hour_count += 1
                self.sent_count += 1
            return result
        
        else:
            print(f"ERROR: Unknown provider '{provider}' or not configured")
            return False
    
    def send_batch(self, targets, vertical, provider="sendgrid", dry_run=False, delay=(5, 15)):
        """
        Send to a batch of targets.
        targets: list of dicts with 'email', 'name', 'subject', 'body'
        """
        print(f"\n{'='*60}")
        print(f"BATCH: {vertical} | Provider: {provider} | Dry-run: {dry_run}")
        print(f"Targets: {len(targets)}")
        print(f"{'='*60}\n")
        
        success = 0
        failed = 0
        
        for i, target in enumerate(targets):
            print(f"[{i+1}/{len(targets)}] {target['email']} ... ", end="", flush=True)
            
            if dry_run:
                print("DRY-RUN (not sent)")
                time.sleep(0.5)
                continue
            
            result = self.send(
                target['email'],
                target['subject'],
                target['body'],
                vertical=vertical,
                provider=provider
            )
            
            if result:
                success += 1
                print("SENT")
            else:
                failed += 1
                print("FAILED")
            
            # Rate limiting delay
            if i < len(targets) - 1:
                wait = random.randint(*delay)
                time.sleep(wait)
        
        print(f"\n{'='*60}")
        print(f"DONE: {success} sent, {failed} failed")
        print(f"Total sent this session: {self.sent_count}")
        print(f"{'='*60}\n")
        
        return success, failed
    
    def close(self):
        self.log_file.close()


def main():
    parser = argparse.ArgumentParser(description="Mass Outreach Email Sender")
    parser.add_argument("--vertical", choices=["aquaculture", "optometry", "cobol", "csoai", "iokfarm", "meok", "all"], 
                        default="all", help="Which vertical to target")
    parser.add_argument("--provider", choices=["sendgrid", "namecheap:meok_ai", "namecheap:councilof_ai", "gmail", "aws_ses"],
                        default="sendgrid", help="Email provider")
    parser.add_argument("--dry-run", action="store_true", help="Don't actually send")
    parser.add_argument("--config", help="Path to smtp_config.yaml")
    parser.add_argument("--targets", help="Path to targets CSV (columns: email, name, company)")
    parser.add_argument("--limit", type=int, default=100, help="Max emails to send")
    
    args = parser.parse_args()
    
    sender = OutreachSender(args.config)
    
    # Load targets
    if args.targets:
        with open(args.targets) as f:
            reader = csv.DictReader(f)
            targets = list(reader)
    else:
        # Demo targets
        targets = [
            {"email": "demo@example.com", "name": "Demo", "company": "Demo Inc"}
        ]
        print("WARNING: No targets file provided. Using demo target.")
        print("Create a CSV with columns: email, name, company")
    
    # Limit
    targets = targets[:args.limit]
    
    # Prepare emails
    prepared = []
    for t in targets:
        # You'd customize subject/body per vertical here
        subject = f"AI automation for {t.get('company', 'your business')}"
        body = f"Hi {t.get('name', 'there')},\n\nThis is a test email.\n\nBest,\nNick"
        prepared.append({
            "email": t['email'],
            "name": t.get('name', ''),
            "subject": subject,
            "body": body
        })
    
    # Send
    success, failed = sender.send_batch(
        prepared,
        vertical=args.vertical,
        provider=args.provider,
        dry_run=args.dry_run
    )
    
    sender.close()
    
    if args.dry_run:
        print("\nThis was a DRY RUN. No emails were sent.")
        print("Remove --dry-run to send for real.")
    
    return 0 if failed == 0 else 1


if __name__ == "__main__":
    sys.exit(main())
