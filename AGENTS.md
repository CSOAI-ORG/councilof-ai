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

## HITL: distinguish deployed state from end-to-end acceptance

The decision path has source in `functions/api/hitl.ts`,
`functions/api/_hitl.ts` and `client/src/components/HitlConsole.tsx`.
The configured operator-token binding is `HITL_DECIDE_TOKEN`.
Do not repeat the historical claim that the end-user path is absent or that
`/api/hitl` always returns 404.

Read-only observation on 2026-10-29: `/api/hitl` reported a bound store, an open
decision path, configured operator token and signing key, and two approved
records. `/api/hitl/record` returned those records with competency and signature
fields. This observation did not independently verify their signatures or run
a new challenge, human decision and protected action end to end.

Keep those evidence levels separate. A configured shared operator token is not
proof of a named person's enterprise identity; a recorded competency answer is
not a general competence credential. Before claiming an integration enforces
human authority, test approval, decline, expiry, revocation, changed action
bytes and duplicate/resumed execution against that exact host version.
`scripts/hitl/hitl_probe.py` covers client-side elicitation controls; its results
do not by themselves establish those wider properties.
