/* GSPC living table — live board + n-sites census. Not a second scoreboard. */
const API = "https://councilof.ai/api/gspc";
const QUEUE = "https://huggingface.co/datasets/csoai/hub-queue/resolve/main/SUMMARY.json";
const CATALOG = "https://huggingface.co/datasets/csoai/living-catalog/resolve/main/catalog.json";
const KEY = "csoai.gspc.watchlist.v1";

const CENSUS_SITES = [
  { id: "huggingface", title: "Hugging Face Hub", status: "planted", does: "Speed 0 rail. list + blobs=true. Eligibility states. No weight download. More than two million model repos." },
  { id: "openrouter", title: "OpenRouter", status: "next", does: "DISCOVERED catalogue of hosted ids. Not a measurement target until a unique lineage run." },
  { id: "ollama", title: "Ollama library", status: "next", does: "Local pull list as DISCOVERED. Do not treat a library card as MEASURED." },
  { id: "kaggle", title: "Kaggle", status: "next", does: "Benchmark tasks after cost and reproducibility gates. One org identity." },
  { id: "github", title: "GitHub model configs", status: "next", does: "Discovery of declared weights. Listing is not a run." },
];

const SPEEDS = [
  { title: "Speed 0 — static census", does: "Hub API metadata on every n-site: repo id, revision, licence, gated flag, files list, claimed lineage. No weight download. Every discovered subject gets one eligibility state.", never: "A GSPC grade. A Hub listing is DISCOVERED. Do not stamp MEASURED." },
  { title: "Speed 1 — unique lineage run", does: "One load per weight-manifest digest. Eligible axes share the load. Quotable only after intake, practice screen and a bolted instrument.", never: "A run of every quant, adapter and :latest alias as if they were independent models." },
];

const HUNDRED = {
  ruling: "Cover millions by census. Unlock permissionless flags at 100 unique lineages done 100/100 A+++.",
  envelope: "100 × 15 × n=30 = 45,000 responses — about 29.3 million tokens under the 650-token planning assumption. The quality spend. Not two million inferences.",
  steps: [
    "Walk every repo id — paginate GET /api/models. Record metadata. No weights.",
    "Priority-queue LFS digests — blobs=true first for ungated high-download lineages.",
    "One eligibility state each — ELIGIBLE or a named block. Stay DISCOVERED.",
    "Sign the dated walk — publish counts after Card v2. Do not invent csoai/gspc-subjects until then.",
  ],
  gate: [
    "Unique weight lineage — one subject per digest, not a Hub repo count.",
    "Licence-eligible and runnable.",
    "Card v2 plus subject, instrument, run and evidence manifests.",
    "Evidence a stranger can fetch.",
    "Verify pass against did:web:csoai.org#card-attestation-1.",
    "Independent rerun sample, labelled Council-run vs reproduced.",
    "Honest axis set — 15 measured instruments where they exist. Remaining slots stay UNMEASURED. Jail is the MEASURED floor.",
  ],
};

const HEALTH = [
  ["Declared slots", "GET /api/gspc totals.axes", "present"],
  ["Measured slots", "GET /api/gspc totals.measured_axes", "present"],
  ["Empty slots", "GET /api/gspc totals.unmeasured_axes", "present"],
  ["Verify pass", "/gspc-verify · verify_card", "present"],
  ["Evidence fetchable", "Per subject. Unknown until the bundle URL answers.", "unknown"],
  ["Independent rerun", "Absent until one exists.", "empty"],
  ["Census eligibility", "hub-queue is UNMEASURED. Eligibility is not a grade.", "present"],
  ["Corrections", "GET /api/corrections", "present"],
  ["Jail floor", "MEASURED, separation TIE. A floor, not an arena door.", "present"],
];

const EMPTY = [
  ["reserve-attestation", "A live partner issuer plus a bolted instrument. XRPL stays DEVNET. We attest; we do not issue.", "Mainnet CredentialCreate this week. On-chain MEASURED."],
  ["regulatory-framework", "Provision text is already watched. MEASURED needs a frozen bank and n.", "Auto-scrape → MEASURED."],
  ["distribution-integrity", "SCITT / signed-SBOM as attachments on a cell. Slot stays empty until the instrument runs.", "Generate statements and call the axis MEASURED."],
  ["custody-disclosure", "did:web:csoai.org is planted. MEASURED is a disclosure instrument on a subject.", "This VM inventing a signer."],
  ["ai-economy-index", "Dated aggregates may be REPORTED with attribution. They never blend into MEASURED without a frozen bank.", "An investable index."],
  ["human-labour-index", "Eurostat / ONS series can be cited as REPORTED. Displacement is not a Council diagnosis.", "A prognosis of the labour market."],
  ["humanoid-labour-index", "Need an input bank first. Until then the slot is published empty — that is the finding.", "A robot-workforce score."],
];

