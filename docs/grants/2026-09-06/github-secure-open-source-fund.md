# GitHub Secure Open Source Fund — 06 Sep 2026

Page: https://github.com/open-source/github-secure-open-source-fund (resources.github.com 308s there).
Read 06 Sep: "Application status: open on a rolling basis." Money type: USD, **$10,000 per project**
paid $6,000 during the 3-week programme, $2,000 at 6 months, $2,000 at 12 months. Application: a
Microsoft Forms link on that page (forms.cloud.microsoft …). No closing date shown.

## Eligibility vs us (page text → our bytes)
| Requirement | Us |
|---|---|
| current maintainer, solo or team ≤3 | sole maintainer |
| 18+, active GitHub profile | CSOAI-ORG user account; 51 distinct commit days in the last 90 (05 Sep FACTS) |
| region supported by GitHub Sponsors | UK — and the Sponsors profile already exists (02 Sep) |
| not a GitHub employee | correct |
| clear open-source licence | repo MIT; packages Apache-2.0; data CC-BY-4.0 |
| "demonstrate community adoption" | **weak** — 0 third-party dependents (deps.dev); 138 npm + 198 PyPI downloads last month; 330 servers in the official MCP registry; one entry on mcpservers.org. State these numbers; do not inflate |
| 15 hours over 3 weeks, Pacific-time sessions | owner's calendar |

## Form answers (short; the form is short)
- **Project** — councilof-ai (https://github.com/CSOAI-ORG/councilof-ai): the GSPC measurement board, the
  Ed25519 card signer, the public Merkle root with a Rekor witness, and the free verifier.
- **Why security funding** — one signing key, one maintainer, a documented tree-shape caveat (CVE-2012-2459
  class, closed by `card_count` in the signed preimage — see `root.json.tree_caveat`), a placeholder-signature
  incident on 05 Sep in the public corrections ledger. The programme's threat-modelling and supply-chain
  sessions apply directly; the SBOM producer is 12 days stale (OWNER-ASKS "UNCLAIMED LANE").
- **What we will do with it** — key-rotation rehearsal, signed releases for both packages, a refreshed
  SBOM gate, and the public-root v2 domain-separation change.
- **Adoption** — the numbers above, verbatim.

## What we will NOT claim
Certification, users beyond the download counts, or that the board is "secure" — it is measured and
publicly corrected.

## Owner path
Open the page → "Submit an application" → Microsoft Form (owner identity). One sitting.
Strengthen first, if there is an hour: finish the OpenSSF Best Practices badge project
(https://www.bestpractices.dev/ — OAuth already authorised, project not yet created; HUNT §A).
