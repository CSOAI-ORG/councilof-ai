# Retired pod-chain scripts — superseded, never installed

`land.sh`, `sign.sh`, `root.sh` and `ots.sh` were the four stages of a "pod chain"
gated behind `CHAIN_ENABLED=1` in `scripts/pod-loops/scheduler.sh`. They were
**never installed** at `/workspace/lanes/loops/` — on 2026-09-23 a search of the
pod found them only inside repo checkouts, never in the loops directory — so the
gate was never flipped and not one of them ever ran. Their last bytes are in git
at `135bddefd^`, together with the `chain_slot` / `chain_log` / `chain_repo` /
`chain_dry` / `CHAIN_TOOLS` helpers that `lib.sh` carried only for them.

They are retired here rather than left in place because a dormant script in an
installable directory is a trap in two directions:

**It claims slots that are taken.** The block booked `:15`, `:25`, `:35` and
`:45`. On the running pod three of those four are now occupied — `:15`
`durability-mirror.sh`, `:35` `arena-hourly.sh`, `:45` `trust-chain.sh`. Only
`:25` is still free. Flipping `CHAIN_ENABLED=1` would have put `land.sh` on top
of the mirror backstop, `root.sh` on top of the arena round and `ots.sh` on top
of the trust chain.

**Its work is already done, hourly, by something else.** This is why the slots
were reassigned, not merely why they collide:

| retired | slot | what does that work now |
|---|---|---|
| `land.sh` | :15 | `mill-hourly.sh` (:10) — `verify_runpod_gspc_intake.py` → `chain_tools.py stage` → `land_mill_cards.py --require-evidence`, in one slice |
| `sign.sh` | :25 | `mill-hourly.sh` (:10) — `sign_mill_cards.py --pod-token-file`, same DID, same n≥30 rule |
| `root.sh` | :35 | `mill-hourly.sh` (:10) — `card_root.py --stamp` then `--verify` |
| `ots.sh` | :45 | `trust-chain.sh` (:45) — the OTS upgrade, plus a manifest rebuilt from the bytes and the corrections-ledger signature re-derived from the served bytes |

`chain_tools.py` is **not** retired and stays in `scripts/pod-loops/`. It is a
library, not a loop: `mill-hourly.sh` runs it as
`$CLONE/scripts/pod-loops/chain_tools.py stage` out of the repo checkout, and
`tests/pod_chain/test_chain_determinism.py` covers it. It is the one declared
`repo_only` entry in `INSTALLED.json`.
