/* CSOAI-GSPC public board. Live GET /api/gspc. */
const API = "https://councilof.ai/api/gspc";
const CARDS = "https://councilof.ai/signed/card_index.json";
const CORRECTIONS = "https://councilof.ai/api/corrections";
const QUEUE = "https://huggingface.co/datasets/csoai/hub-queue/resolve/main/SUMMARY.json";
const CATALOG = "https://huggingface.co/datasets/csoai/living-catalog/resolve/main/catalog.json";
const CENSUS_WALK = "./census-manifest.json";
const VERIFY = "https://councilof.ai/gspc-verify";
const SITE = "https://councilof.ai";
const LOOKUP_KEY = "csoai.gspc.desk.lookup.v1";

const PILLARS = [
  { id: "gov", title: "Governance", axes: ["governance"] },
  { id: "saf", title: "Safety", axes: ["safety", "jail", "art5-safeguard", "care", "affect", "swarm"] },
  { id: "prv", title: "Provenance", axes: ["provenance", "provenance-controls", "openness", "conformance"] },
  { id: "con", title: "Continuity", axes: ["continuity", "machinery-conformity", "cross-reality", "detector-interop"] },
  { id: "mkt", title: "Markets", axes: ["reserve-attestation", "regulatory-framework", "distribution-integrity", "custody-disclosure", "ai-economy-index", "human-labour-index", "humanoid-labour-index"] },
];

const ALIAS = {
  governance: ["governance", "gov", "gspc-governance"],
  safety: ["safety", "gspc-safety"],
  provenance: ["provenance", "gspc-provenance"],
  continuity: ["continuity", "gspc-continuity"],
  conformance: ["conformance", "gspc-conformance"],
  openness: ["openness", "gspc-openness"],
  care: ["care", "care-refusal-protect", "care-refusal-help"],
  jail: ["jail", "jail-escape-detection"],
  swarm: ["swarm", "swarm-candidates"],
};

const READ = [
  { title: "A listing is not a grade", body: "A Hub name can sit on a public list. That is DISCOVERED. It is not a GSPC cell." },
  { title: "The board snapshot is signed", body: "Fifteen axes carry a signed measurement. Public cards check. They do not yet name a unique weight file." },
  { title: "An empty slot is a finding", body: "Twenty-two axes stay on the map so the gaps stay visible. No invented zero, no invented leader." },
  { title: "A TIE is not a win", body: "When the leader interval contains the fleet mean, the point lead is not a measured advantage. Jail is a measured floor." },
];

const EMPTY_NEXT = {
  "reserve-attestation": { next: "A live partner issuer and a bolted instrument. We attest; we do not issue.", not: "Treating a planned rail as a measured reserve." },
  "regulatory-framework": { next: "Provision text is already watched. A grade needs a frozen bank and n.", not: "A scrape of a gazette becoming a grade." },
  "distribution-integrity": { next: "A signed supply statement attached to a cell, after the instrument runs.", not: "Generating statements and calling the axis measured." },
  "custody-disclosure": { next: "The public trust root is planted. A grade is a disclosure instrument on a subject.", not: "A signer invented on a laptop." },
  "ai-economy-index": { next: "Dated aggregates may be cited as reported. They join the board only with a frozen bank.", not: "An investable index." },
  "human-labour-index": { next: "Public statistical series can be cited as reported. Displacement is not a Council diagnosis.", not: "A prognosis of the labour market." },
  "humanoid-labour-index": { next: "An input bank first. Until then the published empty slot is the finding.", not: "A robot-workforce score." },
};

const CENSUS_SITES = [
  { id: "huggingface", title: "Hugging Face Hub", status: "planted", does: "Planted list: 2,410 names from a downloads-limited walk. A dated Hub listing walk observed 3,032,028 ids; none graded. A listing is DISCOVERED." },
  { id: "openrouter", title: "OpenRouter", status: "next", does: "Hosted names as a public catalogue. Not a measurement target until this board grades a unique run." },
  { id: "ollama", title: "Ollama library", status: "next", does: "A library card is a listing, not a grade." },
  { id: "kaggle", title: "Kaggle", status: "next", does: "Benchmark tasks after cost and reproducibility gates." },
  { id: "github", title: "GitHub model configs", status: "next", does: "A config file is not a run." },
];

