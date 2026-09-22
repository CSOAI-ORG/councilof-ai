# Claim maintenance on two named subjects: what we measured on 22 September 2026

**Subjects:** Chainlink (chain.link) and Ondo Finance (ondo.finance).
**Registry:** `/claims/claimreg-ondo-chainlink-2026-09-22-rev2.json`, which supersedes
`/claims/claimreg-ondo-chainlink-2026-09-22.json` by reference. The earlier file's bytes are
unchanged and still served.
**Harness:** `scripts/claims/` in the councilof.ai repository. Python standard library only. No
key, no account, no payment.

## What this is

Eight sentences were captured verbatim from these two companies' public pages on 22 September and
published with a plan for how each could be measured. None of them had been measured. This
document reports what happened when we ran the measurements.

**We make no claim of falsity about anyone.** Nothing here says that any company said anything
untrue. What follows is what each party's own public record says, what our instruments read from
public data, the window each reading covers, and — stated for every claim — what the reading does
not establish. Nothing in this work was sent to Chainlink, to Ondo, or to any organisation named
in it. There is no financial advice, no valuation and no opinion on the solvency or adequacy of
any product.

## Results

| Claim | Before | After | In one line |
|---|---|---|---|
| CL-1 | CLAIM_CAPTURED | **UNMEASURED** | The counter was captured; one reading is not a series. |
| CL-2 | CLAIM_CAPTURED | **CLAIM_MEASURED** | 13 of 28 category/vendor pairs are documented by a competitor. |
| CL-3 | CLAIM_CAPTURED | **CLAIM_MEASURED** | The free public breakdown covers 0.45% of tracked DeFi TVL. |
| CL-4 | CLAIM_CAPTURED | **CLAIM_MEASURED** | 2 corroborated, 3 not found, 4 we could not look. |
| CL-5 | CLAIM_CAPTURED | **CLAIM_MEASURED** | 384 intervals over 95.8 feed-days, against each feed's own parameters. |
| ON-1 | CLAIM_CAPTURED | CLAIM_CAPTURED | Not quantitative; a proof-point baseline was recorded instead. |
| ON-2 | CLAIM_CAPTURED | **UNMEASURED** | The organisation's own record could not be reached. |
| ON-3 | CLAIM_CAPTURED | **CLAIM_MEASURED** | The sentence is the index's, not the issuer's. |

### CL-3 — "market leader powering the majority of decentralized finance"

This is the one claim with a stated, testable quantity in it: *majority* means more than half.

DeFiLlama's free endpoint `api.llama.fi/protocols` lists 5,775 protocols with positive TVL,
totalling **$614.4bn**. Of those, **193** carry an `oracles` field naming the oracle they use,
and those 193 hold **$2.76bn** — **0.4491%** of the TVL DeFiLlama tracks. Within that 0.45%
slice, Chainlink's share is between **0.36%** (counting only protocols that name it as their
sole oracle) and **10.44%** (crediting it wherever it is named at all). The largest attributions
in the slice are `Internal` (35.9%), `Chaos` (29.5%) and `UMA` (13.2%).

The full oracle-TVS breakdown behind defillama.com/oracles answers **HTTP 402 — "Upgrade to the
paid API plan"**. We recorded that and dropped the source. We did not work around it.

**What this settles:** Chainlink's share of the TVL that the free public breakdown attributes to
any oracle, and how little of DeFi that breakdown covers.
**What it does not settle:** the claim itself, in either direction. A share computed over 0.45%
of tracked DeFi TVL is a share of that slice and of nothing wider. It is not evidence for the
claim and it is not evidence against it. TVL is also not the only measure of DeFi, and a protocol
with no `oracles` field may well use an oracle — absence in a dataset is not absence in fact.

### CL-5 — "proven track record of uptime, accuracy, and resilience"

This is the reading that repeats, and the one anyone can reproduce.

