# Correction: the Zenodo notice said "every record"; one deposit has been answering 200 all along

**CSOAI — Council for Secure and Open AI. Correction dated 28 October 2026; published
28 October 2026.** Register id GAP-REGISTER-2026-10-26#A12.

**Supersedes, never rewrites:** the `notice`, the `event` and the `rule` of
`public/interop/zenodo-status.json` as they stood at `as_of 2026-09-29T16:46Z`. All three
are reproduced verbatim below and are preserved inside the file itself under
`superseded`. The per-DOI states in that file were **right** and are not touched: 37
`UNAVAILABLE`, 2 `RESOLVED_AT_CHECK`, and the 28 October re-probe agrees with every one of
them. No DOI was changed, no signed file was edited, and no corrections-ledger entry was
added — see *Why the register id is a gap-register row* below.

---

## What the file said

`public/interop/zenodo-status.json`, `as_of 2026-09-29T16:46Z`:

> **notice:** "Zenodo record unavailable since 29 Sep 2026: **every CSOAI Zenodo record
> returns HTTP 410** (account blocked by Zenodo). Status UNCHECKABLE."

> **event:** "… Every record on the account began answering HTTP 410 ('User was blocked'),
> including records deposited weeks earlier. No appeal is on record; status UNCHECKABLE."

> **rule:** "… No surface we publish links one as available. …"

And, in the same file, thirty lines lower:

> `"doi": "10.5281/zenodo.22293340"`, `"state": "RESOLVED_AT_CHECK"`,
> `"http_status_at_check": 200`

> `"doi": "10.5281/zenodo.22344048"`, `"state": "RESOLVED_AT_CHECK"`,
> `"http_status_at_check": 200`

**The file contradicted itself, and the per-DOI rows were the true ones.** Two names for
one Zenodo record — the concept `10.5281/zenodo.22293340` and its version
`10.5281/zenodo.22344048` — were answering HTTP 200 with 8,138 bytes of metadata on the
day the "every record" sentence was published, one hour after Zenodo blocked the account.
The blanket sentence was wrong **when it was written**, not only today.

The register's A12 put it as: *"Either the block was lifted and the Council is still
publishing itself as dark, or the records were restored under a different identifier and
108 citations point at a record that no longer holds the bytes. Both states are public and
they contradict."* The measured answer is neither: **the account is still blocked**, the
methodology deposit is still gone, and **one deposit was never taken down**.

## What is wrong with it

Three separate things, and they have different fixes.

**1. "Every record returns 410" was false.** 37 of the 39 DOI entries we name answer
HTTP 410. Two answer HTTP 200. A reader of the notice would conclude the Council's
deposits were all gone, and would have no way to know that the claim-maintenance board
snapshot is still fetchable from Zenodo.

**2. "Status UNCHECKABLE" was the wrong word for the wrong reason.** The old method was
*"anonymous GET https://doi.org/10.5281/zenodo.<id>"*. From here, **doi.org answers HTTP
403 for every DOI — including a DOI that is demonstrably alive.** That is a
publisher-side client rejection, not record absence. The old method therefore could not
distinguish "the deposit is gone" from "we are being refused", and `UNCHECKABLE` was
honest about the method while being wrong about the deposits.

**3. The method itself was mis-specified in a way that hides everything.** The readable
path is `https://zenodo.org/api/records/<NUMERIC_ID>`, where the numeric id is the DOI's
last segment **minus** the `zenodo.` prefix. Probing `/api/records/zenodo.21991104`
answers **404 for every record, including records that are alive** — a malformed request
that looks exactly like a missing deposit. A method that cannot distinguish "gone" from
"you typed it wrong" cannot measure availability at all.

**4. This register's own earlier probe read a redirect as a status.** The gap register
recorded the methodology deposit as answering "HTTP 302" against a live record, and drew
from it a stated dilemma — *"Either the block was lifted and the Council is still
publishing itself as dark, or the records were restored under a different identifier."*
**The 302 was Zenodo's concept-to-version redirect**, and the record behind it answers
**410**. The dilemma was a false choice built on a first hop: the block was neither lifted
nor the records restored — the deposit is still gone, exactly as the published notice said.
The dilemma is withdrawn in the register on the same dated basis as this note.

## The fix

`scripts/probe-zenodo-status.mjs` re-probes every DOI and writes what it saw, with the
date, next to what it saw before. It is the probe the source comment
(*"re-run the probe that writes zenodo-status.json"*) always referred to and which did
not exist.

It is fail-closed in the way that matters:

- **A control is probed every run and MUST answer 200.** The control is a Zenodo record
  that is alive and is not ours (`10.5281/zenodo.3234648`). If it does not answer 200,
  the probe cannot tell "the deposits are gone" from "we cannot read Zenodo" — so
  **nothing is written** and the run exits 2. A probe with no control is a probe that
  cannot fail.
- The readable path is the numeric id; the `zenodo.` prefix is stripped, because
  sending it returns 404 for live records too.
- A status that is neither 200 nor 410 is `UNCHECKABLE`, never a zero and never a count.
- The prior notice, the prior event text and the prior method are kept **verbatim** in
  the file's `superseded` block, so the change is visible rather than silent.
- Each DOI keeps `http_status_at_prior_check` beside the new `http_status_at_check`.

## Reproduction

Against Zenodo, anonymously, no account and no appeal:

