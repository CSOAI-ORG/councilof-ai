/*!
 * CSOAI GSPC Verify Widget — one-tag embed for any site.
 * Usage:  <script src="https://councilof.ai/widget/gspc-verify-widget.js" data-position="right" defer></script>
 * Free forever. Verifies AI-behaviour claims against the signed GSPC board.
 * No tracking, no cookies, no dependencies. Vanilla JS, Shadow DOM, CSP-friendly.
 */
(function () {
  "use strict";
  if (window.__CSOAI_GSPC_WIDGET__) return;
  window.__CSOAI_GSPC_WIDGET__ = true;

  var API = "https://councilof.ai/api/gspc";
  var VERIFY = "https://councilof.ai/gspc-verify/";
  var BOARD = "https://councilof.ai";
  var POS = (document.currentScript && document.currentScript.dataset.position) === "left" ? "left" : "right";

  var host = document.createElement("div");
  host.style.cssText = "position:fixed;" + POS + ":16px;bottom:16px;z-index:2147483000;";
  document.body.appendChild(host);
  var root = host.attachShadow({ mode: "open" });

  var style = document.createElement("style");
  style.textContent = [
    ".btn{display:flex;align-items:center;gap:8px;background:#0b1220;color:#e5e7eb;border:1px solid #243044;",
    "border-radius:999px;padding:10px 16px;font:600 13px ui-sans-serif,system-ui,sans-serif;cursor:pointer;",
    "box-shadow:0 4px 14px rgba(0,0,0,.35)}",
    ".btn:hover{border-color:#4ade80}",
    ".dot{width:9px;height:9px;border-radius:50%;background:#4ade80}",
    ".panel{position:absolute;bottom:54px;" + POS + ":0;width:340px;max-height:460px;overflow:auto;background:#0b1220;",
    "color:#e5e7eb;border:1px solid #243044;border-radius:14px;padding:16px;font:13px/1.55 ui-sans-serif,system-ui,sans-serif;",
    "box-shadow:0 10px 30px rgba(0,0,0,.5);display:none}",
    ".panel.open{display:block}",
    "h3{margin:0 0 4px;font-size:14px}",
    "a{color:#7dd3fc;text-decoration:none}",
    ".row{display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid #1b2433}",
    ".m{color:#4ade80;font-weight:700}",
    ".u{color:#94a3b8}",
    ".meta{color:#64748b;font-size:11px;margin-top:10px}",
    ".free{color:#4ade80}",
    "button.mini{background:#16233a;color:#e5e7eb;border:1px solid #243044;border-radius:8px;padding:4px 10px;cursor:pointer;font:12px ui-sans-serif}",
  ].join("");
  root.appendChild(style);

  var btn = document.createElement("button");
  btn.className = "btn";
  btn.innerHTML = '<span class="dot"></span> AI claims verified here';
  root.appendChild(btn);

  var panel = document.createElement("div");
  panel.className = "panel";
  panel.innerHTML =
    '<h3>Council of AI — live measurements</h3>' +
    '<div style="color:#94a3b8;margin-bottom:8px">Signed, publicly verifiable AI-behaviour measurement. <span class="free">Verification is free, forever.</span></div>' +
    '<div id="rows"><div class="u">loading board…</div></div>' +
    '<div class="meta">measurement, not certification · <a href="' + VERIFY + '" target="_blank" rel="noopener">verify a card ↗</a> · <a href="' + BOARD + '" target="_blank" rel="noopener">councilof.ai ↗</a></div>';
  root.appendChild(panel);

  var loaded = false;
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }
  function load() {
    if (loaded) return;
    loaded = true;
    fetch(API)
      .then(function (r) { return r.json(); })
      .then(function (d) {
        var slots = d.slots || d.axes || [];
        if (!Array.isArray(slots) || !slots.length) {
          document.getElementById("rows", panel).innerHTML = '<div class="u">board temporarily unavailable — verify at councilof.ai</div>';
          return;
        }
        var html = "";
        slots.slice(0, 12).forEach(function (s) {
          var measured = (s.status || s.state || "UNMEASURED") === "MEASURED";
          html +=
            '<div class="row"><span>' + esc(s.axis || s.id || s.name || "?") + "</span>" +
            '<span class="' + (measured ? "m" : "u") + '">' + esc(s.status || s.state || "UNMEASURED") + "</span></div>";
        });
        var rowsEl = panel.querySelector("#rows");
        if (!rowsEl) {
          rowsEl = document.createElement("div");
          rowsEl.id = "rows";
          panel.insertBefore(rowsEl, panel.querySelector(".meta"));
        }
        rowsEl.innerHTML = html +
          '<div class="meta">showing ' + Math.min(slots.length, 12) + " of " + slots.length + " slots</div>";
      })
      .catch(function () {
        var rowsEl = panel.querySelector("#rows");
        if (rowsEl) rowsEl.innerHTML = '<div class="u">board temporarily unavailable</div>';
      });
  }

  btn.addEventListener("click", function () {
    panel.classList.toggle("open");
    if (panel.classList.contains("open")) load();
  });
})();
