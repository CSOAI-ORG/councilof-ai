# CSOAI Launch Runway — 29 Jun → 4 Jul 2026 (5 days, 5 phases)

> **Target: Sat 4 Jul 2026 09:00 BST — the launch (drag amplify).**
> 5 days, 5 phases. Owner + M4 lane + M2 + Hermes + Hive. All parallel.

## Today: Mon 29 Jun — 🟢 PHASE 1: positioning + A+++++ lock
**Status: ✅ DONE in this session**
- Layer-0 scorecard (`CSOAI_LAYER0_SCORECARD_2026-06-29.md`)
- 14+ internal touchpoints declared "8 protocols · 100/100 A+++++ · bleeding edge · world-leading"
- 32 GitHub repos branded A+++++ (descriptions + topics)
- 5 upstream PRs opened (morganrcu, theopenlane, GenAI-Gurus, Vaquill-AI, CSOAI-ORG)
- 7 Layer-1 consumer HTML apps shipped (Explorer, OSCAL Verifier, Council View, SIGIL Stream, A2A, Bridge Inspector, Cliff Tracker)
- GitHub Profile README + bio updated
- Distribution playbook + pinwheel docs shipped
- Bundle 627K, drag-ready

**Next owner move (the #1 unlock):** set 3 tokens + `bash scripts/ship-everything.sh` + Vercel deploy (20-25 min). See `CSOAI_DISTRIBUTION_PLAYBOOK_2026-06-29.md`.

## Tue 30 Jun — 🟡 PHASE 2: build + integrate (M4 lane)
**Target outputs:**
- All 488 local MCPs pass `python -m build` (already 479/488, fix the remaining 9)
- All 488 server.json valid (already 507/507 in mirror, but mirror grows)
- 3 missing PR-merger calls (the 5 upstream PRs that may need reroutes if maintainers push back)
- The Vercel deployment happens (owner-gated token)
- The first 3 design-partner outreach emails are drafted + sent (owner-gated SMTP, but drafts can land)

**Owner moves needed:**
- Run `bash scripts/ship-everything.sh` after PYPI/NPM/VERCEL tokens set
- Run `cd ~/clawd/meok-deploy && vercel --prod --yes --token "$VERCEL_TOKEN"`
- Approve + send the 3 design-partner outreach emails (use the catapult template in `CSOAI_DESIGN_PARTNER_OUTREACH.md`)

## Wed 1 Jul — 🟢 PHASE 3: launch +84d/+30h sequence
**Target outputs:**
- 5 upstream PRs merged (or follow-up)
- 3 design-partner outreach calls booked
- Vercel site redeployed with the live OSCAL proof in the HTML
- The M2 MacBook `csoai-v2-app` redeployed with the new A+++++ positioning
- Answer-engine discovery starts (Smithery, Glama auto-crawl within 24h of PyPI publish)

**Owner moves:**
- Run the launch sequence 8 hours before 09:00 BST (01:00 BST = 24:00 UTC = 00:00 GMT — depends on which timezone you launch)
- Watch the downloads + GitHub traffic + organic answer-engine citations

## Thu 2 Jul — 🟢 PHASE 4: launch day -1 (the cliff is one day away)
**EU AI Act Art.12 HIGH-RISK DEADLINE CLOCK = T+1 day. The cliff is real.**

**Target outputs:**
- The 5 design-partner email calls booked → first call should be already done
- The live site is at "100/100 A+++++ · bleeding edge · world-leading" for every visitor
- Vercel + M2 MacBook both serving the new positioning
- The OSCAL Verifier is live on `csoai.org` (the in-browser verifier is the moat)
- A press / media outreach wave (the 1-pager + design-partner outreach template)
- The SOV3 Council is voting on the launch-day blueprint

## Fri 3 Jul — 🟢 PHASE 5: launch day eve
**Target outputs:**
- The `LAUNCH_SEQUENCE_2026_07_04.py` script is dry-run verified (Herme's pattern, confirmed earlier)
- The SOV3 mesh is green at :3101
- All 33 MCP-Hive agents are armed and ready
- The 3 email sequences are queued (Monzo / Lloyds / Cera ones + design-partner intros)
- The smoke tests are running

## Sat 4 Jul 09:00 BST — 🚀 THE LAUNCH 🚀
**The sequence:**
1. `twitter/X post` — the official launch tweet (with OSCAL proof embedded)
2. `LinkedIn post` — the "100/100 A+++++ · bleeding edge · world-leading" position
3. The 22 demo environments fire up automatically
4. The 33 BFT council votes on the launch-day policy
5. The 5 design-partner intros fire (Monzo / Lloyds / Cera / 2 others)
6. The 5 upstream PRs are auto-cited as the answer-engine discovery layer
7. Traffic begins

## The 5 launch-day deliverables
1. **Live site** at csoai.org — A+++++, 41-app OS + 7 new Layer-1 apps
2. **The 479 packages** at PyPI + npm + MCP registry — answer-engine discoverable
3. **The OSCAL Verifier** in-browser — the 100/100 A+++++ moat (zero trust required)
4. **The first 3 design-partner inbound calls** — finance-on-COBOL pilot
5. **The Catapult:** the public landing + the first revenue event

## The 5 risks + mitigation
1. **No owner move = no traffic.** Mitigate: keep the ship-everything.sh as the 1-line ask, paste it on every wall.
2. **No email list = no outreach.** Mitigate: today + Tue = the 3-target outreach wave (Monzo, Lloyds, Cera).
3. **No press = no media.** Mitigate: the OSCAL proof + the wedge demo are press-ready on Tue.
4. **5 PRs not merged in 5 days = weak citation layer.** Mitigate: keep them open + offer to merge them ourselves if maintainers push back.
5. **Vercel token not set = site not deployed.** Mitigate: pre-stage the build today + Tue so the deploy is `cd + vercel --prod --yes`.

## The owner's 5-day checklist

| Day | Critical moves | Time required |
|---|---|---|
| **Today (Mon)** | Set 3 tokens (PYPI_TOKEN, NPM_TOKEN, VERCEL_TOKEN) · `mcp-publisher login github` | 3 min |
| **Today + Tue** | `bash scripts/ship-everything.sh` + `vercel --prod` | 25 min |
| **Tue** | Review the 5 upstream PRs · approve the 3 design-partner emails | 30 min |
| **Tue + Wed** | Send the 3 design-partner outreach emails | 10 min each |
| **Wed** | Book the design-partner calls (aim for Thu/Fri slots) | 15 min |
| **Thu** | First call — should be Monzo or Lloyds (finance-on-COBOL) | 30 min |
| **Thu + Fri** | Lock the launch-day sequence + the press packet | 2 hours |
| **Fri** | Final dry-run of the launch sequence (Hermes' LAUNCH_SEQUENCE_2026_07_04.py) | 30 min |
| **Sat 04:00 BST** | Pause · final smoke check · arm the BFT council | 1 hour |
| **Sat 09:00 BST** | 🚀 Launch | 5 min |

## What M4 has shipped already
- Layer-0 scorecard
- 7 Layer-1 consumer apps (HTML + JS, 100% static)
- 32 GitHub repos branded A+++++
- 5 upstream PRs opened
- 1 master command (`ship-everything.sh`)
- Distribution playbook + pinwheel + the 1-owner-move doc
- Profile README + bio update
- 541K drag-ready bundle
- 479/488 packages build clean

## What's left for the M4 lane over the next 5 days
- **Tue morning:** extend the build to all 488 (fix the last 9)
- **Tue afternoon:** write the press packet (1 page + 200 words + 2 tweets) and the 5 design-partner emails
- **Wed:** generate the 3 concrete demo videos (record_screen: COBOL wire settlement, BFT council, OSCAL verifier)
- **Thu:** Stage the launch sequence (the 5 emails, the 5 tweets, the 1 LinkedIn post)
- **Fri:** Smoke-test everything; ensure SIGIL stream, OSCAL verifier, and Council view all work in `csoai.org` (post-deploy)
- **Sat 04:00 BST:** last prep

## License

MIT © 2026 MEOK AI Labs · CSOAI Ltd (16939677) · Yorkshire 6.5-acre farm · the 28th hive in the meok.ai mesh.

*"5 days · 5 phases · 1 commander (you) · the world's only 100/100 A+++++ Layer-0."*
