# POD-LOOP-HOST — what was measured, what was restored, what moved to CI (2026-11-02)

**WHAT THIS IS.** A dated reading of the estate's RunPod compute pod and the daily loop lane it
was supposed to host, taken while landing the post-deploy re-measurement of the 34th axis.

**WHAT THIS IS NOT.** Not a claim that the pod lane works. It did not, and the reading says so.

## The reading

The daily public-watchdog intake was a POD LOOP: `scripts/pod-loops/watchdog-intake.sh`,
dispatched at 09:40Z by `scripts/pod-loops/scheduler.sh`, landing a `watchdog/auto-<date>` branch
that the `:50` land job merged path-restricted.

Measured on the pod `ajtjj1u5qt6hdj` (`csoai-build-cpu-writer-20261001`, CPU, `gpuCount 0`):

| what | measured |
| --- | --- |
| `/workspace/lanes/loops` | **empty** — 0 installed scripts |
| `/workspace/lanes/logs`, `/workspace/lanes/state` | **empty** except one stray JSON |
| `scripts/pod-loops/scheduler.sh` running | **no process** |
| the loop's own `INSTALLED.json` | generated 2026-09-25, 64 loops, and it names `watchdog.sh` — not `watchdog-intake.sh` |
| the last intake artifact in the repo | `20261030T051040Z.json` — **no run since 2026-10-30** |

`/workspace` is a persistent MooseFS volume (`volumeId u6bcx7p3uc`), so the empty directories are
not a restart artefact: the loop host that carried them is gone. The estate's supervisor notes
already described the 3090 pod's 28 loops as `dormant` and `UNMEASURED`; that pod no longer
exists in the account.

**So the daily index was not daily.** The intake collected on demand, not on a schedule, and the
gap was invisible from inside the repo because the loop's absence looks exactly like a quiet day.

## What was restored, and how

The pod's `/root/.ssh/authorized_keys` held only `sovereign-council-deployment`. The fleet keys
were gone — the exact state `docs/operations/FLEET-SUPERVISOR.md` describes ("A pod restart drops
it from `/root`, and the dispatch then fails closed with `ssh run failed`"), and the copy on the
volume, `/workspace/secrets/fleet_authorized_keys`, was the way back.

**Restored 2026-11-02** — `fleet-oracle-20260925` and `councilof-ai-deployment` appended to
`/root/.ssh/authorized_keys`, previous file kept beside it as
`authorized_keys.pre-restore-<ts>`. All three documented keys are now present, so the Oracle
dispatch and the operator's own access both work again.

**THE REASON THE ACCOUNT KEY WAS REFUSED** (measured, not guessed): the pod's env carries
`PUBLIC_KEY=<the Mac's own ed25519>` and NOT `RUNPOD_PROJECT_ID`, so RunPod's post-start script
exits before it injects the account key — visible in the pod's own container log:

```
Running post-start script...
RUNPOD_PROJECT_ID environment variable is not set. Exiting.
```

So the account-level `runpodctl-ssh-key` is refused by this pod BY DESIGN, and a restart alone
cannot fix it. The key that works is the pod's own `PUBLIC_KEY` — the Mac's `~/.ssh/id_ed25519`,
whose fingerprint is `SHA256:zAwXl3B42RamCthz1nVyrg9q9AZwrqqA10Ive5ozHUw`.

**THE PORT MOVES.** `runpodctl ssh info <pod>` resolves it; `~/.ssh/config`'s `rp-3090-now` entry
carries a port that is stale after any restart and was re-pointed to `:35480` on 2026-11-02.

## What moved, and why

**The daily intake now runs on CI**: `.github/workflows/watchdog-intake.yml`, daily at 09:40Z.

It runs the estate's OWN script — `scripts/pod-loops/watchdog-intake.sh`, unchanged — with the
same gate, the same HOLD-only routing queue and the same path-restricted landing. The loop's
verdict decides everything: a day that does not pass the loop's own gate (the run artifact and
the pointer disagree, a routing row is not `HOLD` / `may_apply: false` / no challenge opened, or
the atom the public root would sign is not admissible) is a HOLD, and no pull request is opened.
It never pushes master directly.

**WHY NOT THE POD.** Starting the pod's scheduler would have started 64 loops whose side effects
span HF uploads, deploys, measurements and outward claims — a large blast radius on a lane that
has been idle since September, to obtain one daily measurement. The same script, the same gate
and the same landing rules, on a runner that is already the estate's CI, is the smaller change.

**NOT DONE.** The pod's 64-loop lane is still uninstalled and no scheduler runs on it. This is
the owner's call: reviving it means installing the loops onto the pod and starting the
supervisor, which is a deliberate infrastructure decision rather than a measurement.

## The day it did produce

The loop was exercised locally on 2026-11-02 against the live sources, with the estate's own
`flock`/`timeout` behaviour supplied by small local shims (macOS has neither; the pod and
`ubuntu-latest` both do):

```
READ run=20261102T063429Z probed=18 states=['REACHABLE'] rows=43 decision=HOLD
```

18 sources probed, every one REACHABLE, 43 routing rows, every row HOLD. The gate admitted the
atom the public root would sign. That day is landed by the workflow's own pull request, on the
same path-restricted terms the pod's land job enforced.
