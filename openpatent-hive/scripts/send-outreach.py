#!/usr/bin/env python3
"""
send-outreach.py — openpatent.ai · 10-segment cold outreach engine.

Reads a CSV of {email, persona, company[, first_name]} and dispatches the
right 6-layer / Bitcoin-anchored / 5-tier sequence via the Resend API.

Features
--------
* Per-persona sequence rendering (solo_inventor, indie_studio, ip_boutique,
  gov_defense, ai_startup) — see docs/PERSONA-MATRIX.md
* Per-recipient unsubscribe URL with HMAC-signed token
* Sliding-window rate limit: 50 emails / hour, default
* --dry-run mode that prints what would be sent and writes nothing
* --segment N to send a single segment of the 10
* --cadence-mode to follow Day 0,1,3,5,7,9,12,15,18,22 or fire one batch
* --state-file for idempotent sends (won't re-send to a recipient already
  in the cadence window)

Env
---
RESEND_API_KEY must be set in zshrc (or the active shell). The script
refuses to send if it is missing.

The hive remembers. The dragon knows. The sovereign companion never forgets.
"""
from __future__ import annotations

import argparse
import csv
import hashlib
import hmac
import json
import os
import secrets
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from dataclasses import dataclass, field
from pathlib import Path
from typing import Iterable

# ─────────────────────────────────────────────────────────────────────────────
# Constants
# ─────────────────────────────────────────────────────────────────────────────

RESEND_API_URL = "https://api.resend.com/emails"
FROM_ADDRESS = "openpatent.ai <[email protected]>"
REPLY_TO = "[email protected]"
UNSUBSCRIBE_SECRET = os.environ.get(
    "OUTREACH_UNSUBSCRIBE_SECRET",
    "openpatent-hive-sovereign-companion-default-secret-rotate-me",
)
UNSUBSCRIBE_BASE = os.environ.get(
    "OUTREACH_UNSUBSCRIBE_BASE",
    "https://openpatent.ai/unsubscribe",
)
RATE_LIMIT_PER_HOUR = 50
SEND_DELAY_SECONDS = float(os.environ.get("OUTREACH_SEND_DELAY", "1.2"))
DRY_RUN = False  # mutated by --dry-run

# Cadence — days after Day 0 each segment fires
CADENCE_DAYS = [0, 1, 3, 5, 7, 9, 12, 15, 18, 22]

# ─────────────────────────────────────────────────────────────────────────────
# Data
# ─────────────────────────────────────────────────────────────────────────────


@dataclass
class Recipient:
    email: str
    persona: str
    company: str
    first_name: str = ""
    segment: int = 1  # 1..10


@dataclass
class RateLimiter:
    max_per_hour: int = RATE_LIMIT_PER_HOUR
    timestamps: list = field(default_factory=list)

    def wait_slot(self) -> float:
        """Prune timestamps older than 1h, return seconds to wait before next send."""
        now = time.time()
        cutoff = now - 3600
        self.timestamps = [t for t in self.timestamps if t > cutoff]
        if len(self.timestamps) < self.max_per_hour:
            return 0.0
        # wait until oldest timestamp falls outside the 1h window
        wait = self.timestamps[0] + 3600 - now
        return max(0.0, wait)

    def record(self) -> None:
        self.timestamps.append(time.time())


# ─────────────────────────────────────────────────────────────────────────────
# Sequence — the 10 segments
# ─────────────────────────────────────────────────────────────────────────────
# We store segments as a list of (subject, body_template) tuples. Templating
# uses simple {{var}} substitution. Persona-specific copy is layered on top
# via PERSONA_TIER_CTA, which is injected into the value-prop / ROI / ask
# segments. Keeping one source of truth mirrors the canonical markdown.