const DOORS = [
  ["Verify a card", "https://councilof.ai/gspc-verify", "Check a signature in the browser. Free."],
  ["CSOAI-GSPC", "https://huggingface.co/spaces/csoai/gspc-board", "This public board."],
  ["Council of AI", "https://councilof.ai", "CSOAI-GSPC on the main site."],
  ["CSOAI-GSPC API", "https://councilof.ai/api/gspc", "The same figures, machine-readable."],
  ["Signed card index", "https://councilof.ai/signed/card_index.json", "Public compact cards."],
  ["Methodology DOI", "https://doi.org/10.5281/zenodo.21991104", "Citable snapshot."],
  ["Board dataset", "https://huggingface.co/datasets/csoai/gspc-board", "Hub mirror of CSOAI-GSPC."],
  ["Governance bank", "https://huggingface.co/datasets/csoai/gspc-gov", "The published governance bank. Other banks come from each axis record."],
];

let BOARD = null;
let INDEX = [];
let CORRS = [];
let selected = null;
let pillarFilter = null;
let query = "";
let lbAxis = "governance";

function esc(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[c]));
}
function pct(n) {
  return typeof n === "number" && Number.isFinite(n) ? `${Math.round(n * 1000) / 10}%` : "-";
}
function num(n, d = 4) {
  return typeof n === "number" && Number.isFinite(n) ? n.toFixed(d) : "-";
}
function chip(status, sep) {
  const u = String(status || "UNMEASURED").toUpperCase();
  const kind = u === "MEASURED" ? (sep === "TIE" ? "warn" : "ok") : "empty";
  return `<span class="chip ${kind}">${esc(u)}</span>`;
}
async function loadJson(url) {
  const r = await fetch(url, { headers: { accept: "application/json" } });
  if (!r.ok) throw new Error(`${url} ${r.status}`);
  return r.json();
}
function axisOf(name) {
  return (BOARD?.axes || []).find((a) => a.axis === name) || null;
}
function aliases(name) {
  return (ALIAS[name] || [name, `gspc-${name}`]).map((s) => s.toLowerCase());
}
function cardsFor(name) {
  const keys = aliases(name);
  return INDEX.filter((c) => {
    const ax = String(c.axis || "").toLowerCase();
    return keys.some((k) => ax === k || ax.startsWith(`${k}-`) || ax.endsWith(`-${k}`));
  });
}
function mentions(hay, name) {
  const text = String(hay || "").toLowerCase();
  return aliases(name).some((k) => text.includes(k));
}
function measuredOf(a) {
  return String(a?.status || "").toUpperCase() === "MEASURED";
}
function displayName(a) {
  return String(a.label || a.axis || "").replace(/-/g, " ");
}
function cleanModel(s) {
  return String(s || "").replace(/\s*\([^)]*\)\s*$/, "").trim();
}

function seatsFor(a) {
  const seats = Array.from({ length: 9 }, () => null);
  if (!a || !measuredOf(a)) return { kind: "empty", seats };
  if (a.kind === "deterministic-facts" || (a.family === "financial" && !a.leader)) {
    return { kind: "facts", seats, note: a.task || a.note || "This axis measures published facts, not a model contest." };
  }
  const rows = [];
  if (a.per_model && typeof a.per_model === "object") {
    Object.entries(a.per_model).forEach(([m, r]) => {
      rows.push({
        model: m,
        figure: r.accuracy != null ? r.accuracy : r.honesty_rate,
        n: r.n,
        interval: null,
        sep: null,
        extra: r,
      });
    });
    rows.sort((x, y) => (y.figure ?? -1) - (x.figure ?? -1));
  } else if (a.leader && typeof a.accuracy === "number") {
    rows.push({
      model: a.leader,
      figure: a.accuracy,
      n: a.n,
      interval: a.interval,
      sep: a.separation,
      publishedLeader: true,
    });
  }
  rows.slice(0, 9).forEach((r, i) => { seats[i] = r; });
  return { kind: "models", seats, published: rows.length };
}

function visibleAxes() {
  const allowed = pillarFilter
    ? new Set((PILLARS.find((p) => p.id === pillarFilter) || {}).axes || [])
    : null;
  const q = query.trim().toLowerCase();
  return (BOARD?.axes || []).filter((a) => {
    if (allowed && !allowed.has(a.axis)) return false;
    if (!q) return true;
    const hay = `${a.axis} ${a.family || ""} ${a.status || ""} ${a.leader || ""} ${a.kind || ""} ${a.bench || ""} ${a.task || ""}`.toLowerCase();
    if (hay.includes(q)) return true;
    const seats = seatsFor(a).seats;
    return seats.some((s) => s && String(s.model).toLowerCase().includes(q));
  });
}

