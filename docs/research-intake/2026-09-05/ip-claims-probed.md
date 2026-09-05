# IP claims — probed against live endpoints, 5 September 2026

**For the H5 lane, which owns `docs/ip/`.** This file does not edit that register; it audits the
claims in it and in the source Inngot profile against live URLs. Three do not survive.

Source under audit: `docs/ip/IP-REGISTER-2026-09-05.md` (H5, commit `035157dc7`) and the
**Inngot / Goldseam profile MLKX-CDVI**, 15/08/2026, which is that register's stated source.

> **Lane note.** An earlier version of this pass wrote its findings directly into
> `docs/ip/IP-REGISTER-2026-09-05.md` and overwrote H5's work. That was wrong — one lane, one
> writer. H5's file was restored untouched from `origin/master` and the findings moved here.

---

## FAIL 1 — `csoai-core` is not on PyPI

| | |
|---|---|
| Register says | *"csoai-core signed-measurement spine (PyPI published)"* … **Status: PUBLISHED (PyPI)** |
| Inngot profile says | *"csoai-core signed-measurement spine (published on PyPI)"* |
| Probed | `https://pypi.org/pypi/csoai-core/json` → **404** |
| But | `https://pypi.org/pypi/csoai/json` → **200** — the package `csoai` *is* published |

```bash
curl -s -o /dev/null -w '%{http_code}\n' https://pypi.org/pypi/csoai-core/json   # 404
curl -s -o /dev/null -w '%{http_code}\n' https://pypi.org/pypi/csoai/json        # 200
```

Either the register means `csoai` and the name is wrong, or `csoai-core` was never published under
that name. Both the register and the Inngot profile carry it as PUBLISHED, so the error is
currently in two places at once.

## FAIL 2 — the OTS anchoring claim

| | |
|---|---|
| Register says | *"compact card (Ed25519 + **OTS anchoring**)"* |
| Inngot profile says | *"Ed25519 signatures with **OpenTimestamps anchoring**"* |
| Probed | deployed `root.json` carries **no `ots`, `opentimestamps`, `anchor` or `rekor` field of any kind** |

```bash
curl -s https://councilof.ai/root.json | grep -ci 'ots\|opentimestamps\|anchor\|rekor'   # -> 0
```

This is the estate's most-repeated overclaim and it is already contradicted by our own published
surfaces: `client/src/data/facts.json` lists **3** live anchors and names OpenTimestamps in its
`excluded` field as *"stamped, not anchored"*, and `/.well-known/anchor-posture.json` publishes the
root as **SIGNED_NOT_ANCHORED**.

**Severity is highest here** because the Inngot profile is a valuation input. Asserting an
anchoring rail that does not exist, in a document shown to funders, is a different class of error
from the same words on a marketing page.

**Two ways to close it, and one is free:** anchor the root (OTS calendars cost nothing, and it
makes the sentence true) — or strike the words. Do not leave it asserted.

## FAIL 3 — the Zenodo paper count

| | |
|---|---|
| Register + profile say | *"3 DOI-registered Zenodo papers"* (over-refusal C1, WMH hyperbolic memory, ProvBench credential survival) |
| Probed | a Zenodo API query for `csoai` returns **54 records** |

```bash
curl -s "https://zenodo.org/api/records?q=csoai&size=20" \
  | python3 -c "import json,sys;print(json.load(sys.stdin)['hits']['total'])"   # -> 54
```

This one **understates**. Caveat stated honestly: a keyword query may catch records that are not
ours, so 54 is an upper bound and 3 is demonstrably low. The real number needs a scoped query
before it goes in a funder-facing document.

## Gap inside the Inngot profile itself

Page 3, **Registered Rights (Patents, Trade Marks and Designs)**, prints verbatim:

> *"You have selected that you have statutory rights but haven't inserted the necessary data."*

The profile **asserts statutory rights and then records none**. Fill it or withdraw the assertion
before the profile is shown to anyone.

## What H5 got right and should keep

- **The 14-axis vs 22-axis handling is exactly right.** The register notes the profile says 14, the
  live estate is 22, and that *"neither should be quoted as the other"*. Confirmed live:
  `/api/gspc` → 22 axes, 22 measured, 0 unmeasured. That is the correct way to carry a stale
  upstream number.
- **The TM3 hard date — 21 Sep 2026** — is the single most time-critical item in the whole capital
  workstream and did not appear in any other lane's output. **16 days out at time of writing.**
- Trade secrets recorded as secrets rather than as registered rights.
- OIN 2.0 / LOT Network defensive posture, and the mandatory scope check before any filing.

## Cross-reference

`docs/company/VALUATION-2026-09-05.md` (merged, PR #1367) prices the unregistered trade marks as
**the largest quantifiable value risk**, and `docs/grants/HUNT-2026-09-05.md` lists it as a blocker
gating several applications. H5's 21 Sep date is the deadline those two documents were missing.

## Suggested owner/lane actions

| # | Action | Who |
|---|---|---|
| 1 | **File TM3 by 21 Sep 2026** — COUNCIL OF AI (4 cls) + MEOK (2 cls), ~£650 | owner, payment |
| 2 | Correct `csoai-core` → `csoai` in the register **and** ask Inngot to correct the profile | H5 + owner |
| 3 | Either **anchor `root.json`** (free, makes the claim true) or strike the OTS wording from both | CI lane + owner |
| 4 | Fill or withdraw the Inngot Registered Rights section | owner |
| 5 | Scope the Zenodo query and publish the real paper count | H5 |

_Probed 2026-09-05 by the eat lane. Where a register and a live endpoint disagree, the endpoint
wins. No file outside this lane's area was modified._
