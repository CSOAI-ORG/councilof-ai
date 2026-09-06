# Testing our own moat claim — 6 September 2026

`docs/research-intake/2026-09-05/competitors-2026-09-05.md` asserts:

> *"we are the only body in this set that publishes a signed, independently recomputable evidence
> chain and its own corrections ledger."*

**I wrote that and did not test it.** It is the single strongest claim in the competitor analysis,
it is the one a funder or a journalist would check first, and it went out on reasoning rather than
measurement. This is the measurement.

## Method, and the control that makes it mean anything

Fourteen peers from the Tracxn export and the valuation comps. Probed for a DID document, a
security contact, `llms.txt`, and for corrections / errata / changelog / verify endpoints.

**A 200 is not a surface.** Two separate traps showed up:

1. **Soft-404 by redirect or shell.** `lmarena.ai/.well-known/did.json` and
   `trismik.com/.well-known/did.json` both returned **200** — and neither is a DID. One is a
   `301 Moved Permanently` HTML page, the other is a Vite SPA shell (`<!doctype html><html lang="en">`).
2. **Catch-all hosts.** Requesting `/csoai-control-path-that-cannot-exist-9f3a2b` — a path that
   certainly does not exist — returns **200** on those same two hosts. **Every 200 from them is
   meaningless**, and every result I collected from them had to be discarded.

That control is the whole reason this file can claim anything. Without it the raw numbers said
"LMArena publishes corrections, errata, changelog, methodology and verify" — five surfaces that do
not exist.

| Host | control path | path probing |
|---|---|---|
| LMArena, Trismik | **200** | **MEANINGLESS — results discarded** |
| Credo AI, Vals AI, Patronus AI, AIUC, LatticeFlow, Holistic AI, ModelOp, Vijil, Saidot, COMPL-AI | 404 | valid |

## Result

**Signing.** `0 of 14` peers serve a DID document. The only two 200s were the soft-404s above.

**Corrections / verification.** Of the **10 peers where path probing is valid**, **0** publish a
corrections, errata or verify endpoint in machine-readable form. `vals.ai/methodology` is a real
page (its host 404s the control) — a methodology page, not a corrections record.

**For LMArena and Trismik the method cannot answer.** Recorded **UNMEASURED**, not absent.

## So the claim survives — with its scope stated honestly

What is now measured: **no peer in this set publishes a DID-bound signing key or a machine-readable
corrections/verification endpoint at a conventional path.** Against that, this estate publishes
`/.well-known/did.json` (5 keys), `/api/corrections` (46 entries), `/signed/card_index.json`
(335 cards, all verifying), and `/.well-known/verify-yourself.json` with a runnable verifier.

What is **not** established, and the competitor file will say so:

- **Absence at a conventional path is not absence of the practice.** A corrections record can live
  in a blog, a changelog inside a docs subdomain, a PDF, or a customer portal. This probe would
  miss all four.
- **Two of twelve could not be probed at all.**
- **None of this measures quality.** A peer with no DID may publish better measurements than we do.
  This tests one specific, checkable form of transparency, not whether anyone is right.

The honest sentence for the competitor file is therefore narrower than the one I wrote:

> *No peer in this set publishes a DID-bound signing key or a machine-readable corrections endpoint
> at a conventional path (probed 2026-09-06, 10 of 12 hosts probeable). That is a statement about
> published surfaces, not about their practices.*

## Reproduce

```bash
# the control first — without it, nothing below means anything
for h in credo.ai vals.ai lmarena.ai trismik.com aiuc.com latticeflow.ai; do
  printf "%-18s %s\n" "$h" "$(curl -s -o /dev/null -w '%{http_code}' -m 12 \
    "https://$h/csoai-control-path-that-cannot-exist-9f3a2b")"
done
# then the surfaces, on hosts whose control returned 404
curl -s https://credo.ai/.well-known/did.json | head -c 120
```

_Tested 2026-09-06. The claim held; the wording did not, and the wording is what shipped._
