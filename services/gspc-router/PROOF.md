# GSPC Route: fail-first proof

## execute (lane gspc-route-exec-20260930)

`functions/_lib/route/execute.test.ts` has 37 tests in six groups. Each group went red against every planted
violation listed below. The plants were applied one at a time on the builder pod by `/root/plants.py`: copy the
file, apply one replacement, run `vitest -t '^<group>\.'`, restore the file. After all plants were restored the
suite went green (37/37).

| group | property | plant (file: change) | red |
|---|---|---|---|
| A | no caller key reaches logs, storage or the outbound request | execute.ts: credentialPaths result replaced by [] | 5 failed |
| A | | execute.ts: outbound headers gain `authorization: Bearer <api_key>` and an extra header | 1 failed |
| B | DIVERGENT refused without allow_divergent_effect_binding | policy.ts: floor override honoured when the flag is anything but undefined | 3 failed |
| B | | census.ts: a tool-level ACCEPTS_SILENTLY is not applied | 2 failed |
| C | no payment without an observed 402 and a confirm of that challenge | execute.ts: confirmed = x_payment present (challenge sha and wallet not checked) | 1 failed |
| C | | execute.ts: NO_CHALLENGE skipped when the caller sent a payment | 1 failed |
| D | server-side writes impossible | execute.ts: third-party tool accepted on the caller's read_only claim | 3 failed |
| D | | candidates.ts: caller's read_only/paid declaration overrides the fleet annotations | 1 failed |
| E | policy fail-closed | policy.ts: caller permit emitted even when the policy has uncheckable elements | 1 failed |
| E | | execute.ts: signer-unavailable check bypassed | 1 failed |
| F | receipts verify under #route-attestation-1 | sign.ts: signature over event_id + "#" | 4 failed |
| F | | execute.ts: execution block rewritten after signing | 4 failed |

The first F plant (signing `rec.locator ?? rec.event_id`) was a no-op, because a route record has no top-level
`locator`. It stayed green, so it was replaced with the plant above. It is recorded here because a plant that
changes nothing proves nothing.
