/**
 * Map edge country / Accept-Language → East-West desk + UI language.
 * IP/country is a PROXY default, not a legal fact. Mapping ≠ determination.
 * Measurement, not certification.
 */

export type DeskId = "eu" | "uk" | "illinois" | "china" | "us";

export type JurisdictionHint = {
  country: string | null;
  /** Edge / browser source honesty */
  source: "cf-country" | "accept-language" | "browser" | "manual" | "none";
  desk: DeskId;
  deskPath: string;
  deskLabel: string;
  language: string;
  region: "EU" | "UK" | "US" | "CN" | "GLOBAL";
  /** Always true on auto hints — user must confirm for anything that matters */
  confirmRequired: true;
  doctrine: string;
};

const EU27 = new Set([
  "AT", "BE", "BG", "HR", "CY", "CZ", "DK", "EE", "FI", "FR", "DE", "GR", "HU",
  "IE", "IT", "LV", "LT", "LU", "MT", "NL", "PL", "PT", "RO", "SK", "SI", "ES", "SE",
]);

const COUNTRY_LANGUAGE: Record<string, string> = {
  US: "en-US",
  GB: "en-GB",
  FR: "fr",
  DE: "de",
  ES: "es",
  IT: "it",
  NL: "nl",
  PL: "pl",
  PT: "pt",
  SE: "sv",
  DK: "da",
  FI: "fi",
  CN: "zh-CN",
  IE: "en-GB",
  BE: "fr",
  AT: "de",
};

const DESK_META: Record<DeskId, { path: string; label: string; region: JurisdictionHint["region"] }> = {
  eu: { path: "/east-west/desks/eu", label: "EU desk (AI Act crosswalk)", region: "EU" },
  uk: { path: "/east-west/desks/uk", label: "UK desk (DRCF principles)", region: "UK" },
  illinois: { path: "/east-west/desks/illinois", label: "Illinois desk (SB 315)", region: "US" },
  china: { path: "/east-west/desks/china", label: "China desk (CAC / TC260)", region: "CN" },
  us: { path: "/east-west/desks/us", label: "US honesty desk (no single federal Act)", region: "US" },
};

const DOCTRINE =
  "Suggested default only — IP/country is a proxy, not a legal fact. VPNs and corporate egress misplace people. Multi-jurisdiction deployers remain on the hook for every regime. Mapping is not a determination. Measurement, not certification.";

export function countryToDesk(country: string | null | undefined): DeskId {
  const c = String(country || "").toUpperCase();
  if (!c) return "eu"; // neutral-ish public default: show EU Act surface first
  if (EU27.has(c)) return "eu";
  if (c === "GB") return "uk";
  if (c === "CN") return "china";
  if (c === "US") return "us"; // state unknown from country alone — not Illinois by default
  return "eu";
}

export function countryToLanguage(country: string | null | undefined, acceptLanguage?: string | null): string {
  const c = String(country || "").toUpperCase();
  if (c && COUNTRY_LANGUAGE[c]) return COUNTRY_LANGUAGE[c];
  if (acceptLanguage) {
    const primary = acceptLanguage.split(",")[0]?.trim().split(";")[0]?.trim();
    if (primary) {
      if (primary.toLowerCase().startsWith("zh")) return "zh-CN";
      if (primary === "en-GB" || primary.toLowerCase().startsWith("en-gb")) return "en-GB";
      if (primary.toLowerCase().startsWith("en")) return "en-US";
      const prefix = primary.split("-")[0].toLowerCase();
      const map: Record<string, string> = {
        fr: "fr", de: "de", es: "es", it: "it", nl: "nl", pl: "pl",
        pt: "pt", sv: "sv", da: "da", fi: "fi",
      };
      if (map[prefix]) return map[prefix];
    }
  }
  return "en-US";
}

export function buildJurisdictionHint(opts: {
  country: string | null;
  source: JurisdictionHint["source"];
  acceptLanguage?: string | null;
  deskOverride?: DeskId | null;
}): JurisdictionHint {
  const desk = opts.deskOverride ?? countryToDesk(opts.country);
  const meta = DESK_META[desk];
  return {
    country: opts.country ? opts.country.toUpperCase() : null,
    source: opts.deskOverride ? "manual" : opts.source,
    desk,
    deskPath: meta.path,
    deskLabel: meta.label,
    language: countryToLanguage(opts.country, opts.acceptLanguage),
    region: meta.region,
    confirmRequired: true,
    doctrine: DOCTRINE,
  };
}

export const ALL_DESK_OPTIONS: { id: DeskId; label: string; path: string }[] = (
  Object.keys(DESK_META) as DeskId[]
).map((id) => ({ id, label: DESK_META[id].label, path: DESK_META[id].path }));