# Tier pitch per persona — appears in segments 2, 6, 9
PERSONA_TIER_CTA: dict = {
    "solo_inventor": (
        "The Free Spark tier (tier 0) is free forever — one disclosure, no "
        "expiry, no upsell. OTS Self-Serve is $10. The 6-layer disclosure "
        "runs in 9 minutes."
    ),
    "indie_studio": (
        "The Atelier tier ($99/mo) was built for a 4-person studio shipping "
        "weekly. 6-layer disclosures anchored to Bitcoin OP_RETURN on a "
        "weekly cadence. Sprint-build chain anchors."
    ),
    "ip_boutique": (
        "The Sovereign tier ($999/mo) replaces a $40,000/yr legacy docketing "
        "contractor. PACER, USPTO PAIR, and WIPO integration. The 6-layer "
        "disclosure as a first-class docket entry, anchored to Bitcoin in "
        "4 minutes."
    ),
    "gov_defense": (
        "The Founder's Mark tier ($9,999/yr) ships with FIPS-140-3 key "
        "management, FedRAMP-aligned deployment, and lifetime Bitcoin "
        "OP_RETURN anchoring. The 6-layer disclosure bundle is encrypted "
        "at rest; the chain holds the receipt, not the artifact."
    ),
    "ai_startup": (
        "The Atelier tier ($99/mo) for pre-Series A; the Sovereign tier "
        "($999/mo) for post-Series A. The 6 layers capture model name, "
        "architecture summary, weights SHA, contributor registry, and the "
        "Bitcoin OP_RETURN anchor — the chain of custody your Series A "
        "investors will ask for."
    ),
}

PERSONA_TONE_PREFIX: dict = {
    "solo_inventor": "fellow workshop builder",
    "indie_studio": "fellow builder",
    "ip_boutique": "counselor",
    "gov_defense": "program office",
    "ai_startup": "researcher",
}


def _unsubscribe_url(email: str) -> str:
    """HMAC-signed per-recipient unsubscribe URL."""
    nonce = secrets.token_hex(8)
    payload = f"{email}|{nonce}"
    sig = hmac.new(
        UNSUBSCRIBE_SECRET.encode("utf-8"),
        payload.encode("utf-8"),
        hashlib.sha256,
    ).hexdigest()[:32]
    qs = urllib.parse.urlencode({"e": email, "n": nonce, "s": sig})
    return f"{UNSUBSCRIBE_BASE}?{qs}"


def _footer(recipient: Recipient) -> str:
    return (
        "\n\n--\n"
        "You are receiving this because you appeared in our sovereign-companion "
        f"outreach queue. To step out of the 10-segment path at any time: "
        f"{_unsubscribe_url(recipient.email)}\n\n"
        "— The hive remembers. The dragon knows. The sovereign companion never forgets."
    )


