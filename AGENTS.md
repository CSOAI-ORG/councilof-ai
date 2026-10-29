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

## HITL: distinguish the review console from execution authority

`scripts/hitl/hitl_probe.py` covers client-side elicitation: a server that elicits
must stop when the human declines, and form mode must not request secrets.

Public readback on 29 October 2026: `GET /api/hitl` answers 200 and reports a
bound decision store, configured operator token and configured signing key.
The public staff console is at `/dashboard?tab=staff`. This supersedes the earlier
404 claim; it is a dated deployment observation, not a permanent
assertion that every deployment has those bindings.

Do not equate that status response, a competency reading check or a saved decision
with authenticated human identity, permission to execute, or proof that a tool
respected the decision. An end-to-end claim needs a decision bound to the exact
proposed action, enforcement at dispatch, rejection/expiry/replay tests, and the
retained observed effect. Agents must not manufacture a human decision to pass a test.

