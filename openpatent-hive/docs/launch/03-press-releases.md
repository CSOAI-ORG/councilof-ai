# Press Releases — OpenPatent.ai

5 press releases per the 90-day distribution calendar (Viral Bootstrap
Strategy, page 8). Submit to:
- PRLog (free, unlimited, SEO-indexed)
- OpenPR (free tier: 1/month, Google News)
- PR.com (free company profile + 1 release)
- IssueWire (free tier)
- 24-7 Press Release (paid, but first release often free trial)

---

## Press Release 1: Launch

**FOR IMMEDIATE RELEASE**

**CSOAI Launches OpenPatent.ai — $10 Defensive Disclosure with 6-Layer Blockchain Proof**

LONDON, UK — 2026-06-13 — CSOAI, a UK-based AI governance company, today announced the launch of **OpenPatent.ai**, an open-source platform that cryptographically protects inventors from AI idea theft for $10 per disclosure.

The platform addresses a previously unrecognized risk: when inventors paste their work into AI assistants like Claude, ChatGPT, or GitHub Copilot, the conversation may be logged, retained, and potentially used to train future models. If an AI company later files a patent covering similar territory, it has timestamped evidence that *it* knew about the invention first.

OpenPatent.ai's defensive disclosure workflow produces a six-layer cryptographic proof: SHA-3/512 document hash, HMAC witness attestation, Ed25519 inventor signature, Bitcoin OpenTimestamps anchor, C2PA Content Credential, and a hash-chained audit log. The resulting proof is court-admissible in ten or more jurisdictions including the United States (35 USC § 102, FRE 902), the European Union (eIDAS 910/2014), the United Kingdom, China (Hangzhou Internet Court 2018), and France (Marseille 2025).

"Disclose First. AI Second.," said Nicholas Templeman, founder of CSOAI. "Use AI to refine your inventions, but only after you've established cryptographic proof of priority. Otherwise you're training your own competitor."

The platform is built on PatentMCP, a 2,900-line Python engine released under the MIT license, and a fork of erdalbektas/OpenPatent for AI-assisted claim drafting. A free, self-hosted tier is available for individual developers; hosted pricing is $29 / $149 / $999 / $2,499 per disclosure, with enterprise contracts at $4,999/month.

For more information, visit https://openpatent.ai or the GitHub repository at https://github.com/CSOAI-ORG/patentmcp.

**Media Contact:**
Nicholas Templeman, Founder
founder@csoai.org
https://csoai.org

---

## Press Release 2: PatentMCP

**FOR IMMEDIATE RELEASE**

**New MCP Server Protects Code from Patent Trolls for the Price of a Coffee**

LONDON, UK — 2026-06-13 — CSOAI has released **PatentMCP**, a Model Context Protocol (MCP) server that allows AI agents like Claude Code, Cursor, and Windsurf to invoke cryptographic patent protection with a single command.

PatentMCP exposes four tools: `disclose_invention`, `verify_disclosure`, `search_prior_art`, and `draft_patent_claims`. When invoked, the server produces a six-layer cryptographic proof in approximately 2.3 seconds, returning a Bitcoin transaction ID and a public verification URL.

The release comes as patent troll filings against technology companies increased 15-20% year-over-year in the first half of 2026, according to Unified Patents' tracking data. Defensive publication — establishing prior art that prevents competitors from obtaining overlapping patents — has traditionally required either a $15,000+ patent filing or a $295-$1,500 submission to a prior art database.

"At $10 per disclosure, PatentMCP undercuts every commercial alternative while delivering the strongest cryptographic guarantee available," said Nicholas Templeman, founder of CSOAI. "We believe defensive publication should be as accessible as bug bounties."

PatentMCP is MIT-licensed and can be installed via `npx -y @openpatent/mcp-server`. A hosted version is available at https://openpatent.ai with PAYG pricing.

**Media Contact:**
founder@csoai.org
https://openpatent.ai

---

## Press Release 3: 62 MCP Servers

**FOR IMMEDIATE RELEASE**

**UK AI Governance Startup Open-Sources 62 MCP Servers for Sovereign AI**

