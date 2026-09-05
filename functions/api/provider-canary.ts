/**
 * GET  /api/provider-canary -- public configuration status; never probes.
 * POST /api/provider-canary -- authenticated, fixed one-token capability canary.
 *
 * This route is deliberately not user inference. Callers choose only a declared
 * adapter and must send the explicit probe name. Prompt, model, endpoint, token,
 * timeout, and fallback policy are server-controlled. Results are UNMEASURED
 * operational receipts and never write the GSPC board.
 */

export type CanaryProvider = "huggingface" | "runpod";

export interface ProviderCanaryEnv {
  PROVIDER_CANARY_AUTH_TOKEN?: string;
  HF_INFERENCE_TOKEN?: string;
  HF_CANARY_MODEL?: string;
  HF_CANARY_MODEL_REVISION?: string;
  RUNPOD_API_KEY?: string;
  RUNPOD_CANARY_ENDPOINT_ID?: string;
  RUNPOD_CANARY_MODEL?: string;
  RUNPOD_CANARY_MODEL_REVISION?: string;
}

type FetchLike = (
  input: RequestInfo | URL,
  init?: RequestInit,
) => Promise<Response>;

type CanaryState =
  "UNCONFIGURED" | "UNCHECKABLE" | "REACHABLE_NOT_EXECUTABLE" | "EXECUTABLE";

interface ResolvedAdapter {
  provider: CanaryProvider;
  label: string;
  endpoint: string | null;
  endpoint_revision: string;
  model: string | null;
  model_revision: string | null;
  provider_route: string | null;
  token: string | null;
  configured: boolean;
  missing_configuration: string[];
  invalid_configuration: string[];
}

export interface ProviderCanaryReceipt {
  schema: "csoai.provider-capability-canary/0.1";
  kind: "provider-capability-canary";
  observed_at: string;
  provider: CanaryProvider;
  probe: "minimal-chat";
  state: CanaryState;
  configured: boolean;
  reachable: boolean;
  executable: boolean;
  target: {
    endpoint: string | null;
    endpoint_revision: string;
    model: string | null;
    model_revision: string | null;
    provider_route: string | null;
  };
  request: {
    method: "POST";
    prompt_source: "fixed-server-canary";
    max_output_tokens: 1;
    temperature: 0;
    stream: false;
    timeout_ms: number;
  };
  result: {
    http_status: number | null;
    latency_ms: number;
    response_content_type: string | null;
    response_bytes: number;
    response_digest_sha256: string | null;
    response_digest_scope: "complete" | "prefix" | null;
    openai_response_shape: boolean;
    observed_model: string | null;
    system_fingerprint: string | null;
    error_code: string | null;
  };
  policy: {
    user_input_accepted: false;
    arbitrary_url_accepted: false;
    application_fallback_attempted: false;
    provider_internal_routing_verified: false;
    secrets_exposed: false;
    writes_board: false;
    measurement_state: "UNMEASURED";
  };
}

const CANARY_PROMPT = "Reply with OK.";
export const PROVIDER_CANARY_TIMEOUT_MS = 4_000;
export const PROVIDER_CANARY_MAX_RESPONSE_BYTES = 64 * 1024;
const MAX_INVOCATION_BYTES = 256;

const HF_ENDPOINT = "https://router.huggingface.co/v1/chat/completions";
const HF_ENDPOINT_REVISION = "huggingface-router-openai-v1";
const RUNPOD_ENDPOINT_REVISION = "runpod-serverless-vllm-openai-v1";
const HF_POLICY_ROUTES = new Set(["fastest", "cheapest", "preferred"]);

const json = (body: unknown, status = 200): Response =>
  Response.json(body, {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      "x-content-type-options": "nosniff",
    },
  });

const clean = (value: string | undefined): string | null => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
};

function safeLabel(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > 220) return null;
  return /^[A-Za-z0-9][A-Za-z0-9._/@:+-]*$/.test(trimmed) ? trimmed : null;
}

