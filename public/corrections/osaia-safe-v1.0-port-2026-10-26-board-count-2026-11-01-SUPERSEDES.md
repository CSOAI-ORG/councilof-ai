# Correction: the live board count in the SAFE v1.0 port contribution

**CSOAI — Council for Secure and Open AI. Correction dated 1 November 2026.**
Supersedes one sentence in section 5 of *Porting three open items onto the approved SAFE v1.0 —
with one worked example of a claim that was maintained* (26 October 2026), published at
`https://councilof.ai/contributions/osaia-safe-v1.0-port-2026-10-26.md` and kept in the repository
at `public/contributions/osaia-safe-v1.0-port-2026-10-26.md`.

That file is edited in place, visibly: the corrected sentence carries the value that was published
beside the value that is current, and a dated correction block at the head of the document says
what changed. This note stands beside it and names what it corrects. The **28 October 2026**
correction to the same document is not withdrawn and not edited — it corrected the section 2
comment counts and the honesty register, and it stands unchanged.

---

## What the 26 October document said

In *The worked example: a signed claim that was maintained, not quietly dropped*:

> - The **living board** — `https://councilof.ai/api/gspc` — states **33 axes · 23 measured**.

## What is wrong with it

**It is a live endpoint quoted in the present tense, with no read date.** The sentence reads as a
standing fact about `https://councilof.ai/api/gspc`, and it is the only sentence in the section
that does: everything else in the example points at a frozen, signed artefact — the board freeze,
its Rekor log index, the pointer's machine-readable status field — where nothing moves.

The claim was **true when it was written**. On 26 October 2026 the board read 33 axes · 23
measured; that is the same correction this estate made to this sentence on that date, when the
document was found to present the signed freeze's 23 axes as the current board. It went stale five
days later, and it went stale for an ordinary and unremarkable reason: the board grew.

**What moved, and when.** PR **#3692** — *"measure(watchdogs): 18 public watchdogs probed daily,
the 34th axis, and the day's index signed into the public root"* — landed on `master` at
**2026-11-01T07:33:41Z** (commit `052f4281801241962bc55a29de6c7da9203b3dba`) and added one
**declared slot**, `watchdog-ingest`. The measured count did not move: 23 measured before, 23
measured after. The board now reads **34 slots · 23 measured · 11 declared-unmeasured**
(`public_count` = `34 axes · 23 measured`).

A declared slot with no run behind it is a published position, not a measurement, and the estate
publishes it deliberately — the gap is meant to be visible. That is why the count the sentence
quotes is not a fixed number: it is the board's size on the day it was read, and it moves when a
slot is declared.

## What is correct, and was re-read

Read live at **2026-11-01T08:31:29Z** (one window, all endpoints):

```sh
curl -s https://councilof.ai/api/gspc \
  | python3 -c 'import sys,json; t=json.load(sys.stdin)["totals"]; print(t["axes"], t["measured_axes"], t["unmeasured_axes"], t["public_count"])'
# 34 23 11 34 axes · 23 measured
```

| Claim in the contribution | Status now |
|---|---|
| The signed board freeze states **23 axes · 23 measured** | **Unchanged and immutable.** A frozen, Ed25519-signed artefact, witnessed in the Rekor transparency log at index 2687278151. It is not a live reading and cannot go stale. |
| The freeze's pointer carries `relying_party_status.state = "SUPERSEDED_KNOWN_CLAIM_DEFECT"` and names the living board as `current_authority` | **Unchanged.** |
| The separation line — 0 of 14 model-comparison axes separated a leader, 7 TIE, 7 UNTESTED | **Unchanged** at the read above. A TIE is not a win and UNTESTED is not a tie. |
| The patch binds to the **approved** `SAFE.md` | **Unchanged.** Re-verified on 28 October 2026 and still holds; that claim is about a pinned upstream commit, not about a moving endpoint. |
| "Prepared, not submitted" — no pull request has been opened to the Alliance | **Unchanged.** Opening it still needs a co-author with a normal GitHub account. |

## What this note does not claim

It does not claim the board's composition was wrong on 26 October 2026, because it was not. It
does not claim the estate mis-measured anything: a declared slot was added, the board published it,
and a document that quoted the old size without a date went out of date. It does not change the
contribution's argument, which is that a signed claim and the living board are two boards observed
at two different times — a point the correction makes rather than weakens, because the living
board is the one that moves.

## The two copies

The same sentence appears in the companion working note,
`docs/standards/osaia-safe-reverification/SAFE-v1.0-PORT-20261026.md`, and is corrected there in
place, with the same dated marking. The citable form and the working note are separate files and
are corrected separately; a correction that lands in one and not the other leaves the published
claim just as false.
