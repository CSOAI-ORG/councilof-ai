# Show HN — MEOK AI Labs

**Submit at:** https://news.ycombinator.com/submit
**Best window for compliance/EU audience:** Tuesday-Thursday, 09:00-11:00 ET (14:00-16:00 UTC)
**Why this matters:** there's a stale "Csoai Limited: FAA for AI – Launching Today" post from Jan 2026 (item=46486089) that still ranks for "csoai limited" on Google and references the severed James Castle / £20M scholarship era. A clean Show HN with engagement will out-rank it.

---

## Title (80 char max)
```
Show HN: 234 MCP servers for EU AI Act + DORA + NIS2 + CRA compliance, signed
```

(Alt — if you want more "human" framing:)
```
Show HN: I built 234 open-source MCPs to handle every EU AI Act cliff date
```

## URL
```
https://meok.ai
```

## Text (this is the body of the Show HN — keep it tight, ~250 words)

Hi HN — I'm Nicholas, solo founder of MEOK AI Labs (UK).

For the past 6 months I've been shipping open-source [Model Context Protocol](https://modelcontextprotocol.io) servers for every major EU digital regulation: EU AI Act, DORA, NIS2, CRA, GDPR, UK AI Bill. The fleet is **234 PyPI packages, 251 public repos, all MIT**.

What's different: every artifact (DPIA, FRIA, CRA Annex IV declaration, NIS2 BSI register, EU AI Act Article 50 watermark check) gets **HMAC-signed against a public attestation API** at https://meok-attestation-api.vercel.app — so an auditor can verify the document with a single curl, and I can't tamper with it after the fact.

The 5 flagships hit the nearest cliff dates:
- `meok-omnibus-tracker` — track all 8 EU AI Act cliff dates post-Omnibus delays
- `meok-watermark-attest` — Article 50 transparency (Nov 2026)
- `meok-cra-annex-iv-classifier` — EU CRA (Reg 2024/2847)
- `meok-nis2-de-register` — Germany NIS2 BSI register
- `meok-mcp-injection-scan` — 30+ rules for the April 2026 Anthropic MCP RCE class

All 5 are `pip install`-able and Claude/Cursor/Cline-compatible today.

I'm trying to figure out if "open-source compliance MCPs with signed attestations" is a real category. Free tier covers most of what teams need; paid tier (£29/£79/£1,499/£5K) is for org-wide attestation key rotation + remote signing.

Roast it. Tell me what's missing. Tell me if the signed-attestation thing is actually useful or just security theatre. Pricing feedback also welcome.

Repos: https://github.com/CSOAI-ORG  
PyPI: https://pypi.org/search/?q=meok  
Attestation API: https://meok-attestation-api.vercel.app/health (returns `{"ok": true}`)

---

## Comment-bait hooks (use these to seed first replies after submitting)

1. **First comment by Nick:** "Happy to answer questions about: EU AI Act post-Omnibus delay (Article 6 high-risk pushed to Dec 2027 / Aug 2028), why I picked HMAC over Ed25519 (currently planning the migration), or how the FUNDING.yml + Stripe + GitHub Sponsors stack works under the hood."

2. **If someone asks pricing:** "All MCPs are free forever. Paid tier is just for orgs that want their own signing keys + remote attestation API. The free tier signs against the public API which is fine for solo devs and small teams."

3. **If someone asks "why MCP not just a CLI":** "Because compliance review increasingly happens inside an AI agent loop. Auditor opens Claude Code, says 'check this Python service against EU AI Act Article 6', the MCP runs the classifier and emits a signed attestation. CLI works for one-shot, MCP works for agent-driven workflows."

4. **If someone asks about the company:** "Solo founder, UK-incorporated as CSOAI LTD (Companies House 16939677). London. £0 revenue today; this Show HN is part of figuring out if anyone wants to pay for the paid tier. Otherwise everything stays MIT-licensed and free."

---

## Posting checklist
- [ ] Logged in as user `csoai-org` (or whichever HN account)
- [ ] Submit between 14:00-16:00 UTC (high-engagement window for compliance crowd)
- [ ] First comment ready to paste within 30 seconds of submission
- [ ] Email watching for reply notifications — engage every comment for first 2 hours
- [ ] DM 5 friends to upvote within first 30 min (HN front-page algorithm rewards velocity)
- [ ] After 4 hours, post link to LinkedIn + X / Twitter for second wave

## Why this beats the stale post
The Jan 2026 "Csoai Limited: FAA for AI" post got 0 upvotes and is buried — but it's still indexed and shows up on Google. A NEW post with engagement will:
1. Rank higher in HN's own search (recency-weighted)
2. Get cross-linked from other articles, building canonical-URL signal
3. Push the stale post off Google's first page within ~2-3 weeks

If you want the old post deleted entirely, email hn@ycombinator.com with "Please delete item 46486089 — it references a closed business chapter and an associate I am no longer working with. Thanks." HN will usually action this within 48h.
