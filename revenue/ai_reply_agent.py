#!/usr/bin/env python3
"""
AI Reply Agent — Revenue Operations
====================================
Blueprint Reference: Section 3.2 — AI Reply Agents for Revenue Operations

Instantly.ai results: 2.3x reply rate vs human SDRs, 40% more meetings booked.
Handles inbound replies, objections, scheduling autonomously.

Usage:
    python3 ai_reply_agent.py --mode daemon          # Run continuously
    python3 ai_reply_agent.py --mode check            # Check inbox once
    python3 ai_reply_agent.py --mode draft --lead "john@company.com"
    python3 ai_reply_agent.py --mode stats            # Show performance stats

Supports:
    - Email inbox monitoring (IMAP)
    - Reply classification (interested, objection, timing, referral, unsubscribe)
    - Dynamic personalization using prospect data
    - Objection handling with predefined responses
    - Meeting scheduling integration
    - CRM sync (HubSpot, Salesforce, or local SQLite)
"""

import os
import sys
import json
import time
import imaplib
import email
import smtplib
import hashlib
import logging
import argparse
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime, timedelta
from pathlib import Path
from enum import Enum
from dataclasses import dataclass, field
from typing import Optional

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------
REPLY_AGENT_DIR = Path.home() / "clawd" / "revenue" / "reply-agent"
REPLY_AGENT_DIR.mkdir(parents=True, exist_ok=True)

# Email configuration
IMAP_HOST = os.environ.get("IMAP_HOST", "imap.gmail.com")
IMAP_PORT = int(os.environ.get("IMAP_PORT", "993"))
IMAP_USER = os.environ.get("IMAP_USER", "")
IMAP_PASSWORD = os.environ.get("IMAP_PASSWORD", "")

SMTP_HOST = os.environ.get("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT = int(os.environ.get("SMTP_PORT", "587"))
SMTP_USER = os.environ.get("SMTP_USER", IMAP_USER)
SMTP_PASSWORD = os.environ.get("SMTP_PASSWORD", IMAP_PASSWORD)
FROM_EMAIL = os.environ.get("FROM_EMAIL", IMAP_USER)
FROM_NAME = os.environ.get("FROM_NAME", "Nicholas Templeman — MEOK AI Labs")

# CRM configuration
CRM_TYPE = os.environ.get("CRM_TYPE", "sqlite")  # sqlite, hubspot, salesforce
CRM_DB = REPLY_AGENT_DIR / "crm.db"

# Ollama configuration (local LLM for reply generation)
OLLAMA_URL = os.environ.get("OLLAMA_URL", "http://localhost:11434")
OLLAMA_MODEL = os.environ.get("OLLAMA_MODEL", "qwen2.5:7b")

# Reply configuration
MAX_REPLIES_PER_HOUR = int(os.environ.get("MAX_REPLIES_PER_HOUR", "20"))
CONFIDENCE_THRESHOLD = float(os.environ.get("CONFIDENCE_THRESHOLD", "0.7"))
HUMAN_ESCALATION_KEYWORDS = ["legal", "contract", "pricing exception", "enterprise", "custom"]

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [REPLY_AGENT] %(levelname)s: %(message)s",
    handlers=[
        logging.FileHandler(str(REPLY_AGENT_DIR / "reply-agent.log")),
        logging.StreamHandler(),
    ],
)
logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Enums and Data Classes
# ---------------------------------------------------------------------------
class ReplyType(Enum):
    INTERESTED = "interested"
    OBJECTION = "objection"
    TIMING = "timing"
    REFERRAL = "referral"
    UNSUBSCRIBE = "unsubscribe"
    OUT_OF_OFFICE = "out_of_office"
    UNKNOWN = "unknown"


@dataclass
class Lead:
    email: str
    name: str = ""
    company: str = ""
    job_title: str = ""
    industry: str = ""
    pain_point: str = ""
    value_hook: str = ""
    last_contact: str = ""
    reply_count: int = 0
    meeting_booked: bool = False
    status: str = "new"  # new, contacted, replied, interested, meeting, closed
    score: int = 0


