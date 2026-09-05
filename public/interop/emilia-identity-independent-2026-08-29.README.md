# Independent implementation report — EMILIA SCITT statement identity

Published verbatim at the request of Iman Schrock (EMILIA Protocol), 3 Sep 2026,
so the row is independently auditable rather than asserted in an email.

    file    /interop/emilia-identity-independent-2026-08-29.json
    sha256  0fc7d09ac49ffa0907e84a3eeebb4431e1ac2b6dd154967b202311eaa8bad19d
    schema  csoai.emilia-identity-independent/0.1

## What it is

One independent-implementation row over EMILIA's own frozen fixture. We consumed
the pinned JSON; we did not run `node run.standalone.mjs` and we did not import
EMILIA.

    tree    github.com/emiliaprotocol/emilia-protocol/tree/e507acdf/conformance/composition/scitt-statement-identity-v0.1
    commit  e507acdf8efbe8951cb4294801d4c440f0b86a5a
    file    vectors.reference.json
    sha256  889e410cceec75f4c0955ca9a373d4a8375c00300cbe4d2be375a559958de697

## What it does NOT claim

- **Not a GSPC card.** The file says so itself: `not_a_gspc_card: true`.
  It is not on the board, carries no axis, and moves no measurement.
- Generic RFC 9943 ES256 fixture — **not** EP-SCITT-STATEMENT-v1 authorization.
- No Transparency Service registration is claimed.
- EP receipt cases are **UNCHECKABLE**: `vectors.reference.json` carries no EP
  receipt payload, and we did not invent one.
- Checkable cases: 11 of 11 passed. That is the whole result.

## The file carries no `as_of`

An earlier draft described this report as `as_of 2026-08-29T13:54:00Z`. The bytes
do not carry that field. The date is the date of the run as recorded in
correspondence; it is not in the artefact. Rather than add a field after the fact
and change the hash, the file is published exactly as it was produced and the
discrepancy is stated here.
