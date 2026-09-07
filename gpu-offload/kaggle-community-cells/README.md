# CSOAI Kaggle community cells

TUI-5 D/A. Private T4 batch kernel. Cap ≤100 probes. One lane / 2h.

Measures what the HF hub mill cannot: Kaggle Datasets search (n = unique refs) plus a jail goldbank slice on Kaggle-hosted LLMs. Emits unsigned mill cards for `scripts/land_mill_cards.py`. Status stays UNMEASURED until the signer signs. No medals.

**Do not `kaggle kernels push` from the Mac.** Use GHA secrets `KAGGLE_USERNAME`/`KAGGLE_KEY` or the Oracle micros.

```bash
# on the estate, not this laptop
kaggle kernels push -p projects/coai-dashboard/gpu-offload/kaggle-community-cells
```

Outputs in `/kaggle/working`: `community_inventory.json`, `kaggle_community_cells_report.json`, `mill-out/unsigned-jail-*.json`.
