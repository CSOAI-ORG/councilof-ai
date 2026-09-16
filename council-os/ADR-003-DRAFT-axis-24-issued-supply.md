# ADR-003 (DRAFT — NOT RULED, NOT IMPLEMENTED): axis 24, issued-supply

Status: **PROPOSED 2026-09-16. The board is unchanged at 23 axis · 22 measured until the owner rules.**
Nothing in this file has been wired into `functions/api/_gspc_axes_*.ts`, `canon.json`, or any count.

## What exists today, by bytes

Four deterministic-facts axes are already measured over one cohort — the sixteen xrpl.fi
identity-verified issuer accounts:

| axis | n | n_unit | bench |
|---|---|---|---|
| reserve-attestation | 16 | issuer accounts | ReserveFacts |
| regulatory-framework | 16 | issuer accounts | RegimeFacts |
| distribution-integrity | 16 | issuer accounts | DistributionFacts |
| custody-disclosure | 16 | issuer accounts | CustodyFacts |
| provenance-controls | 6 | issuer accounts | ChainFacts |

On 2026-09-16 the same cohort gained a fifth deterministic reading:
`public/interop/xrpl-supply-2026-09-16.json` — issued supply for all sixteen, from XRPL
public JSON-RPC `gateway_balances`, each row pinned to a validated ledger index and hash
(107023194–107023200). Instrument: `scripts/xrpl_supply_measure.py`. 16 of 16 MEASURED.

## The proposal

Add axis 24 `issued-supply`, kind `deterministic-facts`, bench `SupplyFacts`,
n 16, n_unit "issuer accounts", status MEASURED, over the same frozen cohort.

Reading: obligations of the issuing account at a named validated ledger. That is what the
account owes on the ledger — the issued supply — and nothing else. It is **not** a reserve
attestation (that is the reserve-attestation axis), not evidence of backing, not a price,
not a grade.

## Why it may deserve a slot

- It is deterministic, keyless, and re-checkable by a stranger: the ledger index and hash are
  on every row, so the same read reproduces or visibly does not.
- It measures a different property from the four existing axes, which read disclosure; this
  reads the ledger itself.
- The cohort is already frozen and already carries four axes, so nothing new is being defined
  about scope.

## Why it may not

- The estate's rule is that a slot earns its place by answering a question a reader has. If
  "how much is issued" is answered well enough inside the existing per-issuer cards, a slot
  adds a number without adding an answer.
- 23 → 24 cascades: `canon.json`, the derived counts, `facts-gate` (which compares typed counts
  against live), the badge, `board.svg` fixtures, `llms*.txt`, the count sentence on every
  surface, and the ADR-002 ruling text. That cost is real and should be paid once, deliberately.

## If ruled IN, the work is

1. `functions/api/_gspc_axes_*.ts`: one AxisScore, kind deterministic-facts, status MEASURED,
   n 16, evidence pointing at the dated artifact and its OTS proof.
2. `canon.json`: axes_total 24, measured_axes 23, public_count "24 axis · 23 measured",
   ruling_ref ADR-003.
3. Re-run `scripts/facts-gate.mjs` against a fresh dist and sweep any typed 23 the same way
   16 Sep swept the typed 22 (see `facts-sweep-typed-counts-16sep`).
4. Re-capture the badge fixture; update `board.svg` expectations; regenerate llms from live
   **after** the deploy, never before.

## If ruled OUT

The artifact stays published, keyless and stamped, with `writes_board: false` — which is what
it says today. Nothing changes.

**Owner: one line. "Axis 24 in" or "axis 24 out".**
