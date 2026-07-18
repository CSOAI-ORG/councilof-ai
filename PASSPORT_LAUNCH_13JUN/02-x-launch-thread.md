🧵 1/12

I just shipped a thing that I think every AI agent builder needs.

It's called the Agent Compliance Passport.

A signed, portable, offline-verifiable credential that an AI agent carries
proving what it complies with — and any other agent can verify it
without calling home.

Why this matters ↓

---

2/12

In 49 days, EU AI Act Article 50 kicks in for new generative AI systems.

Every agent shipped into the EU after 2 Aug 2026 must:
- Mark AI-generated content (C2PA + watermark)
- Disclose it's an AI
- Be human-oversightable

If you're a developer, the question becomes: how does the agent
on the OTHER side of a transaction know your agent meets that bar?

Answer: a passport. Signed. Verifiable. Offline.

---

3/12

The passport is just JSON:

{
  "did": "did:meok:7f3a...",
  "agent_type": "llm_agent",
  "frameworks": {
    "eu_ai_act": {"article_50": "compliant"},
    "gdpr": {"article_22": "compliant"}
  },
  "issuer": "meok.ai",
  "issued_at": "2026-06-13T04:00:00Z",
  "expires_at": "2027-06-13T04:00:00Z",
  "signature": "<128 hex chars of Ed25519>"
}

3 tools:
- issue_passport (the issuer side)
- verify_passport (the verifier side, 100% offline)
- exchange_credentials (the A2A handshake)

---

4/12

What it ships as:

pip install meok-compliance-passport-mcp

7 files. 28KB of code. 14 tests pass in 0.34s.

Open source. MIT. Ed25519. No HMAC, no central authority needed.

GitHub: github.com/CSOAI-ORG/meok-compliance-passport-mcp

---

5/12

Why Ed25519 and not HMAC:

HMAC needs a shared secret. That secret has to go through a channel.
That channel is the attack surface.

Ed25519 public key: publish once, verify forever. The auditor pulls
your public key from your site, then verifies every passport you
ever issued, offline, forever.

This is "skin in the game" as a primitive. You stake your signature.
Anyone checks it.

---

6/12

Why now, and why this matters:

- Article 50 = 2 Aug 2026 (49 days)
- 460 GitHub repos in our compliance fleet
- 294 servers in the official MCP registry
- 6,798 installs/month
- The wedge product for the A2A economy

The passport is the missing primitive. Without it, "compliance" is
a vendor's claim. With it, it's a cryptographic fact.

---

7/12

What's next:

1. Ship to PyPI (done in 5 min)
2. Submit to MCP Registry
3. PR 3 awesome-mcp lists
4. Send to 1,076 journalists on our press list
5. Open a GRC white-label programme (for the 19 partner agencies
   already asking)

If you're building agents that touch money, data, or humans, the
passport is your receipt.

---

8/12

The 11 frameworks we cover:

EU AI Act, Article 50, GDPR, HIPAA, SOC 2, ISO 42001, NIST AI RMF,
CRA, DORA, NIS2, GPAI Code of Practice.

Not all 50+ frameworks. Not because we can't. Because the 11 are
the ones with regulatory teeth in 2026. The other 39 are noise
until they're enforced.

(We'll add them as the regulation hits.)

---

9/12

The A2A handshake (exchange_credentials):

Agent A: "I'm did:meok:abc, passport covers EU AI Act + GDPR"
Agent B: "I'm did:meok:def, same coverage. Scope: payment <= $1000.
         Expires: 2027-06-13. Authorised: yes."

Both verify both. No trust broker. No "vendor says they're compliant".
Just math.

---

10/12

This is part of a larger thesis:

"In a world of unverifiable AI claims, we sell the auditor's math."

The keystone is the Ed25519 sigil bus. The passport is the first
product on it. Article 50 is the deadline. The 1,076 journalists
are the megaphone. The 19 GRC partners are the channel.

We don't sell features. We sell verifiable trust.

---

11/12

If you want to try it:

pip install meok-compliance-passport-mcp

from meok_compliance_passport_mcp import issue_passport, verify_passport

passport = issue_passport(
    agent_id="my-agent-001",
    agent_type="llm_agent",
    frameworks={"eu_ai_act": {"article_50": "compliant"}}
)

valid = verify_passport(passport)
# True

That's it. 6 lines. Live in 60 seconds.

---

12/12

We're 1 person, 1 farm, 460 repos, and 49 days from the deadline.

If this resonates, the 3 highest-leverage things you can do:

🔁 RT this thread (so other agent builders see it)
⭐ Star the repo (github.com/CSOAI-ORG/meok-compliance-passport-mcp)
📧 Reply with "passport" if you want the launch email

— Nick Templeman, MEOK AI Labs
sovereign AI from a UK farm