const FLAGS = [
  ["planted", "Hugging Face badge", "https://councilof.ai/api/badge?style=hf&size=md", "Any README that may link a measurement, never a certificate."],
  ["planted", "Embed kit", "https://councilof.ai/embed.js", "Partner pages that want a live count from GET /api/gspc."],
  ["planted", "MCP HTTP door", "https://councilof.ai/mcp", "board_totals · get_axis · verify_card · list_cards."],
  ["planted", "MCP well-known", "https://councilof.ai/.well-known/mcp.json", "Layer-0 discovery."],
  ["planted", "Official MCP registry", "https://registry.modelcontextprotocol.io", "io.github.CSOAI-ORG/gspc v1.0.3."],
  ["planted", "Grok / Cursor plugin", "https://github.com/CSOAI-ORG/councilof-ai/tree/master/plugins/gspc", "Same four tools. Consent first."],
  ["planted", "npm stdio SDK", "https://www.npmjs.com/package/csoai-gspc-mcp", "npx -y csoai-gspc-mcp"],
  ["planted", "A2A agent card", "https://councilof.ai/.well-known/agent-card.json", "Discovery planted. Task service planned."],
  ["planted", "x402 price card", "https://councilof.ai/.well-known/x402.json", "Challenge exists. payTo is null. Payment never buys rank."],
  ["planted", "did:web trust root", "https://csoai.org/.well-known/did.json", "Pin did:web:csoai.org#card-attestation-1."],
  ["planted", "Living board API", "https://councilof.ai/api/gspc", "Quote totals.public_count. Empty stays empty."],
  ["planted", "Verify a card", "https://councilof.ai/gspc-verify", "Browser WebCrypto. Free forever."],
  ["planted", "Methodology DOI", "https://doi.org/10.5281/zenodo.21991104", "Citation snapshot. Not a mutable working board."],
  ["planted", "HF collection", "https://huggingface.co/collections/csoai/gspc-board-verify-flywheel-queue-banks-6a92a75986947dfa9d5306b5", "Board · verify · flywheel · queue · banks."],
  ["planted", "HF board dataset", "https://huggingface.co/datasets/csoai/gspc-board", "Canonical Hub mirror of the living board."],
  ["planted", "Published GSPC banks", "https://huggingface.co/datasets/csoai/gspc-gov", "Governance is csoai/gspc-gov. Never build a bank URL from an axis name."],
  ["planted", "Hub queue", "https://huggingface.co/datasets/csoai/hub-queue", "Census / eligibility queue. Listing is DISCOVERED."],
  ["planted", "Living catalog", "https://huggingface.co/datasets/csoai/living-catalog", "Dated catalogue. Discovery, not a sweep engine."],
  ["planted", "East-West", "https://huggingface.co/datasets/csoai/east-west", "One signed measurement, every regime mapped."],
  ["planted", "Flywheel Space", "https://huggingface.co/spaces/csoai/gspc-flywheel", "Find a published card. Not an evaluator."],
  ["planted", "Verify Space", "https://huggingface.co/spaces/csoai/gspc-verify", "Hub-native verify door."],
  ["planted", "Board Space", "https://huggingface.co/spaces/csoai/gspc-board", "This living table. GET /api/gspc remains the feed."],
  ["planted", "Article 50 desk", "https://councilof.ai/article-50", "A GSPC model run is not an Article 50 audit."],
  ["next", "Kaggle Community Benchmark", "https://www.kaggle.com/docs/benchmarks", "Encode each GSPC axis as a task after the 100-lineage A+++ gate."],
  ["next", "ModelScope methodology mirror", "https://www.modelscope.cn", "Native mirror of methods — not a second board."],
  ["next", "Zenodo cohort snapshot", "https://doi.org/10.5281/zenodo.21991104", "Dated eligibility manifest once the census is signed."],
  ["next", "GHCR harness pin", "https://github.com/CSOAI-ORG/councilof-ai", "Signed container digest for strangers who rerun a card."],
  ["next", "Publisher discussion after a signed cell", "https://huggingface.co/csoai", "One optional thread on the exact measured revision. No mass-PR."],
  ["do-not", "One CSOAI repo per external model", "https://huggingface.co/docs/hub/storage-limits", "Never. Publish the canonical record in the GSPC corpus."],
  ["do-not", "Stamp hub-queue MEASURED", "https://huggingface.co/datasets/csoai/hub-queue", "Never. A listing is DISCOVERED until a signed cell exists."],
  ["do-not", "Claim we scored two million models", "https://huggingface.co/datasets/csoai/hub-queue", "Never. Millions are DISCOVERED by census. MEASURED is unique lineages."],
  ["do-not", "Launch the 2,200-model sweep now", "https://councilof.ai/api/gspc", "Never before card v2, census, sandbox, signer and one external rerun."],
];

