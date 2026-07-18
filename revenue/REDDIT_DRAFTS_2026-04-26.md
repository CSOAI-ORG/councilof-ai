# Reddit seed posts — /r/ClaudeAI, /r/LocalLLaMA, /r/programming

**Tone rule:** Reddit hates pure self-promo. Lead with a specific technical problem you SOLVED, not "look at my product." Mention the tool only as the means to solve it.

**Posting cadence:** ONE post per sub. Don't cross-post — that gets shadowbanned. Wait 48h between subs.

---

## /r/ClaudeAI seed post

**Subreddit:** /r/ClaudeAI (~50K members, very active around tooling)
**Best window:** Wed-Fri 14:00-16:00 UTC
**Flair:** Show & Tell or Resources

### Title
```
I built 234 MCP servers for EU AI Act / DORA / NIS2 / GDPR — every artifact gets HMAC-signed
```

### Body

The November 2026 EU AI Act Article 50 deadline is real (watermarking + AI-content disclosure for generative AI). The high-risk provisions are now December 2027 / August 2028 post-Omnibus, but the transparency stuff is still on time.

I've been building a fleet of MCP servers — one per regulation. The 5 most useful for Claude users today are:

- `meok-omnibus-tracker` — track all 8 cliff dates post-Omnibus delays
- `meok-watermark-attest` — Article 50 watermarking + C2PA + deepfake disclosure
- `meok-cra-annex-iv-classifier` — EU CRA (Reg 2024/2847) essential security requirements
- `meok-nis2-de-register` — Germany NIS2 BSI register (Section 30/32)
- `meok-mcp-injection-scan` — 30+ rules for the April 2026 Anthropic MCP RCE class

The thing that makes it useful for an actual audit (not just slideware) is each artifact gets HMAC-signed against a public attestation API at `meok-attestation-api.vercel.app`. So when a regulator asks "how do we know this isn't a fabricated post-hoc document", you give them a verification URL.

All MIT, all `pip install`-able. Repos at github.com/CSOAI-ORG.

What I'm trying to figure out:
1. Is the "MCP server with signed attestation output" workflow useful for compliance teams, or is the friction of MCP installation worse than the friction of a SaaS dashboard?
2. Has anyone here actually used a compliance MCP in a real audit dry-run? Curious about the failure modes.
3. Are there frameworks I'm missing? I'm UK/EU-focused but probably need NIST AI RMF, ISO 42001, SOC 2 — already shipped those but no reps yet.

Roast it. Tell me what's missing.

### Comment-bait first reply (Nick to post immediately after submitting)
```
Quick reply to my own post — happy to dig into:
- Why HMAC instead of Ed25519 (planning to migrate; HMAC was just the fastest path to a working signed-attestation chain)
- How the Anthropic Plugin Directory submission process actually works (we've submitted 14 of these now)
- The post-Omnibus delay timeline if anyone's confused about which obligations are still on time vs delayed
```

---

## /r/LocalLLaMA seed post (different angle — security-focused)

**Subreddit:** /r/LocalLLaMA (~250K members)
**Best window:** Mon-Wed 14:00-17:00 UTC
**Flair:** Resources or Tutorial | Guide

### Title
```
30+ canonical detection rules for the April 2026 Anthropic MCP RCE class — open-sourced as an MCP scanner
```

### Body

For anyone who missed it: there was a class of MCP server vulnerabilities surfaced in April 2026 that allowed prompt-injection-driven RCE on the host running the MCP. The Anthropic MCP team's own writeup is good but doesn't ship a scanner.

I've open-sourced 30+ detection rules across 5 severity tiers as an MCP server you can run inside Claude Code or Cline:

```
pip install meok-mcp-injection-scan-mcp
```

