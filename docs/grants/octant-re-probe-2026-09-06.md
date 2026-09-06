# Octant — the row the map deferred, re-probed with a browser

**MONETISATION-MAP row 13:** *"Octant v2 (Golem) — docs JS-gated today (E17, E33) — unverified …
re-probe with a browser."* Done.

## The domain in the row does not exist

`docs.octant.build` → **`DNS_PROBE_FINISHED_NXDOMAIN`**. Not JS-gated, not slow: **no such host.**

The live product is at **`octant.app`** (`https://octant.app` → `/dashboard/projects`, title
*Octant App*). Anyone re-probing `.build` will keep concluding "unverified" forever.

## Why a text extractor reported it empty

`document.querySelector('main')` returns **null** on `octant.app` — `mainChars: 0` against
`bodyChars: 5391`. **The page has no `<main>` element at all**, so any extractor scoped to `<main>`
returns nothing and the site looks JS-gated when it is simply rendered elsewhere in the DOM.

That is the third time today this exact instrument produced a wrong negative — the Atlas sunset
banner, the Talent Protocol acquisition line, and now this whole site.

## What Octant actually is, from the page

| Fact | Verbatim / measured |
|---|---|
| Model | *"Quadratic funding for public goods. Your contribution, amplified by the community."* |
| Operator | *"© 2026 Octant, a Golem Foundation project, launched in 2023"* |
| Current round | **Epoch 12, FINALIZED — 25 projects, 200 matching pool** |
| Most funded in that epoch | The Tor Project |
| How a **funder** participates | *"Lock your Dragon token (GLM) & earn individual rewards. These rewards can be claimed or used as your voting power in future funding rounds."* |

## What this means for us

- **Being funded is round-based and narrow** — 25 projects in Epoch 12, not an open form. The entry
  question is *how a project enters an epoch*, which is not answered on the landing page.
- **Participating as a funder requires locking GLM.** That is a token action from a wallet:
  **owner-gated**, never this lane's. It is also not a route to being funded — it buys voting power,
  not eligibility.
- **Row 13's score of 2 looks right**, but for a better-evidenced reason than "unverified": the
  programme is live and real, the door is narrow and round-gated, and the only mechanism on the
  landing page is one we cannot use without the owner's keys.

## Two domains this lane could not reach

`base.org/builders` and `docs.octant.app` both returned **"Navigation to this domain is not
allowed"** — a permission boundary in this environment, **not** a fact about those sites. Recorded
as unreached rather than as 404 or dead, because those are different claims and only one of them is
true.
