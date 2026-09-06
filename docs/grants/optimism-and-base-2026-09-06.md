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

**VERIFIED — Atlas is discontinued on 18 September 2026.** The site carries a banner, verbatim:

> Atlas will be discontinued on September 18, 2026. Please save any information you need before then.

**No successor is named anywhere on the page** — tested for *successor / instead / move to / migrate
/ replaced by*: none present. So the retro-funding door closes on 18 Sep with no forwarding address
on that site.

**How I got this wrong the first time, because it matters more than the answer.** I read the page
with a text extractor that returns the `<main>` element. The banner sits **outside `<main>`**:
`document.body.innerText` is 2358 characters, `main` is 2220 — the banner is in the 138-character
difference. I then searched the forum, found nothing, hit a consent gate on the blog, and recorded
the sunset as *unverified* — a conclusion built entirely on **not having looked at the whole page**.

The forum returning nothing was real. The blog gate was real. Neither mattered: the answer was on
the first page I loaded, in the part I never read. **An extractor that silently narrows its scope is
the same failure as a filter that silently ignores its qualifier** — it answers a question you did
not ask and does not say so.

## Base Builder Rewards

**`builderscore.xyz` redirects to `talentprotocol.com`.** Eligibility runs on a **Builder Score**
with these properties, taken from the page:

- computed **in the browser** from public GitHub activity and onchain activity across **4 chains**;
- **no account required** — "public RPC and public APIs only";
- **open spec, open math** — "the same inputs always produce the same score";
- optionally **attested onchain via EAS on Base**, "verifiable by anyone by recomputing the score".

**Re-read 2026-09-06 with `document.body.innerText`, after the Atlas banner taught me that the
`<main>` extractor hides things. It hid something here too — 204 characters, including this:**

> Talent Protocol was acquired by IPTS, with support from Protocol Labs

**The operator of Builder Score has changed hands**, and that is not a detail a funding pack can omit.

**What is live, and what is not:**

| Checked | Result |
|---|---|
| Attestations being created | **live** — leaderboard entries dated 2026-08-29 through **2026-09-05** |
| The words *league*, *weekly reward*, *rewards round*, *season* anywhere on the page | **none — 0 matches** |

So the **score and attestation system is running today**, while the **rewards programme is not
advertised on the site at all**. That is materially better than "unverified": it is *no evidence of
a live rewards league, from the operator's own homepage, following an acquisition*.

**Stated as evidence, not as a conclusion.** The absence of the word "league" on a homepage is not
proof a programme was cancelled — it may live on a sub-page, in a Farcaster channel, or under the
acquirer's brand. What can be said is that a reader arriving at the official domain today is offered
a score and an attestation, and no rewards.

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
