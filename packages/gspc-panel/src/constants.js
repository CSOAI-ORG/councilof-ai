// SPDX-License-Identifier: Apache-2.0
// The fixed words of the panel. The host may restyle the frame; nothing here is themeable.

export const ORIGIN = "https://councilof.ai";

/** Only these origins may be read. A preview origin exists so the panel can be proved before a deploy. */
export function allowedOrigin(o) {
  return typeof o === "string" && /^https:\/\/(councilof\.ai|[a-z0-9-]+\.councilof-ai\.pages\.dev)$/.test(o);
}

export const STATES = Object.freeze(["MEASURED", "UNMEASURED", "UNCHECKABLE", "TIE"]);

/** States under which a figure may be shown. Every other state renders words only. */
export const FIGURE_STATES = Object.freeze(["MEASURED", "TIE"]);

export const ATTRIBUTION_TEXT = "Evidence by GSPC · Council of AI";

export const DOCTRINE =
  "Measurement, not certification. No verdict, no ranking, no grade. An unmeasured subject stays unmeasured.";

export const STATE_WORDS = Object.freeze({
  MEASURED: "Measured",
  UNMEASURED: "Unmeasured",
  UNCHECKABLE: "Uncheckable",
  TIE: "Measured · tie",
});

export const PANEL_MODEL_SCHEMA = "csoai.gspc-panel-model/0.1";
export const PANEL_VERSION = "0.1.0";