Chainlink publishes a per-network feed directory, keylessly, giving each feed's proxy address,
its **declared heartbeat** and its **declared deviation threshold**. That is the denominator: we
measure each feed against the parameters it publishes for itself, not against a standard we
chose. Ten feeds (ETH/USD, BTC/USD, LINK/USD, USDC/USD, DAI/USD on Ethereum mainnet and on Base)
were selected by name from that directory and each proxy was confirmed on-chain by calling
`description()` — a feed that does not answer to its name is dropped, not measured under it. The
rounds were then read back over public RPC (`ethereum-rpc.publicnode.com`, `mainnet.base.org`).

**384 consecutive intervals across 10 feeds, 95.8 feed-days in total.** Against each feed's own
declared heartbeat, with a stated 60-second grace for the block in which a heartbeat round is
written: **3 intervals exceeded the declared heartbeat by more than the grace**, on 2 feeds, and
the **largest single excess across all 384 intervals was 90 seconds**. No interval anywhere
exceeded its feed's heartbeat by more than 10%. With zero tolerance the count is 155, almost all
of them 12–36 seconds over, which is write latency rather than a lapse; both numbers are
published so neither can be quoted without the other.

**What this does not establish:** anything outside the windows we read, anything about feeds we
did not read, and nothing about whether the prices are *correct* — no on-chain value was compared
to any off-chain reference. A window with no lapse is a sample, not a history.

### CL-4 — the named adopters

For each of the nine named organisations we searched **that organisation's own published index**:
its robots.txt and sitemaps, and the keyless Common Crawl URL index for its domain; then we
fetched the pages ourselves and quoted from the page's visible text.

- **CORROBORATED (2):** Aave and Lido. Both publish posts on their own domains about adopting
  Chainlink CCIP, with the URLs and quotes in the registry.
- **NOT_FOUND (3):** UBS, ANZ, GMX. We read 9,126, 3 and 176 index URLs respectively and did not
  find the term. **This means our search did not find it.** It is not a denial, not a
  contradiction, and not evidence that any relationship does not exist.
- **SEARCH_INCONCLUSIVE (4):** Swift, Euroclear, Mastercard, Fidelity International. Their
  servers answered our automated reader with a block (HTTP 403 and 503 are recorded per URL), so
  **we could not look**. This is reported as its own state and deliberately not collapsed into
  "not found": an absence found by a reader who was turned away is not an absence.

All nine names were present on the page on 22 September; that baseline is recorded so a later
removal becomes visible.

### CL-2 — "the only all-in-one oracle platform"

An exclusivity claim is falsifiable by counterexample, so we logged counterexamples. Seven
capability categories were declared in advance (they are in the registry, so you can disagree
with the categories rather than with a hidden judgement) and searched across 125 pages of four
competitors' own documentation: API3, Pyth, RedStone, Chronicle.

**13 of 28 category/vendor pairs** carry a documented capability, each with the URL, the matched
text and the quote. Price data feeds are documented by all four. Cross-chain messaging was found
in none of the pages we read.

This bears on exclusivity in the declared categories and on nothing else. "All-in-one" is not a
defined term; a documented capability is not a working, audited or comparable one; and a category
not found in a vendor's corpus is absent from the pages we read, which is a bounded set.

### ON-3 — OUSG, "liquid exposure to an ETF of short-term U.S. Treasuries"

The measurable question is whose sentence this is.

