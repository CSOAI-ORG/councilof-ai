# PHASE D — where Optimism funding actually lives, and Base Builder Rewards

**Measured 2026-09-06 by loading the pages in a browser**, because both sites are client-rendered
and a static fetch returns an empty body — a `curl` 200 against either proves only that a shell
was served.

## Optimism

**`retrofunding.optimism.io` redirects to `atlas.optimism.io`.** Both resolve 200 and land on the
same page, titled *Optimism Atlas*. As of today Atlas is **live and serving applications**.

What that page lists, verbatim from its own status labels:

| Program | Status |
|---|---|
| Audit Grants — *"for audit-ready apps looking to deploy on the Superchain"* | **Open** |
| Governance Fund Missions — *"for self-sufficient teams interested in technical challenges"* | **Open** |
| Growth Grants | Closed |
| Foundation Missions | Closed |

**"Retro Funding" is not an open program on that page.** It appears only as a past-tense statistic
("OP rewarded in Retro Funding") alongside the Grants Council total. So the retro-funding door is
not currently open under that name; the two open doors are Audit Grants and Governance Fund Missions.

**What I could NOT verify, and every avenue I tried.** The brief states OP Atlas is discontinued on
18 September. It is **not verified**, and the avenues open to this lane are now exhausted:

| Avenue | Result |
|---|---|
| `atlas.optimism.io`, rendered in a browser | live and serving; **no sunset banner** anywhere in the page text |
| `retrofunding.optimism.io` | **redirects to Atlas** |
| `gov.optimism.io` search, *"Atlas sunset"* | **No results found** |
| `gov.optimism.io` search, *"Atlas deprecated OR sunset OR retiring"* | **No results found** |
| `gov.optimism.io/search.json`, *"Atlas discontinued"* | 3 topics, all Season 7/8 mandates — none a shutdown |
| `optimism.io/blog` | **behind a Terms & Conditions acceptance gate** |

The forum searches were run **in a browser**, so "no results" is a real answer and not a bot-block —
the earlier `search.json` attempt could not distinguish those.

**The last avenue is owner-gated, not unavailable.** Accepting terms on a third party's site is a
consent action this lane does not take. One link, or one acceptance by the owner, closes this row.
Filed as a single owner line.

**Recorded as unverified rather than repeated as fact.** A funding document that asserts a
programme is closing, on a date nobody here could confirm, is exactly the kind of claim that
discredits the documents around it.

**Adjacent Superchain doors the same page names** (each a separate partner programme, not Optimism
Foundation): Soneium *For All*; Unichain *Infinite Hackathon*, *Open Call*, *Retro Grants*;
World Foundation *Grants* and *RFPs*. Unichain **Retro Grants** — *"for developers, content
creators and analysts with projects that show measurable impact"* — is the closest live analogue to
retro funding, and "measurable impact" is the one phrase in this whole landscape that matches what
this estate actually produces.

## Base Builder Rewards

**`builderscore.xyz` redirects to `talentprotocol.com`.** Eligibility runs on a **Builder Score**
with these properties, taken from the page:

- computed **in the browser** from public GitHub activity and onchain activity across **4 chains**;
- **no account required** — "public RPC and public APIs only";
- **open spec, open math** — "the same inputs always produce the same score";
- optionally **attested onchain via EAS on Base**, "verifiable by anyone by recomputing the score".

### The boundary that matters for this lane

Computing the score is **free, permissionless and account-free**, so it needs no owner keystroke.
**Publishing the EAS attestation is an onchain write from a wallet** — that is a keys-and-money
action and is the owner's, not this lane's. The two halves must not be run together by an agent.

### Why this one is worth the owner's attention

Builder Score is *itself* a measurement artefact built on the same principles this estate
publishes: deterministic, recomputable by a stranger, open scoring rules, attested rather than
asserted. A CSOAI score would be evidence in exactly the form we argue for elsewhere — and if the
recomputation disagrees with the published score, **that disagreement is itself a finding** worth
reporting to them.

### Not claimed here

No score has been computed, so no number appears in this file. Eligibility is not a grant, an
award, or revenue, and nothing above says we have been paid or selected.
