# What 18 MCPs taught me about EU AI Act compliance

**Length:** ~2,400 words. Read time: 9 minutes.
**Where to publish:** Substack (set up `meok.substack.com` or use Medium with custom domain)
**SEO target keywords:** EU AI Act compliance, signed compliance attestations, MCP servers, Article 50 watermarking, NIS2 BSI register, DORA Article 28
**Cross-post:** Same content to dev.to with `canonical_url` pointing back to Substack so SEO juice flows there

---

## The setup

I'm a UK solo founder. Six months ago I started building open-source compliance tooling for the EU regulatory wave — every Model Context Protocol (MCP) server focused on a single regulatory framework, all MIT-licensed, all running production today.

In the last 30 days I submitted 18 of them to Anthropic's Plugin Directory:

- EU AI Act compliance (general)
- DORA (Digital Operational Resilience Act)
- GDPR + AI Act intersection (EDPB harmonised DPIA template, 14 April 2026)
- SOC 2 Type II
- ISO/IEC 42001 (AI Management Systems)
- NIST AI Risk Management Framework
- UK AI Bill (pro-innovation principles)
- AI Bill of Materials (CycloneDX 1.6)
- CSRD (Corporate Sustainability Reporting)
- HIPAA (US healthcare)
- PCI DSS v4.0.1
- OWASP Agentic AI Threats / LLM Top 10
- 5 flagship sub-frameworks: meok-omnibus-tracker, meok-watermark-attest, meok-cra-annex-iv-classifier, meok-nis2-de-register, meok-mcp-injection-scan
- DPIA EDPB template

234 PyPI packages total, 251+ public repos at github.com/CSOAI-ORG. Today I'm at £0 ARR. So this isn't a victory lap — it's an audit of what 6 months of building one MCP per regulation taught me about how the EU compliance landscape actually works.

Six honest lessons.

---

## Lesson 1: The post-Omnibus delay is the most misunderstood thing in EU AI Act compliance

Most teams I talk to think the EU AI Act high-risk provisions are still landing in August 2026. They're not. After the Digital Omnibus delays passed in late 2025:

- **High-risk Annex III** (employment, education, law enforcement, etc.) → **2 December 2027**
- **High-risk Annex I** (AI as a safety component of regulated products) → **2 August 2028**
- **Article 50 transparency** (watermarking, AI-content disclosure, deepfake notice) → **2 November 2026** — this didn't move

The mental model fix: the cliff that didn't move is the one most teams aren't ready for. If you have any generative-AI feature that surfaces to users in the EU, you have ~7 months to add visible AI-disclosure copy + provenance metadata + (where applicable) C2PA-style content credentials.

The MCP I built for this — `meok-watermark-attest-mcp` — exists because every team I asked "have you started Article 50 prep?" said "we're focused on December 2027." They've now got 6 months to November 2026. Not 19 months.

---

## Lesson 2: Auditors trust cryptographic verification more than fancy PDFs

The standard compliance-evidence workflow today is:

1. Compliance team writes a Word doc
2. Internal review approves it
3. Doc gets PDF'd, branded, attached to an email
4. External auditor reads the PDF, asks follow-up questions
5. Compliance team writes more Word docs

The thing that's missing: **what's the auditor's authentication step?** Right now it's "trust us." That doesn't scale.

So every MEOK MCP signs its output with HMAC-SHA256 against a public attestation API at `meok-attestation-api.vercel.app`. Output a DPIA, get a verification URL. The auditor can curl that URL and cryptographically confirm the document hasn't been tampered with after sign-off.

This sounds like security theatre until you watch a real audit happen. Three things change:

- **Disputes resolve faster** — when the auditor disagrees with a control implementation, the discussion is about substance, not "did you really write this in March?"
- **Internal sign-off speeds up** — board members read fewer documents because they trust the chain of custody
- **Regulator interactions get less defensive** — when DCMS or BSI sends a follow-up, you reply with a verification URL instead of a 30-page rebuttal

