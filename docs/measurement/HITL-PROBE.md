# HITL elicitation probe (pilot)

**Status:** PILOT. This is not on the board and is not a board axis. The artifact is unsigned
and has not been deployed. It is a draft instrument with one bounded pilot run. It makes no public claim.

Code: `scripts/hitl/hitl_probe.py`, `scripts/hitl/hitl_fake_server.py`, `scripts/hitl/test_hitl_probe.py`.
Draft artifact: `public/interop/hitl-elicitation-probe-2026-09-24.json` (`signed: false`).

## Construct

A remote MCP server can stop part-way through a tool call and ask the human for input. It does
this by sending the client an `elicitation/create` request
([MCP 2025-11-25, client/elicitation](https://modelcontextprotocol.io/specification/2025-11-25/client/elicitation)).
The human can **accept**, **decline** (an explicit no) or **cancel** (dismiss without choosing).

The probe asks two questions:

1. **Decline / cancel behaviour.** The probe answers the request with `decline`. Does the
   server then end the call with an error or a stated acknowledgement? Or does it return a
   result as if the human had agreed? The probe then repeats the same call once, answers
   `cancel`, and records that outcome separately.
2. **Sensitive data in form mode.** Does any form-mode request ask for a secret or credential?
   The spec forbids this: "Servers **MUST NOT** use form mode elicitation to request sensitive
   information such as passwords, API keys, access tokens, or payment credentials". It also
   requires: "Servers **MUST** use URL mode for interactions involving such sensitive information".

The spec does not require a server to abort after a decline. It says servers should "handle
explicit decline (e.g., offer alternatives)" and "handle dismissal (e.g., prompt again later)".
So question 1 measures a behaviour, not spec conformance. `PROCEEDS_AFTER_DECLINE` records
what happened. It does not record a fault. Question 2 is a check against a spec MUST NOT.

## How it works

- At `initialize` the probe declares `capabilities.elicitation = {"form": {}, "url": {}}` and
  offers `protocolVersion` `2025-11-25`. It records the version the server negotiates.
  Elicitation exists only from `2025-06-18` onwards, and URL mode only from `2025-11-25`.
- It records whether the server's initialize capabilities keys, its `instructions`, or any tool
  name, title or description mention elicitation or user confirmation (`MENTION_RE`).
- Responses are read as streams. A server request is answered while the call is still open,
  whichever of these channels it arrives on:
  - the SSE stream of the POST response;
  - the standalone GET SSE stream (streamable-http, opened when the server issues a session id);
  - the legacy HTTP+SSE stream (2024-11-05 transport).
- It calls up to three read-only tools, one after another. It stops at the first call during
  which an elicitation arrives. It then repeats that one call once, answering `cancel`.
- For each elicitation it records:
  - the mode, and whether the mode field was omitted;
  - the first 300 characters of the message;
  - the schema field **names**, types and formats, and which fields are required;
  - any sensitive term matched, with the field it matched in;
  - for URL mode, the host only;
  - the channel it arrived on, and the answer the probe gave.
- It never records a default value, an enum value or a user value. There are none to record,
  because the probe never answers `accept`.

## Verdicts (deterministic, no model)

The table describes what the server did after the probe answered `decline`:

| after the decline | meaning |
|---|---|
| `STOPPED_WITH_ERROR` | HTTP >= 400, JSON-RPC error, or `result.isError: true` |
| `STOPPED_ACKNOWLEDGED` | non-error result whose first 400 characters of text match `ACK_RE` (declin, cancel, abort, did not confirm, …) |
| `PROCEEDED` | non-error result without such an acknowledgement |
| `NO_FINAL_RESPONSE` | nothing within 45 s |

| server outcome | rule |
|---|---|
| `HONOURS_DECLINE` | the decline call was `STOPPED_WITH_ERROR` or `STOPPED_ACKNOWLEDGED` |
| `PROCEEDS_AFTER_DECLINE` | the decline call was `PROCEEDED` |
| `UNCHECKABLE` | elicitation seen but `NO_FINAL_RESPONSE`; or auth wall (401/402/403); or 429 |
| `URL_ELICITATION_REQUIRED_ERROR` | the call ended with `-32042` before any `elicitation/create`, so there was nothing to decline |
| `NO_ELICITATION_OBSERVED` | read-only calls completed and no elicitation arrived. **Not a pass.** Most servers land here |
| `NO_READONLY_TOOL`, `NO_TOOLS`, `UNREACHABLE` | dropped, with the reason recorded |

Flags:

- `FORM_MODE_SENSITIVE_REQUEST`
- `REPROMPTS_AFTER_DECLINE`
- `PROCEEDS_AFTER_CANCEL`
- `FORM_MESSAGE_CONTAINS_URL` (the spec says SHOULD NOT)
- `ELICITED_ON_GET_STREAM`

The cancel repeat is recorded as one of `HONOURS_CANCEL`, `PROCEEDS_AFTER_CANCEL`,
`NO_ELICITATION_ON_REPEAT`, `UNCHECKABLE` or `NOT_RUN`.

**n** is the number of servers on which an `elicitation/create` was actually received. Every
other count is published beside n with its own denominator, and none of them is counted inside it.
The two sampling strata (`random` and `registry_text_hint`) are reported separately and never pooled.

## Safety rules

These are carried over from the effect-binding server probe.

- **Read-only tools only.** A tool qualifies only if its name has a read verb and no write word,
  its description announces no mutation, and it is not annotated `readOnlyHint: false` or
  `destructiveHint: true`. A control server that offers only a destructive tool must receive
  zero `tools/call`.
- **Call budget.** Per server: one `initialize`, one `tools/list`, at most three read-only calls,
  plus at most one repeat of the same call for the cancel answer.
- **No data is ever handed over.** The probe never answers `accept` and never supplies a value.
- **URL-mode URLs are never fetched or opened.** Only the host is recorded.
- **Other server requests are refused.** Any server-to-client request other than
  `elicitation/create` and `ping` gets `-32601`. Sampling and roots were not declared.
- **Pacing.** At least 2 s between requests to the same host. A 429 stops that host for the rest of the run.
- **Identification.** User-Agent `CSOAI-hitl-elicitation-probe/0.1 (+https://councilof.ai; nicholas@csoai.org)`,
  and a `clientInfo` that names councilof.ai.
- **No credentials.** An auth wall means `UNCHECKABLE`, and the probe makes no attempt to get a credential.
- **Everything is logged.** Every request and response goes verbatim into a JSONL log, and the
  artifact publishes the log's sha256.

## Controls and grader-can-fail

`hitl_probe.py controls OUTDIR` runs before any public server is contacted. If any control is
misgraded, it writes `ABORT.json` and the pilot refuses to start. Each control is a local fake server:

| control | expected |
|---|---|
| honours (error after decline) | `HONOURS_DECLINE`, cancel `HONOURS_CANCEL` |
| honours_ack (non-error "Cancelled: the user declined") | `HONOURS_DECLINE` |
| proceeds | `PROCEEDS_AFTER_DECLINE` + `PROCEEDS_AFTER_CANCEL` |
| password in form mode | `HONOURS_DECLINE` + `FORM_MODE_SENSITIVE_REQUEST` |
| API key via URL mode | `HONOURS_DECLINE`, **no** sensitive flag |
| never elicits | `NO_ELICITATION_OBSERVED` |
| JSON responses + elicitation on GET stream | `PROCEEDS_AFTER_DECLINE` + `ELICITED_ON_GET_STREAM` |
| legacy SSE transport | `HONOURS_DECLINE` |
| `-32042` URL elicitation required | `URL_ELICITATION_REQUIRED_ERROR` |
| destructive tool only | `NO_READONLY_TOOL`, 0 tool calls received |

**Grader-can-fail check.** The controls run once more with one defect injected on purpose:
`errors_are_success`, which reads an error after a decline as the server proceeding. The
verdict on the honours control must then change. If it does not change, the run aborts.

Unit tests: `python3 -m unittest scripts/hitl/test_hitl_probe.py -v`.

## Limitations

- **Most servers will not elicit during read-only calls.** Elicitation is usually attached to
  writes, payments or account actions, and the probe refuses to call those.
  `NO_ELICITATION_OBSERVED` says nothing about a server's write paths.
- **Proceeding after a decline may be correct.** The elicitation may have been optional, for
  example "also save this preference?".
- **`STOPPED_ACKNOWLEDGED` is a keyword match**, so it can be wrong in both directions:
  - a result that mentions a cancelled item is read as an acknowledgement, which overstates `HONOURS`;
  - an acknowledgement worded outside the regex is read as `PROCEEDED`, which overstates `PROCEEDS`.

  Every match and every proceeded excerpt is published so a reader can re-grade.
- **An error after a decline may be unrelated.** The tool may simply have failed on synthesised arguments.
- **`FORM_MODE_SENSITIVE_REQUEST` is a keyword match.** For example, `token` in a crypto server
  may name an asset rather than a credential. Matched terms are published verbatim.
- **GET-stream requests are seen only when possible.** A request sent only on the standalone GET
  stream is seen only when the server issued a session id and accepted the GET. A stateless
  server cannot deliver a nested request at all.
- **Authenticated servers are excluded** (`UNCHECKABLE`). Elicitation may be more common behind auth.
- **Synthesised arguments can hide elicitation.** Arguments are built from the schema. A tool that
  errors on a synthesised value never reaches the code path that would elicit.
- **One day, one vantage point** (RunPod, one IPv4). The registry is mutable. The pilot reuses the
  2026-09-22 registry harvest bank.

## What it is NOT evidence of

- Any vendor's security posture beyond the logged bytes.
- A board axis or a board score.
- Conformity of any server with the MCP specification as a whole.
- Behaviour on write paths, which were never called.
- Whether any user was ever harmed.

## Pilot, 2026-09-24 (draft, unsigned)

This pilot was a bounded run. It used the 2026-09-22 registry harvest bank (third-party rows,
excluding A2A rows), with seed `20260924`. The artifact holds the exact names chosen.

- **Two strata.** 240 servers were drawn by seeded random sampling (`random`). Another 60 were
  drawn from the 311 rows whose registry description matches
  `elicit|human-in-the-loop|hitl|confirm|approv|consent|interactive` (`registry_text_hint`).
  The two strata are never pooled.
- **Result: n = 0 in both strata.** None of the 173 servers that received a read-only
  `tools/call` sent an `elicitation/create` (146 in the random stratum, 27 in the hint stratum).
  So there is no decline/cancel verdict and no form-mode-sensitive count, and no rate is published.
- **Where the confirmation language sits.** When elicitation or user-confirmation wording appears
  in a server's own surface at all, it is mostly on tools that the read-only rule refuses to call
  (`apply_actions`, `deploy_application`, `publish_linkedin_post`, `initiate_payment`,
  `create_order`, …). This is the main limitation above, now observed rather than assumed.
- **What shows the probe can discriminate.** For now, only the controls.

Taking this construct further needs one of two things, and neither is in scope for this lane:
1. a separate, owner-ruled safety design for exercising write paths without effect;
2. servers that opt in.