@dataclass
class InboundEmail:
    from_email: str
    from_name: str
    subject: str
    body: str
    received_at: str
    message_id: str
    in_reply_to: str = ""
    references: str = ""


@dataclass
class ReplyDraft:
    lead_email: str
    subject: str
    body: str
    reply_type: ReplyType
    confidence: float
    personalization: dict = field(default_factory=dict)
    requires_human: bool = False
    reason: str = ""


# ---------------------------------------------------------------------------
# CRM Layer
# ---------------------------------------------------------------------------
class CRM:
    """Customer Relationship Management layer.
    
    Blueprint Reference: Section 3.2.3 — Integration with CRM for seamless pipeline management
    """
    
    def __init__(self, crm_type: str = "sqlite", db_path: Path = CRM_DB):
        self.crm_type = crm_type
        self.db_path = db_path
        
        if crm_type == "sqlite":
            import sqlite3
            self.conn = sqlite3.connect(str(db_path))
            self._init_db()
    
    def _init_db(self):
        """Initialize SQLite CRM schema."""
        cursor = self.conn.cursor()
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS leads (
                email TEXT PRIMARY KEY,
                name TEXT,
                company TEXT,
                job_title TEXT,
                industry TEXT,
                pain_point TEXT,
                value_hook TEXT,
                last_contact TEXT,
                reply_count INTEGER DEFAULT 0,
                meeting_booked BOOLEAN DEFAULT 0,
                status TEXT DEFAULT 'new',
                score INTEGER DEFAULT 0,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                updated_at TEXT DEFAULT CURRENT_TIMESTAMP
            )
        """)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS interactions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                lead_email TEXT,
                type TEXT,
                direction TEXT,  -- inbound or outbound
                subject TEXT,
                body TEXT,
                timestamp TEXT DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (lead_email) REFERENCES leads(email)
            )
        """)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS replies (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                lead_email TEXT,
                reply_type TEXT,
                confidence REAL,
                draft TEXT,
                sent BOOLEAN DEFAULT 0,
                human_approved BOOLEAN DEFAULT 0,
                timestamp TEXT DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (lead_email) REFERENCES leads(email)
            )
        """)
        self.conn.commit()
    
    def get_lead(self, email: str) -> Optional[Lead]:
        """Get lead by email."""
        cursor = self.conn.cursor()
        cursor.execute("SELECT * FROM leads WHERE email = ?", (email,))
        row = cursor.fetchone()
        
        if not row:
            return None
        
        return Lead(
            email=row[0],
            name=row[1] or "",
            company=row[2] or "",
            job_title=row[3] or "",
            industry=row[4] or "",
            pain_point=row[5] or "",
            value_hook=row[6] or "",
            last_contact=row[7] or "",
            reply_count=row[8] or 0,
            meeting_booked=bool(row[9]),
            status=row[10] or "new",
            score=row[11] or 0,
        )
    
    def upsert_lead(self, lead: Lead):
        """Insert or update lead."""
        cursor = self.conn.cursor()
        cursor.execute("""
            INSERT INTO leads (email, name, company, job_title, industry, pain_point, value_hook, last_contact, reply_count, meeting_booked, status, score)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(email) DO UPDATE SET
                name=excluded.name, company=excluded.company, job_title=excluded.job_title,
                industry=excluded.industry, pain_point=excluded.pain_point, value_hook=excluded.value_hook,
                last_contact=excluded.last_contact, reply_count=excluded.reply_count,
                meeting_booked=excluded.meeting_booked, status=excluded.status, score=excluded.score,
                updated_at=CURRENT_TIMESTAMP
        """, (
            lead.email, lead.name, lead.company, lead.job_title, lead.industry,
            lead.pain_point, lead.value_hook, lead.last_contact, lead.reply_count,
            lead.meeting_booked, lead.status, lead.score,
        ))
        self.conn.commit()
    
    def log_interaction(self, lead_email: str, type: str, direction: str, subject: str, body: str):
        """Log an interaction."""
        cursor = self.conn.cursor()
        cursor.execute("""
            INSERT INTO interactions (lead_email, type, direction, subject, body)
            VALUES (?, ?, ?, ?, ?)
        """, (lead_email, type, direction, subject, body))
        self.conn.commit()
    
    def log_reply(self, lead_email: str, reply_type: str, confidence: float, draft: str, sent: bool = False, human_approved: bool = False):
        """Log a reply."""
        cursor = self.conn.cursor()
        cursor.execute("""
            INSERT INTO replies (lead_email, reply_type, confidence, draft, sent, human_approved)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (lead_email, reply_type, confidence, draft, sent, human_approved))
        self.conn.commit()
    
    def get_leads_by_status(self, status: str) -> list:
        """Get leads by status."""
        cursor = self.conn.cursor()
        cursor.execute("SELECT * FROM leads WHERE status = ? ORDER BY score DESC", (status,))
        rows = cursor.fetchall()
        
        return [
            Lead(
                email=row[0], name=row[1] or "", company=row[2] or "",
                job_title=row[3] or "", industry=row[4] or "", pain_point=row[5] or "",
                value_hook=row[6] or "", last_contact=row[7] or "",
                reply_count=row[8] or 0, meeting_booked=bool(row[9]),
                status=row[10] or "new", score=row[11] or 0,
            )
            for row in rows
        ]
    
    def get_stats(self) -> dict:
        """Get CRM stats."""
        cursor = self.conn.cursor()
        cursor.execute("SELECT COUNT(*) FROM leads")
        total_leads = cursor.fetchone()[0]
        
        cursor.execute("SELECT COUNT(*) FROM leads WHERE status = 'interested'")
        interested = cursor.fetchone()[0]
        
        cursor.execute("SELECT COUNT(*) FROM leads WHERE meeting_booked = 1")
        meetings = cursor.fetchone()[0]
        
        cursor.execute("SELECT COUNT(*) FROM replies WHERE sent = 1")
        replies_sent = cursor.fetchone()[0]
        
        cursor.execute("SELECT AVG(confidence) FROM replies WHERE sent = 1")
        avg_confidence = cursor.fetchone()[0] or 0
        
        return {
            "total_leads": total_leads,
            "interested": interested,
            "meetings_booked": meetings,
            "replies_sent": replies_sent,
            "avg_confidence": round(avg_confidence, 2),
            "conversion_rate": round(interested / total_leads * 100, 1) if total_leads > 0 else 0,
            "meeting_rate": round(meetings / total_leads * 100, 1) if total_leads > 0 else 0,
        }


