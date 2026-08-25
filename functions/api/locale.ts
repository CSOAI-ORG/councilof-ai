// functions/api/locale.ts — jurisdiction auto-detect for the OS front door.
//
// Cloudflare stamps every request with request.cf.country at the edge, so the OS
// can pre-scope the compliance experience to the visitor's regime with zero
// external geo service and zero stored PII. HONESTY CONTRACT: geolocation is a
// UX DEFAULT, never a legal fact — VPNs, corporate egress and carriers lie, and
// a system deployed across jurisdictions answers to every applicable regime
// regardless of what this endpoint returns. The payload says so, and the client
// must render an override control wherever it uses this.
//
// GET /api/locale -> { detected: {country, regime...}, disclaimer, override_hint }

interface Regime {
  id: string;
  name: string;
  instrument: string;      // the primary instrument we measure against
  crosswalk: string;       // route into the existing crosswalk/atlas surface
  language?: string;       // default UI language hint (BCP 47)
}

const EU = new Set([
  "AT","BE","BG","HR","CY","CZ","DK","EE","FI","FR","DE","GR","HU","IE","IT",
  "LV","LT","LU","MT","NL","PL","PT","RO","SK","SI","ES","SE",
]);
// EEA members apply EU-derived rules for most digital regulation.
const EEA_EXTRA = new Set(["NO", "IS", "LI"]);

const REGIMES: Record<string, Regime> = {
  eu:  { id: "eu",  name: "European Union",  instrument: "EU AI Act (Reg. 2024/1689)", crosswalk: "/guides/eu-ai-act" },
  uk:  { id: "uk",  name: "United Kingdom",  instrument: "UK pro-innovation framework + sectoral regulators", crosswalk: "/frameworks/uk-ai-bill" },
  us:  { id: "us",  name: "United States",   instrument: "NIST AI RMF + state acts (CO, CA, TX)", crosswalk: "/us-ai-regulation" },
  cn:  { id: "cn",  name: "China",           instrument: "TC260 framework + interim GenAI measures", crosswalk: "/compliance/tc260", language: "zh" },
  ca:  { id: "ca",  name: "Canada",          instrument: "AIDA (Bill C-27 lineage)", crosswalk: "/canada-aida" },
  sg:  { id: "sg",  name: "Singapore",       instrument: "Model AI Governance Framework", crosswalk: "/singapore-ai-governance" },
  br:  { id: "br",  name: "Brazil",          instrument: "PL 2338/2023 lineage", crosswalk: "/regulator-atlas", language: "pt" },
  kr:  { id: "kr",  name: "South Korea",     instrument: "AI Framework Act", crosswalk: "/regulator-atlas", language: "ko" },
  jp:  { id: "jp",  name: "Japan",           instrument: "AI Guidelines for Business", crosswalk: "/regulator-atlas", language: "ja" },
  au:  { id: "au",  name: "Australia",       instrument: "AI Ethics Principles + proposed mandatory guardrails", crosswalk: "/regulator-atlas" },
  global: { id: "global", name: "Global",    instrument: "NIST AI RMF + ISO/IEC 42001 (jurisdiction-neutral)", crosswalk: "/regulator-atlas" },
};

function regimeFor(country: string): Regime {
  if (EU.has(country) || EEA_EXTRA.has(country)) return REGIMES.eu;
  const direct: Record<string, Regime> = {
    GB: REGIMES.uk, US: REGIMES.us, CN: REGIMES.cn, CA: REGIMES.ca,
    SG: REGIMES.sg, BR: REGIMES.br, KR: REGIMES.kr, JP: REGIMES.jp, AU: REGIMES.au,
  };
  return direct[country] ?? REGIMES.global;
}

export const onRequestGet: PagesFunction = async (context) => {
  const cf = (context.request as any).cf ?? {};
  const url = new URL(context.request.url);
  const forced = url.searchParams.get("country")?.toUpperCase();
  const country: string =
    forced && /^[A-Z]{2}$/.test(forced) ? forced
    : typeof cf.country === "string" ? cf.country : "XX";
  const regime = regimeFor(country);
  const acceptLang = context.request.headers.get("accept-language") ?? "";
  const language = regime.language ?? acceptLang.split(",")[0]?.split("-")[0]?.trim() ?? "en";

  return new Response(
    JSON.stringify(
      {
        schema: "csoai.locale/0.1",
        detected: {
          country,
          regime: regime.id,
          regime_name: regime.name,
          instrument: regime.instrument,
          crosswalk: regime.crosswalk,
          language,
        },
        disclaimer:
          "IP geolocation is a UX default, not a legal determination. Systems deployed " +
          "across jurisdictions are subject to every applicable regime. Confirm or " +
          "override the detected jurisdiction before relying on any scoping here.",
        override_hint: "Pass ?country=DE (ISO 3166-1 alpha-2) to preview any jurisdiction.",
      },
      null,
      2,
    ),
    {
      headers: {
        "content-type": "application/json; charset=utf-8",
        // per-visitor answer — never cache at the edge across users
        "cache-control": "private, no-store",
        "access-control-allow-origin": "*",
      },
    },
  );
};
