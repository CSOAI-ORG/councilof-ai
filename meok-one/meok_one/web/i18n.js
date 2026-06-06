/* MEOK ONE — zero-dependency i18n layer (stdlib-served locale JSON + data-i18n walker).
   Tag elements: data-i18n (textContent) · data-i18n-html (innerHTML) · data-i18n-ph (placeholder).
   window.t(key) for JS-side strings · window.setLang(code) to switch. */
(function () {
  var SUPPORTED = ["en", "es", "fr", "de"];
  var KEY = "meok_lang";
  var dict = {};

  function pick() {
    var s = null;
    try { s = localStorage.getItem(KEY); } catch (e) {}
    if (s && SUPPORTED.indexOf(s) !== -1) return s;
    var n = (navigator.language || "en").slice(0, 2).toLowerCase();
    return SUPPORTED.indexOf(n) !== -1 ? n : "en";
  }

  function apply() {
    document.querySelectorAll("[data-i18n]").forEach(function (el) {
      var k = el.getAttribute("data-i18n"); if (dict[k] != null) el.textContent = dict[k];
    });
    document.querySelectorAll("[data-i18n-html]").forEach(function (el) {
      var k = el.getAttribute("data-i18n-html"); if (dict[k] != null) el.innerHTML = dict[k];
    });
    document.querySelectorAll("[data-i18n-ph]").forEach(function (el) {
      var k = el.getAttribute("data-i18n-ph"); if (dict[k] != null) el.setAttribute("placeholder", dict[k]);
    });
    if (dict.title) document.title = dict.title;
    var sel = document.getElementById("langSel");
    if (sel) sel.value = document.documentElement.lang || "en";
  }

  function load(lang) {
    return fetch("/locales/" + lang + ".json")
      .then(function (r) { return r.json(); })
      .then(function (d) {
        dict = d || {};
        document.documentElement.lang = lang;
        if (dict._dir) document.documentElement.dir = dict._dir;
        apply();
        try { window.dispatchEvent(new CustomEvent("i18n", { detail: { lang: lang, dict: dict } })); } catch (e) {}
      })
      .catch(function () { /* offline / missing locale → leave English markup as-is */ });
  }

  window.t = function (k) { return (dict && dict[k] != null) ? dict[k] : k; };
  window.setLang = function (l) { try { localStorage.setItem(KEY, l); } catch (e) {} return load(l); };
  window.MEOK_LANGS = SUPPORTED;

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () { load(pick()); });
  } else {
    load(pick());
  }
})();
