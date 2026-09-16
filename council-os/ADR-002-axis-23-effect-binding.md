# ADR-002 — slot 23: effect-binding, a declared slot

**Status:** in force from 2026-09-16. **Supersedes** ADR-001 on the slot count only; ADR-001 still
governs what MEASURED means and that both counts are derived, never typed.
**Referenced by:** `canon.json` → `ruling_ref`, `functions/api/_gspc_axes_c.ts`,
`functions/api/_gspc_types.ts` header, `public/gspc-overlays.json`.

## The ruling

Owner, 16 September 2026, verbatim: **"YES ADD AXIS 23 MCP DECLARED VS EXECUTED"**.

This closes the standing instruction in `_gspc_types.ts` ("Do not bump the board to 23"), which was
written about ARC-AGI. ARC-AGI is still not an axis. That instruction no longer bars a *declared*
slot for a different construct.

## What the slot is

`effect-binding`, kind `declared-slot`, status `UNMEASURED`, `n: 0`, no bank, no fleet, no leader.

The construct: a tool-call server (MCP today) checks the scope of the tool call the agent
**declared**, passes it, then interpolates a caller-supplied argument into the request it
**executes** — so the request that reaches the backend targets a different operation, under the
same credential, outside the declared scope, invisible to the check that passed. An attestation
signed over the declared call verifies bytes that denote a different action from the one performed.

Source: the W3C `public-agent-conformance` list, 15 September 2026. Syed Anas Mohiuddin reported the
shape in more than one independently built official MCP server (in vendor triage, unnamed). Amey
Parle's reply located where a trustworthy receipt must be produced: "at a layer the argument cannot
reach — the outbound client after path construction, a sidecar observing the wire, or the backend
itself — and it has to cover the request post-normalization, not the templated form." Neither the
payload note nor this ADR names a server.

## What changed

| where | change |
|---|---|
| `functions/api/_gspc_axes_c.ts` | new; one declared slot |
| `gspc.ts`, `state.ts`, `counters.ts`, `owasp-report.ts`, `badge.ts`, `badge/axes.json.ts` | `AXES_C` added to the concatenation at all six sites, so no endpoint reports a different count from another |
| `canon.json` | `axes_total` 22→23, `unmeasured_axes` 0→1, `public_count_contains` → "23 axis · 22 measured"; `measured_axes` and `quotable_axes` stay 22; `schema` stays `csoai.gspc-axes/0.5` |
| `public/gspc-overlays.json` | `board_slots` 23; notes now say ARC-AGI is *still* not an axis and the 23rd is effect-binding |
| `_gspc_types.ts` header | superseded, not deleted |
| `functions/adoption-loop.test.ts` | "no dead ends" invariant scoped to MEASURED slots (its own stated rationale); asserts exactly one declared slot and that it is UNMEASURED |
| `functions/badge/axes.json.test.ts` | "22 of 22" → "22 of 23" |
| `scripts/test_gspc_ready.py` | 23 / 22 / 1, and asserts the slot's kind, status and n |

Derived from the bytes on 2026-09-16: axes 23 · measured 22 · unmeasured 1 · model_fleets 14 ·
by_family gspc {axes 15, measured 14}, financial {axes 8, measured 8}.

## What did NOT change, and why

- **No schema bump.** `public/gspc-overlays.json` said a bump to 0.6 was required for ARC-AGI to
  "become a slot". 503 files pin `csoai.gspc-axes/0.5`, including every signed card in
  `public/cards/` and the signed board freeze. Declared slots under 0.5 are precedented (the board
  read "22 axis; 15 measured, 7 declared" under this schema before the 2026-08-26 sweep — see
  `client/src/lib/aguiGspcStream.test.ts`). The shape did not change; the count did.
- **`public/signed/gspc-board.signed.json` is untouched.** It is an MPC-signed historical freeze
  under `#gspc-board-22axis-2026` (`generate-signed-index.mjs` says so). Signed bytes are
  superseded, never edited. `scripts/regulatory-inventory-gate.mjs` still expects 22 axes in that
  *frozen* file, which remains true; the gate is not wired into any workflow.
- **`public/signed/board_living.json` is untouched** — signed; the living stamp covers measured
  living-stamp axes and a declared slot has no stamp.
- **No `dataset` slug.** There is no bank. Minting a slug would publish a `dataset_url` that
  404s, which `gspc.ts` calls "worse than no link".
- **Family stays `gspc`.** The type admits only `gspc | financial`. This slot's subject, once
  measured, is servers, not a model fleet — so `by_family.gspc.note` ("a model fleet answers a
  frozen bank") is now slightly loose for one slot. Recorded here rather than widened silently.

## The path to MEASURED (not done; do not report as done)

1. Instrument: a deterministic probe. For each server, one declared call inside scope with a
   crafted argument whose normalised form retargets the executed request outside scope. Record the
   declared call, the request as actually sent (post-normalisation), and the executed operation.
2. Bank: a frozen set of public MCP servers × argument vectors, `n >= 30` servers before MEASURED.
3. On first run: `kind` → `deterministic-facts`, `n_unit` "tool-call servers probed",
   `evidence_url` → the signed run, `run_attestation` per its signature state, `status` MEASURED.
4. Nothing above is scheduled. Until it runs, the slot is a published gap and nothing else.

## Typed copy that this ruling makes stale (follow-up commit, not this one)

`client/src/data/gspcInstall.ts:24` ("expect … 22 axis · 22 measured"), `client/src/data/home-faq.ts:30`,
`client/src/lib/emptySlots.ts:19`, `client/src/lib/healthInventory.ts:67`, `client/src/lib/sovExternalAudit.ts:31,129`,
`client/src/lib/nSitesFlags.ts:242`, `client/src/lib/playbookAudit.ts:84`, `client/src/pages/GspcVsAiluminate.tsx:24,93,182`,
`client/src/pages/Launch.tsx:38`, `client/src/pages/OnboardOS.tsx:85`, `DashboardFilesPane.tsx:38`, `DashboardArenaPane.tsx:713`.
Every one is a typed count that QUOTING-NUMBERS.md forbids; the fix is to quote `totals.public_count`
or remove the number, not to retype 23.
