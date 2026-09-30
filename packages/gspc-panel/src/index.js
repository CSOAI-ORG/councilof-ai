// SPDX-License-Identifier: Apache-2.0
// Browser entry: defines <gspc-evidence-panel> and exports the core for hosts that want it.
export { GspcEvidencePanel, definePanel } from "./element.js";
export { buildModel, enforceDoctrine } from "./model.js";
export { classifySubject } from "./subject.js";
export { makeSources } from "./sources.js";
export { viewTree, textOf } from "./view.js";
export { toA2ui, fromA2ui, toJsonl, A2UI } from "./a2ui.js";
export { parseSse, modelFromAgui } from "./agui.js";
export { verifyCard } from "./verify-card.vendored.js";
export { ATTRIBUTION_TEXT, PANEL_VERSION } from "./constants.js";
export { normalizeConfig, GspcConfigError, DEFAULT_CONFIG } from "./config.js";
export { askGspc, askIntent, requestWatch } from "./ask.js";
export { FRONTEND_TOOLS, planActions, ActionRunner } from "./actions.js";
import { definePanel } from "./element.js";
definePanel();
