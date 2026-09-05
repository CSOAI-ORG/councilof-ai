# Standards drafts — 2026-09-05

Two documents. **Both are drafts for the owner to post. Neither has been sent.**
Posting to an IETF list or to another organisation's issue tracker as CSOAI is owner-gated.

| File | Where it goes | Posted? |
|---|---|---|
| `olp-v1.0-technical-review.md` | open-trust-layer/protocol issue #17 (`olp-v1.0-review-1`) | **NO — owner posts** |
| `ietf-scitt-list-announcement.txt` | IETF SCITT WG list | **NO — owner posts** |

## Verification state of the claims inside them

Every URL cited in the review was fetched 2026-09-05 and returned 200:
`/api/state`, `/root.json`, `/signed/card_index.json`, `/api/gspc`, `/api/corrections`,
`/signed/HOW-TO-VERIFY.md`, `/signed/verify-card.mjs`, plus
`/interop/cards/aibom/cyclonedx.json`.

OLP claims cite file and section at the **frozen** commit
`877493826d673ccf9bb94e7b6b113b35141ad220`, which is the review target issue #17 names — not
`main`. Issue #17 is `closed`; the review is still the thing that was asked for, and the
promotion gate it describes remains open until findings are dispositioned.

The I-D exists and is reachable: the Datatracker page and
`https://www.ietf.org/archive/id/draft-templeman-scitt-framing-space-00.txt` both returned 200,
and the title in the announcement is copied verbatim from the draft's own header.

## What the review does NOT do

It asserts no conformance determination about OLP, claims no endorsement, and charges nothing.
Two findings are raised (anchor scope; `content_id` is not authorization) and two places are
recorded where **OLP is ahead of us** and we intend to move — that is not politeness, it is the
honest reading of §20.4 and §31.4.
