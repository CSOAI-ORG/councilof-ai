/**
 * GET /api/geo-hint — edge country → suggested East-West desk + language.
 *
 * Uses Cloudflare `request.cf.country` when present (no third-party IP API).
 * Falls back to Accept-Language. Never claims compliance or legal residence.
 * Measurement, not certification. Mapping ≠ determination.
 */

type DeskId = "eu" | "uk" | "illinois" | "china" | "us";

const EU27 = new Set([
  "AT", "BE", "BG", "HR", "CY", "CZ", "DK", "EE", "FI", "FR", "DE", "GR", "HU",
  "IE", "IT", "LV", "LT", "LU", "MT", "NL", "PL", "PT", "RO", "SK", "SI", "ES", "SE",
]);

const COUNTRY_LANGUAGE: Record<string, string> = {
  US: "en-US", GB: "en-GB", FR: "fr", DE: "de", ES: "es", IT: "it", NL: "nl",
  PL: "pl", PT: "pt", SE: "sv", DK: "da", FI: "fi", CN: "zh-CN", IE: "en-GB",
  BE: "fr", AT: "de",
};

const DESK_META: Record<DeskId, { path: string; label: string; region: string }> = {
  eu: { path: "/east-west/desks/eu", label: "EU desk (AI Act crosswalk)", region: "EU" },
  uk: { path: "/east-west/desks/uk", label: "UK desk (DRCF principles)", region: "UK" },
  illinois: { path: "/east-west/desks/illinois", label: "Illinois desk (SB 315)", region: "US" },
  china: { path: "/east-west/desks/china", label: "China desk (CAC / TC260)", region: "CN" },
  us: { path: "/east-west/desks/us", label: "US honesty desk (no single federal Act)", region: "US" },
};

const DOCTRINE =
  "Suggested default only — IP/country is a proxy, not a legal fact. VPNs and corporate egress misplace people. Multi-jurisdiction deployers remain on the hook for every regime. Mapping is not a determination. Measurement, not certification.";

function countryToDesk(country: string | null): DeskId {
  const c = String(country || "").toUpperCase();
  if (!c) return "eu";
  if (EU27.has(c)) return "eu";
  if (c === "GB") return "uk";
  if (c === "CN") return "china";
  if (c === "US") return "us";
  return "eu";
}

function countryToLanguage(country: string | null, acceptLanguage: string | null): string {
  const c = String(country || "").toUpperCase();
  if (c && COUNTRY_LANGUAGE[c]) return COUNTRY_LANGUAGE[c];
  if (acceptLanguage) {
    const primary = acceptLanguage.split(",")[0]?.trim().split(";")[0]?.trim() || "";
    if (primary.toLowerCase().startsWith("zh")) return "zh-CN";
    if (primary.toLowerCase().startsWith("en-gb")) return "en-GB";
    if (primary.toLowerCase().startsWith("en")) return "en-US";
    const prefix = primary.split("-")[0].toLowerCase();
    const map: Record<string, string> = {
      fr: "fr", de: "de", es: "es", it: "it", nl: "nl", pl: "pl",
      pt: "pt", sv: "sv", da: "da", fi: "fi",
    };
    if (map[prefix]) return map[prefix];
  }
  return "en-US";
}

type CfRequest = Request & { cf?: { country?: string } };

export const onRequestGet: PagesFunction = async ({ request }) => {
  const req = request as CfRequest;
  const cfCountry = req.cf?.country ? String(req.cf.country).toUpperCase() : null;
  const accept = request.headers.get("accept-language");

  let country = cfCountry;
  let source: "cf-country" | "accept-language" | "none" = cfCountry ? "cf-country" : "none";

  if (!country && accept) {
    const m = accept.split(",")[0]?.match(/-([A-Za-z]{2})\\b/);
    if (m) {
      country = m[1].toUpperCase();
      source = "accept-language";
    }
  }

  const url = new URL(request.url);
  const deskParam = url.searchParams.get("desk");
  const deskOverride =
    deskParam && ["eu", "uk", "illinois", "china", "us"].includes(deskParam)
      ? (deskParam as DeskId)
      : null;

  const desk = deskOverride ?? countryToDesk(country);
  const meta = DESK_META[desk];

  const body = {
    country,
    source: deskOverride ? "manual" : source,
    desk,
    deskPath: meta.path,
    deskLabel: meta.label,
    language: countryToLanguage(country, accept),
    region: meta.region,
    confirmRequired: true,
    doctrine: DOCTRINE,
    grammar: "suggested_default_not_legal_fact",
    measured: false,
  };

  return new Response(JSON.stringify(body), {
    headers: {
      "content-type": "application/json",
      "cache-control": "private, max-age=300",
      "access-control-allow-origin": "*",
      "x-grammar": "IP/country proxy default; confirm or override; mapping ≠ determination",
    },
  });
};
