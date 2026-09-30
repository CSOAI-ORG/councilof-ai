// Mounts <gspc-evidence-panel> in the dashboard and keeps its subject in step with the
// $gspc_subject$ token. The panel bundle (gspc-panel.js) is a pinned copy of
// https://councilof.ai/panel/gspc-panel.js served from this app; it reads councilof.ai only.
require(["splunkjs/mvc", "splunkjs/mvc/simplexml/ready!"], function (mvc) {
  var s = document.createElement("script");
  s.type = "module";
  s.src = Splunk.util.make_url("/static/app/gspc_evidence/gspc-panel.js");
  document.head.appendChild(s);
  var slot = document.getElementById("gspc-panel-slot");
  if (!slot) return;
  var el = document.createElement("gspc-evidence-panel");
  slot.appendChild(el);
  var tokens = mvc.Components.get("submitted");
  function apply() {
    var v = tokens.get("gspc_subject");
    if (v) el.setAttribute("subject", String(v));
  }
  tokens.on("change:gspc_subject", apply);
  apply();
});
