# The canary rule

A contamination canary must **never** be a graded bank item.

## Why the rule needs writing down

Three conventions are live across the frozen banks, and `n` means different things
depending on which one an axis uses:

| bank | shape | counted in `n`? |
|---|---|---|
| `gspc-agi`, `gspc-care`, and 10 others | standalone row `{"_canary": "GSPC-CANARY-GUID <axis>-csoai-2026"}`, no `expected` | no — correct |
| `gspc-affect` | `_canary` is a **field on every row** (null on 41 of 42); the canary row has `_canary: "KINGFISHER"` and `expected: null` | no — correct |
| `gspc-swarm` | `{"case": "__CANARY__ drop", "expected": "CANARY"}` | **yes — wrong** |
| `gspc-jail` | canary row carries `expected: "CONFINED"` | **yes — wrong** |

A canary exists to detect a model that has memorised the bank. Counting it as an item
inflates `n` by one and, where its `expected` is a novel string, adds an allowed label no
real item uses.

`gspc-jail` is the worse of the two. `CANARY` is obviously not a real verdict, so swarm's
violation announces itself. `CONFINED` **is** a real jail label, so jail's canary is
indistinguishable from a graded item: it inflates `n` silently.

## The rule

> A canary row carries a canary marker — the key `_canary`/`canary`, or a `__CANARY__`
> sentinel in any string field — and **MUST NOT carry a non-null `expected`**.

Bank readers count items by `expected`. That one property keeps a canary out of `n` and
out of the allowed-label set in every bank, without a reader needing to know which of the
three conventions an axis uses.

## Enforcement

`harness/gspc-top100/test_bank_canary_rule.py` checks all 14 model banks live.

    python3 harness/gspc-top100/test_bank_canary_rule.py --selftest   # 4 cases
    python3 harness/gspc-top100/test_bank_canary_rule.py             # exit 1 on violation

The selftest runs first and proves the check can both fail and pass: a standalone sentinel
passes, a canary field with `expected: null` passes, a canary carrying an `expected` fails,
and a normal item is never mistaken for a canary. An unreadable bank exits **2 UNCHECKABLE**
— an unread bank is not a clean bank.

Current: **12 of 14 clean, 2 violations** (`gspc-jail`, `gspc-swarm`).

## What this does NOT do

**It does not edit any bank.** The banks are frozen and signed cards are pinned to their
`bank_sha256`; editing one in place would silently change what every existing card claims to
have measured. A violating bank is **superseded with a new version** and its cards re-graded
against it — never edited underneath them.

So this test is red on two axes on purpose, and stays red until those two banks are
superseded. That is the same discipline as `hub-index-drift`: red because the estate is
wrong, not because the check is.
