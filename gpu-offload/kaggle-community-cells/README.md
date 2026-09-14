# CSOAI Kaggle community cells

TUI-5 D/A. Private T4 batch kernel. Cap ≤100 probes. One lane / 2h.

Grades a revision-pinned Hugging Face model on Kaggle's free runtime (default `Qwen/Qwen2.5-0.5B-Instruct`; T4 when usable, else CPU) against frozen public GSPC banks pinned by dataset revision **and** sha256 (`BANK_PINS`). Also records Kaggle Datasets search (n = unique refs). Emits unsigned mill cards for `scripts/land_mill_cards.py --require-evidence`. Status stays UNMEASURED until the signer signs. No medals.

Every card carries the hub mill's `csoai.mill-item-evidence/0.2` bundle, written beside each copy of the card: `bank-<axis>-<sha12>.jsonl` (the exact bank bytes) and `items-<axis>-<sha12>.jsonl` (one row per item: prompt + sha256, expected, raw output + sha256, observed, ok, `provider_route` `kaggle-community:<device>`). Admission is `scripts/verify_hub_mill_evidence.py`, the same code the hub mill uses. Up to 30 items per cell, never padded, repeated or truncated: a bank with fewer than 30 gradable items, or answers that do not parse, yields n<30, which stays UNMEASURED. A bank whose exact-label menu has one option (#2368) is refused before any probe. A cell that does not fit the remaining `PROBE_CAP` is refused, not cut short.

**Do not `kaggle kernels push` from the Mac.** Use GHA secrets `KAGGLE_USERNAME`/`KAGGLE_KEY` or the Oracle micros.

```bash
# on the estate, not this laptop
kaggle kernels push -p projects/coai-dashboard/gpu-offload/kaggle-community-cells
```

Outputs in `/kaggle/working`: `community_inventory.json`, `kaggle_community_cells_report.json`, `unsigned-*.json` with its `items-*.jsonl` and `bank-*.jsonl` (top level and `mill-out/`).

Before probing, the kernel consumes and validates
`https://councilof.ai/mirrors/reviewed-stream.jsonl`. The exact bytes and digest
are retained as `reviewed_public_stream.jsonl` and in the report. Kaggle is a
consumer of the reviewed stream; it does not sign, root, or promote evidence.
