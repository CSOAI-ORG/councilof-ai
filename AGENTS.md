# AGENTS.md — Council of AI monorepo

ONE source of truth. All public surfaces (PyPI, npm, HF, Kaggle, GitHub org)
are GENERATED MIRRORS from this monorepo.

- Never reference internal codenames (SOVOS, sov6, OWEM, SOV-*) in public output
- Measurement credentials, never certification
- Package rename: sovos-* → csoai-* (e.g. sovos_core → csoai_core)
- Never git add -A (multi-lane)
- Deploy: **GHA on master only** (push to master triggers `deploy.yml`; direct wrangler is owner-only per DEPLOY-LOCK.md)

## The GSPC grader has exactly one home

`harness/gspc-top100/mill_hub_queue.py` — `read_label()` — is the grader the board's
signed cards were produced with. `harness/arena/axis_arena.py`'s `score()` is a
DIFFERENT, lenient grader (word overlap; `"no"` is a substring of `"not"`), so a
number produced with it is not a board number. Import the mill's grader; never
re-implement it. `harness/bench/run_bench.py` is the runnable surface over it.

## Platform flavours are rendered, not hand-written

`scripts/harness-x/render.mjs` emits one plugin into every platform's format
(Claude, Cursor, Grok, Antigravity, Kimi). A flavour added here needs (a) a target
row in `council-os/distribution.json`, (b) `STEPS[id]` in the renderer, (c) a
`published_channels` row, (d) that platform's own rules held in CI. Kimi's rules
live in `scripts/harness-x/kimi-plugin.node-test.mjs` because Kimi's validator is
inside the Kimi application and CI cannot run it.

## HITL: only the back end is built

`scripts/hitl/hitl_probe.py` is the client-side elicitation probe (a server that
elicits must stop when the human declines; no secrets in form mode) and it passes
its controls. The END-USER decision path — a human deciding on a raised challenge,
gated by a competency module and returning a signed receipt — is NOT BUILT here:
`/api/hitl` returns 404 live and `COUNCIL_HITL_DECIDE_TOKEN` appears nowhere in
the repo. Do not describe it as working; it is a gap.