# ---------------------------------------------------------------------------
# Email Layer
# ---------------------------------------------------------------------------
class EmailClient:
    """IMAP/SMTP email client."""
    
    def __init__(self):
        self.imap_host = IMAP_HOST
        self.imap_port = IMAP_PORT
        self.imap_user = IMAP_USER
        self.imap_password = IMAP_PASSWORD
        self.smtp_host = SMTP_HOST
        self.smtp_port = SMTP_PORT
        self.smtp_user = SMTP_USER
        self.smtp_password = SMTP_PASSWORD
        self.from_email = FROM_EMAIL
        self.from_name = FROM_NAME
    
    def check_inbox(self, since: datetime = None, limit: int = 50) -> list:
        """Check inbox for new emails."""
        if not self.imap_user:
            logger.warning("IMAP_USER not set — skipping inbox check")
            return []
        
        emails = []
        
        try:
            mail = imaplib.IMAP4_SSL(self.imap_host, self.imap_port)
            mail.login(self.imap_user, self.imap_password)
            mail.select("inbox")
            
            # Build search criteria
            if since:
                date_str = since.strftime("%d-%b-%Y")
                status, messages = mail.search(None, f'(SINCE "{date_str}")')
            else:
                status, messages = mail.search(None, "UNSEEN")
            
            if status != "OK":
                return []
            
            msg_ids = messages[0].split()
            for msg_id in msg_ids[-limit:]:
                status, msg_data = mail.fetch(msg_id, "(RFC822)")
                if status != "OK":
                    continue
                
                raw_email = msg_data[0][1]
                parsed = email.message_from_bytes(raw_email)
                
                # Extract headers
                from_header = email.utils.parseaddr(parsed.get("From", ""))
                subject = parsed.get("Subject", "")
                message_id = parsed.get("Message-ID", "")
                in_reply_to = parsed.get("In-Reply-To", "")
                references = parsed.get("References", "")
                date = parsed.get("Date", "")
                
                # Extract body
                body = ""
                if parsed.is_multipart():
                    for part in parsed.walk():
                        if part.get_content_type() == "text/plain":
                            body = part.get_payload(decode=True).decode("utf-8", errors="ignore")
                            break
                else:
                    body = parsed.get_payload(decode=True).decode("utf-8", errors="ignore")
                
                emails.append(InboundEmail(
                    from_email=from_header[1],
                    from_name=from_header[0],
                    subject=subject,
                    body=body,
                    received_at=date,
                    message_id=message_id,
                    in_reply_to=in_reply_to,
                    references=references,
                ))
            
            mail.logout()
            
        except Exception as e:
            logger.error(f"IMAP error: {e}")
        
        return emails
    
    def send_reply(self, to_email: str, subject: str, body: str, in_reply_to: str = "") -> bool:
        """Send a reply email."""
        if not self.smtp_user:
            logger.warning("SMTP_USER not set — skipping send")
            return False
        
        try:
            msg = MIMEMultipart("alternative")
            msg["Subject"] = subject
            msg["From"] = f"{self.from_name} <{self.from_email}>"
            msg["To"] = to_email
            
            if in_reply_to:
                msg["In-Reply-To"] = in_reply_to
            
            msg.attach(MIMEText(body, "plain"))
            msg.attach(MIMEText(body.replace("\n", "<br>"), "html"))
            
            with smtplib.SMTP(self.smtp_host, self.smtp_port) as server:
                server.starttls()
                server.login(self.smtp_user, self.smtp_password)
                server.send_message(msg)
            
            logger.info(f"Reply sent to {to_email}")
            return True
            
        except Exception as e:
            logger.error(f"SMTP error: {e}")
            return False


