import { describe, expect, it } from "vitest";
import {
  CAPABILITY_ACTION_DEFINITIONS,
  CAPABILITY_PROTOCOLS,
  buildCapabilityActionContract,
  type CapabilityObservationState,
  type CapabilityRailObservation,
} from "./capabilityActionContract";

const OBSERVED_AT = "2026-09-04T09:00:00.000Z";

const rail = (
  id: string,
  state: CapabilityObservationState,
  lastError: string | null = null,
): CapabilityRailObservation => ({
  id,
  state,
  observed_at: OBSERVED_AT,
  evidence_ref: `/evidence/${id}`,
  last_error: lastError,
});

const observations: CapabilityRailObservation[] = [
  rail("gspc-board", "RUNTIME_OBSERVED"),
  rail("mcp-tools", "RUNTIME_OBSERVED"),
  rail("a2a-runtime", "UNREACHABLE", "HTTP 404"),
  rail("a2ui-renderer", "UNCHECKABLE", "no published runtime endpoint"),
  rail("agui-gspc-state", "RUNTIME_OBSERVED"),
  rail("regulation-feed", "RUNTIME_OBSERVED"),
  rail("xrpl-reader", "RUNTIME_OBSERVED"),
  rail("hf-census", "CATALOGUED"),
  rail("oracle-fleet", "STALE", "heartbeat is stale"),
  rail("public-root", "SIGNED"),
];

describe("canonical capability action contract", () => {
  it("defines complete versioned, fail-closed public-read actions", () => {
    const ids = CAPABILITY_ACTION_DEFINITIONS.map((action) => action.id);
    expect(new Set(ids).size).toBe(ids.length);

    for (const action of CAPABILITY_ACTION_DEFINITIONS) {
      expect(action.schema).toBe("csoai.capability-action/0.1");
      expect(action.version).toMatch(/^\d+\.\d+\.\d+$/);
      expect(action.input_schema).toMatchObject({ type: "object" });
      expect(action.output_schema).toMatchObject({ type: "object" });
      expect(action.risk_class).toBe("READ_ONLY");
      expect(action.scopes).toEqual(["public:read"]);
      expect(action.approval_policy.mode).toBe("NONE");
      expect(action.cost_policy).toMatchObject({
        mode: "NO_CHARGE",
        maximum_minor_units: 0,
        fail_closed: true,
      });
      expect(action.egress_policy).toMatchObject({
        mode: "SAME_ORIGIN_ONLY",
        sensitive_data: "PROHIBITED",
        fail_closed: true,
      });
      expect(action.timeout_ms).toBe(3_500);
      expect(action.idempotency.mode).toBe("SAFE_RETRY");
      expect(action.verifier.kind).toBe("FABRIC_RAIL_STATE");
      expect(action.compensator).toBeNull();
      expect(action.execution_policy).toMatchObject({
        enabled: false,
        executor_ref: null,
      });
      expect(action.protocol_views.map((view) => view.protocol)).toEqual(
        CAPABILITY_PROTOCOLS,
      );
    }
  });

  it("derives exact per-action and per-view states without claiming execution", () => {
    const contract = buildCapabilityActionContract(observations, OBSERVED_AT);
    const gspc = contract.actions.find(
      (action) => action.definition.id === "csoai.gspc.board.read",
    );
    const compute = contract.actions.find(
      (action) => action.definition.id === "csoai.compute.heartbeat.read",
    );
    if (!gspc || !compute) throw new Error("expected action was absent");

    expect(contract).toMatchObject({
      schema: "csoai.capability-action-contract/0.1",
      policy: { mode: "FAIL_CLOSED", execution_enabled: false },
      protocols: CAPABILITY_PROTOCOLS,
    });
    expect(gspc.runtime).toMatchObject({
      state: "RUNTIME_OBSERVED",
      verifier_passed: true,
      execution_enabled: false,
      execution_observed: false,
    });
    expect(
      gspc.runtime.protocol_views.find((view) => view.protocol === "A2A"),
    ).toMatchObject({
      mode: "DISCOVERY_ONLY",
      state: "UNREACHABLE",
      execution_observed: false,
      last_error: "HTTP 404",
    });
    expect(
      gspc.runtime.protocol_views.find((view) => view.protocol === "AGUI"),
    ).toMatchObject({
      mode: "PRESENTATION_ONLY",
      state: "RUNTIME_OBSERVED",
      execution_observed: false,
    });
    expect(compute.runtime).toMatchObject({
      state: "STALE",
      verifier_passed: false,
      last_error: "heartbeat is stale",
      execution_observed: false,
    });
  });

  it("fails closed when required evidence is missing or ambiguous", () => {
    const missing = buildCapabilityActionContract([], OBSERVED_AT);
    expect(
      missing.actions.every(
        (action) =>
          action.runtime.state === "UNCHECKABLE" &&
          action.runtime.verifier_passed === false &&
          action.runtime.execution_enabled === false,
      ),
    ).toBe(true);

    const duplicate = buildCapabilityActionContract(
      [
        rail("gspc-board", "RUNTIME_OBSERVED"),
        rail("gspc-board", "RUNTIME_OBSERVED"),
      ],
      OBSERVED_AT,
    );
    const gspc = duplicate.actions.find(
      (action) => action.definition.id === "csoai.gspc.board.read",
    );
    expect(gspc?.runtime).toMatchObject({
      state: "UNCHECKABLE",
      verifier_passed: false,
      last_error: "duplicate evidence rail gspc-board",
      execution_observed: false,
    });
  });
});