function modelIndex() {
  const map = new Map();
  (BOARD?.axes || []).forEach((a) => {
    const add = (name, figure, role) => {
      const key = cleanModel(name).toLowerCase();
      if (!key) return;
      if (!map.has(key)) map.set(key, { name: cleanModel(name), axes: [], best: null, roles: [] });
      const row = map.get(key);
      row.axes.push(a.axis);
      row.roles.push(role);
      if (typeof figure === "number" && (row.best == null || figure > row.best)) row.best = figure;
    };
    if (a.leader) add(a.leader, a.accuracy, "leader");
    if (a.per_model) {
      Object.entries(a.per_model).forEach(([m, r]) => add(m, r.accuracy ?? r.honesty_rate, "row"));
    }
  });
  let rows = [...map.values()];
  const q = query.trim().toLowerCase();
  if (q) rows = rows.filter((r) => r.name.toLowerCase().includes(q) || r.axes.some((ax) => ax.includes(q)));
  rows.sort((a, b) => (b.best ?? -1) - (a.best ?? -1) || a.name.localeCompare(b.name));
  return rows;
}

function renderTape(d) {
  const t = d.totals || {};
  document.getElementById("tape").innerHTML = [
    [t.measured_axes ?? "-", "Measured axes"],
    [t.unmeasured_axes ?? "-", "Empty slots"],
    [t.items ?? "-", "Rows behind the board"],
    [INDEX.length || "-", "Signed cards"],
    [modelIndex().length || "-", "Published model names"],
    [t.public_count || "-", "Public count"],
  ].map(([v, k]) => `<div><b>${esc(v)}</b><span>${esc(k)}</span></div>`).join("");
}

function renderRuling(queueN, walkN) {
  const el = document.getElementById("ruling");
  if (!el || !BOARD) return;
  const t = BOARD.totals || {};
  const planted = queueN != null ? Number(queueN).toLocaleString("en-GB") : "2,410";
  const walk = walkN != null ? Number(walkN).toLocaleString("en-GB") : null;
  el.textContent = walk
    ? `CSOAI-GSPC measures AI health. The public board contains ${t.measured_axes ?? 15} measured axes on a signed snapshot. ${walk} Hub listings were observed; none graded. ${planted} names remain on the planted public list. A listing is not a grade. A rank is never sold.`
    : `CSOAI-GSPC measures AI health. The public board contains ${t.measured_axes ?? 15} measured axes on a signed snapshot. ${planted} models are listed and not yet graded. A listing is not a grade. A rank is never sold.`;
}

function renderPillars() {
  const el = document.getElementById("pillars");
  if (!el) return;
  el.innerHTML = `<button type="button" data-pillar="" class="${pillarFilter ? "" : "on"}">All</button>` +
    PILLARS.map((p) =>
      `<button type="button" data-pillar="${esc(p.id)}" class="${pillarFilter === p.id ? "on" : ""}">${esc(p.title)}</button>`
    ).join("");
  el.querySelectorAll("[data-pillar]").forEach((b) => {
    b.onclick = () => {
      const id = b.getAttribute("data-pillar");
      pillarFilter = id || null;
      renderMap();
      renderBoardTable();
    };
  });
}

function renderMap() {
  renderPillars();
  const host = document.getElementById("graph");
  const shown = pillarFilter ? PILLARS.filter((p) => p.id === pillarFilter) : PILLARS;
  host.innerHTML = shown.map((p) => {
    const tiles = p.axes.map((id) => {
      const a = axisOf(id);
      if (!a) return "";
      const on = measuredOf(a);
      const tie = a.axis === "jail" && a.separation === "TIE";
      const fig = on ? (typeof a.accuracy === "number" ? pct(a.accuracy) : "facts") : "empty";
      const klass = `tile${on ? "" : " empty"}${tie ? " jail" : ""}${selected === id ? " on" : ""}`;
      return `<button type="button" class="${klass}" data-axis="${esc(id)}" role="listitem">
        <div class="fig">${esc(fig)}</div>
        <div class="name">${esc(displayName(a))}</div>
        <div class="who">${on ? esc(cleanModel(a.leader) || (a.kind === "deterministic-facts" ? "facts" : "-")) : "No grade yet"}</div>
        ${chip(a.status, a.separation)}
      </button>`;
    }).join("");
    return `<div class="col"><h3>${esc(p.title)}</h3>${tiles}</div>`;
  }).join("");
  host.querySelectorAll("[data-axis]").forEach((b) => {
    b.onclick = () => openAxis(b.getAttribute("data-axis"));
  });
  const note = document.getElementById("legend");
  if (note) {
    note.textContent = pillarFilter
      ? `${visibleAxes().length} axes in this family. Click a tile to open the record.`
      : "Five families. Green is measured. Slate is empty. Click a family, then an axis.";
  }
}

