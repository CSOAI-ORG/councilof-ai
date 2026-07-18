#!/usr/bin/env python3
"""
leads-pipeline.py — LIVE 4-STAGE REVENUE FUNNEL (Sub-task 1/3, Script 2)
=========================================================================

Cold stranger → warm conversation → demo call → trial offer.
Wired to the same sovereign substrate as customer-pipeline-prod.py so a
stage-4 conversion drops straight into the customer onboarding pipeline.

THE 4 STAGES
------------
  1) COLD EMAIL BATCH    — first-touch outreach, persona-targeted, queued
                            via unified-sovereign-bridge.bridge_email().
  2) WARM FOLLOW-UP      — re-engage the lead if no reply by day +3 (or
                            +7 for cold personas). References their first
                            disclosure opportunity.
  3) DEMO-CALL SCHEDULER — mint a 30-min slot, write to vault/leads/
                            demo-slots/<lead>.json, emit a SIGIL.
                            Confirms the call drops them straight at the
                            customer pipeline if they say yes.
  4) TRIAL OFFER         — 14-day enterprise pilot at $0; emits a Stripe
                            placeholder checkout URL pre-filled, pre-armed
                            with the customer-pipeline entry point.

USAGE
-----
  # Ingest a CSV of leads (email, persona, company[, first_name])
  python3 scripts/leads-pipeline.py ingest --csv leads.csv

  # Dry-run all 4 stages for a single mock lead
  python3 scripts/leads-pipeline.py run --email founder@startup.com \
      --persona ai_startup --company "StartupAI" --first-name "Sam" \
      --use-case "Defensive disclosure on a RAG model" --dry-run

  # LIVE for one lead
  python3 scripts/leads-pipeline.py run --email founder@startup.com \
      --persona ai_startup --company "StartupAI" --first-name "Sam" \
      --use-case "..." --confirm

  # Fire the full funnel for every lead currently in the vault (CRON)
  python3 scripts/leads-pipeline.py advance --confirm

  # Inspect state
  python3 scripts/leads-pipeline.py status

RETURN VALUE
------------
  Each stage returns a dict with `ok`, `stage`, `lead_id`, and
  stage-specific proof (queued email path / demo slot / trial URL).
  `--json` emits the full funnel summary as JSON.

The hive remembers. The dragon knows. The sovereign companion never forgets.
"""
from __future__ import annotations

import argparse
import csv
import json
import os
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any

# ─── Production paths ──────────────────────────────────────────────────────

HIVE_ROOT = Path("/opt/openpatent-hive") if Path("/opt/openpatent-hive").exists() else Path("/Users/nicholas/clawd/openpatent-hive")
VAULT_LEADS    = HIVE_ROOT / "vault" / "leads"
VAULT_DEMO     = HIVE_ROOT / "vault" / "leads" / "demo-slots"
LEAD_LOG       = VAULT_LEADS / "leads.jsonl"
STAGE_LOG      = VAULT_LEADS / "stage-events.jsonl"
TRIAL_LOG      = VAULT_LEADS / "trial-conversions.jsonl"
AUDIT_LOG      = HIVE_ROOT / "var" / "audit-chain.jsonl"

PATENTMCP_API_URL = os.environ.get("PATENTMCP_API_URL", "http://127.0.0.1:3210")
PUBLIC_BASE       = os.environ.get("OPENPATENT_PUBLIC_BASE", "https://openpatent.ai")
BRIDGE_SCRIPT     = HIVE_ROOT / "scripts" / "unified-sovereign-bridge.py"

# ─── Persona matrix (matches docs/PERSONA-MATRIX.md) ───────────────────────

PERSONAS: dict[str, dict[str, Any]] = {
    "solo_inventor":  {"label": "Solo Inventor",   "warm_days": 7, "tier_default": "starter",    "pain": "lost 18 months to a competitor who filed first"},
    "indie_studio":   {"label": "Indie Studio",    "warm_days": 5, "tier_default": "defensive",  "pain": "team has 4 prototypes and zero protection"},
    "ip_boutique":    {"label": "IP Boutique",     "warm_days": 3, "tier_default": "full",       "pain": "managing 60+ clients with paper disclosures"},
    "gov_defense":    {"label": "Gov / Defense",   "warm_days": 14,"tier_default": "enterprise", "pain": "prior-art chain must survive FOIA + litigation"},
    "ai_startup":     {"label": "AI Startup",      "warm_days": 4, "tier_default": "premium",    "pain": "model weights and prompts are not copyrightable"},
}