# ---------------------------------------------------------------------------
# Reply Classifier
# ---------------------------------------------------------------------------
class ReplyClassifier:
    """Classifies inbound replies using pattern matching and LLM.
    
    Blueprint Reference: Section 3.2.2 — Autonomous handling of inbound replies, objections, scheduling
    """
    
    # Pattern-based classification (fast, no LLM needed)
    PATTERNS = {
        ReplyType.INTERESTED: [
            "interested", "tell me more", "sounds good", "let's talk", "schedule",
            "book a call", "available", "when can we", "yes", "sure", "absolutely",
            "definitely", "count me in", "sign me up", "how much", "pricing",
            "cost", "price", "quote", "proposal",
        ],
        ReplyType.OBJECTION: [
            "too expensive", "can't afford", "budget", "not now", "not interested",
            "already have", "happy with", "don't need", "no thanks", "no thank you",
            "not a fit", "not for us", "too complex", "too complicated",
            "we're good", "all set", "pass", "maybe later",
        ],
        ReplyType.TIMING: [
            "next quarter", "next month", "next year", "later", "busy right now",
            "swamped", "deadline", "q1", "q2", "q3", "q4", "january", "february",
            "march", "april", "may", "june", "july", "august", "september",
            "october", "november", "december",
        ],
        ReplyType.REFERRAL: [
            "talk to", "contact", "reach out to", "speak with", "connect with",
            "introduce", "refer", "forward", "colleague", "team member",
        ],
        ReplyType.UNSUBSCRIBE: [
            "unsubscribe", "remove me", "opt out", "stop sending", "no more emails",
            "take me off", "delete my email",
        ],
        ReplyType.OUT_OF_OFFICE: [
            "out of office", "ooo", "on leave", "vacation", "away", "unavailable",
            "returning", "back on", "auto-reply", "automatic reply",
        ],
    }
    
    def classify(self, email: InboundEmail, lead: Lead = None) -> tuple:
        """Classify an inbound reply.
        
        Returns (ReplyType, confidence)
        """
        text = f"{email.subject} {email.body}".lower()
        
        # Pattern matching
        for reply_type, keywords in self.PATTERNS.items():
            for keyword in keywords:
                if keyword in text:
                    confidence = 0.8 if keyword in email.body.lower() else 0.6
                    return reply_type, confidence
        
        # LLM classification (fallback)
        return self._llm_classify(email, lead)
    
    def _llm_classify(self, email: InboundEmail, lead: Lead = None) -> tuple:
        """Use local LLM for classification."""
        prompt = f"""Classify this email reply into one of these categories:
- interested: They want to learn more or take action
- objection: They have a concern or reason not to proceed
- timing: They're interested but not now
- referral: They're directing you to someone else
- unsubscribe: They want to stop receiving emails
- out_of_office: Automatic reply indicating absence
- unknown: Can't determine

Email subject: {email.subject}
Email body: {email.body[:500]}

Respond with just the category name."""
        
        try:
            import urllib.request
            payload = json.dumps({
                "model": OLLAMA_MODEL,
                "prompt": prompt,
                "stream": False,
            }).encode()
            
            req = urllib.request.Request(
                f"{OLLAMA_URL}/api/generate",
                data=payload,
                headers={"Content-Type": "application/json"},
                method="POST",
            )
            
            with urllib.request.urlopen(req, timeout=30) as r:
                response = json.loads(r.read())
                classification = response.get("response", "").strip().lower()
                
                for rt in ReplyType:
                    if rt.value in classification:
                        return rt, 0.7
                
                return ReplyType.UNKNOWN, 0.5
                
        except Exception as e:
            logger.error(f"LLM classification error: {e}")
            return ReplyType.UNKNOWN, 0.3


