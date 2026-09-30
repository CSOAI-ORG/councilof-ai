// SPDX-License-Identifier: Apache-2.0
/**
 * View tree -> DOM, with textContent only. Attributes are allow-listed; an href must be https.
 * Styles go in through a constructed stylesheet (adoptedStyleSheets), which a strict
 * style-src CSP does not block; a <style> element is the fallback for engines without it.
 */
const ATTRS = new Set(["class", "id", "href", "src", "alt", "target", "rel", "type", "scope", "datetime", "role", "lang", "for", "name", "value", "maxlength", "autocomplete", "readonly", "disabled", "aria-label", "aria-labelledby", "aria-live", "aria-pressed", "data-region", "data-state", "data-kind", "data-signature", "data-figure", "data-citation", "data-action", "data-verify", "data-attribution", "data-attribution-line", "data-subject", "data-answer", "data-status"]);

export function toDom(node, doc = document) {
  if (typeof node === "string" || typeof node === "number") return doc.createTextNode(String(node));
  const el = doc.createElement(node.tag);
  for (const [k, v] of Object.entries(node.attrs)) {
    if (!ATTRS.has(k) || v === null || v === undefined) continue;
    if ((k === "href" || k === "src") && !/^https:\/\//.test(String(v))) continue;
    el.setAttribute(k, String(v));
  }
  for (const c of node.children) el.appendChild(toDom(c, doc));
  return el;
}

// Theme: the host sets any of these custom properties on <gspc-evidence-panel>. State and
// signature chips keep their own colours: the frame is white-labelled, the evidence is not.
export const CSS = `
:host{display:block;contain:content;container-type:inline-size;font-family:var(--gspc-font,system-ui,-apple-system,"Segoe UI",Roboto,sans-serif);color:var(--gspc-fg,#1b1f24);font-size:var(--gspc-font-size,14px);line-height:1.45}
.panel{background:var(--gspc-bg,#fff);border:1px solid var(--gspc-border,#d0d7de);border-radius:var(--gspc-radius,8px);padding:16px;max-width:100%;box-sizing:border-box;overflow-wrap:anywhere}
.title{font-size:1.05em;margin:0 0 2px}
h3{font-size:.95em;margin:14px 0 6px}
p{margin:4px 0}
.k{color:var(--gspc-muted,#57606a)}
.note,.meta,.doctrine{color:var(--gspc-muted,#57606a);font-size:.92em}
code{font-family:var(--gspc-mono,ui-monospace,SFMono-Regular,Menlo,monospace);font-size:.9em;word-break:break-all}
.chip{display:inline-block;padding:2px 10px;border-radius:999px;font-weight:600;font-size:.9em;border:1px solid transparent}
.chip-measured,.chip-sig-valid{background:#dafbe1;color:#0a3d1a;border-color:#1a7f37}
.chip-tie{background:#fff8c5;color:#4d3800;border-color:#9a6700}
.chip-unmeasured{background:#eef1f4;color:#24292f;border-color:#57606a}
.chip-uncheckable,.chip-sig-uncheckable,.chip-sig-not_checked,.chip-sig-unsigned_index,.chip-sig-nothing_to_verify,.chip-sig-unsigned{background:#eef1f4;color:#24292f;border-color:#57606a}
.chip-sig-invalid{background:#ffebe9;color:#5c0011;border-color:#cf222e}
.figs{display:grid;grid-template-columns:max-content 1fr;gap:2px 12px;margin:8px 0}
.figs dt{color:var(--gspc-muted,#57606a)}
.figs dd{margin:0;font-variant-numeric:tabular-nums}
table.dvo{border-collapse:collapse;width:100%;font-size:.9em}
.dvo th,.dvo td{border-top:1px solid var(--gspc-border,#d0d7de);padding:4px 6px;text-align:left;vertical-align:top}
.dvo thead th{color:var(--gspc-muted,#57606a);font-weight:600}
ul{margin:4px 0;padding-left:18px}
.cite{background:var(--gspc-code-bg,#f6f8fa);padding:8px;border-radius:6px;font-size:.9em}
button{font:inherit;cursor:pointer;margin-top:6px;padding:6px 12px;min-height:32px;border-radius:6px;border:1px solid var(--gspc-accent,#0550ae);background:transparent;color:var(--gspc-accent,#0550ae)}
button:focus-visible,a:focus-visible{outline:2px solid var(--gspc-accent,#0550ae);outline-offset:2px}
a{color:var(--gspc-accent,#0550ae)}
.attr{margin-top:14px;padding:10px;border-radius:6px;background:#f6f8fa;color:#1b1f24;font-weight:600}
.attr a,.attr-line a{color:#0550ae}
.attr .doctrine{font-weight:400;color:#57606a}
.attr-line{margin:8px 0 0;font-size:.9em;font-weight:600;color:#1b1f24;background:#f6f8fa;padding:4px 8px;border-radius:4px}
.is-highlighted{outline:3px solid #bf8700;outline-offset:3px;border-radius:4px;transition:outline-color .3s}
.ask{margin-top:16px;border-top:1px solid var(--gspc-border,#d0d7de);padding-top:8px}
.ask-row{display:flex;flex-wrap:wrap;gap:8px;align-items:center}
.ask input{font:inherit;flex:1 1 180px;min-width:0;padding:6px 8px;border:1px solid #57606a;border-radius:6px;background:transparent;color:inherit}
.answer{margin-top:10px;padding:10px;border:1px solid var(--gspc-border,#d0d7de);border-radius:6px}
.answer pre{overflow-x:auto;background:var(--gspc-code-bg,#f6f8fa);padding:6px;border-radius:4px;white-space:pre-wrap;word-break:break-all}
.steps{padding-left:18px}
.logo{height:1.2em;width:auto;vertical-align:-.2em;margin-right:6px}
.watch{margin-top:10px;padding:10px;border:1px dashed #9a6700;border-radius:6px}.watch input{margin:0 0 6px 6px}
.activity ol{font-size:.88em;padding-left:18px}
button[disabled]{opacity:.5;cursor:default}
.config-error{border:1px solid #cf222e;padding:6px;border-radius:6px}
.loading{color:var(--gspc-muted,#57606a)}
@media (prefers-color-scheme:dark){
 :host{color:var(--gspc-fg,#e6edf3)}
 .panel{background:var(--gspc-bg,#0d1117);border-color:var(--gspc-border,#30363d)}
 .k,.note,.meta,.doctrine,.figs dt,.dvo thead th{color:var(--gspc-muted,#9da7b3)}
 .cite{background:var(--gspc-code-bg,#161b22)}
 a,button{color:var(--gspc-accent,#79c0ff);border-color:var(--gspc-accent,#79c0ff)}
 .attr,.attr-line{background:#161b22;color:#e6edf3}.attr a,.attr-line a{color:#79c0ff}.attr .doctrine{color:#9da7b3}
}
.dvo th,.dvo td{overflow-wrap:normal;word-break:normal}.dvo td{overflow-wrap:anywhere}
@container (max-width:480px){.panel{padding:12px}.figs{grid-template-columns:1fr}.figs dd{margin-bottom:6px}table.dvo,.dvo tbody,.dvo tr,.dvo th,.dvo td{display:block;width:auto}.dvo thead{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0)}.dvo tr{border-top:1px solid var(--gspc-border,#d0d7de);padding:6px 0}.dvo th,.dvo td{border:0;padding:2px 0}.dvo td:nth-of-type(1)::before{content:"Declared: ";color:var(--gspc-muted,#57606a)}.dvo td:nth-of-type(2)::before{content:"Observed: ";color:var(--gspc-muted,#57606a)}}
`;

export function applyStyles(root, doc = document) {
  try {
    if ("adoptedStyleSheets" in root && typeof CSSStyleSheet === "function") {
      const s = new CSSStyleSheet();
      s.replaceSync(CSS);
      root.adoptedStyleSheets = [s];
      return "constructed";
    }
  } catch {}
  const st = doc.createElement("style");
  st.textContent = CSS;
  root.appendChild(st);
  return "style-element";
}
