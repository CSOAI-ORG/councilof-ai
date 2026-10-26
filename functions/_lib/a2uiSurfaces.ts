/**
 * A2UI renderings of two GSPC results: the board card (board_totals / GET /api/gspc) and a
 * verify result (verify_card). Added 30 Sep 2026 (lane gspc-product-ui).
 *
 * WHICH A2UI. Read from the official site on 30 Sep 2026 (https://a2ui.org/):
 *   - v0.9.1 is the "Current production release" (spec https://a2ui.org/specification/v0.9.1-a2ui/,
 *     message schema https://a2ui.org/specification/v0_9_1/server_to_client.json, whose `version`
 *     enum is ["v0.9", "v0.9.1"]). A surface is three messages: createSurface {surfaceId, catalogId}
 *     then updateComponents {surfaceId, components} then updateDataModel {surfaceId, path, value};
 *     createSurface carries no components (additionalProperties: false).
 *   - v1.0 is a "Release candidate" (https://a2ui.org/specification/v1.0-a2ui/): createSurface may
 *     carry components and dataModel inline, and the basic catalog's Text variant is only
 *     "caption" | "body".
 * So the default here is v0.9.1, and v1.0 is emitted only on request, labelled Candidate.
 *
 * CATALOG ID. The v0.9.1 spec's own examples use
 * https://a2ui.org/specification/v0_9_1/catalogs/basic/catalog.json, the URL the catalog is served
 * at; the catalog document served there declares catalogId ".../v0_9/catalogs/basic/catalog.json".
 * We emit the spec's example id and record the upstream difference in the descriptor.
 *
 * WHAT THE SURFACE MAY SAY. Only fields of the tool output it renders. No figure is typed here, a
 * missing field renders as "not in the payload", and a TIE stays a TIE. Measurement, not
 * certification.
 */
type Json = Record<string, unknown>;

export const A2UI_SPECS = {
  "v0.9.1": {
    version: "v0.9.1",
    status: "Current",
    spec: "https://a2ui.org/specification/v0.9.1-a2ui/",
    schema: "https://a2ui.org/specification/v0_9_1/server_to_client.json",
    catalogId: "https://a2ui.org/specification/v0_9_1/catalogs/basic/catalog.json",
  },
  "v1.0": {
    version: "v1.0",
    status: "Candidate",
    spec: "https://a2ui.org/specification/v1.0-a2ui/",
    schema: "https://a2ui.org/specification/v1_0/server_to_client.json",
    catalogId: "https://a2ui.org/specification/v1_0/catalogs/basic/catalog.json",
  },
} as const;

export type A2uiVersion = keyof typeof A2UI_SPECS;
export const A2UI_DEFAULT_VERSION: A2uiVersion = "v0.9.1";

/** "0.9.1", "v0.9.1", "1.0", "v1.0" → a supported version; anything else → the default. */
export function pickA2uiVersion(raw: string | null | undefined): A2uiVersion {
  const v = String(raw ?? "").trim().toLowerCase().replace(/^v/, "");
  if (v === "1.0" || v === "1") return "v1.0";
  return A2UI_DEFAULT_VERSION;
}

export interface BuiltSurface {
  surfaceId: string;
  components: Json[];
  dataModel: Json;
}

/** Text in the basic catalog. Heading variants exist only in v0.9.x; v1.0 has caption | body. */
function t(id: string, text: unknown, role: "title" | "body" | "caption" = "body"): Json {
  const out: Json = { id, component: "Text", text: typeof text === "object" && text !== null ? text : String(text ?? "") };
  out.variant = role === "title" ? "h3" : role;
  return out;
}

function adaptForVersion(components: Json[], version: A2uiVersion): Json[] {
  if (version === "v0.9.1") return components;
  return components.map((c) => (c.component === "Text" && c.variant !== "caption" ? { ...c, variant: "body" } : c));
}

/** The wire messages for one surface, in the chosen version. */
export function surfaceMessages(b: BuiltSurface, version: A2uiVersion = A2UI_DEFAULT_VERSION): Json[] {
  const spec = A2UI_SPECS[version];
  const components = adaptForVersion(b.components, version);
  if (version === "v1.0") {
    return [
      {
        version: spec.version,
        createSurface: { surfaceId: b.surfaceId, catalogId: spec.catalogId, sendDataModel: false, components, dataModel: b.dataModel },
      },
    ];
  }
  return [
    { version: spec.version, createSurface: { surfaceId: b.surfaceId, catalogId: spec.catalogId } },
    { version: spec.version, updateComponents: { surfaceId: b.surfaceId, components } },
    { version: spec.version, updateDataModel: { surfaceId: b.surfaceId, path: "/", value: b.dataModel } },
  ];
}

function sid(prefix: string): string {
  return `${prefix}_${crypto.randomUUID()}`;
}

function str(v: unknown): string | null {
  return typeof v === "string" && v.trim() ? v.trim() : null;
}
function rec(v: unknown): Json | null {
  return v && typeof v === "object" && !Array.isArray(v) ? (v as Json) : null;
}

