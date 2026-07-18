#!/usr/bin/env python3
"""HIVE MAILER — the hive sends its own outreach. Runs every 30 min via launchd.

Flow each run:
  1. Ask Resend to verify mail.meok.ai (no-op once verified).
  2. If the domain is NOT verified yet → exit quietly (fires automatically later).
  3. If verified → send up to DAILY_CAP queued emails from hello@mail.meok.ai,
     staggered 45-90s, reply-to Nick's real inbox. Mark sent in the queue (JSONL).

Queue: ~/clawd/hive-mailer/queue.jsonl   {"to":..,"subject":..,"body":..,"status":"queued"}
Log:   ~/clawd/hive-mailer/mailer.log
"""
import json, os, random, re, time, urllib.request
from datetime import date, datetime
from pathlib import Path

HOME = Path(__file__).parent
QUEUE = HOME / "queue.jsonl"
LOG = HOME / "mailer.log"
SENT_TODAY = HOME / f".sent-{date.today()}"
DAILY_CAP = 25
DOMAIN_ID = "3f47ef69-527d-4f65-9266-2c2a9fa985f0"  # mail.meok.ai in Resend
FROM = "Nick Templeman <hello@mail.meok.ai>"
REPLY_TO = "nicholas@meok.ai"

# Extract a clean email from rows where the operator left annotations
# like "press@ico.org.uk (or relevant contact)" or
# "lloyds.com (press office, or AIDataScience@lloyds.com)".
# First RFC-ish match wins; if none, return None so caller can skip.
_EMAIL_RE = re.compile(r"[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}")

def parse_email(raw):
    if not raw:
        return None
    raw = raw.strip()
    # If it's already clean, return it
    if _EMAIL_RE.fullmatch(raw):
        return raw.lower()
    # Otherwise pick the first email-shaped substring
    m = _EMAIL_RE.search(raw)
    return m.group(0).lower() if m else None

# ── Deliverability guard (added 2026-06-16) ──────────────────────────────
# Bounces on guessed/placeholder addresses hurt sender reputation, and on a
# domain whose Resend send-gate already flaps that's the wrong direction.
# Reject reserved/placeholder addresses BEFORE they ship, and never re-send
# to an address we've already seen bounce.
_RESERVED_DOMAINS = {
    "example.com", "example.org", "example.net", "example.edu",
    "test.com", "domain.com", "email.com", "sample.com", "company.com",
    "yourcompany.com", "acme.com", "mycompany.com", "localhost",
}
_RESERVED_TLDS = (".example", ".invalid", ".test", ".local", ".localhost")
_PLACEHOLDER_LOCALPARTS = {
    "name", "firstname", "first.last", "first", "last", "you", "your",
    "email", "test", "example", "user", "username", "contact-name",
    "name.surname", "firstname.lastname", "yourname",
}
SUPPRESS = HOME / ".suppressed"  # one bounced/blocked email per line

def load_suppressed():
    if not SUPPRESS.exists():
        return set()
    return {l.strip().lower() for l in SUPPRESS.read_text().splitlines() if l.strip() and not l.startswith("#")}

def suppress(email, reason=""):
    with SUPPRESS.open("a") as f:
        f.write(f"{email.lower()}\n")
    log(f"SUPPRESSED {email} ({reason})")

def is_sendable(email):
    """Return (ok, reason). Reject placeholders/reserved domains so we don't
    burn reputation on addresses that will bounce or were never real."""
    if not email or "@" not in email:
        return False, "no @"
    local, _, domain = email.rpartition("@")
    domain = domain.lower()
    local = local.lower()
    if domain in _RESERVED_DOMAINS or domain.endswith(_RESERVED_TLDS):
        return False, f"reserved/placeholder domain ({domain})"
    if "." not in domain:
        return False, "domain has no TLD"
    if local in _PLACEHOLDER_LOCALPARTS:
        return False, f"placeholder localpart ({local})"
    return True, ""

def log(m):
    line = f"{time.strftime('%F %T')} {m}"
    LOG.open("a").write(line + "\n")
    print(line)

