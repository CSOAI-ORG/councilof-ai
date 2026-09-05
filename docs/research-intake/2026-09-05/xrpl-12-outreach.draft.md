# F12 — the 12 XRPL issuers without a two-way binding: evidence-card path + outreach draft

**DRAFT. The owner sends. This lane sends nothing.** 5 September 2026.

Probed live, not carried from a note: `GET https://councilof.ai/api/xrpl` → `n=16`,
`writes_board=false`, `as_of 2026-09-05T12:39:29Z`, root `6347384a…`.

## The split, from the live reader

**4 with `verified_via: "Bidirectional domain match"`** — `unmeasured: []`:

| Symbol | Issuer | Address |
|---|---|---|
| RLUSD | Ripple | `rMxCKbEDwqr76QuheSUMdEGf4B9xJ8m5De` |
| OUSG | Ondo Finance | `rHuiXXjHLpMP8ZE9sSQU…` |
| USDB | Braza Bank | `rB3y9EPnq1ZrZP3aXgfy…` |
| BBRL | Braza Bank | `rH5CJsqvNqZGxrMyGaqL…` |

**12 carrying `unmeasured: ["strict_two_way_toml"]`:**

| Symbol | Issuer | Verified via |
|---|---|---|
| EURCV | Société Générale-FORGE | XRPScan well-known directory |
| USDC | Circle | XRPScan well-known directory |
| EURØP | Schuman Financial | XRPScan well-known directory |
| EURQ, USDQ | Quantoz | XRPScan well-known directory † |
| PSC | Republic of Palau | XRPScan well-known directory |
| XAU.gh, GBP.gh, USD.gh, EUR.gh | GateHub | XRPScan / XRPLMeta |
| USD.bs, EUR.bs | Bitstamp | XRPLMeta registry |

† EURQ and USDQ additionally carry `sig_ed25519 against #board-attestation-1 (NO_LAPTOP_SIGN)` as
unmeasured — that is **our** signing gap, not theirs, and must never appear in outreach as though
it were an issuer property.

## What `strict_two_way_toml` actually means — and what it does not

**Means:** we could not observe *both* halves of a binding — the issuing account publishing a
`Domain`, **and** that domain serving `/.well-known/xrp-ledger.toml` whose `[[ACCOUNTS]]` block
names the same address back.

**Does NOT mean:** that the issuer is misconfigured, non-compliant, unsafe, or has failed anything.
All 12 are verified by *another* route — XRPScan's well-known directory or the XRPLMeta registry.
The two-way TOML is a **stricter** check than either, and failing a stricter check is not a defect.

Everything below is written so that a reader who is hostile to us cannot extract an accusation from
it. If any sentence can be read as "this bank got something wrong", it is the wrong sentence.

## Evidence-card path

One card per issuer, at `https://councilof.ai/cards/{sha16}.json`, indexed from
`public/signed/card_index.json`.

```
subject      : xrpl:issuer:<classic-address>
axis         : provenance
verdict      : UNMEASURED                 <- for all 12, today
checks       : ledger_domain_present        bool
               toml_reachable               bool
               toml_accounts_contains_addr  bool
               strict_two_way_toml          bool   (AND of the three)
verified_via : the route that DID work (XRPScan directory / XRPLMeta registry) — always recorded,
               so the card never reads as "unverified"
retrieved_at : RFC3339 per half
```

**Card doctrine:** no score, no grade, no ranking. `UNMEASURED` is first-class. No issuer is a
client. No bank name is used as a client name — `root.json`'s own `language` field already binds
this.

## Outreach draft — owner sends, one issuer at a time, never as a batch

> **Subject:** Public XRPL issuer record — a two-way domain binding we could not observe
>
> Hello,
>
> I run CSOAI Ltd (UK 16939677), an independent measurement body. We publish a free, public record
> of identity-verified issued assets on the XRP Ledger, built only from public sources. Your
> `<SYMBOL>` issuance appears in it.
>
> Our record currently marks one check against `<SYMBOL>` as **UNMEASURED**, and I want to be
> precise about what that does and does not say.
>
> We look for a *two-way* binding: the issuing account publishing a `Domain` field, and that domain
> serving `/.well-known/xrp-ledger.toml` with an `[[ACCOUNTS]]` entry naming the same address back.
> We could not observe both halves from the outside. **That is a statement about what we could
> see, not a finding about your configuration** — `<SYMBOL>` is verified in our record via
> `<XRPScan well-known directory | XRPLMeta registry>`, and the two-way TOML is a stricter test than
> either. Nothing in our record says you have failed anything, and we will not publish it that way.
>
> Two reasons you may want to know:
>
> 1. If the binding *does* exist and we simply could not reach it, tell me and I will re-run the
>    check and correct the record. Our corrections ledger is public.
> 2. If it does not exist, publishing an `xrp-ledger.toml` is a small, free, self-serve step that
>    makes your issuance independently verifiable by anyone — not only by us.
>
> Either way there is nothing to buy and nothing to sign. Verification on our side is free
> permanently. If you would rather we did not contact you again, say so and we will not.
>
> The live record: https://councilof.ai/api/xrpl
> The correction route: https://councilof.ai/api/corrections
>
> Nicholas Templeman · CSOAI Ltd · nicholas@csoai.org

### Sending rules — these are the point, not decoration

- **Owner sends.** No lane sends outreach, and nothing goes out under CSOAI's name automatically.
- **One at a time**, to a published contact address. **Never a batch, never a mailing list.**
- **Never CC a regulator**, never mention one. This is a technical note, not a compliance approach.
- **No deadline, no pressure, no follow-up chain.** One message. If there is no reply, that is the
  answer, and the card stays UNMEASURED — which is a legitimate published state, not a threat.
- **Do not publish "we contacted N issuers".** The relationship-implication risk is exactly what
  the Berkus relationships factor was scored down for; inventing the appearance of relationships is
  worse than having none.
- **If an issuer replies with a correction, run it through `/api/corrections`.** That ledger is the
  most valuable asset we have and it only stays valuable if it is used.

## Status

| Item | State |
|---|---|
| The 4 two-way issuers, named from live data | **DONE** — this file names them; the earlier draft correctly refused to name them from a stale note |
| The 12 without two-way, named from live data | **DONE** |
| Card schema | **DRAFTED** |
| Cards written | **NOT DONE** — signing is owner-gated |
| Outreach sent | **NOT DONE — and not this lane's to send** |
