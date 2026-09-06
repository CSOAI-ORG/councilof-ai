# W1 — what a buyer actually gets, and how to check it in 60 seconds

**Status: 2026-09-06.** One round exists. That makes this a census, not yet a time series; the second
round is what turns it into one, and nothing on this page pretends otherwise.

---

## The two numbers

> **213 of 316** conformant x402 hosts **REFUSED** a correctly-signed payment (67.4%).
> **100** delivered. **13** reported a settlement transaction in their own `PAYMENT-RESPONSE` and
> refused the retried request anyway — 0.193 USDC moved and nothing came back.

Neither number is typed anywhere. Both are folded from
`docs/product/x402-census/rounds/2026-09-06/settle.jsonl` by
`scripts/grants/x402_census_round.py`, and `--check` recomputes the whole document and exits 1 if a
single byte has moved. The page at `/interop/x402-census/` reads them out of `index.json`; a test
asserts the page contains no literal `316` or `213`, because a hard-coded number outlives the round
that produced it.

**What they are not.** Not a ranking, a recommendation, a certification or an accusation. REFUSED is
not evidence of bad faith: a rate limit, an account requirement and a change of terms between the
challenge and the retry are indistinguishable from outside, and we did not contact a single host to
ask. One purchase per host at one moment. Our own doors are excluded from the population — paying
ourselves is a self-settlement, never revenue, and never a measurement.

---

## Why nothing here says MEASURED

A host reaches a published state at **n ≥ 30 paid observations** (board ruling, 3 Sep) and the state
is written by the OIDC signer in GitHub Actions, never by a laptop and never by a producer.

One observation accrues per host per round. At a weekly cadence that is **about thirty weeks** — the
first host could reach the threshold around **April 2027**. Every artefact says so numerically rather
than leaving it to be inferred:

| where | field |
|---|---|
| `public/interop/x402-census/index.json` | `ladder.hosts_by_observations`, `ladder.hosts_at_or_above_n_required`, `ladder.weeks_to_n_required_at_weekly_cadence` |
| each delta | `ladder`, and `observations` / `state: "UNMEASURED"` on **every host row** |
| each card-v0 leaf | `payload.series.observations`, `payload.series.observations_required`, `payload.series.state` |
| `/interop/x402-census/` | the ladder table, rendered from those fields |

`observations` on a leaf is **frozen at the round it was written for**: a leaf produced for round 1
still reads `observations: 1` after thirty rounds exist. It has to. Counting "every round on disk"
would rewrite the body of every earlier leaf on every new round, and a signature over a body that
has since moved is worthless — the estate has already lost five days to exactly that
(`docs/corrections`, 28 Aug). `build_cards.py --selftest` asserts this property directly.

---

## Verify a leaf in 60 seconds, without trusting us

Four hops. Nothing below needs an account, a wallet or a key.

```bash
# 1. FETCH a card. Every leaf is a card-v0 under 3 KB with its own evidence URIs.
CARD=https://councilof.ai/interop/x402-census/leaves/2026-09-13/card-<sha256>-unsigned.json
curl -s "$CARD" | jq '{subject, as_of, payload: .payload.status, series: .payload.series, unmeasured}'

# 2. VERIFY the Ed25519 signature under did:web:csoai.org#board-attestation-1.
#    The key is published at the DID's one authoritative location:
curl -s https://csoai.org/.well-known/did.json | jq '.verificationMethod[] | select(.id|endswith("#board-attestation-1"))'
#    and the estate's own verifier does the canonicalisation for you:
node scripts/verify-estate.mjs --limit 15 --did-drift public/.well-known/did.json
#    (canonical form: UTF-8 JSON, sorted keys, separators (",", ":"); sha256 over the PAYLOAD only.)

# 3. INCLUSION — the card's sha256 must appear as a leaf under the signed public root.
curl -s https://councilof.ai/root.json | jq --arg s "<sha256>" \
  '{card_count, merkle_root, as_of, present: any(.leaves[]?; .card_sha256 == $s)}'

# 4. WITNESS — the root hash, and only the root hash, is witnessed in a public transparency log.
curl -s https://councilof.ai/interop/root-witness-pointer.json | jq '{drift, merkle_root, checked_at, log}'
#    drift MATCH means the witnessed hash is the root you just read. DRIFTED means it is not,
#    and the pointer says so rather than hiding it.
```

**What each hop does and does not prove.** (2) proves the bytes you hold are the bytes we signed.
(3) proves that card was in the set the root committed to. (4) proves the root existed at a time a
third party recorded, so we cannot have back-dated it. **None of them proves the host behaved well
or badly** — they prove the record of one purchase has not been altered since we made it. That is
the entire claim, and it is deliberately smaller than the claim a certificate makes.

Recompute the numbers rather than the signatures:

```bash
git clone https://github.com/CSOAI-ORG/councilof-ai && cd councilof-ai
python3 scripts/grants/x402_census_round.py --check    # rounds + index vs the committed rows
python3 scripts/grants/x402_census_delta.py --check     # deltas vs both rounds' rows
python3 harness/x402-census/build_cards.py --check      # every leaf vs its round's rows
```

---

## Who else measures this — and what is genuinely unoccupied

