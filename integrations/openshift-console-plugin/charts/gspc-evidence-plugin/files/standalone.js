const f = document.getElementById("f");
f.addEventListener("submit", (e) => {
  e.preventDefault();
  const v = document.getElementById("s").value.trim();
  if (!v) return;
  const el = document.createElement("gspc-evidence-panel");
  el.setAttribute("subject", v);
  document.getElementById("panels").prepend(el);
});
