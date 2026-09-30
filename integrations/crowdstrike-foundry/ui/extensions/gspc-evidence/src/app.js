// Falcon Foundry UI extension / page: mounts the GSPC evidence panel.
//
// CONTEXT, READ-ONLY. foundry-js gives the extension the socket's data (the detection, host or case
// the analyst has open). The panel suggests the first https URL found in that data as the subject
// (e.g. an MCP endpoint named in a detection); the analyst can change it. Nothing from the tenant is
// sent to councilof.ai except the subject the analyst reads, and only when they read it. The host
// context goes to the panel as hostContext, which never leaves the panel.
//
// Theme follows Falcon's light/dark theme. The attribution "Evidence by GSPC · Council of AI" and
// its verify link are the panel's own and cannot be configured away.
import FalconApi from "@crowdstrike/foundry-js";

const panel = document.getElementById("panel");
const input = document.getElementById("s");
const ctx = document.getElementById("ctx");

export function firstHttpsUrl(data, depth = 0) {
  if (depth > 6 || data === null || data === undefined) return null;
  if (typeof data === "string") {
    const m = data.match(/https:\/\/[^\s"'<>]+/);
    return m ? m[0].replace(/[),.;]+$/, "") : null;
  }
  if (Array.isArray(data)) {
    for (const v of data) {
      const u = firstHttpsUrl(v, depth + 1);
      if (u) return u;
    }
    return null;
  }
  if (typeof data === "object") {
    for (const [k, v] of Object.entries(data)) {
      if (/^(app|user|theme|cid|locale|timezone|dateFormat|parentUrl|permissions)$/.test(k)) continue; // console context, not the record
      const u = firstHttpsUrl(v, depth + 1);
      if (u) return u;
    }
  }
  return null;
}

function show(subject) {
  if (!subject) return;
  input.value = subject;
  panel.setAttribute("subject", subject);
}

document.getElementById("f").addEventListener("submit", (e) => {
  e.preventDefault();
  show(input.value.trim());
});

async function start() {
  let falcon = null;
  try {
    falcon = new FalconApi();
    await Promise.race([falcon.connect(), new Promise((_, rej) => setTimeout(() => rej(new Error("no Falcon host")), 4000))]);
  } catch {
    falcon = null;
  }
  const apply = (data) => {
    document.body.className = data?.theme === "theme-dark" ? "theme-dark" : "";
    panel.config = {
      assistantName: "Evidence assistant",
      locale: /^[a-z]{2}(-[a-z]{2})?$/i.test(data?.locale ?? "") ? data.locale.split("-")[0] : "en",
      hostContext: { host: "crowdstrike-falcon-foundry", app: data?.app?.id ?? null },
    };
    const found = firstHttpsUrl(data);
    if (found && !panel.getAttribute("subject")) {
      ctx.textContent = "Suggested from the open record. Change it if it is not the subject you mean.";
      show(found);
    }
  };
  if (falcon) {
    apply(falcon.data);
    falcon.events.on("data", apply);
  } else {
    ctx.textContent = "Not inside Falcon: standalone mode.";
  }
  if (!panel.getAttribute("subject")) show("https://councilof.ai/mcp");
}
start();