```bash
# the control: a record that is alive and is not ours
curl -sSL -o /dev/null -w '%{http_code}\n' -A 'csoai-check' https://zenodo.org/api/records/3234648
# our deposits: the numeric id, without the "zenodo." prefix
curl -sSL -o /dev/null -w '%{http_code}\n' -A 'csoai-check' https://zenodo.org/api/records/21991104
curl -sSL -o /dev/null -w '%{http_code}\n' -A 'csoai-check' https://zenodo.org/api/records/22344048
# the malformed request that looks like a missing deposit
curl -sSL -o /dev/null -w '%{http_code}\n' -A 'csoai-check' https://zenodo.org/api/records/zenodo.22344048
# doi.org, which refuses every DOI including a live one
curl -sSL -o /dev/null -w '%{http_code}\n' -A 'csoai-check' https://doi.org/10.5281/zenodo.3234648
```

Output on 28 October 2026:

```
200      control, alive, not ours
410      21991104 - the methodology deposit: gone
200      22344048 - the board snapshot: live
404      the malformed request, against a LIVE record
403      doi.org, against a record that is alive
```

**`-L` matters, and the difference is the whole point of the fourth defect below.** Without it
`curl` stops at the first hop and prints **302** for `21991104`, because Zenodo answers the
*concept* id with a redirect to its *version* id:

```
$ curl -sS -o /dev/null -w '%{http_code} -> %{redirect_url}\n' -A 'csoai-check' \
    https://zenodo.org/api/records/21991104
302 -> https://zenodo.org/api/records/21991105
$ curl -sSL -o /dev/null -w '%{http_code}\n' -A 'csoai-check' \
    https://zenodo.org/api/records/21991104
410
```

So the methodology deposit is **gone**, and the 302 is only the concept-to-version redirect on
the way to the 410. Reading a 302 as "the record is back" would have been the opposite error
to the one this note corrects. **The status of a record is the status of its FINAL hop**, which
is why the probe uses `redirect: 'follow'` and reports `final_url` beside the status.

The whole estate, re-probed by the script:

```
total_dois 39   answered_410 37   answered_200 2   answered_other 0
live: 10.5281/zenodo.22293340 -> https://zenodo.org/api/records/22344048 (8138 bytes)
      10.5281/zenodo.22344048 -> https://zenodo.org/api/records/22344048 (8138 bytes)
```

**Zero disagreements** with the per-DOI states already published on 29 September.

## What this changes, and what it does not

- **Changes:** the `notice`, the `event` and the `rule` of
  `public/interop/zenodo-status.json`, and the `as_of`. The per-DOI `state` values are
  **unchanged** — they were right.
- **Does not change:** the board's `doi_status`. `GET /api/gspc` names
  `10.5281/zenodo.21991104`, which answers **410**, so `doi_status: UNAVAILABLE` stays
  exactly as it is. The register's instruction to *"re-point `doi_status` in the board
  payload"* applies to a record that has become reachable; the DOI on the board has not.
  The notice says so in the same words.
- **Does not change:** any signed file. `public/signed/gspc-board.signed.json`,
  `board_living.json`, `gspc-measurement.json`, `public/signals/value-ledger.signed.json`
  and the two JWS agent cards embed a DOI inside signed bytes and are not rewritten; they
  are listed in `signed_files_not_edited` and the status travels beside them.
- **Does not change:** the 108 citations of the methodology DOI. The identifier is the
  permanent name; the record it points at is still gone, and the citation is still
  honest about that.
- **Does not claim:** that the live record is durable, or that the block was lifted. One
  deposit answering 200 at a point in time is a point-in-time reading. The appeal is
  still not on record and we still do not contact Zenodo from automation.

## Why the register id is a gap-register row, not a corrections-ledger id

The corrections ledger's signature covers the bytes of its entries and is re-issued by a
separate owner-gated step. Appending an entry for this correction would move signed bytes
and flip the live `/api/corrections` to STALE, and on the pod there is no re-sign path
available (`/workspace/secrets/board-sign-pod-token` is absent and no workflow runs
`sign-corrections-ledger.mjs`). **No ledger entry was added and no signed ledger byte was
moved.** The correction is carried by the dated note and by the `superseded` block inside
the file, and the register id is `GAP-REGISTER-2026-10-26#A12`.

## Pointers

- Corrected document: `public/interop/zenodo-status.json` in the `councilof-ai`
  repository — `notice`, `event`, `rule` and `as_of` recomputed; the prior three kept
  verbatim under `superseded`; the per-DOI states untouched.
- The probe: `scripts/probe-zenodo-status.mjs`, with 11 tests in
  `scripts/probe-zenodo-status.test.mjs`. Two of them exist because this work found two
  real faults: one asserts that **every** sentence the probe replaces is kept verbatim
  (the `rule` was initially rewritten without being preserved, which would have made the
  correction partly silent), and one runs the probe **twice** and asserts the original
  29 September text survives the second run (the probe was initially not idempotent, so a
  routine re-probe would have overwritten the preserved original with the previous run's
  text). Both faults were found by the tests and fixed before this note was published.
- This correction: `public/corrections/zenodo-status-2026-09-29-SUPERSEDES.md`, published
  at `corrections/zenodo-status-2026-09-29-SUPERSEDES.md`.
- Index of supersessions: `corrections/SUPERSESSIONS.md` beside this file.
- The live deposit: `https://zenodo.org/api/records/22344048`, 8,138 bytes at the check.

CSOAI measures. This corrects one of our own sentences, about our own deposits, in a file
that we published. It is not a certification, and it grades nothing.
