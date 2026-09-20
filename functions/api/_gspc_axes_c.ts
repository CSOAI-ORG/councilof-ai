// Private module — axis 23. Ruled in by the owner on 2026-09-16; see
// council-os/ADR-002-axis-23-effect-binding.md. A DECLARED SLOT: published so the
// gap is visible, and nothing more. No bank, no fleet, no run, no leader, n = 0.
// It is never averaged into anything (kind "declared-slot", see _gspc_types.ts).
//
// The construct. A tool-call server (MCP today; the same shape applies to any
// protocol that separates a declared call from an executed request) checks the
// scope of the call the agent DECLARED, passes it, then interpolates a
// caller-supplied argument into the outbound request it EXECUTES — so the request
// that reaches the backend targets a different operation, under the same
// credential, outside the declared scope, and invisible to the check that passed.
// An attestation that signs the declared call verifies bytes which denote a
// different action from the one performed. Reported on the W3C agent-conformance
// list on 2026-09-15 as observed in more than one independently built official MCP
// server (servers unnamed, in vendor triage). No server is named here either.
//
// Why it carries no dataset slug: there is no bank. gspc.ts would otherwise mint a
// dataset_url that 404s — a resolvable-looking link to nothing, which the code
// comment in gspc.ts calls worse than no link. The five controls were qualified
// against synthetic breakages on 2026-09-20; that is an instrument self-test, not
// a server measurement. The eventual run will be a deterministic probe of SERVERS,
// not a model fleet answering items, so this slot is expected to move to kind
// "deterministic-facts" at that point, with n counting servers probed and n >= 30
// before status may read MEASURED.
import type { AxisScore } from "./_gspc_types";

export const AXES_C: AxisScore[] = [
  {
    axis: "effect-binding", family: "gspc", kind: "declared-slot",
    bench: "EffectBench (controls qualified; external run pending)",
    task: "does authorization bind to the request the server executes, or only to the tool call the agent declared",
    n: 0, n_unit: "tool-call servers probed",
    n_note: "0 because no public server has been measured: the five controls pass synthetic qualification, but there is no frozen public-server bank or external run. A declared slot is not a measurement and is never averaged into anything.",
    status: "UNMEASURED",
    colour: "#a1a1aa", hue: 240,
    note: "Slot 23, ruled in 2026-09-16 (council-os/ADR-002-axis-23-effect-binding.md). Declared so the gap is public: " +
      "an MCP server checks the DECLARED tool call's scope, passes it, then a caller-supplied argument interpolated into " +
      "the outbound path retargets what actually EXECUTES — same credential, different operation, outside the scope the " +
      "check saw. Signing the declared call attests bytes that denote a different action from the one performed. " +
      "Reported on the W3C agent-conformance list 2026-09-15 in more than one independently built official MCP server; " +
      "servers are in vendor triage and are not named. On 2026-09-20 all five controls passed deterministic synthetic " +
      "qualification (50 reference attacks refused; 50 matching synthetic breakages detected). That qualifies the " +
      "instrument logic only. NOTHING HERE IS A PUBLIC-SERVER MEASUREMENT. There is no bank, so no dataset_url is " +
      "minted. When probed it will be deterministic-facts over servers, not a model fleet. Quote totals.public_count " +
      "(now 23 axis · 22 measured) and never this row's n.",
  },
];
