// functions/api/_x402_discovery.ts — the x402 DISCOVERY-REPAIR primitives shared by every
// metered door: the discovery extension emission, the PaymentPayload.resource backfill hook,
// and the paymentless-probe helpers. Pure functions only; nothing here fetches, signs or settles.
//
// WHY THIS FILE EXISTS (x402-foundation/x402#2156 "Bazaar discovery not indexing after successful
// CDP settlement on Base Mainnet", PayAINetwork/x402-solana#36 "Solana resource settles via PayAI
// facilitator but never appears in /discovery/resources"): a seller stays invisible to the Bazaar
// indexes unless EVERY route config emits the discovery extension (declareDiscoveryExtension with
// input + inputSchema + outputSchema), PaymentPayload.resource is non-null at /settle, and a
// paymentless empty-body POST sees the 402 envelope BEFORE any input validation can answer in
// front of it. This module is the one place those three rules are implemented, so the doors
// cannot drift apart and none can regress.
//
// SHAPE PROVENANCE. The emission shape here is the estate's hand-rolled equivalent of
// @x402/extensions/bazaar `declareDiscoveryExtension` (Pages Functions carry no npm @x402 deps;
// same reason functions/api/_x402.ts hand-rolls declareBazaarHttpGet). The outer shape matches
// specs/extensions/bazaar.md (info + schema); the inner paths are the ones x402scan and AgentCash
// actually read — input = schema.properties.input.properties.body ?? .queryParams, output =
// schema.properties.output.properties.example (@agentcash/discovery 1.7.5 extractSchemas2) — and
// the ones functions/api/free-door.discovery-schema.test.ts pins door-by-door. The SDK returns
// `{ bazaar: extension }`; this returns the extension itself, because buildPaymentRequiredV2
// places it at extensions.bazaar already. The SDK's `outputSchema` lands at
// schema.properties.output.properties.example (the extractor's fixed path); its `output.example`
// is our outputExample.
//
// DOCTRINE: measurement artifacts, never grades. Nothing here prices, sells or promises anything.

export type DiscoveryExtension = {
  info: Record<string, unknown>;
  schema: Record<string, unknown>;
};

export type DeclareDiscoveryExtensionInput = {
  /** GET/HEAD/DELETE declare query input; POST/PUT/PATCH require bodyType and declare body input. */
  method?: "GET" | "HEAD" | "DELETE" | "POST" | "PUT" | "PATCH";
  bodyType?: "json" | "form-data" | "text";
  /** Example query parameters (query methods) or example request body (body methods). */
  input?: Record<string, unknown>;
  /** JSON Schema for the query parameters (query methods) or the body (body methods). */
  inputSchema?: Record<string, unknown>;
  /** Example query parameters for a body method (POST ?subject=…). */
  queryParams?: Record<string, unknown>;
  queryParamsSchema?: Record<string, unknown>;
  /** JSON Schema for the deliverable — emitted at the extractor's fixed output path. */
  outputSchema?: Record<string, unknown>;
  /** A faithful example of the deliverable envelope (never a fabricated measurement). */
  outputExample?: Record<string, unknown>;
};

const EMPTY_OBJECT_SCHEMA: Record<string, unknown> = {
  type: "object",
  properties: {},
  additionalProperties: false,
};

/**
 * declareDiscoveryExtension — THE discovery extension emission for one route config.
 *
 * Emits `{ info, schema }` for `extensions.bazaar` on a 402 (and on the envelope echoed into
 * PaymentPayload). Both variants keep info.input and schema.properties.input consistent by
 * construction: a key present in info.input is declared in the schema and vice versa where the
 * facilitator validates one against the other (free-door learned this on 2026-09-05 when an
 * undeclared `queryParams` in info.input was rejected as an additional property).
 */
