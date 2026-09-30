# GSPC Route — pod service (decide-only)

Code Apache-2.0. The route record profile (`packages/evidence-fabric/schema/route-evidence-0.1.schema.json`) is CC0-1.0.

GSPC Route applies the **caller's** policy to **our** published measurements and returns the chosen path with an
**unsigned** route record: `csoai.evidence-event/0.1` with `profile: csoai.route-evidence/0.1`. Routing is not
ranking: a choice is named "separated leader" only when the board separated that comparison
(`functions/_lib/leaderLabel.ts`); otherwise it is TIE or UNTESTED and the caller's `tie_break` decides.

One core, three doors:

| Door | Where |
|---|---|
| MCP tool `route` (free, read-only) | `POST /mcp` and `POST /mcp/free` — `functions/mcp/_route.ts` |
| A2A skill `gspc-route` | `POST /api/a2a` — `functions/api/a2a.ts` |
| Pod service | this folder: `route_service.mjs` behind agentgateway v1.5.0, loopback only |

The core is `functions/_lib/route/` (TypeScript). `build.sh` bundles that same core for the pod; nothing is
re-implemented.

## Policy (Cedar)

`functions/_lib/route/policy/` holds the rendered Cedar: `gspc-route.cedarschema`, the fixed GSPC floor
(`floor.cedar`: forbid effect-binding DIVERGENT, destructive without confirm, paid without a caller wallet,
non-public data to a candidate that did not declare that class) and the caller presets (`presets/*.cedar`). The
`harness/openshell-cedar` rule is carried over: **nothing not understood becomes an allow**. An unknown policy key
or preset emits no permit, and an unknown candidate attribute makes that candidate UNCHECKABLE. Sponsor, bid and
placement fields are dropped before any rule sees them and listed as `ignored_fields`.

The edge evaluates the emitted rule shapes in TypeScript (the cedar-wasm bundle size against the Pages Function
limit is UNCONFIRMED). `test_route_service.py` re-runs the SAME rendered Cedar through `cedar authorize`
(cedar-policy-cli 4.13.0) for every golden case and requires identical decisions.

## Run (4090 builder, shared, one job at a time)

```sh
bash services/gspc-router/build.sh            # on a host with node_modules: bundles dist/route-core.mjs
bash services/gspc-router/run.sh              # ollama + route_service (127.0.0.1:8790) + agentgateway (:3900)
bash services/gspc-router/smoke.sh            # 5 tasks -> 5 records, each checked by verify.py --structure
CEDAR=$(command -v cedar) python3 -m pytest services/gspc-router -q
bash services/gspc-router/run.sh stop
```

Local Ollama models are caller-owned `local_gpu` candidates (declared cost 0); the service reads their list from
`/api/tags` and never sends them a prompt. `/v1/chat/completions`, `/route_execute` and `mode: "execute"` answer
**501 NOT_ENABLED**.

## Not built (owner decisions, spec §8)

`route_execute`, executing `/v1/chat/completions`, x402 amounts, the route signing key (`#route-evidence-1`),
and caller-key passthrough. Records stay `signature: null`, `state: UNMEASURED`, `value: null` until those
rulings exist.

## Limits

- Only the board's top two rows per axis carry numbers (from `separation_evidence`); every other candidate is
  UNTESTED on that axis.
- Effect-binding census (30 Sep 2026): the core reads /interop/effect-binding-census-index.json (built by
  scripts/effect-binding/eb_census_index.py from the latest SIGNED server-probe run; CENSUS_URL / CENSUS_FILE here).
  DOES_NOT_BIND is DIVERGENT and the floor forbids it; BINDS is CONSISTENT; every other outcome, an endpoint the run
  did not probe, and an unreadable index are UNMEASURED. Tests: functions/_lib/route/census.test.ts (fail-first).
- agentgateway v1.5.0 has no per-gateway `bindAddress`; port 3900 is not published by the pod, and every route
  refuses a non-loopback source (a request to the pod's own interface address answered 403).
