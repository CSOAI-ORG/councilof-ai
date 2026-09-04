/**
 * Canonical, fail-closed action contract for the public Council OS fabric.
 *
 * The fabric endpoint observes read surfaces; it does not authenticate a user,
 * obtain approval, invoke an executor, or record an action receipt. Definitions
 * therefore describe only the public inspection actions that exist today and
 * keep execution disabled. Protocol views are projections of the same action,
 * not separate claims that an MCP/A2A/A2UI/AG-UI executor exists.
 */

export const CAPABILITY_ACTION_CONTRACT_SCHEMA =
  "csoai.capability-action-contract/0.1" as const;
export const CAPABILITY_ACTION_SCHEMA = "csoai.capability-action/0.1" as const;

export const CAPABILITY_PROTOCOLS = [
  "HTTP",
  "MCP",
  "A2A",
  "A2UI",
  "AGUI",
  "DASHBOARD",
] as const;

export type CapabilityProtocol = (typeof CAPABILITY_PROTOCOLS)[number];

export type CapabilityObservationState =
  | "RUNTIME_OBSERVED"
  | "CATALOGUED"
  | "UNREACHABLE"
  | "UNCHECKABLE"
  | "SIGNED"
  | "STALE";

export type JsonSchema = Readonly<Record<string, unknown>>;

export interface CapabilityRailObservation {
  id: string;
  state: CapabilityObservationState;
  observed_at: string;
  evidence_ref: string | null;
  last_error: string | null;
}

export type CapabilityViewMode =
  | "DIRECT_READ"
  | "CATALOGUE_ONLY"
  | "DISCOVERY_ONLY"
  | "PRESENTATION_ONLY"
  | "UNBOUND";

export interface CapabilityProtocolViewDefinition {
  protocol: CapabilityProtocol;
  mode: CapabilityViewMode;
  binding: string | null;
  evidence_rail_id: string | null;
}

export interface CapabilityActionDefinition {
  schema: typeof CAPABILITY_ACTION_SCHEMA;
  id: string;
  version: string;
  title: string;
  description: string;
  input_schema: JsonSchema;
  output_schema: JsonSchema;
  risk_class: "READ_ONLY";
  scopes: readonly string[];
  approval_policy: {
    mode: "NONE";
    applies_to: "PUBLIC_READ";
  };
  cost_policy: {
    mode: "NO_CHARGE";
    maximum_minor_units: 0;
    currency: null;
    fail_closed: true;
  };
  egress_policy: {
    mode: "SAME_ORIGIN_ONLY";
    destinations: readonly string[];
    sensitive_data: "PROHIBITED";
    fail_closed: true;
  };
  timeout_ms: number;
  idempotency: {
    mode: "SAFE_RETRY";
    key_required: false;
    retention_seconds: 0;
  };
  verifier: {
    kind: "FABRIC_RAIL_STATE";
    evidence_rail_id: string;
    acceptable_states: readonly CapabilityObservationState[];
  };
  compensator: null;
  protocol_views: readonly CapabilityProtocolViewDefinition[];
  execution_policy: {
    enabled: false;
    executor_ref: null;
    reason: string;
  };
}

export interface CapabilityProtocolViewRuntime extends CapabilityProtocolViewDefinition {
  state: CapabilityObservationState;
  observed_at: string;
  evidence_ref: string | null;
  last_error: string | null;
  execution_observed: false;
}

export interface CapabilityActionRuntime {
  state: CapabilityObservationState;
  observed_at: string;
  verifier_passed: boolean;
  evidence_rail_id: string;
  evidence_ref: string | null;
  last_error: string | null;
  execution_enabled: false;
  execution_observed: false;
  protocol_views: CapabilityProtocolViewRuntime[];
}

export interface CapabilityAction {
  definition: CapabilityActionDefinition;
  runtime: CapabilityActionRuntime;
}

export interface CapabilityActionContract {
  schema: typeof CAPABILITY_ACTION_CONTRACT_SCHEMA;
  observed_at: string;
  policy: {
    mode: "FAIL_CLOSED";
    execution_enabled: false;
    reason: string;
  };
  protocols: readonly CapabilityProtocol[];
  actions: CapabilityAction[];
}

const EMPTY_INPUT_SCHEMA: JsonSchema = Object.freeze({
  type: "object",
  properties: Object.freeze({}),
  additionalProperties: false,
});

const EXECUTION_DISABLED_REASON =
  "The fabric performs bounded read-only observation only; no authenticated executor, approval ledger, or action receipt is wired.";

const unboundView = (
  protocol: CapabilityProtocol,
): CapabilityProtocolViewDefinition => ({
  protocol,
  mode: "UNBOUND",
  binding: null,
  evidence_rail_id: null,
});

function protocolViews(
  bound: Partial<
    Record<
      CapabilityProtocol,
      Omit<CapabilityProtocolViewDefinition, "protocol">
    >
  >,
): CapabilityProtocolViewDefinition[] {
  return CAPABILITY_PROTOCOLS.map((protocol) => {
    const definition = bound[protocol];
    return definition ? { protocol, ...definition } : unboundView(protocol);
  });
}

