# Orphan OpenTimestamps proofs removed from the served release tree

Observed on 2026-09-20 by `python3 scripts/root-witness-release-gate.py --phase candidate`.

These fourteen historical `.ots` files were present under `public/`, but the release gate could not recover their exact target bytes or an exact sidecar binding. They are preserved here as incident evidence and are no longer served as public proofs. Moving them does not invalidate a proof or assert that its bytes are corrupt; it prevents an uncheckable proof from being presented as part of the public release.

The current public-root proof remains at `public/interop/root-dedb49d0.json.ots`. It binds the exact `public/root.json` bytes and independently verifies as `CONFIRMED_BITCOIN`.

Re-admit any proof only with:

1. the exact target bytes;
2. a sidecar naming the target SHA-256 and proof SHA-256;
3. proof parsing that reproduces the target digest; and
4. the release gate passing against the served tree.

Measurement, not certification. Historical presence is preserved; public checkability is the admission rule.