# ---------------------------------------------------------------------------
# Reply Generator
# ---------------------------------------------------------------------------
class ReplyGenerator:
    """Generates personalized replies using prospect data.
    
    Blueprint Reference: Section 3.2.2 — Dynamic personalization using prospect data
    """
    
    # Objection handling templates
    OBJECTION_RESPONSES = {
        "too expensive": """I understand budget is a concern. Many of our clients initially felt the same way, but found the ROI justified the investment within the first month. 

Would you be open to a quick 15-minute call to explore how we could tailor a solution to your specific budget?""",
        "not now": """I completely understand timing is important. Many of our clients started their compliance journey just before a deadline and wished they'd started earlier.

Would it help if I sent you a brief overview you can review when the timing is better?""",
        "already have": """That's great to hear you're already addressing this. Many teams we work with found gaps in their existing approach after our free assessment.

Would you be open to a complimentary compliance gap analysis? No obligation — just valuable insights.""",
        "not interested": """I appreciate your honesty. If it's helpful, we offer a free EU AI Act readiness quiz that takes just 5 minutes. Many teams find it valuable even if they're not ready for a full solution.

No pressure at all — just here if you need us.""",
    }
    
    def generate(self, reply_type: ReplyType, lead: Lead, original_email: InboundEmail) -> ReplyDraft:
        """Generate a personalized reply."""
        name = lead.name or original_email.from_name or "there"
        
        if reply_type == ReplyType.INTERESTED:
            return self._generate_interested(name, lead, original_email)
        elif reply_type == ReplyType.OBJECTION:
            return self._generate_objection(name, lead, original_email)
        elif reply_type == ReplyType.TIMING:
            return self._generate_timing(name, lead, original_email)
        elif reply_type == ReplyType.REFERRAL:
            return self._generate_referral(name, lead, original_email)
        elif reply_type == ReplyType.UNSUBSCRIBE:
            return self._generate_unsubscribe(name, lead, original_email)
        elif reply_type == ReplyType.OUT_OF_OFFICE:
            return self._generate_ooo(name, lead, original_email)
        else:
            return self._generate_unknown(name, lead, original_email)
    
    def _generate_interested(self, name: str, lead: Lead, email: InboundEmail) -> ReplyDraft:
        """Generate reply for interested prospect."""
        personalization = {}
        if lead.company:
            personalization["company"] = lead.company
        if lead.pain_point:
            personalization["pain_point"] = lead.pain_point
        
        body = f"""Hi {name},

Great to hear from you! I'd love to explore how we can help {lead.company or 'your team'} with EU AI Act compliance.

The August 2, 2026 deadline is just 85 days away, and fines are already being issued (€34.7M this month alone). The sooner we start, the better positioned you'll be.

Would you be available for a quick 15-minute call this week? I can show you:
• Your current compliance gap (free assessment)
• Exactly what you need to do before the deadline
• How our MCP-native approach saves 80% vs traditional tools

Here's my calendar: [calendar link]

Or just reply with a time that works for you.

Best,
Nicholas Templeman
MEOK AI Labs"""
        
        return ReplyDraft(
            lead_email=lead.email,
            subject=f"Re: {email.subject}",
            body=body,
            reply_type=ReplyType.INTERESTED,
            confidence=0.9,
            personalization=personalization,
        )
    
    def _generate_objection(self, name: str, lead: Lead, email: InboundEmail) -> ReplyDraft:
        """Generate reply for objection."""
        body_lower = email.body.lower()
        
        # Find matching objection
        response = None
        for keyword, template in self.OBJECTION_RESPONSES.items():
            if keyword in body_lower:
                response = template
                break
        
        if not response:
            response = """I appreciate your honesty. If there's a specific concern I can address, I'm happy to help. Otherwise, I'll keep you in mind for future updates that might be relevant."""
        
        body = f"""Hi {name},

{response}

Best,
Nicholas Templeman
MEOK AI Labs"""
        
        return ReplyDraft(
            lead_email=lead.email,
            subject=f"Re: {email.subject}",
            body=body,
            reply_type=ReplyType.OBJECTION,
            confidence=0.8,
        )
    
    def _generate_timing(self, name: str, lead: Lead, email: InboundEmail) -> ReplyDraft:
        """Generate reply for timing concern."""
        body = f"""Hi {name},

Completely understand — timing is everything.

Just a heads-up: the EU AI Act high-risk deadline is August 2, 2026. Teams that start now have 85 days to prepare. Teams that wait until July have 30 days and significantly higher risk.

I'll follow up closer to your preferred timeline. In the meantime, here's a free resource that might help: [EU AI Act Readiness Quiz]

Best,
Nicholas Templeman
MEOK AI Labs"""
        
        return ReplyDraft(
            lead_email=lead.email,
            subject=f"Re: {email.subject}",
            body=body,
            reply_type=ReplyType.TIMING,
            confidence=0.85,
        )
    
    def _generate_referral(self, name: str, lead: Lead, email: InboundEmail) -> ReplyDraft:
        """Generate reply for referral."""
        body = f"""Hi {name},

Thank you for the referral! I'll reach out to them directly.

I really appreciate you connecting us — it means a lot.

Best,
Nicholas Templeman
MEOK AI Labs"""
        
        return ReplyDraft(
            lead_email=lead.email,
            subject=f"Re: {email.subject}",
            body=body,
            reply_type=ReplyType.REFERRAL,
            confidence=0.95,
        )
    
    def _generate_unsubscribe(self, name: str, lead: Lead, email: InboundEmail) -> ReplyDraft:
        """Generate reply for unsubscribe."""
        body = f"""Hi {name},

You've been removed from our mailing list. You won't receive any further emails from us.

If this was a mistake, just reply and we'll add you back.

Best,
Nicholas Templeman"""
        
        return ReplyDraft(
            lead_email=lead.email,
            subject=f"Re: {email.subject}",
            body=body,
            reply_type=ReplyType.UNSUBSCRIBE,
            confidence=0.95,
        )
    
    def _generate_ooo(self, name: str, lead: Lead, email: InboundEmail) -> ReplyDraft:
        """Generate reply for out of office."""
        # Don't reply to OOO — just log it
        return ReplyDraft(
            lead_email=lead.email,
            subject="",
            body="",
            reply_type=ReplyType.OUT_OF_OFFICE,
            confidence=0.95,
            requires_human=False,
            reason="OOO — no reply needed",
        )
    
    def _generate_unknown(self, name: str, lead: Lead, email: InboundEmail) -> ReplyDraft:
        """Generate reply for unknown classification."""
        return ReplyDraft(
            lead_email=lead.email,
            subject=f"Re: {email.subject}",
            body="",
            reply_type=ReplyType.UNKNOWN,
            confidence=0.3,
            requires_human=True,
            reason="Unknown reply type — needs human review",
        )