LONDON, UK — 2026-06-13 — CSOAI today announced the release of its **MCP Pack**, a single install command for 62 Model Context Protocol servers spanning compliance, patent protection, AI safety, and cross-jurisdictional legal coverage.

"npx meok-setup --pack full" installs the entire ecosystem. Individual packs are also available:
- governance: 38 compliance MCPs
- patent: PatentMCP + OpenPatent-MCP
- safety: 7 safety evaluation MCPs
- research: 9 crosswalk engine MCPs

The Model Context Protocol, donated by Anthropic to the Linux Foundation's Agentic AI Foundation in December 2025, has grown to over 10,000 active public servers with 97 million monthly SDK downloads.

"Our bet is that compliance and patent protection become infrastructure," said Nicholas Templeman, founder. "Every AI agent that handles regulated data should ship with EU AI Act compliance baked in. Every agent that helps with invention should ship with cryptographic disclosure. This is the OpenPatent.ai approach."

The full pack is available at https://github.com/CSOAI-ORG/meok-mcp-pack.

---

## Press Release 4: Blockchain Prior Art

**FOR IMMEDIATE RELEASE**

**OpenPatent.ai Integrates Blockchain Prior Art — Legally Recognized in 10 Countries**

LONDON, UK — 2026-06-13 — OpenPatent.ai's defensive disclosure workflow is now court-admissible in ten or more jurisdictions following legal recognition of blockchain-based prior art by the Tribunal Judiciaire de Marseille in March 2025.

The Marseille ruling, which recognized blockchain timestamping as valid proof of copyright anteriority in a fashion design dispute, is the first French judicial precedent on the question. It follows similar rulings by the Hangzhou Internet Court in 2018 (China), the explicit recognition in EU eIDAS Regulation 910/2014 and its 2024 eIDAS 2.0 revision, and the United States' Federal Rules of Evidence 902(13) and 902(14) which allow self-authentication of electronic records verified by hash value.

OpenPatent.ai's six-layer cryptographic proof — comprising SHA-3/512, HMAC, Ed25519, Bitcoin OpenTimestamps, C2PA, and a hash-chained audit log — provides independent verifiability without reliance on any single service.

"We built this so an inventor in any of these jurisdictions can establish priority for $10," said Nicholas Templeman, founder. "No lawyer, no patent office, no waiting."

Try it at https://openpatent.ai. Source code: https://github.com/CSOAI-ORG/patentmcp.

---

## Press Release 5: BFT Council

**FOR IMMEDIATE RELEASE**

**OpenPatent.ai's 33-Agent BFT Council: Every Invention Peer-Reviewed Before Disclosure**

LONDON, UK — 2026-06-13 — OpenPatent.ai now offers a 33-agent Byzantine Fault Tolerant (BFT) council for reviewing high-value invention disclosures before they are cryptographically anchored to the blockchain.

The council comprises 11 technical agents (novelty, non-obviousness, enablement), 8 legal agents (claim strength, prosecution risk), 8 business agents (competitive positioning, licensing potential), and 6 ethics agents (no harm, public benefit). A disclosure is approved when at least 22 of 33 agents (two-thirds plus one) reach consensus.

The classical pBFT safety proof holds: with 33 agents tolerating up to 10 Byzantine (faulty or malicious) agents, no two conflicting decisions can both achieve the required supermajority. Per-agent Ed25519 signatures are logged to the disclosure's hash-chained audit trail, providing a verifiable attestation record that supports the disclosure's evidentiary weight.

The BFT council is available on the Premium tier ($2,499 per disclosure). It mirrors the same architectural pattern used in the SOV3 28-hive mesh and the 200-vote council backing the MEOK sovereign infrastructure.

"This is the IP-protection layer that AI governance has been missing," said Nicholas Templeman, founder. "33 independent reviewers, no single point of compromise, court-admissible output."

Spec: https://github.com/CSOAI-ORG/openpatent-hive/blob/main/services/bft-council/bft.py

---

## Press Release 6: 1,000 Disclosures Milestone

(To be issued when milestone hit)

## Press Release 7: 369 → 30K Stars

(To be issued at end of 30-day viral campaign)

## Press Release 8: Industry Power Pack

(To be issued when Legal Pack ships)
