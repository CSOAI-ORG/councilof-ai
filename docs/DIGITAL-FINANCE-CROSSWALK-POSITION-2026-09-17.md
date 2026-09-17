# The digital-finance crosswalk: what is verified, what is not, and what to do in the next 33 days

17 September 2026. This records the position after checking the plan's factual claims against
primary sources, and after building the harness. It exists so that nobody has to take the strategy
on trust, including us.

## What I checked, and what changed

The plan arrived with citations. I retrieved each one rather than relying on it. Four held, one
needed correcting, and one could not be retrieved at all.

| Claim | Outcome |
|---|---|
| SEC Regulation Crypto Assets, comments close 20 Oct 2026 | **Confirmed.** File S7-2026-27, published 21 Aug 2026, the page carries a Public Comments Due field reading Oct. 20, 2026. |
| SEC/CFTC joint interpretation operative | **Confirmed.** Releases 33-11412 and 34-105020, File S7-2026-09, effective on publication 23 Mar 2026. Covers digital commodities, collectibles, tools, stablecoins and digital securities, and treats protocol mining, staking, wrapping and airdrops as distinct. |
| CFTC Innovation Task Force covers crypto and AI | **Confirmed, and it is the strongest fit we have.** Press release 9210-26, 10 Apr 2026: "crypto assets and blockchain technologies; artificial intelligence and autonomous systems; and prediction markets and event contracts". It is the only source in the crosswalk whose own mandate spans both halves of what we measure. |
| CLARITY failed to advance | **Confirmed, with a caveat about our sourcing.** The Senate cloture vote failed 49 to 50 on 15 Sep 2026, eleven short of 60, and the Senate never reached debate. We have this from press reporting, not from a roll call we retrieved, and the crosswalk row says so. |
| OSAIA SAFE contributions close 21 Sep 2026 | **Real, but not where the plan implied.** The date is stated verbatim by the Linux Foundation in its own announcement. It appears nowhere in the RFC file or on the alliance homepage. So it is the body's own deadline, published away from the artifact it governs, and we quote it that way. |
| GENIUS Act implementation | **Partly.** We retrieved the FDIC release of 7 Apr 2026 establishing a prudential framework for permitted payment stablecoin issuers. The Federal Register refused our request, so the statute text and the rule text were not retrieved, and the row carries no comment deadline because the release gives only "60 days after publication in the Federal Register" without that date. |

The one number that moved: this is **one confirmed deadline inside a month, not two of equal
weight**. The OSAIA date is four days away and the SEC date is thirty-three. Both are real. They
are not the same kind of thing: one is a voluntary RFC, the other a federal rulemaking docket.

## The harness, and why it is anchored to goals

`scripts/crosswalk_harness.py`, with sources under `measurement/crosswalk/sources/`.

CLARITY is the argument for the design. Its cloture vote failed and every goal it raises is still
live, because three other sources address those same goals and remain operative. A crosswalk
anchored to section numbers would have needed rewriting on 15 September. This one needed a state
change on one row.

Fourteen stable goals: asset classification, actor identity, jurisdiction, disclosure, custody,
transaction integrity, market integrity, customer protection, reserves and collateral, settlement,
agent authority, provenance, assurance, and change. Six sources. Every goal now has at least one
source we verified against a primary artifact; before the GENIUS row was added, two had none and
two had only unverified coverage, and the harness said so rather than quietly averaging.

Every source carries how **we** came to know it, which is a statement about our work and not about
the source's authority:

- `PRIMARY_SOURCE_FETCHED` — we retrieved the artifact ourselves.
- `PRIMARY_ARTIFACT_FETCHED_DEADLINE_FROM_SECONDARY` — we hold the artifact; a date on the row is not in it.
- `REPORTED_BY_SECONDARY_SOURCES` — no primary artifact retrieved. Anything published from such a row must say so.

Six defect rules, each proven to fire on a bad input and stay silent on a good one. A source may
not invent a goal, may not claim a fetch without naming the artifact, may not carry a deadline
without saying where the date came from, and may not leave a verification undated.

Live: `/interop/regulatory-crosswalk-2026-09-17.json`, with its OpenTimestamps proof beside it.

## What this is not

Not legal advice, not a compliance determination, and not a position on what any law should be. A
goal is a question we can gather observable evidence against. We measure and we never certify.

The plan's instinct was right on the most important point and I want to state it in our own terms:
**we do not decide what the law requires, and we do not need to.** We can measure against goals the
sources themselves raise, and publish what is observable and what is not.

## The 21 September item, and the obstacle we hit

Our contribution to the SAFE RFC is the one thing we hold that its existing issues do not cover.

Issue #4 asks a verification method to declare its fail-open modes and noise floor. Issue #10 asks
it to declare systematic mislabel classes. Issue #11 asks that preserved evidence carry an
integrity property. None of the three can see the failure we shipped: the check ran, the verdict
was well-formed, the verdict was correct, and the result was worthless because the item could not
have produced any other verdict.

The proposal is that a verification method declare its **discriminating power** — an observed
negative on the corpus with its denominator, or a designed-to-fail control that did fail. Absent
either, the result reads "not discriminating", a third state and not a pass.

Filed as issue 32. Then measured, and it does not work. Issue 32 answers HTTP 404 to a logged-out
visitor while issues 29 and 31 by other authors in the same repository answer 200, at the same
moment. Our GitHub account is restricted, so content we author anywhere is readable only by us. The
alliance publishes no email, list or forum, so GitHub is the only route they offer and it is the
one route we do not have.

The citable form is therefore published at
`/contributions/osaia-safe-discriminating-power-2026-09-17.md`, and the crosswalk row records the
obstacle as a measured fact. The GitHub ticket now carries the three-URL control, which is the
clearest evidence of the restriction we have produced.

**This is the owner's decision to make:** whether to also post the contribution from an account the
public can read, before 21 September.

## The 20 October item

The SEC docket is thirty-three days out and is the larger opportunity, because a rulemaking comment
is a permanent public record that others cite.

What we would submit is a methodology, not a political position: the goal ontology, the
verification-state discipline, and the discriminating-power requirement, offered as an answer to
the question of what observable evidence corresponds to a published proposition. We would disclose
that we are not an SEC-registered anything, that we certify nothing, and that we are commenting on
how evidence can be checked rather than on what the rule should say.

That document does not exist yet. It should be drafted well before the deadline so it can be read
by someone other than its author.

## What is genuinely open

- **Whether to join anything.** CoSAI's WS1 has confirmed in writing that it covers provenance of
  evaluation evidence including the model-to-bank-to-grader-to-measurement binding. We have asked
  whether written input is possible without membership. Joining is a spend decision and it is
  yours.
- **The GitHub restriction.** It is now blocking outward contribution, not just our own repository.
- **Whether the SWIFT tokenised-deposit profile is worth building.** Their press release refused our
  request, so we hold no primary artifact for that source, and our own SWIFT measurement is a
  separate thing from their programme.

## What I would not do

I would not build a CLARITY product. The bill did not reach debate and may not return in this form.
The goals it raises are carried by four other sources that are operative today, and the harness
already holds them.