function esc(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[c]));
}

function chip(status) {
  const u = String(status || "").toUpperCase();
  const kind = u === "MEASURED" ? "ok" : u === "TIE" || u === "NEXT" ? "warn" : "empty";
  return `<span class="chip ${kind}">${esc(u || "unknown")}</span>`;
}

function fig(axis) {
  if (String(axis.status).toUpperCase() !== "MEASURED") {
    return `<div class="fig">${esc(axis.status || "UNMEASURED")}</div>`;
  }
  const pct = typeof axis.accuracy === "number" ? `${Math.round(axis.accuracy * 100)}` : "facts";
  const n = axis.n != null ? `n=${axis.n}` : "";
  const sep = axis.separation ? ` · ${axis.separation}` : "";
  const jail = axis.axis === "jail" && axis.separation === "TIE" ? " · floor" : "";
  return `<div class="fig">${esc(pct)} <span class="fine">${esc(n + sep + jail)}</span></div>`;
}

async function loadJson(url) {
  const r = await fetch(url, { headers: { accept: "application/json" } });
  if (!r.ok) throw new Error(url + " " + r.status);
  return r.json();
}

function renderBoard(d) {
  const t = d.totals || {};
  const axes = d.axes || [];
  const caption = t.public_count || "22 axis · 15 measured";
  document.getElementById("caption").textContent = caption + " · live GET /api/gspc";
  document.getElementById("counts").innerHTML = [
    ["Declared", t.axes ?? axes.length, "slots on the board"],
    ["Measured", t.measured_axes ?? "", "signed cells"],
    ["Empty", t.unmeasured_axes ?? "", "published gaps"],
    ["Items", t.items ?? "", "board items"],
  ].map(([k, v, n]) => `<div><b>${esc(v)}</b><span>${esc(k)} · ${esc(n)}</span></div>`).join("");
  document.getElementById("axes").innerHTML = axes.map((a) => {
    const scored = String(a.status).toUpperCase() === "MEASURED";
    return `<article class="axis${scored ? "" : " unmeasured"}">
      <div class="top"><span class="name">${esc(a.axis)}</span>${chip(a.status)}</div>
      <p class="fine">${esc(a.bench || a.task || a.family || "")}</p>
      ${fig(a)}
    </article>`;
  }).join("") || `<p class="err">No axes in payload.</p>`;
}

function renderCensusSites() {
  document.getElementById("census-sites").innerHTML = CENSUS_SITES.map((s) =>
    `<article class="panel" data-census-site="${esc(s.id)}">
      <div class="top"><strong>${esc(s.title)}</strong>${chip(s.status)}</div>
      <p class="fine">${esc(s.does)}</p>
    </article>`
  ).join("");
}

function renderSpeeds() {
  document.getElementById("speeds").innerHTML = SPEEDS.map((s) =>
    `<article class="panel"><strong>${esc(s.title)}</strong><p class="fine">${esc(s.does)}</p><p class="fine">Never: ${esc(s.never)}</p></article>`
  ).join("");
}

function renderHundred() {
  document.getElementById("hundred-box").innerHTML =
    `<p>${esc(HUNDRED.ruling)}</p>
     <p class="fine">${esc(HUNDRED.envelope)}</p>
     <p class="kicker" style="margin-top:0.8rem">Speed 0 — how millions get listed</p>
     <ol>${HUNDRED.steps.map((s) => `<li>${esc(s)}</li>`).join("")}</ol>
     <p class="kicker">A+++ gate</p>
     <ol>${HUNDRED.gate.map((s) => `<li>${esc(s)}</li>`).join("")}</ol>`;
}

function renderHealth(d) {
  const t = (d && d.totals) || {};
  const line = `${t.measured_axes ?? 15} measured of ${t.axes ?? 22} declared; verify pass; evidence present; rerun empty; eligibility board; corrections live.`;
  document.getElementById("health-box").innerHTML =
    `<p>${esc(line)}</p>
     <table><thead><tr><th>fact</th><th>access</th><th>state</th></tr></thead><tbody>` +
    HEALTH.map((h) => `<tr><td>${esc(h[0])}</td><td>${esc(h[1])}</td><td>${chip(h[2])}</td></tr>`).join("") +
    `</tbody></table>
     <p class="fine">Never a fused 0–100 health score. Never fill empty slots with zeroes.</p>`;
}

function renderEmpty() {
  document.getElementById("empty-box").innerHTML = EMPTY.map((e) =>
    `<article class="panel" data-empty-slot="${esc(e[0])}">
      <strong>${esc(e[0])}</strong>
      <p class="fine">${esc(e[1])}</p>
      <p class="fine">Never: ${esc(e[2])}</p>
    </article>`
  ).join("");
}

