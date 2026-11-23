# Sequential-failure laboratory: paired-machine execution receipt

Date: **22 November 2026**. State: `SYNTHETIC`, not a measured failure rate for MEOK.

The source is `trajectory_lab.py`; regression tests are `test_trajectory_lab.py`. Both online authorised Macs received the same committed source in isolated research directories. They ran the complete package test suite **24/24 PASS** and independently emitted the identical trajectory report SHA-256:

`79e2c7af1762e4c0f85d9f02f59cf3480c094f62837e35636caa5bc0201d9d67`

Command:

```sh
python3 -B -m unittest -v test_two_path_council.py test_historical_twelve.py test_trajectory_lab.py
python3 -B trajectory_lab.py > trajectory-current.json
```

Parameters: 10,000 synthetic trajectories **per mode and path length**, q=0.97 per-step success, 0.2 intraclass same-session correlation (beta-binomial exchangeable error model), detection chance 0.8, successful rollback chance conditional on detection 0.95, seed 20261122, path lengths 1, 2, 4, 8, 16, 32.

| Path length | Error model | Clean first pass | No escaped fault | P(3+ faults) |
| ---: | --- | ---: | ---: | ---: |
| 8 | independent | 0.7860 | 0.9453 | 0.0024 |
| 8 | shared-session | 0.8706 | 0.9524 | 0.0259 |
| 16 | independent | 0.6196 | 0.8930 | 0.0103 |
| 16 | shared-session | 0.8097 | 0.9185 | 0.0693 |
| 32 | independent | 0.3817 | 0.7947 | 0.0691 |
| 32 | shared-session | 0.7516 | 0.8695 | 0.1212 |

**Caution about interpretation:** Shared-session variation can increase the proportion of entirely clean tasks while simultaneously concentrating faults into rare high-failure sessions. This happens under the chosen beta-binomial assumptions. It is not proof that correlated models are safer on average or that MEOK has this empirical correlation.

The rollback condition here is an **assumed stochastic control**, not a verified real-world rollback. A detected and corrected fault remains a failed first pass. Wilson intervals are included in machine-readable output; no actual external side effects were attempted.

The corresponding real next step is to qualify recorded, safely sandboxed MEOK task trajectories; classify per-step error dependence, detection, revocation and confirmed effect receipts; then choose a held-out sample and independently validate the instrument.
