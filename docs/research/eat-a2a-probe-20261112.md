# EAT A2A discovery: prevent false live-card classifications

12 November 2026. Scope: the existing discovery/probe consumer, not model training, skill execution, signing, an active feed refresh or GSPC admission.

## Defect reproduced

At source `0663a4395fc331b904804169b47a427c3a712d3d`, the existing A2A branch of `scripts/auto-eat/probe.py` treated any nonempty HTTP 200 response as a live agent card. Offline transport fixtures demonstrated false LIVE results for HTML maintenance, JSON error, JSON array and duplicate-key JSON bodies. The supplied `/card.json` URL became `/card.json/.well-known/agent-card.json`; it was not fetched as configured. An HTTP 429 response was ultimately reported as PLACEHOLDER. These are reproduced implementation behaviours, not a claim that historical published records actually contained these errors.

## Repair in the existing path

Only `probe_a2a`, its import and its method/limitations declarations change in the existing probe file. Ten other top-level function ASTs, including aggregate, staging and main, remain unchanged. Shared helpers, discovery, feed state, fold bridge, status generator, signing, source owners and schedules are untouched.

The new standard-library helper tries the configured URL as supplied. A `.json` resource or query-bearing URL is exact. Other service base URLs retain the three historical fallback locations; no more than four GETs occur. Legacy `url` cards and modern `supportedInterfaces` cards have conservative minimum typed-field checks. This is deliberately not a complete protocol-schema validator.

HTTP 401/403 stops as HELD, without an alternate route. Rate limits, redirects, server errors and transport failure stop as UNCHECKABLE. A successful HTTP response containing non-card material is not LIVE. A bounded set of 404/410 responses is PLACEHOLDER, not proof that an agent is dead. No redirect is followed, no credentials are sent, and advertised interfaces or skills are never called. Body reads are capped at 65,537 bytes; cards over 65,536 bytes are uncheckable under this method, not disproven.

The existing atom contract still reports unsigned, queued and `auto_measured:false`. Its A2A limitations now explicitly include full protocol conformance and card signature/publisher identity. The 3 KiB payload gate and denominator aggregation are preserved. A valid-looking self-description is not proof of actual capability, identity, authority or safety.

## Executed qualification

- 41 offline Python test methods passed on the connected Linux workspace, zero failures/errors/skips. A 38-method helper subset previously passed in cloud scratch; it is a subset, not 38 additional independent controls.
- Four deliberate source mutations were detected by the same suite: accepting any body, continuing after access denial, guessing after an exact resource URL and removing the byte-read limit. Failure/exception logs were retained, not weakened into passing output.
- Existing entrypoint, aggregate denominator, unchanged other probers and unsigned payload limits are exercised. The three-result fixture remains n=3, LIVE=1, HELD=1, UNCHECKABLE=1 and live fraction 0.3333.
- A single bounded public GET of the Council agent-card endpoint at 01:24:05 UTC returned HTTP 200, 22,025 bytes, SHA-256 `ec195a8ed187e792747ccf009520e5af3ee2764e050f40c9f6f460ab176bed6e`. It passed the metadata shape check. No agent action, task, model or second network request was needed to classify the captured bytes.

The new Vitest wrapper runs the Python suite through the existing scripts-test pipeline and requires exactly 41 executed methods and zero skips. A proposed wrapper is not a completed hosted CI result; record the actual run separately. No new workflow or schedule is introduced.

## Reproduce without network

```sh
python3 -B scripts/auto-eat/test_a2a_card_probe.py
```

Tests mock all transports and the atom writer. Do not invoke the full keeper or signer to reproduce this repair. The existing `probe.py` main also writes probe state; this pass did not run it against live feed files. No historical probe states are relabelled or deleted. The existing owner decides whether to create a separately dated re-probe after review and merge.

## Limitations and next gate

The minimum shape recognises HTTP(S)-addressed legacy and modern interfaces; it is not universal transport or future-version conformance. A valid card can still advertise nonexistent skills or carry an invalid signature. The helper is not a complete egress/SSRF policy or a secure sandbox: approved source selection and deployment network controls remain required. Source rights, correction history, current authority and representative model quality remain separate checks.

After protected review, test the exact merged composition with the other EAT fold/status repairs, retain a dated bounded probe batch and verify downstream denominators without treating a new timestamp as a fresh model measurement. No old signatures, public grades or runtime permissions should be inferred from this change.

## Primary references inspected

- A2A v1.0.1 specification: https://a2a-protocol.org/v1.0.1/specification/
- A2A v0.3.0 specification: https://a2a-protocol.org/v0.3.0/specification/

Both distinguish structured Agent Cards and discovery from actually executing tasks. This contribution makes no A2A certification, complete conformance or novelty claim. Exact source pins and observations are in `qualification/eat-a2a-probe-20261112/results.json`.
