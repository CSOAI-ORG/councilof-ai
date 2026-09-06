# Competitors — 5 September 2026, and where the moat actually is

Sources: **Tracxn export** `TracxnExport-CSOAI-CompanyPdf-Aug-23-2026.pdf` (generated 23 Aug 2026)
and the **pre-money valuation analysis** of 19 Aug 2026. Live CSOAI figures probed 2026-09-05.

## Where CSOAI sits in its own set, per Tracxn

| | |
|---|---|
| Tracxn score | **24** |
| Rank | **104th of 1,061** competitors |
| Stage | **Unfunded**, total equity **$0** |
| The set | 1,059 active · **64 funded** · 6 exited · **$725M** raised across 97 rounds · 359 investors |
| Geography of the set | US 283 · **UK 57** · India 40 · Canada 28 · Germany 28 |
| Tracxn's "latest market share" | Credo 33% · Zero Drift 33% · NOMA 25% · Clam 8% |

## The scale comparison — lost, and not close

| Company | Score | Location | Founded | Stage | Equity |
|---|---|---|---|---|---|
| Credo | 64 | Palo Alto | 2020 | Series B | $41.3M |
| Vijil | 60 | Santa Clara | 2023 | Series A | $23M |
| ModelOp | 60 | Chicago | 2016 | Series B | $16M |
| Witness | 59 | San Mateo | 2023 | Series B | $85.5M |
| Hirundo | 58 | London | 2023 | Seed | $8M |
| Singulr AI | 58 | Palo Alto | 2023 | Seed | $10M |
| Superwise | 57 | Nashville | 2017 | Acquired | $4.5M |
| Aurascape | 55 | Santa Clara | 2024 | Series A | $62.8M |
| Portal26 | 54 | San Jose | 2019 | Series A | $15M |
| Holistic AI | 54 | London | 2020 | Funded | — |
| **CSOAI** | **24** | **London** | **2026** | **Unfunded** | **$0** |

Top by funding in the set: NOMA $132M · Witness $85.5M · Aurascape $62.8M · Prove AI $61.1M ·
Credo $41.3M · **CSOAI $0**.

## arena.ai (LMArena) and the eval tier

| Company | Round | Valuation | Revenue signal |
|---|---|---|---|
| **LMArena / arena.ai** | Series A $150M, 6 Jan 2026 | **$1.7B post** | ~$30M annualised consumption; 5M+ MAU |
| Vals AI | Series A $40M, 13 Aug 2026 | **$400M post** | revenue up 8× YoY |
| Patronus AI | Series B $50M, Jun 2026 | undisclosed | 15× revenue growth |
| **AIUC (Caliber Labs)** | Seed $15M, Jul 2025 | **$57.43M post** | *closest structural analogue* — standards + audit + insurance |
| Trismik | Pre-seed £2.2M, Sep 2025 | undisclosed | closest **UK-eval** peer |
| Sector median | — | **~$24M** | newmarketpitch.com |

**Do not compute a multiple against these.** CSOAI's revenue is `null` (`/api/revenue` →
`settled_usdc`), so any ratio is undefined — the same trap the 19 Aug analysis flagged about its own
159.41× figure: *"the entry multiple is an output of the process, not an input."*

---

## The moat line: **method, not scale**

On every scale axis CSOAI is last: $0 against $725M, rank 104 of 1,061, one officer against teams
of 20–50. **Scale is not the axis to compete on and pretending otherwise is how the story breaks.**

What is actually differentiated is the *method*, and each element is checkable rather than claimed:

| Method element | Live proof | Who else does it |
|---|---|---|
| **Signed measurement cards** — Ed25519 over a canonical leaf binding subject and source URL | `/signed/card_index.json` → 335 | The eval tier publishes leaderboards, not signatures |
| **A Merkle root over the estate** | `/root.json` → 167 cards, `sig_ed25519` | — |
| **Recomputable for free by a stranger** | `/api/x402` → `invariants.recomputable_for_free`; 9 free-forever URLs | Competitors gate at some tier |
| **A public corrections ledger** | `/api/corrections` → **46 issued** | **This is the rarest one.** Almost nobody publishes their own errors. |
| **UNMEASURED as a first-class published state** | `/api/hub-cards` → 70 of 761 cells say UNMEASURED | Leaderboards report what they measured and stay silent on the rest |
| **Measurement, never certification** | `/api/x402` → `invariants.never_a_grade`, `measurement_not_certification` | AIUC and the TIC industry certify; that is a different, regulated posture |

**The honest form of the moat claim — narrowed 2026-09-06 after actually testing it**
(`docs/research-intake/2026-09-06/moat-claim-tested.md`):

> *No peer in this set publishes a DID-bound signing key or a machine-readable corrections endpoint
> at a conventional path* — probed 2026-09-06, `0 of 14` for a DID document and `0 of 10 probeable
> hosts` for a corrections/verify endpoint.

The sentence that shipped here first said we are *"the only body in this set"* doing this. That was
written from reasoning, not measurement, and it overreached in two ways the test exposed:

- **Absence at a conventional path is not absence of the practice.** A corrections record can live
  in a blog, a docs subdomain, a PDF or a customer portal; this probe would miss all four.
- **Two of the twelve hosts could not be probed at all.** `lmarena.ai` and `trismik.com` return
  **200 on a path that cannot exist**, so every response from them is meaningless. They are
  UNMEASURED, not absent — and the raw numbers had credited LMArena with five surfaces it does not
  have.

It is still a statement about **method**, still verifiable in a few `curl` commands, and still does
not depend on being big. It is now a statement about *published surfaces* rather than about what
anyone does.

### Where the method is currently weaker than the claim

Three gaps, all published rather than hidden — and stating them is part of why the method claim
holds at all:

1. **The root is signed but not anchored.** No `ots`/`rekor`/`anchor` field on `/root.json`. Until
   that closes, "signed" means custody, not independent time. See `/.well-known/anchor-posture.json`.
2. **One signing key.** Every signature is CSOAI's own `did:web`. A verifier checking only that key
   proves custody, not independence.
3. **No counterparty signature anywhere in the estate.** Nothing is countersigned by a measured
   party, so the chain is one-sided.

## The precedent that should set expectations

**AIUC** is the closest structural analogue — standards + audit + insurance, priced at **$57.43M
post** at seed. It launched with a multi-person credentialed team and a working insurance
mechanism. CSOAI shares the thesis and holds **neither** of those two traction inputs. The comps
bound the destination; they do not price the present.

And the category is real: a16z's own framing of the Vals investment — *"every market eventually
needs an independent scorekeeper"* — is the thesis. **Being early to a correct thesis with no team
and no revenue is a position, not a valuation.**

_Compiled 2026-09-05 by the eat lane. Peer data is Tracxn's, dated 23 Aug 2026 and quoted with its
date. Every CSOAI figure carries the live URL that produces it._
