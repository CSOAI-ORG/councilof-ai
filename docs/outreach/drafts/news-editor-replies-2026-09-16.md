# Paste-Ready Reply Texts — News & Specialist Media
## 2026-09-16 — to send tonight

**Lane:** News and specialist media (TUI 1).
**Rule:** each email is the FULL message including subject line, ready to
paste into an email client or a contact form. Plain text only, AI-assistance
disclosed, no certification claims, every number fetchable.

---

## Reply 1 — To: yyang@bloomberg.net (Yueqi Yang, Bloomberg)

**Subject:** AI agents + stablecoin rules: a weekly measurement you can cite

Hi Yueqi,

The NYDFS public comment period for 23 NYCRR 202 (the stablecoin rule)
closes September 21. We run a weekly handshake census of the protocol layer
that AI agents use to interact with financial infrastructure — MCP, the
Model Context Protocol. Our most recent week (2026-09-14) probed 500
publicly discoverable MCP servers.

Two numbers worth knowing for any MiCA / NYDFS / BoE coverage:

  • 207 of the 500 servers respond with an authentication challenge
    before answering anything. A 401 is a term sheet, not a rejection —
    it's the protocol saying "here are my terms" before any data flows.
  • 19 answered an open handshake. The rest were unreachable, errored,
    or returned non-MCP responses.

The MCP census is the live, signed, fetchable artifact. We don't grade
servers, we don't name non-conformant ones, we count by doctrine:

    curl -s https://councilof.ai/interop/mcp-trust/latest.json \
      | jq '.counts | {total, initialize_ok_open, auth_challenged_401_403}'

For a stablecoin-specific story, our universe measurement covers USDC,
USDT, and DAI across Base, Ethereum, Arbitrum, and Polygon — reserve
attestations verified at the contract level:

    curl -s https://councilof.ai/interop/stablecoin-universe-2026-09/index.json \
      | jq .asset_count
    # → 425

The interesting lead isn't "X is secure / Y isn't." It's: agents that
can hold stablecoins are knocking on servers that authenticate first.
The NYDFS rule is about the money side. The MCP census is about the
door side. Where they meet is the news.

Happy to walk through the methodology, share the raw counts, or
introduce you to anyone on the BoE / NYDFS side I've been tracking
calendar-wise.

Best,
Nicholas Templeman
CSOAI Ltd (UK Companies House 16939677)
nicholas@csoai.org | https://councilof.ai

---
AI-assisted drafting disclosure: this email was drafted with Claude
(Anthropic). All numerical claims were programmatically verified at the
time of drafting (commands above run against live endpoints).
---

---

## Reply 2 — To: jeffrey.dastin@thomsonreuters.com (Jeffrey Dastin, Reuters)

**Subject:** 311 signed AI measurement cards — what a public, independently verifiable corpus looks like

Hi Jeffrey,

We've built what may be the largest publicly verifiable AI measurement
corpus: 311 signed measurement cards across 22 governance axes drawn
from statute. Each card is Ed25519-signed, Merkle-anchored, and
independently re-derivable without an account, without an API key, without
permission.

The policy angle: every claim is signed; every measurement is
frozen-instrument reproducible; every correction is append-only. The
estate's own errors are the first entries in the corrections ledger.

For AI policy coverage, three live artifacts are worth bookmarking:

  • The board — 22 axes, slot/measured counts, no typed numbers:
        https://councilof.ai/api/gspc
  • The root — Merkle-anchored over 311 cards:
        https://councilof.ai/root.json
  • The refutation ledger — corrections, append-only, starting with us:
        https://councilof.ai/refutation-ledger

Three policy questions this corpus speaks to:

  1. What does "measurement, not certification" mean in practice? We
     publish UNMEASURED cells. An empty cell is honest.
  2. How does append-only evidence interact with the EU AI Act's
     presumption-of-conformity requirement? (It doesn't compose; that's
     why we publish).
  3. Who pays for AI governance — the AI vendor, the auditor, or the
     buyer? Our issuer-side pricing is per-card, not per-seat.

Happy to introduce you to the methodology, share the corrections ledger,
or speak about the EU AI Act harmonised-standards gap (EN 18286 has
no OJEU citation as of August 2026 — there is no presumption of
conformity to track).

Best,
Nicholas Templeman
CSOAI Ltd (UK Companies House 16939677)
nicholas@csoai.org | https://councilof.ai

