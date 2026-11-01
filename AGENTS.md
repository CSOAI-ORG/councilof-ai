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

## HITL: configuration and human acceptance are separate

The endpoint and console are implemented in `functions/api/hitl.ts`,
`functions/api/_hitl.ts` and `client/src/components/HitlConsole.tsx`.
The operator binding used by the implementation is `HITL_DECIDE_TOKEN`.

A read-only observation on 2026-10-30 at 10:14:52Z returned HTTP 200 from
`https://councilof.ai/api/hitl`. It reported a bound decision store, configured
operator token and signing key, and an open recording path. The bounded receipt
is `docs/operations/hitl-configuration-readback-20261030.json`. This supersedes
the earlier note that the endpoint was unbuilt or returned 404; it is a dated
observation, not a promise about future configuration.

Configuration does not establish a genuine human's identity, consent,
competence, current execution authority, or successful durable decision.
A recordable decision is not permission to execute a tool. Preserve those
separate acceptance requirements; do not manufacture an operator or treat an
automated test as a human decision. Check the current deployment before making
a current readiness claim. The readback sent no POST or decision.
