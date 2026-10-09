# CSOAI A2A directory readback — 2026-09-24 14:56 UTC

Anonymous public reads only. No listing was created, edited, claimed, or submitted.

| Surface | Observed state | Evidence and limit |
|---|---|---|
| a2aregistry.org Council listing | HTTP 200; canonical endpoint `https://councilof.ai/api/a2a`; card version 1.1.0 / protocol version 1.0. Rendered page says “Reachable” and “Last sweep 12 min ago”, but embedded `<time dateTime>` is `2026-09-14T23:27:14Z`. | `https://a2aregistry.org/agents/48e5bba6-8848-4adc-8f92-b5fa2c0744e0/`; response SHA-256 `ce3e48d4c124d1c7bbd7657bfaef9a7ac1d54548a46553ba4521b7bad965879c`. Page text and embedded timestamp disagree; use the API for current health. |
| a2aregistry.org agent API | HTTP 200; `last_health_check=2026-09-24T14:29:04.018138Z`, `is_healthy=true`, `conformance=true`; separate `task_conformance.passed=false` checked `2026-09-24T02:05:09.992163Z` (`category=OTHER`). | `https://a2aregistry.org/api/agents/48e5bba6-8848-4adc-8f92-b5fa2c0744e0`; response SHA-256 `2d00671c5dcc5f2ca4010f4d4155a6a9e017ed663538eba850b5f333c7b27d55`. Reachability/general conformance does not establish task conformance or third-party use. The listing reports an unrecognised `message/send` smoke-test error; no independent task POST was made here. |
| a2a-registry.org Council listing | HTTP 200; `Unknown System (Unclaimed)` / `Unclaimed`; registered 2026-08-22, last checked/updated 2026-09-20. Public HTML includes `https://councilof.ai/api/a2a` and no `workers.dev` URL. | `https://www.a2a-registry.org/agent/ai.councilof.council_of_ai__measurement_agent`; response SHA-256 `7bf49ee70f8f7dbac84559f28d70db68b0c15f200bce1e185fed3dddc670a6da`. “Suggestions” count on page is directory exposure, not usage/adoption. |
| Council public A2A card | HTTP 200; one JSON-RPC v1.0 interface at `https://councilof.ai/api/a2a`. | `https://councilof.ai/.well-known/agent-card.json`; response SHA-256 `b6474156e927483e5e156780f2e0fbd82f12e86d7efd25edc22be597a73aed19`. |
| Council GET A2A interface | HTTP 200; advertises v1.0 `SendMessage`, with `A2A-Version: 1.0` required. Missing/empty version maps to legacy 0.3 and returns `VersionNotSupportedError -32009`; legacy `message/send` is not supported. | `https://councilof.ai/api/a2a`; response SHA-256 `97d9d4cb23553b0b70a9ca3eef33b4eaba337241349af357c6cd18086a05a855`. This explains a plausible legacy smoke-test mismatch; it is an inference, not proof of the directory tester's exact request. |

## Correction route and decision

`a2aregistry.org` documents `PUT /api/agents/{id}` for re-fetching an existing listing from its well-known URI, but it requires an admin key ([directory source](https://github.com/prassanna-ravishankar/a2a-registry)). Its public registration path creates a listing; there is no visible anonymous in-place Scan/Refresh control on the Council detail page. I did not invoke registration because the entry already exists.

`a2a-registry.org` documents authenticated management via `PUT /api/agents/:id`; claiming an organizational listing requires sign-in and DNS TXT verification ([agent guide](https://www.a2a-registry.org/resources/guide/agents), [API guide](https://www.a2a-registry.org/resources/guide/api)). The public `/submit` path does not demonstrate in-place update of this existing ID. I did not submit or change DNS.

**Smallest next action:** retain the live v1.0 card and endpoint as-is. If legacy task conformance is desired, build and test a real 0.3 compatibility adapter before requesting a registry re-scan; otherwise ask the community directory maintainer for an admin recheck of the existing ID through its documented route. Claiming the commercial listing is a separate owner/account/DNS action, not a health repair. No adoption or buyer evidence was observed.
