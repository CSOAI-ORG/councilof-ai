# IP REGISTER — CSOAI (2026-09-05)

> Source: Inngot Goldseam profile **MLKX-CDVI** (15/08/2026 15:39) —
> `Inngot-Goldseam-MLKX-CDVI-Council-of-AI-signed-measurement-&-verification-platform.pdf`
> plus the trade-secrets policy (`.gitignore`ed catalogue) and the estate's own state.
> Draft for the owner. Nothing here requests registration; every line is status + gap + owner action.

## What we protect, and how

| Asset | What it is | How protected | Status |
|---|---|---|---|
| **`csoai` signed-measurement spine** | the measurement engine | Apache-2.0 code + the measurement, not certification doctrine; audit-grade signatures make the METHOD the moat, not the code | **PUBLISHED (PyPI) as `csoai`.** This row said `csoai-core` until 2026-09-05; `pypi.org/pypi/csoai-core/json` returns **404** and never resolved. `csoai` returns 200. The Inngot profile MLKX-CDVI carries the same wrong name and needs the same correction. |
| **Signed measurement-card format** | compact card (Ed25519; **OTS is planned, NOT anchoring** — see note below), paired signed/unsigned J-Space records | Method + know-how (secret) — not patented (OIN 2.0 + LOT Network run on defensive, not blocking, posture) | SECRET + OIN/LOT active |
| **GSPC axis harness + Wilson-interval issuance stats** | the 22-axis measurement methodology (profile says 14-axis; live estate is 22 — the register notes growth; neither should be quoted as the other) | Journal-style methodology (Zenodo DOI `10.5281/zenodo.21991104`) + published refutations (9) | PUBLIC + citable |
| **Data assets** | board_v2 (~15,580 rows), GovBench item bank, corpus-watch drift corpus, honey dataset (2,693 signed rows) | UK/EU database right (substantial-selection assertions already on file; facts quotable with attribution, substantial extraction licensed) | DATABASE RIGHT asserted |
| **Trade secrets** | held-out evaluation item banks (anti-overfit) — contents never disclosed | Private catalogue policy (`.gitignore`d) — the crown-jewel inventory is never committed to public repos | SECRET (policy enforced by repo guard) |
| **Trade marks** | COUNCIL OF AI (4 classes), MEOK (2 classes) | UK TM applications in preparation | ⚠ **CRITICAL DATE: TM3 filing — 21 Sep 2026** (owner action NOW) |
| **Research** | **54 Zenodo records** (`q=csoai`). This row said **3** until 2026-09-05, then briefly **44** — see the correction note below; 44 was too narrow. `q=GSPC` returns 147 and is too broad to quote. | DOI + public records | PUBLISHED |
| **Domains** | csoai.org, councilof.ai | DNS ownership + records | HELD |
| **Registry** | CSOAI LTD, GB, Companies House 16939677 | Companies House filings | HELD |

## Corrections applied 2026-09-05 — three claims in this register did not survive a probe

Each was checked against a live URL, not against the Inngot profile that supplied it.

| Claim as written | Probe | Now |
|---|---|---|
| `csoai-core` … **PUBLISHED (PyPI)** | `curl -o /dev/null -w '%{http_code}' https://pypi.org/pypi/csoai-core/json` → **404** (`csoai` → **200**) | renamed to `csoai` |
| card format is **"Ed25519 + OTS anchoring"** | `curl -s https://councilof.ai/root.json \| grep -ci 'ots\|opentimestamps\|rekor\|anchor'` → **0** | **OTS marked planned, not anchoring** |
| **3** DOI-registered Zenodo papers | `curl -s 'https://zenodo.org/api/records?q=csoai&size=1' \| jq .hits.total` → **54** | corrected to **54** (see below) |

**A correction to my own correction, 2026-09-06.** The first pass moved this row from 3 to **44**,
using `creators.name:"Templeman"` on the reasoning that a creator query is stricter than a keyword
query. Stricter, and wrong. Measured:

