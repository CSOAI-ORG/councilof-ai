# Sovereign Tech Fund — delta to the 05 Sep pack (06 Sep 2026)

Full application text: `docs/grants/2026-09-05/sovereign-tech-fund.md` (question order of the PDF form).
This file records only what changed in a day and what to paste over.

## Status re-read 06 Sep
- https://www.sovereign.tech/programs/fund (curl; WebFetch 403): "Applications are accepted exclusively
  through our application platform"; cost "must exceed €50,000 (current minimum)"; no other public funding
  for the same work; OSI/FSF code licences, CC without NC/ND for docs. **Still OPEN, rolling.**
- Standards network (closed 19 May 2026) and Fellowship (closed 6 Apr 2026) are separate; calendar 2027.

## Numbers to overwrite before pasting (all read 06 Sep)
| Field in the 05 Sep text | 05 Sep | 06 Sep | Source |
|---|---|---|---|
| cards under the signed root | 168 | **166** (as_of 2026-09-06T04:29:27Z) | https://councilof.ai/root.json |
| board lid | unchanged | "22 axes measured · 14 model fleets · 3 public leader scores · 8 fact runs · TIE is TIE · not a certificate." | https://councilof.ai/api/gspc |
| "1 distinct non-self x402 payer" | 1 | **0** — one_number is 0; the first non-zero settle is a self-settlement | `docs/product/SETTLED-DOORS-2026-09-06.md`; https://councilof.ai/api/revenue |
| third-party dependents of the packages | "no known" | **0** (deps.dev `dependentCount 0`); downloads 138 npm / 198 PyPI last month | E9, E11 |
| IETF | draft-templeman-scitt-framing-space-00 | unchanged; expires 2027-03-09 | https://datatracker.ietf.org/doc/draft-templeman-scitt-framing-space/ |
| new evidence to add under "Activities" | — | buyer-side x402 census: 316 hosts, 100 delivered, 213 refused (CC-BY dataset, PR #1589) | `docs/product/x402-settlement-census-2026-09-06.summary.json` |

## Prevalence — say it plainly
The scored criterion we are weakest on. Write: "Zero third-party packages depend on csoai-gspc or
csoai-gspc-mcp today (deps.dev, 06 Sep 2026). Prevalence would come from the format, not the package:
the public-root and card formats are published in 372 interchange formats and one MCP registry entry."
Never pad with hub-cell counts — those are third-party models we measured, not adopters.

## What we will NOT claim
Certification, regulator endorsement, customers, revenue, or that any card is legal evidence.

## Owner path
1. https://apply.sovereign.tech → create account (password; no OAuth was visible through the JS challenge).
2. Paste the 05 Sep text with the table above applied; the form's own word limits govern.
3. Submit; ~10 weeks to a first reply. Record the confirmation in `docs/grants/grants.csv`.
