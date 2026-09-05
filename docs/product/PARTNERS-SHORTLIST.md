# Design-partner shortlist — derived, not chosen

**Source:** `public/interop/bank-registry.json` (`as_of` 20260905T055200Z, 26 banks, 4000 records).

**Ranked by evidence density** — the number of records we already hold for that institution. Nobody on this list was picked because they looked like a good logo; the order falls out of the query below and changes when the registry changes.

## The query

```bash
curl -s https://councilof.ai/interop/bank-registry.json \
  | python3 -c "import sys,json;b=json.load(sys.stdin)['banks'];\
b.sort(key=lambda x:(-x['records'],x['bank']));\
print('\n'.join(f\"{i+1:2}. {x['bank']:<24} {x['records']:>4} records  {x['country']}\" "
      "for i,x in enumerate(b[:10])))"
```

## The ten

| # | institution | records | country | kind | chains |
|---|---|---|---|---|---|
| 1 | HSBC | **180** | GB | XRPL-direct | 5 |
| 2 | StanChart | **180** | GB | XRPL-direct | 5 |
| 3 | UOB | **180** | SG | XRPL-direct | 5 |
| 4 | SG-FORGE | **160** | FR | XRPL-direct | 5 |
| 5 | ANZ | **150** | AU | permissioned | 5 |
| 6 | BBVA | **150** | ES | permissioned | 5 |
| 7 | BNP Paribas | **150** | FR | EVM-treasury | 5 |
| 8 | BNY Mellon | **150** | US | XRPL-direct | 5 |
| 9 | Bank of America | **150** | US | unknown | 5 |
| 10 | Citibank | **150** | US | permissioned | 5 |

## What this list is NOT

Every institution here carries status **DISCOVERED/UNCHECKABLE** in the registry. DISCOVERED means we found public records about them. It does not mean they are clients, that they know we exist, that we have measured them, or that anything here is a grade. Nothing on this page is a conformity claim about any bank.

A record is public evidence we hold, not a relationship. The list answers one question — *where do we already have the most to show someone?* — and that is the only question it answers.

## Who sends it

The owner. This file is a derivation, not an outreach action: no message is drafted here, nothing is addressed, and no agent may contact any institution on it.

_Derived 2026-09-05 from the registry named above. Re-run the query; if the registry moved, this file is stale and the query is right._
