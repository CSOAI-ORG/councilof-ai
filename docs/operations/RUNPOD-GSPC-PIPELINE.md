# RunPod GSPC pipeline — pod compute into counted cells

The trust boundary itself is documented in [`RUNPOD-GSPC-INTAKE.md`](RUNPOD-GSPC-INTAKE.md);
this file is the operational path around it — where runs come from, how they reach the signer,
and the two places a reader will otherwise draw the wrong conclusion.

Measured 2026-09-05. Every number below names the command that re-derives it.

## What the pod is doing

Pod `fpowppss5ngtkw` (RTX 3090, `sov-repull-20260808`, **$0.22/hr** per `runpodctl pod list`) runs
`runpod_gspc_worker.py --forever`. Its health endpoint is on the pod's `:8888`, not localhost —
a local `:8888` is a different Python server and will mislead you.

    ssh -i ~/.runpod/ssh/runpodctl-ssh-key -p 34051 root@194.26.196.156 \
      'curl -s http://127.0.0.1:8888/health'
    → cycle 70 · jobs_total 70 · failed_runs 0 · disk_free_bytes 4310405120

**The endpoint drifts.** `runpodctl pod list` gives the id and status but no SSH address. Derive it
from the live tunnel instead of a remembered value:

    ps -o command= -p $(lsof -ti:11439)   → root@194.26.196.156 -p 34051

## 70 or 112? Both, and they count different things

    find /workspace -name card-unsigned.json | wc -l   → 112   runs
    find /workspace -name run.json           | wc -l   → 113   (113th is the run executing now)
    distinct (model, axis) from the staged cards       → 70    cells

**70 is cells** (5 models × 14 axes), and matches `jobs_total` in health. **112 is runs** — a cell
accumulates runs over time. Quoting one number for the other is the easiest mistake here.

## The pipeline

    pod  ──tar over ssh──▶  HF csoai/runpod-gspc-intake (private, durable)
                                    │
                    verify_runpod_gspc_intake.py  (independent recompute, quarantine)
                                    │
                    runpod_gspc_bridge_to_mill.py (latest run per cell → unsigned-*.json)
                                    │
                            sign_mill_cards.py    (owns MEASURED; n>=30 or UNMEASURED)

`rsync` is **not installed on the pod**; use `tar -czf - -C /workspace gspc-24x7 | tar -xzf -`.
The tree is 12 MB, so it is not what fills the pod's disk.

Verified 2026-09-05: **112 of 112 VERIFIED_QUARANTINE, 0 REJECTED.**
Staged: **70 cells — 65 with n≥30 (the signer will mark MEASURED), 5 below it.** 42 older runs
were set aside as superseded within their own cell and reported, not dropped.

## The thing that will mislead the next person

`/api/hub-cards` and this pod measure **different populations**, and the endpoint says so:
`population: "third-party models on the Hub — NOT the CSOAI fleet"`.

    hub cells 733 over 79 third-party models (Qwen/Qwen3-30B-A3B, …)
    pod runs 5 local ollama models (mistral:7b, qwen2.5:0.5b-instruct, …)
    EXACT model-string overlap: 0

**So landing pod runs cannot move `hub-cards.counts.measured` off 663.** It moves the CSOAI fleet
board. Any goal phrased as "pod runs raise hub-cards.measured" is asking two disjoint sets to
intersect.

And the hub's 70 UNMEASURED cells are not short of compute:

    n distribution → {30: 70}            every one already satisfies n>=30
    reason         → ["signed-pending-verify"] ×70

They are stuck in exactly the state `sign_mill_cards.py` documents as issue #1155 — a status that
"expired the moment the card verified, and was interned into the bytes anyway". **Those need a
verification pass, not GPU time.** Pointing the pod at them would spend the remaining credit on
the wrong problem.

## Owner actions

- **RunPod balance is UNCHECKABLE from here.** `query { myself { clientBalance } }` returns
  HTTP 403 with the key in `~/.runpod/config.toml`. Check the console. The pod bills $0.22/hr.
- **Pod disk is 96% (4.1 GB free), low-water 3.5 GB — the worker stops below it.**
  `/workspace/gspc-24x7` is only 12 MB, so look at the model blobs. **Nothing was deleted.**
- `HF_TOKEN` must be set as an Actions secret or `runpod-intake.yml` fails closed by design:
  the intake dataset is private, and an unreadable intake is UNCHECKABLE, not zero runs.

## What the pod should grade next

See **[RUNPOD-GSPC-PLAYLIST.md](RUNPOD-GSPC-PLAYLIST.md)**. Short version: of the 70 UNMEASURED
`/api/hub-cards` cells, **0** are gradeable by this pod's 5 models, and none of them is short of
data — all 70 are `n=30, signed=true, ["signed-pending-verify"]`, which is #1155 and wants a
verification pass rather than GPU hours. The pod's own 5 models x 14 axes remain the right target
because those cells exist nowhere else.
