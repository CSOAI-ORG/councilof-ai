# harness/redteam — red-team as product (J34)

A continuous adversarial suite **scaffold** whose results publish as **signed evidence cards**.
The attack families are a runnable registry; each runnable family emits a `card-v0`
(`surface: redteam.evidence`) written **QUEUED** (`sig_ed25519: null`) — signed later by GHA
`#card-attestation-1`, never a laptop.

## One real family today

**`jailbreak-replay`** — deterministic, GPU-free. Replays the signed jailbreak-ASR evidence
pack (frozen measured outcomes on the `gspc-jail-v2` bank), recomputes refusal_rate and ASR
from the recorded counts, checks each recorded value against the recompute (a consistency
finding), and ranks the worst offenders. It re-measures nothing with a model — the ASR is a
property of that bank as already measured; the replay adds the deterministic recompute + check.

```bash
python3 harness/redteam/runner.py --list
python3 harness/redteam/runner.py --family jailbreak-replay --write
```

## Roadmap (declared, NOT implemented)

`prompt-injection-suite` · `many-shot-jailbreak` · `encoding-obfuscation` · `tool-poisoning`
· `memory-poisoning` · `data-exfiltration`. Each is in the registry as `None`; the runner
returns **UNCHECKABLE** for them — a family with no code can never be reported as a pass
(three-state, structurally).

## Honesty

Results are on the stated bank ONLY — not a general property, not a forecast of real-world
exploitability. Cards are queued unsigned; signing is GHA-only. Tests:
`python3 harness/redteam/test_redteam.py`.