export function declareDiscoveryExtension(
  cfg: DeclareDiscoveryExtensionInput = {},
): DiscoveryExtension {
  const bodyMethod = cfg.bodyType !== undefined;
  const methodEnum = bodyMethod ? ["POST", "PUT", "PATCH"] : ["GET", "HEAD", "DELETE"];
  const method = cfg.method || (bodyMethod ? "POST" : "GET");
  const inputExample = cfg.input ?? {};
  const hasQuery = bodyMethod
    ? Boolean(cfg.queryParams && Object.keys(cfg.queryParams).length)
    : Boolean(Object.keys(inputExample).length);
  const queryExample = bodyMethod ? cfg.queryParams ?? {} : inputExample;
  const querySchema: Record<string, unknown> = (bodyMethod ? cfg.queryParamsSchema : cfg.inputSchema) ?? EMPTY_OBJECT_SCHEMA;
  const bodySchema: Record<string, unknown> = cfg.inputSchema ?? EMPTY_OBJECT_SCHEMA;

  const inputProps: Record<string, unknown> = {
    type: { type: "string", const: "http" },
    method: { type: "string", enum: methodEnum },
    ...(bodyMethod
      ? {
          bodyType: { type: "string", enum: ["json", "form-data", "text"] },
          body: { type: "object", ...bodySchema },
        }
      : {}),
    queryParams: { type: "object", ...querySchema },
  };
  const inputInfo: Record<string, unknown> = {
    type: "http",
    method,
    ...(bodyMethod ? { bodyType: cfg.bodyType, body: inputExample } : {}),
    ...(hasQuery ? { queryParams: queryExample } : {}),
  };

  const wantOutput = cfg.outputExample !== undefined || cfg.outputSchema !== undefined;
  const outputInfo: Record<string, unknown> = cfg.outputExample !== undefined
    ? { output: { type: "json", example: cfg.outputExample } }
    : {};

  return {
    info: { input: inputInfo, ...outputInfo },
    schema: {
      $schema: "https://json-schema.org/draft/2020-12/schema",
      type: "object",
      properties: {
        input: {
          type: "object",
          properties: inputProps,
          required: bodyMethod ? ["type", "method", "bodyType", "body"] : ["type", "method"],
          additionalProperties: false,
        },
        ...(wantOutput
          ? {
              output: {
                type: "object",
                properties: {
                  type: { type: "string" },
                  example: { type: "object", ...(cfg.outputSchema ?? {}) },
                },
                required: ["type"],
              },
            }
          : {}),
      },
      required: ["input"],
    },
  };
}

/**
 * onBeforeSettle — THE PAYMENTPAYLOAD.RESOURCE BACKFILL (server-side hook, runs on the body sent
 * to the facilitator's /verify and /settle). x402-foundation/x402#2156 and
 * PayAINetwork/x402-solana#36 both trace to the same indexer rule: PaymentPayload.resource must
 * be non-null at /settle or the resource is never catalogued — a rail can settle every payment
 * and stay invisible. The server knows the resource it is settling for, so it fills the field when
 * the buyer's envelope left it null/absent. A value the buyer DID send keeps precedence: it is
 * inside what the wallet signed and the server must not overwrite it.
 */
export function onBeforeSettle<T extends Record<string, unknown>>(envelope: T, resourceUrl: string): T {
  const payload = envelope.paymentPayload as Record<string, unknown> | undefined;
  if (!payload || typeof payload !== "object") return envelope;
  const current = payload.resource;
  const present =
    current !== undefined &&
    current !== null &&
    (typeof current !== "object" || Object.keys(current as Record<string, unknown>).length > 0);
  if (present) return envelope;
  const version = Number(payload.x402Version ?? envelope.x402Version ?? 1);
  const filled: Record<string, unknown> = {
    ...payload,
    // v1 carries the resource as a URL string on the payload; v2 as { url, … }.
    resource: version === 2 ? { url: resourceUrl } : resourceUrl,
  };
  return { ...envelope, paymentPayload: filled };
}

/**
 * isEmptyProbeBody — an indexer's probe is a POST with an empty body ("" , "{}" or "[]").
 * Anything else is a real request and falls through to the route handler untouched.
 */
export function isEmptyProbeBody(text: string): boolean {
  const t = (text || "").trim();
  if (t === "") return true;
  if (!t.startsWith("{") && !t.startsWith("[")) return false;
  // A probe can contain harmless JSON whitespace; a populated JSON body is
  // always a real buyer request and must reach the original route unchanged.
  try {
    const parsed: unknown = JSON.parse(t);
    if (Array.isArray(parsed)) return parsed.length === 0;
    return parsed !== null && typeof parsed === "object" && Object.keys(parsed).length === 0;
  } catch {
    return false;
  }
}

const GENERIC_DESCRIPTION =
  "CSOAI measured artefact — one signed measurement for one named input. " +
  "Measurement, never certification; a grade is never sold. Verification is free.";

/**
 * descriptionForPath — the canonical deliverable description for one door path, read from the
 * same module each door's own 402 reads (functions/api/_x402_descriptions.ts, the one source the
 * manifest, the 402s and llms.txt all quote). The opening sentence must survive a 120-char cut:
 * a Bazaar seed truncated free-door's text at 120 and the damage could not be re-seeded.
 */
export function descriptionForPath(
  pathname: string,
  deps: {
    byPath: Record<string, string>;
    pop: Record<string, string>;
    wrapperAsset: (symbol: string) => string;
    assetSymbols: Record<string, string>;
  },
): string {
  const direct = deps.byPath[pathname];
  if (direct) return direct;
  const pop = pathname.match(/^\/api\/pop\/([^/]+)$/);
  if (pop && deps.pop[pop[1]]) return deps.pop[pop[1]];
  const asset = pathname.match(/^\/api\/wrapper\/asset\/([^/]+)$/);
  if (asset && deps.assetSymbols[asset[1]]) return deps.wrapperAsset(deps.assetSymbols[asset[1]]);
  return GENERIC_DESCRIPTION;
}
