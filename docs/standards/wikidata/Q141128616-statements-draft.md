# DRAFT — statements to add to Wikidata Q141128616 (Council of AI)

**Status: DRAFT. Not submitted. The owner submits.**

Q141128616 already exists and carries 7 statements (legal form, HQ, country, Companies House ID,
instance-of, inception, official website). Read them yourself:

```
curl -s "https://www.wikidata.org/w/api.php?action=wbgetentities&ids=Q141128616&format=json&props=claims" \
  | jq '.entities.Q141128616.claims | keys'
```

## Why this is a draft and not an edit

Wikidata is openly editable, so this is a door we *could* open. We are not opening it. An
organisation adding statements about itself is a conflict of interest, and Wikidata's own
guidance treats autobiographical editing as something to disclose and prefer others do. Our whole
position is that a body which measures should not also be the one asserting its own record — the
same reason our own models are excluded from the public per-axis leaders on the board. Drafting
the statements with sources attached is the useful part; pressing save is not ours to do.

Every statement below carries a **reference URL (P854)** pointing at a public artifact that a
stranger can fetch without an account. A statement we cannot source that way is not listed.

## Proposed statements

| Property | Value | Reference (P854) | Verify |
|---|---|---|---|
| **P1448** official name | `CSOAI Ltd` | `https://councilof.ai/api/gspc` (`license_note` names the legal entity + company number) | `curl -s https://councilof.ai/api/gspc \| jq -r .license_note` |
| **P1813** short name | `CSOAI` | same | same |
| **P1019** web feed URL | `https://councilof.ai/feeds/corrections.xml` | the feed itself | `curl -sI https://councilof.ai/feeds/corrections.xml` |
| **P1324** source code repository | `https://github.com/CSOAI-ORG/councilof-ai` | repository is public | `curl -s -o /dev/null -w '%{http_code}' https://github.com/CSOAI-ORG/councilof-ai` |
| **P2078** user manual / documentation URL | `https://councilof.ai/signed/HOW-TO-VERIFY.md` | the verification guide | `curl -sI https://councilof.ai/signed/HOW-TO-VERIFY.md` |
| **P856** official website | already present (`https://councilof.ai`) — **no change** | — | — |

### Deliberately NOT proposed

- **P356 (DOI)** on this item. The DOI `10.5281/zenodo.21991104` belongs to a *dataset*, not to
  the organisation. Attaching a dataset's DOI to an org item states something false about what the
  identifier identifies. If a dataset item is wanted, it is a separate item with `P31` = dataset.
- **Any statement describing us as certifying, accrediting, or issuing conformity assessments.**
  We measure. There is no property whose value we could honestly set to that.
- **Any headcount, revenue, or user figure.** `/api/revenue` holds every count null until a
  receipt settles, and there is no counter behind the others. A Wikidata statement is a claim with
  a source; we have no source for those.

## Before submitting

Re-run each verify command in the table. `/feeds/corrections.xml` only exists once the feeds PR
lands — check it returns 200 before adding P1019, or the statement's own reference is a 404 on
the day it is made.
