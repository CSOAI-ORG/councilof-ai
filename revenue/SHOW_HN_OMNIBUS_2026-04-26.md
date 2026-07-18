# Show HN — refreshed for the Omnibus angle (recommended over the generic "I built 225 MCPs")

**Optimal posting time:** Wednesday OR Tuesday morning, 7:00–8:30am US Pacific (10:00–11:30am EST). Not Friday. Not weekends.

**URL to submit:** https://news.ycombinator.com/submit

---

## Title (80 char limit) — pick ONE

### Option A (most topical — recommended)
```
Show HN: meok-omnibus-tracker — live status of EU AI Act delays after 569-45 vote
```
**(80 chars)** — hits the news + the technical artefact. Most likely to convert.

### Option B (signing angle)
```
Show HN: I HMAC-signed our own EU AI Act audit and you can verify it in your browser
```
**(85 chars)** — too long. Trim:
```
Show HN: HMAC-signed EU AI Act audits anyone can verify in the browser
```
**(72 chars)** — works.

### Option C (volume hook)
```
Show HN: 230 Python MCPs for every EU compliance reg + signed attestations
```
**(75 chars)** — works but less topical.

**Recommendation: post Option A first.** If it doesn't gain traction in 90 minutes, repost Option C the following week.

---

## URL field

```
https://meok-attestation-api.vercel.app/catalogue
```

(Catalogue page is the best landing — shows the full product surface including the omnibus tracker, signed verify infrastructure, and pricing.)

---

## First-comment text (paste IMMEDIATELY after submission — top-of-thread comment captures most reads)

```
Hi HN — solo founder here, posting from London.

Some context: the EU Parliament voted 569-45 on 23 March 2026 to delay the EU AI
Act high-risk obligations from Aug 2026 to Dec 2027. Watermarking + transparency
(Article 50) only slid 3 months — to 2 Nov 2026 — making it the new nearest
cliff every chatbot operator + GPAI provider has to hit. Article 5 prohibitions,
GPAI Code of Practice obligations, and the penalty regime are UNCHANGED + LIVE.

I shipped two MCPs this week to make sense of it:

  pip install meok-omnibus-tracker-mcp
  pip install meok-watermark-attest-mcp

The omnibus tracker exposes the live status per provision (free, unlimited).
The watermark attest tool classifies which Article 50 sub-articles apply to your
system + generates compliant disclosure templates per surface (UI / API /
metadata / TTS / image-caption) in 5 languages.

Both plug into a public signing API at meok-attestation-api.vercel.app/sign that
emits HMAC-SHA256 signed attestations with public verify URLs. Auditors validate
by hitting the verify URL — no account, no login. Independent verifier:
pip install meok-attestation-verify

The signing key is symmetric today (HMAC); migration to Ed25519 + Sigstore is
funded if my NLnet grant lands (deadline 1 June). At that point the verifier
becomes truly offline — public key + cert + zero infrastructure dependency.

What's in the catalogue: 230 MCPs covering EU AI Act, DORA (live since Jan 2025),
NIS2, CRA, CSRD, GDPR, UK AI Regulation, HIPAA, SOC 2, ISO 42001, NIST AI RMF,
plus 5 A2A governance MCPs (rate-limiter, audit-logger, policy-enforcement,
handoff-certified, prompt-injection-firewall).

Pricing: free 10/day per MCP; £199/mo Pro for unlimited + signed attestations;
£1,499/mo Enterprise; £5K for a 48-hour bespoke gap analysis. £499 one-off
products for niche deadline-driven needs (e.g. German NIS2 BSI registration —
deadline this month).

Happy to go deep on:
- Why MCP as the distribution channel (vs Vanta/Drata Trust Center subscriptions)
- Why HMAC now + Ed25519 next (and the offline-verifier design)
- Why the signing key needs to live behind one HTTP endpoint vs every client
- How the Anthropic Claude Marketplace launch (6 March, 0% commission) changes
  governance-MCP economics
- The Digital Omnibus regulatory timeline + what your lawyer is wrong about

Not looking for funding. Looking for:
- Engineers running agent stacks who want to wire signed attestations in
- GRC consultancies wanting to white-label the £5K assessment
- Open-source contributors wanting to push the Ed25519 migration

Repos: github.com/CSOAI-ORG
PyPI: pypi.org/user/MEOK_AI_Labs
Catalogue: meok-attestation-api.vercel.app/catalogue
```

---

## Pre-launch checklist (5 min)

- [ ] Open the omnibus-tracker MCP page in a tab — make sure pip install works for the first user who tries it
- [ ] Confirm `meok-attestation-api.vercel.app/catalogue` loads <2s
- [ ] Confirm `meok-attestation-api.vercel.app/sign` returns valid 401 for missing key (= API is alive)
- [ ] Open the omnibus-tracker README on PyPI — confirm renders correctly with Markdown
- [ ] Refresh `councilof.ai` once to warm the Vercel cache for incoming HN traffic
- [ ] Set a 2h timer — if the post is on the front page within 90 min, it's a winner; otherwise next-week repost

---

## During-launch playbook (next 4h)

- Stay at desk for the first 2h
- Reply to EVERY comment within 15 min — comment velocity is what front-pages a post
- Don't argue, don't get defensive — engage technically
- For pricing pushback ("£199 is too high"): respond "Free tier covers 10/day per MCP, so most casual use never hits paywall. Pro pays for the signed cert path which is what auditors accept."
- For "this looks AI-generated": respond "I run MEOK AI Labs solo + ship the code. Happy to jump on a screen-share."
- For "no test coverage": acknowledge + commit to fixing it ("Fair. Adding pytest coverage to the top-10 packages this week.")
- Track Plausible / Vercel analytics for incoming traffic — if Show HN gives 1000 visitors and 0 sign up, the storefront is broken

---

## After-launch metrics to watch (24h after post)

- HN points at 24h (>200 = front page success; >500 = featured)
- HN comments at 24h
- New Stripe checkout sessions
- New Pro subscriptions
- New PyPI installs of meok-omnibus-tracker-mcp + meok-attestation-verify (the two viral packages)
- Newsletter signups (if Plausible is wired by then)
- Inbound consultancy / partnership emails

If 0 conversions after 1000+ visitors, the bottleneck is the storefront / pricing — not the product. Start A/B testing then.
