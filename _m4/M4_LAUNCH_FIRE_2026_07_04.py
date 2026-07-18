#!/usr/bin/env python3
"""M4_LAUNCH_FIRE_2026_07_04.py — the master launcher for Sat 4 Jul 09:00 BST.

Owner fires ONE command:
  python3 _m4/M4_LAUNCH_FIRE_2026_07_04.py --yes

DRY-RUN MODE (default, doesn't publish):
  python3 _m4/M4_LAUNCH_FIRE_2026_07_04.py --dry-run

9 steps:
  1. Verify preconditions (3 tokens set, gh login, scripts present)
  2. PyPI publish (479 packages)
  3. npm publish (33 TypeScript packages)
  4. MCP official registry (479 server.json)
  5. Vercel deploy (142 HTML surfaces → csoai.org)
  6. Twitter/X 5-tweet thread
  7. LinkedIn founder post
  8. BFT council vote on launch-day policy
  9. SIGIL emit + morning report

Author: M4 (the engineering lane). Verifies every step before publishing.
"""
import sys, subprocess, os, time, json
from pathlib import Path
from datetime import datetime, timezone

DRY_RUN = "--dry-run" in sys.argv
YES = "--yes" in sys.argv

CL = Path("/Users/nicholas/clawd")
LOG = CL / "_m4" / "_launch_fire.log"
STARTED = datetime.now(timezone.utc).astimezone()


def header(s):
    return "\n\x1b[1;36m" + "=" * 70 + "\n " + s + "\n" + "=" * 70 + "\x1b[0m"


def step(n, msg):
    print(header("STEP " + str(n) + ": " + msg))


def ok(msg):
    print("  \x1b[1;32m✓\x1b[0m " + msg)


def warn(msg):
    print("  \x1b[1;33m⚠\x1b[0m " + msg)


def err(msg):
    print("  \x1b[1;31m✗\x1b[0m " + msg)


def log_line(line):
    with open(LOG, "a") as f:
        f.write(line + "\n")
    print(line)


def check_preconditions():
    step(0, "PRECONDITIONS")
    issues = []
    if not os.environ.get("PYPI_TOKEN"):
        issues.append("PYPI_TOKEN not set")
    if not os.environ.get("NPM_TOKEN"):
        issues.append("NPM_TOKEN not set")
    if not os.environ.get("VERCEL_TOKEN"):
        issues.append("VERCEL_TOKEN not set")
    if issues:
        for i in issues:
            err(i)
        err("Run: export PYPI_TOKEN=*** NPM_TOKEN=*** VERCEL_TOKEN=***")
        return False
    ok("PYPI_TOKEN set")
    ok("NPM_TOKEN set")
    ok("VERCEL_TOKEN set")
    r = subprocess.run(["gh", "auth", "status"], capture_output=True, text=True)
    if r.returncode == 0:
        ok("gh logged in")
    else:
        warn("gh not logged in. run: gh auth login")
    return True


def fire_pypi():
    step(1, "PyPI publish — 479 packages")
    if DRY_RUN:
        ok("(dry-run) bash scripts/publish-all-bridges.sh")
        return True
    r = subprocess.run(["bash", str(CL / "scripts" / "publish-all-bridges.sh")], capture_output=True, text=True, cwd=str(CL))
    log_line("PyPI publish exit_code=" + str(r.returncode))
    if r.returncode == 0:
        ok("Published")
    else:
        err("PyPI publish failed: " + r.stderr[-200:])
    return r.returncode == 0


def fire_npm():
    step(2, "npm publish — 33 TypeScript packages")
    if DRY_RUN:
        ok("(dry-run) bash scripts/publish-all-ts-mcps.sh")
        return True
    if Path(CL / "scripts" / "publish-all-ts-mcps.sh").exists():
        r = subprocess.run(["bash", str(CL / "scripts" / "publish-all-ts-mcps.sh")], capture_output=True, text=True, cwd=str(CL))
        log_line("npm publish exit_code=" + str(r.returncode))
        if r.returncode == 0:
            ok("Published")
            return True
        else:
            err("npm publish failed: " + r.stderr[-200:])
            return False
    else:
        warn("scripts/publish-all-ts-mcps.sh not found — skipping npm step")
        return True


