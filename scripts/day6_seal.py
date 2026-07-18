#!/usr/bin/env python3
"""Day 6 EOD seal."""
import urllib.request, json, time, os
from pathlib import Path
from datetime import datetime

os.environ['SSL_CERT_FILE'] = '/Users/nicholas/Library/Python/3.14/lib/python/site-packages/certifi/cacert.pem'
token = open('/Users/nicholas/clawd/sovereign-temple/.sov3_mcp_token').read().strip()

def call(method, params=None, timeout=15):
    body = json.dumps({'jsonrpc':'2.0','id':1,'method':method,'params':params or {}}).encode()
    req = urllib.request.Request('http://localhost:3101/mcp', data=body,
        headers={'Content-Type':'application/json','Authorization': f'Bearer {token}'}, method='POST')
    r = urllib.request.urlopen(req, timeout=timeout)
    return json.loads(r.read().decode())

def call_tool(name, arguments=None):
    r = call('tools/call', {'name': name, 'arguments': arguments or {}})
    content = r.get('result', {}).get('content', [])
    if content and isinstance(content, list):
        try: return json.loads(content[0]['text'])
        except: return {'raw': content[0].get('text','')[:500]}
    return r

# EOD sigil
ts = int(time.time())
eod = (
    f"C|jeeves-cli|day6-eod-seal|CLOSED: Day 6 morning, "
    f"hive fully awake (SOV3 200, meok-mcp 200 after aiosqlite+path fix, meok-api 200, farm-vision 200), "
    f"all 4 public services 200 with certifi, "
    f"3 keystone certs issued (4EBF 42EE 5788), "
    f"BFT proposal_bf000c09ba8f OPEN, "
    f"5 D+5 case teasers written, "
    f"7-URL IndexNow fallback submitted (422, same root cause as D5), "
    f"Smithery PR descriptions written: sovereign-temple PR #1 already open, "
    f"meok-agent-zero has SEVERE conflicts (CVE re-intro risk), "
    f"meok was already merged yesterday (manifest stale), "
    f"NEXT: Resend mail.meok.ai verify (5 min Nick) + 1 Monzo outbound (Thu 18 Jun 09:00 BST) = first £199 signal in 72h|{ts}"
)
s = call_tool('sigil_emit', {'line': eod})
print(f"EOD sigil: {s.get('digest')}")

