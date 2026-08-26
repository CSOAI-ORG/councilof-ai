# How to cite / reference the Council of AI measurement standard
# The be-the-cited-reference mechanism (ARC-AGI / MLCommons playbook). A standards body,
# journalist, or AI-lab model card needs a canonical way to cite the measurement standard +
# attach it to a signed, verifiable artifact. This is that guide.

---

## The reference (copy-paste)

> **Council of AI (CSOAI Ltd, UK #16939677).** *GSPC measurement standard — deterministic,
> signed, stranger-verifiable.* Version 0.1, first published 2026. zenodo.org/doi/10.5281/zenodo.21973003
> (methodology). Independent governance measurement — **measurement, not certification.**

## Version + the signed artifact each citation resolves to

| What you cite | The artifact | Verify |
|---|---|---|
| The methodology | `https://councilof.ai/api/methodology` (signed) | recompute content_id + Ed25519 |
| The board / honest count | `https://councilof.ai/api/gspc` (totals.public_count, derived) | `public_count` is derived, never typed |
| The corrections ledger | `https://councilof.ai/api/corrections` (append-only, signed) | 15 entries, appended never edited |
| A single axis result | `https://councilof.ai/api/measure-axis?axis=<x>` | Wilson 95% CI + separation |
| A model card | `https://councilof.ai/api/badge?axis=<x>` (SVG) | the badge points home to /gspc-verify |
| The trust root | `https://councilof.ai/.well-known/did.json` (did:web) | resolve the DID → key → check signature |

## Three honest states (never overclaim)

- **measured** — status MEASURED + separation determined → the number has a real interval.
- **untested** — status MEASURED but separation UNTESTED → honest; the lead is not a proven advantage.
- **unmeasured** — no measurement → renders grey, never a fabricated score.

**Count grammar:** the board renders `public_count` derived from measured/quotable — never a typed
slot count. A citation must quote that derived figure, never write a number the signed artifact
doesn't back.

## The boundaries (bind every citation)

- **measurement, not certification** — never "certified", never a conformity mark.
- **an attestation is an opinion/measurement, never a token, ownership, or claim.**
- **regulators free forever (R8)**; the number is never sold; a grade is never a currency.
- **agents = model + harness.** Never "every problem of every AI company" — say "systematic
  signed coverage of the public enforcement record."

## Verifiable, not asserted

Every figure in any citation resolves to a signed card a stranger recomputes: content_id = SHA-256
of the canonical body; signature = Ed25519 under the card's embedded key; the did:web root proves
the issuer. If the card doesn't verify, the citation must not be used. That is the point of citing a
measurement standard rather than a blog post.

## Off-doctrine (never cite as us)

Issuer-pays credit ratings · formal certification/accreditation marks · any token · a score sold as
a grade · a "verified" claim on a card that does not recompute. These are the comparisons we are not.

---

*Companion to `docs/CSOAI_FOUNDATION_LTD_BLUEPRINT.md` (structure) and the signed endpoints above.
This guide exists so the standard is citable — the flywheel step that turns measurement into the
cited reference (ARC-AGI→standard).*