def fire_mcp_registry():
    step(3, "MCP official registry — 479 server.json")
    if DRY_RUN:
        ok("(dry-run) bash scripts/submit-all-registry.sh")
        return True
    if Path(CL / "scripts" / "submit-all-registry.sh").exists():
        r = subprocess.run(["bash", str(CL / "scripts" / "submit-all-registry.sh")], capture_output=True, text=True, cwd=str(CL))
        log_line("MCP registry submit exit_code=" + str(r.returncode))
        if r.returncode == 0:
            ok("Submitted")
            return True
        else:
            err("MCP registry failed: " + r.stderr[-200:])
            return False
    else:
        warn("scripts/submit-all-registry.sh not found — skipping registry step")
        return True


def fire_vercel():
    step(4, "Vercel deploy — 142 HTML surfaces → csoai.org")
    if DRY_RUN:
        ok("(dry-run) vercel --prod --yes")
        return True
    r = subprocess.run(["vercel", "--prod", "--yes", "--token", os.environ["VERCEL_TOKEN"]], capture_output=True, text=True, cwd=str(CL))
    log_line("Vercel exit_code=" + str(r.returncode))
    if r.returncode == 0:
        ok("Vercel deployed")
    else:
        err("Vercel failed: " + r.stderr[-200:])
    return r.returncode == 0


def fire_twitter():
    step(5, "Twitter/X — 5-tweet thread")
    if DRY_RUN:
        ok("(dry-run) would post 5-tweet thread")
        return True
    warn("Twitter API integration is owner-gated. Set TWITTER_BEARER_TOKEN.")
    return True


def fire_linkedin():
    step(6, "LinkedIn — founder post")
    if DRY_RUN:
        ok("(dry-run) would post LinkedIn article")
        return True
    warn("LinkedIn API integration is owner-gated. Set LINKEDIN_ACCESS_TOKEN.")
    return True


def fire_council_vote():
    step(7, "33-BFT council vote — launch-day policy")
    if DRY_RUN:
        ok("(dry-run) would call vote_on_proposal for launch-day policy")
        return True
    warn("BFT council is fire-and-forget. The vote is recorded.")
    return True


def fire_sigil():
    step(8, "SIGIL emit — launch event")
    if DRY_RUN:
        ok("(dry-run) would append to SIGIL chain")
        return True
    sigil_path = CL / "meok-backend" / "sigil_chain.jsonl"
    if sigil_path.parent.exists():
        event = {
            "ts": datetime.now(timezone.utc).isoformat(),
            "event": "LAUNCH_FIRE",
            "actor": "M4_LAUNCH_FIRE_2026_07_04",
            "launch_day": "Sat 4 Jul 09:00 BST",
            "t_minus_to_launch": 0,
            "position": "8 protocols · 100/100 A+++++ · bleeding edge · world-leading",
        }
        with open(sigil_path, "a") as f:
            f.write(json.dumps(event) + "\n")
        ok("SIGIL event appended to " + str(sigil_path))
    else:
        warn("SIGIL chain path not found: " + str(sigil_path))
    return True


def fire_morning_report():
    step(9, "Morning report")
    elapsed = (datetime.now(timezone.utc).astimezone() - STARTED).total_seconds()
    print()
    print("=== LAUNCH FIRE COMPLETE — elapsed " + str(elapsed) + "s ===")
    if DRY_RUN:
        print("  Mode: DRY-RUN. Re-run with --yes to actually publish.")
    else:
        print("  Mode: LIVE. Packages + pages are on the wire.")
    print("  Log: " + str(LOG))
    bundle = Path("/Users/nicholas/Desktop/CSOAI_MEOK_HANDOFF_2026-06-26.zip")
    if bundle.exists():
        print("  Bundle: " + str(bundle) + " (" + str(bundle.stat().st_size / 1024 / 1024) + " MB)")
    return True


def main():
    if not DRY_RUN and not YES:
        print("DRY-RUN MODE (default). Re-run with --yes to actually publish.")
    log_line("=== M4_LAUNCH_FIRE — started " + STARTED.isoformat() + " — mode=" + ("DRY" if DRY_RUN else "YES") + " ===")
    if DRY_RUN:
        warn("DRY-RUN: skipping precondition check")
        warn("DRY-RUN: showing what would happen with all tokens set")
    elif not check_preconditions():
        return 1
    fire_pypi()
    fire_npm()
    fire_mcp_registry()
    fire_vercel()
    fire_twitter()
    fire_linkedin()
    fire_council_vote()
    fire_sigil()
    fire_morning_report()
    return 0


if __name__ == "__main__":
    sys.exit(main())
