/**
 * Client store for jurisdiction desk hint: fetch edge geo-hint, confirm / override.
 * Never treats IP as legal residence. Soft language default if unset.
 */

import {
  ALL_DESK_OPTIONS,
  buildJurisdictionHint,
  type DeskId,
  type JurisdictionHint,
} from "./jurisdictionHint";

const STORAGE_KEY = "csoai.jurisdiction-hint.v1";

export type StoredJurisdiction = {
  confirmed: boolean;
  desk: DeskId;
  country: string | null;
  language: string;
  source: JurisdictionHint["source"];
  at: string;
};

function loadStored(): StoredJurisdiction | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as StoredJurisdiction;
  } catch {
    return null;
  }
}

function saveStored(s: StoredJurisdiction) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  } catch {
    /* ignore */
  }
}

export async function fetchJurisdictionHint(): Promise<JurisdictionHint> {
  const stored = loadStored();
  if (stored?.confirmed) {
    return buildJurisdictionHint({
      country: stored.country,
      source: "manual",
      deskOverride: stored.desk,
    });
  }

  try {
    const r = await fetch("/api/geo-hint");
    if (r.ok) {
      const j = (await r.json()) as JurisdictionHint & { country: string | null };
      if (stored && !stored.confirmed) {
        // Keep prior unconfirmed pick if user changed desk but didn't confirm
        return buildJurisdictionHint({
          country: j.country,
          source: j.source,
          deskOverride: stored.desk,
          acceptLanguage: null,
        });
      }
      return {
        ...j,
        confirmRequired: true,
      };
    }
  } catch {
    /* fall through */
  }

  // Browser-only fallback — still a proxy
  const lang = typeof navigator !== "undefined" ? navigator.language : "en-US";
  const region = lang.includes("-") ? lang.split("-")[1] : null;
  return buildJurisdictionHint({
    country: region,
    source: "browser",
    acceptLanguage: lang,
  });
}

export function confirmJurisdiction(hint: JurisdictionHint): StoredJurisdiction {
  const row: StoredJurisdiction = {
    confirmed: true,
    desk: hint.desk,
    country: hint.country,
    language: hint.language,
    source: hint.source,
    at: new Date().toISOString(),
  };
  saveStored(row);
  // Soft language default only if user never picked one
  try {
    if (!localStorage.getItem("language") && hint.language) {
      localStorage.setItem("language", hint.language);
    }
  } catch {
    /* ignore */
  }
  return row;
}

export function overrideDesk(desk: DeskId, base: JurisdictionHint): JurisdictionHint {
  const next = buildJurisdictionHint({
    country: base.country,
    source: "manual",
    deskOverride: desk,
  });
  saveStored({
    confirmed: false,
    desk: next.desk,
    country: next.country,
    language: next.language,
    source: "manual",
    at: new Date().toISOString(),
  });
  return next;
}

export function clearJurisdictionHint() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

export { ALL_DESK_OPTIONS };
export type { DeskId, JurisdictionHint };
