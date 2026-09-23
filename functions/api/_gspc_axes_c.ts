// Private module — axis 23. Ruled in by the owner on 2026-09-16 as a DECLARED SLOT
// (council-os/ADR-002-axis-23-effect-binding.md) and ruled MEASURED on 2026-09-22 on a
// signed server-probe run. It is a deterministic probe of tool-call SERVERS, not a
// model fleet: n counts servers probed, it has no leader, no accuracy and no
// separation, and it joins no mean (kind "deterministic-facts", see _gspc_types.ts).
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
// server (servers unnamed, in vendor triage). No server is named on the board either;
// the run artifact names endpoints because a public registry listing is public.
//
// Why it carries no dataset slug: the bank is a frozen slice of the public MCP
// registry, published beside the run on the HF mirror, not a HuggingFace dataset of
// items a fleet answers. evidence_url leads to the signed run instead (the rule the
// adoption-loop test enforces: a MEASURED slot is never a dead end).
import type { AxisScore } from "./_gspc_types";

export const AXES_C: AxisScore[] = [
  {
    axis: "effect-binding", family: "gspc", kind: "deterministic-facts",
    bench: "EffectBench v0.1 (server probe)",
    task: "does authorization bind to the request the server executes, or only to the tool call the agent declared",
    n: 261, n_unit: "tool-call servers probed",
    n_note: "261 third-party MCP servers received a verdict (BINDS 0 · PARTIAL 23 · DOES_NOT_BIND 238) out of 600 " +
      "tried from a frozen shuffled slice (seed 20260922) of the 20,992 third-party servers with a remote URL in the " +
      "public MCP registry on 2026-09-22. 230 UNCHECKABLE (141 behind an auth wall), 78 UNREACHABLE, 30 with no " +
      "read-only tool and 1 with no tools are recorded and never counted. A server count, never pooled with bank-item n.",
    status: "MEASURED",
    // No separation field: there is no fleet and no leader, so no separation test is APPLICABLE.
    evidence_url: "/interop/effect-binding-server-probe-2026-09-22.signed.json",
    run_attestation: "ED25519_SIGNED",
    coverage: "261 of 600 servers tried, from a population of 20,992 third-party servers",
    coverage_note:
      "The verdict population is biased toward servers that answer anonymous callers: every server that demanded " +
      "credentials is UNCHECKABLE by rule, never probed and never FAIL. Our own 41 registry entries are tabled " +
      "separately in the artifact and are not in n.",
    colour: "#a1a1aa", hue: 240,
    note: "MEASURED 2026-09-22 (council-os/ADR-002-axis-23-effect-binding.md, ruling appended the same day). " +
      "Deterministic: for each server one in-scope read-only call carrying an unauthorised extra argument (P2), a " +
      "declared-binding-field read (P1), a replay where a nonce field exists (P3, not applicable on this slice) and a " +
      "check for returned evidence (P4). Controls ran first and the grader was proven able to fail. Not a grade, not a " +
      "security claim about any vendor: 'DOES_NOT_BIND' means the unauthorised argument was not refused at the " +
      "boundary, not that the backend used it — the run sees the boundary, not the backend. One operating point, one " +
      "day. The signed companion pins the run artifact by sha256; the artifact's own signed:false field is superseded, " +
      "not edited. Quote totals.public_count and never this row's n as a bank size.",
  },
];