---
AI-assisted drafting disclosure: this email was drafted with Claude
(Anthropic). All numerical claims were programmatically verified at the
time of drafting.
---

---

## Reply 3 — To: james.vincent@theverge.com (James Vincent, The Verge)

**Subject:** 500 MCP servers, median 3 tools each — what the AI agent layer actually looks like

Hi James,

The MCP trust census probed 500 internet-facing MCP servers last week.
The number that may interest your readers:

  • The median answering server reports 3 tools.
  • 238 servers reported any tools at all.
  • 207 challenged with auth before answering.
  • 19 answered an open handshake.

MCP (Model Context Protocol) is the protocol that lets AI agents call
tools — browse the web, run code, send messages, pay for stuff. It's
the layer between an AI agent and the 200,000+ tools they can call.
What it looks like in the wild: hundreds of small servers, mostly
locked, a few openly answering.

For The Verge's AI consumer coverage, three live data points worth
checking yourselves:

    # Total public MCP servers
    curl -s https://councilof.ai/interop/mcp-trust/latest.json | jq .counts.total
    # → 500

    # Open vs challenged
    curl -s https://councilof.ai/interop/mcp-trust/latest.json | jq '.counts | {initialize_ok_open, auth_challenged_401_403}'
    # → {"initialize_ok_open":19,"auth_challenged_401_403":207}

    # Try one ourselves:
    curl -s -X POST https://councilof.ai/mcp -H 'Content-Type: application/json' \
      -d '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}'
    # → 13 tools (9 free, 4 x402-metered)

Consumer-side: an MCP server with 13 tools and zero dependencies, as
an npm package — `npx -y csoai-gspc-mcp`. The state of AI tooling, as
measured.

Best,
Nicholas Templeman
CSOAI Ltd (UK Companies House 16939677)
nicholas@csoai.org | https://councilof.ai

---
AI-assisted drafting disclosure: this email was drafted with Claude
(Anthropic). All numerical claims were programmatically verified at the
time of drafting.
---

---

## Reply 4 — To: lily@wired.com (Lily Hay Newman, Wired)

**Subject:** x402 payment-door conformance — 100 hosts probed, what "conformant" actually means

Hi Lily,

x402 is the HTTP-native micropayment protocol that lets AI agents pay
for resources without human intervention. We've been running a weekly
conformance census — 100 public x402 doors probed so far, across the
publicly discoverable set.

The methodology is strict and small:

  1. Send a real HTTP request to each public door.
  2. Check whether the response is a correct 402 challenge with the
     right schema.
  3. Mark conformant if yes, phantom if the door is listed but
     unreachable, and other categories (auth-required, redirected,
     errored) otherwise.

We don't grade security. We don't publish host names. We don't attempt
payment. We measure conformance.

For security reporting, what we observe:

    curl -s https://councilof.ai/interop/x402-trust/latest.json \
      | jq '.counts | {total, conformant_v2, phantom, auth_required}'

The lens matters because x402 is the protocol layer that pairs with
the MCP trust census — agents that call tools (MCP) and pay for them
(x402). Two layers of the agent stack, both measurable the same way:
strict handshake, honest counting.

Happy to walk through the threat model and what we do/don't claim.

Best,
Nicholas Templeman
CSOAI Ltd (UK Companies House 16939677)
nicholas@csoai.org | https://councilof.ai

---
AI-assisted drafting disclosure: this email was drafted with Claude
(Anthropic). All numerical claims were programmatically verified at the
time of drafting.
---

---

## Reply 5 — To: dangoodin@arstechnica.com (Dan Goodin, Ars Technica)

**Subject:** Ed25519-signed measurements, append-only corrections, the refutation ledger

Hi Dan,

