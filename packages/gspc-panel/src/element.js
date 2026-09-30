// SPDX-License-Identifier: Apache-2.0
/**
 * <gspc-evidence-panel subject="…" transport="direct|agui" origin="https://councilof.ai" ask>
 *
 * Framework-free custom element in a shadow root.
 *   el.config = { assistantName, logoUrl, theme, locale, hostContext, connectors }   (config.js)
 *     or the attribute config='{"assistantName":"Acme Assistant"}'
 *   el.renderA2ui(jsonlOrArray)   draw from an A2UI v0.9.1 description
 *   el.renderAgui(sseText)        draw from an AG-UI event stream
 *   el.ask(question)              ask the grounded assistant (also the in-panel Ask box)
 *   el.a2ui / el.model / el.actionLog
 * Events (bubbling, composed): "gspc-panel:model" (detail = model), "gspc-panel:action" (detail =
 * one action-log entry). hostContext is never sent to councilof.ai; it rides on these events only.
 * The Ask box is on by default; add ask="off" to hide it.
 */
import { ORIGIN, allowedOrigin } from "./constants.js";
import { makeSources } from "./sources.js";
import { buildModel, enforceDoctrine } from "./model.js";
import { viewTree } from "./view.js";
import { applyStyles, toDom } from "./dom.js";
import { toA2ui, fromA2ui } from "./a2ui.js";
import { modelFromAgui, runAgui } from "./agui.js";
import { verifyCard } from "./verify-card.vendored.js";
import { DEFAULT_CONFIG, GspcConfigError, normalizeConfig } from "./config.js";
import { askGspc, requestWatch } from "./ask.js";
import { ActionRunner, planActions, withFrontendTools } from "./actions.js";
// Opt-in voice (attribute voice="on"): the Council OS voice module, imported, not re-written.
import { speakVoice, stopVoice } from "../../../client/src/lib/councilVoice.ts";

let seq = 0;
const Base = typeof HTMLElement === "function" ? HTMLElement : class {};

export class GspcEvidencePanel extends Base {
  static get observedAttributes() {
    return ["subject", "transport", "origin", "config", "ask", "voice"];
  }

  constructor() {
    super();
    this._id = `gspc-panel-${++seq}`;
    this._root = this.attachShadow({ mode: "open" });
    applyStyles(this._root);
    this._live = document.createElement("div");
    this._root.appendChild(this._live);
    this._model = null;
    this._token = 0;
    this._config = normalizeConfig(null);
    this._configErrors = [];
    this._ask = { question: "", busy: false, answer: null, watch: null, highlight: null, log: [], runner: "idle", canUndo: false };
    this._runner = new ActionRunner({
      apply: (a) => this._applyAction(a),
      onChange: () => this._syncRunner(),
    });
    this.fetchFn = null; // hosts/tests may inject a fetch; it still only ever sees councilof.ai URLs
    this._root.addEventListener("click", (e) => this._onClick(e));
    this._root.addEventListener("submit", (e) => this._onSubmit(e));
  }

  connectedCallback() {
    if (this.getAttribute("config") && !this._configSet) this._setConfig(this._parseConfigAttr());
    if (this.getAttribute("subject")) this.refresh();
  }

  attributeChangedCallback(name, oldV, newV) {
    if (oldV === newV || !this.isConnected) return;
    if (name === "config") {
      this._setConfig(this._parseConfigAttr());
      if (this._model) this._draw(this._model);
      return;
    }
    if (this.getAttribute("subject")) this.refresh();
  }

  _parseConfigAttr() {
    try {
      return JSON.parse(this.getAttribute("config"));
    } catch {
      return { __invalid_json__: true };
    }
  }

  set config(raw) {
    this._configSet = true;
    this._setConfig(raw);
    if (this._model) this._draw(this._model);
  }

  get config() {
    return this._config;
  }

  _setConfig(raw) {
    for (const k of Object.keys(this._config.theme ?? {})) this.style.removeProperty(k);
    try {
      this._config = normalizeConfig(raw);
      this._configErrors = [];
    } catch (e) {
      this._config = normalizeConfig(null);
      this._configErrors = e instanceof GspcConfigError ? e.errors : [String(e?.message ?? e)];
    }
    for (const [k, v] of Object.entries(this._config.theme)) this.style.setProperty(k, v);
  }

