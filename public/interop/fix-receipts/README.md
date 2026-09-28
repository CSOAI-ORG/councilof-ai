# Fix receipts — proving a fix held

Finding a fault, naming the class it belongs to, and naming a remedy are three different
jobs, and the field does all three. Scanners find breaks. Published taxonomies name the
class. Control standards say what to do. The fourth step — **measuring the same thing again
after the remedy lands, and publishing both readings** — is the one that is rarely anybody's
product.

We can do it because we already run both halves every day: a measurement engine that signs
what it measures, and a public corrections ledger that records what we got wrong. A fix
receipt is the join of the two. It is built to align with that existing practice, and it adds
one idea: **a landed commit is not a fix.** Two measurements are.

**Scope, stated once and meant.** Every receipt here is about **our own** faults. We do not
fix anyone else's systems and we sell no remedy — that conflict of interest is precisely what
would make our measurements not worth reading. Nothing here is a conformity mark, a
certification or an endorsement, for us or for anyone. No organisation has reviewed or
approved it. Tools, standards and taxonomies are named as factual provenance only.

## The verdict vocabulary — four words, closed

| verdict | means |
|---|---|
| `VERIFIED_FIX` | Two readings exist, they are comparable, and the value moved the way `expected_direction` said it had to. |
| `FIX_FAILED` | Two readings exist and the value did not move that way. |
| `PARTIAL` | The scoped remedy is measurably working **and** the fault it addresses is measurably still present. |
| `UNVERIFIABLE` | At least one side cannot be measured — no stated change, no instrument, a destroyed before-state, or an effect not observable from outside. |

`UNVERIFIABLE` is first-class and is the honest label for most fixes. Pretending otherwise
would be the whole defect this artifact exists to avoid. A worked figure from our own ledger:
of the **61** entries in the public corrections ledger on 2026-09-23, **5** carry a structured
`what_changed` field. For the other **56**, a fix receipt written today would be
`UNVERIFIABLE` on the change side — there is nothing structured to measure against. That is
not a criticism of the ledger; it is the measurement of how far the fourth verb still has to
go here, and it is why the field exists in the schema at all.

The checker refuses `VERIFIED_FIX` unless both readings are `MEASURED`. It is not a
formality: it is the single rule that stops a receipt becoming an assertion that a commit
landed.

## Files

| file | what it is |
|---|---|
| `fix-receipt.schema.json` | the schema, `csoai.fix-receipt/0.1` |
| `fix-receipt-chain.jsonl` | the chain: one GENESIS link, then one line per receipt |
| `after-measurements-2026-09-23.json` | the after-readings, frozen at the moment they were taken |
| `../../../scripts/fix_receipts.py` | the producer, the verifier and the selftest, in one file |

## Verify it yourself

Every link's digest is recomputable **from that line alone**, so you never have to trust the
order we happened to write the file in:

```
state_digest = sha256( json.dumps(link_without_state_digest,
                                  sort_keys=True, separators=(',',':'),
                                  ensure_ascii=True).encode() ).hexdigest()
```

```bash
curl -sO https://councilof.ai/interop/fix-receipts/fix-receipt-chain.jsonl
python3 - <<'EOF'
import json, hashlib
ls = [json.loads(l) for l in open("fix-receipt-chain.jsonl") if l.strip()]
def d(e):
    b = {k: v for k, v in e.items() if k != "state_digest"}
    return hashlib.sha256(json.dumps(b, sort_keys=True, separators=(',',':'),
                                     ensure_ascii=True).encode()).hexdigest()
edited  = [e["seq"] for e in ls if e["state_digest"] != d(e)]
broken  = [b["seq"] for a, b in zip(ls, ls[1:]) if b["prev_hash"] != a["state_digest"]]
print(len(ls), "links;", len(edited), "edited;", len(broken), "broken links", edited, broken)
EOF
```

An **edited** receipt fails its own digest. A **removed or reordered** receipt breaks the next
link's `prev_hash`. Both checks are run by `scripts/fix_receipts.py --verify`, and
`--selftest` plants each break in turn and requires the checker to catch it — a checker that
cannot fail is not a checker.

Then re-take the readings yourself:

```bash
python3 scripts/fix_receipts.py --measure     # writes a NEW frozen reading; supersedes nothing
```

Two of the three probes use only bytes any stranger can fetch. The third reads the
measurement machine's own log and says so in its `by` field, because a reading taken by the
party that made the change is worth less than one taken by anybody else, and which it was is
part of the reading.

## What a receipt proves, and what it does not

It proves that a named quantity read one way before a named change and another way after, and
it names who took each reading. That is all. Every receipt carries a `not_established` list
saying so in its own terms, and a `residual` field naming what is still wrong — including
faults that are **not** the fault the receipt is about. A `VERIFIED_FIX` with a residual must
not be read as "working". One of the three receipts in this chain is exactly that case: the
gate it names stopped firing, and the engine behind it is still stopped for an unrelated
reason, which the receipt states in the same breath.

It does not prove the remedy was good, that no other fault exists, or that anything is safe.
Perfection is not on offer and never will be: the honest form is measured, re-measured and
corrected in public.

## Relation to the corrections ledger

A receipt points at a corrections entry; it never writes one. Where an entry exists, the
receipt cites its id. Where one is owed, the receipt says `DRAFT_IN_APPROVE_QUEUE` and the
draft sits in `council-os/corrections-drafts/` for the owner to promote. **Nothing in this
lane publishes a correction.** Signed or published bytes are never edited; a receipt that
turns out to be wrong is superseded by a new one that names it.

---

CC-BY-4.0. Council of AI (CSOAI Ltd, UK Companies House 16939677), councilof.ai.