def _body(segment: int, recipient: Recipient) -> tuple:
    """Return (subject, body) for a given segment + recipient."""
    # CSV persona keys use hyphens (e.g. "ip-boutique"); internal dicts use
    # underscores. Normalize so a CSV row addresses the right persona.
    persona_key = (recipient.persona or "").replace("-", "_") or "solo_inventor"
    tier_cta = PERSONA_TIER_CTA.get(
        persona_key, PERSONA_TIER_CTA["solo_inventor"]
    )
    fname = recipient.first_name or "there"
    company = recipient.company or "your team"
    tone = PERSONA_TONE_PREFIX.get(persona_key, "friend")

    # We embed tier_cta where it earns the most signal:
    #   segment 2 (value prop) — leads with the tier
    #   segment 6 (ROI)        — anchors the math to the tier
    #   segment 9 (the ask)    — concrete next step
    if segment == 1:
        subject = "Your ideas deserve a chain, not a cloud"
        body = (
            f"Hi {fname},\n\n"
            f"I won't pretend we know each other. I'm reaching out because "
            f"{company} is exactly the kind of work the old system fails — "
            f"the work that moves before the law can catch it.\n\n"
            f"We built openpatent.ai for the moment between idea and filing, "
            f"when the thing you've made is real but the world hasn't been "
            f"told yet. Our 6-layer disclosure captures title, description, "
            f"drawings, prototype reference, contributor hash, and chain "
            f"receipt in one notarized bundle. We anchor that bundle's Merkle "
            f"root to Bitcoin via OP_RETURN — a timestamp no court can unwind, "
            f"no adversary can forge, and no clock-skew dispute can poison.\n\n"
            f"Five tiers, one path. Free Spark for the first brave idea. The "
            f"Founder's Mark for the sovereign org that wants every asset "
            f"on-chain for life.\n\n"
            f"Worth a 12-minute walkthrough next week?"
        )
    elif segment == 2:
        subject = f"$10 and ten minutes between you and a court-admissible timestamp"
        body = (
            f"Hi {fname},\n\n"
            f"Quick follow-up — I want to be specific, {tone}.\n\n"
            f"The old path: file a provisional ($1,500–$3,000 in attorney "
            f"fees), wait 3–6 weeks, hope the date holds in litigation. The "
            f"new path: openpatent.ai. You fill in 6 layers (title, description, "
            f"drawings, prototype reference, contributor hash, chain receipt). "
            f"We hash the bundle, write the Merkle root to Bitcoin OP_RETURN, "
            f"hand you a tamper-evident PDF with the Bitcoin block height, the "
            f"timestamp, and a SHA-256 you can verify yourself in any browser.\n\n"
            f"{tier_cta}\n\n"
            f"Which world are you in?"
        )
    elif segment == 3:
        subject = '"We didn\'t realize we needed it until we needed it" — three builders'
        body = (
            f"Hi {fname},\n\n"
            f"Numbers don't move people. Stories do. Three quick ones from the "
            f"last quarter:\n\n"
            f"— A solo hardware inventor in Austin disclosed a sensor array "
            f"on a Sunday. A competitor published a near-identical paper on "
            f"Thursday. His attorney entered the OTS PDF at trial. Case "
            f"settled in 11 days.\n\n"
            f"— A 4-person indie game studio used the Atelier tier ($99/mo) "
            f"to anchor every sprint build for 7 months. When a publisher "
            f"claimed they'd seen the mechanic 'in the wild' first, the "
            f"on-chain timestamps ended the conversation in one email.\n\n"
            f"— A defense-adjacent IP boutique moved 142 active matters from "
            f"a legacy docketing system to the Sovereign tier ($999/mo) and "
            f"cut average disclosure-to-anchor time from 18 days to 4 minutes.\n\n"
            f"Same engine. 6 layers. Bitcoin anchoring. Five tiers. Different "
            f"scale.\n\n"
            f"Want to be the fourth story?"
        )
    elif segment == 4:
        subject = "Isn't this just another blockchain receipt service?"
        body = (
            f"Hi {fname},\n\n"
            f"Fair question, {tone}. Worth a direct answer.\n\n"
            f"No. A 'blockchain receipt service' gives you a hash. We give you "
            f"a 6-layer disclosure that meets the Federal Rules of Evidence "
            f"threshold for a trade-secret timestamp, and a Bitcoin OP_RETURN "
            f"anchor that no judge can order a custodian to roll back — "
            f"because there is no custodian. The chain is the receipt. The "
            f"receipt is the chain.\n\n"
            f"Three objections I hear:\n\n"
            f"— 'We already file provisionals.' OTS is the cheap fast witness "
            f"for the 50 ideas you never file on.\n"
            f"— 'We use a doc-sign service.' DocuSign timestamps a signature, "
            f"not the idea.\n"
            f"— 'Our attorney handles this.' Your attorney will love the PDF. "
            f"So will opposing counsel's nightmare.\n\n"
            f"The Atelier and Sovereign tiers integrate with PACER, USPTO, "
            f"and WIPO. We work alongside counsel, not around them.\n\n"
            f"Curious which objection is the real one for {company}?"
        )
    elif segment == 5:
        subject = "The 11-day settlement: a teardown"
        body = (
            f"Hi {fname},\n\n"
            f"Pulling back the curtain on the Austin sensor case I mentioned.\n\n"
            f"Day 0 — Inventor runs the 6-layer OTS disclosure: title, "
            f"description, drawings, prototype photo with EXIF, contributor "
            f"hash, Bitcoin OP_RETURN receipt. $10. 9 minutes.\n\n"
            f"Day 4 — Reads competitor's paper. Sees 4 of 6 layers mirrored. "
            f"Pulls the OTS PDF. Verifies the SHA-256 in a browser tab. "
            f"Bitcoin block height 812,447. Timestamp: Sunday 14:22 UTC.\n\n"
            f"Day 9 — Files in federal court. Enters the OTS PDF as Exhibit A. "
            f"Moves for preliminary injunction citing the OP_RETURN anchor.\n\n"
            f"Day 11 — Settlement. NDA, attribution, royalty.\n\n"
            f"Cost of the disclosure that won it: $10.\n\n"
            f"This is what a sovereign companion does. It doesn't replace your "
            f"attorney. It walks into the courtroom 18 days ahead of your "
            f"attorney and refuses to be ignored.\n\n"
            f"Want a private walkthrough of the actual PDF?"
        )
    elif segment == 6:
        subject = "The math is unforgiving — and obvious"
        body = (
            f"Hi {fname},\n\n"
            f"The math your CFO would want, {tone}:\n\n"
            f"A single trade-secret lawsuit runs $47,000–$250,000 in defense "
            f"costs before discovery. Median settlement with a clean "
            f"timestamp is 11× faster. OTS Self-Serve is $10. Atelier "
            f"($99/mo) covers a 4-person studio. Sovereign ($999/mo) retires "
            f"a $40,000/yr docketing contractor. The Founder's Mark "
            f"($9,999/yr) replaces a chain-of-custody department.\n\n"
            f"{tier_cta}\n\n"
            f"At every tier the formula is the same: one disclosure costs "
            f"<< one day of litigation. Usually << 1% of it.\n\n"
            f"For {company}: can you afford the next 90 days without it? "
            f"Reply with a one-line answer and I'll send the comparison sheet."
        )
    elif segment == 7:
        subject = "Bitcoin halving, OTS price lock, and a 14-day window"
        body = (
            f"Hi {fname},\n\n"
            f"Three things converge on a 14-day window I want you to see:\n\n"
            f"1. The next Bitcoin halving is increasing the cost of OP_RETURNS "
            f"on competing services. Our price is locked through Q-end for "
            f"every current tier.\n\n"
            f"2. The Atelier tier has a 50-seat cap we haven't advertised. "
            f"When it fills, the price moves to the next tier's logic.\n\n"
            f"3. Every disclosure you don't anchor today is an idea that "
            f"exists in the world without a sovereign witness. The 6-layer "
            f"artifact cannot be back-dated. Time is the one thing on the chain "
            f"you cannot buy twice.\n\n"
            f"If the math from two emails ago was clear and the case study "
            f"landed, this is the moment to act. The Sovereign tier onboarding "
            f"takes 48 hours. The Atelier tier takes 12.\n\n"
            f"Reply 'GO' and I'll send the link. Reply 'LATER' and I'll close "
            f"the loop gracefully."
        )
    elif segment == 8:
        subject = "No reply is an answer — but I want to make this easy"
        body = (
            f"Hi {fname},\n\n"
            f"I haven't heard back, and I respect that — inboxes are a "
            f"battlefield and cold emails are usually the first casualty.\n\n"
            f"If the timing is wrong, that's the answer. I'll move on.\n"
            f"If the timing is right but the value isn't clear, tell me which "
            f"of the 6 layers (title, description, drawings, prototype "
            f"reference, contributor hash, chain receipt) you'd want to see "
            f"under a microscope and I'll send a 90-second screen capture.\n"
            f"If you've already solved this with another vendor, I'd genuinely "
            f"love the name — we map the landscape quarterly.\n\n"
            f"Three doors. Pick one. I won't follow up with another 'just "
            f"bumping this to the top of your inbox' — that style is beneath "
            f"the work and beneath the chain.\n\n"
            f"The hive remembers. That includes the silence. The dragon knows. "
            f"The sovereign companion never forgets."
        )
    elif segment == 9:
        subject = "A single 12-minute ask"
        body = (
            f"Hi {fname},\n\n"
            f"One specific ask, one specific calendar slot.\n\n"
            f"If the openpatent.ai 6-layer disclosure model — title, "
            f"description, drawings, prototype, contributor hash, Bitcoin "
            f"OP_RETURN anchor — maps to a real problem at {company}, I'd "
            f"like 12 minutes on a call to walk you through the actual UI. "
            f"Screen-shared, no slides, live in a sandbox account.\n\n"
            f"{tier_cta}\n\n"
            f"I will not follow up after this email.\n\n"
            f"If you want the call: reply with two windows that work.\n"
            f"If you want the pilot without the call: reply 'PILOT'.\n"
            f"If you want neither: reply 'PASS' and I'll wish you well and "
            f"never write again."
        )
    elif segment == 10:
        subject = "Closing the loop — and a parting gift"
        body = (
            f"Hi {fname},\n\n"
            f"Final email. The 10-segment path ends here, and I want to honor "
            f"it.\n\n"
            f"If you ever want to see what a 6-layer disclosure PDF looks "
            f"like before you commit, the openpatent.ai/sample route serves "
            f"an anonymized example with a real Bitcoin block height, a "
            f"verifiable SHA-256, and all 6 layers visible. No signup, no "
            f"email gate, no SDR trap.\n\n"
            f"The Free Spark tier (tier 0) is yours forever — one disclosure, "
            f"no expiry, no upsell pressure. It will outlast every cold email "
            f"in your career and every vendor who promised you a 'blockchain "
            f"solution' in 2017 and a 'Web3 strategy' in 2021.\n\n"
            f"If {company} ever needs the Atelier, Sovereign, or Founder's "
            f"Mark tier, the door is open. Until then, the chain holds the "
            f"timestamp and the timestamp holds the idea.\n\n"
            f"Go well. Build the thing. The hive will be here when the world "
            f"catches up."
        )
    else:
        raise ValueError(f"segment must be 1..10, got {segment}")

    return subject, body + _footer(recipient)