  get origin() {
    const o = this.getAttribute("origin") || ORIGIN;
    return allowedOrigin(o) ? o : ORIGIN;
  }
  get model() {
    return this._model;
  }
  get a2ui() {
    return this._model ? toA2ui(this._model, `gspc_panel_${this._id}`) : null;
  }
  get actionLog() {
    return this._runner.log.slice();
  }
  get _fetch() {
    return this.fetchFn ?? globalThis.fetch.bind(globalThis);
  }
  _sources() {
    return makeSources({ origin: this.origin, fetchFn: this._fetch });
  }

  async refresh() {
    const token = ++this._token;
    const subject = this.getAttribute("subject") || "";
    if (!this._model) this._loading(subject);
    const sources = this._sources();
    let m;
    try {
      if (this.getAttribute("transport") === "agui") {
        const sse = await runAgui(subject, { origin: this.origin, fetchFn: this._fetch });
        m = await modelFromAgui(sse, { sources, verifyCard });
      } else m = await buildModel(subject, { sources, verifyCard });
    } catch (e) {
      m = enforceDoctrine({ subject: { input: subject, kind: "unknown" }, state: "UNCHECKABLE", state_note: `Could not read councilof.ai: ${e.message}`, figures: [], declared_vs_observed: { summary: null, rows: [] }, signature: { state: "NOT_CHECKED" }, corrections: [], sources: [] });
    }
    if (token === this._token) this._draw(m);
    return m;
  }

  renderA2ui(input) {
    ++this._token;
    this._draw(fromA2ui(input));
  }

  async renderAgui(sseText) {
    const token = ++this._token;
    const m = await modelFromAgui(sseText, { sources: this._sources(), verifyCard });
    if (token === this._token) this._draw(m);
  }

  // ---------------------------------------------------------------- Ask + actions
  async ask(question) {
    const q = String(question ?? "").trim().slice(0, 500);
    if (!q) return null;
    this._runner.stop();
    this._ask = { ...this._ask, question: q, busy: true, answer: null, highlight: null };
    this._redraw();
    let answer;
    try {
      answer = await askGspc(q, { subject: this.getAttribute("subject") || "", origin: this.origin, fetchFn: withFrontendTools(this._fetch) });
    } catch (e) {
      answer = { kind: "answer", grounded: false, text: "", citations: [], error: e.message };
    }
    this._ask.busy = false;
    if (answer.kind === "confirm") this._ask.answer = null;
    else this._ask.answer = answer;
    this._redraw();
    const actions = planActions(answer.run, { intent: answer.intent, subject: this.getAttribute("subject") || "" });
    if (answer.kind === "confirm" && !actions.some((a) => a.tool === "fill_watch_form"))
      actions.push({ tool: "fill_watch_form", args: { subject: answer.subject }, source: "panel" }, { tool: "pause_at_confirm", args: {}, source: "panel" });
    if (answer.kind === "confirm") this._pendingWatchText = answer.text;
    await this._runner.play(actions);
    return answer;
  }

  async _applyAction(a) {
    if (a.tool === "open_subject") {
      const prev = this.getAttribute("subject");
      this.setAttribute("subject", a.args.subject);
      await this.refresh();
      return async () => {
        if (prev) this.setAttribute("subject", prev);
        else this.removeAttribute("subject");
        await this.refresh();
      };
    }
    if (a.tool === "highlight_evidence") {
      const prev = this._ask.highlight;
      this._ask.highlight = a.args.region;
      this._redraw();
      this._live.querySelector(`[data-region="${a.args.region}"]`)?.scrollIntoView?.({ block: "nearest", behavior: "smooth" });
      return () => {
        this._ask.highlight = prev;
        this._redraw();
      };
    }
    if (a.tool === "fill_watch_form") {
      const prev = this._ask.watch;
      this._ask.watch = { subject: a.args.subject || this.getAttribute("subject") || "", status: "filled", text: this._pendingWatchText };
      this._ask.highlight = "watch";
      this._redraw();
      return () => {
        this._ask.watch = prev;
        this._redraw();
      };
    }
    throw new Error(`unknown panel action ${a.tool}`);
  }

  _syncRunner() {
    const log = this._runner.log;
    const last = log[log.length - 1];
    if (last && last !== this._lastLogged) {
      this._lastLogged = last;
      this.dispatchEvent(new CustomEvent("gspc-panel:action", { detail: { ...last, hostContext: this._config.hostContext }, bubbles: true, composed: true }));
    }
    this._ask.log = log;
    this._ask.runner = this._runner.state;
    this._ask.canUndo = this._runner.undos.length > 0;
    this._redraw();
  }

