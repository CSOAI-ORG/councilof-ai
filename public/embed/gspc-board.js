/* councilof.ai/embed/gspc-board.js: the <gspc-board> web component.

   Live data from the GSPC board. It shows three things read from GET /api/gspc: the board's
   totals.public_count (verbatim), measured_on.date as the as_of (verbatim), and a link to
   councilof.ai/board/. It also prints totals.separation_public_count, which the board says to
   read beside the count and never instead of it.

   It is not a badge. It shows no mark, grade, rank, score or pass/fail. Nothing in it is
   typed: if the board cannot be read it says "unread" and shows no count. An unread board is
   not a board of zeros.

   Usage:
     <script src="https://councilof.ai/embed/gspc-board.js" defer></script>
     <gspc-board></gspc-board>
     <gspc-board theme="dark"></gspc-board>

   Without JavaScript, use the iframe page instead:
     <iframe src="https://councilof.ai/embed/board" width="420" height="200" style="border:0"
             loading="lazy" title="GSPC board: live data"></iframe>

   Measurement, not certification. */
(function (root) {
  "use strict";
  var API = "https://councilof.ai/api/gspc";
  var PAGE = "https://councilof.ai/board/";

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  // Read the few fields shown. Absent public_count = unread, never 0.
  function facts(d) {
    if (!d || typeof d !== "object") return { unread: "the board answered with no object" };
    var t = d.totals || {};
    if (typeof t.public_count !== "string" || !t.public_count.trim()) return { unread: "the board carries no totals.public_count" };
    var m = d.measured_on || {};
    return {
      public_count: t.public_count,
      as_of: typeof m.date === "string" && m.date.trim() ? m.date : null,
      separation: typeof t.separation_public_count === "string" && t.separation_public_count.trim() ? t.separation_public_count : null
    };
  }

  var CSS =
    ":host{display:block;max-width:420px;font:14px/1.4 -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;" +
    "--bg:#fff;--ink:#111827;--muted:#4b5563;--line:#e5e7eb;--accent:#047857}" +
    ":host([theme=dark]){--bg:#0f1412;--ink:#e6ebe8;--muted:#a3b1ab;--line:#26302c;--accent:#34d399}" +
    ".b{background:var(--bg);color:var(--ink);border:1px solid var(--line);border-radius:8px;padding:14px 16px}" +
    ".k{margin:0;font-size:12px;color:var(--muted)}.c{margin:6px 0 2px;font-size:22px;font-weight:600}" +
    ".s{margin:0 0 8px;font-size:12px;color:var(--muted)}.a{margin:0 0 10px;font-size:12px}" +
    ".l{margin:0;font-size:12px;color:var(--muted)}a{color:var(--accent)}";

  var FOOT =
    '<p class="l"><a href="' + PAGE + '" target="_blank" rel="noopener">councilof.ai/board</a> · measurement, not certification</p>';

  function render(state) {
    if (state === "loading") return '<style>' + CSS + '</style><div class="b" part="board"><p class="k">GSPC board</p><p class="c" data-field="loading">reading the board…</p>' + FOOT + "</div>";
    if (state.unread) {
      return '<style>' + CSS + '</style><div class="b" part="board"><p class="k">GSPC board</p>' +
        '<p class="c" data-field="unread">unread</p><p class="s">' + esc(state.unread) +
        ". No count is shown because none was read.</p>" + FOOT + "</div>";
    }
    return '<style>' + CSS + '</style><div class="b" part="board"><p class="k">Live data from the GSPC board</p>' +
      '<p class="c" data-field="public_count">' + esc(state.public_count) + "</p>" +
      (state.separation ? '<p class="s" data-field="separation_public_count">' + esc(state.separation) + "</p>" : "") +
      '<p class="a" data-field="as_of">as_of: ' + esc(state.as_of || "absent from the payload") + "</p>" + FOOT + "</div>";
  }

  var api = { facts: facts, render: render, API: API, PAGE: PAGE };
  root.GSPCBoard = api;

  if (!root.customElements || !root.HTMLElement || root.customElements.get("gspc-board")) return;

  class GspcBoard extends root.HTMLElement {
    connectedCallback() {
      if (this._started) return;
      this._started = true;
      var shadow = this.shadowRoot || this.attachShadow({ mode: "open" });
      shadow.innerHTML = render("loading");
      var self = this;
      return root
        .fetch(API, { headers: { accept: "application/json" }, credentials: "omit" })
        .then(function (r) {
          if (!r.ok) return { unread: "GET /api/gspc answered HTTP " + r.status };
          return r.json().then(facts, function () { return { unread: "GET /api/gspc body is not JSON" }; });
        }, function () { return { unread: "GET /api/gspc could not be reached" }; })
        .then(function (state) { shadow.innerHTML = render(state); self.setAttribute("data-state", state.unread ? "unread" : "derived"); });
    }
  }
  root.customElements.define("gspc-board", GspcBoard);
})(typeof window !== "undefined" ? window : globalThis);
