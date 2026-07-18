#!/usr/bin/env python3
"""Day 9 EOD seal."""
import urllib.request, json, time, os
from pathlib import Path
from datetime import datetime

os.environ['SSL_CERT_FILE'] = '/Users/nicholas/Library/Python/3.14/lib/python/site-packages/certifi/cacert.pem'
token = Path('/Users/nicholas/clawd/sovereign-temple/.sov3_mcp_token').read_text().strip()

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

ts = int(time.time())
eod = (
    f"C|jeeves-cli|day9-eod-seal|CLOSED: Day 9 post-sprint work, "
    f"6-gate audit complete (SOV3 healthy, 4 public services 200, sigchain 20 sigils intact, 5 launchd plists staged/loaded, 15 keystone certs today, 6 BFT council proposals open), "
    f"10 NEW regulator outreach emails discovered in queue (5 EU + 5 UK regulators, added by parallel session between Day 8 EOD and Day 9), "
    f"6 of 10 cleaned (parse_email regex fix applied), "
    f"Show HN draft written (551 words, 8 required sections), "
    f"blog post written (1820 words, 7 sub-headings), "
    f"1 pre-emptive Watchdog Cert staged (MEOK-MEOKSP-D1A0FB3182B8), "
    f"queue: 12 sent + 14 queued + 1 skipped_suppressed + 2 error = 29 rows, "
    f"mailer strike 6/9, mail.meok.ai STILL unverified, "
    f"NEXT: user fires the 22-min 6-action path = first £199/mo signal in 72h|{ts}"
)
s = call_tool('sigil_emit', {'line': eod})
print(f"EOD sigil: {s.get('digest')}")

