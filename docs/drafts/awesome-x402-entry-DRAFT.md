# DRAFT — awesome-x402 README entry (owner posts; nothing is submitted by this PR)

Target: `https://github.com/xpaysh/awesome-x402` → section **Production Implementations → Data & Social APIs**
(one bullet per seller; the list's convention is name, one-line what/for-whom, chain/facilitator, then discovery links).
Post only after the facilitator env is set (`/api/x402` reports `rail.mode: live`) — listing a challenge-only rail
would be an overclaim. Amounts are deliberately absent (estate doctrine: prices only inside a 402).

```
- [Council of AI — signed measurement receipts](https://councilof.ai) - Independent, recomputable measurement artefacts for AI agents, sold per artefact over x402 v2 (USDC on Base, Bazaar discovery on every 402): commission a signed card-v0 receipt for a named subject, a historical batch of signed measurement leaves with Merkle inclusion paths and the public roots that carried them, and hash-only witnessing into an hourly Ed25519-signed root anchored in Rekor + OpenTimestamps. Verification, the board and every single leaf are free forever; nothing sold is a grade, a rank or a certificate — measurement, not certification. MCP server with seven free tools and five paid tools (402 challenge returned as structured content). ([Discovery](https://councilof.ai/.well-known/x402.json) | [Catalog](https://councilof.ai/api/x402) | [MCP](https://councilof.ai/mcp) | [llms.txt](https://councilof.ai/llms.txt) | [GitHub](https://github.com/CSOAI-ORG/councilof-ai))
```

Facts to re-check the day it is posted (bytes adjudicate): `/api/x402` mode; that PRs #1158 / #1162 / #1163 are
merged if `witness_hash` / `rwa_evidence` / `art50_marking_evidence` are named (else trim the line to what is
deployed); `/llms.txt` still 200.