function renderBoardTable() {
  const rows = visibleAxes();
  const filterNote = document.getElementById("filter-note");
  if (filterNote) {
    filterNote.textContent = query.trim()
      ? `${rows.length} matches for "${query.trim()}". Order is presentation, not a purchased rank.`
      : `${rows.length} published axes. Order is presentation, not a purchased rank.`;
  }
  document.getElementById("board-body").innerHTML = rows.map((a) => {
    const on = measuredOf(a);
    const fig = on ? (typeof a.accuracy === "number" ? pct(a.accuracy) : "facts") : "-";
    const iv = on && Array.isArray(a.interval) ? `${pct(a.interval[0])}-${pct(a.interval[1])}` : "-";
    const sep = on ? (a.axis === "jail" && a.separation === "TIE" ? "TIE · floor" : (a.separation || "-")) : "-";
    return `<tr data-axis="${esc(a.axis)}" tabindex="0" class="${selected === a.axis ? "active" : ""}">
      <td>${esc(a.axis)}</td>
      <td>${esc(a.family || "")}</td>
      <td>${chip(a.status, a.separation)}</td>
      <td>${esc(fig)}</td>
      <td>${esc(on && a.n != null ? a.n : "-")}</td>
      <td>${esc(iv)}</td>
      <td>${esc(sep)}</td>
      <td>${on ? esc(a.leader || "-") : "-"}</td>
    </tr>`;
  }).join("") || `<tr><td colspan="8">No axes match.</td></tr>`;
  document.querySelectorAll("#board-body tr[data-axis]").forEach((tr) => {
    const open = () => openAxis(tr.getAttribute("data-axis"));
    tr.onclick = open;
    tr.onkeydown = (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open(); } };
  });
}

function leaderboardRows(a) {
  const pack = seatsFor(a);
  return pack.seats.map((s, i) => {
    if (!s) {
      return `<tr class="vacant"><td>${i + 1}</td><td colspan="5">Not published on this axis</td></tr>`;
    }
    const iv = Array.isArray(s.interval) ? `${pct(s.interval[0])}-${pct(s.interval[1])}` : "-";
    const sep = s.sep === "TIE" ? "TIE · floor" : (s.sep || (s.publishedLeader ? "published leader" : "-"));
    return `<tr data-model="${esc(s.model)}">
      <td>${i + 1}</td>
      <td>${esc(s.model)}</td>
      <td>${esc(typeof s.figure === "number" ? pct(s.figure) : "-")}</td>
      <td>${esc(s.n ?? "-")}</td>
      <td>${esc(iv)}</td>
      <td>${esc(sep)}</td>
    </tr>`;
  }).join("");
}

function renderLeaderboard(name) {
  const a = axisOf(name) || visibleAxes()[0] || (BOARD?.axes || [])[0];
  if (!a) return;
  lbAxis = a.axis;
  const sel = document.getElementById("lb-axis");
  if (sel && !sel.dataset.bound) {
    sel.innerHTML = (BOARD.axes || []).map((x) =>
      `<option value="${esc(x.axis)}">${esc(x.axis)}</option>`
    ).join("");
    sel.onchange = () => {
      lbAxis = sel.value;
      renderLeaderboard(lbAxis);
    };
    sel.dataset.bound = "1";
  }
  if (sel) sel.value = a.axis;
  const pack = seatsFor(a);
  const note = document.getElementById("lb-note");
  if (pack.kind === "empty") {
    note.textContent = "This slot is published empty. No measurement has been signed. Nine seats stay blank so a gap is visible.";
  } else if (pack.kind === "facts") {
    note.textContent = pack.note || "This axis measures published facts, not a model contest.";
  } else if (pack.published === 1) {
    note.textContent = "The signed board publishes one leader and a fleet mean on this axis. The other eight seats stay blank until per-model rows are signed. A rank is never sold.";
  } else {
    note.textContent = `${pack.published} published names on this axis. Empty seats are not invented zeros. Jail is a measured floor when the lead is a TIE.`;
  }
  const podium = document.getElementById("podium");
  const top = pack.seats.slice(0, 3);
  podium.innerHTML = [0, 1, 2].map((i) => {
    const s = top[i];
    if (!s) return `<li><span>#${i + 1}</span><b class="vacant">Not published</b><span>-</span></li>`;
    return `<li><span>#${i + 1}</span><b>${esc(cleanModel(s.model))}</b><span>${esc(typeof s.figure === "number" ? pct(s.figure) : "-")}</span></li>`;
  }).join("");
  document.querySelector("#lb-table tbody").innerHTML = leaderboardRows(a);
}

