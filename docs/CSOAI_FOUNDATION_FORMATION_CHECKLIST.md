# CSOAI Foundation formation checklist — owner/counsel execution map
# Companion to docs/CSOAI_FOUNDATION_LTD_BLUEPRINT.md (b83ff07d). This is the DOING list the
# owner + counsel follow. It does not itself form the entity, spend, or commit.
# Status legend: [OWNER] an act (sign/decide) · [COUNSEL] legal advice/structure · [ME] I can prep.

---

## PHASE 1 — Decide the entity form (OWNER + COUNSEL, first)
The neutral standard-holder must be a UK body that is (a) genuinely non-profit and (b) trusted
as neutral. Three realistic options — counsel picks:
| Option | Pros | Cons |
|---|---|---|
| **Charity (charitable incorporated organisation)** | clearest neutrality + public-good framing; matches "measurement standard for the public" | charitable-purposes test; trading/non-profit boundaries; regulator oversight |
| **CIC (community interest company, Ltd guarantee)** | social-purpose lock + can trade; asset lock | still a company; CIC regulator oversight |
| **Unincorporated association / limited-by-guarantee (non-corporate)** | lightest, fastest | weaker legal personhood; members' liability; audit/account filing simpler |

**Decision gate:** the Foundation must be **structurally unable** to (a) sell a measurement verdict,
(b) certify/conformity-mark, or (c) be captured by a single funder (the ~25% cap + independent
director). If the chosen form can't guarantee (a)–(c), it's ineligible.

---

## PHASE 2 — Register (OWNER + COUNSEL)
1. [COUNSEL] Draft the **constitution/governing document** incorporating: independent-director
   requirement, the COI policy (incl. the internal-LTD party as first-class conflicted), the
   ~25% single-funder cap + public funding disclosure, and the doctrine wall (measure, never
   certify; no conformity marks; no public $ prices for a verdict).
2. [OWNER] **Register** with Companies House (or Charity Commission / CIC Regulator per Phase 1).
3. [COUNSEL] Register with the relevant regulator + (if charity) confirm charitable purposes.
4. [OWNER] Seat **≥1 independent director** + constitute the **academic/technical oversight panel**.

---

## PHASE 3 — Assign assets (OWNER + COUNSEL)
The Foundation owns the neutral core; the LTD owns commercial. Assign via an **IP assignment /
licence**:
| Asset | Owner (suggested) |
|---|---|
| The GSPC measurement **methodology** | **Foundation** |
| The **corrections ledger** (append-only, signed) | **Foundation** |
| The **did:web trust root** + public signing key | **Foundation** (neutral trust) |
| CC-BY-4.0 measurement **data** | **Foundation** (public good) |
| The product surfaces, SDK, CLI, widget | **LTD** (licenced to deploy) |
| Metered assurance / data feeds / subscriptions | **LTD** |

**Hard rule:** the LTD **licences** the SDK/products from the Foundation; it never owns the
measurement standard or the ledger. Ensure **arm's-length pricing + no preferential access**.

---

## PHASE 4 — Independence hardening (OWNER)
1. Publish the **COI policy** publicly (stronger than ARC's).
2. Publish **all funding sources** (donor + amount) — including the LTD's own, if any.
3. **Firewall the ledger** (already done by bytes): confirm `signed-json-guard.mjs` +
   `facts-gate.mjs` run in CI so a deploy can't assert a count the signed artifact doesn't back.
4. Confirm the **ledger is append-only + signed + publicly verifiable** (it is: 15 entries,
   did:web-resolvable) — the neutrality is enforced cryptographically, not by promise.

---

## PHASE 5 — First public actions (OWNER + ME)
1. **Cite the standard** in AI model cards / vendor disclosures (the ARC-AGI→cited-reference play).
2. **Land a government/standards channel** — UK AISI / NIST CAISI analog.
3. **Run an externally-funded signed measurement prize** (XPRIZE/Vesuvius model) — sponsor's
   purse, open-method requirement, every result signed.
4. [ME] These are all prepped (Blueprint Integrity Report + methodology + signed cards).
   The deploy is blocked on CF auth (owner step) — unblock then this goes live.

---

## NO-GO list (off-doctrine, never do)
Issuer-pays credit ratings · formal certification/accreditation marks · any tokenization ·
charging the entity we measure · a funder >~25% without independent oversight · allowing the
LTD (or a founder) privileged access to private/semi-private measurement data.

## Benchmarks to change course
- Adoption stalls (~24 months, no major-lab/regulator citation) → pivot to a narrower paid-assurance product.
- A single commercial funder exceeds ~25% → add independent oversight before accepting more.

## Honest boundary
This is an execution map. Registering the entity, seating directors, and assigning IP are
OWNER/counsel acts requiring signatures, money, and legal opinion — none of which I can do.
What I have already done is make the neutrality enforceable by bytes (signed ledger, guards,
did:web root) and written this + the blueprint so the owner can execute cleanly.
