/**
 * GET /api/fabric -- normalized, read-only capability evidence.
 *
 * This is not an action registry. Every positive state is derived from a bounded
 * same-origin probe made for this request. Catalogue metadata stays CATALOGUED;
 * it is never promoted to runtime execution. Every rail is view-only and this
 * handler never writes the GSPC board.
 */

import {
  buildCapabilityActionContract,
  type CapabilityActionContract,
} from "../_lib/capabilityActionContract";

export type FabricState =
  | "RUNTIME_OBSERVED"
  | "CATALOGUED"
  | "UNREACHABLE"
  | "UNCHECKABLE"
  | "SIGNED"
  | "STALE";

export interface FabricRail {
  id: string;
  label: string;
  role: string;
  protocol: string;
  state: FabricState;
  observed_at: string;
  endpoint: string | null;
  writes_board: false;
  evidence_ref: string | null;
  summary: string;
  freshness_seconds: number | null;
  last_error: string | null;
}

export interface FabricManifest {
  schema: "csoai.capability-fabric/0.1";
  observed_at: string;
  rails: FabricRail[];
  action_contract: CapabilityActionContract;
}

type FetchLike = (
  input: RequestInfo | URL,
  init?: RequestInit,
) => Promise<Response>;

interface Probe {
  endpoint: string;
  ok: boolean;
  status: number | null;
  json: Record<string, unknown> | null;
  contentType: string | null;
  error: string | null;
}

const PROBE_TIMEOUT_MS = 3_500;
const ORACLE_STALE_AFTER_SECONDS = 30 * 60;
const ROOT_PREIMAGE_FIELDS = [
  "kind",
  "schema",
  "as_of",
  "merkle_root",
  "card_count",
  "did_intended",
] as const;

const record = (value: unknown): Record<string, unknown> | null =>
  value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;

const array = (value: unknown): unknown[] =>
  Array.isArray(value) ? value : [];

const text = (value: unknown): string | null =>
  typeof value === "string" && value.trim() ? value.trim() : null;

const number = (value: unknown): number | null =>
  typeof value === "number" && Number.isFinite(value) ? value : null;

const short = (value: unknown, max = 220): string | null => {
  const valueText = text(value);
  return valueText ? valueText.slice(0, max) : null;
};

const ageSeconds = (value: unknown, observedAtMs: number): number | null => {
  const stamp = text(value);
  if (!stamp) return null;
  const parsed = Date.parse(stamp);
  if (!Number.isFinite(parsed)) return null;
  return Math.max(0, Math.floor((observedAtMs - parsed) / 1_000));
};

const httpError = (status: number): string => `HTTP ${status}`;

