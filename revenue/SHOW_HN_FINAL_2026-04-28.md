# Show HN — Final Copy-Paste Ready Post

**To submit:** https://news.ycombinator.com/submit
**Best timing:** Tuesday or Wednesday 7-9am UK (matches US Eastern wake-up). NOT Friday.
**Account:** must be HN account in good standing — needs at least a few days old + some karma

---

## Title (80 chars max — HN strict)

**Show HN: 31 open-source MCPs for EU AI Act, DORA, NIS2 compliance**

(80 chars exactly. Tested.)

## URL

```
https://meok.ai/labs/mcp/servers
```

(Or use https://meok.ai/tools if /labs/mcp/servers isn't ready — pick whichever shows the package list cleanest)

## Text (only if title doesn't link to a clear product page; usually skip)

Leave blank — the URL goes to the MCP server list directly. HN convention is to keep Show HN posts URL-only when possible.

---

## First comment (post immediately after submission, signed as @meok / your HN handle)

> Hi HN, Nicholas here — solo founder, MEOK AI Labs (CSOAI LTD, UK).
>
> I built these because I needed pre-built EU AI Act / DORA / NIS2 / EU CRA controls for my own AI compliance work and the existing GRC platforms (Vanta, Drata, OneTrust, ServiceNow GRC) don't cover EU regulations out of the box. Anything you wanted to do required months of professional services to configure.
>
> What's in the box (all MIT licensed, on PyPI):
>
> - meok-eu-ai-act / eu-ai-act-compliance-mcp — Articles 4/9/10/13/14/15/26/43/50/72 control runner
> - meok-watermark-attest-mcp — Article 50 C2PA + SynthID-class watermark validator (2 Aug 2026 deadline)
> - meok-dora-nis2-crosswalk / dora-compliance-mcp — DORA Reg 2022/2554 ↔ NIS2 ↔ ISO 27001 ↔ SOC 2 mapping
> - meok-omnibus-tracker-mcp — tracks 2026 Digital Omnibus implementing-act delays in real-time
> - meok-bias-detection-mcp — Article 10 demographic parity + equalized odds + calibration
> - meok-fria-generator-mcp — Article 26(9) Fundamental Rights Impact Assessment from EDPB harmonised template
> - meok-attestation-verify — independent HMAC-SHA256 cert verifier (auditor-curl-able from outside the platform)
> - 24+ more (full list at meok.ai/labs/mcp/servers)
>
> Each one runs as `uvx meok-{name}-mcp` in any MCP-compatible agent stack (Claude Code, Cursor, Cline, OpenAI tool-use). Free tier rate-limited at 3 signed attestations/day per IP. Paid tiers (£79/mo, £299/mo, £4,950 once) for higher rate limits + remote signing.
>
> Why MCPs not a SaaS dashboard: I'm a solo founder, can't afford ServiceNow-level dashboards, and most engineers shipping to EU prefer pulling regulatory controls into their existing agent stack rather than logging into yet another vendor portal.
>
> Three things I'm asking HN for:
> 1. Try the free `meok-attestation-verify` and tell me if the verify URL output is auditor-credible
> 2. Tell me which OTHER regulatory frameworks would be most useful to wrap (UK AI Bill? Singapore PDPA? India DPDP?)
> 3. Bug reports / PR ideas via GitHub
>
> Repos at github.com/CSOAI-ORG. Issues / PRs welcome.
>
> Thank you for the time.

---

## Engagement plan after posting

- **First 30 min:** stay at the keyboard, reply to every comment. HN algorithm rewards early engagement.
- **First 4 hours:** respond to ALL questions, especially technical ones. Be honest about gaps (e.g., "Smithery doesn't work yet because we're stdio not HTTP").
- **First 24h:** if it hits front page, expect 2K-15K visitors. Vercel autoscales; just monitor for any 5xx errors.
- **NEVER do:**
  - Tell people to upvote your post (instant ban)
  - Ask friends to upvote (instant ban)
  - Post and run (algorithmic death)
  - Defend yourself if criticized — acknowledge gaps + ask follow-up questions instead

---

## Attribution / cross-post strategy after Show HN

If it gets to front page:
- Repost link on Twitter, LinkedIn, Reddit (don't say "I'm trending on HN", just share what's interesting)
- Send the HN URL in cold outreach replies as social proof
- Quote a top comment in a follow-up blog post / tweet

If it doesn't:
- Look at the analytics from /labs/mcp/servers, see who clicked, what they did
- Iterate the title for next attempt — Show HN allows reposts after ~2 weeks if the title/content is meaningfully different

---

## Risk / known concerns

1. **CSOAI-ORG namespace may not be widely recognized** — HN community trusts established orgs (Anthropic, OpenAI, etc). You're a solo dev with a UK Companies House number. Lead with humility, not authority.
2. **EU AI Act fatigue** — HN has seen many "EU AI Act compliance" pitches. The differentiator: open-source MIT, MCP-native, signed cryptographic evidence. Lead with that.
3. **Article 50 deadline is hot but technical** — keep watermarking discussion in the comments, not the post body.
4. **Avoid drama topics** — don't reference Big4 firms negatively, don't shit on competitors. HN punishes both.