function renderModels() {
  const rows = modelIndex();
  const note = document.getElementById("mod-note");
  if (note) {
    note.textContent = query.trim()
      ? `${rows.length} published names match "${query.trim()}".`
      : `${rows.length} names appear as a leader or a signed per-model row. Search above.`;
  }
  const tb = document.querySelector("#mod-table tbody");
  tb.innerHTML = rows.map((r) =>
    `<tr data-axis="${esc(r.axes[0] || "")}">
      <td>${esc(r.name)}</td>
      <td>${esc(r.axes.join(", "))}</td>
      <td>${esc(r.best != null ? pct(r.best) : "-")}</td>
      <td><button type="button" data-axis="${esc(r.axes[0] || "")}">Open</button></td>
    </tr>`
  ).join("") || `<tr><td colspan="4">No published model names match.</td></tr>`;
  tb.querySelectorAll("[data-axis]").forEach((n) => {
    n.onclick = () => {
      const id = n.getAttribute("data-axis");
      if (id) openAxis(id);
    };
  });
}

function rows(pairs) {
  return `<thead><tr><th>Field</th><th>Published value</th></tr></thead><tbody>` +
    pairs.map(([k, v]) => `<tr><td>${esc(k)}</td><td>${v}</td></tr>`).join("") +
    `</tbody>`;
}

function openAxis(name) {
  const a = axisOf(name);
  if (!a) return;
  selected = name;
  lbAxis = name;
  history.replaceState(null, "", `#${encodeURIComponent(name)}`);
  renderMap();
  renderBoardTable();
  renderLeaderboard(name);
  const desk = document.getElementById("desk");
  desk.hidden = false;
  const on = measuredOf(a);
  document.getElementById("desk-kicker").textContent = on ? "Published finding" : "Published empty slot";
  document.getElementById("desk-h").textContent = a.axis;
  document.getElementById("desk-sub").textContent = [a.bench, a.task].filter(Boolean).join(" · ");
  const fig = on ? (typeof a.accuracy === "number" ? pct(a.accuracy) : "facts · no accuracy") : "no figure";
  const iv = on && Array.isArray(a.interval) ? `${pct(a.interval[0])} - ${pct(a.interval[1])}` : (on ? "withheld" : "-");
  const sep = a.axis === "jail" && a.separation === "TIE" ? "TIE · floor" : (a.separation || "-");
  document.getElementById("quote").innerHTML = [
    [chip(a.status, a.separation), "Status"],
    [esc(fig), "Figure"],
    [esc(on && a.n != null ? a.n : "-"), "n"],
    [esc(iv), "95% interval"],
    [esc(sep), "Separation"],
    [esc(on && a.leader ? a.leader : "-"), "Leader"],
    [esc(on && typeof a.fleet_mean === "number" ? pct(a.fleet_mean) : "-"), "Fleet mean"],
    [esc(on && typeof a.macro_f1 === "number" ? String(a.macro_f1) : "-"), "Macro F1"],
  ].map(([v, k]) => `<div><b>${v}</b><span>${esc(k)}</span></div>`).join("");

  document.getElementById("desk-lb").innerHTML =
    `<thead><tr><th>#</th><th>Model</th><th>Figure</th><th>n</th><th>Interval</th><th>Lead</th></tr></thead><tbody>${leaderboardRows(a)}</tbody>`;

  const finding = [
    ["Axis", esc(a.axis)],
    ["Family", esc(a.family || "-")],
    ["Kind", esc(a.kind || "-")],
    ["Instrument / task", esc(a.task || a.bench || "-")],
    ["Leader", on ? esc(a.leader || "-") : "-"],
    ["n", on && a.n != null ? esc(String(a.n)) : "-"],
    ["Figure", on ? esc(fig) : "-"],
    ["95% interval", esc(iv)],
    ["Fleet mean", on && typeof a.fleet_mean === "number" ? esc(pct(a.fleet_mean)) : "-"],
    ["Macro F1", on && typeof a.macro_f1 === "number" ? esc(String(a.macro_f1)) : "-"],
    ["Separation", esc(sep)],
    ["McNemar p", on && a.separation_p != null ? esc(String(a.separation_p)) : "-"],
    ["Unparsed rate", on && typeof a.unparsed_rate === "number" ? esc(pct(a.unparsed_rate)) : "-"],
  ];
  if (on && typeof a.mean_harm === "number") finding.push(["Mean harm", esc(num(a.mean_harm))]);
  if (on && typeof a.cvar05_harm === "number") finding.push(["CVaR harm", esc(num(a.cvar05_harm))]);
  const bank = a.dataset_url
    ? `<a href="${esc(a.dataset_url)}" target="_blank" rel="noreferrer">${esc(a.dataset || a.dataset_url)}</a>`
    : esc(a.dataset || "-");
  finding.push(["Bank", bank]);
  if (a.axis === "jail") finding.push(["Note", "Measured floor. A TIE is not a scored arena door."]);
  if (!on) finding.push(["Note", "This slot is published empty. No measurement has been signed."]);
  document.getElementById("find-table").innerHTML = rows(finding);

  const recs = cardsFor(name);
  if (!recs.length) {
    document.getElementById("rec-table").innerHTML =
      `<thead><tr><th>Record</th><th>State</th></tr></thead>` +
      `<tbody><tr><td colspan="2">${on ? "No compact cards listed for this axis yet. The cell on the board is still the finding." : "Empty slot - no signed compact cards."}</td></tr></tbody>`;
  } else {
    document.getElementById("rec-table").innerHTML =
      `<thead><tr><th>Card</th><th>When</th><th></th></tr></thead><tbody>` +
      recs.slice(0, 12).map((c) => {
        const url = c.card_url ? (c.card_url.startsWith("http") ? c.card_url : SITE + c.card_url) : VERIFY;
        return `<tr><td>${esc(String(c.card || "").slice(0, 12))}...</td><td>${esc(c.ts ? String(c.ts).replace("T", " ").slice(0, 19) : "-")}</td><td><a href="${esc(url)}" target="_blank" rel="noreferrer">open</a> · <a href="${VERIFY}" target="_blank" rel="noreferrer">verify</a></td></tr>`;
      }).join("") +
      `<tr><td colspan="3">${recs.length} compact card(s). They check. They do not yet bind a subject or weight-manifest digest.</td></tr></tbody>`;
  }

  const honest = [];
  if (a.null_grammar) honest.push(["Null grammar", esc(a.null_grammar)]);
  if (a.n_note) honest.push(["n note", esc(a.n_note)]);
  (BOARD?.limitations || []).filter((l) => mentions(l, name)).forEach((l, i) => honest.push([`Limitation ${i + 1}`, esc(l)]));
  CORRS.filter((c) => mentions(`${c.id} ${c.what_was_wrong} ${c.fix}`, name)).slice(0, 6)
    .forEach((c) => honest.push([c.id || "Correction", esc(c.what_was_wrong || "")]));
  if (!honest.length) {
    honest.push(["On this axis", on
      ? "No extra limitation names this cell beyond the board-wide notes below."
      : "The slot is empty. That fact is the honesty."]);
  }
  honest.push(["Lineage", "Public compact cards do not yet carry a subject or weight-manifest digest."]);
  document.getElementById("honest-table").innerHTML = rows(honest);

  const fleet = document.getElementById("fleet");
  const models = a.per_model && typeof a.per_model === "object" ? Object.entries(a.per_model) : [];
  if (models.length) {
    fleet.hidden = false;
    fleet.innerHTML = `<h3>Per-model cells on this axis</h3>
      <table class="sheet"><thead><tr><th>Model</th><th>n</th><th>Accuracy</th><th>Precision</th><th>Recall</th></tr></thead>
      <tbody>${models.map(([m, r]) =>
        `<tr><td>${esc(m)}</td><td>${esc(r.n ?? "-")}</td><td>${esc(r.accuracy != null ? pct(r.accuracy) : (r.honesty_rate != null ? pct(r.honesty_rate) : "-"))}</td><td>${esc(r.precision ?? "-")}</td><td>${esc(r.recall ?? "-")}</td></tr>`
      ).join("")}</tbody></table>`;
  } else {
    fleet.hidden = true;
    fleet.innerHTML = "";
  }

  document.getElementById("desk-note").textContent = a.note || "";
  const links = [];
  if (a.dataset_url) links.push(`<a href="${esc(a.dataset_url)}" target="_blank" rel="noreferrer">Bank</a>`);
  links.push(`<a href="${API}?axis=${encodeURIComponent(a.axis)}" target="_blank" rel="noreferrer">Live axis</a>`);
  links.push(`<a href="${VERIFY}" target="_blank" rel="noreferrer">Verify a card</a>`);
  document.getElementById("desk-links").innerHTML = links.join("");
  desk.scrollIntoView({ block: "nearest", behavior: "smooth" });
}