The rules cover:
- Tool description injection (LLM hallucinating execution boundaries from tool descriptions)
- Resource-content RCE (tool output containing tool-call instructions the host then executes)
- Cross-server contamination (MCP A's output redirecting MCP B)
- Auth-token leakage via verbose error messages
- File-system traversal in resource URI handlers

Source: github.com/CSOAI-ORG/meok-mcp-injection-scan-mcp

Honest disclosure: this is part of a fleet of compliance MCPs I'm building (MEOK AI Labs, UK). The injection scanner is the most security-relevant of the bunch and the part most likely to be useful here.

What I want feedback on:
- Are there detection rules I'm missing? (especially RAG-corruption-style attacks)
- Is the "scan-as-MCP-server" pattern useful or should this just be a CLI?
- Is anyone running MCP servers in production yet, or is everyone still in dev/test?

### Comment-bait first reply
```
For context, the rule severity tiers are:

CRITICAL: arbitrary code execution from tool description / resource content
HIGH: cross-server token leakage, file-system traversal
MEDIUM: prompt-injection-induced misbehaviour, auth-bypass attempts
LOW: information disclosure (verbose errors, debug output)
INFO: best-practice violations (no-auth on dangerous tools, missing rate limits)

Happy to share specific rule patterns if anyone wants to red-team their own MCP server.
```

---

## /r/programming seed post (different angle — open-source business model)

**Subreddit:** /r/programming (~5M members) — much higher noise, harder to land
**Best window:** Tue-Thu 13:00-15:00 UTC
**Flair:** Show

### Title
```
Show: 234 open-source MCP servers for EU regulations, with HMAC-signed compliance attestations
```

### Body

I'm a UK solo founder. Spent 6 months building open-source compliance tooling for the EU regulatory wave (AI Act, DORA, NIS2, CRA, GDPR, UK AI Bill).

**What's interesting (engineering-wise):**
- Each MCP ships with an HMAC-signed attestation. The signed JSON-LD bundle gets POSTed to a public verification API (`meok-attestation-api.vercel.app`), and the API returns a verify URL anyone can curl to confirm the document hasn't been tampered with.
- Wire format is small (~80 lines of JSON schema). Self-hosting the verification API is on the NLnet grant roadmap.
- All 234 packages are MIT, all repos are public, all ship as MCP servers consumable by Claude Code, Cursor, Cline, Windsurf etc.

**What I want to know:**
- Does the "open-source core, paid attestation infrastructure" business model resonate? £29 Starter / £79 Pro / £1,499 Enterprise. Pro tier mostly buys you your own signing keys + remote attestation API.
- Is there a better revenue model than tier-based? Considering usage-based pricing on attestation API calls but feels like it adds friction.
- For anyone who's shipped open-source compliance tooling: where did you find your first paying customer?

Repos: github.com/CSOAI-ORG  
Live verification API: meok-attestation-api.vercel.app/health  
Compliance landing: meok-compliance.vercel.app

### Comment-bait first reply
```
The signed-attestation thing turned out to be more useful than I expected. Originally I added it because compliance buyers need verifiable evidence — but it also surfaces tampering during the AI agent loop itself. If a model hallucinates a bogus compliance artifact, the signature mismatch when you re-verify catches it.

Trade-off: HMAC means single-issuer (me). Migrating to Ed25519 + transparent rotating-key registry is the next architecture step. Anyone running multi-issuer signed attestations in production?
```

---

## Posting checklist

For each sub:
- [ ] Account has > 30 day age + > 50 comment karma (otherwise the post gets auto-removed)
- [ ] First comment ready to paste within 60 seconds of submission
- [ ] Engage every reply for first 4 hours
- [ ] If a mod removes it, ask politely WHY in modmail and adjust

**DO NOT:**
- Post the same content to multiple subs within 48h
- Use any "buy now" / "click here" language
- Post on weekends (HN/Reddit traffic dies, post sinks before Monday)
- Reply with marketing copy — talk like a human

**Win definition:**
- 50+ upvotes = success
- 1 reply from someone with a real compliance question = open the DM
- 1 person says "I'd pay for this" = follow up via DM with the case study
