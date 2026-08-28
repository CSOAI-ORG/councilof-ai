/* councilof.ai/embed.js — Council of AI white-label verify badge
   Eats WHITE-LABEL-EMBED-KIT-2026-08-25 + overnight/embed.js honesty:
   live count from GET /api/gspc (never typed), "unavailable" on failure,
   never "certified". Partner branding does not change the evidence.

   Usage:
   <script async defer src="https://councilof.ai/embed.js"
           data-org="ClientCo" data-brand="#0B3D91"
           data-label="" data-verify="https://councilof.ai/gspc-verify"
           data-size="md"></script>
*/
function escHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
function escColor(s) {
  return /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(String(s)) ? String(s) : "#059669";
}
function safeHref(s) {
  try {
    var u = new URL(String(s), "https://councilof.ai");
    if (u.protocol !== "https:" && u.protocol !== "http:") return "https://councilof.ai/gspc-verify";
    return u.href;
  } catch (e) {
    return "https://councilof.ai/gspc-verify";
  }
}
(function () {
  var s = document.currentScript;
  if (!s) return;
  var org = s.getAttribute("data-org") || "Council of AI";
  var brand = escColor(s.getAttribute("data-brand") || "#059669");
  var labelOverride = s.getAttribute("data-label");
  var verify = safeHref(s.getAttribute("data-verify") || "https://councilof.ai/gspc-verify");
  var size = s.getAttribute("data-size") || "md";
  var w = { sm: 180, md: 260, lg: 340 }[size] || 260;
  var origin = "https://councilof.ai";
  try {
    if (s.src) origin = new URL(s.src).origin;
  } catch (e) {
    /* keep default */
  }

  var host = document.createElement("div");
  host.setAttribute("class", "coai-embed");
  host.setAttribute("role", "complementary");
  (s.parentNode || document.body).insertBefore(host, s);

  function paint(label, note) {
    host.setAttribute("aria-label", String(label));
    host.textContent = "";
    var card = document.createElement("div");
    var color = escColor(brand);
    card.style.cssText =
      "border:1px solid " + color + ";border-radius:12px;padding:14px;font-family:-apple-system,Segoe UI,sans-serif;max-width:" + w + "px;background:#fff;color:#111";
    var orgEl = document.createElement("div");
    orgEl.style.cssText = "color:" + color + ";font-weight:700;font-size:13px";
    orgEl.textContent = org;
    var labEl = document.createElement("div");
    labEl.style.cssText = "margin:6px 0;font-size:14px;color:" + color;
    labEl.textContent = label;
    var a = document.createElement("a");
    a.setAttribute("href", verify);
    a.setAttribute("target", "_blank");
    a.setAttribute("rel", "noopener");
    a.style.cssText = "display:block;font-size:11px;color:" + color + ";text-decoration:none";
    a.textContent = "Verify the evidence — recompute it yourself →";
    var noteEl = document.createElement("div");
    noteEl.style.cssText = "font-size:10px;color:#666;margin-top:6px";
    noteEl.textContent = note || "Measurement, not certification. Council of AI is not a notified body.";
    card.appendChild(orgEl);
    card.appendChild(labEl);
    card.appendChild(a);
    card.appendChild(noteEl);
    host.appendChild(card);
  }

  if (labelOverride) {
    paint(labelOverride);
    return;
  }

  paint("Loading live board…");
  var ctrl = typeof AbortController === "function" ? new AbortController() : null;
  var timer = setTimeout(function () {
    if (ctrl) ctrl.abort();
  }, 8000);

  fetch(origin + "/api/gspc", {
    method: "GET",
    credentials: "omit",
    signal: ctrl ? ctrl.signal : undefined,
  })
    .then(function (r) {
      clearTimeout(timer);
      if (!r.ok) throw new Error("gspc " + r.status);
      return r.json();
    })
    .then(function (j) {
      var totals = (j && j.totals) || {};
      var sentence = totals.public_count || totals.count_grammar;
      if (!sentence) throw new Error("no public_count");
      paint(sentence);
    })
    .catch(function () {
      clearTimeout(timer);
      paint("Board unavailable", "Live count could not be read. Nothing was fabricated.");
    });
})();
