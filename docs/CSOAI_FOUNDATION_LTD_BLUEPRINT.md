# CSOAI Foundation + CSOAI LTD — dual-structure blueprint & independence policy
# Derived from the ARC/Ndea Business-Model Catapult playbook (2026-08-26). The single most
# transferable model, adapted + hardened to fix ARC's four conflict-of-interest gaps.
# This is EXECUTION guidance. It does NOT itself create the legal entity — that is the
# owner's/counsel's act. This is the governance pre-commitment that makes the split safe.

---

## 0. Why this structure (the ARC/Ndea lesson, distilled)
ARC Prize, Inc. (nonprofit, 3-person board) owns a neutral, free, universally-cited
measurement **standard**; Ndea (for-profit, ~$43.5M raised) captures the **commercial** upside.
The nonprofit's credibility is the moat that de-risks + markets the for-profit.

CSOAI already has the harder half of that moat — and it's better than Chollet's:
a **cryptographically signed, re-attestable, anti-gaming corrections ledger** + a did:web
trust root. That is *structural + cryptographic*, more durable than a founder's résumé.
This blueprint replicates the dual structure while fixing the four gaps ARC left exposed.

## 1. The two entities (who owns what)
| Entity | Role | Owns | Revenue model (doctrine-safe) |
|---|---|---|---|
| **CSOAI Foundation** (to be formed, UK — the neutral standard-holder) | Owns the neutral, free-forever **measurement standard** + the **corrections ledger** + the **methodology**. Neutral by construction. | the standard, the ledger, the methodology, the did:web trust root, CC-BY-4.0 data | none (grants, consortium-type dues, external prize sponsorships — never from the measured) |
| **CSOAI LTD** (Companies House #16939677, exists) | The commercial arm. Sells metered workflow, scale, assurance, data/subscription. | the product surfaces, SDK/CLI (licenced), metered assurance, data feeds | subscriptions (Gartner/MSCI), data licensing (Morningstar/Verisk), assurance workflow (BitSight model) |

**Hard boundary:** the Foundation owns the **signed measurement**; the LTD sells **workflow,
scale, assurance, and data around it** — never the measurement verdict itself as a product,
never a grade, never a certification mark. (This is the "we measure, we never certify" wall.)

## 2. The independence policy — STRICTLY STRONGER than ARC's (fixes ARC's 4 gaps)

### Gap 1: ARC's COI covers "labs whose models we test," not the founders' own lab competing.
**CSOAI fix (binding):** the COI policy covers **both** the parties we **measure** AND the
**Foundation's own affiliated commercial arm (CSOAI LTD)**. The LTD is a **first-class
conflicted party**: it may not receive privileged access to any private/semi-private
measurement data, may not influence a methodology, and a Foundation board member/employee
who is also an LTD principal **recuses** from any decision about testing or publishing the
result of a subject in which the LTD has a commercial interest.

### Gap 2: Ndea is simultaneously the nonprofit's largest donor AND controls its 3-person board.
**CSOAI fix (binding):** no single funder (including CSOAI LTD or its principals) may exceed
**~25% of Foundation funding** without triggering independent-oversight review. All funding
sources are **publicly disclosed** (donor + amount), and no funder receives preferential
access or editorial/methodological/scheduling control — the ARC clause verbatim, but extended
to internal parties.

### Gap 3: no independent directors.
**CSOAI fix (binding):** the Foundation board seats **≥1 independent director** (not an LTD
principal, not a founder) **from day one**, plus an **academic/technical oversight panel**
(the ARC analog: Gureckis/Mitchell/Misra). The panel's role is public-method + neutrality
review, with a published right to dissent on any contested result.

### Gap 4: for-profit-is-biggest-funder + controls-the-board optics.
**CSOAI fix (binding):** the Foundation's standard-setting authority is **provably firewalled**
from the LTD. The corrections ledger is **append-only + signed + publicly verifiable** (already
true), and the neutrality is enforced by *bytes, not promises*: the reconciliation gate
(`scripts/facts-gate.mjs`, `signed-json-guard.mjs`) blocks any deploy that asserts a count the
signed artifact doesn't back. The ledger can't be edited by anyone — including the LTD.

## 3. "Become-the-cited-reference" sequence (the flywheel)
1. **Ship the free signed measurement + corrections ledger** (live; 15 entries, append-only, signed).
2. **Get cited** in AI model cards / vendor disclosures the way ARC-AGI and MLPerf are. The
   citeable artifact is the signed card + did:web-resolvable key + the methodology.
3. **Land a government/standards channel** — the CSOAI analog of ARC→NIST CAISI / MLCommons→
   AISI. (UK AISI / NIST CAISI are the targets; see the grants dossier.)
4. **Only then** meter assurance/scale (the LTD's job).

## 4. Doctrine-safe revenue engines (adopt) vs off-doctrine (never)
**Adopt:** subscriptions/licensing (MSCI 53.5% op margin — recurring, 90%+ retention is the
target) · data licensing (Morningstar/Verisk) · consortium membership dues (MLCommons 501(c)(6)) ·
metered assurance workflow (BitSight subscription model) · externally-funded prize (XPRIZE /
Vesuvius model — sponsor's balance sheet, not ours, with ARC's open-method requirement).

**NEVER (off-doctrine, hard walls):** issuer-pays credit ratings (Moody's/S&P — the conflict) ·
formal certification/accreditation marks (UL) · any tokenization · charging the entity we measure.

## 5. The externally-sponsored signed measurement prize (marketing + authority)
Run it **XPRIZE/Vesuvius-style**: the purse is an **external sponsor's**, not ours. Non-cash
value = standard-setting authority + open-source/open-method requirement (ARC's rule: open-source
under CC0/MIT-0 BEFORE receiving private-eval scores). Every result is signed; signing every
result reinforces the doctrine. (This is a candidate for the DSIT £11M fund / a sponsor.)

## 6. Exit path (aspirational, not promised)
Public template = **MSCI/Morningstar/Gartner** (recurring subscription/licensing measurement, 50%+
margins). Nearer realistic exit = **acquisition by Moody's/S&P/MSCI/BitSight/Vanta-type** buying a
neutral, verifiable AI-governance measurement layer. Neither is a commitment; both require the
be-the-cited-reference flywheel to complete first.

## 7. What to do first (owner + legal, not me)
1. Form **CSOAI Foundation** (UK) + seat ≥1 independent director + an oversight panel.
2. Adopt this independence policy (COI covers internal LTD party; <~25% single-funder cap;
   public funding disclosure).
3. Counsel review (the Foundation's charity/CIC status + the LTD's licence of the SDK/ledger).
4. Keep the LTD as the commercial entity; meter only workflow/scale/assurance.
5. **Benchmarks to change course:** if adoption stalls (~24 months, no major-lab/regulator
   citation) → pivot from reference-standard to a narrower paid-assurance product; if a single
   commercial funder exceeds ~25% → add independent oversight before accepting more.

## 8. Ownership + boundary (honest)
This document is a governance pre-commitment and execution guidance. It does **not** form the
legal entity, spend money, or commit the company. Forming the Foundation + seating independent
directors are **owner/counsel** acts. What I CAN do (and have done) is make the neutrality
enforceable by bytes: the signed corrections ledger, the did:web trust root, the reconciliation +
json guards, and this policy — so the dual structure is safe to stand up.