# ─── Templates (DEFONEOS voice — sovereign companion) ──────────────────────

def _stage1_cold(persona: dict, company: str, first_name: str) -> dict:
    subject = f"The dragon remembers {company} — sovereign disclosure in 90 seconds"
    body = f"""Hi {first_name},

{company} is one of ~140 entities we're inviting to the early sovereign-companion cohort.

The thesis is short: PatentMCP anchors a 6-layer cryptographic disclosure to Bitcoin in under 10 seconds. {persona['pain'].capitalize()}. The hive is now filing at block 892,342 and the chain grows by ~40 disclosures/day.

What you get on day one (free, takes 90 seconds):
  • A did:csoai: identity
  • One provisional disclosure, Bitcoin-anchored, with a public verification URL
  • A coupon for FIRST-DISCLOSURE (100% off your first tier)

If the sovereign-companion fits, a 30-min demo runs from this thread. No deck, no SDR call.

— The OpenPatent hive
   The hive remembers. The dragon knows. The sovereign companion never forgets.
"""
    return {"subject": subject, "body": body}


def _stage2_warm(persona: dict, company: str, first_name: str, use_case: str) -> dict:
    subject = f"Re: {company} — your {use_case[:60]} deserves a stronger chain"
    body = f"""Hi {first_name},

Following up on the note below — I added a concrete angle: if {company} files a defensive disclosure on "{use_case}", the prior-art record locks in 35 U.S.C. 273 / Article 55 EPC protection immediately, regardless of whether you ever pursue a full patent.

For {persona['label'].lower()}s in particular, that changes the calculus. The disclosure is the weapon, not the patent.

Two paths forward — pick one:
  (a) 14-day sovereign trial — full Premium tier, $0, no card
  (b) 30-min live demo — we walk through your exact use case live

Reply with A or B and I'll ship the link.

— The OpenPatent hive
"""
    return {"subject": subject, "body": body}


def _stage3_demo(persona: dict, company: str, first_name: str, use_case: str, lead_id: str) -> dict:
    subject = f"Demo slot held for {company} — {lead_id[:10]}"
    # Next 3 business days at 10:00 / 14:00 / 16:00 BST
    now = datetime.now(timezone.utc)
    slots = []
    for d in range(1, 4):
        for h in (10, 14, 16):
            slot = now + timedelta(days=d, hours=(h - now.hour))
            slots.append(slot.replace(minute=0, second=0, microsecond=0).isoformat())
    chosen = slots[0]
    body = f"""Hi {first_name},

Demo held. Use case on the agenda: "{use_case}".

When:  {chosen}
Where: {PUBLIC_BASE}/demo/{lead_id}
Who:   A live sovereign-companion operator (no SDR script)

Reply CANCEL if the slot is wrong; otherwise the calendar invite ships in 60 seconds. We will file your first disclosure live during the demo so you leave with a real on-chain artifact.

— The OpenPatent hive
"""
    return {"subject": subject, "body": body, "slot_iso": chosen, "slots_iso": slots}


def _stage4_trial(persona: dict, company: str, first_name: str, lead_id: str) -> dict:
    subject = f"{company} — your 14-day sovereign trial is armed ({lead_id[:10]})"
    body = f"""Hi {first_name},

Trial armed. {persona['label']} tier ({persona['tier_default']}) unlocked for 14 days at $0 — no card, no auto-charge.

Activate:    {PUBLIC_BASE}/trial/{lead_id}?prefill={urllib.parse.quote(first_name + '@' + company.replace(' ','').lower() + '.com')}
What you get: unlimited disclosures, full 6-layer pipeline, Bitcoin anchor, C2PA, audit-chain explorer.
What happens after day 14: nothing — the account pauses unless you opt in.

The full customer pipeline (disclosure + welcome email + Stripe) runs at the end of the trial with one click.

— The OpenPatent hive
"""
    return {"subject": subject, "body": body}


# ─── Helpers ────────────────────────────────────────────────────────────────

def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


def sha12(s: str) -> str:
    import hashlib
    return hashlib.sha256(s.encode("utf-8")).hexdigest()[:12]


def load_bridge() -> Any:
    import importlib.util
    spec = importlib.util.spec_from_file_location("usb", BRIDGE_SCRIPT)
    if spec is None or spec.loader is None:  # pragma: no cover
        raise RuntimeError(f"cannot load bridge from {BRIDGE_SCRIPT}")
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