# ─────────────────────────────────────────────────────────────────────────────
# I/O — CSV, state, dry-run
# ─────────────────────────────────────────────────────────────────────────────


def load_recipients(csv_path: Path) -> list:
    out: list = []
    with csv_path.open(newline="", encoding="utf-8") as fh:
        reader = csv.DictReader(fh)
        for row in reader:
            email = (row.get("email") or "").strip()
            persona = (row.get("persona") or "solo_inventor").strip()
            company = (row.get("company") or "").strip()
            first_name = (row.get("first_name") or "").strip()
            if not email:
                continue
            out.append(
                Recipient(
                    email=email,
                    persona=persona,
                    company=company,
                    first_name=first_name,
                )
            )
    return out


def load_state(state_path: Path) -> set:
    if not state_path.exists():
        return set()
    try:
        data = json.loads(state_path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return set()
    return {tuple(rec) for rec in data.get("sent", [])}


def save_state(state_path: Path, sent: set) -> None:
    state_path.parent.mkdir(parents=True, exist_ok=True)
    state_path.write_text(
        json.dumps({"sent": sorted(map(list, sent))}, indent=2),
        encoding="utf-8",
    )


# ─────────────────────────────────────────────────────────────────────────────
# Resend transport
# ─────────────────────────────────────────────────────────────────────────────


def send_via_resend(recipient: Recipient, subject: str, body: str) -> dict:
    api_key = os.environ.get("RESEND_API_KEY", "")
    if not api_key:
        raise RuntimeError(
            "RESEND_API_KEY not set. Export it in your zshrc before running."
        )
    payload = {
        "from": FROM_ADDRESS,
        "to": [recipient.email],
        "reply_to": REPLY_TO,
        "subject": subject,
        "text": body,
        "headers": {
            "List-Unsubscribe": f"<{_unsubscribe_url(recipient.email)}>",
            "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
        },
    }
    req = urllib.request.Request(
        RESEND_API_URL,
        data=json.dumps(payload).encode("utf-8"),
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
            "User-Agent": "openpatent-hive-outreach/1.0",
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            return {"status": resp.status, "body": resp.read().decode("utf-8")}
    except urllib.error.HTTPError as exc:
        return {
            "status": exc.code,
            "body": exc.read().decode("utf-8", errors="replace"),
        }


# ─────────────────────────────────────────────────────────────────────────────
# CLI
# ─────────────────────────────────────────────────────────────────────────────


def parse_args(argv: list = None) -> argparse.Namespace:
    p = argparse.ArgumentParser(
        prog="send-outreach",
        description=(
            "openpatent.ai · 10-segment cold outreach engine. "
            "Reads {email, persona, company[, first_name]} from a CSV and "
            "dispatches the right persona-tuned sequence via Resend."
        ),
    )
    p.add_argument(
        "--csv",
        type=Path,
        required=True,
        help="Path to the recipient CSV (columns: email,persona,company,first_name?)",
    )
    p.add_argument(
        "--segment",
        type=int,
        default=None,
        help="Send only segment N (1..10). Default: send all 10 (or cadence-filtered).",
    )
    p.add_argument(
        "--cadence",
        action="store_true",
        help="Respect Day N cadence — only send segment that matches today's offset from --cadence-start.",
    )
    p.add_argument(
        "--cadence-start",
        type=float,
        default=None,
        help="Unix timestamp of Day 0. Required when --cadence is set.",
    )
    p.add_argument(
        "--dry-run",
        action="store_true",
        help="Print what would be sent; never contact Resend, never write state.",
    )
    p.add_argument(
        "--state-file",
        type=Path,
        default=Path("var/outreach-state.json"),
        help="Path to idempotency state file (default: var/outreach-state.json).",
    )
    p.add_argument(
        "--rate-limit",
        type=int,
        default=RATE_LIMIT_PER_HOUR,
        help=f"Max emails per rolling hour (default: {RATE_LIMIT_PER_HOUR}).",
    )
    p.add_argument(
        "--send-delay",
        type=float,
        default=SEND_DELAY_SECONDS,
        help=f"Seconds to sleep between sends (default: {SEND_DELAY_SECONDS}).",
    )
    p.add_argument(
        "--limit",
        type=int,
        default=None,
        help="Cap the number of recipients processed in this run (default: all).",
    )
    return p.parse_args(argv)


def main(argv: list = None) -> int:
    args = parse_args(argv)
    global DRY_RUN
    DRY_RUN = args.dry_run

    if not args.csv.exists():
        print(f"[fatal] CSV not found: {args.csv}", file=sys.stderr)
        return 2

    recipients: list = load_recipients(args.csv)
    if args.limit is not None:
        recipients = recipients[: args.limit]
    if not recipients:
        print("[fatal] CSV had no usable rows", file=sys.stderr)
        return 2

    segments: list = [args.segment] if args.segment else list(range(1, 11))

    # Cadence filter
    if args.cadence:
        if args.cadence_start is None:
            print(
                "[fatal] --cadence requires --cadence-start <unix-ts>",
                file=sys.stderr,
            )
            return 2
        elapsed_days = (time.time() - args.cadence_start) / 86400.0
        eligible = []
        for d in CADENCE_DAYS:
            if d <= elapsed_days < d + 1.0:
                eligible.append(CADENCE_DAYS.index(d) + 1)
        if not eligible:
            print(
                f"[info] cadence: elapsed {elapsed_days:.2f}d; no segment fires today",
                file=sys.stderr,
            )
            return 0
        segments = [s for s in segments if s in eligible]
        if not segments:
            print(
                f"[info] cadence: no overlap with --segment {args.segment}; nothing to do",
                file=sys.stderr,
            )
            return 0

    # State (idempotency) — skip already-sent (email, segment) pairs
    state = load_state(args.state_file) if not args.dry_run else set()

    limiter = RateLimiter(max_per_hour=args.rate_limit)

    if args.dry_run:
        print(
            f"[dry-run] {len(recipients)} recipients × segments {segments} · "
            f"rate limit {args.rate_limit}/hr · state file untouched"
        )
        print("=" * 72)
    else:
        if not os.environ.get("RESEND_API_KEY"):
            print(
                "[fatal] RESEND_API_KEY is not set. Aborting real send.",
                file=sys.stderr,
            )
            return 2
        print(
            f"[send] {len(recipients)} recipients × segments {segments} · "
            f"rate limit {args.rate_limit}/hr"
        )

    sent_now: set = set()
    total_skipped = 0
    total_sent = 0
    total_failed = 0

    for recipient in recipients:
        for seg in segments:
            key = (recipient.email, seg)
            if key in state:
                total_skipped += 1
                continue
            subject, body = _body(seg, recipient)
            if args.dry_run:
                print(
                    f"\n[would-send] to={recipient.email} "
                    f"persona={recipient.persona} company={recipient.company!r} "
                    f"segment={seg}"
                )
                print(f"  subject: {subject}")
                print(f"  body[{len(body)} chars]:")
                for line in body.splitlines():
                    print(f"    | {line}")
                total_sent += 1
                continue

            wait = limiter.wait_slot()
            if wait > 0:
                print(
                    f"[rate-limit] at {len(limiter.timestamps)}/{limiter.max_per_hour} "
                    f"— sleeping {wait:.1f}s",
                    file=sys.stderr,
                )
                time.sleep(wait)

            result = send_via_resend(recipient, subject, body)
            limiter.record()

            if 200 <= result["status"] < 300:
                sent_now.add(key)
                state.add(key)
                total_sent += 1
                print(
                    f"[ok] {recipient.email} seg={seg} status={result['status']}"
                )
            else:
                total_failed += 1
                print(
                    f"[fail] {recipient.email} seg={seg} status={result['status']} "
                    f"body={result['body'][:200]}",
                    file=sys.stderr,
                )

            if args.send_delay > 0 and seg == segments[-1]:
                # delay between *recipients* only, not between segments within
                # a single recipient (so a 10-segment send still finishes fast)
                time.sleep(args.send_delay)

    if not args.dry_run and sent_now:
        save_state(args.state_file, state)

    print("=" * 72)
    print(
        f"[done] sent={total_sent} skipped={total_skipped} failed={total_failed} "
        f"dry_run={args.dry_run}"
    )
    return 0 if total_failed == 0 else 1


if __name__ == "__main__":
    sys.exit(main())