def resend_key():
    # pulled from GCP Secret Manager (canonical) with env-file fallback.
    # gcloud lives at /Users/nicholas/google-cloud-sdk/bin/gcloud — use full path
    # because launchd runs with a minimal PATH that doesn't include it.
    import subprocess
    gcloud = "/Users/nicholas/google-cloud-sdk/bin/gcloud"
    r = subprocess.run([gcloud, "secrets", "versions", "access", "latest",
                        "--secret=RESEND_API_KEY", "--project=meok-498012"],
                       capture_output=True, text=True)
    if r.returncode == 0 and r.stdout.strip():
        return r.stdout.strip()
    for line in open("/tmp/meok-att.env"):
        if line.startswith("RESEND_API_KEY="):
            return line.split('"')[1]
    raise SystemExit("no resend key")

def api(method, path, key, body=None):
    req = urllib.request.Request(f"https://api.resend.com{path}", method=method,
                                 headers={"Authorization": f"Bearer {key}",
                                          "Content-Type": "application/json",
                                          "User-Agent": "meok-hive-mailer/1.0"},
                                 data=json.dumps(body).encode() if body else None)
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            return json.load(r)
    except urllib.error.HTTPError as e:
        return {"error": e.read().decode()[:200], "status": e.code}

def main():
    key = resend_key()
    api("POST", f"/domains/{DOMAIN_ID}/verify", key)  # idempotent nudge
    dom = api("GET", f"/domains/{DOMAIN_ID}", key)
    status = dom.get("status", "unknown")
    recs = dom.get("records", [])
    if recs and all(r.get("status") == "verified" for r in recs):
        status = "verified"  # aggregate flag lags; per-record truth wins (proven by live send 2026-06-11)
    if status != "verified":
        # Resend's status field flaps between API nodes even after records verify.
        # Live sends are the ground truth (proven 2026-06-11): probe with a real API
        # error check instead of trusting the flag.
        probe = api("POST", "/emails", key, {
            "from": FROM, "to": ["delivered@resend.dev"],
            "subject": "gate-probe", "text": "gate probe"})

        # 3-strike backoff: a single probe 403 is almost always API flap, not
        # a real "domain not verified" state. Only treat it as a hard failure
        # if 3 consecutive probes (30 min apart) all 403. Persist strike count
        # in HOME/.probe_strikes so we survive restarts.
        # v2 (15 Jun 06:50Z): cap at 9 to prevent log spam ("strike 47/3") if Resend
        # is genuinely down. Auto-decay to 0 every 24h so a recovered upstream
        # doesn't keep us gated forever.
        STRIKES = HOME / ".probe_strikes"
        STRIKE_TS = HOME / ".probe_strikes_ts"
        strikes = int(STRIKES.read_text()) if STRIKES.exists() else 0
        if STRIKE_TS.exists():
            try:
                last = datetime.fromisoformat(STRIKE_TS.read_text().strip())
                if (datetime.now() - last).total_seconds() > 86400:
                    log(f"strike counter stale ({strikes}, {(datetime.now()-last).total_seconds()/3600:.0f}h old) — auto-resetting to 0")
                    strikes = 0
            except Exception:
                strikes = 0  # corrupt timestamp file, reset
        STRIKE_CAP = 9

        if not probe.get("id"):
            prev = strikes
            strikes = min(strikes + 1, STRIKE_CAP)
            STRIKES.write_text(str(strikes))
            # Only stamp the timestamp on the FIRST strike, so the 24h auto-decay
            # window measures from when flapping BEGAN — not from the last run.
            # (Bug fixed 2026-06-16: rewriting TS every run pinned the counter at
            # the cap forever and gated all sends, even after the gate cleared.)
            if prev == 0:
                STRIKE_TS.write_text(datetime.now().isoformat())
            if strikes < 3:
                log(f"probe 403 strike {strikes}/3 — assuming flap, proceeding")
                # fall through to send
            else:
                log(f"probe 403 strike {strikes}/{STRIKE_CAP} (gate at 3) — waiting")
                return
        else:
            if strikes:
                log(f"probe recovered after {strikes} strikes — proceeding")
            STRIKES.write_text("0")
            STRIKE_TS.write_text(datetime.now().isoformat())
            log(f"status flag={status} but probe SENT ({probe['id']}) — proceeding")
    sent_today = int(SENT_TODAY.read_text()) if SENT_TODAY.exists() else 0
    if sent_today >= DAILY_CAP:
        log(f"daily cap reached ({sent_today}/{DAILY_CAP})")
        return
    if not QUEUE.exists():
        log("no queue file")
        return
    rows = [json.loads(l) for l in QUEUE.read_text().splitlines() if l.strip()]
    # Requeue transient send failures. A row marked "error" was almost always a
    # transient Resend 403/5xx flap (the domain IS verified) — genuinely bad
    # addresses are caught earlier as skipped/skipped_invalid/skipped_suppressed,
    # never as "error". Leaving them "error" parked the whole backlog forever
    # (root cause of the 72-email stall, 2026-06-17). Requeue up to MAX_RETRIES
    # total attempts, then mark terminal "failed".
    MAX_RETRIES = 5
    _requeued = 0
    for _r in rows:
        if _r.get("status") == "error" and _r.get("retries", 0) < MAX_RETRIES:
            _r["status"] = "queued"; _requeued += 1
    if _requeued:
        QUEUE.write_text("\n".join(json.dumps(x) for x in rows) + "\n")
        log(f"requeued {_requeued} transiently-failed emails for retry")
    suppressed = load_suppressed()
    budget = DAILY_CAP - sent_today
    n = 0
    for row in rows:
        if row.get("status") != "queued" or budget <= 0:
            continue
        clean_to = parse_email(row.get("to"))
        if not clean_to:
            row["status"] = "skipped"; row["error"] = "no parseable email in `to` field"
            log(f"SKIP → {row.get('to','?')!r}: no parseable email")
            QUEUE.write_text("\n".join(json.dumps(x) for x in rows) + "\n")
            continue
        # Deliverability guard — never ship to placeholders/reserved domains.
        ok, why = is_sendable(clean_to)
        if not ok:
            row["status"] = "skipped_invalid"; row["error"] = why
            log(f"SKIP → {clean_to}: {why}")
            QUEUE.write_text("\n".join(json.dumps(x) for x in rows) + "\n")
            continue
        # Suppression list — addresses that previously bounced/were blocked.
        if clean_to in suppressed:
            row["status"] = "skipped_suppressed"; row["error"] = "on suppression list (prior bounce)"
            log(f"SKIP → {clean_to}: suppressed")
            QUEUE.write_text("\n".join(json.dumps(x) for x in rows) + "\n")
            continue
        r = api("POST", "/emails", key, {
            "from": FROM, "to": [clean_to], "reply_to": REPLY_TO,
            "subject": row["subject"], "text": row["body"],
        })
        if r.get("id"):
            row["status"] = "sent"; row["resend_id"] = r["id"]; row["sent_at"] = time.strftime("%F %T")
            row["sent_to"] = clean_to  # record the actually-used address
            n += 1; budget -= 1
            log(f"SENT → {clean_to} ({r['id']})")
            QUEUE.write_text("\n".join(json.dumps(x) for x in rows) + "\n")
            SENT_TODAY.write_text(str(sent_today + n))
            time.sleep(random.randint(45, 90))
        else:
            row["retries"] = row.get("retries", 0) + 1
            row["error"] = str(r)[:150]
            if row["retries"] >= MAX_RETRIES:
                row["status"] = "failed"  # terminal — give up after MAX_RETRIES flaps
                log(f"FAIL terminal ({row['retries']} tries) → {clean_to}: {str(r)[:110]}")
            else:
                row["status"] = "queued"  # transient — retry on a later run
                log(f"FAIL retry {row['retries']}/{MAX_RETRIES} → {clean_to}: {str(r)[:110]}")
            QUEUE.write_text("\n".join(json.dumps(x) for x in rows) + "\n")
    log(f"run complete — {n} sent this run")

if __name__ == "__main__":
    main()
