# Design Partner Approach 3: Stablecoin Issuers — "Independent measurement of your reserves"

**Status: DRAFT. Not sent. The owner sends.**
**Target:** Stablecoin issuers (Circle, Tether, Paxos, Ripple, Maker)
**Angle:** Independent measurement infrastructure for stablecoin transparency
**Verified:** All numbers carry proof commands.

---

**Subject line:** Independent stablecoin measurement — 425 indexed assets, RLUSD deep measurement

Hi [team],

Council of AI measures stablecoins independently. We index 425 assets and publish deep measurement cards for selected stablecoins.

```
curl -s https://councilof.ai/api/press.json | jq .signed_cards.indexed
# → 335 cards (includes stablecoin measurement)
```

**What we offer as a design partner:**

1. **Independent measurement** of your stablecoin's on-chain state. Signed measurement cards with inclusion proofs.

2. **RLUSD deep measurement** — we already measure RLUSD daily. If you're Ripple, this is already happening.

3. **Cross-chain evidence** — we measure across XRPL, Ethereum, Base, and other chains. The evidence is machine-readable.

4. **Corrections ledger** — we publish when we get something wrong. 53 entries.

```
curl -s https://councilof.ai/api/corrections | jq '.corrections|length'
# → 53
```

**What this is NOT:**

- Not a reserve attestation (we don't attest to reserves)
- Not a compliance certification
- Not a rating or grade

Revenue: 0.02 USDC from one external payer. Pre-revenue.

Happy to provide a demo of the stablecoin measurement methodology.

Nicholas Templeman
CSOAI Ltd
hello@councilof.ai
