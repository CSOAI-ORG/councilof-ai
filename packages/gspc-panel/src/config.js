// SPDX-License-Identifier: Apache-2.0
/**
 * White-label host configuration.
 *
 *   {
 *     assistantName: "Acme Assistant",          // the name on the Ask box and on answers
 *     logoUrl: "https://acme.example/logo.svg",  // https only, drawn beside the assistant name
 *     theme: { "--gspc-accent": "#6d28d9" },     // --gspc-* frame variables only
 *     locale: "en",                              // sets lang; English strings ship (others fall back)
 *     hostContext: { product: "Acme Console" },  // opaque to the panel; never sent anywhere
 *     connectors: {                              // customer-authorised context, read-only by default
 *       projectId: "proj-42",
 *       mcpServers: ["https://mcp.acme.example/mcp"],
 *       agents: ["https://agents.acme.example/.well-known/agent-card.json"],
 *       readOnly: true,
 *     },
 *   }
 *
 * THE ONE THING CONFIG CANNOT DO: touch the attribution. "Evidence by GSPC · Council of AI" and
 * its verify link are drawn on every card and every grounded answer. A config that tries to hide,
 * rename, restyle or relink it is REJECTED as a whole (GspcConfigError), not partly applied, so a
 * host finds out at integration time instead of shipping a panel that silently differs.
 */
export class GspcConfigError extends Error {
  constructor(errors) {
    super(`gspc-panel config rejected: ${errors.join("; ")}`);
    this.name = "GspcConfigError";
    this.errors = errors;
  }
}

const ALLOWED = new Set(["assistantName", "logoUrl", "theme", "locale", "hostContext", "connectors"]);
const ATTRIBUTION_WORDS = /attribut|credit|powered|branding|brand|footer|verify|watermark|gspc|council|evidence/i;
const THEME_KEY = /^--gspc-(font|font-size|mono|fg|bg|muted|accent|border|radius|code-bg)$/;
const BAD_CSS = /url\(|expression|javascript:|[;{}<>\\]|@import/i;

export const DEFAULT_CONFIG = Object.freeze({
  assistantName: "GSPC",
  logoUrl: null,
  theme: {},
  locale: "en",
  hostContext: {},
  connectors: { projectId: null, mcpServers: [], agents: [], readOnly: true },
});

const httpsUrl = (u) => {
  try {
    return new URL(u).protocol === "https:";
  } catch {
    return false;
  }
};

/** Validate and normalise a host config. Throws GspcConfigError; never partly applies. */
export function normalizeConfig(raw) {
  if (raw === null || raw === undefined) return { ...DEFAULT_CONFIG, connectors: { ...DEFAULT_CONFIG.connectors } };
  if (typeof raw !== "object" || Array.isArray(raw)) throw new GspcConfigError(["config must be an object"]);
  const errors = [];
  for (const k of Object.keys(raw)) {
    if (ATTRIBUTION_WORDS.test(k)) errors.push(`"${k}": the attribution and verify link cannot be configured`);
    else if (!ALLOWED.has(k)) errors.push(`"${k}" is not a config key (allowed: ${[...ALLOWED].join(", ")})`);
  }
  const out = { ...DEFAULT_CONFIG, connectors: { ...DEFAULT_CONFIG.connectors } };

  if (raw.assistantName !== undefined) {
    const n = String(raw.assistantName).replace(/[\u0000-\u001f\u007f]/g, "").trim();
    if (!n || n.length > 40) errors.push("assistantName must be 1 to 40 characters");
    else if (/gspc|council of ai|evidence by/i.test(n)) errors.push("assistantName may not use the attribution's words (GSPC, Council of AI, Evidence by)");
    else out.assistantName = n;
  }
  if (raw.logoUrl !== undefined && raw.logoUrl !== null) {
    if (!httpsUrl(raw.logoUrl)) errors.push("logoUrl must be an https URL");
    else out.logoUrl = String(raw.logoUrl);
  }
  if (raw.theme !== undefined) {
    if (!raw.theme || typeof raw.theme !== "object" || Array.isArray(raw.theme)) errors.push("theme must be an object of --gspc-* variables");
    else
      for (const [k, v] of Object.entries(raw.theme)) {
        if (ATTRIBUTION_WORDS.test(k.replace(/^--gspc-/, ""))) errors.push(`theme "${k}": the attribution cannot be styled`);
        else if (!THEME_KEY.test(k)) errors.push(`theme "${k}" is not a frame variable`);
        else if (typeof v !== "string" || BAD_CSS.test(v) || v.length > 200) errors.push(`theme "${k}" has an unsafe value`);
        else out.theme[k] = v;
      }
  }
  if (raw.locale !== undefined) {
    if (!/^[a-z]{2,3}(-[A-Za-z0-9]{2,8})*$/.test(String(raw.locale))) errors.push("locale must be a BCP 47 tag");
    else out.locale = String(raw.locale);
  }
  if (raw.hostContext !== undefined) {
    if (!raw.hostContext || typeof raw.hostContext !== "object") errors.push("hostContext must be an object");
    else out.hostContext = { ...raw.hostContext };
  }
  if (raw.connectors !== undefined) {
    const c = raw.connectors;
    if (!c || typeof c !== "object" || Array.isArray(c)) errors.push("connectors must be an object");
    else {
      const list = (v, name) => {
        if (v === undefined) return [];
        if (!Array.isArray(v) || v.length > 200 || !v.every((u) => typeof u === "string" && httpsUrl(u))) {
          errors.push(`connectors.${name} must be a list of at most 200 https URLs`);
          return [];
        }
        return [...new Set(v)];
      };
      out.connectors = {
        projectId: c.projectId === undefined || c.projectId === null ? null : String(c.projectId).slice(0, 120),
        mcpServers: list(c.mcpServers, "mcpServers"),
        agents: list(c.agents, "agents"),
        readOnly: c.readOnly !== false,
      };
    }
  }
  if (errors.length) throw new GspcConfigError(errors);
  return out;
}
