/**
 * hf-badge.js — a small badge on huggingface.co/<org>/<model> pages.
 *
 * It answers ONE question from the PUBLIC hub-cards index (csoai/gspc-hub-cards):
 * does a signed measurement card exist for this exact model id? If yes, the badge
 * names the state and axes the index lists and links to the card; if no, it says
 * "UNMEASURED — no signed card". If the index could not be read it says UNCHECKABLE.
 * It never invents a score. The index is unsigned, so the badge offers "verify",
 * which fetches the signed card and runs the repo's verifier — three states.
 *
 * Classic content script (MV3 forbids ESM here), so the lib is loaded with a
 * dynamic import of a web-accessible resource. No build step.
 */
(async () => {
  const path = location.pathname;
  const send = (msg) => new Promise((resolve) => chrome.runtime.sendMessage(msg, (r) => resolve(r ?? { error: chrome.runtime.lastError?.message ?? "no response" })));

  let hub, verify;
  try {
    hub = await import(chrome.runtime.getURL("lib/hub.mjs"));
    verify = await import(chrome.runtime.getURL("lib/gspcVerify.mjs"));
  } catch (e) {
    return; // extension not fully loaded; do nothing rather than guess
  }

  const modelId = hub.modelIdFromPath(path);
  if (!modelId) return;
  if (document.getElementById("gspc-verify-badge")) return;

  const host = document.createElement("div");
  host.id = "gspc-verify-badge";
  const shadow = host.attachShadow({ mode: "open" });
  const style = document.createElement("style");
  style.textContent = `
    :host { all: initial; position: fixed; right: 12px; bottom: 12px; z-index: 2147483646; }
    .b { font: 12px/1.35 system-ui, -apple-system, Segoe UI, sans-serif; color: #111; background: #fff; border: 1px solid #8884; border-radius: 8px; padding: 8px 10px; max-width: 360px; box-shadow: 0 2px 10px #0002; }
    @media (prefers-color-scheme: dark) { .b { color: #eee; background: #1b1b1f; } }
    .t { font-weight: 700; margin: 0 0 2px; }
    .s { font-family: ui-monospace, Menlo, monospace; }
    .m { opacity: .7; font-size: 11px; }
    a { color: inherit; }
    ul { margin: 4px 0 0; padding-left: 16px; }
    li { margin: 2px 0; }
    button { font: inherit; font-size: 11px; padding: 1px 6px; margin-left: 4px; }
    .x { float: right; border: 0; background: none; cursor: pointer; font-size: 13px; padding: 0 2px; }
    .VALID { color: #1a7f37; } .INVALID { color: #b42318; } .UNCHECKABLE { color: #8a6d00; }
  `;
  const box = document.createElement("div");
  box.className = "b";
  shadow.append(style, box);

  const render = (html) => {
    box.textContent = "";
    box.append(...html);
  };
  const el = (tag, cls, text) => {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  };
  const close = () => {
    const x = el("button", "x", "×");
    x.title = "hide";
    x.addEventListener("click", () => host.remove());
    return x;
  };
  const foot = () => el("p", "m", "Measurement, not certification. Absence is UNMEASURED, never zero. Verify is free.");

  render([close(), el("p", "t", "GSPC · Council of AI"), el("p", "s", `${modelId}: reading the public hub-cards index…`), foot()]);
  document.documentElement.appendChild(host);

  const idx = await send({ type: "hubIndex" });
  if (!idx || !Array.isArray(idx.rows)) {
    render([close(), el("p", "t", "GSPC · Council of AI"), el("p", "s UNCHECKABLE", `${modelId}: UNCHECKABLE — the public index could not be read`), el("p", "m", "That is a statement about this lookup, not about the model."), foot()]);
    return;
  }
  const rows = hub.lookup(idx.rows, modelId);
  const label = hub.badgeLabel(rows);

  const parts = [close(), el("p", "t", "GSPC · Council of AI"), el("p", "s", `${modelId}: ${label}`)];
  if (rows.length) {
    const ul = el("ul");
    for (const r of rows) {
      const li = el("li");
      li.append(`${r.axis ?? "?"} · ${r.status ?? "UNMEASURED"}`);
      if (typeof r.n === "number") li.append(` · n=${r.n}`);
      if (typeof r.card_url === "string") {
        li.append(" · ");
        const a = el("a", null, "card");
        a.href = r.card_url;
        a.target = "_blank";
        a.rel = "noopener";
        li.append(a);
        const b = el("button", null, "verify");
        b.addEventListener("click", async () => {
          b.disabled = true;
          b.textContent = "checking…";
          const res = await send({ type: "fetchJson", url: r.card_url });
          let out;
          if (!res || res.status !== 200 || !res.body) {
            out = { state: "UNCHECKABLE", reason: `card fetch HTTP ${res?.status ?? "?"}` };
          } else {
            out = await verify.verifyOffline(res.body);
          }
          b.remove();
          const s = el("span", out.state, ` ${out.state}`);
          s.title = out.reason;
          li.append(s);
          if (out.bodyStatus && out.bodyStatus !== r.status) {
            li.append(el("span", "m", ` (index says ${r.status}; the signed body says ${out.bodyStatus} — the bytes decide)`));
          }
        });
        li.append(b);
      }
      ul.append(li);
    }
    parts.push(ul);
    parts.push(el("p", "m", "Index rows are unsigned listings; \"verify\" checks the signed card offline against pinned keys."));
  } else {
    const a = el("a", null, "how measurement works");
    a.href = "https://councilof.ai/gspc-verify";
    a.target = "_blank";
    a.rel = "noopener";
    const p = el("p", "m", "No row in the public index matches this exact model id. ");
    p.append(a);
    parts.push(p);
  }
  parts.push(foot());
  render(parts);
})();
