# CSOAI public-root promotion review — 24 September 2026

## State at 14:21 UTC

- RunPod bare master: `6112df273de808f4b7d9e257cc63137770dc131b`.
- RunPod bare `refs/heads/public-root/pending`: **absent**. There was no root to promote.
- No signing, timestamping, master update, Cloudflare deployment, or production install was performed in this lane.

## Source-only candidate

- Local branch: `codex/root-promotion-review-20260924`.
- Commit: `3ce69cf5623bd5c773b8ee9c90ad63e41ae688ed`.
- RunPod bare review ref: `refs/heads/codex/root-promotion-review-20260924` at the same commit; master untouched.
- Transfer bundle SHA-256: `8db6f86267ac42d2cf464007af742449be2f6a5184714d8fd96e17fafffbd8e5`.
- Changed paths: `scripts/runpod_public_root_promote.py`, `tests/test_runpod_public_root_promote.py` only.
- Depends on reviewed root-writer source ref `refs/heads/codex/root-live-preflight-review-20260924` (`8d0448acfbd3616bbe86481c55ae37c7c732c4f8`), which is the commit's parent.

The candidate reuses the existing local bare repository, root writer lock, hourly lander lock, root-witness release gate, sitemap source guard, build-gates script, and direct Cloudflare Pages deployer. It has no schedule. `--check` reads unverified pending metadata only. `--run` is restricted to the dedicated root publisher checkout after source review and installation.

For exactly one pending candidate, it requires a `CONFIRMED_BITCOIN` sidecar with named blocks, validates the exact proof and signed root through the candidate gate, rejects non-public branch changes and roots older than master, and merges current master into the candidate without choosing conflict sides. It refuses any change to root, sidecar, pointer or binary OTS proof bytes. It runs the existing sitemap and build gates, pins an immutable release ref, and compares the current master and pending ref immediately before a compare-and-swap master update. The deployer then uploads that pinned ref. The promoter accepts success only after anonymous exact-byte readback of root, sidecar, pointer and proof, followed by the live root gate. It holds the hourly landing lock from master update through served readback, and clears pending only on success.

## Tests and limits

- M4: 8/8 new Git-fixture tests pass; 6/6 existing root-writer tests pass; Python compile and staged diff whitespace checks pass.
- RunPod Linux: the transferred ref's 8/8 tests pass from an isolated `/tmp` extraction.
- Tests cover confirmed versus pending OTS, non-public and older-root rejection, merge byte preservation, binary exact readback, a false-green build script, silent deploy-lock return, and upload without matching served bytes.
- These tests do **not** prove the production signer, Bitcoin confirmation, Cloudflare deploy, or served root is working. The candidate has not run against a real pending root; review of script, dependencies and on-pod installation is required first.
- The current production root freshness gap remains because there is no `public-root/pending` candidate in the RunPod bare repository. The root writer is source-only, not installed as a schedule in this lane.

## Safe next gate

After the existing signer finishes, inspect the bare `public-root/pending` ref and its exact sidecar. If absent or pending Bitcoin, there is no promotion. Only after code review and installation into the dedicated checkout should a separate release operator run the dormant promoter. Require its `SERVED_CONFIRMED` output and independently re-fetch the four public bytes before describing a root as live.