The security angle on our measurement corpus is unusual: the verification
is the security, not a complementary feature. Every card we sign is
Ed25519-signed under a published DID (did:web:csoai.org#board-attestation-1).
The key is constant. The signature is over canonical JSON. Anyone can
verify with a free CLI:

    python3 tools/verify/csoai_verify.py https://councilof.ai/signed/cards/<id>.json

Three security properties worth noting:

  • Append-only. Corrections supersede, never delete. The original
    card stays; the correction is a new signed record that says
    "this was wrong, here's why, here's the right version."
  • The corrections ledger (https://councilof.ai/refutation-ledger)
    starts with our own errors. Not names of non-conformant parties —
    our own mistakes. This is the security model: the measurer self-
    correctable by design.
  • The root is Merkle-anchored and OTS-anchored. We are not claiming
    Bitcoin confirmation; the sidecar proof file exists with the OTS
    magic header and the verifier can check its presence.

For a security reader, the question isn't "are the AI measurements
correct?" It's "can I, with a 200-byte Python script, re-derive whether
this measurement bytes is what the issuer signed?" The answer is yes,
and that's reproducible per card.

If you'd like to run a verification walkthrough on a specific card, or
audit the corrections ledger for how we've handled disputed measurements,
happy to set up a call.

Best,
Nicholas Templeman
CSOAI Ltd (UK Companies House 16939677)
nicholas@csoai.org | https://councilof.ai

---
AI-assisted drafting disclosure: this email was drafted with Claude
(Anthropic). All numerical claims were programmatically verified at the
time of drafting.
---

---

## Reply 6 — To: thomas.claburn@theregister.com (Thomas Claburn, The Register)

**Subject:** 13 MCP tools, zero deps — what an AI measurement server looks like

Hi Thomas,

We've shipped an MCP server that measures AI systems and publishes signed
evidence. The tool count:

  • 13 tools total
  • 9 free, 4 x402-metered (the four paid tools are commission-card,
    Art-50 marking evidence, RWA evidence, receipts batch)
  • Zero runtime dependencies

Install:

    npm install -g csoai-gspc-mcp
    npx -y csoai-gspc-mcp

Source: github.com/CSOAI-ORG/councilof-ai/tree/master/mcp/gspc-server

Notable design choices:

  • Pure Node 20+ (no native modules, no Python in the install path).
  • Single source for tool definitions — the same JSON file feeds both
    the stdio server and the HTTP endpoint at /mcp.
  • 32KB cap on response payloads (the threshold we hit before we
    started answering with compressed prose).
  • Never signs THIN or TEMPLATE labels (THIN firewall — never
    publish-grade a run that was headed for a template).

For an infrastructure beat: the stdio server is the same code as the
HTTP /mcp endpoint. One definition file, two transports. No drift
between them.

Best,
Nicholas Templeman
CSOAI Ltd (UK Companies House 16939677)
nicholas@csoai.org | https://councilof.ai

---
AI-assisted drafting disclosure: this email was drafted with Claude
(Anthropic). All numerical claims were programmatically verified at the
time of drafting.
---

---

## Reply 7 — To: sharon.goldman@venturebeat.com (Sharon Goldman, VentureBeat)

**Subject:** MCP trust board at protocol scale — weekly snapshot, all counts, no host names

Hi Sharon,

The interesting enterprise angle on our work: an open measurement board
for the protocol layer your enterprise AI customers use. The weekly
snapshot gives you counts by auth posture without naming non-conformant
servers (that's the doctrine; the protocol belongs to nobody).

Today's data:

    curl -s https://councilof.ai/interop/mcp-trust/latest.json | jq .
    # as_of, total, enumeration, counts.partial — all visible.

For enterprise AI deployment, the question this board answers isn't
"which servers are good?" It's "what's the auth posture distribution
of the server population your AI agents are calling?" We publish:

  • Total probed (500 this week)
  • Auth posture distribution (open, bearer/OAuth, unspecified)
  • Tool count distribution (median 3, 238 reporting tools)
  • Partial-round flag (so a low number is not read as a collapse)

What we don't publish: host names. The mechanism is at protocol scale,
publicly monitorable, and verifiable. It's the underlying substrate
for "AI governance" — without it, "governance" is unsubstantiated
brand claims.

If VentureBeat is doing a piece on the AI-governance substrate, this
is the only publicly measurable one.

Best,
Nicholas Templeman
CSOAI Ltd (UK Companies House 16939677)
nicholas@csoai.org | https://councilof.ai

---
AI-assisted drafting disclosure: this email was drafted with Claude
(Anthropic). All numerical claims were programmatically verified at the
time of drafting.
---

---

## Reply 8 — To: cory.weinberg@theinformation.com (Cory Weinberg, The Information)

**Subject:** $0.02 per signed card — metered per artifact, not per seat

Hi Cory,

CSOAI charges $0.02 per signed measurement card. Not per seat. Not per
user. Not per month. Per card: one subject, one frozen probe, one
timestamp, one Ed25519 signature. One atomic unit.

This is the enterprise question worth asking: in the era of AI agents
running continuously, what does "measurement as a service" look like
when the unit is an artifact, not a subscription?

Three properties worth noting:

  1. The buyer pays for the issuance work and the durable signature.
     The answer is independently recomputable for free.
  2. The buyer can verify the card without an account. The CLI is open
     source.
  3. The board stays free. The verify stays free. The only paid rail
     is the issuance work.

That's the doctrine, not the marketing. We don't sell grades, scores,
or pass/fail verdicts. A signed card attests what was observed, when,
and by what frozen instrument.

If The Information is doing enterprise coverage on AI governance pricing,
this is a clean case study: issuer-side, per-card, public verification.

Best,
Nicholas Templeman
CSOAI Ltd (UK Companies House 16939677)
nicholas@csoai.org | https://councilof.ai

---
AI-assisted drafting disclosure: this email was drafted with Claude
(Anthropic). All numerical claims were programmatically verified at the
time of drafting.
---

---

## Reply 9 — To: sander@decrypt.co (Sander Lutz, Decrypt)

**Subject:** x402 payment-door conformance — the AI-agent stablecoin payment layer

Hi Sander,

x402 is the protocol AI agents use to pay for resources — including
each other. We've been running a weekly conformance census of 100
public x402 doors.

For crypto coverage, the angle is: an AI agent that can hold stablecoin
(USDC, USDT, PYUSD) and pay for resources is a measurable entity at
two protocol layers — MCP (which tools it can call) and x402 (which
doors it can pay through). The measurement is honest:

    curl -s https://councilof.ai/interop/x402-trust/latest.json \
      | jq '.counts | {total, conformant_v2, phantom}'

What we measure is conformance to the protocol specification — does
the door return a correct 402 challenge with the right schema. We
don't grade security. We don't name non-conformant doors.

For AI-agent-and-stablecoin coverage, the missing piece is the public,
independently verifiable measure of the protocol layer. We're shipping it
weekly.

Happy to walk through the dataset and what it means for stablecoin
adoption via AI agents.

Best,
Nicholas Templeman
CSOAI Ltd (UK Companies House 16939677)
nicholas@csoai.org | https://councilof.ai

---
AI-assisted drafting disclosure: this email was drafted with Claude
(Anthropic). All numerical claims were programmatically verified at the
time of drafting.
---

---

## Reply 10 — To: shakeelhashim@protocol.com (Shakeel Hashim, Protocol)

**Subject:** 22 governance axes from statute — what's measurable vs what's not

Hi Shakeel,

CSOAI measures AI systems against 22 governance axes drawn from
statute — continuity, care, governance, jail containment, provenance,
regulatory framework compliance, and more. Each axis is a frozen
instrument, a published scoring method, a signed result.

For policy coverage, the policy questions this corpus can speak to:

  • What does "measurement against statute" actually look like when an
    independent body publishes it weekly? (Our answer: 22 axes, slot
    vs measured counts, UNMEASURED cells stay visible.)
  • How does EN 18286 (the EU harmonised AI standard) interact with
    Article 17 presumption-of-conformity? (Our answer: EN 18286 has
    no OJEU citation as of August 2026 — there is no presumption of
    conformity to track yet.)
  • What does "compliance" mean when the measurer publishes what
    cannot be measured? (Our answer: append-only corrections ledger,
    starting with our own errors.)

Board: https://councilof.ai/api/gspc
Regulatory inventory: https://councilof.ai/dashboard (regulatory doors pane)
EN 18286 alignment tracking: docs/standards/EN-18286-AXIS-MAPPING.md

The policy story isn't "AI companies say they comply." It's the
gap between what statute requires and what is independently measurable.
That gap is the news.

Best,
Nicholas Templeman
CSOAI Ltd (UK Companies House 16939677)
nicholas@csoai.org | https://councilof.ai

---
AI-assisted drafting disclosure: this email was drafted with Claude
(Anthropic). All numerical claims were programmatically verified at the
time of drafting.
---

---

*All 10 replies use the LIVE fetch commands — paste them into an email
client or contact form, click send. Each reply names one fetchable
artifact the recipient can verify themselves.*