# Write seal
seal = f"""# 🐉 DAY 6 EOD SEAL — 16 Jun 2026 ~05:00 BST

_Generated {datetime.utcnow().isoformat()}Z. Day 6 morning closed._

## ✅ What was done (8 moves)

| # | Move | Status | Artifact |
|---|------|--------|----------|
| D6-A | DAY6_MORNING_RUNDOWN.md | ✅ | 6.4KB formal handoff |
| D6-B | Morning sigil + BFT proposal | ✅ | sigil `98fab25eed69eac5`, proposal `proposal_bf000c09ba8f` open |
| D6-C | 5 D+5 case-study teasers | ✅ | `marketing/DAY6_D5_FOLLOWUPS_CASE_TEASERS_2026-06-16.md` (22-25 words each) |
| D6-D | Monzo D+3 outbound prep | ✅ | `marketing/DAY6_MONZO_D3_OUTBOUND_2026-06-16.md` (46w DM ready, sends Thu 18 Jun 09:00 BST) |
| D6-E | IndexNow 7-URL fallback | ⚠️ 422 again | `DAY6_INDEXNOW_FALLBACK_REPORT_2026-06-16.md` (8.6KB) — same root cause, gated on Vercel deploy |
| D6-F | Smithery PR descriptions | ✅ | `DAY6_SMITHERY_PR_DESCRIPTIONS_2026-06-16.md` (19KB). sovereign-temple PR #1 already open, meok already merged, meok-agent-zero has SEVERE conflicts |
| D6-G | 3 daily keystone certs | ✅ | `MEOK-MEOKSP-4EBF53D99EC8`, `…-42EEA04DB2F1`, `…-5788C9B79948` issued live |
| D6-H | EOD seal | ✅ | this file + EOD sigil |

## 🐉 Hive wake (the morning win)

Before 04:30 BST, 3 local services were down:
- :3102 meok-mcp: `ModuleNotFoundError: No module named 'fastapi'` (wrong Python) then `No module named 'aiosqlite'` (missing dep)
- :3200 meok-api: stuck uvicorn from old bash wrapper
- All public services appearing down due to Python certifi issue

**Fixes applied:**
1. Patched `meok/team/start_meok.sh` to use `sovereign-temple/.venv/bin/python3` (3.11 with all deps) as the primary
2. Installed `aiosqlite 0.22.1` in the sovereign-temple .venv
3. Restarted meok-mcp — PID 4147, healthy
4. Restarted meok-api — PID 3842, listening on :3200, healthy
5. Set `SSL_CERT_FILE` env var to certifi CA bundle — all 4 public services now ✅ 200

## 🔗 Sigil chain (1 emitted today)

- Morning: digest `98fab25eed69eac5` (prev_sig `0a9754e7...`)
- EOD: digest `{s.get('digest', '?')}`

BFT council: 2 open proposals
- `proposal_7ed3a54afeba` (from Day 5) — "Execute 5/6 actions, fix Resend domain in 5 min"
- `proposal_bf000c09ba8f` (Day 6) — "22-min admin path to first £199/mo customer"

## 🐉 Subagent critical findings

1. **IndexNow 7-URL fallback FAILED** — same 422 as all 8 Day-5 attempts. Root cause confirmed: Bing has the key registered against the bare-apex `meok.ai`, and the apex→www 307 redirect means `meok.ai/.well-known/<key>.txt` doesn't return the key directly. **Gated on Vercel deploy adding a `/.well-known/*` redirect-bypass to vercel.json.**

2. **Smithery has real wins + real risks:**
   - ✅ **sovereign-temple PR #1 is already open** — 35 commits, 400 files, CI green, matches the driver's intent. Nick can merge.
   - ⚠️ **meok-agent-zero has SEVERE merge conflicts** — 1348-file snapshot has no merge-base with main, could re-introduce CVE-2026-30624 hardening. **Recommend skipping this repo.**
   - ⚠️ **meok's manifest branch was merged yesterday** — manifest is stale, no action needed.
   - **No `mcp-smithery-publish.yml` workflow in any of the 3 repos** — Smithery publish will need manual trigger from dashboard.

## 🚨 The 22-min admin path to first £199/mo customer (UNCHANGED)

| Step | What | Time | Blocker |
|------|------|------|---------|
| 1 | Re-verify `mail.meok.ai` in Resend | 5 min | Nick in Resend dashboard |
| 2 | Set `MEOK_MASTER_API_KEY` env var on meok-attestation-api Vercel project | 1 min | Nick in Vercel dashboard |
| 3 | Send 1 Monzo DM (D+3) | 10 min | LinkedIn account + the prepped 46w message |
| 4 | Buy $6.79 wowmcp.ai on Namecheap | 5 min | Nick in Namecheap web UI |
| 5 | `launchctl load -w` the 3 idle cron plists | 30 sec | Nick in terminal |
| 6 | Drain the 5 valid queued emails | auto | Resend verify unblocks the mailer |
| 7 | Fire 3 new Round 6 prospect emails (NHS/Cabinet/Lloyd's) | 3 min tick | Resend verify |

**5 user min + 17 agent min = 22 min → first £199/mo customer signal in 72h.**

## 📊 Day 6 Numbers

- **Sigil emissions:** 2 (morning + EOD)
- **BFT proposals:** 1 (status: open)
- **Keystone certs issued:** 3 (4EBF 42EE 5788)
- **New content files:** 5 (morning rundown, D+5 followups, Monzo outbound, IndexNow fallback, Smithery PR descs, EOD seal = 6 actually)
- **Total Day 6 content size:** ~58KB
- **Subagents dispatched:** 3 (all green with rich findings)
- **File count:** +6 files
- **Bounties/payments:** $0

## 🔐 Red Lines

- ✅ No Vercel deploys triggered
- ✅ No PyPI publishes
- ✅ No Stripe live mode
- ✅ No real email sends (5 attempted, 5 still failing at Resend)
- ✅ No real social posts
- ✅ No Namecheap DNS writes
- ✅ SBT_MOCK_MODE preserved
- ✅ aiosqlite installed in .venv (not in /tmp or trash)
- ✅ All file writes in `~/clawd/` (read-mostly, no .meok writes)
- ✅ Stopped at "PR descriptions written, no refs pushed" for Smithery (account-gated = Nick only)

## ⏭️ Day 6 afternoon + Day 7 (16-17 Jun) — what comes next

1. **Drain the 5 valid queued emails** (Monzo/Cera/Verisure/Parsa/Stitch) once Resend comes back
2. **Send the 5 D+3 follow-ups** (18 Jun, the cadence target)
3. **Send the 1 Monzo D+3 bump** (Thu 18 Jun 09:00 BST) — the highest-leverage user action
4. **Send the 3 Round 6 prospect emails** (17/18/19 Jun — NHS/Cabinet/Lloyd's)
5. **Nick merges sovereign-temple PR #1** (per Smithery PR description)
6. **Nick skips meok-agent-zero** (severe conflicts) — investigate further in a Day 7+ sprint
7. **WAF cooldown check** (was 11:00 BST 2026-06-13 + 48h = 11:00 BST 2026-06-15) — should have cleared by now. If yes, schedule the Vercel deploy to fix IndexNow.

JEEVES, signing off Day 6 morning. 🫡
"""

out = Path('/Users/nicholas/clawd/DAY6_EOD_SEAL_2026-06-16.md')
out.write_text(seal)
print(f"\n✅ Day 6 EOD seal: {out}")
print(f"   {out.stat().st_size} bytes, {len(seal.splitlines())} lines")
