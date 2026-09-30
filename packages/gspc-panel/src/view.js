// SPDX-License-Identifier: Apache-2.0
/**
 * Panel model (+ host config + Ask state) -> a plain view tree ({tag, attrs, children}). No DOM here,
 * so unit tests read the exact text a user would see; dom.js turns the tree into elements with
 * textContent only (never innerHTML), so no payload string can become markup.
 *
 * Regions carry data-region: state, figures, recheck, dvo, signature, corrections, citation,
 * connectors, ask, activity, attribution. The attribution region is drawn on every card, whatever
 * the config; every grounded Ask answer carries its own attribution line and verify link too.
 */
import { enforceDoctrine } from "./model.js";
import { ATTRIBUTION_TEXT, STATE_WORDS } from "./constants.js";
import { DEFAULT_CONFIG } from "./config.js";

export function h(tag, attrs, ...children) {
  return { tag, attrs: attrs ?? {}, children: children.flat().filter((c) => c !== null && c !== undefined && c !== false) };
}

function dateLine(label, value, note) {
  return h("p", { class: "meta" }, h("span", { class: "k" }, label + ": "), value ? h("time", { datetime: value }, value) : note ?? "not published");
}

function attributionLine(verifyUrl, attrUrl, extra) {
  return h(
    "p",
    { class: "attr-line", "data-attribution-line": "" },
    h("a", { href: attrUrl, target: "_blank", rel: "noopener", "data-attribution": "" }, ATTRIBUTION_TEXT),
    " · ",
    h("a", { href: verifyUrl, target: "_blank", rel: "noopener", "data-verify": "" }, "Verify"),
    extra ?? null,
  );
}

function hl(region, highlight) {
  return region === highlight ? " is-highlighted" : "";
}

