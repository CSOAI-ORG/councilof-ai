# Hive Override Topology — who acts, who votes, who can overrule (2026-07-18)

The governance rule for the King/Queens/Generals/Council hive, pinned BEFORE the routing is built.
This is the anti-tyranny / anti-single-point-of-failure design — consistent with BFT quorum,
escalate-don't-average, care-floor-can-stop, and owner-gated-even-for-the-top (all on disk).

## Roles
- **12 Generals = ACT.** Principle-roles that execute/route/propose their piece. They act; they do NOT rule.
- **Queens = INTEGRATE a family.** Each queen owns a technique-family hive, integrates its specialists' output.
- **33-body Council = VOTE / RATIFY.** The BFT quorum body. (NOTE: the DRUM consensus council on disk is
  30 entities, f=9, quorum=21; the '33' is the CSOAI+33-industry-hives L3 trust-layer count — DECIDE which
  body is the ratifier for hive routing, and use its real quorum. Do not conflate 30 and 33.)
- **King = COORDINATE / INTEGRATE under ratification.** Assembles the whole; bound BY the council + care-floor,
  not above them.

## The override rule (the key decision)
- **Override is by QUORUM, not by rank.** A general who disagrees with a queen RAISES A FLAG (triggers review);
  the queen is overruled ONLY if the ratifying body reaches quorum against her. One general CANNOT unilaterally
  overrule a queen — that would be one node bypassing the vote, exactly the failure BFT exists to prevent.
- **Disagreement -> ESCALATE, never average.** General-vs-queen conflict escalates to the vote; outputs are not
  blended into a mushy middle.
- **No single node — general OR king — has unilateral override.** Even the king is bound by council + care-floor;
  owner-gated actions (money/DNS/secrets/charter-amend/deploy) stay locked even for the top.

## The ONE hard exception (protection overrides, authority does not)
- The **care-floor (0.35) and DORADO hard-stops CAN halt anything unilaterally** — but ONLY to STOP harm
  (fail-closed), NEVER to IMPOSE an action. A general/king cannot overrule a queen to DO something; the care-gate
  can overrule ANYONE to PREVENT harm. Power flows one way: it can stop, it cannot command.

## The oversight eye's place in this
sov33_oversight_eye (measure_rho + BFT quorum + care-floor) FLAGS when a queen's family is off (drift /
no-quorum / care-breach / correlated-blind). That flag routes to the COUNCIL to adjudicate — NOT to a general
to act on alone. The eye detects deviation; the vote decides; the care-floor can stop. Three separate powers,
no single one both judges and executes.

## Honest boundary
This is GOVERNANCE TOPOLOGY (who may overrule whom), not a capability claim. It makes the hive a governed body
with no tyrant node and no single point of failure — the 'safe society' model — it does not make any hive smarter.
