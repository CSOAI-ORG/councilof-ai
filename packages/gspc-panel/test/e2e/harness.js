// Harness: ?subject=…&transport=…&theme=dark  or ?a2ui=1 (the test then calls renderA2ui).
const q = new URLSearchParams(location.search);
const slots = document.getElementById("slots");
window.__csp = [];
document.addEventListener("securitypolicyviolation", (e) => window.__csp.push(`${e.violatedDirective} ${e.blockedURI}`));
for (const s of q.getAll("subject")) {
  const el = document.createElement("gspc-evidence-panel");
  el.setAttribute("subject", s);
  if (q.get("transport")) el.setAttribute("transport", q.get("transport"));
  if (q.get("theme") === "host") {
    el.style.setProperty("--gspc-accent", "#6d28d9");
    el.style.setProperty("--gspc-radius", "2px");
    el.style.setProperty("--gspc-font", "Georgia, serif");
  }
  if (q.get("config")) el.config = JSON.parse(q.get("config"));
  if (q.get("configAttr")) el.setAttribute("config", q.get("configAttr"));
  slots.appendChild(el);
}
if (q.get("a2ui")) {
  const el = document.createElement("gspc-evidence-panel");
  el.id = "a2ui";
  slots.appendChild(el);
}
