# A2A task probe: reproduced failure and isolated source fix

Observed 2026-09-24 15:04 UTC. No production deploy, registry mutation, or measurement was made by this lane.

## External probe, from the directory's own source

At [a2a-registry source commit `19a44e5408a622ed8b61dde795bf3ff19b3b4cd9`](https://github.com/prassanna-ravishankar/a2a-registry/blob/19a44e5408a622ed8b61dde795bf3ff19b3b4cd9/backend/app/smoke_test.py), `smoke_test()` uses `a2a-sdk==1.1.2` `ClientFactory`, resolves the well-known card, and sends a single text Part: `Hello, what can you do?`. It checks that `client.send_message()` yields an event. The worker persists this as `task_conformance`; it is separate from card reachability and schema conformance. Its last recorded CSOAI check, `2026-09-24T02:05:09.992163Z`, was `category=OTHER`, `passed=false` at [the public agent API](https://a2aregistry.org/api/agents/48e5bba6-8848-4adc-8f92-b5fa2c0744e0). That check predates the afternoon A2A release, so its precise historical exception is unavailable outside the registry worker logs.

I reproduced the **current served failure** with that SDK version and the exact probe logic. The SDK POSTed JSON-RPC `SendMessage`, `A2A-Version: 1.0`, `configuration:{}`, and the greeting to `https://councilof.ai/api/a2a`. The endpoint returned HTTP 200 containing JSON-RPC error `-32602` / `INVALID_SKILL_SELECTOR`: `structured Part.data {skill,input} is required (legacy text compatibility is only the exact word `board`)`. The SDK raised `InvalidParamsError`. This exception is not classified specially by the directory's `classify_error()`, so its current source maps it to `OTHER`. A separate direct POST without `A2A-Version` returned `-32009` / `VERSION_NOT_SUPPORTED`, which is the correctly documented v0.3 default rule; that is not the SDK's observed path.

## Source-only fix

Isolated branch `codex/a2a-capability-help-20260924`, commit `822ca1e0e964837ac93231723f8d79598b15f9c2`, based on `a946cc4acce7d1d96a5b8cbeb5141a0686bc32dc`. Only `functions/api/a2a.ts` and `functions/api/a2a.test.ts` changed. The exact discovery greeting, `what can you do?`, and `help` now return a v1 `Message` with the current skill IDs and a `DESCRIPTIVE_ONLY` capability marker. They do not call a measurement source or claim a signed result. Arbitrary text remains rejected, and an absent version header still returns `-32009`. The structured `{skill,input}` path is unchanged.

Focused test command: `vitest run functions/api/a2a.test.ts --reporter=dot` in the sparse isolated worktree, with a disposable Vitest install; **40/40 passed**. The new test matches the SDK probe's request shape (`SendMessage`, greeting Part, `configuration:{}`), asserts a `Message` and zero source fetches, and checks the missing-header rejection. `git diff --check` passed. Worktree: `/Users/nicholas/clawd/wt-a2a-taskprobe-20260924`.

Status: **prepared, not deployed**. A post-release proof requires an anonymous SDK 1.1.2 probe against served bytes and the directory's next daily `task_conformance` readback; only then may the external listing be called task-conformant. Do not re-register the existing listing.