function canonicalJson(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value))
    return `[${value.map((item) => canonicalJson(item)).join(",")}]`;
  const valueRecord = value as Record<string, unknown>;
  return `{${Object.keys(valueRecord)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${canonicalJson(valueRecord[key])}`)
    .join(",")}}`;
}

function hexBytes(value: string): Uint8Array | null {
  if (!/^[0-9a-f]{128}$/i.test(value)) return null;
  return Uint8Array.from(value.match(/.{2}/g) ?? [], (part) =>
    Number.parseInt(part, 16),
  );
}

async function verifyRootEnvelope(
  root: Record<string, unknown>,
  did: Record<string, unknown> | null,
): Promise<boolean | null> {
  const didIntended = text(root.did_intended);
  const signature = text(root.sig_ed25519);
  const signatureBytes = signature ? hexBytes(signature) : null;
  if (!did || !didIntended || !signatureBytes) return null;
  const method = array(did.verificationMethod)
    .map(record)
    .find((entry) => text(entry?.id) === didIntended);
  const jwk = record(method?.publicKeyJwk);
  if (!jwk) return null;
  try {
    const key = await crypto.subtle.importKey(
      "jwk",
      jwk as JsonWebKey,
      { name: "Ed25519" },
      false,
      ["verify"],
    );
    const preimage = Object.fromEntries(
      ROOT_PREIMAGE_FIELDS.map((field) => [field, root[field]]),
    );
    return crypto.subtle.verify(
      "Ed25519",
      key,
      signatureBytes as unknown as BufferSource,
      new TextEncoder().encode(
        canonicalJson(preimage),
      ) as unknown as BufferSource,
    );
  } catch {
    return false;
  }
}

async function boundedProbe(
  origin: string,
  endpoint: string,
  fetcher: FetchLike,
  init: RequestInit = {},
  parseJson = true,
): Promise<Probe> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), PROBE_TIMEOUT_MS);
  try {
    const response = await fetcher(new URL(endpoint, origin), {
      ...init,
      signal: controller.signal,
      redirect: "manual",
    });
    const contentType = response.headers.get("content-type");
    if (!response.ok) {
      void response.body?.cancel();
      return {
        endpoint,
        ok: false,
        status: response.status,
        json: null,
        contentType,
        error: httpError(response.status),
      };
    }

    if (!parseJson) {
      void response.body?.cancel();
      return {
        endpoint,
        ok: true,
        status: response.status,
        json: null,
        contentType,
        error: null,
      };
    }

    try {
      const body = record(await response.json());
      if (!body) {
        return {
          endpoint,
          ok: false,
          status: response.status,
          json: null,
          contentType,
          error: "response was not a JSON object",
        };
      }
      return {
        endpoint,
        ok: true,
        status: response.status,
        json: body,
        contentType,
        error: null,
      };
    } catch {
      return {
        endpoint,
        ok: false,
        status: response.status,
        json: null,
        contentType,
        error: "response was not valid JSON",
      };
    }
  } catch (error: unknown) {
    const message = controller.signal.aborted
      ? `probe timed out after ${PROBE_TIMEOUT_MS}ms`
      : error instanceof Error
        ? error.message
        : String(error);
    return {
      endpoint,
      ok: false,
      status: null,
      json: null,
      contentType: null,
      error: message.slice(0, 220),
    };
  } finally {
    clearTimeout(timer);
  }
}

const rail = (
  observedAt: string,
  values: Omit<FabricRail, "observed_at" | "writes_board">,
): FabricRail => ({ ...values, observed_at: observedAt, writes_board: false });

const unavailable = (
  observedAt: string,
  values: Pick<
    FabricRail,
    "id" | "label" | "role" | "protocol" | "endpoint"
  > & {
    probe: Probe;
    evidence_ref?: string | null;
    state?: FabricState;
    summary?: string;
  },
): FabricRail =>
  rail(observedAt, {
    id: values.id,
    label: values.label,
    role: values.role,
    protocol: values.protocol,
    endpoint: values.endpoint,
    state: values.state ?? "UNREACHABLE",
    evidence_ref: values.evidence_ref ?? values.endpoint,
    summary:
      values.summary ??
      "The same-origin probe did not produce usable evidence.",
    freshness_seconds: null,
    last_error: values.probe.error,
  });

function witnessSummary(witness: Record<string, unknown>): string {
  const witnesses = record(witness.witnesses);
  const rekor = record(witnesses?.rekor);
  const ots = record(witnesses?.ots);
  const eas = record(witnesses?.eas_base);
  const xrpl = record(witnesses?.xrpl_memo);
  return [
    `Rekor ${text(rekor?.status) ?? "UNKNOWN"}`,
    `OTS ${text(ots?.status) ?? "UNKNOWN"}`,
    `EAS ${text(eas?.status) ?? "UNKNOWN"}`,
    `XRPL memo ${text(xrpl?.status) ?? "UNKNOWN"}`,
  ].join("; ");
}

/** Build the manifest with an injectable fetcher so the honesty rules are testable. */
export async function buildFabricManifest(
  requestUrl: string,
  fetcher: FetchLike = fetch,
  observedAt = new Date().toISOString(),
): Promise<FabricManifest> {
  const origin = new URL(requestUrl).origin;
  const parsedObservedAt = Date.parse(observedAt);
  const observedAtMs = Number.isFinite(parsedObservedAt)
    ? parsedObservedAt
    : Date.now();
  const mcpInit: RequestInit = {
    method: "POST",
    headers: { accept: "application/json", "content-type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: "fabric-probe",
      method: "tools/list",
      params: {},
    }),
  };

  const [
    mcp,
    gspc,
    cardMatrix,
    aguiState,
    agentCard,
    a2aKey,
    compute,
    providerCanary,
    actionJobs,
    oracle,
    regulation,
    xrpl,
    root,
    did,
    witness,
  ] = await Promise.all([
    boundedProbe(origin, "/mcp", fetcher, mcpInit),
    boundedProbe(origin, "/api/gspc", fetcher),
    boundedProbe(origin, "/signed/card-matrix.json", fetcher),
    boundedProbe(
      origin,
      "/api/agui/gspc-state",
      fetcher,
      { method: "GET", headers: { accept: "text/event-stream" } },
      false,
    ),
    boundedProbe(origin, "/.well-known/agent-card.json", fetcher),
    boundedProbe(origin, "/api/a2a/key", fetcher),
    boundedProbe(origin, "/api/compute", fetcher),
    boundedProbe(origin, "/api/provider-canary", fetcher),
    boundedProbe(origin, "/api/action-jobs", fetcher),
    boundedProbe(origin, "/api/oracle-fleet", fetcher),
    boundedProbe(origin, "/api/regulation", fetcher),
    boundedProbe(origin, "/api/xrpl", fetcher),
    boundedProbe(origin, "/root.json", fetcher),
    boundedProbe(origin, "/.well-known/did.json", fetcher),
    boundedProbe(origin, "/interop/root-witness-latest.json", fetcher),
  ]);

  const rails: FabricRail[] = [];

  if (mcp.ok && mcp.json) {
    const result = record(mcp.json.result);
    const tools = array(result?.tools ?? mcp.json.tools);
    const names = tools
      .map((item) => text(record(item)?.name))
      .filter((name): name is string => !!name);
    rails.push(
      rail(observedAt, {
        id: "mcp-tools",
        label: "MCP tools",
        role: "tool discovery and invocation boundary",
        protocol: "MCP / JSON-RPC 2.0",
        state: "RUNTIME_OBSERVED",
        endpoint: "/mcp",
        evidence_ref: "/mcp#tools/list",
        summary: `${names.length} tool declaration${names.length === 1 ? "" : "s"} returned; catalogue response only, no tool was invoked.`,
        freshness_seconds: null,
        last_error: null,
      }),
    );
  } else {
    rails.push(
      unavailable(observedAt, {
        id: "mcp-tools",
        label: "MCP tools",
        role: "tool discovery and invocation boundary",
        protocol: "MCP / JSON-RPC 2.0",
        endpoint: "/mcp",
        evidence_ref: "/mcp#tools/list",
        probe: mcp,
      }),
    );
  }

  if (gspc.ok && gspc.json) {
    const totals = record(gspc.json.totals);
    const axes = array(gspc.json.axes);
    const matrixCounts = record(cardMatrix.json?.counts);
    const admitted = number(matrixCounts?.admitted_cells);
    const quotable = number(matrixCounts?.quotable_cells);
    const admissionObserved =
      cardMatrix.ok && admitted !== null && quotable !== null;
    const hasAdmittedEvidence =
      admissionObserved && admitted > 0 && quotable > 0;
    rails.push(
      rail(observedAt, {
        id: "gspc-board",
        label: "GSPC board",
        role: "published board catalogue and independent-admission gate",
        protocol: "HTTP+JSON / Ed25519 envelope when present",
        state: hasAdmittedEvidence
          ? "RUNTIME_OBSERVED"
          : admissionObserved
            ? "CATALOGUED"
            : "UNCHECKABLE",
        endpoint: "/api/gspc",
        evidence_ref: admissionObserved
          ? "/signed/card-matrix.json#counts"
          : "/api/gspc",
        summary: admissionObserved
          ? `${short(totals?.public_count) ?? `${axes.length} published axis`} reported by the historical board endpoint; independent gate: ${admitted} admitted, ${quotable} quotable cell${quotable === 1 ? "" : "s"}. ${hasAdmittedEvidence ? "Only admitted cells may feed current rankings." : "Legacy figures remain context and are withheld from current rankings."}`
          : `${short(totals?.public_count) ?? `${axes.length} published axis`} reported, but the independent-admission matrix was unreadable; no current measurement claim is made.`,
        freshness_seconds: ageSeconds(
          record(gspc.json.measured_on)?.as_of,
          observedAtMs,
        ),
        last_error: admissionObserved
          ? null
          : (cardMatrix.error ?? "admission counts were absent"),
      }),
    );
  } else {
    rails.push(
      unavailable(observedAt, {
        id: "gspc-board",
        label: "GSPC board",
        role: "published board catalogue and independent-admission gate",
        protocol: "HTTP+JSON",
        endpoint: "/api/gspc",
        probe: gspc,
      }),
    );
  }

  if (aguiState.ok) {
    const isSse = (aguiState.contentType ?? "")
      .toLowerCase()
      .includes("text/event-stream");
    rails.push(
      rail(observedAt, {
        id: "agui-gspc-state",
        label: "AG-UI GSPC state",
        role: "read-only board presentation stream",
        protocol: "AG-UI event stream",
        state: isSse ? "RUNTIME_OBSERVED" : "UNCHECKABLE",
        endpoint: "/api/agui/gspc-state",
        evidence_ref: "/api/agui/gspc-state",
        summary: isSse
          ? "The same-origin GSPC event stream answered. This proves presentation transport only, not provider execution."
          : "The endpoint answered without an event-stream content type; AG-UI framing was not established.",
        freshness_seconds: null,
        last_error: isSse
          ? null
          : `unexpected content-type: ${aguiState.contentType ?? "missing"}`,
      }),
    );
  } else {
    rails.push(
      unavailable(observedAt, {
        id: "agui-gspc-state",
        label: "AG-UI GSPC state",
        role: "read-only board presentation stream",
        protocol: "AG-UI event stream",
        endpoint: "/api/agui/gspc-state",
        probe: aguiState,
      }),
    );
  }

  if (agentCard.ok && agentCard.json) {
    rails.push(
      rail(observedAt, {
        id: "a2a-discovery",
        label: "Agent discovery",
        role: "agent capability metadata",
        protocol: "A2A discovery metadata",
        state: "CATALOGUED",
        endpoint: "/.well-known/agent-card.json",
        evidence_ref: "/.well-known/agent-card.json",
        summary: `${array(agentCard.json.skills).length} skill declaration${array(agentCard.json.skills).length === 1 ? "" : "s"} published. Metadata does not establish A2A task execution or conformance.`,
        freshness_seconds: null,
        last_error: null,
      }),
    );
  } else {
    rails.push(
      unavailable(observedAt, {
        id: "a2a-discovery",
        label: "Agent discovery",
        role: "agent capability metadata",
        protocol: "A2A discovery metadata",
        endpoint: "/.well-known/agent-card.json",
        probe: agentCard,
      }),
    );
  }

  if (a2aKey.ok && a2aKey.json) {
    rails.push(
      rail(observedAt, {
        id: "a2a-runtime",
        label: "A2A runtime",
        role: "peer-agent task transport",
        protocol: "A2A",
        state: "CATALOGUED",
        endpoint: "/api/a2a/key",
        evidence_ref: "/api/a2a/key",
        summary:
          "The public-key endpoint answered. Key reachability does not prove task routing, execution, or A2A conformance.",
        freshness_seconds: null,
        last_error: null,
      }),
    );
  } else {
    rails.push(
      unavailable(observedAt, {
        id: "a2a-runtime",
        label: "A2A runtime",
        role: "peer-agent task transport",
        protocol: "A2A",
        endpoint: "/api/a2a/key",
        probe: a2aKey,
        summary:
          "No reachable same-origin A2A key endpoint was observed; task execution remains unproven.",
      }),
    );
  }

  rails.push(
    rail(observedAt, {
      id: "a2ui-renderer",
      label: "A2UI renderer",
      role: "declarative interactive tool surfaces",
      protocol: "A2UI",
      state: "UNCHECKABLE",
      endpoint: null,
      evidence_ref: null,
      summary:
        "No same-origin A2UI renderer endpoint is published, so runtime rendering is not claimed.",
      freshness_seconds: null,
      last_error: "no published runtime endpoint",
    }),
  );

  const computeBody = compute.ok ? compute.json : null;
  const census = record(computeBody?.census);
  if (census) {
    const unique = number(census.n_unique_ids);
    const measured = number(census.n_measured);
    rails.push(
      rail(observedAt, {
        id: "hf-census",
        label: "Hugging Face census",
        role: "model-listing discovery",
        protocol: "Hugging Face catalogue / HTTP+JSON",
        state: "CATALOGUED",
        endpoint: "/api/compute",
        evidence_ref: "/api/compute#census",
        summary: `${unique ?? "Unknown"} unique listing${unique === 1 ? "" : "s"}; ${measured ?? 0} measured. Discovery is not provider execution or a GSPC grade.`,
        freshness_seconds: ageSeconds(census.as_of, observedAtMs),
        last_error: null,
      }),
    );
  } else {
    rails.push(
      unavailable(observedAt, {
        id: "hf-census",
        label: "Hugging Face census",
        role: "model-listing discovery",
        protocol: "Hugging Face catalogue / HTTP+JSON",
        endpoint: "/api/compute",
        evidence_ref: "/api/compute#census",
        probe: compute,
        state: "UNCHECKABLE",
        summary:
          "The compute probe supplied no usable Hugging Face census; discovery and execution remain unproven.",
      }),
    );
  }

  const providerAdapters = array(providerCanary.json?.adapters).map(record);
  const providerAdapter = (provider: string) =>
    providerAdapters.find((adapter) => text(adapter?.provider) === provider) ??
    null;
  const hfAdapter = providerAdapter("huggingface");
  const hfConfigured = hfAdapter?.configured === true;
  rails.push(
    rail(observedAt, {
      id: "hf-provider-execution",
      label: "Hugging Face provider",
      role: "bounded model-inference adapter",
      protocol: "Hugging Face Inference Providers / OpenAI-compatible HTTP",
      state: hfConfigured ? "CATALOGUED" : "UNCHECKABLE",
      endpoint: "/api/provider-canary",
      evidence_ref: "/api/provider-canary#adapters.huggingface",
      summary: hfAdapter
        ? hfConfigured
          ? `Adapter configured for ${short(hfAdapter.model) ?? "a declared model"}; GET does not execute it. An authenticated minimal canary is required before executable status can be claimed.`
          : `Adapter is not ready: ${array(hfAdapter.missing_configuration).map(String).join(", ") || array(hfAdapter.invalid_configuration).map(String).join(", ") || "configuration incomplete"}. No provider call was made.`
        : "No usable Hugging Face provider adapter status was returned. No provider call was made.",
      freshness_seconds: null,
      last_error: hfConfigured
        ? "configured but not execution-probed"
        : (providerCanary.error ?? "provider adapter is unconfigured"),
    }),
  );

  const actionStorage = record(actionJobs.json?.storage);
  const actionExecution = record(actionJobs.json?.execution);
  const isStagingLedger =
    actionJobs.ok &&
    actionJobs.json?.schema === "csoai.action-job-contract/0.1" &&
    text(actionStorage?.mode) === "SINGLE_WRITER_STAGING" &&
    actionJobs.json?.durable === true &&
    actionExecution?.automatic === false &&
    actionExecution?.provider_calls === false &&
    actionExecution?.worker_bound === false &&
    actionExecution?.board_write === false;
  rails.push(
    isStagingLedger
      ? rail(observedAt, {
          id: "action-job-ledger",
          label: "Action job ledger",
          role: "durable reviewed-intent and state-receipt staging",
          protocol: "HTTP+JSON / append-only receipt chain",
          state: "CATALOGUED",
          endpoint: "/api/action-jobs",
          evidence_ref: "/api/action-jobs#storage",
          summary:
            "Durable single-writer staging is present. It records intent and state receipts only; no executor, provider call, external egress, training or board write is enabled. Durable Objects or transactional D1 are required before multi-writer production execution.",
          freshness_seconds: null,
          last_error: "SINGLE_WRITER_STAGING; concurrency guarantee NONE",
        })
      : unavailable(observedAt, {
          id: "action-job-ledger",
          label: "Action job ledger",
          role: "durable reviewed-intent and state-receipt staging",
          protocol: "HTTP+JSON / append-only receipt chain",
          endpoint: "/api/action-jobs",
          evidence_ref: "/api/action-jobs",
          probe: actionJobs,
          state: "UNCHECKABLE",
          summary:
            "No complete durable staging-ledger contract was observed; no job persistence or execution is claimed.",
        }),
  );

  const agui = record(computeBody?.agui);
  const aguiStatus = text(agui?.status);
  const aguiConfigured = agui?.configured === true;
  const aguiStateValue: FabricState =
    aguiStatus === "live"
      ? "RUNTIME_OBSERVED"
      : aguiConfigured &&
          (aguiStatus === "down" || aguiStatus === "unreachable")
        ? "UNREACHABLE"
        : "UNCHECKABLE";
  rails.push(
    rail(observedAt, {
      id: "agui-provider-wire",
      label: "AG-UI provider wire",
      role: "remote compute transport health",
      protocol: "AG-UI / HTTP",
      state: aguiStateValue,
      endpoint: "/api/compute",
      evidence_ref: "/api/compute#agui",
      summary:
        aguiStatus === "live"
          ? "The configured wire health endpoint answered. Transport health does not prove a model task was executed."
          : (short(agui?.hint) ??
            "No configured, reachable provider wire was established by the compute probe."),
      freshness_seconds: null,
      last_error:
        aguiStateValue === "RUNTIME_OBSERVED"
          ? null
          : (compute.error ??
            short(agui?.hint) ??
            "provider wire execution was not observed"),
    }),
  );

  const runpod = providerAdapter("runpod");
  const runpodConfigured = runpod?.configured === true;
  rails.push(
    rail(observedAt, {
      id: "runpod-execution",
      label: "RunPod execution",
      role: "bounded model-inference adapter",
      protocol: "RunPod / OpenAI-compatible HTTP",
      state: runpodConfigured ? "CATALOGUED" : "UNCHECKABLE",
      endpoint: "/api/provider-canary",
      evidence_ref: "/api/provider-canary#adapters.runpod",
      summary: runpod
        ? runpodConfigured
          ? `Adapter configured for ${short(runpod.model) ?? "a declared model"}; GET does not execute it. An authenticated minimal canary is required before executable status can be claimed.`
          : `Adapter is not ready: ${array(runpod.missing_configuration).map(String).join(", ") || array(runpod.invalid_configuration).map(String).join(", ") || "configuration incomplete"}. No provider call was made.`
        : "No usable RunPod adapter status was returned. No provider call was made.",
      freshness_seconds: null,
      last_error: runpodConfigured
        ? "configured but not execution-probed"
        : (providerCanary.error ?? "provider adapter is unconfigured"),
    }),
  );

  if (oracle.ok && oracle.json) {
    const updated = oracle.json.updated ?? oracle.json.as_of;
    const freshness = ageSeconds(updated, observedAtMs);
    const source = text(oracle.json.source);
    const isLive = source === "live";
    const isStale =
      freshness !== null && freshness > ORACLE_STALE_AFTER_SECONDS;
    rails.push(
      rail(observedAt, {
        id: "oracle-fleet",
        label: "Oracle fleet",
        role: "compute-substrate heartbeat",
        protocol: "HTTPS status relay",
        state: isStale ? "STALE" : isLive ? "RUNTIME_OBSERVED" : "UNCHECKABLE",
        endpoint: "/api/oracle-fleet",
        evidence_ref: "/api/oracle-fleet",
        summary: isStale
          ? `Heartbeat is ${freshness}s old, beyond the 1800s freshness window; no current compute availability is claimed.`
          : isLive
            ? `Live heartbeat served${text(oracle.json.host) ? ` for ${text(oracle.json.host)}` : ""}; no inference task was exercised.`
            : "A status document answered without source=live, so current compute availability is not claimed.",
        freshness_seconds: freshness,
        last_error:
          isLive && !isStale
            ? null
            : isStale
              ? "heartbeat is stale"
              : "status source was not live",
      }),
    );
  } else {
    rails.push(
      unavailable(observedAt, {
        id: "oracle-fleet",
        label: "Oracle fleet",
        role: "compute-substrate heartbeat",
        protocol: "HTTPS status relay",
        endpoint: "/api/oracle-fleet",
        probe: oracle,
      }),
    );
  }

  if (regulation.ok && regulation.json) {
    const deadlines = array(regulation.json.deadlines);
    rails.push(
      rail(observedAt, {
        id: "regulation-feed",
        label: "Regulation feed",
        role: "dated regulatory evidence",
        protocol: "HTTP+JSON",
        state: "RUNTIME_OBSERVED",
        endpoint: "/api/regulation",
        evidence_ref: "/api/regulation",
        summary: `${deadlines.length} deadline record${deadlines.length === 1 ? "" : "s"}; verified_as_of=${text(regulation.json.verified_as_of) ?? "unknown"}. Determinations remain with authorities and counsel.`,
        freshness_seconds: ageSeconds(
          regulation.json.verified_as_of,
          observedAtMs,
        ),
        last_error: null,
      }),
    );
  } else {
    rails.push(
      unavailable(observedAt, {
        id: "regulation-feed",
        label: "Regulation feed",
        role: "dated regulatory evidence",
        protocol: "HTTP+JSON",
        endpoint: "/api/regulation",
        probe: regulation,
      }),
    );
  }

  if (xrpl.ok && xrpl.json) {
    rails.push(
      rail(observedAt, {
        id: "xrpl-reader",
        label: "XRPL evidence reader",
        role: "public-ledger evidence retrieval",
        protocol: "XRPL / HTTP+JSON",
        state: "RUNTIME_OBSERVED",
        endpoint: "/api/xrpl",
        evidence_ref: "/api/xrpl",
        summary: `${number(xrpl.json.n) ?? array(xrpl.json.assets).length} public asset record${number(xrpl.json.n) === 1 ? "" : "s"} served. Reader only: no settlement, anchoring, or GSPC write occurred.`,
        freshness_seconds: ageSeconds(xrpl.json.as_of, observedAtMs),
        last_error: null,
      }),
    );
  } else {
    rails.push(
      unavailable(observedAt, {
        id: "xrpl-reader",
        label: "XRPL evidence reader",
        role: "public-ledger evidence retrieval",
        protocol: "XRPL / HTTP+JSON",
        endpoint: "/api/xrpl",
        probe: xrpl,
      }),
    );
  }

  if (root.ok && root.json) {
    const merkleRoot = text(root.json.merkle_root);
    const signature = text(root.json.sig_ed25519);
    const signatureValid = await verifyRootEnvelope(
      root.json,
      did.ok ? did.json : null,
    );
    rails.push(
      rail(observedAt, {
        id: "public-root",
        label: "Signed public root",
        role: "integrity envelope for published cards",
        protocol: "Merkle / Ed25519",
        state: merkleRoot && signatureValid ? "SIGNED" : "UNCHECKABLE",
        endpoint: "/root.json",
        evidence_ref: signature ? "/root.json#sig_ed25519" : "/root.json",
        summary:
          merkleRoot && signatureValid
            ? `${number(root.json.card_count) ?? "Unknown"} leaves under root ${merkleRoot.slice(0, 12)}…; Ed25519 verified against ${text(root.json.did_intended)}.`
            : merkleRoot && signature
              ? "A root signature is present but did not verify against the published DID key; integrity is not claimed."
              : "The root document answered without both a Merkle root and signature; integrity is not claimed.",
        freshness_seconds: ageSeconds(root.json.as_of, observedAtMs),
        last_error:
          merkleRoot && signatureValid
            ? null
            : signatureValid === false
              ? "root signature did not verify against published DID key"
              : (did.error ?? "missing root signature or published DID key"),
      }),
    );
  } else {
    rails.push(
      unavailable(observedAt, {
        id: "public-root",
        label: "Signed public root",
        role: "integrity envelope for published cards",
        protocol: "Merkle / Ed25519",
        endpoint: "/root.json",
        probe: root,
        state: "UNCHECKABLE",
      }),
    );
  }

  if (witness.ok && witness.json) {
    const currentRoot = text(root.json?.merkle_root);
    const artifact = record(witness.json.artifact);
    const witnessedRoot = text(artifact?.merkle_root);
    const comparable = !!currentRoot && !!witnessedRoot;
    const drift = comparable && currentRoot !== witnessedRoot;
    const statuses = witnessSummary(witness.json);
    rails.push(
      rail(observedAt, {
        id: "root-witness",
        label: "Root witness",
        role: "external existence/time receipts",
        protocol: "Rekor / OpenTimestamps / declared ledger witnesses",
        state: drift
          ? "STALE"
          : comparable
            ? "RUNTIME_OBSERVED"
            : "UNCHECKABLE",
        endpoint: "/interop/root-witness-latest.json",
        evidence_ref: "/interop/root-witness-latest.json",
        summary: drift
          ? `Witness covers older root ${witnessedRoot.slice(0, 12)}…, not current ${currentRoot.slice(0, 12)}…. ${statuses}.`
          : comparable
            ? `Witness metadata matches the current root. ${statuses}. Individual witness states remain distinct.`
            : `Witness metadata answered, but it could not be matched to the current root. ${statuses}.`,
        freshness_seconds: ageSeconds(
          witness.json.as_of ?? artifact?.as_of,
          observedAtMs,
        ),
        last_error: drift
          ? "witness merkle_root does not match current root.json"
          : comparable
            ? null
            : (root.error ?? "missing comparable merkle_root"),
      }),
    );
  } else {
    rails.push(
      unavailable(observedAt, {
        id: "root-witness",
        label: "Root witness",
        role: "external existence/time receipts",
        protocol: "Rekor / OpenTimestamps / declared ledger witnesses",
        endpoint: "/interop/root-witness-latest.json",
        probe: witness,
        state: "UNCHECKABLE",
      }),
    );
  }

  return {
    schema: "csoai.capability-fabric/0.1",
    observed_at: observedAt,
    rails,
    action_contract: buildCapabilityActionContract(rails, observedAt),
  };
}

export const onRequestGet: PagesFunction = async ({ request }) => {
  const body = await buildFabricManifest(request.url);
  return new Response(JSON.stringify(body, null, 2), {
    status: 200,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      "access-control-allow-origin": "*",
    },
  });
};