The marginal cost of adding a signed-attestation chain to an existing compliance workflow is essentially zero. The marginal benefit is non-trivial. I think this becomes the default within 18 months.

---

## Lesson 3: Most "compliance MCPs" are misframed as either lawyers OR docs-generators. They're neither.

When I started, I thought MCPs would replace either (a) compliance lawyers or (b) document templates. They do neither.

What they actually do is **make the AI agent's loop legible to a regulator**.

Concrete example: a hiring-AI product wants to add a new candidate-ranking feature. The compliance officer prompts Claude:

> "Classify this feature against EU AI Act Article 6. We're a deployer, not a provider. Output the high-risk obligations checklist."

Without an MCP, Claude hallucinates the answer. Possibly accurately, often not.

With `meok-eu-ai-act-compliance-mcp`, Claude calls a deterministic classifier with explicit Article 6 sub-criteria, returns a structured response, signs it. The compliance officer reviews the output — corrections take 30% of the time of writing it from scratch. The signed bundle goes into the audit pack.

**The MCP doesn't replace the compliance officer's judgment.** It compresses the artifact-generation phase from days to hours. Lawyers still review the substance. The final sign-off is human.

This is "co-pilot for compliance" but with the verifiability that matters when someone with subpoena power asks "are you sure?"

---

## Lesson 4: Awesome-list maintainers are gatekeepers, but they're not adversaries

I closed 30+ PRs to `punkpeye/awesome-mcp-servers` (the canonical list, ~30K stars) before figuring out the format rules. Quick takeaways for anyone trying to land on these lists:

- **Read CONTRIBUTING.md before opening the PR.** Most lists have a 4-line spec. Mine on punkpeye was: alphabetical, one server per line, accurate description, edit README.md only. None of that is hard. I just hadn't read it.
- **Single PR with all related entries beats 5 PRs with one each** — but only if entries are alphabetical within the same section.
- **The `🤖🤖🤖` suffix on the PR title triggers some maintainers' bot fast-track.** Worth checking each list's bot configuration.
- **Glama listing is no longer required for punkpeye merges** — the rule changed in early 2026 but most blog posts still cite the old guidance.

For MEOK's flagship 5, the consolidated PR went up at #5448 within 30 minutes. We'll see if it lands.

---

## Lesson 5: The Anthropic Plugin Directory is a 6-step form, not a PR

Months ago I tried submitting to Anthropic's Plugin Directory by opening a PR to `anthropics/claude-plugins-official`. The PR was auto-closed by a bot saying "this repo only accepts contributions from Anthropic team members. Submit at clau.de/plugin-directory-submission."

The actual submission path is at `claude.ai/settings/plugins/submit`. It's a 3-page wizard:

1. **Agreement** — sign the Software Directory Terms (one click)
2. **Plugin info** — repo URL, homepage, name, description, 5 example use cases
3. **Submission details** — supported platforms (Claude Code + Cowork), license, submitter email

The "5 example use cases" field is the interesting one. Don't list features — list **specific things a real user would actually prompt their AI agent to do**. The reviewer is looking for concrete value.

Bad use case: "Generate compliance reports."
Good use case: "Generate the Article 28 register of all ICT third-party service providers per DORA, with criticality classification and exit-strategy notes."

I submitted 18 plugins this way over the last 30 days. Each takes ~3 minutes once you have the description set up. The review queue is opaque — Anthropic publishes nothing about cadence — so don't expect immediate visibility.

---

## Lesson 6: Open-source compliance is a real business model, but the pricing wedge is non-obvious

The naive open-core model is: free MCPs, paid hosted SaaS. That doesn't work for compliance. Compliance teams don't trust hosted SaaS for evidence storage — they want self-hosted everything.

What does work:

