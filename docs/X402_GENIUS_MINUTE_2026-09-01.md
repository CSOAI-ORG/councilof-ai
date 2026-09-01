# x402 agents · GENIUS reserve · minute watcher — Measure — 1 Sep 2026

**Status:** design leftover. Clean branch off master (supersedes dirty #997 for this slice).  
**Locks:** Board **22 · 15 · 7**. **No fill-7.** Never certify. No MEASURED invent. Harness stays authority. Passport = card+root only.

Owner: x402 agents = **measure/sign targets**. GENIUS bridge `surface=genius.reserve` (cite **P.L. 119-27**, **no endorsement**). Minute watcher = **CEO-owned dry-run**. Revenue wedge = **x402 + drift refresh + passport**.

---

## 1. x402 agents as measure/sign targets

- Agents that pay / request via x402 are **subjects** of measurement and (when path open) Ed25519 sign — not seats, not a second board.
- Request-attestation grammar may cite payment receipt as `source_urls` / payload evidence.
- **Still no `/proof-on-x402` public claim** until owner cut-off paste names it.
- Successful payment does **not** mint a MEASURED cell. Failed payment does not delete a free card.
- Measure/sign path: frozen bank or declared probe → card-v0 leaf → optional `sig_ed25519` → root inclusion.

---

## 2. GENIUS bridge — `surface=genius.reserve`

Cite only: **Public Law 119-27** (GENIUS Act class). Treasury NPRM class **17 Aug 2026** = cite frame only. **No endorsement. Not a conformity mark.**

| Field | Notes |
|---|---|
| Outer `surface` | `genius.reserve` |
| Payload | reserve / disclosure cites + statute cite + `unmeasured[]` |
| Honesty | not_a_certification; not advice; no endorsement of issuer or Act implementation |

```json
{
  "statute_cite": "P.L. 119-27",
  "endorsement": false,
  "reserve": {
    "issuer": null,
    "as_of": null,
    "source_urls": [],
    "status": "UNMEASURED | CITED | UNCHECKABLE"
  },
  "note": "Statute cite only. No endorsement. Not board MEASURED. No fill-7."
}
```

Placeholders stay **UNMEASURED**. Does not fill empty board axes.

---

## 3. Minute watcher — CEO owns the clock

**Owner:** CEO owns the minute watcher routine. **Nick does not clock.** Measure keeps `erc8004.callable` + `genius.reserve` grammar ready only.

| Routine | Cadence | Mode |
|---|---|---|
| ERC-8004 minute watcher | every minute | **dry-run probe** of public endpoints (Base→BNB→Ethereum); no MEASURED write; quiet when nothing new |
| GENIUS reserve hourly | hourly | cite-only hash of public reserve disclosures → `genius.reserve` candidates |

1. Spec inputs: registry/endpoint probe results; root hash; leaf count; last `as_of`; drift flags when SIGNED path exists.
2. Spec outputs: dry-run notes / local log — **no** public MEASURED write from the routine, **no** `root.json` write, **no** laptop key.
3. Fail-closed: missing root / unreachable → `UNCHECKABLE` / `UNREACHABLE`; never invent CALLABLE or fill-7.
4. Cards mint only when frozen bank + GHA path is NAMED; until then grammar stays ready only.

---

## 4. Revenue wedge (honesty)

| Rail | Role |
|---|---|---|
| x402 | Pay-to-recompute / request-attestation (agents as measure/sign targets) |
| Drift refresh | Paid refresh of N vs N+1 drift on card+root — not a rank SKU |
| Passport | ERC-8004 passport to **card+root** — never model tokens |

SaaS seats are not the product. No fill-7 to look complete.

---

## Hard no

- No fill-7 / MEASURED invent from GENIUS or x402.
- No endorsement of P.L. 119-27 / Treasury implementers.
- Minute/hourly routines are CEO-owned dry-run; live card mint still needs bank+GHA NAMED.
- No `/proof-on-x402` claim until owner paste.
- No second root writer. No laptop key. No wrangler. No Cloud Agents.

Filed Europe/London 1 Sep 2026.
