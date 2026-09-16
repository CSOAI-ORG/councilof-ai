# Editor Pitch 1: The Register — "A UK company publishes 53 corrections about itself"

**Status: DRAFT. Not sent. The owner sends.**
**Target:** The Register (theregister.com) — AI governance, UK tech
**Angle:** Self-correction as credibility engine
**Verified:** All numbers carry proof commands.

---

**Subject line:** A UK company publishes every time it gets something wrong — 53 times so far

Hi [editor],

Council of AI is a UK measurement body (CSOAI Ltd, Companies House 16939677) that publishes signed measurement cards for AI systems. What makes it unusual is not what it measures — it is what it publishes about its own mistakes.

The corrections ledger is public, machine-readable, and RSS-subscribable. Every entry states what was wrong, how it was caught, and the fix. There are 53 entries. The latest six were published this week.

```
curl -s https://councilof.ai/api/corrections | jq '.corrections|length'
# → 53

curl -s https://councilof.ai/feeds/corrections.xml | head -5
# → RSS feed of corrections
```

The measurement infrastructure is anchored in Bitcoin via OpenTimestamps and in Sigstore's Rekor transparency log. Every card is signed under `did:web:csoai.org#board-attestation-1`. Verification is free and needs no account.

```
curl -s https://councilof.ai/api/press.json | jq '.public_root'
# → merkle_root, leaves: 305, OTS status
```

Revenue is 0.02 USDC from one external payer. The company is pre-revenue, not post-revenue, and says so.

This is a story about what happens when a measurement body applies its own standard to itself. The corrections ledger is the most interesting part — 53 times the company was wrong, and 53 times it published the fix before anyone else found it.

Happy to provide access to the raw artifacts or walk through the verification chain.

Nicholas Templeman
CSOAI Ltd
hello@councilof.ai
```
curl -s https://councilof.ai/api/press.json | jq .doctrine
```
