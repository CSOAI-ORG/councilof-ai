// SPDX-License-Identifier: Apache-2.0
/**
 * A2UI v0.9.1 in and out.
 *
 * VERSION. Read 30 Sep 2026 at https://a2ui.org/: v0.9.1 is the "Current production release"
 * (spec https://a2ui.org/specification/v0.9.1-a2ui/); v1.0 is a "Release candidate". The panel
 * emits v0.9.1 only, the same version councilof.ai's /api/a2ui/verify and /api/a2ui/board emit by
 * default. A surface is three JSONL messages: createSurface {surfaceId, catalogId}, updateComponents
 * {surfaceId, components}, updateDataModel {surfaceId, path, value}. Basic catalog only (Card,
 * Column, Text, Divider); every bound value is a JSON Pointer {path} into the data model.
 *
 * EMIT. The data model carries the whole panel model under /gspc_panel, so any A2UI renderer can
 * draw the surface from the basic catalog and a GSPC-aware one can rebuild the exact panel.
 *
 * ACCEPT. Only surfaces that carry GSPC evidence are accepted: ours (/gspc_panel), and the two
 * surfaces councilof.ai serves (gspc_verify_*, gspc_board_*). Anything else is refused with
 * UNCHECKABLE rather than drawn under our attribution: we attribute only what we measured.
 */
import { enforceDoctrine } from "./model.js";
import { PANEL_MODEL_SCHEMA, STATE_WORDS } from "./constants.js";

export const A2UI = Object.freeze({
  version: "v0.9.1",
  status: "Current",
  spec: "https://a2ui.org/specification/v0.9.1-a2ui/",
  catalogId: "https://a2ui.org/specification/v0_9_1/catalogs/basic/catalog.json",
  mime: "application/a2ui+json",
});

const T = (id, path, variant = "body") => ({ id, component: "Text", text: { path }, variant });

export function toA2ui(rawModel, surfaceId = "gspc_panel") {
  const m = enforceDoctrine(rawModel);
  const lines = [];
  const data = {
    gspc_panel: m,
    title: "GSPC evidence",
    subject_line: `${m.subject.kind}: ${m.subject.input}`,
    state_line: `${STATE_WORDS[m.state]}${m.state_note ? ` — ${m.state_note}` : ""}`,
    dates_line: `Last measured: ${m.last_measured ?? "not published"} · Next re-check: ${m.next_recheck ?? m.next_recheck_note ?? "not published"}`,
    signature_line: `Signature: ${m.signature.state}${m.signature.where ? ` (checked ${m.signature.where})` : ""}`,
    corrections_line: m.corrections.length ? `Corrections: ${m.corrections.map((c) => c.id).filter(Boolean).join(", ")}` : `Corrections: ${m.corrections_note ?? "none name this subject"}`,
    citation: m.citation ?? "",
    attribution_line: `${m.attribution.text} · Verify: ${m.verify_url}`,
    doctrine: m.doctrine,
    figures: m.figures.map((f) => `${f.label}: ${f.value}`),
    dvo_summary: m.declared_vs_observed.summary ?? "",
  };
  const components = [
    { id: "root", component: "Card", child: "body" },
    T("title", "/title", "h3"),
    T("subject", "/subject_line", "caption"),
    T("state", "/state_line"),
    T("dates", "/dates_line", "caption"),
  ];
  lines.push("title", "subject", "state", "dates");
  data.figures.forEach((_, i) => {
    components.push(T(`figure_${i + 1}`, `/figures/${i}`));
    lines.push(`figure_${i + 1}`);
  });
  if (data.dvo_summary) {
    components.push(T("dvo", "/dvo_summary"));
    lines.push("dvo");
  }
  components.push(T("signature", "/signature_line"), T("corrections", "/corrections_line", "caption"));
  lines.push("signature", "corrections");
  if (data.citation) {
    components.push(T("citation", "/citation", "caption"));
    lines.push("citation");
  }
  components.push({ id: "divider", component: "Divider" }, T("attribution", "/attribution_line"), T("doctrine", "/doctrine", "caption"));
  lines.push("divider", "attribution", "doctrine");
  components.splice(1, 0, { id: "body", component: "Column", children: lines });
  return [
    { version: A2UI.version, createSurface: { surfaceId, catalogId: A2UI.catalogId } },
    { version: A2UI.version, updateComponents: { surfaceId, components } },
    { version: A2UI.version, updateDataModel: { surfaceId, path: "/", value: data } },
  ];
}

export const toJsonl = (msgs) => msgs.map((x) => JSON.stringify(x)).join("\n") + "\n";

export function parseJsonl(text) {
  return String(text ?? "")
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => JSON.parse(l));
}

function refused(reason) {
  return enforceDoctrine({
    schema: PANEL_MODEL_SCHEMA,
    subject: { input: "", kind: "a2ui" },
    state: "UNCHECKABLE",
    state_note: reason,
    figures: [],
    declared_vs_observed: { summary: null, rows: [] },
    signature: { state: "NOT_CHECKED", where: null, detail: null, key: null },
    corrections: [],
    sources: [],
  });
}

/** A2UI messages (array or JSONL text) -> panel model. */
export function fromA2ui(input) {
  let msgs;
  try {
    msgs = typeof input === "string" ? parseJsonl(input) : Array.isArray(input) ? input : [];
  } catch {
    return refused("The A2UI description is not valid JSONL.");
  }
  const bad = msgs.find((x) => x?.version && x.version !== "v0.9.1" && x.version !== "v0.9");
  if (bad) return refused(`A2UI ${bad.version} is not accepted; this panel reads v0.9.1.`);
  const create = msgs.find((x) => x?.createSurface)?.createSurface;
  const dm = msgs.filter((x) => x?.updateDataModel && (x.updateDataModel.path ?? "/") === "/").pop()?.updateDataModel?.value;
  if (!create || !dm) return refused("The A2UI description has no surface or no data model.");
  if (dm.gspc_panel?.schema === PANEL_MODEL_SCHEMA) {
    // Received, not re-read: say so on the signature line, so a relayed surface never looks
    // like a check this browser ran. The verify link re-reads it from councilof.ai.
    const p = dm.gspc_panel;
    const sig = { ...(p.signature ?? {}) };
    sig.where = `${sig.where ?? "not stated"}, as received in A2UI — not re-checked here`;
    return enforceDoctrine({ ...p, signature: sig, sources: [...(Array.isArray(p.sources) ? p.sources : []), "A2UI v0.9.1 message"] });
  }
  if (/^gspc_verify/.test(create.surfaceId) && typeof dm.state === "string") {
    const st = dm.state;
    return enforceDoctrine({
      schema: PANEL_MODEL_SCHEMA,
      subject: { input: dm.card_id ?? "", kind: "card" },
      state: st === "VALID" ? "MEASURED" : "UNCHECKABLE",
      state_note: st === "VALID" ? "From councilof.ai's A2UI verify surface. Open the card for its figures." : dm.state_line ?? null,
      figures: [],
      declared_vs_observed: { summary: null, rows: [] },
      signature: { state: st, where: "councilof.ai verify_card (A2UI surface)", detail: `${dm.checks_passed ?? "?"} of ${dm.checks_total ?? "?"} checks passed`, key: null },
      corrections: [],
      verify_url: dm.card_id ? `https://councilof.ai/gspc-verify?card=${dm.card_id}` : undefined,
      citation: dm.card_id ? `Council of AI, signed measurement card ${dm.card_id}. Evidence by GSPC · Council of AI.` : null,
      sources: [],
    });
  }
  return refused("This A2UI surface carries no GSPC evidence, so it is not drawn under GSPC attribution.");
}
