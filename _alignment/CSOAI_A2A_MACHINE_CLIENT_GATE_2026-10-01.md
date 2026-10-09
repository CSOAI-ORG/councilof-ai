# A2A card machine-client gate — 1 October 2026

At 13:37:32 UTC, the read-only probe `scripts/public_a2a_client_probe.py` fetched the same public card with two user-agent strings using Python's HTTP client. `curl/8.7.1` received HTTP 200, 18,702 bytes of `application/a2a+json`, SHA-256 `91d3918b65a17e8db38649c39004cbcbbe86cd3d08539d8fbfa10773e98ec188`, 12 skills, CF-Ray `a43bdcd2681ceb1d-MAN`. `Python-urllib/3.14` received HTTP 403 and a Cloudflare 1010 page, CF-Ray `a43bdcd31af4eb1d-MAN`. The probe exits 1 until both clients read byte-identical JSON. This is an access failure for an ordinary machine client, not evidence that the card bytes are wrong or that A2A invocation failed.

The Cloudflare account owner should inspect Security Events using the blocked Ray ID and timestamp before changing a rule. If Browser Integrity Check is the matching cause, Cloudflare documents a custom `skip` rule for **BIC only**. Proposed scope is `GET`, exact path `/.well-known/agent-card.json`, and the affected machine-client signature; keep all other protections. Do not apply a generic bot/WAF bypass. If a different rule caused 1010, fix that specific rule instead. Run the probe from an ordinary external client after the change, and confirm both status and exact bytes. No zone setting was changed by this work.

Official references: [Browser Integrity Check](https://developers.cloudflare.com/waf/tools/browser-integrity-check/), [skip action](https://developers.cloudflare.com/waf/custom-rules/skip/), [skip options](https://developers.cloudflare.com/waf/custom-rules/skip/options/).

State: `TESTED_FAILURE`; production rule: `UNCHANGED`; successful Python readback: `NOT_OBSERVED`; A2A invoke: `NOT_TESTED_IN_THIS_PROBE`.

## Build-pod read-only follow-up

The build pod's existing Wrangler OAuth session is active and allowed a zone list and a short Cloudflare Security Events GraphQL query. The 13:35–13:40 UTC sampled window returned two unrelated blocks, including one with `source: bic`, but **did not contain the Python request's Ray ID**. This proves BIC is active on the zone, not that BIC caused this particular blocked request. A direct read of the zone's `browser_check` setting returned HTTP 403 / Cloudflare error 9109, so this OAuth session cannot inspect or change the setting. No production configuration was changed. The Cloudflare account's Security Events UI or a separately authorized security-read token must resolve the exact Ray before any narrow exception is installed.
