export type FabricState =
  | "RUNTIME_OBSERVED"
  | "CATALOGUED"
  | "SIGNED"
  | "STALE"
  | "UNREACHABLE"
  | "UNCHECKABLE";

export type FabricRail = {
  id: string;
  label: string;
  role: string;
  protocol: string;
  state: FabricState;
  observed_at: string | null;
  endpoint: string | null;
  writes_board: false;
  evidence_ref: string | null;
  summary: string;
  freshness_seconds: number | null;
  last_error: string | null;
};

export type CapabilityActionContractStatus = {
  schema: "csoai.capability-action-contract/0.1" | null;
  state: "DECLARED_DISABLED" | "UNCHECKABLE";
  mode: "FAIL_CLOSED" | null;
  /** The reader never accepts a manifest that enables execution. */
  execution_enabled: false;
  action_count: number;
  last_error: string | null;
};

export type CapabilityFabric = {
  schema: "csoai.capability-fabric/0.1";
  observed_at: string;
  rails: FabricRail[];
  action_contract: CapabilityActionContractStatus;
};

const STATES = new Set<FabricState>([
  "RUNTIME_OBSERVED",
  "CATALOGUED",
  "SIGNED",
  "STALE",
  "UNREACHABLE",
  "UNCHECKABLE",
]);

function optionalText(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function requiredText(value: unknown, field: string): string {
  const text = optionalText(value);
  if (!text) throw new Error(`fabric rail has no ${field}`);
  return text;
}

function object(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function uncheckableActionContract(
  lastError: string,
): CapabilityActionContractStatus {
  return {
    schema: null,
    state: "UNCHECKABLE",
    mode: null,
    execution_enabled: false,
    action_count: 0,
    last_error: lastError,
  };
}

export function parseActionContractStatus(
  raw: unknown,
): CapabilityActionContractStatus {
  const contract = object(raw);
  if (!contract) return uncheckableActionContract("action contract was absent");
  if (contract.schema !== "csoai.capability-action-contract/0.1")
    return uncheckableActionContract("action contract schema was unsupported");
  const policy = object(contract.policy);
  const actions = Array.isArray(contract.actions) ? contract.actions : null;
  if (
    !policy ||
    policy.mode !== "FAIL_CLOSED" ||
    policy.execution_enabled !== false ||
    !actions
  ) {
    return uncheckableActionContract(
      "action contract did not declare fail-closed, disabled execution",
    );
  }

  const definitionsAreDisabled = actions.every((rawAction) => {
    const action = object(rawAction);
    const definition = object(action?.definition);
    const executionPolicy = object(definition?.execution_policy);
    const runtime = object(action?.runtime);
    return (
      !!optionalText(definition?.id) &&
      !!optionalText(definition?.version) &&
      executionPolicy?.enabled === false &&
      executionPolicy.executor_ref === null &&
      runtime?.execution_enabled === false &&
      runtime.execution_observed === false
    );
  });
  if (!definitionsAreDisabled) {
    return uncheckableActionContract(
      "one or more action definitions did not fail closed",
    );
  }

  return {
    schema: "csoai.capability-action-contract/0.1",
    state: "DECLARED_DISABLED",
    mode: "FAIL_CLOSED",
    execution_enabled: false,
    action_count: actions.length,
    last_error: null,
  };
}

export function parseCapabilityFabric(raw: unknown): CapabilityFabric {
  if (!raw || typeof raw !== "object" || Array.isArray(raw))
    throw new Error("fabric response is not an object");
  const value = raw as Record<string, unknown>;
  if (value.schema !== "csoai.capability-fabric/0.1")
    throw new Error("fabric response has an unsupported schema");
  if (!Array.isArray(value.rails))
    throw new Error("fabric response carries no rails");

  const rails = value.rails.map((rawRail) => {
    if (!rawRail || typeof rawRail !== "object" || Array.isArray(rawRail))
      throw new Error("fabric rail is not an object");
    const rail = rawRail as Record<string, unknown>;
    const state = requiredText(rail.state, "state") as FabricState;
    if (!STATES.has(state))
      throw new Error(`unsupported fabric state ${state}`);
    return {
      id: requiredText(rail.id, "id"),
      label: optionalText(rail.label) || requiredText(rail.id, "id"),
      role: optionalText(rail.role) || "capability",
      protocol: optionalText(rail.protocol) || "HTTP",
      state,
      observed_at: optionalText(rail.observed_at),
      endpoint: optionalText(rail.endpoint),
      writes_board: false as const,
      evidence_ref: optionalText(rail.evidence_ref),
      summary: optionalText(rail.summary) || "No runtime detail was returned.",
      freshness_seconds:
        typeof rail.freshness_seconds === "number" &&
        Number.isFinite(rail.freshness_seconds) &&
        rail.freshness_seconds >= 0
          ? rail.freshness_seconds
          : null,
      last_error: optionalText(rail.last_error),
    };
  });

  const ids = rails.map((rail) => rail.id);
  if (new Set(ids).size !== ids.length)
    throw new Error("fabric response contains duplicate rail ids");
  return {
    schema: "csoai.capability-fabric/0.1",
    observed_at:
      optionalText(value.observed_at) || optionalText(value.as_of) || "unknown",
    rails,
    action_contract: parseActionContractStatus(value.action_contract),
  };
}

export async function fetchCapabilityFabric(
  fetchImpl: typeof fetch = fetch,
  signal?: AbortSignal,
): Promise<CapabilityFabric> {
  const response = await fetchImpl("/api/fabric", {
    signal,
    headers: { accept: "application/json" },
  });
  if (!response.ok)
    throw new Error(`GET /api/fabric answered HTTP ${response.status}`);
  const text = (await response.text()).replace(/^\uFEFF/, "").trim();
  if (!text || text.startsWith("<"))
    throw new Error("GET /api/fabric returned HTML, not JSON");
  return parseCapabilityFabric(JSON.parse(text));
}

export function fabricCounts(
  fabric: CapabilityFabric,
): Record<FabricState, number> {
  const counts = Object.fromEntries(
    [...STATES].map((state) => [state, 0]),
  ) as Record<FabricState, number>;
  for (const rail of fabric.rails) counts[rail.state] += 1;
  return counts;
}
