# SOV3 Trainable Assets — Honest Inventory 2026-07-08

Full survey of what real training data the estate holds, and what is genuinely improvable
vs. maxed-out. No fabricated data anywhere.

## A. Governance NNs (need-state / text classifiers)
| NN | real n | status | improvable from disk? |
|---|---|---|---|
| care | 346 | good | maxed (best available) |
| relationship | 253 | good | maxed |
| creativity | 215 | good | maxed |
| threat (classifier v2) | 1,823 | **strong 0.959** (deny/breach) | maxed — best real signal |
| dependency (new) | 5,040 rows/57 pos | **0.865 leakage-free** | maxed |
| care_town (structured) | 5,040 | **0.137 MAE beats base** | maxed |
| partnership | 50 | starved | NO — town has no real signal (0.94 was tautology) |
| emotion | 50 | starved | NO new labelled data on disk |
| intent | 50 | starved | NO new labelled data on disk |
| sentiment | 50 | starved | NO new labelled data on disk |
| threat (4-cat NN) | 61 | overfit (1.0 on 61) | needs real multi-category data |

**Conclusion:** the well-fed NNs are maxed on available real data; the starved ones (n=50)
CANNOT be grown from anything currently on disk. Growing them needs the server running to log
real interactions (episode_logger + natal_guardian are installed for exactly this).

## B. LLM fine-tuning corpus (NEW find — genuinely deployable)
- `sovereign-temple/data/train.jsonl` — **275 clean examples**, 275/275 well-formed
  system+user+assistant triples, 0 malformed. Jarvis/Sophie sovereign-persona instruction data.
- `data/test_split.jsonl` — 44 held-out examples.
- **This is a real, deployable asset** for fine-tuning the qwen base persona — validated clean.
  It is NOT governance-NN data; it shapes the voice/persona brain.

## C. Not training data (checked, ruled out)
- SIGIL ledgers (sovereign-temple 1,044 lines + sovereign-temple-public 1,043 lines) — cryptographic audit (digests/signatures), no NN labels.
- os_directives_ledger (3 lines) — signed directives, not training data.

## Honest bottom line
SOV's real model improvement is DATA-BLOCKED, not method-blocked. Every NN that could be grown
from disk has been. The next genuine gains require:
1. Server running (real terminal) → episode_logger + natal_guardian capture real partnership/
   dependency/emotion events over time.
2. Fine-tuning the persona brain on the clean 275-example corpus (needs GPU — Kaggle/Modal).
Anything else would be inventing data, which the honesty register forbids.