function publicReadAction(values: {
  id: string;
  title: string;
  description: string;
  output_schema: JsonSchema;
  evidence_rail_id: string;
  acceptable_states: readonly CapabilityObservationState[];
  http_binding: string;
  dashboard_binding: string;
  views?: Partial<
    Record<
      CapabilityProtocol,
      Omit<CapabilityProtocolViewDefinition, "protocol">
    >
  >;
}): CapabilityActionDefinition {
  return {
    schema: CAPABILITY_ACTION_SCHEMA,
    id: values.id,
    version: "0.1.0",
    title: values.title,
    description: values.description,
    input_schema: EMPTY_INPUT_SCHEMA,
    output_schema: values.output_schema,
    risk_class: "READ_ONLY",
    scopes: ["public:read"],
    approval_policy: { mode: "NONE", applies_to: "PUBLIC_READ" },
    cost_policy: {
      mode: "NO_CHARGE",
      maximum_minor_units: 0,
      currency: null,
      fail_closed: true,
    },
    egress_policy: {
      mode: "SAME_ORIGIN_ONLY",
      destinations: [],
      sensitive_data: "PROHIBITED",
      fail_closed: true,
    },
    timeout_ms: 3_500,
    idempotency: {
      mode: "SAFE_RETRY",
      key_required: false,
      retention_seconds: 0,
    },
    verifier: {
      kind: "FABRIC_RAIL_STATE",
      evidence_rail_id: values.evidence_rail_id,
      acceptable_states: values.acceptable_states,
    },
    compensator: null,
    protocol_views: protocolViews({
      HTTP: {
        mode: "DIRECT_READ",
        binding: values.http_binding,
        evidence_rail_id: values.evidence_rail_id,
      },
      DASHBOARD: {
        mode: "PRESENTATION_ONLY",
        binding: values.dashboard_binding,
        evidence_rail_id: values.evidence_rail_id,
      },
      ...values.views,
    }),
    execution_policy: {
      enabled: false,
      executor_ref: null,
      reason: EXECUTION_DISABLED_REASON,
    },
  };
}

/**
 * Definitions are deliberately limited to observed public reads. Model
 * inference, measurement admission, signing, anchoring, payment, and repair are
 * absent until they have authenticated executors and durable receipts.
 */
export const CAPABILITY_ACTION_DEFINITIONS: readonly CapabilityActionDefinition[] =
  Object.freeze([
    publicReadAction({
      id: "csoai.gspc.board.read",
      title: "Read the GSPC board",
      description:
        "Read published per-axis measurement evidence without grading or writing observations.",
      output_schema: {
        type: "object",
        required: ["schema", "axes"],
        properties: {
          schema: { type: "string" },
          axes: { type: "array" },
        },
        additionalProperties: true,
      },
      evidence_rail_id: "gspc-board",
      acceptable_states: ["RUNTIME_OBSERVED"],
      http_binding: "GET /api/gspc",
      dashboard_binding: "/dashboard?tab=measured",
      views: {
        MCP: {
          mode: "CATALOGUE_ONLY",
          binding: "tools/list (action binding unverified)",
          evidence_rail_id: "mcp-tools",
        },
        A2A: {
          mode: "DISCOVERY_ONLY",
          binding: "/.well-known/agent-card.json (task binding unverified)",
          evidence_rail_id: "a2a-runtime",
        },
        A2UI: {
          mode: "UNBOUND",
          binding: null,
          evidence_rail_id: "a2ui-renderer",
        },
        AGUI: {
          mode: "PRESENTATION_ONLY",
          binding: "GET /api/agui/gspc-state",
          evidence_rail_id: "agui-gspc-state",
        },
      },
    }),
    publicReadAction({
      id: "csoai.regulation.deadlines.read",
      title: "Read regulation deadlines",
      description:
        "Read dated regulatory source records without making a legal determination.",
      output_schema: {
        type: "object",
        required: ["schema", "deadlines"],
        properties: {
          schema: { type: "string" },
          deadlines: { type: "array" },
        },
        additionalProperties: true,
      },
      evidence_rail_id: "regulation-feed",
      acceptable_states: ["RUNTIME_OBSERVED"],
      http_binding: "GET /api/regulation",
      dashboard_binding: "/dashboard?tab=regulators",
    }),
    publicReadAction({
      id: "csoai.xrpl.assets.read",
      title: "Read XRPL evidence records",
      description:
        "Read published ledger references; this performs no settlement, anchor, or board write.",
      output_schema: {
        type: "object",
        required: ["kind", "writes_board"],
        properties: {
          kind: { type: "string" },
          writes_board: { const: false },
        },
        additionalProperties: true,
      },
      evidence_rail_id: "xrpl-reader",
      acceptable_states: ["RUNTIME_OBSERVED"],
      http_binding: "GET /api/xrpl",
      dashboard_binding: "/dashboard?tab=provenance",
    }),
    publicReadAction({
      id: "csoai.models.catalogue.read",
      title: "Read model catalogue census",
      description:
        "Read model-listing discovery metadata; a listing is not a measured model or an inference receipt.",
      output_schema: {
        type: "object",
        required: ["census"],
        properties: { census: { type: "object" } },
        additionalProperties: true,
      },
      evidence_rail_id: "hf-census",
      acceptable_states: ["CATALOGUED"],
      http_binding: "GET /api/compute#census",
      dashboard_binding: "/dashboard?tab=compute",
    }),
    publicReadAction({
      id: "csoai.compute.heartbeat.read",
      title: "Read compute heartbeat",
      description:
        "Read the published compute heartbeat; this does not exercise an inference task.",
      output_schema: {
        type: "object",
        required: ["source"],
        properties: { source: { type: "string" } },
        additionalProperties: true,
      },
      evidence_rail_id: "oracle-fleet",
      acceptable_states: ["RUNTIME_OBSERVED"],
      http_binding: "GET /api/oracle-fleet",
      dashboard_binding: "/dashboard?tab=compute",
    }),
    publicReadAction({
      id: "csoai.evidence.root.read",
      title: "Read the signed public root",
      description:
        "Read the published Merkle envelope; witness and anchoring states remain separate evidence.",
      output_schema: {
        type: "object",
        required: ["merkle_root", "sig_ed25519", "did_intended"],
        properties: {
          merkle_root: { type: "string" },
          sig_ed25519: { type: "string" },
          did_intended: { type: "string" },
        },
        additionalProperties: true,
      },
      evidence_rail_id: "public-root",
      acceptable_states: ["SIGNED"],
      http_binding: "GET /root.json",
      dashboard_binding: "/dashboard?tab=provenance",
    }),
  ]);