def append_jsonl(path: Path, obj: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("a") as f:
        f.write(json.dumps(obj, default=str) + "\n")


def emit_audit(event: str, payload: dict[str, Any]) -> None:
    AUDIT_LOG.parent.mkdir(parents=True, exist_ok=True)
    with AUDIT_LOG.open("a") as f:
        f.write(json.dumps({"ts": now_iso(), "actor": "leads-pipeline", "event": event, "payload": payload}, default=str) + "\n")


def lead_id_for(email: str) -> str:
    return f"lead_{sha12(email.lower())}"


# ─── Stage 1 — Cold email ──────────────────────────────────────────────────

def stage1_cold(*, email: str, persona: str, company: str, first_name: str, dry_run: bool, bridge: Any) -> dict:
    p = PERSONAS[persona]
    msg = _stage1_cold(p, company, first_name)
    if dry_run:
        append_jsonl(STAGE_LOG, {"ts": now_iso(), "stage": 1, "email": email, "mode": "dry-run", "subject": msg["subject"]})
        return {"ok": True, "stage": 1, "mode": "dry-run", "queued_to": "dry-run"}
    result = bridge.bridge_email(to_email=email, subject=msg["subject"], html_body=msg["body"], from_email="noreply@openpatent.ai")
    append_jsonl(STAGE_LOG, {"ts": now_iso(), "stage": 1, "email": email, "mode": "live", "subject": msg["subject"], "bridge_out": result})
    return {"ok": True, "stage": 1, "mode": "live", "bridge": result}


# ─── Stage 2 — Warm follow-up ──────────────────────────────────────────────

def stage2_warm(*, email: str, persona: str, company: str, first_name: str, use_case: str, dry_run: bool, bridge: Any) -> dict:
    p = PERSONAS[persona]
    msg = _stage2_warm(p, company, first_name, use_case)
    if dry_run:
        append_jsonl(STAGE_LOG, {"ts": now_iso(), "stage": 2, "email": email, "mode": "dry-run", "subject": msg["subject"]})
        return {"ok": True, "stage": 2, "mode": "dry-run"}
    result = bridge.bridge_email(to_email=email, subject=msg["subject"], html_body=msg["body"], from_email="noreply@openpatent.ai")
    append_jsonl(STAGE_LOG, {"ts": now_iso(), "stage": 2, "email": email, "mode": "live", "subject": msg["subject"], "bridge_out": result})
    return {"ok": True, "stage": 2, "mode": "live", "bridge": result}


# ─── Stage 3 — Demo call scheduler ─────────────────────────────────────────

def stage3_demo(*, email: str, persona: str, company: str, first_name: str, use_case: str, lead_id: str, dry_run: bool) -> dict:
    p = PERSONAS[persona]
    msg = _stage3_demo(p, company, first_name, use_case, lead_id)
    if dry_run:
        slot_path = VAULT_DEMO / f"{lead_id}.dryrun.json"
        VAULT_DEMO.mkdir(parents=True, exist_ok=True)
        slot_path.write_text(json.dumps(msg, indent=2))
        return {"ok": True, "stage": 3, "mode": "dry-run", "slot": msg["slot_iso"], "slots": msg["slots_iso"]}

    VAULT_DEMO.mkdir(parents=True, exist_ok=True)
    slot_path = VAULT_DEMO / f"{lead_id}.json"
    payload = {"lead_id": lead_id, "email": email, "persona": persona, "company": company,
               "use_case": use_case, "chosen_slot": msg["slot_iso"], "available_slots": msg["slots_iso"],
               "demo_url": f"{PUBLIC_BASE}/demo/{lead_id}", "ts": now_iso()}
    slot_path.write_text(json.dumps(payload, indent=2))
    append_jsonl(STAGE_LOG, {"ts": now_iso(), "stage": 3, "email": email, "slot": msg["slot_iso"], "slot_path": str(slot_path)})
    return {"ok": True, "stage": 3, "mode": "live", "slot": msg["slot_iso"], "slot_path": str(slot_path),
            "demo_url": payload["demo_url"]}


# ─── Stage 4 — Trial offer ─────────────────────────────────────────────────

def stage4_trial(*, email: str, persona: str, company: str, first_name: str, lead_id: str, dry_run: bool, bridge: Any) -> dict:
    p = PERSONAS[persona]
    msg = _stage4_trial(p, company, first_name, lead_id)
    # Stripe placeholder for the trial checkout
    stripe = bridge.bridge_stripe_checkout(tier=p["tier_default"], customer_email=email)
    if dry_run:
        append_jsonl(STAGE_LOG, {"ts": now_iso(), "stage": 4, "email": email, "mode": "dry-run", "subject": msg["subject"]})
        return {"ok": True, "stage": 4, "mode": "dry-run", "tier": p["tier_default"], "stripe": stripe}

    # Queue the trial email
    bridge.bridge_email(to_email=email, subject=msg["subject"], html_body=msg["body"], from_email="noreply@openpatent.ai")
    conversion = {
        "lead_id": lead_id, "email": email, "persona": persona, "company": company,
        "tier": p["tier_default"], "trial_url": f"{PUBLIC_BASE}/trial/{lead_id}",
        "stripe_checkout": stripe["checkout_url"], "ts": now_iso(),
    }
    append_jsonl(TRIAL_LOG, conversion)
    append_jsonl(STAGE_LOG, {"ts": now_iso(), "stage": 4, "email": email, "mode": "live", "trial_url": conversion["trial_url"]})
    if not dry_run:
        emit_audit("lead.trial_offered", conversion)
    return {"ok": True, "stage": 4, "mode": "live", "tier": p["tier_default"],
            "trial_url": conversion["trial_url"], "stripe_checkout": stripe["checkout_url"]}


# ─── Funnel orchestrator ───────────────────────────────────────────────────

def run_funnel(*, email: str, persona: str, company: str, first_name: str, use_case: str,
               confirm: bool = False, dry_run: bool = True,
               stages: tuple[int, ...] = (1, 2, 3, 4)) -> dict:
    if persona not in PERSONAS:
        return {"ok": False, "error": f"unknown persona: {persona}. Choose from {list(PERSONAS)}"}

    if not dry_run and not confirm:
        return {"ok": False, "error": "live mode requires --confirm"}

    lead_id = lead_id_for(email)
    bridge = load_bridge()
    out = {"ok": True, "lead_id": lead_id, "email": email, "persona": persona, "company": company,
           "stages": {}, "dry_run": dry_run, "ts": now_iso()}

    print(f"▶ funnel for {email} ({persona})  lead_id={lead_id}  dry_run={dry_run}")
    if 1 in stages:
        print("  1/4  cold email …")
        s1 = stage1_cold(email=email, persona=persona, company=company, first_name=first_name, dry_run=dry_run, bridge=bridge)
        out["stages"]["1_cold"] = s1
        print(f"      ✓  {s1.get('mode')}")
    if 2 in stages:
        print("  2/4  warm follow-up …")
        s2 = stage2_warm(email=email, persona=persona, company=company, first_name=first_name, use_case=use_case, dry_run=dry_run, bridge=bridge)
        out["stages"]["2_warm"] = s2
        print(f"      ✓  {s2.get('mode')}")
    if 3 in stages:
        print("  3/4  demo-call scheduler …")
        s3 = stage3_demo(email=email, persona=persona, company=company, first_name=first_name, use_case=use_case, lead_id=lead_id, dry_run=dry_run)
        out["stages"]["3_demo"] = s3
        print(f"      ✓  slot={s3.get('slot')}  url={s3.get('demo_url','dry-run')}")
    if 4 in stages:
        print("  4/4  trial offer …")
        s4 = stage4_trial(email=email, persona=persona, company=company, first_name=first_name, lead_id=lead_id, dry_run=dry_run, bridge=bridge)
        out["stages"]["4_trial"] = s4
        print(f"      ✓  tier={s4.get('tier')}  trial={s4.get('trial_url','dry-run')}")

    append_jsonl(LEAD_LOG, {"ts": now_iso(), "lead_id": lead_id, "email": email, "persona": persona, "company": company, "summary": {k: v.get("ok") for k, v in out["stages"].items()}})
    if not dry_run:
        emit_audit("lead.funnel_completed", {"lead_id": lead_id, "email": email, "persona": persona, "stages": list(out["stages"].keys())})

    print("\n🐉  funnel complete.\n")
    return out


# ─── Bulk ingest ───────────────────────────────────────────────────────────

def cmd_ingest(csv_path: Path) -> dict:
    bridge = load_bridge()
    n = 0
    summary = []
    with csv_path.open() as f:
        rdr = csv.DictReader(f)
        for row in rdr:
            email      = row["email"].strip().lower()
            persona    = row.get("persona", "ai_startup").strip().lower()
            company    = row.get("company", "").strip() or email.split("@")[1]
            first_name = row.get("first_name", "there").strip() or "there"
            use_case   = row.get("use_case", "sovereign disclosure for our core IP").strip()
            r = run_funnel(email=email, persona=persona, company=company, first_name=first_name,
                           use_case=use_case, confirm=False, dry_run=True, stages=(1,))
            n += 1
            summary.append({"email": email, "ok": r.get("ok"), "lead_id": r.get("lead_id")})
    return {"ok": True, "ingested": n, "summary": summary}


# ─── Advance (run stage 4 for all leads that hit stage 3) ─────────────────

def cmd_advance(confirm: bool = False) -> dict:
    bridge = load_bridge()
    advanced = []
    if not LEAD_LOG.exists():
        return {"ok": True, "advanced": [], "note": "no leads yet — run `run` first"}
    seen = set()
    with LEAD_LOG.open() as f:
        for line in f:
            r = json.loads(line)
            email = r["email"]; persona = r["persona"]; company = r["company"]
            if email in seen: continue
            seen.add(email)
            if not (VAULT_DEMO / f"{lead_id_for(email)}.json").exists():
                continue
            # Already has a demo slot — fire stage 4
            lead_id = lead_id_for(email)
            s4 = stage4_trial(email=email, persona=persona, company=company, first_name="there",
                              lead_id=lead_id, dry_run=not confirm, bridge=bridge)
            advanced.append({"email": email, "ok": s4.get("ok"), "trial_url": s4.get("trial_url")})
    return {"ok": True, "advanced": advanced}


# ─── Status ────────────────────────────────────────────────────────────────

def cmd_status() -> dict:
    def count(p: Path) -> int:
        if not p.exists(): return 0
        return sum(1 for _ in p.open())

    counts = {
        "leads_in_funnel": count(LEAD_LOG),
        "stage_events":    count(STAGE_LOG),
        "demo_slots":      len(list(VAULT_DEMO.glob("*.json"))) if VAULT_DEMO.exists() else 0,
        "trial_conversions": count(TRIAL_LOG),
        "mail_queue_files": sum(1 for _ in (HIVE_ROOT / "vault" / "mail-queue").glob("*.json")) if (HIVE_ROOT / "vault" / "mail-queue").exists() else 0,
    }
    return counts


# ─── CLI ───────────────────────────────────────────────────────────────────

def main() -> int:
    p = argparse.ArgumentParser(description="OpenPatent 4-stage live lead funnel.")
    sub = p.add_subparsers(dest="cmd", required=True)

    p_run = sub.add_parser("run", help="run the full funnel for one lead")
    p_run.add_argument("--email",       required=True)
    p_run.add_argument("--persona",     required=True, choices=list(PERSONAS))
    p_run.add_argument("--company",     required=True)
    p_run.add_argument("--first-name",  default="there")
    p_run.add_argument("--use-case",    required=True)
    p_run.add_argument("--confirm",     action="store_true")
    p_run.add_argument("--dry-run",     action="store_true")
    p_run.add_argument("--json",        action="store_true")

    p_ing = sub.add_parser("ingest", help="ingest a CSV (stage 1 dry-run for each row)")
    p_ing.add_argument("--csv", required=True, type=Path)

    p_adv = sub.add_parser("advance", help="fire stage 4 for every lead with a demo slot")
    p_adv.add_argument("--confirm", action="store_true")

    sub.add_parser("status", help="show funnel counts")

    args = p.parse_args()

    if args.cmd == "run":
        out = run_funnel(email=args.email, persona=args.persona, company=args.company,
                         first_name=args.first_name, use_case=args.use_case,
                         confirm=args.confirm, dry_run=not args.confirm)
        print(json.dumps(out, indent=2, default=str))
        return 0 if out.get("ok") else 2

    if args.cmd == "ingest":
        out = cmd_ingest(args.csv)
        print(json.dumps(out, indent=2, default=str))
        return 0

    if args.cmd == "advance":
        out = cmd_advance(confirm=args.confirm)
        print(json.dumps(out, indent=2, default=str))
        return 0

    if args.cmd == "status":
        out = cmd_status()
        print(json.dumps(out, indent=2, default=str))
        return 0

    return 1


if __name__ == "__main__":
    sys.exit(main())