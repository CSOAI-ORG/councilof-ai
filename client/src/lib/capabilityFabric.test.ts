import { describe, expect, it } from "vitest";
import {
  fabricCounts,
  parseActionContractStatus,
  parseCapabilityFabric,
} from "./capabilityFabric";

const fixture = {
  schema: "csoai.capability-fabric/0.1",
  observed_at: "2026-09-04T06:00:00Z",
  rails: [
    {
      id: "mcp",
      label: "MCP tools",
      role: "action registry",
      protocol: "MCP",
      state: "RUNTIME_OBSERVED",
      observed_at: "2026-09-04T06:00:00Z",
      endpoint: "/mcp",
      writes_board: true,
      evidence_ref: "tools/list",
      summary: "12 tools returned",
      freshness_seconds: 0,
      last_error: null,
    },
    {
      id: "a2a",
      state: "UNREACHABLE",
      summary: "discovery only",
    },
  ],
  action_contract: {
    schema: "csoai.capability-action-contract/0.1",
    policy: { mode: "FAIL_CLOSED", execution_enabled: false },
    actions: [
      {
        definition: {
          id: "csoai.gspc.board.read",
          version: "0.1.0",
          execution_policy: { enabled: false, executor_ref: null },
        },
        runtime: { execution_enabled: false, execution_observed: false },
      },
    ],
  },
};

describe("capability fabric", () => {
  it("parses normalized rails and never trusts a writes_board claim", () => {
    const parsed = parseCapabilityFabric(fixture);
    expect(parsed.rails[0]).toMatchObject({
      id: "mcp",
      state: "RUNTIME_OBSERVED",
      writes_board: false,
    });
    expect(parsed.rails[1]).toMatchObject({
      label: "a2a",
      role: "capability",
      protocol: "HTTP",
    });
    expect(fabricCounts(parsed)).toMatchObject({
      RUNTIME_OBSERVED: 1,
      UNREACHABLE: 1,
      SIGNED: 0,
    });
    expect(parsed.action_contract).toMatchObject({
      state: "DECLARED_DISABLED",
      execution_enabled: false,
      action_count: 1,
    });
  });

  it("rejects duplicate rails and invented states", () => {
    expect(() =>
      parseCapabilityFabric({
        ...fixture,
        rails: [fixture.rails[0], fixture.rails[0]],
      }),
    ).toThrow(/duplicate/i);
    expect(() =>
      parseCapabilityFabric({
        ...fixture,
        rails: [{ ...fixture.rails[0], state: "LIVE" }],
      }),
    ).toThrow(/unsupported/i);
  });

  it("forces missing or execution-enabled action contracts closed", () => {
    expect(parseActionContractStatus(undefined)).toMatchObject({
      state: "UNCHECKABLE",
      execution_enabled: false,
      action_count: 0,
      last_error: "action contract was absent",
    });
    expect(
      parseActionContractStatus({
        ...fixture.action_contract,
        policy: { mode: "FAIL_CLOSED", execution_enabled: true },
      }),
    ).toMatchObject({
      state: "UNCHECKABLE",
      execution_enabled: false,
      action_count: 0,
    });
  });
});