function renderRead() {
  document.getElementById("read-box").innerHTML = READ.map((r) =>
    `<article class="panel"><strong>${esc(r.title)}</strong><p class="fine">${esc(r.body)}</p></article>`
  ).join("");
}
function renderEmpty() {
  const empty = (BOARD?.axes || []).filter((a) => !measuredOf(a));
  const el = document.getElementById("empty-box");
  el.innerHTML = empty.map((a) => {
    const extra = EMPTY_NEXT[a.axis] || { next: a.note || "Published empty.", not: "An invented zero." };
    return `<article class="panel gap" data-axis="${esc(a.axis)}" tabindex="0">
      <div class="top"><strong>${esc(a.axis)}</strong>${chip(a.status)}</div>
      <p class="fine">${esc(a.task || a.note || "")}</p>
      <p class="fine"><b>Next published step.</b> ${esc(extra.next)}</p>
      <p class="fine"><b>What this is not.</b> ${esc(extra.not)}</p>
    </article>`;
  }).join("");
  el.querySelectorAll("[data-axis]").forEach((n) => {
    n.onclick = () => openAxis(n.getAttribute("data-axis"));
  });
}
function renderHealth() {
  const t = BOARD?.totals || {};
  const rowsH = [
    ["Measured axes", "Live board", String(t.measured_axes ?? "-")],
    ["Empty slots", "Live board", String(t.unmeasured_axes ?? "-")],
    ["Rows behind the board", "Sum of per-axis n, not models or cards", String(t.items ?? "-")],
    ["Signed compact cards", "Public card index - they check; no unique weight file yet", String(INDEX.length || "-")],
    ["Published model names", "Leaders and signed per-model rows only", String(modelIndex().length || "-")],
    ["Verify", "councilof.ai/gspc-verify", "open"],
    ["Jail floor", "Measured, separation TIE", "present"],
    ["Issuer", BOARD?.issuer || "CSOAI Ltd", "UK 16939677"],
  ];
  document.getElementById("health-table").innerHTML =
    `<thead><tr><th>Fact</th><th>Where you check it</th><th>State</th></tr></thead><tbody>` +
    rowsH.map((r) => `<tr><td>${esc(r[0])}</td><td>${esc(r[1])}</td><td>${esc(r[2])}</td></tr>`).join("") +
    `</tbody>`;
}
function renderCensusSites() {
  document.getElementById("census-sites").innerHTML = CENSUS_SITES.map((s) =>
    `<article class="panel"><div class="top"><strong>${esc(s.title)}</strong>${chip(s.status)}</div><p class="fine">${esc(s.does)}</p></article>`
  ).join("");
}
async function renderQueue() {
  let walkN = null;
  let walk = null;
  try {
    walk = await loadJson(CENSUS_WALK);
    if (walk && typeof walk.n_unique_ids === "number") walkN = walk.n_unique_ids;
  } catch (e) {
    walk = null;
  }
  try {
    const q = await loadJson(QUEUE);
    document.getElementById("queue").textContent =
      `Planted list: ${q.n} · all ungraded · graded in this list: ${q.n_measured} · as of ${q.as_of}\n${q.filter || ""}\n${q.note || ""}`;
    const ruling = document.getElementById("census-ruling");
    if (ruling) {
      ruling.textContent = walkN != null
        ? `${Number(walkN).toLocaleString("en-GB")} Hub listings observed; none graded. ${Number(q.n).toLocaleString("en-GB")} names remain on the planted public list.`
        : `${Number(q.n).toLocaleString("en-GB")} models listed, not graded.`;
    }
    const counts = walk
      ? [
          [walk.n_unique_ids, "Listings observed", "DISCOVERED · none graded"],
          [walk.n_measured, "Graded in that walk", "0 - a listing is not a grade"],
          [walk.pages_done, "Walk pages done", walk.complete_reason || "hub-exhausted"],
          [q.n, "Planted public list", "downloads-limited seed · not a grade"],
        ]
      : [
          [q.n, "Listed", "DISCOVERED · not yet graded"],
          [q.n_measured, "Graded in this list", "0 until a signed grade exists"],
          [q.n_site_pages ?? 0, "Full-walk pages done", "see census-manifest.json"],
        ];
    document.getElementById("census-counts").innerHTML = counts
      .map(([v, k, n]) => `<div><b>${esc(v)}</b><span>${esc(k)} · ${esc(n)}</span></div>`).join("");
    renderRuling(q.n, walkN);
  } catch (e) {
    document.getElementById("queue").textContent = "Public list unavailable - nothing fabricated. " + e;
    if (walkN != null) renderRuling(null, walkN);
  }
  try {
    const c = await loadJson(CATALOG);
    const n = c.counts || {};
    document.getElementById("catalog").textContent =
      `Public catalogue ${n.datasets || 0} datasets · ${n.spaces || 0} Spaces · ${n.models || 0} models · generated ${c.generated || ""}`;
  } catch (e) {
    document.getElementById("catalog").textContent = "Public catalogue unavailable - nothing fabricated. " + e;
  }
}
function renderDoors() {
  document.getElementById("doors-box").innerHTML = DOORS.map(([title, href, note]) =>
    `<article class="panel"><div class="top"><strong><a href="${esc(href)}" target="_blank" rel="noreferrer">${esc(title)}</a></strong></div><p class="fine">${esc(note)}</p></article>`
  ).join("");
}
function renderHonesty() {
  document.getElementById("limits").innerHTML = (BOARD?.limitations || []).map((l) => `<li>${esc(l)}</li>`).join("");
  document.getElementById("corr-table").innerHTML =
    `<thead><tr><th>Id</th><th>Date</th><th>What was wrong</th></tr></thead><tbody>` +
    (CORRS.length
      ? CORRS.slice(0, 16).map((c) => `<tr><td>${esc(c.id || "")}</td><td>${esc(c.date || "")}</td><td>${esc(c.what_was_wrong || "")}</td></tr>`).join("")
      : `<tr><td colspan="3">Corrections ledger unavailable - nothing fabricated.</td></tr>`) +
    `</tbody>`;
  const lanes = BOARD?.measured_in_lane || [];
  const names = lanes.map((x) => x.axis || x.bench).filter(Boolean).join(", ");
  document.getElementById("lane-note").textContent =
    (names ? `In-lane, not on the public count: ${names}. ` : "") +
    "Compact cards check and do not yet bind a subject or weight-manifest digest. The Hub listing walk finished; none of those listings is a grade.";
}

