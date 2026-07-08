# Domain resolution handoff for M4 (2026-07-08)

Ran a scripted, read-only pass (Clearbit autocomplete API + fuzzy-name matching) against the 1,913
tier-9 (SEC-sourced) leads in `sovereign-charters/csoai_leads.db` that had no `domain` set. This
only ever read a snapshot of the DB into memory and wrote to `/tmp` -- never touched the live `.db`
file (see the ownership-correction note in `AGENT_COORDINATION.md` for why).

**Result: 1,535/1,913 resolved (80.3%), split into two confidence tiers -- do not treat them the
same:**

## `domain_resolution_resolved_2026-07-08.csv` — 1,279 rows, HIGH CONFIDENCE
Matched via a full-name query against Clearbit with score >=0.85, or a known manual alias
(Meta/Alphabet/JPMorgan Chase/Berkshire Hathaway). Spot-checked several at random -- all correct.
Safe to merge directly.

## `domain_resolution_NEEDS_VERIFICATION_2026-07-08.csv` — 256 rows, LOW CONFIDENCE, CONTAINS
## CONFIRMED ERRORS -- do not merge without spot-checking each one
These matched only on the first significant word of the cleaned company name (e.g. "Southern
Copper Corp" queried as just "Southern"), because the full name returned no Clearbit hit above
threshold. Spot-checking this batch (before handoff, not after) found real wrong matches:
- `Boyd Group Services Inc.` -> `boydcorp.com` (WRONG -- that's Boyd Corp, an unrelated thermal-
  management manufacturer; correct is `boydgroup.com`, confirmed via web_search)
- `Southern Copper Corp` -> `southerncompany.com` (WRONG -- that's Southern Company, an unrelated
  utility holding company)
- `Vertex Pharmaceuticals Inc` -> `vertexinc.com` (WRONG -- that's Vertex Inc, a tax-software
  company; correct is `vrtx.com`)
- `Automatic Data Processing Inc` -> `automatic.com` (WRONG -- correct is `adp.com`)
- `Enterprise Products Partners L.P.` -> `enterprise.com` (WRONG -- that's Enterprise Rent-A-Car)

One correct one for contrast: `United Therapeutics Corp` -> `unither.com` looked wrong on sight but
web_search confirmed it's genuinely correct.

**Recommendation: treat every row in the NEEDS_VERIFICATION file as a starting guess, not a fact.**
At minimum, re-run each through a single Clearbit full-name query (not the truncated short-word
fallback) or a direct web_search before writing to `report_json`. Given the ~5/256 error rate found
in a spot-check of ~30, assume a meaningful fraction of this batch is wrong.

## 378 still fully unresolved
`domain_resolution_unresolved_2026-07-08.csv` -- Clearbit returned nothing usable for either the
full name or the short-word fallback. Includes some well-known names my cleaning/matching logic
handled poorly (Eli Lilly, Costco, Bank of America, ARM Holdings) -- these are NOT actually hard to
find, my algorithm's suffix-stripping or threshold was just too conservative. A human or a smarter
matcher would resolve most of these quickly.