| query | hits |
|---|---|
| `q=csoai` | **54** |
| `creators.name:"Templeman"` | 44 |
| `creators.name:"CSOAI"` | **15** |
| `creators.name:"Council of AI"` | **11** |

Records deposited under the **company** name rather than the founder's are ours too, and a
Templeman-only query drops them. The three creator spellings sum to 70 against 54 total, so they
overlap — but the direction is unambiguous: 44 undercounts. **54 is the figure to quote.**

The lesson is narrower than "use the broad query": a stricter filter is not automatically a more
honest number. It is more honest only when the thing being excluded is genuinely not yours.

**The OTS row is the one that mattered.** This register is an input to
`docs/company/VALUATION-2026-09-05.md` and to the Inngot IP valuation, and both are shown to
funders. Asserting an anchoring rail that has issued nothing is a different class of error from
the same words on a marketing page.

It was also already contradicted by our own published surfaces: `client/src/data/facts.json`
lists **3** live anchors and names Bitcoin OpenTimestamps in its `excluded` field as *"stamped,
not anchored"*, and `/.well-known/anchor-posture.json` publishes the root as
`SIGNED_NOT_ANCHORED`. The register was the last place still saying otherwise.

**Two ways to close it, and one is free:** anchor the root — OTS calendars cost nothing and the
sentence becomes true — or strike the words. It must not stay asserted.

**Not corrected here, flagged upstream:** the Inngot profile MLKX-CDVI (15/08/2026) carries all
three errors at source, and its page 3 *Registered Rights* section prints *"You have selected
that you have statutory rights but haven't inserted the necessary data."* — it asserts statutory
rights and records none. Only the owner can edit that profile.

## Gaps (what is NOT protected yet)

1. **TM3 filing pending — deadline 21 Sep 2026.** COUNCIL OF AI + MEOK applications are in "preparation"; the filing window closes 21 Sep. Owner action: file TM3 (UK IPO) before the date, both marks.
2. **ORCID + authorship spine** — the Zenodo papers are not all linked to an ORCID iD; the method-citation spine is weaker than it should be. Owner action: register/or link ORCID (nicholas@csoai.org), attach DOIs.
3. **Wikidata identifiers** — GSPC + Council of AI have no Wikidata QIDs; research indexes (Dimensions/OpenAlex) find the DOIs, not the organisation entity. Owner action: create/update Wikidata items + identifier links.
4. **Lab affiliation / method-naming** — the GSPC methodology has no official standard-body affiliation yet; BSI ART/1 seat pack exists (fetches EU AI Act harmonised standards). Owner action (agent-doable): submit the ART/1 application.
5. **EAS schema** — attestation contract still STAGED (no EAS key); the compliance-pact v1 template + test vector exist but nothing is minted. STAGED everywhere.
6. **Employee/director IP assignment + domain registrant** — check the directors' service/assignment papers are on file (Inngot profile lists these categories as claimed; confirm the documents exist in practice).
7. **OIN 2.0 grant-back** — any future patent that is Linux-kernel-adjacent requires the mandatory OIN scope check + Limitation Election or conscious license-back (see root AGENTS.md). Run before any filing.

## Owner actions with dates (draft queue)

| Date | Action | Status |
|---|---|---|
| **BY 21 Sep 2026** | File UK TM3: COUNCIL OF AI (4 classes) + MEOK (2 classes) | ⚠ URGENT |
| This month | Link Zenodo DOIs to ORCID; create Wikidata QIDs (GSPC, CSOAI) | draft |
| This month | Submit BSI ART/1 seat application (pack staged in SOVOS) | draft |
| Before any patent | OIN Linux-System scope check (documented decision) | mandatory process |
| When EAS key exists | Mint compliance-pact.v1 test vector (STAGED until then) | STAGED |

## Register hygiene
- Never commit the private trade-secret catalogue (repo `.gitignore` enforces; the 2026-09-05 incident where two trade-secrets doors tried to enter public/ was caught by the same guard — record in C-ledger).
- Numbers quoted from the Inngot profile (14-axis, 15,580 rows, 2,693 signed rows) were true at 15/08/2026; the live estate may be larger. Always state the as-of when quoting to a buyer.