By exact string comparison, the sentence matches the **third-party index's** description of the
protocol (`api.llama.fi/protocol/ondo-finance` returns "This share class provides liquid exposure
to an ETF of short-term U.S. Treasuries"). It does **not** appear in Ondo's own OUSG
documentation. Ondo's own current wording is:

> OUSG (Ondo Short-Term US Government Treasuries) provides liquid exposure primarily to short-term
> US Treasuries, as well as government-sponsored enterprise (GSE) securities […] The OUSG
> portfolio is invested in funds issued by leading asset managers such as BlackRock, Franklin
> Templeton, WisdomTree, Fidelity, and others, along with bank deposits and USDC for liquidity
> purposes.
> — docs.ondo.finance/qualified-access-products/ousg/overview

Neither "ETF" nor "exchange-traded" appears in the OUSG documentation we read. **A difference in
wording between two publishers is a difference in wording.** It is not an error by either of them,
and it is not a finding that anything was misstated by anyone.

On what is published, Ondo's own documentation states that the fund administrator is NAV
Consulting, that NAV is calculated daily, that the full financials are published daily, and that
those reports "may lag up to three days behind the price update onchain"; and that the funds are
audited annually with the results "provided to investors". The link the documentation gives for
those daily reports is a Google Drive folder which **redirected our keyless reader to a Google
sign-in page** — we record reachability only, and we did not read, verify or assess the contents
of anything behind it. We express no view on whether any of this is sufficient.

### CL-1 — the $34,177,623,388,199 counter

Nothing public recomputes this figure, so it cannot be verified and we do not pretend to. What an
outsider can do is watch it. We read **$34,177,623,388,199** from chain.link on 2026-09-22 and
started a published series at `/claims/series/CL-1.jsonl`, with the page's byte digest beside each
reading. **One capture is not a measurement**, so the claim's state is **UNMEASURED** and stays
there until the series holds readings from two distinct dates. If the series ever moves *down* —
a cumulative counter that decreases has been restated — that will be reported as an *observed
change requiring review*, which is a prompt for a person to look and nothing more.

### ON-1, ON-2

**ON-1** ("Institutional-grade finance, delivered onchain") has no public definition to measure
against, so it stays CLAIM_CAPTURED. We recorded a baseline of the proof-points attached to it so
a later change is visible. **ON-2** (the ABN AMRO testimonial) is **UNMEASURED**: abnamro.com
answered our reader with HTTP 503 and the Common Crawl index was unreachable in the same window,
so the corroboration search reached no verdict. The testimonial was present on the page and that
persistence baseline is recorded.

## What we could not do, and why

- The full oracle-TVS breakdown needs a paid plan (HTTP 402). Recorded and dropped.
- Four of the nine named organisations block automated readers. Recorded per URL as
  SEARCH_INCONCLUSIVE.
- No general web search engine answered results to this host; every one tried returned a bot
  challenge. A search that was blocked must never be published as an absence, so we searched each
  organisation's own published index instead and said exactly how far that reaches.
- Ondo's daily financial reports sit behind a sign-in. Recorded as reachability only.

## How to check this yourself

```
git clone https://github.com/CSOAI-ORG/councilof-ai && cd councilof-ai
python3 scripts/claims/test_claim_harness.py            # 21 tests
python3 scripts/claims/test_claim_harness.py --controls # the planted inputs each harness rejects
python3 scripts/claims/run_all.py /tmp/run              # re-measure everything
python3 scripts/claims/build_rev2.py /tmp/run /tmp/rev.json
```

Every harness ships with a control that proves it can fail — a doubled heartbeat gap, an
implausible on-chain timestamp, 99% of a slice that is 1% of the market, a counter that goes down,
a term that exists only inside a `<script>` tag. A harness that has never failed has not been
tested.

The registry commits its eight claim records to an **RFC 9162 Merkle root**
(`63f30b871a4f48c1e036e20934916fc9ea00ca20d82bca9308f4c29897d81ca4`, 0x00 leaf / 0x01 node,
largest-power-of-two split, no odd-leaf duplication), so any single record can be proved to have
been in this registry without republishing the rest. Inclusion proofs for all eight are in the
file.

The registry is signed by `did:web:csoai.org#board-attestation-1`; the signature is in
`/claims/claimreg-ondo-chainlink-2026-09-22-rev2.signed.json`, which pins the file by sha256
(`ccca1c4f50a0faa4c959e457ac99be695124a5d86914f36c7bafeb5aaa116387`) because a signature cannot
live inside the bytes it covers. Both files have been **submitted to OpenTimestamps calendars and
are pending**: that is a calendar's promise of future Bitcoin inclusion, not a Bitcoin
attestation, and it will not be described as one until the proofs are upgraded and verified.

A signature proves these bytes were signed at that time. It grades nothing and certifies nobody.
We measure; we never certify.

---
*CSOAI Ltd — claim maintenance. Re-run weekly by a scheduled loop that emits observed changes for
a person to review and notifies no one outside.*