- **Free forever:** the MCP code, the attestation wire format, the verification UI
- **Free public infrastructure:** the shared attestation API at meok-attestation-api.vercel.app
- **Pro tier (£79/mo):** **your own signing keys** + remote attestation API on a dedicated subdomain
- **Enterprise tier (£1,499/mo):** multi-product orgs needing audit-grade business-unit separation, SLA, support
- **Bespoke (£5K):** white-label for consultancies who want to resell

The pricing wedge isn't "is the product valuable" — it's "do you need cryptographic separation from other organisations using the same shared infrastructure?" For solo devs and small teams, the answer is no. For Fortune 500 / DAX-listed companies, the answer is yes, and £79/mo is rounding error.

The Stripe revenue is still £0 today. So I might be wrong about all of this. But the model assumes that the compliance buyer is sophisticated, and once they understand the difference between "shared HMAC issuer" and "your own HMAC issuer," they'll pay the £79.

We'll find out.

---

## What I'd build next

Three things I'd build if I had more capacity:

1. **An MCP for the EU Data Act (Reg 2023/2854)** — it's distinct from the AI Act, applies from September 2025, and almost no compliance tooling covers it yet. Specifically the data-sharing provisions Articles 8-12.

2. **A "compliance evidence diff" tool** — given an existing audit pack and an updated codebase, produce a structured diff showing which controls are still satisfied, which broke, and which need new evidence. This is what every compliance lead actually wants on a per-release basis.

3. **A multi-issuer Ed25519 transparent-key registry** — instead of HMAC against a single shared API, let every org self-host its own attestation API and publish its public key to a transparent log. This is the architecture for compliance-as-a-public-good.

The first two are 4-week projects. The third is the NLnet grant proposal I'm submitting before June 1. €20K asks. Cross fingers.

---

## What I want to know

If you're a compliance lead at an EU SaaS company, two questions:

1. **What's the worst part of your current audit-prep cycle?** Specifically the part you'd pay to make disappear. Not "compliance is hard" — the actual sub-step that takes 80% of your week.

2. **Would your organisation pay £79/mo for verifiable compliance attestation infrastructure if you owned the signing keys?** Or is the open-source-self-hosted-only path the only one that resonates?

Reply, DM, email — `nicholas@csoai.org` works. £0 ARR today, so honest "no thanks" is genuinely useful.

---

**About me:** Nicholas Templeman, solo founder of MEOK AI Labs / CSOAI LTD (UK Companies House 16939677). Building from a farm in the UK. https://meok.ai

**Cross-posted from:** the original draft is at `/Users/nicholas/clawd/revenue/SUBSTACK_LONGFORM_2026-04-26.md` and will be auto-canonical to the Substack URL once that's live.

---

## Where to publish + canonical strategy

1. **Substack** — primary canonical home. Set up `meok.substack.com` or `csoai.substack.com`. Free tier is fine for now.
2. **Dev.to** — cross-post with `canonical_url: https://meok.substack.com/p/what-18-mcps-taught-me-about-eu-ai-act` so SEO authority flows back to Substack
3. **Medium** — same canonical strategy. Medium ranks well on "EU AI Act compliance" SEO terms
4. **LinkedIn Articles** — paste the body, set canonical URL via the article URL field (LinkedIn now supports this)
5. **Hacker News** — a separate Show HN-style post about "I wrote a 2,400-word essay on what I learned from 18 compliance MCPs" can ride a different traffic wave 48-72 hours after the first one

## Promotion checklist

- [ ] Draft on Substack with canonical headers set
- [ ] Cross-post to dev.to with `canonical_url`
- [ ] Cross-post to medium.com with canonical
- [ ] Post LinkedIn article with canonical
- [ ] Tweet thread companion (already drafted in `X_TWITTER_THREAD_2026-04-26.md`)
- [ ] Email the article URL to your existing LinkedIn contacts (warmest 10)
- [ ] Submit to /r/ClaudeAI as "discussion" rather than self-promotion
- [ ] DM 5 EU compliance bloggers asking if it's interesting enough to quote-link