type RailIndex = {
  rails: Map<string, CapabilityRailObservation>;
  duplicates: Set<string>;
};

function indexRails(
  observations: readonly CapabilityRailObservation[],
): RailIndex {
  const rails = new Map<string, CapabilityRailObservation>();
  const duplicates = new Set<string>();
  for (const observation of observations) {
    if (rails.has(observation.id)) {
      duplicates.add(observation.id);
      rails.delete(observation.id);
      continue;
    }
    if (!duplicates.has(observation.id)) rails.set(observation.id, observation);
  }
  return { rails, duplicates };
}

function resolveObservation(
  railId: string | null,
  index: RailIndex,
  observedAt: string,
): Pick<
  CapabilityProtocolViewRuntime,
  "state" | "observed_at" | "evidence_ref" | "last_error"
> {
  if (!railId) {
    return {
      state: "UNCHECKABLE",
      observed_at: observedAt,
      evidence_ref: null,
      last_error: "no protocol binding declared",
    };
  }
  if (index.duplicates.has(railId)) {
    return {
      state: "UNCHECKABLE",
      observed_at: observedAt,
      evidence_ref: null,
      last_error: `duplicate evidence rail ${railId}`,
    };
  }
  const rail = index.rails.get(railId);
  if (!rail) {
    return {
      state: "UNCHECKABLE",
      observed_at: observedAt,
      evidence_ref: null,
      last_error: `evidence rail ${railId} was absent`,
    };
  }
  return {
    state: rail.state,
    observed_at: rail.observed_at,
    evidence_ref: rail.evidence_ref,
    last_error: rail.last_error,
  };
}

/** Build runtime state exclusively from this request's normalized rails. */
export function buildCapabilityActionContract(
  observations: readonly CapabilityRailObservation[],
  observedAt: string,
): CapabilityActionContract {
  const index = indexRails(observations);
  const actions = CAPABILITY_ACTION_DEFINITIONS.map((definition) => {
    const verified = resolveObservation(
      definition.verifier.evidence_rail_id,
      index,
      observedAt,
    );
    const verifierPassed = definition.verifier.acceptable_states.includes(
      verified.state,
    );
    const protocolViewsRuntime = definition.protocol_views.map((view) => ({
      ...view,
      ...resolveObservation(view.evidence_rail_id, index, observedAt),
      execution_observed: false as const,
    }));

    return {
      definition,
      runtime: {
        state: verified.state,
        observed_at: verified.observed_at,
        verifier_passed: verifierPassed,
        evidence_rail_id: definition.verifier.evidence_rail_id,
        evidence_ref: verified.evidence_ref,
        last_error: verifierPassed
          ? null
          : (verified.last_error ??
            `rail state ${verified.state} does not satisfy the action verifier`),
        execution_enabled: false as const,
        execution_observed: false as const,
        protocol_views: protocolViewsRuntime,
      },
    };
  });

  return {
    schema: CAPABILITY_ACTION_CONTRACT_SCHEMA,
    observed_at: observedAt,
    policy: {
      mode: "FAIL_CLOSED",
      execution_enabled: false,
      reason: EXECUTION_DISABLED_REASON,
    },
    protocols: CAPABILITY_PROTOCOLS,
    actions,
  };
}