/**
 * The board card from either the board_totals structured output or a GET /api/gspc payload.
 * Reads public_count and the separation line; both come from the payload or the card says so.
 */
export function boardCardSurface(raw: unknown, surfaceId = sid("gspc_board")): BuiltSurface {
  const j = rec(raw) ?? {};
  const totals = rec(j.totals);
  const sep = rec(j.separation);
  const publicCount = str(j.public_count) ?? str(totals?.public_count);
  const separation = str(sep?.public_count) ?? str(totals?.separation_public_count);
  const source = str(j.source) ?? "https://councilof.ai/api/gspc";
  const asOf = rec(j.as_of);
  const measuredOn = str(asOf?.board_measured_on) ?? null;
  // board_totals carries totals and the separation line but no axes array. The per-axis lists are
  // then UNKNOWN (null), not empty: [] beside "7 TIE · 7 UNTESTED" said there were none (6 Oct 2026).
  const axes = Array.isArray(j.axes) ? (j.axes as Json[]) : null;
  const tie = axes ? axes.filter((a) => a?.separation === "TIE").map((a) => String(a.axis)) : null;
  const untested = axes
    ? axes.filter((a) => a?.kind === "model-comparison" && a?.separation !== "TIE" && a?.separation !== "SEPARATED").map((a) => String(a.axis))
    : null;
  const components: Json[] = [
    { id: "root", component: "Card", child: "body" },
    { id: "body", component: "Column", children: ["title", "count", "separation", "divider", "limits", "source"] },
    t("title", "GSPC board", "title"),
    t("count", { path: "/public_count" }),
    t("separation", { path: "/separation" }),
    { id: "divider", component: "Divider" },
    t("limits", "A tie stays a tie and an untested axis stays untested. Measurement, not certification.", "caption"),
    t("source", { path: "/source_line" }, "caption"),
  ];
  return {
    surfaceId,
    components,
    dataModel: {
      public_count: publicCount ?? "public_count is not in the payload",
      separation: separation ?? "the separation line is not in the payload",
      source,
      source_line: `Source: ${source}${measuredOn ? ` · measured ${measuredOn}` : ""}`,
      tie_axes: tie,
      untested_axes: untested,
      state: publicCount ? "LIVE" : "PARTIAL",
    },
  };
}

/** A verify_card result: VALID / INVALID / UNCHECKABLE, the card id and every check, as returned. */
export function verifyResultSurface(raw: unknown, surfaceId = sid("gspc_verify")): BuiltSurface {
  const j = rec(raw) ?? {};
  const state = str(j.state) ?? "UNCHECKABLE";
  const id = str(j.id);
  const reason = str(j.reason);
  const checks = (Array.isArray(j.checks) ? (j.checks as Json[]) : []).slice(0, 12);
  const checkIds = checks.map((_, i) => `check_${i + 1}`);
  const components: Json[] = [
    { id: "root", component: "Card", child: "body" },
    { id: "body", component: "Column", children: ["title", "state", "card_id", ...(reason ? ["reason"] : []), "divider", ...checkIds, "limits"] },
    t("title", "Signed card check", "title"),
    t("state", { path: "/state_line" }),
    t("card_id", { path: "/card_line" }, "caption"),
    ...(reason ? [t("reason", { path: "/reason" })] : []),
    { id: "divider", component: "Divider" },
    ...checks.map((c, i) => t(checkIds[i], `${c.ok === true ? "ok" : c.ok === false ? "failed" : "not run"} · ${String(c.check ?? c.code ?? "check")}${str(c.detail) ? ` — ${str(c.detail)}` : ""}`, "caption")),
    t("limits", "A valid signature proves the bytes are unchanged since signing. It is not a certificate of the system measured.", "caption"),
  ];
  return {
    surfaceId,
    components,
    dataModel: {
      state,
      state_line: state === "VALID" ? "VALID — verifies under the published key" : state === "INVALID" ? "INVALID — see the failed check" : `${state} — nothing was asserted`,
      card_id: id,
      card_line: id ? `Card ${id}` : "No card id in the result",
      reason,
      checks: checks.map((c) => ({ check: c.check ?? null, ok: c.ok ?? null, code: c.code ?? null })),
      checks_passed: checks.filter((c) => c.ok === true).length,
      checks_total: checks.length,
      url: str(rec(j.resolved_from)?.url),
    },
  };
}

/** Which tool outputs get an A2UI rendering in the AG-UI stream (CUSTOM "a2ui" event). */
export function a2uiForTool(tool: string, output: unknown, version: A2uiVersion = A2UI_DEFAULT_VERSION): Json | null {
  const built = tool === "board_totals" ? boardCardSurface(output) : tool === "verify_card" ? verifyResultSurface(output) : null;
  if (!built) return null;
  const spec = A2UI_SPECS[version];
  return { protocol: "A2UI", version: spec.version, status: spec.status, spec: spec.spec, tool, messages: surfaceMessages(built, version) };
}