function askSection(m, cfg, ask) {
  const name = cfg.assistantName;
  const a = ask.answer;
  const nodes = [
    h("h3", { id: "ask-h" }, cfg.logoUrl ? h("img", { src: cfg.logoUrl, alt: "", class: "logo" }) : null, `Ask ${name}`),
    h(
      "form",
      { "data-action": "ask", class: "ask-form", "aria-labelledby": "ask-h" },
      h("label", { for: "ask-q", class: "k" }, `Ask about this evidence — for example "explain this evidence", "watch it monthly" or "connect GSPC to my project"`),
      h("div", { class: "ask-row" },
        h("input", { id: "ask-q", name: "q", type: "text", autocomplete: "off", value: ask.question ?? "", maxlength: "500" }),
        h("button", { type: "submit", "data-action": "ask-submit" }, ask.busy ? "Asking…" : "Ask"),
      ),
    ),
  ];
  if (ask.busy) nodes.push(h("p", { class: "note", role: "status" }, `${name} is reading signed records…`));
  if (a && a.kind === "answer") {
    nodes.push(
      h("div", { class: "answer", "data-answer": a.grounded ? "grounded" : "ungrounded" },
        h("p", { class: "k" }, `${name}`),
        a.preface ? h("p", { class: "preface" }, a.preface) : null,
        a.grounded
          ? h("p", { class: "answer-text" }, a.text || "The records below answer this.")
          : h("p", { class: "note" }, "No signed record answered this question, so nothing is asserted.", a.text ? h("span", { class: "guidance" }, ` Guidance: ${a.text}`) : null),
        a.paid_refused ? h("p", { class: "note" }, a.paid_refused) : null,
        a.error ? h("p", { class: "note" }, `The run failed: ${a.error}`) : null,
        a.citations?.length
          ? h("ul", { class: "cites" }, ...a.citations.map((c) => h("li", {}, `${c.tool}${c.label ? ` · ${c.label}` : ""} · `, c.url && /^https:\/\//.test(c.url) ? h("a", { href: c.url, target: "_blank", rel: "noopener" }, c.record_id ? `record ${String(c.record_id).slice(0, 16)}` : "source") : c.record_id ?? "")))
          : null,
        a.grounded ? attributionLine(m.verify_url, m.attribution.url) : null,
        ask.voice ? h("button", { type: "button", "data-action": "speak" }, "Read aloud") : null,
      ),
    );
  }
  if (a && a.kind === "connect") {
    nodes.push(
      h("div", { class: "answer", "data-answer": "grounded" },
        h("p", { class: "k" }, name),
        h("p", {}, a.text),
        h("ol", { class: "steps" }, ...a.steps.map((s) => h("li", {}, h("span", { class: "k" }, s.label), h("pre", {}, h("code", {}, s.code))))),
        attributionLine(m.verify_url, "https://councilof.ai/connect-gspc"),
      ),
    );
  }
  if (ask.watch) {
    const w = ask.watch;
    nodes.push(
      h("form", { "data-action": "watch", class: `watch${hl("watch", ask.highlight)}`, "aria-label": "Monthly re-check request" },
        h("p", {}, w.text ?? "Request a monthly re-check. Nothing is scheduled until a person accepts it."),
        h("label", { for: "watch-s", class: "k" }, "Subject"),
        h("input", { id: "watch-s", name: "subject", type: "text", value: w.subject ?? "", readonly: w.status === "sent" ? "" : null }),
        h("p", { class: "k" }, "Cadence: monthly"),
        w.status === "sent"
          ? h("p", { role: "status" }, `Request ${w.result?.state ?? "sent"}${w.result?.request_id ? ` · ${w.result.request_id}` : ""}. ${w.result?.note ?? ""}`)
          : h("div", { class: "ask-row" },
              h("button", { type: "submit", "data-action": "confirm-watch" }, "Confirm request"),
              h("button", { type: "button", "data-action": "cancel-watch" }, "Cancel"),
            ),
      ),
    );
  }
  return h("section", { "data-region": "ask", class: "ask", "aria-label": `Ask ${name}` }, ...nodes);
}

function activitySection(ask) {
  const log = ask.log ?? [];
  if (!log.length && ask.runner === "idle") return null;
  const live = ask.runner === "playing" || ask.runner === "paused";
  return h("section", { "data-region": "activity", class: "activity", "aria-label": "What the assistant did in this panel" },
    h("h3", {}, "Activity in this panel"),
    h("ol", { "aria-live": "polite" }, ...log.slice(-12).map((e) => h("li", { "data-status": e.status }, `${e.tool}${e.args?.subject ? ` ${e.args.subject}` : e.args?.region ? ` ${e.args.region}` : ""} · ${e.status} · by ${e.source}`))),
    h("div", { class: "ask-row" },
      h("button", { type: "button", "data-action": "stop", disabled: live ? null : "" }, "Stop"),
      h("button", { type: "button", "data-action": "undo", disabled: ask.canUndo ? null : "" }, "Undo"),
      h("button", { type: "button", "data-action": "take-over", disabled: live ? null : "" }, "Take over"),
    ),
    h("p", { class: "note" }, "Actions stay inside this panel. They never touch the page around it."),
  );
}

export function viewTree(rawModel, opts = {}) {
  const m = enforceDoctrine(rawModel);
  const cfg = opts.config ?? DEFAULT_CONFIG;
  const ask = opts.ask ?? null;
  const highlight = ask?.highlight ?? null;
  const titleId = opts.titleId ?? "gspc-panel-title";
  const kindLabel = { mcp_server: "MCP server", agent_card: "Agent card", card: "Signed card", model: "Model", claim: "Claim registry" }[m.subject.kind] ?? "Subject";
  const nodes = [];

  if (opts.configErrors?.length)
    nodes.push(h("p", { class: "note config-error", role: "alert" }, `Host configuration rejected, defaults used: ${opts.configErrors.join("; ")}`));

  nodes.push(
    h("header", { class: "head" },
      h("h2", { id: titleId, class: "title" }, "Evidence"),
      h("p", { class: "subject" }, h("span", { class: "k" }, kindLabel + ": "), h("code", {}, m.subject.input || "none")),
    ),
  );

  nodes.push(
    h("section", { "data-region": "state", class: `state${hl("state", highlight)}`, "aria-label": "Subject state" },
      h("span", { class: `chip chip-${m.state.toLowerCase()}`, "data-state": m.state }, STATE_WORDS[m.state] ?? m.state),
      m.state_note ? h("p", { class: "note" }, m.state_note) : null,
    ),
  );

  if (m.figures.length)
    nodes.push(
      h("section", { "data-region": "figures", class: hl("figures", highlight).trim(), "aria-label": "Figures" },
        h("dl", { class: "figs" }, ...m.figures.map((f) => [h("dt", {}, f.label), h("dd", { "data-figure": "" }, String(f.value))])),
      ),
    );

  nodes.push(
    h("section", { "data-region": "recheck", class: hl("recheck", highlight).trim(), "aria-label": "Measurement dates" },
      dateLine("Last measured", m.last_measured, "not published"),
      dateLine("Next re-check", m.next_recheck, m.next_recheck_note ?? "not published"),
    ),
  );

  if (m.declared_vs_observed.summary || m.declared_vs_observed.rows.length)
    nodes.push(
      h("section", { "data-region": "dvo", class: hl("dvo", highlight).trim(), "aria-label": "Declared versus observed" },
        h("h3", {}, "Declared vs observed"),
        m.declared_vs_observed.summary ? h("p", {}, m.declared_vs_observed.summary) : null,
        m.declared_vs_observed.rows.length
          ? h("table", { class: "dvo" },
              h("thead", {}, h("tr", {}, h("th", { scope: "col" }, "Dimension"), h("th", { scope: "col" }, "Declared"), h("th", { scope: "col" }, "Observed"))),
              h("tbody", {}, ...m.declared_vs_observed.rows.slice(0, 12).map((r) => h("tr", {}, h("th", { scope: "row" }, r.dimension), h("td", {}, r.declared), h("td", {}, r.observed)))),
            )
          : null,
      ),
    );

  nodes.push(
    h("section", { "data-region": "signature", class: hl("signature", highlight).trim(), "aria-label": "Signature" },
      h("h3", {}, "Signature"),
      h("p", {}, h("span", { class: `chip chip-sig-${String(m.signature.state).toLowerCase()}`, "data-signature": m.signature.state }, m.signature.state), m.signature.where ? ` · checked ${m.signature.where}` : ""),
      m.signature.detail ? h("p", { class: "note" }, m.signature.detail) : null,
      m.signature.key ? h("p", { class: "note" }, h("span", { class: "k" }, "Key: "), h("code", {}, m.signature.key)) : null,
    ),
  );

  nodes.push(
    h("section", { "data-region": "corrections", class: hl("corrections", highlight).trim(), "aria-label": "Corrections" },
      h("h3", {}, "Corrections"),
      m.corrections.length
        ? h("ul", {}, ...m.corrections.map((c) => h("li", {}, c.id ? h("code", {}, c.id) : null, c.date ? ` (${c.date}) ` : " ", c.summary)))
        : h("p", { class: "note" }, m.corrections_note ?? "No correction names this subject."),
    ),
  );

  if (m.citation)
    nodes.push(
      h("section", { "data-region": "citation", class: hl("citation", highlight).trim(), "aria-label": "Citation" },
        h("h3", {}, "Cite"),
        h("p", { class: "cite", "data-citation": "" }, m.citation),
        h("button", { type: "button", "data-action": "copy-citation" }, "Copy citation"),
      ),
    );

  const c = cfg.connectors;
  const mine = [...(c?.mcpServers ?? []), ...(c?.agents ?? [])];
  if (mine.length)
    nodes.push(
      h("section", { "data-region": "connectors", "aria-label": "Your servers and agents" },
        h("h3", {}, `Your servers and agents${c.projectId ? ` (${c.projectId})` : ""}${c.readOnly ? " · read-only" : ""}`),
        h("ul", { class: "mine" }, ...mine.slice(0, 50).map((u) => h("li", {}, h("button", { type: "button", "data-action": "pick-subject", "data-subject": u, "aria-pressed": u === m.subject.input ? "true" : "false" }, u)))),
      ),
    );

  if (ask) {
    nodes.push(askSection(m, cfg, ask));
    const act = activitySection(ask);
    if (act) nodes.push(act);
  }

  nodes.push(
    h("footer", { "data-region": "attribution", class: "attr" },
      attributionLine(m.verify_url, m.attribution.url),
      h("p", { class: "doctrine" }, m.doctrine),
    ),
  );

  return h("article", { class: "panel", "aria-labelledby": titleId, "data-state": m.state, "data-kind": m.subject.kind, lang: cfg.locale }, ...nodes);
}

/** Visible text of a view tree (what a screen reader or a grader reads). */
export function textOf(node) {
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (!node) return "";
  const inner = node.children.map(textOf).join("");
  return /^(p|h2|h3|li|tr|dt|dd|section|header|footer|button|pre)$/.test(node.tag) ? inner + "\n" : inner;
}

/** First node with a given data-region. */
export function region(node, name) {
  if (!node || typeof node !== "object") return null;
  if (node.attrs?.["data-region"] === name) return node;
  for (const c of node.children) {
    const r = region(c, name);
    if (r) return r;
  }
  return null;
}
