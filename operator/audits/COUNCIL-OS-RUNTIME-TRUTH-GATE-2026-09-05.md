# Council OS runtime truth gate — 2026-09-05

Scope: the central chat → tool → result → evidence/receipt path, plus the MCP,
AG-UI, A2A and A2UI protocol claims. This is a release gate, not a roadmap or a
certificate. A route answering is runtime evidence for that route only.

## Current truth

| Surface | What executes now | Evidence state and boundary |
| --- | --- | --- |
| Central chat | Local pane navigation; four public MCP reads (`board_totals`, `get_axis`, `list_cards`, `get_root`); browser-only card verification; grounded `/api/chat` answers | MCP calls are `RUNTIME_OBSERVED`, not MEASURED or SIGNED. Navigation is deterministic UI state, not tool execution. The transcript is session storage only. |
| Guarded actions | A fix, deploy, publish, payment, signing or external-contact request opens review | No provider call, payment, board write, fix or receipt is produced. |
| Tool runner | Reads `tools/list` and explicitly invokes `tools/call`; current public catalogue has 11 tools | A successful JSON-RPC response is `runtime_observed`. Paid tools expose the 402 challenge; the browser does not create or sign a payment. |
| MCP HTTP | Discovery, initialization, catalogue and free read calls answer through `/mcp` | Real runtime. Paid settlement and paid artefact delivery remain owner-supervised and unverified by this audit. |
| Request Attestation Service | `/api/request-attestation` returns one parseable x402 acceptance and a free corpus preview | A settled payment is designed to commission a card, but that paid path was not exercised here. It never mints a measurement: `fresh_run` remains `UNMEASURED`; root inclusion remains unmeasured until the public-root writer includes it. |
| Receipt surfaces | Batch preview logic exists | `/api/receipts/latest` currently reports `UNPUBLISHED` with zero items. There is no live settlement-receipt stream on that route. |
| Action ledger | Contract and staging route exist | Current probe reports `durable:false`. The implementation is `SINGLE_WRITER_STAGING`, has no concurrency guarantee and explicitly performs no provider call, worker execution, board write, training or external egress. |
| AG-UI | `/api/agui/gspc-state` emits real `STATE_DELTA` and `TEXT_MESSAGE_CONTENT` SSE derived from `/api/gspc` | Presentation projection only. The central client does not import the AG-UI stream module. The general provider wire returns 503 while `AGUI_WIRE_URL` is unset. |
| A2A | Public agent card declares five skills | Discovery only. `/api/a2a/key` is 404, so there is no public task send/get/cancel runtime. |
| A2UI | Status vocabulary and plans exist | No renderer endpoint or interactive component round trip was found. State is `UNCHECKABLE`. |
| Public evidence | The public root is Ed25519 `SIGNED`; the regulation and XRPL reads are runtime-observed | `/api/fabric` currently downgrades the GSPC board to `UNCHECKABLE` because its signed-card matrix cannot be read. Do not promote a board read to a current measurement receipt. |

## Lifecycle verdict

The working path is **chat → safe MCP read → rendered result**. It stops before a
durable case record. The chat retains prose and a provenance label, but not a
durable structured result, evidence reference, immutable receipt or public-root
inclusion. The mutation path is **intent → review/staging only**. There is no
verified **approve → execute in sandbox → retest → issue scoped card → include in
root → monitor/reopen** loop yet.

## Executable release gates

Do not describe Council OS as end-to-end agentic until every required gate passes.

1. **Grounded language:** the definition of MEASURED names subject lineage,
   instrument version, run and evidence; it explicitly excludes safe, compliant,
   approved and certified. Signing and OTS remain separate states.
2. **MCP read contract:** initialize, `tools/list` and every free tool call must
   return parseable JSON-RPC with an explicit runtime/evidence state. Unknown tools,
   invalid arguments and upstream failures must fail closed.
3. **Chat evidence retention:** after a chat-triggered tool call, persist the raw
   structured result, `observed_at`, source endpoint and evidence reference in a
   durable case. A human-readable `signature` label is not a cryptographic signature.
4. **Payment boundary:** an unpaid call must return a usable 402 challenge and make
   no settlement claim. One owner-supervised low-value payment must prove facilitator
   verify, settle and exact paid artefact delivery before the rail is called live.
5. **Attestation boundary:** verify the returned card under the pinned key. Keep
   `fresh_run: UNMEASURED` and root inclusion unmeasured until the corresponding run
   and public-root leaf are independently observable.
6. **Durable action ledger:** replace single-writer KV staging with serialized
   Durable Object or transactional D1 state; prove auth, idempotency, concurrency,
   retry and recovery before enabling execution.
7. **Fix loop:** connect explicit human approval to a sandboxed executor, capture
   the exact change, rerun the named instrument, issue a scoped receipt and monitor
   the dependency that can reopen the case. Signing/anchoring prove the result; they
   do not perform the fix.
8. **AG-UI consumption:** configure and canary the provider wire, then prove the
   central chat consumes its events, exposes consent checkpoints and survives a
   disconnect without inventing completion.
9. **A2A runtime:** provide stable identity plus task send/get/cancel operations;
   prove state transitions and receipts. The agent card alone is not execution.
10. **A2UI runtime:** implement one declared component schema and prove an agent can
    render it, receive a user action and return the resulting evidence state.
11. **Cross-surface parity:** the website, extension, plugin, app and SDK must call
    the same capability contract and yield the same state grammar and receipt for
    the same request.

## Repeatable checks

Run focused contract tests:

```sh
node_modules/.bin/vitest run \
  functions/api/_chatGrounded.test.ts \
  functions/api/_chatCanon.test.ts \
  client/src/components/lobby/useLobbyChat.test.ts \
  client/src/lib/aguiGspcStream.test.ts \
  functions/api/fabric.test.ts \
  functions/_lib/capabilityActionContract.test.ts \
  functions/api/action-jobs.test.ts \
  functions/mcp/capability-parity.test.ts \
  functions/mcp/paid-tools.test.ts
```

Probe a running preview (replace the origin if necessary):

```sh
ORIGIN=http://127.0.0.1:51026
curl -fsS -X POST "$ORIGIN/mcp" -H 'content-type: application/json' \
  --data '{"jsonrpc":"2.0","id":"gate","method":"tools/list","params":{}}' \
  | jq -e '.result.tools | length > 0'
curl -fsS "$ORIGIN/api/agui/gspc-state" \
  | grep -q 'event: STATE_DELTA'
curl -fsS "$ORIGIN/api/action-jobs" \
  | jq -e '.durable == true and .execution.automatic == true'
curl -fsS "$ORIGIN/api/receipts/latest" \
  | jq -e '.status != "UNPUBLISHED" and (.items | length > 0)'
curl -fsS "$ORIGIN/api/fabric" \
  | jq -e '[.rails[] | select(.state == "UNREACHABLE" or .state == "UNCHECKABLE")] | length == 0'
```

The last three checks intentionally fail against the audited runtime. Turning them
green requires runtime implementation and evidence, not relabelling.

## Local-preview caveat

Vite proxies `/api/*` and `/mcp` to `VITE_DEV_UPSTREAM`; the current preview points
at the public deployment. In addition, the lobby's development default posts chat
directly to `https://councilof.ai/api/chat`. Therefore a browser pass against the
preview proves the deployed API, not an unshipped local Function change. Unit-test
local Functions or run a local Pages runtime before treating a browser result as a
release candidate result.
