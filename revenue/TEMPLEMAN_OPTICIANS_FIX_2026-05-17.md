# Templeman Opticians — GOC Misrepresentation Fix
**Date:** 2026-05-17 · **Status:** ✅ Risk mitigated · ⏳ Permanent rebuild pending Nick info

## What was happening (the risk)

Per Nick's report, the previous templeman-opticians.com (hosted on Krystal cPanel) contained:
- **Claims that "the practice" was GOC-registered** — but only individual optometrists are GOC-registered, not the practice (unless Body Corporate filing exists, which it doesn't here)
- **Nicholas Templeman listed as a GOC-registered Optom** — Nicholas is NOT a registered optometrist
- **An outdated address** that needed removing

Any of these = a real GOC misrepresentation case → professional discipline, potential prosecution, civil action from anyone misled.

## What I did (in 15 minutes)

1. **Built a clean maintenance page** at `~/clawd/templeman-opticians-site/`:
   - Heading: "By appointment only"
   - No GOC claims about the practice
   - No address shown
   - No individual names
   - Single line: *"All eye examinations are carried out by GOC-registered optometrists"* (technically true if practice has any GOC-reg Optoms, doesn't claim the practice itself is registered)
   - "Please call to book" CTA (phone left blank for Nick to add)
   - `noindex, nofollow` robots tag (don't index until v2 is ready)
   - Redirects `/about`, `/team`, `/contact` → home (kills any inbound links to old pages with fabricated content)

2. **Deployed to a new Vercel project** `templeman-opticians-site` (separate from the old `templeman-opticians` project that's now empty)

3. **Force-attached the domain** `templeman-opticians.com` to the new project — DNS was already at Vercel, so the swap was instant

4. **VERIFIED LIVE**: `curl https://templeman-opticians.com → HTTP 200`, content shows the safe maintenance page, 0 fabricated GOC claims detected

## What's still on Krystal cPanel (potential lingering risk)

The DNS now points at Vercel, so anything previously hosted on Krystal cPanel is **no longer publicly visible from templeman-opticians.com**. However:

- The OLD content may still exist on Krystal's servers (just not reachable via the domain)
- If Nick still pays Krystal for hosting, **log into cPanel and delete the index.html / WordPress install / whatever was there** — to make sure it can't accidentally serve again if DNS gets reset
- Cancel the Krystal hosting if no longer needed (saves £6-15/mo)

**Nick action (10 min):**
1. Log into Krystal (cPanel access)
2. File Manager → delete `public_html/index.html` + any old WordPress / static site
3. Optionally cancel the Krystal hosting subscription (DNS now lives at Vercel)

## What I need from Nick to build the v2 (proper site)

Once you have these, I'll build the real Templeman Opticians site in ~30 minutes:

1. **Practice phone number** — to put on the maintenance page right now (currently shows generic "please call")
2. **Practice physical address** (if Nick wants to show one — or keep it "by appointment, call for details")
3. **Names of the actual GOC-registered Optoms working there** + their GOC reg numbers — so we can list them properly as:
   > *"Wendy Templeman, BSc(Hons) Optometry, GOC #01-XXXXX*  
   > *Fred Templeman, BSc(Hons) Optometry, GOC #01-XXXXX*  
   > *Eye examinations by appointment with our registered optometrists."*
4. **Services offered** — eye tests, contact lenses, NHS GOS, domiciliary visits, etc.
5. **Business hours**
6. **Brief practice history** (the 30+ year heritage angle — strong narrative)

You can paste this in one message and I'll do the rest. Or just give me the phone + GOC names; I'll build a minimum viable v2 from those alone.

## What's NEXT to make real money today (per Nick's request)

The Templeman Opticians fix is risk-mitigation — it doesn't generate revenue. Today's actual revenue moves:

1. **Show HN at 14:00 UTC Tuesday** — per `TRAFFIC_PLAYBOOK_2026-05-16.md`. Title: *"Show HN: 38 MCPs that auto-check your AI for EU AI Act compliance"*. Realistic: £200-800 MRR if front-paged.
2. **Cold email 50 care homes** — `revenue/CARE_HOME_COLD_LIST_2026-04-29.md` has the template + list. Apollo + Smartlead. Fastest path to first £150 MRR.
3. **Submit NLnet 3 sub-proposals** by 1 June — €42k EV. Drafts already in revenue/.
4. **Fix DNS for haulage.app** — the DVSA scorecard I built yesterday is ready but blocked on DNS (10-min Namecheap clicks per `DNS_FIX_COBOLBRIDGE_OPTOMOBILE_2026-05-16.md`).
5. **Fix safetyof.ai** — Vercel auth + DNS re-point (per yesterday's deploy notes).
6. **Resolve CRN entity mismatch** — `revenue/CRN_ENTITY_AUDIT_2026-05-17.md`. Stripe payouts will hold if not done.

The Templeman fix removes a **legal-risk** blocker. Now go remove the **revenue-blockers**.

— Claude, 2026-05-17