function loadLookup() {
  try { return JSON.parse(localStorage.getItem(LOOKUP_KEY) || "[]"); } catch { return []; }
}
function saveLookup(rows) { localStorage.setItem(LOOKUP_KEY, JSON.stringify(rows)); }
function renderLookup() {
  const tb = document.querySelector("#watch-table tbody");
  const rows = loadLookup();
  tb.innerHTML = rows.map((r) =>
    `<tr><td>${esc(r.id)}</td><td>DISCOVERED</td><td>${esc(r.digest || "-")}</td></tr>`
  ).join("") || `<tr><td colspan="3" class="fine">No listings yet.</td></tr>`;
}
function addLookup() {
  const ids = (document.getElementById("watch-draft").value || "").split(/[\s,]+/).map((s) => s.trim()).filter((s) => s.includes("/"));
  if (!ids.length) {
    document.getElementById("watch-note").textContent = "Paste owner/name ids. A listing is DISCOVERED, never a grade.";
    return;
  }
  const rows = loadLookup();
  ids.forEach((id) => { if (!rows.some((r) => r.id === id)) rows.push({ id, digest: null }); });
  saveLookup(rows);
  document.getElementById("watch-draft").value = "";
  document.getElementById("watch-note").textContent = `${ids.length} listing(s). Not a grade.`;
  renderLookup();
}
async function refreshLookup() {
  const rows = loadLookup();
  document.getElementById("watch-note").textContent = "Reading Hub file lists - no weight download.";
  for (const r of rows) {
    try {
      const d = await loadJson(`https://huggingface.co/api/models/${encodeURIComponent(r.id)}?blobs=true`);
      const shas = (d.siblings || []).map((s) => s.lfs && s.lfs.sha256).filter(Boolean);
      r.digest = shas[0] ? `lfs:${shas.length}` : "no-lfs";
    } catch { r.digest = "unresolvable"; }
  }
  saveLookup(rows);
  renderLookup();
  document.getElementById("watch-note").textContent = "File list refreshed. Still DISCOVERED. Not a grade.";
}