function explicitHfRoute(model: string | null): string | null {
  if (!model) return null;
  const colon = model.lastIndexOf(":");
  if (colon <= model.indexOf("/") || colon === model.length - 1) return null;
  const route = model.slice(colon + 1).toLowerCase();
  if (!/^[a-z0-9][a-z0-9-]{1,62}$/.test(route)) return null;
  return HF_POLICY_ROUTES.has(route) ? null : route;
}

function validRunpodEndpointId(value: string | null): value is string {
  return Boolean(
    value &&
    value.length <= 64 &&
    /^[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?$/.test(value),
  );
}

function assertAllowedEndpoint(
  provider: CanaryProvider,
  endpoint: string,
): void {
  const url = new URL(endpoint);
  const allowed =
    url.protocol === "https:" &&
    ((provider === "huggingface" &&
      url.hostname === "router.huggingface.co" &&
      url.pathname === "/v1/chat/completions") ||
      (provider === "runpod" &&
        url.hostname === "api.runpod.ai" &&
        /^\/v2\/[A-Za-z0-9-]+\/openai\/v1\/chat\/completions$/.test(
          url.pathname,
        )));
  if (!allowed || url.username || url.password || url.search || url.hash)
    throw new Error("endpoint_not_allowlisted");
}

export function resolveProviderAdapter(
  env: ProviderCanaryEnv,
  provider: CanaryProvider,
): ResolvedAdapter {
  if (provider === "huggingface") {
    const token = clean(env.HF_INFERENCE_TOKEN);
    const rawModel = clean(env.HF_CANARY_MODEL);
    const model = safeLabel(rawModel);
    const modelRevision = safeLabel(clean(env.HF_CANARY_MODEL_REVISION));
    const providerRoute = explicitHfRoute(model);
    const missing: string[] = [];
    const invalid: string[] = [];
    if (!token) missing.push("HF_INFERENCE_TOKEN");
    if (!rawModel) missing.push("HF_CANARY_MODEL");
    if (rawModel && !model) invalid.push("HF_CANARY_MODEL");
    if (model && !providerRoute)
      invalid.push("HF_CANARY_MODEL_EXPLICIT_PROVIDER_SUFFIX");
    if (env.HF_CANARY_MODEL_REVISION && !modelRevision)
      invalid.push("HF_CANARY_MODEL_REVISION");
    assertAllowedEndpoint(provider, HF_ENDPOINT);
    return {
      provider,
      label: "Hugging Face Inference Providers",
      endpoint: HF_ENDPOINT,
      endpoint_revision: HF_ENDPOINT_REVISION,
      model,
      model_revision: modelRevision,
      provider_route: providerRoute,
      token,
      configured: missing.length === 0 && invalid.length === 0,
      missing_configuration: missing,
      invalid_configuration: invalid,
    };
  }

  const token = clean(env.RUNPOD_API_KEY);
  const endpointId = clean(env.RUNPOD_CANARY_ENDPOINT_ID);
  const rawModel = clean(env.RUNPOD_CANARY_MODEL);
  const model = safeLabel(rawModel);
  const modelRevision = safeLabel(clean(env.RUNPOD_CANARY_MODEL_REVISION));
  const missing: string[] = [];
  const invalid: string[] = [];
  if (!token) missing.push("RUNPOD_API_KEY");
  if (!endpointId) missing.push("RUNPOD_CANARY_ENDPOINT_ID");
  if (!rawModel) missing.push("RUNPOD_CANARY_MODEL");
  if (endpointId && !validRunpodEndpointId(endpointId))
    invalid.push("RUNPOD_CANARY_ENDPOINT_ID");
  if (rawModel && !model) invalid.push("RUNPOD_CANARY_MODEL");
  if (env.RUNPOD_CANARY_MODEL_REVISION && !modelRevision)
    invalid.push("RUNPOD_CANARY_MODEL_REVISION");
  const endpoint = validRunpodEndpointId(endpointId)
    ? `https://api.runpod.ai/v2/${endpointId}/openai/v1/chat/completions`
    : null;
  if (endpoint) assertAllowedEndpoint(provider, endpoint);
  return {
    provider,
    label: "RunPod Serverless vLLM",
    endpoint,
    endpoint_revision: RUNPOD_ENDPOINT_REVISION,
    model,
    model_revision: modelRevision,
    provider_route: endpointId ? "declared-serverless-endpoint" : null,
    token,
    configured: missing.length === 0 && invalid.length === 0,
    missing_configuration: missing,
    invalid_configuration: invalid,
  };
}

function publicAdapterStatus(adapter: ResolvedAdapter) {
  return {
    provider: adapter.provider,
    label: adapter.label,
    state: adapter.configured ? "CONFIGURED_UNCHECKED" : "UNCONFIGURED",
    configured: adapter.configured,
    endpoint: adapter.endpoint,
    endpoint_revision: adapter.endpoint_revision,
    model: adapter.model,
    model_revision: adapter.model_revision,
    provider_route: adapter.provider_route,
    missing_configuration: adapter.missing_configuration,
    invalid_configuration: adapter.invalid_configuration,
    reachable: false,
    executable: false,
    note: adapter.configured
      ? "Configured only. POST an authenticated minimal-chat probe to observe execution."
      : "Not probed. Configure the named server-side values first.",
  };
}

export function buildProviderCanaryStatus(env: ProviderCanaryEnv) {
  return {
    schema: "csoai.provider-canary-status/0.1",
    kind: "provider-canary-status",
    probe_on_get: false,
    invocation: {
      method: "POST",
      body: { provider: "huggingface | runpod", probe: "minimal-chat" },
      operator_bearer_configured: Boolean(
        clean(env.PROVIDER_CANARY_AUTH_TOKEN),
      ),
      same_origin_enforced_for_browser_requests: true,
    },
    adapters: (["huggingface", "runpod"] as CanaryProvider[]).map((provider) =>
      publicAdapterStatus(resolveProviderAdapter(env, provider)),
    ),
    policy: {
      user_inference: false,
      arbitrary_urls: false,
      automatic_fallback: false,
      response_content_returned: false,
      writes_board: false,
      measurement_state: "UNMEASURED",
    },
  };
}

function receiptBase(
  adapter: ResolvedAdapter,
  observedAt: string,
  timeoutMs: number,
): Omit<
  ProviderCanaryReceipt,
  "state" | "reachable" | "executable" | "result"
> {
  return {
    schema: "csoai.provider-capability-canary/0.1",
    kind: "provider-capability-canary",
    observed_at: observedAt,
    provider: adapter.provider,
    probe: "minimal-chat",
    configured: adapter.configured,
    target: {
      endpoint: adapter.endpoint,
      endpoint_revision: adapter.endpoint_revision,
      model: adapter.model,
      model_revision: adapter.model_revision,
      provider_route: adapter.provider_route,
    },
    request: {
      method: "POST",
      prompt_source: "fixed-server-canary",
      max_output_tokens: 1,
      temperature: 0,
      stream: false,
      timeout_ms: timeoutMs,
    },
    policy: {
      user_input_accepted: false,
      arbitrary_url_accepted: false,
      application_fallback_attempted: false,
      provider_internal_routing_verified: false,
      secrets_exposed: false,
      writes_board: false,
      measurement_state: "UNMEASURED",
    },
  };
}

function failureResult(
  latencyMs: number,
  errorCode: string,
): ProviderCanaryReceipt["result"] {
  return {
    http_status: null,
    latency_ms: latencyMs,
    response_content_type: null,
    response_bytes: 0,
    response_digest_sha256: null,
    response_digest_scope: null,
    openai_response_shape: false,
    observed_model: null,
    system_fingerprint: null,
    error_code: errorCode,
  };
}

async function sha256(bytes: Uint8Array): Promise<string> {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    bytes as unknown as BufferSource,
  );
  return [...new Uint8Array(digest)]
    .map((part) => part.toString(16).padStart(2, "0"))
    .join("");
}

