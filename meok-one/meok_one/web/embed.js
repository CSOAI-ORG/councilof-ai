/* MEOK embeddable widget loader (scorecard E3).
   Drop into any page:
     <script src="https://meok-one.../embed.js" data-character="aria" data-accent="#7c5cff"></script>
   Injects a floating glass-marble launcher that opens a compact, Sovereign-safe MEOK
   character + chat (the /widget iframe). One line, any site. */
(function () {
  var s = document.currentScript || (function () {
    var a = document.getElementsByTagName("script"); return a[a.length - 1];
  })();
  var origin = new URL(s.src).origin;
  var character = s.getAttribute("data-character") || "aria";
  var accent = s.getAttribute("data-accent") || "#7c5cff";
  var side = (s.getAttribute("data-position") === "left") ? "left" : "right";

  var btn = document.createElement("button");
  btn.setAttribute("aria-label", "Open your MEOK AI");
  btn.style.cssText = "position:fixed;bottom:20px;" + side + ":20px;width:60px;height:60px;border-radius:50%;" +
    "border:0;cursor:pointer;z-index:2147483646;background:radial-gradient(circle at 38% 32%,#fff," + accent +
    " 58%,#0a0a12);box-shadow:0 8px 30px rgba(124,92,255,.5),inset 0 0 0 1px rgba(255,255,255,.18);transition:transform .2s";
  btn.onmouseenter = function () { btn.style.transform = "scale(1.08)"; };
  btn.onmouseleave = function () { btn.style.transform = "scale(1)"; };

  var panel = document.createElement("div");
  panel.style.cssText = "position:fixed;bottom:92px;" + side + ":20px;width:360px;max-width:calc(100vw - 40px);" +
    "height:560px;max-height:calc(100vh - 130px);border-radius:18px;overflow:hidden;z-index:2147483646;" +
    "box-shadow:0 24px 70px rgba(0,0,0,.55);border:1px solid rgba(124,92,255,.4);display:none;background:#0b0a14";
  var ifr = document.createElement("iframe");
  ifr.style.cssText = "width:100%;height:100%;border:0";
  ifr.setAttribute("allow", "microphone");
  ifr.src = origin + "/widget?character=" + encodeURIComponent(character) + "&accent=" + encodeURIComponent(accent);
  panel.appendChild(ifr);

  var open = false;
  btn.onclick = function () {
    open = !open;
    panel.style.display = open ? "block" : "none";
    btn.innerHTML = open ? '<span style="font-size:26px;color:#fff;line-height:1">×</span>' : "";
  };

  function mount() { document.body.appendChild(btn); document.body.appendChild(panel); }
  if (document.body) mount(); else document.addEventListener("DOMContentLoaded", mount);
})();