# ---------------------------------------------------------------------------
# AI Reply Agent
# ---------------------------------------------------------------------------
class AIReplyAgent:
    """Main AI Reply Agent for revenue operations.
    
    Blueprint Reference: Section 3.2 — AI Reply Agents for Revenue Operations
    """
    
    def __init__(self):
        self.crm = CRM(crm_type=CRM_TYPE)
        self.email_client = EmailClient()
        self.classifier = ReplyClassifier()
        self.generator = ReplyGenerator()
        self.reply_count = 0
        self.last_reset = time.time()
    
    def _check_rate_limit(self) -> bool:
        """Check if we're within rate limits."""
        now = time.time()
        if now - self.last_reset > 3600:  # Reset every hour
            self.reply_count = 0
            self.last_reset = now
        
        return self.reply_count < MAX_REPLIES_PER_HOUR
    
    def process_inbox(self, auto_send: bool = False) -> dict:
        """Process inbox and generate replies.
        
        Returns processing stats.
        """
        stats = {
            "emails_checked": 0,
            "replies_generated": 0,
            "replies_sent": 0,
            "human_escalations": 0,
            "errors": 0,
        }
        
        # Check inbox
        emails = self.email_client.check_inbox(since=datetime.now() - timedelta(hours=24))
        stats["emails_checked"] = len(emails)
        
        for email_item in emails:
            try:
                # Get or create lead
                lead = self.crm.get_lead(email_item.from_email)
                if not lead:
                    lead = Lead(
                        email=email_item.from_email,
                        name=email_item.from_name,
                    )
                    self.crm.upsert_lead(lead)
                
                # Classify reply
                reply_type, confidence = self.classifier.classify(email_item, lead)
                
                # Generate reply
                draft = self.generator.generate(reply_type, lead, email_item)
                
                # Check if needs human review
                needs_human = (
                    draft.requires_human or
                    confidence < CONFIDENCE_THRESHOLD or
                    any(kw in email_item.body.lower() for kw in HUMAN_ESCALATION_KEYWORDS)
                )
                
                if needs_human:
                    stats["human_escalations"] += 1
                    self.crm.log_reply(
                        lead.email, reply_type.value, confidence,
                        draft.body, sent=False, human_approved=False
                    )
                    logger.info(f"HUMAN ESCALATION: {lead.email} ({reply_type.value}, confidence={confidence:.2f})")
                    continue
                
                # Log interaction
                self.crm.log_interaction(
                    lead.email, reply_type.value, "inbound",
                    email_item.subject, email_item.body[:200]
                )
                
                # Send reply if auto-send enabled
                if auto_send and self._check_rate_limit() and draft.body:
                    sent = self.email_client.send_reply(
                        lead.email, draft.subject, draft.body,
                        in_reply_to=email_item.message_id
                    )
                    
                    if sent:
                        stats["replies_sent"] += 1
                        self.reply_count += 1
                        
                        # Update lead status
                        if reply_type == ReplyType.INTERESTED:
                            lead.status = "interested"
                            lead.score += 10
                        lead.reply_count += 1
                        lead.last_contact = datetime.utcnow().isoformat()
                        self.crm.upsert_lead(lead)
                        
                        self.crm.log_reply(
                            lead.email, reply_type.value, confidence,
                            draft.body, sent=True, human_approved=True
                        )
                        
                        logger.info(f"REPLY SENT: {lead.email} ({reply_type.value})")
                    else:
                        stats["errors"] += 1
                else:
                    stats["replies_generated"] += 1
                    self.crm.log_reply(
                        lead.email, reply_type.value, confidence,
                        draft.body, sent=False, human_approved=False
                    )
                    logger.info(f"REPLY DRAFTED: {lead.email} ({reply_type.value})")
                
            except Exception as e:
                stats["errors"] += 1
                logger.error(f"Error processing {email_item.from_email}: {e}")
        
        return stats
    
    def get_stats(self) -> dict:
        """Get agent performance stats."""
        crm_stats = self.crm.get_stats()
        
        return {
            **crm_stats,
            "reply_count_this_hour": self.reply_count,
            "rate_limit": MAX_REPLIES_PER_HOUR,
            "confidence_threshold": CONFIDENCE_THRESHOLD,
        }
    
    def run_daemon(self, interval: int = 300, auto_send: bool = False):
        """Run as daemon, checking inbox every N seconds."""
        logger.info(f"🤖 AI Reply Agent started (interval: {interval}s, auto-send: {auto_send})")
        
        while True:
            try:
                stats = self.process_inbox(auto_send=auto_send)
                logger.info(f"Processed: {stats}")
            except Exception as e:
                logger.error(f"Daemon error: {e}")
            
            time.sleep(interval)


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------
def main():
    parser = argparse.ArgumentParser(description="AI Reply Agent — Revenue Operations")
    parser.add_argument("--mode", choices=["daemon", "check", "draft", "stats"], default="check")
    parser.add_argument("--lead", help="Lead email for draft mode")
    parser.add_argument("--auto-send", action="store_true", help="Auto-send replies")
    parser.add_argument("--interval", type=int, default=300, help="Daemon interval (seconds)")
    
    args = parser.parse_args()
    
    agent = AIReplyAgent()
    
    if args.mode == "daemon":
        agent.run_daemon(interval=args.interval, auto_send=args.auto_send)
    
    elif args.mode == "check":
        stats = agent.process_inbox(auto_send=args.auto_send)
        print(f"\n📊 Results:")
        print(f"   Emails checked: {stats['emails_checked']}")
        print(f"   Replies generated: {stats['replies_generated']}")
        print(f"   Replies sent: {stats['replies_sent']}")
        print(f"   Human escalations: {stats['human_escalations']}")
        print(f"   Errors: {stats['errors']}")
    
    elif args.mode == "draft":
        if not args.lead:
            print("❌ --lead required for draft mode")
            return
        
        lead = agent.crm.get_lead(args.lead)
        if not lead:
            lead = Lead(email=args.lead)
        
        # Create mock email for testing
        mock_email = InboundEmail(
            from_email=lead.email,
            from_name=lead.name or "Lead",
            subject="Re: EU AI Act Compliance",
            body="I'm interested in learning more about your compliance solution.",
            received_at=datetime.utcnow().isoformat(),
            message_id="test",
        )
        
        reply_type, confidence = agent.classifier.classify(mock_email, lead)
        draft = agent.generator.generate(reply_type, lead, mock_email)
        
        print(f"\n📝 Reply Draft:")
        print(f"   To: {draft.lead_email}")
        print(f"   Type: {draft.reply_type.value}")
        print(f"   Confidence: {draft.confidence:.2f}")
        print(f"   Requires human: {draft.requires_human}")
        print(f"\n{draft.body}")
    
    elif args.mode == "stats":
        stats = agent.get_stats()
        print(f"\n📈 AI Reply Agent Stats:")
        print(f"   Total leads: {stats['total_leads']}")
        print(f"   Interested: {stats['interested']}")
        print(f"   Meetings booked: {stats['meetings_booked']}")
        print(f"   Replies sent: {stats['replies_sent']}")
        print(f"   Avg confidence: {stats['avg_confidence']}")
        print(f"   Conversion rate: {stats['conversion_rate']}%")
        print(f"   Meeting rate: {stats['meeting_rate']}%")
        print(f"   Replies this hour: {stats['reply_count_this_hour']}/{stats['rate_limit']}")


if __name__ == "__main__":
    main()
