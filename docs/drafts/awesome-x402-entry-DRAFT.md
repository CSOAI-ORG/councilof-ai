# DRAFT — awesome-x402 README entry (owner posts; nothing is submitted by this PR)

VERIFIED 2026-09-04, against the live site, immediately before this revision:
  /api/x402 rail.mode ............ live      (the draft's own precondition — now met)
  /llms.txt ...................... 200
  /api/rwa/evidence .............. 402       sellable
  /api/art50/marking-evidence .... 402       sellable
  /api/receipts/batch ............ 402       sellable
  /api/witness ................... 503       QUARANTINED_PRE_RELEASE — REMOVED from the entry

The witness clause was cut for that last line. /api/witness answers 503 with
lifecycle QUARANTINED_PRE_RELEASE: paid issuance is disabled until a release gate verifies the
atomic leaf -> signed root -> exact-byte sidecar -> Rekor snapshot -> OpenTimestamps chain. That
gate is correct — two atom-root .ots proofs were found today anchoring bytes that exist nowhere —
and advertising a quarantined product in a public directory would be exactly the overclaim this
draft's own preflight exists to prevent. Rekor and OTS still appear, but as what they are: the
PUBLIC ROOT is witnessed, which is true and checkable.

Target: `https://github.com/xpaysh/awesome-x402` → section **Production Implementations → Data & Social APIs**
(one bullet per seller; the list's convention is name, one-line what/for-whom, chain/facilitator, then discovery links).
Post only after the facilitator env is set (`/api/x402` reports `rail.mode: live`) — listing a challenge-only rail
would be an overclaim. Amounts are deliberately absent (estate doctrine: prices only inside a 402).

```
- [Council of AI — signed measurement receipts](https://councilof.ai) - Independent, recomputable measurement artefacts for AI agents, sold per artefact over x402 v2 (USDC on Base, Bazaar discovery on every 402): commission a signed card-v0 receipt for a named subject, a historical batch of signed measurement leaves with Merkle inclusion paths and the public roots that carried them, and per-request XRPL issuer evidence cards. The public root is witnessed to Sigstore Rekor and OpenTimestamps. Verification, the board and every single leaf are free forever; nothing sold is a grade, a rank or a certificate — measurement, not certification. MCP server with seven free tools and paid tools (402 challenge returned as structured content). ([Discovery](https://councilof.ai/.well-known/x402.json) | [Catalog](https://councilof.ai/api/x402) | [MCP](https://councilof.ai/mcp) | [llms.txt](https://councilof.ai/llms.txt) | [GitHub](https://github.com/CSOAI-ORG/councilof-ai))
```

Facts to re-check the day it is posted (bytes adjudicate): `/api/x402` mode; that PRs #1158 / #1162 / #1163 are
merged if `witness_hash` / `rwa_evidence` / `art50_marking_evidence` are named (else trim the line to what is
deployed); `/llms.txt` still 200.