async function readBoundedResponse(
  response: Response,
): Promise<{ bytes: Uint8Array; complete: boolean }> {
  if (!response.body) return { bytes: new Uint8Array(), complete: true };
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  while (true) {
    const next = await reader.read();
    if (next.done) break;
    const chunk = next.value;
    if (size + chunk.byteLength > PROVIDER_CANARY_MAX_RESPONSE_BYTES) {
      const remaining = PROVIDER_CANARY_MAX_RESPONSE_BYTES - size;
      if (remaining > 0) chunks.push(chunk.slice(0, remaining));
      size = PROVIDER_CANARY_MAX_RESPONSE_BYTES;
      try {
        await reader.cancel("provider canary response exceeded bounded size");
      } catch {
        // The bounded prefix is still usable for a digest if cancellation races
        // an upstream close. Never resume reading beyond the cap.
      }
      const joined = new Uint8Array(size);
      let offset = 0;
      for (const part of chunks) {
        joined.set(part, offset);
        offset += part.byteLength;
      }
      return { bytes: joined, complete: false };
    }
    chunks.push(chunk);
    size += chunk.byteLength;
  }
  const joined = new Uint8Array(size);
  let offset = 0;
  for (const part of chunks) {
    joined.set(part, offset);
    offset += part.byteLength;
  }
  return { bytes: joined, complete: true };
}