Checked 6 Sep 2026. The honest version, because the interesting claim is narrower than "nobody does
this" and the wide version is false.

| who | what they publish | do they record whether a paid request DELIVERED? |
|---|---|---|
| [x402scan](https://github.com/Merit-Systems/x402scan) (Merit Systems) | facilitators, merchants, wallets, resources, on-chain transfer volume; discovers via `/openapi.json` then `/.well-known/x402` | **No.** 14 API paths, all volume statistics. Its own API answered 402 to every GET we tried, so this is read from its OpenAPI path list and README, not from response bodies |
| [Coinbase CDP Bazaar](https://docs.cdp.coinbase.com/x402/bazaar) | catalogue with `accepts[]`, bazaar in/out schemas, and a `quality` field = 30-day call count + unique payers | **No.** Usage counts, not outcomes. A host that takes money and answers 402 still accrues calls |
| PayAI facilitator | `/supported`, and `/discovery/resources` — 28,230 resources | **No.** `lastUpdated` is a re-listing timestamp |
| [x402-foundation/x402](https://github.com/x402-foundation/x402) | the spec, plus a cross-language `e2e/` interop harness | **No.** It tests SDKs against a mock facilitator; no census of live hosts |
| arXiv [2607.12575](https://arxiv.org/abs/2607.12575) (14 Jul 2026) | population-scale Base census: 136,708,672 settlements, 21.20% fictitious, 63.78% internal to a linked cluster | **No.** It measures whether payments are *authentic*; it never buys anything |
| x402.fuchss.app | 93,266 monitored endpoints, trust score, 90-day history | **No — and it says so in writing:** "We probe and observe; we do not verify delivery-after-payment" |
| **x402-list.com** | 659 services, uptime 24h/7d, a change feed of payTo rotations, price moves, schema changes | **Partly — and this is the real competitor.** Its FORTE tier means it paid and the service delivered. But **13 of 659** carry it, it is a badge rather than a series, and its change feed tracks `payTo`/price/schema mutations, not DELIVERED→REFUSED flips |
| x402station.com | claims "real-time service monitoring" | **Unverified** — 403 to our fetch. Absent from our evidence is not absent from the world |

**So the accurate claim is narrow, and it is the one to make:** several parties probe for a 402
handshake, one pays a handful of hosts as a badge, and one publishes a mutation feed. **Nobody
publishes a per-host, paid-delivery outcome as a repeating series over a fixed population.** Do not
say "nobody measures delivery" — x402-list does, on 2% of its own catalogue.

### Who would pay for the delta — and how solid that is

Every row below is a buyer that demonstrably exists and is in this market. **None is evidence that
any of them has budgeted for, asked for, or bought reliability data.** That inference is ours and it
is the weakest part of this page.

| buyer | why they are in this market | the decision the delta changes |
|---|---|---|
| Agent frameworks and agent wallets | Cloudflare ships x402 in the Agents SDK and announced Cloudflare Wallets (4 Aug 2026); AWS documents Bedrock AgentCore against the CDP Bazaar | Which hosts an agent may spend at this week — an allowlist that moves |
| Facilitators and indexes | CDP already ships a `quality` field; PayAI carries 28,230 resources with no quality signal at all | Delisting and derank policy; a verified tier they cannot currently populate |
| Stablecoin issuer treasury / risk | Circle Agent Stack (May 2026); USDC is ~99% of x402 volume | Which merchants to surface or underwrite; churn on the agent corridor |
| Exchanges and wallets | Binance ships its own B402 Bazaar discovery layer | Curation of agent-payable services |
| Insurers and escrow | Armilla AI (Lloyd's coverholder) writes standalone AI liability cover for underperforming agents, limits raised past $25M in Jan 2026 | Loss frequency per host is an underwriting input, and a refusal record is a claims trigger |
| The mandate layer | Google AP2 + the A2A x402 extension, 60+ partners | A mandate proves authorisation; nothing in the stack proves fulfilment. Dispute logic needs a fulfilment oracle |
| The proven analogue | OpenRouter publishes per-provider error rate and availability and routes spend on it | Direct evidence that "route spend on measured reliability" is a product people use in paid-API land |

**We sell none of this today.** There is no price on this page and there will not be one: verification
is free, the rows are CC-BY-4.0, and a grade is never sold. The commercial question is whether a diff
feed is worth a design partner's time, and it is answered by asking one, not by writing a number here.

---

## The honest limits, in one place

1. **One round.** Everything about change is a promise until 13 Sep.
2. **The series is only as durable as the keystroke.** Each round is a real paid run the owner
   triggers, and roughly two thirds of the spend goes to hosts that refuse. Stop paying and the
   series stops; the artefact must never imply otherwise.
3. **A partial round is not a small round.** If a run is cut short by a cap or a crash, the hosts it
   never reached are UNMEASURED, not absent — totalling whatever came back and calling it the
   population is the failure mode this estate has already committed once. `population.hosts_sha256`
   exists so a short round is visible as a different population, not a smaller number.
4. **Hosts leave.** A host that drops out of the population stops accruing observations and may never
   reach n=30. The delta counts it as `dropped`, never as a flip.
5. **Take-and-refuse is the host's own claim.** We record the tx hash the host reported. Check the
   chain; do not take the row's word for it.