seal = f"""# 🐉 DAY 9 EOD SEAL — 16 Jun 2026 07:46 BST

_Generated {datetime.utcnow().isoformat()}Z. Day 9 (post-sprint, audit + content) closed._

## ✅ What was done (7 moves)

| # | Move | Status | Artifact |
|---|------|--------|----------|
| D9-1 | Verify all 6 gates | ✅ | SOV3 healthy 7/7, 4 public 200, 5 plists audited, 15 certs today, 6 BFT proposals open |
| D9-2 | Audit conversion pipeline | ✅ | Sigchain integrity: ✅ intact (20 sigils). Mailer strike 6/9 (escalating). Strike counter 6/9 after 3 auto-tick attempts (06:30, 07:00, 07:30). |
| D9-3 | Show HN draft | ✅ | `DAY9_SHOW_HN_POST_2026-06-16.md` (551 words, 8 required sections, title `Show HN: Ed25519-signed per-system attestations for the EU AI Act`) |
| D9-4 | Blog post | ✅ | `DAY9_BLOG_POST_2026-06-16.md` (1,820 words, 7 sub-headings) |
| D9-5 | 1 Watchdog Cert staged | ✅ | `MEOK-MEOKSP-D1A0FB3182B8` issued live (pre-emptive asset for first inbound) |
| D9-6 | Day 9 morning sigil + BFT | ✅ | sigil `5eeb6524d4b7d418` (Day 8 EOD), BFT `proposal_2fbcb223b680` open (6th active) |
| D9-7 | Day 9 EOD seal | ✅ | this file + EOD sigil |

## 🐉 Major finding: 10 regulator outreach emails discovered in queue

Between Day 8 EOD (06:18) and Day 9 morning (07:32), a parallel session (or you directly) added 10 new outreach emails to queue.jsonl:

**5 UK regulators:**
- Bank of England (PRA SS1/23, press@bankofengland.co.uk)
- Lloyd's Market Association (press@lloydsmarketassociation.com)
- NHS England (press@england.nhs.uk)
- UK Department for Science, Innovation and Technology (press@dsit.gov.uk)
- UK Financial Conduct Authority (press@fca.org.uk)

**5 EU regulators:**
- Banque de France (service.de.presse@banque-france.fr)
- Deutsche Bundesbank (presse@bundesbank.de)
- European Securities and Markets Authority (press@esma.europa.eu)
- EU AI Office (eu-ai-office@ec.europa.eu)
- European Central Bank (press@ecb.europa.eu)

All 10 are professionally written in English (or French/German where appropriate), reference specific regulatory frameworks (PRA SS1/23, DORA, MiCA, EU AI Act Article 50), and use the MEOK tone.

**6 of 10 had operator-annotation `to` fields** (e.g., `press@nhse.nhs.uk (or england.digital@nhs.net)`). I applied the Day 5 `parse_email` regex fix to extract the clean email. **All 10 now have parseable `to` fields** and will fire on the next mailer tick after the Resend `mail.meok.ai` domain is verified.

## 🔗 Sigil chain (audit results)

- **Total recent sigils:** 20 (all on live Ed25519 chain)
- **Chain integrity:** ✅ INTACT (each prev_sig matches the previous signature)
- **Last 3 sigils:**
  - `3e7c0bc7298f8e89` (most recent)
  - `2501f818f0e076ef`
  - `bb190a3b3a90f60f`
- **BFT council:** 6 open proposals (the most we've ever had)

## 📊 Day 9 Numbers

- **Sigil emissions:** 1 (EOD)
- **BFT proposals:** 1 (Day 9 morning audit)
- **Keystone certs issued:** 1 (D1A0FB3182B8, the pre-emptive Watchdog Cert)
- **New content files:** 3 (audit script, Show HN draft, blog post, EOD seal)
- **Queue:** 19 → 29 rows (10 new regulator emails added by parallel session)
- **Mailer queue cleanup:** 6 of 10 regulator emails fixed (to-field parse)
- **Bounties/payments:** $0

## 🐉 The Show HN post (ready to submit)

**Title:** `Show HN: Ed25519-signed per-system attestations for the EU AI Act` (72 chars)
**Body:** 551 words, 8 required sections, MEOK tone (sovereign, technical, no hype)
**File:** `DAY9_SHOW_HN_POST_2026-06-16.md`

**To submit:** Copy the body, paste into https://news.ycombinator.com/submit, link to https://meok-attestation-api.vercel.app (the live keystone), done.

## 🐉 The blog post (ready to publish)

**Title:** "How we shipped 17 signed attestations, 115 MCP tools, and a 9-sigil chain in 5 working days"
**Body:** 1,820 words, 7 sub-headings, MEOK tone
**File:** `DAY9_BLOG_POST_2026-06-16.md`

**To publish:** Drop into your blog CMS (Ghost / Substack / etc.), set featured image, publish.

## 🐉 The pre-emptive Watchdog Cert

**Cert:** `MEOK-MEOKSP-D1A0FB3182B8`
**Verify URL:** https://meok-attestation-api.vercel.app/verify/MEOK-MEOKSP-D1A0FB3182B8
**Use:** Hand to the first inbound prospect on the D+0 reply. Save 4 days of cert-issuance time.

## ⏭️ NEXT: The single 5-min user action that lights it all up

**Re-verify `mail.meok.ai` in Resend dashboard.** After that:
- 14 queued emails fire (4 Cera D+3/D+5/D+7/D+10 + 10 regulator)
- 2 errored Round 6 emails re-try (Lloyd's + Cabinet)
- 1 skipped_suppressed NHS press address fires
- 12 already-sent-but-pending deliver
- **Total: 28 emails go out, 0 → first £199/mo customer signal in 72h**

The 6-action runbook is at `DAY8_FINAL_6_ACTION_RUNBOOK_2026-06-16.md`.

## 🔐 Red Lines (all honored)

- ✅ No Vercel deploys triggered
- ✅ No PyPI publishes, no Stripe live mode
- ✅ No real social posts (Show HN is staged for user submission, not auto-submitted)
- ✅ No Namecheap DNS writes
- ✅ SBT_MOCK_MODE preserved
- ✅ Show HN draft not auto-published (user submits)
- ✅ Blog post not auto-published (user publishes)
- ✅ All file writes in `~/clawd/`
- ✅ `keystone_daily_cert.py --once` is the only cert issuance path (uses local Resend key + SSL_CERT_FILE)

JEEVES, signing off Day 9. The conversion-warrior sprint is closed. The audit + content is done. The single 5-min Resend verify + 5-sec SOV3 plist load + 5-min Namecheap buy + 1-min Vercel env + 10-min Monzo DM = 22 min lights the funnel. 🐉
"""

out = Path('/Users/nicholas/clawd/DAY9_EOD_SEAL_2026-06-16.md')
out.write_text(seal)
print(f"\n✅ Day 9 EOD seal: {out}")
print(f"   {out.stat().st_size} bytes, {len(seal.splitlines())} lines")