function responseMetadata(bytes: Uint8Array): {
  valid: boolean;
  observed_model: string | null;
  system_fingerprint: string | null;
} {
  try {
    const parsed = JSON.parse(new TextDecoder().decode(bytes)) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed))
      return { valid: false, observed_model: null, system_fingerprint: null };
    const value = parsed as Record<string, unknown>;
    const choices = Array.isArray(value.choices) ? value.choices : [];
    const hasOutput = choices.some((choice) => {
      if (!choice || typeof choice !== "object" || Array.isArray(choice))
        return false;
      const choiceRecord = choice as Record<string, unknown>;
      if (typeof choiceRecord.text === "string" && choiceRecord.text.length > 0)
        return true;
      const message = choiceRecord.message;
      if (!message || typeof message !== "object" || Array.isArray(message))
        return false;
      const content = (message as Record<string, unknown>).content;
      return typeof content === "string" && content.length > 0;
    });
    return {
      valid: hasOutput,
      observed_model: safeLabel(value.model),
      system_fingerprint: safeLabel(value.system_fingerprint),
    };
  } catch {
    return { valid: false, observed_model: null, system_fingerprint: null };
  }
}

export async function runProviderCanary(
  env: ProviderCanaryEnv,
  provider: CanaryProvider,
  dependencies: {
    fetcher?: FetchLike;
    nowMs?: () => number;
    timeoutMs?: number;
  } = {},
): Promise<ProviderCanaryReceipt> {
  const adapter = resolveProviderAdapter(env, provider);
  const fetcher = dependencies.fetcher ?? fetch;
  const nowMs = dependencies.nowMs ?? Date.now;
  const timeoutMs = dependencies.timeoutMs ?? PROVIDER_CANARY_TIMEOUT_MS;
  const started = nowMs();
  const observedAt = new Date(started).toISOString();
  const base = receiptBase(adapter, observedAt, timeoutMs);

  if (
    !adapter.configured ||
    !adapter.endpoint ||
    !adapter.model ||
    !adapter.token
  ) {
    return {
      ...base,
      state: "UNCONFIGURED",
      reachable: false,
      executable: false,
      result: failureResult(0, "UNCONFIGURED"),
    };
  }

  assertAllowedEndpoint(provider, adapter.endpoint);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetcher(adapter.endpoint, {
      method: "POST",
      redirect: "manual",
      signal: controller.signal,
      headers: {
        authorization: `Bearer ${adapter.token}`,
        "content-type": "application/json",
        accept: "application/json",
        "user-agent": "CSOAI-Provider-Canary/0.1",
      },
      body: JSON.stringify({
        model: adapter.model,
        messages: [{ role: "user", content: CANARY_PROMPT }],
        max_tokens: 1,
        temperature: 0,
        stream: false,
      }),
    });
    const bounded = await readBoundedResponse(response);
    const latencyMs = Math.max(0, Math.round(nowMs() - started));
    const digest = await sha256(bounded.bytes);
    const contentType =
      response.headers.get("content-type")?.slice(0, 160) ?? null;
    const isJson = Boolean(
      contentType?.toLowerCase().includes("application/json"),
    );
    const metadata = bounded.complete
      ? responseMetadata(bounded.bytes)
      : { valid: false, observed_model: null, system_fingerprint: null };
    const executable =
      response.ok && bounded.complete && isJson && metadata.valid;
    return {
      ...base,
      state: executable ? "EXECUTABLE" : "REACHABLE_NOT_EXECUTABLE",
      reachable: true,
      executable,
      result: {
        http_status: response.status,
        latency_ms: latencyMs,
        response_content_type: contentType,
        response_bytes: bounded.bytes.byteLength,
        response_digest_sha256: digest,
        response_digest_scope: bounded.complete ? "complete" : "prefix",
        openai_response_shape: metadata.valid,
        observed_model: metadata.observed_model,
        system_fingerprint: metadata.system_fingerprint,
        error_code: !bounded.complete
          ? "RESPONSE_TOO_LARGE"
          : !response.ok
            ? `HTTP_${response.status}`
            : !isJson
              ? "NON_JSON_RESPONSE"
              : !metadata.valid
                ? "INVALID_OPENAI_RESPONSE"
                : null,
      },
    };
  } catch {
    const latencyMs = Math.max(0, Math.round(nowMs() - started));
    return {
      ...base,
      state: "UNCHECKABLE",
      reachable: false,
      executable: false,
      result: failureResult(
        latencyMs,
        controller.signal.aborted ? "TIMEOUT" : "NETWORK_ERROR",
      ),
    };
  } finally {
    clearTimeout(timer);
  }
}

function sameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  return !origin || origin === new URL(request.url).origin;
}

function bearer(request: Request): string | null {
  const header = request.headers.get("authorization") || "";
  return header.startsWith("Bearer ") ? clean(header.slice(7)) : null;
}

function constantTimeEqual(left: string, right: string): boolean {
  const a = new TextEncoder().encode(left);
  const b = new TextEncoder().encode(right);
  let difference = a.length ^ b.length;
  const length = Math.max(a.length, b.length);
  for (let index = 0; index < length; index += 1)
    difference |= (a[index] ?? 0) ^ (b[index] ?? 0);
  return difference === 0;
}

function parseInvocation(
  value: unknown,
): { provider: CanaryProvider; probe: "minimal-chat" } | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const record = value as Record<string, unknown>;
  const keys = Object.keys(record).sort();
  if (keys.length !== 2 || keys[0] !== "probe" || keys[1] !== "provider")
    return null;
  if (
    record.probe !== "minimal-chat" ||
    (record.provider !== "huggingface" && record.provider !== "runpod")
  )
    return null;
  return {
    provider: record.provider,
    probe: "minimal-chat",
  };
}

export const onRequestGet: PagesFunction<ProviderCanaryEnv> = async ({ env }) =>
  json(buildProviderCanaryStatus(env));

export const onRequestPost: PagesFunction<ProviderCanaryEnv> = async (ctx) => {
  if (!sameOrigin(ctx.request))
    return json({ error: "cross_origin_probe_denied" }, 403);

  const expected = clean(ctx.env.PROVIDER_CANARY_AUTH_TOKEN);
  if (!expected)
    return json(
      {
        error: "provider_canary_auth_unconfigured",
        state: "UNCHECKABLE",
      },
      503,
    );
  const supplied = bearer(ctx.request);
  if (!supplied || !constantTimeEqual(supplied, expected))
    return json({ error: "unauthorized" }, 401);

  const declaredLength = Number(ctx.request.headers.get("content-length"));
  if (Number.isFinite(declaredLength) && declaredLength > MAX_INVOCATION_BYTES)
    return json({ error: "invocation_too_large" }, 413);
  const raw = await ctx.request.text();
  if (new TextEncoder().encode(raw).byteLength > MAX_INVOCATION_BYTES)
    return json({ error: "invocation_too_large" }, 413);

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return json({ error: "body_must_be_json" }, 400);
  }
  const invocation = parseInvocation(parsed);
  if (!invocation)
    return json(
      {
        error: "invalid_invocation",
        required: { provider: "huggingface | runpod", probe: "minimal-chat" },
        note: "URLs, prompts, models, and fallback settings are not accepted.",
      },
      400,
    );

  const receipt = await runProviderCanary(ctx.env, invocation.provider);
  return json(receipt, receipt.configured ? 200 : 424);
};