  async _onSubmit(e) {
    const form = e.target;
    const action = form?.getAttribute?.("data-action");
    if (!action) return;
    e.preventDefault();
    if (action === "ask") return this.ask(form.querySelector("input[name=q]")?.value);
    if (action === "watch") {
      const subject = form.querySelector("input[name=subject]")?.value?.trim();
      if (!subject) return;
      this._runner.record("confirm_watch_request", { subject }, "confirmed by person");
      let result;
      try {
        result = await requestWatch(subject, { origin: this.origin, fetchFn: this._fetch });
      } catch (err) {
        result = { ok: false, state: "NOT_RECORDED", note: err.message };
      }
      this._ask.watch = { subject, status: "sent", result };
      this._runner.record("watch_request", { subject }, result.state);
    }
  }

  async _onClick(e) {
    const btn = e.target?.closest?.("[data-action]");
    if (!btn || btn.tagName !== "BUTTON") return;
    const act = btn.getAttribute("data-action");
    if (act === "copy-citation") return this._copyCitation(btn);
    if (act === "speak") {
      const a = this._ask.answer;
      if (!a) return;
      stopVoice();
      const said = [a.preface, a.grounded ? a.text : "No signed record answered this question.", "Evidence by GSPC, Council of AI."].filter(Boolean).join(" ");
      this._runner.record("read_aloud", {}, "started by person");
      return speakVoice(said);
    }
    if (act === "stop") return this._runner.stop();
    if (act === "take-over") return this._runner.takeOver();
    if (act === "undo") return this._runner.undo();
    if (act === "cancel-watch") {
      this._ask.watch = null;
      this._ask.highlight = null;
      this._runner.record("cancel_watch_request", {}, "cancelled by person");
      return;
    }
    if (act === "pick-subject") {
      this._runner.record("open_subject", { subject: btn.getAttribute("data-subject") }, "picked by person");
      this.setAttribute("subject", btn.getAttribute("data-subject"));
    }
  }

  async _copyCitation(btn) {
    const text = this._model?.citation ?? "";
    try {
      await navigator.clipboard.writeText(text);
      btn.textContent = "Citation copied";
    } catch {
      const range = document.createRange();
      range.selectNodeContents(this._live.querySelector("[data-citation]"));
      const sel = getSelection();
      sel.removeAllRanges();
      sel.addRange(range);
      btn.textContent = "Selected — press Ctrl/Cmd+C";
    }
  }

  // ---------------------------------------------------------------- drawing
  _loading(subject) {
    this._clear();
    const p = document.createElement("p");
    p.className = "loading";
    p.setAttribute("role", "status");
    p.textContent = `Reading evidence for ${subject}…`;
    this._live.appendChild(p);
  }
  _clear() {
    while (this._live.firstChild) this._live.removeChild(this._live.firstChild);
  }
  _redraw() {
    if (this._model) this._draw(this._model, true);
  }
  _draw(model, quiet = false) {
    this._model = enforceDoctrine(model);
    const active = this._root.activeElement;
    const focusSel = active?.id ? `#${active.id}` : active?.getAttribute?.("data-action") ? `[data-action="${active.getAttribute("data-action")}"]` : null;
    const draft = this._live.querySelector("input[name=q]")?.value;
    this._clear();
    const askOn = this.getAttribute("ask") !== "off";
    const voice = this.getAttribute("voice") === "on" && typeof speechSynthesis !== "undefined";
    const el = toDom(viewTree(this._model, { titleId: `${this._id}-title`, config: this._config, configErrors: this._configErrors, ask: askOn ? { ...this._ask, voice } : null }));
    if (draft !== undefined && !this._ask.busy) {
      const i = el.querySelector("input[name=q]");
      if (i) i.value = draft;
    }
    this._live.appendChild(el);
    if (focusSel) this._live.querySelector(focusSel)?.focus?.();
    if (!quiet) this.dispatchEvent(new CustomEvent("gspc-panel:model", { detail: this._model, bubbles: true, composed: true }));
  }
}

export function definePanel(name = "gspc-evidence-panel") {
  if (typeof customElements !== "undefined" && !customElements.get(name)) customElements.define(name, GspcEvidencePanel);
}

export { DEFAULT_CONFIG };