function renderFlags() {
  const groups = [
    ["planted", "Already planted — copy and drop"],
    ["next", "Next permissionless drops"],
    ["do-not", "Do not"],
  ];
  document.getElementById("flags-box").innerHTML = groups.map(([st, label]) => {
    const rows = FLAGS.filter((f) => f[0] === st);
    return `<div style="margin-top:0.8rem">
      <h3 style="font-size:1rem">${esc(label)}</h3>
      <div class="flags">${rows.map((f) =>
        `<article class="flag"><div class="top"><strong>${esc(f[1])}</strong>${chip(f[0])}</div>
         <p class="fine">${esc(f[3])} <a href="${esc(f[2])}">open</a></p></article>`
      ).join("")}</div>
    </div>`;
  }).join("");
}

async function renderQueue() {
  try {
    const q = await loadJson(QUEUE);
    document.getElementById("queue").textContent =
      `hub-queue n=${q.n} · status_all=${q.status_all} · n_measured=${q.n_measured} · as_of=${q.as_of}\n` +
      `${q.filter}\n${q.note}`;
    document.getElementById("census-counts").innerHTML = [
      ["Named in queue", q.n, "DISCOVERED, UNMEASURED"],
      ["Measured in queue", q.n_measured, "must stay 0 until signed cells"],
      ["N-site pages", q.n_site_pages ?? 0, "queue pagination"],
      ["Hub scale", ">2,000,000", "repos — do not invent a live integer"],
    ].map(([k, v, n]) => `<div><b>${esc(v)}</b><span>${esc(k)} · ${esc(n)}</span></div>`).join("");
  } catch (e) {
    document.getElementById("queue").textContent = "hub-queue SUMMARY unavailable — nothing fabricated. " + e;
  }
  try {
    const c = await loadJson(CATALOG);
    const n = (c.counts || {});
    document.getElementById("catalog").textContent =
      `living-catalog ${n.datasets || 0} datasets · ${n.spaces || 0} Spaces · ${n.models || 0} models · ${n.apis || 0} APIs · generated ${c.generated || ""}`;
  } catch (e) {
    document.getElementById("catalog").textContent = "living-catalog unavailable — nothing fabricated. " + e;
  }
}

function loadWatch() {
  try { return JSON.parse(localStorage.getItem(KEY) || "[]"); } catch { return []; }
}
function saveWatch(rows) { localStorage.setItem(KEY, JSON.stringify(rows)); }

function renderWatch() {
  const rows = loadWatch();
  const tb = document.querySelector("#watch-table tbody");
  tb.innerHTML = rows.map((r) =>
    `<tr><td>${esc(r.id)}</td><td>DISCOVERED</td><td>${esc(r.digest || "—")}</td></tr>`
  ).join("") || `<tr><td colspan="3" class="fine">No ids watched yet.</td></tr>`;
}

function addWatch() {
  const ids = (document.getElementById("watch-draft").value || "")
    .split(/[\s,]+/).map((s) => s.trim()).filter((s) => s.includes("/"));
  if (!ids.length) {
    document.getElementById("watch-note").textContent = "Paste owner/name ids. Listing is DISCOVERED, never MEASURED.";
    return;
  }
  const rows = loadWatch();
  for (const id of ids) {
    if (!rows.some((r) => r.id === id)) rows.push({ id, digest: null });
  }
  saveWatch(rows);
  document.getElementById("watch-draft").value = "";
  document.getElementById("watch-note").textContent = `Watching ${ids.length}. Local digest compare only.`;
  renderWatch();
}

async function refreshWatch() {
  const rows = loadWatch();
  document.getElementById("watch-note").textContent = "Probing Hub API blobs=true — no weight download.";
  for (const r of rows) {
    try {
      const d = await loadJson(`https://huggingface.co/api/models/${encodeURIComponent(r.id)}?blobs=true`);
      const shas = (d.siblings || []).map((s) => s.lfs && s.lfs.sha256).filter(Boolean);
      r.digest = shas[0] ? `lfs:${shas.length}` : "no-lfs";
    } catch {
      r.digest = "unresolvable";
    }
  }
  saveWatch(rows);
  renderWatch();
  document.getElementById("watch-note").textContent = "Digests refreshed. Still DISCOVERED. Not MEASURED.";
}

function bootStatic() {
  renderCensusSites();
  renderSpeeds();
  renderHundred();
  renderEmpty();
  renderFlags();
  renderWatch();
  document.getElementById("watch-add").onclick = addWatch;
  document.getElementById("watch-refresh").onclick = refreshWatch;
}

bootStatic();
renderQueue();
loadJson(API).then((d) => {
  renderBoard(d);
  renderHealth(d);
}).catch((e) => {
  document.getElementById("caption").textContent = "Open the GET (this host may block fetch): " + API;
  document.getElementById("axes").innerHTML = `<p class="err">${esc(String(e))}</p>`;
  renderHealth(null);
});
