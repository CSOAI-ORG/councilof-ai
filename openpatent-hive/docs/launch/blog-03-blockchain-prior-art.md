# How Blockchain Prior Art Works in Court (and Why You Should Care)

**Subtitle:** A 5-minute legal primer for developers on the most underrated defensive weapon of the 21st century.

**Tags:** `blockchain`, `legal`, `patents`, `prior-art`, `defensive-publication`

---

Most developers have never heard of "defensive publication." Most patent lawyers have. The 200-year-old legal concept got a 21st-century upgrade: instead of publishing in obscure journals, you can now publish to Bitcoin for $0.10 and have it be court-admissible in 12+ jurisdictions.

This is the short version of how that works.

## The 1-paragraph version

You write a description of your invention. You compute a hash. You anchor that hash to a public blockchain (Bitcoin via OpenTimestamps). Now anyone — a judge, a patent examiner, an opposing counsel — can verify the existence of your document at a specific point in time, **without contacting you or any service**. That's prior art.

## The 4-paragraph version

1. **Compute**: SHA-3/512 hash of your invention document. The hash is a unique 128-character string. Any change to the document produces a different hash.

2. **Anchor**: Submit that hash to the OpenTimestamps calendar server. The server bundles many hashes into a single Merkle tree, then writes the Merkle root into a Bitcoin transaction. Once that transaction is in a Bitcoin block (~10 minutes), the timestamp is permanent and globally verifiable.

3. **Publish**: Make the document (or a hash-linked retrieval URL) publicly accessible. The 35 USC § 102 (US) and Article 54(2) EPC (EU) standards both require "publicly accessible" prior art.

4. **Verify**: Anyone can download the document, compute its SHA-3/512 hash, compare to the Merkle leaf in Bitcoin, and confirm: "this document existed at Bitcoin block 891,234." No third party required.

That's it. The cost is ~$0.10 in Bitcoin fees (often less with batching). The time is ~10 minutes. The legal effect is permanent.

## The 10+ jurisdictions

I know this works in 10+ jurisdictions because of explicit legal recognition, not just my opinion:

### United States
- **35 USC § 102** (AIA 2013) defines prior art as "publicly accessible" disclosures before the filing date. Blockchain publication satisfies this.
- **Federal Rules of Evidence 902(13) & 902(14)** allow self-authenticating electronic records verified by hash value. Blockchain timestamps are precisely hash-verified records.
- **35 USC § 273** creates a "prior user rights" defense. A blockchain-anchored disclosure establishes you were the prior user.

### European Union
- **eIDAS Regulation 910/2014, Article 41** gives qualified electronic timestamps a legal presumption of accuracy across all 27 member states. The 2024 **eIDAS 2.0** revision explicitly integrates blockchain-based electronic ledgers.
- **Article 54(2) EPC** defines state of the art as "everything made available to the public." A blockchain-anchored disclosure qualifies.
- **Article 55 EPC** provides a 6-month grace period for evident abuse. The blockchain timestamp is your independent proof of the original disclosure date.

### United Kingdom
- **Patents Act 1977 § 2(2)** — same as EPC.
- **Property (Digital Assets) Bill 2024** — establishes digital assets including blockchain records as a distinct category of personal property.

### China
- **Hangzhou Internet Court, June 2018** — first court globally to admit blockchain-stored evidence.
- **Supreme People's Court, September 2018** — formalized the position through judicial interpretation.
- **Patent Law Article 22(2)** — publicly known before filing = no patent.

### France
- **Tribunal Judiciaire de Marseille, March 2025** — recognized blockchain timestamping as valid proof of copyright anteriority. First French judicial precedent; persuasive across EU.

### Japan
- **Patent Act § 29(1)** — publicly known or worked invention before filing = no patent. Case-by-case blockchain evidence admission.

### Italy
- **Law No. 12/2019, Article 8-ter** — blockchain timestamps granted same legal effect as electronic timestamps under eIDAS.

### WIPO
- **2022 Guidance** — explicit recognition of blockchain for proving prior authorship.

That's 8 jurisdictions with explicit statutory or judicial recognition, plus 12+ if you count the broader "case-by-case" admissions.

## What it doesn't do

To be clear, blockchain prior art is **not** a patent grant. It does not give you offensive rights to sue others for infringement. It gives you:

- A defense against infringement claims (you were first)
- The ability to block competitors from obtaining patents on the same invention (your disclosure becomes prior art that examiners must consider)
- Evidence in derivation proceedings (US) and opposition proceedings (EU)

To get offensive rights, you still need to file a formal patent application. The blockchain timestamp serves as supporting evidence of priority.

## The cost comparison

| Method | Cost | Time | Legal strength |
|---|---|---|---|
| Provisional patent (US) | $1,500-$15,000 | 2-6 months | Strong, time-limited (12 months) |
| Full patent application | $10,000-$50,000+ | 2-5 years | Strongest, but expensive |
| Bernstein.io timestamp | €29-€99 | minutes | Strong |
| TimeProof timestamp | €15-€45 | 2 seconds | Medium |
| **OpenPatent.ai defensive disclosure** | **$10** | **~10 minutes** | **Strong (Bitcoin-anchored)** |
| IP.com Prior Art Database | $295-$1,500 | days | Strong |

For most indie developers and startups, $10 with 6-layer cryptographic proof is the obvious starting point. You can always file the formal application later — the disclosure establishes your priority.

## The "disclose first" workflow

If you take one thing from this post, take this:

1. Before you paste your invention into Claude, ChatGPT, or any other AI assistant, run it through OpenPatent.ai first.
2. $10 gets you a 6-layer cryptographic proof of priority.
3. The proof is anchored to Bitcoin and viewable at `verify.openpatent.ai/{hash}`.
4. Now use AI freely. Your invention is permanent prior art that no one — not even an AI company — can patent.

The cost-benefit math is unambiguous: $10 to protect an idea that could be worth $10 million, $100 million, or $1 billion.

## Get started

- Free / self-hosted: `git clone https://github.com/CSOAI-ORG/patentmcp && pip install -e .`
- Hosted: `curl -X POST https://api.openpatent.ai/v1/disclosure -d '{...}'`
- MCP server (for Claude Code / Cursor / Windsurf): `npx -y @openpatent/mcp-server`
- Verify any disclosure: `https://verify.openpatent.ai/{hash_prefix}`

Questions? Open an issue at [github.com/CSOAI-ORG/patentmcp](https://github.com/CSOAI-ORG/patentmcp).
