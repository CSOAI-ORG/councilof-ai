/*! Council of AI — Measurement Capsules card. Apache-2.0. https://councilof.ai/measurement-capsules/
 *
 * Usage:  <script src="https://councilof.ai/embed/measurement-capsules.js" async></script>
 * The card renders where the tag is, or inside every <div data-csoai-capsules></div> on the page.
 * Optional on either element: data-theme="dark" | "light" (default follows the visitor's setting).
 *
 * It reads two public files, /measurement-capsules/latest.json and the index it names, and shows the
 * index root and capsule count from them. Nothing is sent about the page or its visitors; no cookies,
 * no storage. A number that cannot be read is not shown. Measurement, not endorsement: the card says
 * nothing about the site that embeds it.
 */
(function () {
  "use strict";
  var me = document.currentScript;
  var origin = "https://councilof.ai";
  try { if (me && me.src) origin = new URL(me.src).origin; } catch (e) { /* keep default */ }
  var PAGE = origin + "/measurement-capsules/";
  var VERIFY = origin + "/verify-server/";

  var CSS =
    ":host{all:initial;display:block;margin:12px 0}" +
    ".c{--bg:#fff;--fg:#0f172a;--mu:#475569;--bd:#cbd5e1;--ln:#0f172a;box-sizing:border-box;max-width:560px;" +
    "font:14px/1.45 system-ui,-apple-system,'Segoe UI',Roboto,sans-serif;color:var(--fg);background:var(--bg);" +
    "border:1px solid var(--bd);border-radius:8px;padding:10px 14px}" +
    "@media (prefers-color-scheme:dark){.c.auto{--bg:#0f172a;--fg:#f1f5f9;--mu:#cbd5e1;--bd:#334155;--ln:#f1f5f9}}" +
    ".c.dark{--bg:#0f172a;--fg:#f1f5f9;--mu:#cbd5e1;--bd:#334155;--ln:#f1f5f9}" +
    "p{margin:0}a{color:var(--ln);text-decoration:underline;text-underline-offset:3px}" +
    "a:focus-visible{outline:2px solid var(--ln);outline-offset:2px;border-radius:2px}" +
    ".m{margin-top:4px;font-size:12px;color:var(--mu)}code{font:12px ui-monospace,SFMono-Regular,Menlo,monospace}";

  function fmt(n) { try { return Number(n).toLocaleString("en-GB"); } catch (e) { return String(n); } }
  function el(tag, attrs, kids) {
    var n = document.createElement(tag);
    for (var k in attrs || {}) n.setAttribute(k, attrs[k]);
    (kids || []).forEach(function (x) { n.appendChild(typeof x === "string" ? document.createTextNode(x) : x); });
    return n;
  }
  function getJson(u) {
    return fetch(u, { credentials: "omit", cache: "no-cache" }).then(function (r) {
      if (!r.ok) throw new Error(String(r.status));
      return r.json();
    });
  }

  function mount(host) {
    if (host.__csoaiCapsules) return;
    host.__csoaiCapsules = true;
    var theme = host.getAttribute("data-theme") || (me && me.getAttribute("data-theme")) || "auto";
    var root = host.attachShadow ? host.attachShadow({ mode: "open" }) : host;
    var style = el("style"); style.textContent = CSS;
    var line = el("p", {}, ["Independently measured by ", el("a", { href: PAGE }, ["Council of AI"]), " · reading the index…"]);
    var card = el("div", { class: "c " + (theme === "dark" ? "dark" : theme === "light" ? "" : "auto"), role: "note", "aria-label": "Council of AI measurement capsules" }, [
      line,
      el("p", { class: "m" }, ["Measurement, not endorsement."])
    ]);
    root.appendChild(style); root.appendChild(card);

    getJson(origin + "/measurement-capsules/latest.json").then(function (latest) {
      var idx = latest && latest.index ? latest.index : "/measurement-capsules/v0.2/index.json";
      return getJson(new URL(idx, origin).toString());
    }).then(function (ix) {
      var rootHex = typeof ix.index_root === "string" ? ix.index_root.slice(0, 8) : null;
      var n = typeof ix.n_capsules_total === "number" ? ix.n_capsules_total : null;
      var day = typeof ix.as_of === "string" ? ix.as_of.slice(0, 10) : null;
      var today = new Date().toISOString().slice(0, 10);
      var label = day === today ? "today's index " : day ? "index of " + day + " " : "index ";
      var kids = ["Independently measured by ", el("a", { href: PAGE }, ["Council of AI"])];
      if (rootHex) kids.push(" · " + label, el("a", { href: PAGE, title: ix.index_root }, [el("code", {}, [rootHex])]));
      if (n !== null) kids.push(" · " + fmt(n) + " capsules");
      kids.push(" · ", el("a", { href: VERIFY }, ["verify →"]));
      card.replaceChild(el("p", {}, kids), line);
    }).catch(function () {
      card.replaceChild(el("p", {}, [
        "Independently measured by ", el("a", { href: PAGE }, ["Council of AI"]),
        " · the index could not be read just now · ", el("a", { href: VERIFY }, ["verify →"])
      ]), line);
    });
  }

  function run() {
    var targets = document.querySelectorAll("[data-csoai-capsules]");
    if (targets.length) { for (var i = 0; i < targets.length; i++) mount(targets[i]); return; }
    // A tag in <head> has nowhere visible to render; it then waits for a data-csoai-capsules target.
    if (me && me.parentNode && me.parentNode.nodeName !== "HEAD") {
      var host = el("div", { "data-csoai-capsules": "" });
      me.parentNode.insertBefore(host, me.nextSibling);
      mount(host);
    }
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", run);
  else run();
})();