function applySearch() {
  renderMap();
  renderBoardTable();
  renderModels();
  if (lbAxis) renderLeaderboard(lbAxis);
}

async function boot() {
  renderRead();
  renderDoors();
  document.getElementById("q").addEventListener("input", () => {
    query = document.getElementById("q").value;
    applySearch();
  });
  document.getElementById("watch-add").addEventListener("click", addLookup);
  document.getElementById("watch-refresh").addEventListener("click", refreshLookup);
  renderLookup();
  try {
    BOARD = await loadJson(API);
    renderRuling();
    renderTape(BOARD);
    renderMap();
    renderBoardTable();
    renderLeaderboard(lbAxis);
    renderModels();
    renderEmpty();
    renderHealth();
    renderCensusSites();
    renderHonesty();
    const hash = decodeURIComponent((location.hash || "").replace(/^#/, ""));
    if (hash && axisOf(hash)) openAxis(hash);
  } catch (e) {
    document.getElementById("board-body").innerHTML =
      `<tr><td colspan="8" class="err">${esc(String(e))}</td></tr>`;
  }
  try {
    const idx = await loadJson(CARDS);
    INDEX = idx.cards || [];
    if (BOARD) { renderTape(BOARD); renderHealth(); }
    if (selected) openAxis(selected);
  } catch { INDEX = []; }
  try {
    const corr = await loadJson(CORRECTIONS);
    CORRS = corr.corrections || corr.items || [];
    if (BOARD) { renderTape(BOARD); renderHealth(); renderHonesty(); }
    if (selected) openAxis(selected);
  } catch { CORRS = []; }
  renderQueue();
}

boot();
window.addEventListener("hashchange", () => {
  const hash = decodeURIComponent((location.hash || "").replace(/^#/, ""));
  if (hash && axisOf(hash)) openAxis(hash);
});
