# ChatGPT-plan Responses subject — private compute candidate

This adds a sibling transport to the existing GSPC harness. It reuses the frozen
bank loader, prompt composer, exact-label parser, keyword grader, allowlist and
unsigned-card assembly. It does not modify the Ollama or Anthropic transports.

## Subject and method boundary

The subject is `chatgpt-plan-responses:<expected returned model>@sha256:<account catalogue record digest>`.
The digest pins an endpoint record, not model weights. A Codex CLI/agent workflow
is a different subject and must not be silently substituted.

The supported Sign in with ChatGPT plan flow uses the public Responses endpoint,
an OAuth grant containing `chatgpt.tokens.use.direct`, an account-available model,
`store:false`, `stream:true` and an input array. The worker omits preview-unsupported
sampling/token-cap fields and tools. It records provider-default sampling.

Primary references:
- https://developers.openai.com/siwc/token-sharing-open-source/sign-in
- https://developers.openai.com/siwc/token-sharing-open-source/models-and-inference
- https://developers.openai.com/siwc/token-sharing-open-source/preview-limitations

Registration, validated-ID-token/account/host provenance, credential custody and
main control-plane method admission remain external requirements. Private metadata
JSON is not a signature or authority grant. The worker never registers, refreshes,
starts a listener, reads a Codex/Mac session store or transfers credentials.
Only an already qualified dedicated remote SIWC credential can be supplied.
An identity-only grant is refused locally before HTTP.

## Output and evidence

Only the final completed response with the expected returned model, valid usage
and assistant text can reach the existing graders. Deltas and HTTP200 alone do
not count. Refusal, incomplete/failed/error, model mismatch, unknown usage, malformed
or replayed SSE and local bounds remain separate exclusions.

A one-request pilot never retries or proceeds to another inference. Explicitly
admitted full-bank execution can continue known-terminal/model-bound/known-usage
refusal, unparsed, empty or incomplete exclusions. Unknown transport state,
usage failure, failed response or attribution errors halt. Excluded outputs still
retain observed tokens; unknown usage is separate. No token/credit/USD conversion,
provider cancellation or hard billing ceiling is claimed.

An owner admission binds a canonical normalized `job_sha256`, including local
clock/byte bounds and label set, plus source, bank, model, connection and evidence
root pins. Source drift, bank drift and duplicate run directories refuse.
Raw received streams/prefixes and per-attempt records are append-only. Sampling
and source/instrument differences remain visible.

## Verification and release

The changed-only unittest module uses synthetic transports and temporary banks.
Its audit hook denies sockets/DNS and child creation before project import. It
covers terminal/identity/usage/refusal controls, fixed-route/no-retry behavior,
bounds, admission/source/bank/label invariants, full-bank and pilot traversal and
retained evidence. The existing required gates explicitly invoke this module.

Local execution was held by resource admission during preparation. Do not infer
a pass from this document; inspect the exact commit's normal hosted CI log.
No live inference, credential qualification, unsigned-candidate admission, signing,
public score or deployment is established by offline fixtures or a source PR.
