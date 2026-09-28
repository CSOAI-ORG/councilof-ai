# Claim maintenance — growth pass, 23 September 2026

**Registry:** [`/claims/claimreg-ai-assurance-and-settlement-2026-09-23.json`](claimreg-ai-assurance-and-settlement-2026-09-23.json)
**Specification:** <https://councilof.ai/spec/claim-maintenance/v0.1/> (CC0 1.0)
**Register:** <https://councilof.ai/api/claims/register>

This note records what was captured, what was measured, what could not be reached, and what was
deliberately left out. It states no falsity about anybody. Where a measurement differs from a
claim, the claim, the measured value, the window, the denominator and the method are published
side by side and nothing further is said.

---

## What changed

| | before | after |
|---|---|---|
| subjects in the register | 2 | 23 |
| claims | 8 | 70 |
| claims conforming to the v0.1 artifact schema | 0 | 62 |
| subjects with a scheduled next read | 0 | 21 |

The twenty-one new subjects are AI assurance and governance platforms, AI evaluation and
observability platforms, an AI underwriter, two frontier model providers, seven open-source
agent-harness and guardrail projects, two public tokenised-settlement programmes, and the
maintainer itself.

---

## The maintainer is in its own register

Section 10.6 says a maintainer SHOULD maintain its own claims in the same register, in the same
states. Until this pass it did not. Four Council of AI claims are now captured from councilof.ai
and held to exactly the standard applied to everybody else — including the rule that a figure
recomputed from our own API is our own restatement and so does not move a claim to measured.

---

## What a measurement was allowed to be

A claim moved to `CLAIM_MEASURED` only where the evidence is held by somebody other than the
claimant. Three kinds qualified:

- **a code host's record** — the licence a repository's own host detects, the text of the licence
  file, and stargazer counts across a declared comparison set. None of these is written by the
  claimant;
- **a named third party's own public record** — where a claim names another organisation, the
  measurement is whether that organisation's own site carries it: CORROBORATED with the quote, or
  NOT_FOUND with the routes searched and the reach in numbers;
- **other parties' own published pages** — for a leadership or exclusivity claim, a counterexample
  log quoting comparable claims from the other parties' own bytes.

Everything else that is quantitative became a **restatement watch** and stays `UNMEASURED`. A
figure that can only be recomputed from the claimant's own surface is the claim again, not
evidence about it (§4.6), and one dated reading is not a series. Those claims are captured weekly
with the page digest, and every revision is recorded.

---

## The open-source harness projects

Seven projects whose stated purpose is to test, trace, probe or constrain AI systems are now
subjects. Every claim was read from the project's **own repository file** — not from press
coverage, not from a list handed to anybody.

Three things are worth saying about the result.

**A scoped claim is a result, not an absence.** Several of these projects state limits on
themselves — that audit writes are best effort and telemetry proceeds anyway; that a hosted
endpoint is for evaluation only and must not be used in production; that named components are not
planned for the next major version. Those are captured on exactly the same footing as any other
claim, because a statement a publisher gains nothing by making is the most informative kind there
is.

**One priority claim arrives already hedged.** A project describes an evaluation suite as "what we
believe was the first industry-wide set" of its kind. The hedge is the publisher's own and is
recorded as written; measuring a priority claim would mean documenting a dated earlier example
from some other party's own materials, which was not done in this pass and is not implied.

**Membership is not a claim and is not in this register.** No organisation appears here, or is
implied to appear here, because of belonging to any body, alliance or programme. Membership was
not captured, not inferred and not published. The selection rule in the registry says so in the
registry's own bytes.

---

## Two licence results that need reading carefully

Ten open-source and licence claims were checked against the code host's own licence detection.
Most reported the asserted identifier. Two reported `NOASSERTION` / "Other".

**That is not a finding that anything is wrong**, and the artifacts say so in `does_not_prove`. A
host's detector reports that value for any repository whose licensing it cannot reduce to a single
SPDX identifier, which routinely includes a repository carrying a standard licence plus a second
licence for part of the tree. The opening text of each licence file is published beside the
detector result for exactly that reason — in both cases it states the split in the repository's
own words.

A third case is different again: one project claims its components are "licensed permissively",
which is a licence **category**, not an identifier. Comparing a category word with an SPDX
identifier would produce a boolean about a question the sentence never asked, so no boolean is
emitted for it. The identifier and the licence file text are published and the reading is left to
the reader.

---

## The subject we did not enter, and why

A research brief named a public AI-twin product whose owner was said to have put a 75% probability
on an AI bubble bursting during 2026 — a dated, self-made, checkable claim, which would have been
the gentlest possible demonstration of dated claim maintenance.

It was verified from primary sources before anything was captured, and it does not exist in a form
this specification can take:

- the product's own public page renders **eleven characters** of visible text to a keyless reader.
  There is no published claim on it to capture;
- the 75% figure appears in a news organisation's account of a conversation a journalist had with
  the product. That is not a statement the subject published on a surface a stranger can reach
  (§1.3), and it is a language model's output, which §4.6 names as disqualifying evidence;
- capturing a journalist's paraphrase of a model's answer and filing it as the owner's dated
  prediction would have been wrong in three separate ways at once.

Nothing was entered. The verification is the finding: a claim reported at second hand is not a
public claim, and a register that accepted one would be worth less than a register that is small.

---

## What could not be reached, with its status

| subject | surface | what came back | recorded as |
|---|---|---|---|
| Drata | `drata.com/` and `drata.com/robots.txt` | **HTTP 403** to a declared, keyless reader | SEARCH_INCONCLUSIVE — not captured, not an absence |
| Enzai | `enzai.ai/` and `www.enzai.ai/` | no transport answer from either host tried | SEARCH_INCONCLUSIVE — not captured |
| OpenAI | `openai.com/safety/` | **HTTP 403** (the site's `robots.txt` answers 200) | SEARCH_INCONCLUSIVE — not captured |
| ServiceNow (as a named third party) | its own published index | index not reachable from this host | SEARCH_INCONCLUSIVE — the claim naming it stays UNMEASURED |

None of these is an absence of anything, and none is a statement about the organisation. A page
this reader could not obtain is a fact about this reader.

Two sources — the European Central Bank's and SEBI's — refuse a TLS handshake from this host's
Python client and answer its Node client normally. That is a property of one TLS stack and not of
the network. It is recorded because a reader reproducing these digests with a different client may
meet the same wall.

---

## Dated claims, and a field the schema cannot carry yet

Three claims in this registry resolve on a known date. They are listed in the registry's
`resolution_calendar`, and the weekly watch raises each one when its date arrives — a prompt for a
person to look, not a finding and not a view about the outcome.

The date is recorded at **registry** level rather than inside each artifact, and that placement is
deliberate. The v0.1 artifact schema sets `additionalProperties: false`, and §11 makes validation
against that schema the first condition of conformance. An artifact carrying a `resolution_date`
field would therefore fail the schema its own conformance clause points at. Moving the field into
the artifact is a **v0.2 change**: §12 says a published version is never edited, and v0.1 is
published.

---

## Right of reply

A defect in any record here is a defect in this register, not in the organisation it names. Report
it to nicholas@csoai.org; corrections are published at <https://councilof.ai/api/corrections>.

A listing here is not an endorsement and it is not an accusation. It means a public page is being
read on a schedule.
