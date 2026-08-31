/* Public GSPC findings desk. Live GET /api/gspc. Not a second scoreboard. */
const API = "https://councilof.ai/api/gspc";
const CARDS = "https://councilof.ai/signed/card_index.json";
const CORRECTIONS = "https://councilof.ai/api/corrections";
const QUEUE = "https://huggingface.co/datasets/csoai/hub-queue/resolve/main/SUMMARY.json";
const CATALOG = "https://huggingface.co/datasets/csoai/living-catalog/resolve/main/catalog.json";
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
  {
    title: "A listing is not a grade",
    body: "A Hub id, a library card, a hosted name. Metadata without a weight download is DISCOVERED. It is not a GSPC cell.",
  },
  {
    title: "The board snapshot is signed",
    body: "Fifteen measured axes sit on a valid signed board. The public compact cards verify. They do not yet bind a subject or weight-manifest digest. Card v2 unique-lineage binding is the next production gate — not a description of these cards.",
  },
  {
    title: "An empty slot is a finding",
    body: "Twenty-two axes are on the board so the gaps stay visible. An empty slot has no leader, no mean, no invented zero. The absence is published.",
  },
  {
    title: "A TIE is not a win",
    body: "When the leader’s interval contains the fleet mean, the point-estimate lead is not a measured advantage. Jail is MEASURED as a floor, not a scored arena door.",
  },
];

const EMPTY_NEXT = {
  "reserve-attestation": {
    next: "A live partner issuer and a bolted instrument. We attest; we do not issue.",
    not: "Treating a planned rail as a measured reserve.",
  },
  "regulatory-framework": {
    next: "Provision text is already watched. MEASURED needs a frozen bank and n.",
    not: "A scrape of a gazette becoming a grade.",
  },
  "distribution-integrity": {
    next: "A signed SBOM or SCITT statement attached to a cell, after the instrument runs.",
    not: "Generating statements and calling the axis MEASURED.",
  },
  "custody-disclosure": {
    next: "did:web:csoai.org is planted. MEASURED is a disclosure instrument on a subject.",
    not: "A signer invented on a laptop.",
  },
  "ai-economy-index": {
    next: "Dated aggregates may be cited as REPORTED with attribution. They join MEASURED only with a frozen bank.",
    not: "An investable index.",
  },
  "human-labour-index": {
    next: "Public statistical series can be cited as REPORTED. Displacement is not a Council diagnosis.",
    not: "A prognosis of the labour market.",
  },
  "humanoid-labour-index": {
    next: "An input bank first. Until then the published empty slot is the finding.",
    not: "A robot-workforce score.",
  },
};

const CENSUS_SITES = [
  { id: "huggingface", title: "Hugging Face Hub", status: "planted", does: "PLANTED. The current queue is a downloads-limited walk (see live SUMMARY). Full Hub-scale paginated Speed 0 census is ready to run, not yet completed. Listing is DISCOVERED." },
  { id: "openrouter", title: "OpenRouter", status: "next", does: "Hosted ids as a public catalogue. Not a measurement target until a Card v2 lineage cell exists." },
  { id: "ollama", title: "Ollama library", status: "next", does: "Local pull list as DISCOVERED. A library card is not a Card v2 lineage cell." },
  { id: "kaggle", title: "Kaggle", status: "next", does: "Benchmark tasks after cost and reproducibility gates. One org identity." },
  { id: "github", title: "GitHub model configs", status: "next", does: "Discovery of declared weights. A config file is not a run." },
];

const DOORS = [
  ["Verify a card", "https://councilof.ai/gspc-verify", "Browser WebCrypto. sha256 \u00b7 issuer \u00b7 axis. Free."],
  ["Public MCP", "https://councilof.ai/mcp", "board_totals \u00b7 get_axis \u00b7 verify_card \u00b7 list_cards."],
  ["MCP discovery", "https://councilof.ai/.well-known/mcp.json", "Layer-0 well-known."],
  ["Living board API", "https://councilof.ai/api/gspc", "Quote totals.public_count. Empty stays empty."],
  ["Signed card index", "https://councilof.ai/signed/card_index.json", "Public compact cards."],
  ["Methodology DOI", "https://doi.org/10.5281/zenodo.21991104", "Citable snapshot. Not a mutable working board."],
  ["This Space", "https://huggingface.co/spaces/csoai/gspc-board", "The public desk. Same GET /api/gspc."],
  ["Board dataset", "https://huggingface.co/datasets/csoai/gspc-board", "Hub mirror of the living board."],
  ["Governance bank", "https://huggingface.co/datasets/csoai/gspc-gov", "Canonical governance bank. Other banks come from each axis’s dataset_url."],
  ["Hub queue", "https://huggingface.co/datasets/csoai/hub-queue", "Named Hub ids. DISCOVERED. Still UNMEASURED."],
  ["Living catalog", "https://huggingface.co/datasets/csoai/living-catalog", "Dated catalogue of public surfaces."],
  ["did:web trust root", "https://csoai.org/.well-known/did.json", "Pin did:web:csoai.org#card-attestation-1."],
  ["HF collection", "https://huggingface.co/collections/csoai/gspc-board-verify-flywheel-queue-banks-6a92a75986947dfa9d5306b5", "Board \u00b7 verify \u00b7 flywheel \u00b7 queue \u00b7 banks."],
  ["Verify Space", "https://huggingface.co/spaces/csoai/gspc-verify", "Hub-native verify door."],
  ["Flywheel Space", "https://huggingface.co/spaces/csoai/gspc-flywheel", "Find a published card. Not an evaluator."],
  ["Embed kit", "https://councilof.ai/embed.js", "Partner pages that want a live count from GET /api/gspc."],
];

let BOARD = null;
let INDEX = [];
let CORRS = [];
let selected = null;
let pillarFilter = null;
let query = "";

function esc(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[c]));
}

function pct(n) {
  return typeof n === "number" && Number.isFinite(n) ? `${Math.round(n * 1000) / 10}%` : "\u2014";
}

function num(n, d = 4) {
  return typeof n === "number" && Number.isFinite(n) ? n.toFixed(d) : "\u2014";
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
  const keys = aliases(name);
  const text = String(hay || "").toLowerCase();
  return keys.some((k) => text.includes(k));
}

function limsFor(name) {
  return (BOARD?.limitations || []).filter((l) => mentions(l, name));
}

function corrsFor(name) {
  return CORRS.filter((c) =>
    mentions(`${c.id} ${c.what_was_wrong} ${c.fix} ${c.how_caught}`, name)
  );
}

function measuredOf(a) {
  return String(a?.status || "").toUpperCase() === "MEASURED";
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
    return hay.includes(q);
  });
}

function renderTape(d) {
  const t = d.totals || {};
  const issuer = d.issuer || "CSOAI Ltd";
  document.getElementById("stamp").textContent =
    `${t.public_count || "living board"} \u00b7 ${issuer} \u00b7 live`;
  document.getElementById("tape").innerHTML = [
    [t.axes ?? "\u2014", "Declared slots"],
    [t.measured_axes ?? "\u2014", "Measured"],
    [t.unmeasured_axes ?? "\u2014", "Empty"],
    [t.items ?? "\u2014", "Rows behind the board"],
    [INDEX.length || "\u2014", "Signed compact cards"],
    [CORRS.length || "\u2014", "Corrections"],
    [(d.limitations || []).length || "\u2014", "Limitations"],
    [d.doi || "10.5281/zenodo.21991104", "DOI"],
  ].map(([v, k]) => `<div><b>${esc(v)}</b><span>${esc(k)}</span></div>`).join("");
}

function renderLegend() {
  const el = document.getElementById("legend");
  if (!el) return;
  const pillar = PILLARS.find((p) => p.id === pillarFilter);
  el.innerHTML = [
    `<span class="chip ok">MEASURED</span>`,
    `<span class="chip empty">empty</span>`,
    `<span class="chip warn">TIE \u00b7 floor</span>`,
    `<span class="leg-sel">selected</span>`,
    pillar
      ? `<span class="fine">Tape filtered to ${esc(pillar.title)} \u00b7 click the pillar again to clear</span>`
      : `<span class="fine">Click a pillar to filter the tape</span>`,
  ].join("");
}

function renderBoardTable() {
  const rows = visibleAxes();
  const filterNote = document.getElementById("filter-note");
  if (filterNote) {
    const pillar = PILLARS.find((p) => p.id === pillarFilter);
    const bits = [];
    if (pillar) bits.push(`pillar: ${pillar.title}`);
    if (query.trim()) bits.push(`filter: \u201c${query.trim()}\u201d`);
    filterNote.textContent = bits.length
      ? `${rows.length} of ${(BOARD?.axes || []).length} axes \u00b7 ${bits.join(" \u00b7 ")}`
      : `${rows.length} published axes. Order is presentation, not rank.`;
  }
  document.getElementById("board-body").innerHTML = rows.map((a) => {
    const on = measuredOf(a);
    const fig = on ? (typeof a.accuracy === "number" ? pct(a.accuracy) : "facts") : "\u2014";
    const iv = on && Array.isArray(a.interval) ? `${pct(a.interval[0])}\u2013${pct(a.interval[1])}` : "\u2014";
    const n = on && a.n != null ? a.n : "\u2014";
    const sep = on ? (a.axis === "jail" && a.separation === "TIE" ? "TIE \u00b7 floor" : (a.separation || "\u2014")) : "\u2014";
    return `<tr data-axis="${esc(a.axis)}" tabindex="0" class="${selected === a.axis ? "active" : ""}">\n      <td>${esc(a.axis)}</td>\n      <td>${esc(a.family || "")}</td>\n      <td>${chip(a.status, a.separation)}</td>\n      <td>${esc(fig)}</td>\n      <td>${esc(n)}</td>\n      <td>${esc(iv)}</td>\n      <td>${esc(sep)}</td>\n      <td>${on ? esc(a.leader || "\u2014") : "\u2014"}</td>\n    </tr>`;
  }).join("") || `<tr><td colspan="8">No axes match.</td></tr>`;
  document.querySelectorAll("#board-body tr[data-axis]").forEach((tr) => {
    const open = () => openAxis(tr.getAttribute("data-axis"));
    tr.onclick = open;
    tr.onkeydown = (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        open();
      }
    };
  });
}

function renderGraph() {
  const W = 980, H = 420;
  const cx = 490, cy = 210;
  const pillars = PILLARS.map((p, i) => {
    const ang = (-90 + i * 72) * Math.PI / 180;
    return { ...p, x: cx + Math.cos(ang) * 150, y: cy + Math.sin(ang) * 118 };
  });
  const nodes = [];
  pillars.forEach((p) => {
    const n = p.axes.length;
    p.axes.forEach((name, i) => {
      const spread = Math.max(0.55, Math.min(1.35, n * 0.22));
      const ang = Math.atan2(p.y - cy, p.x - cx) + (i - (n - 1) / 2) * (0.38 / spread);
      const r = 250;
      nodes.push({
        name,
        x: p.x + Math.cos(ang) * (r - 150),
        y: p.y + Math.sin(ang) * (r - 150),
        pillar: p.id,
      });
    });
  });
  const byName = Object.fromEntries(nodes.map((n) => [n.name, n]));
  const edges = [];
  pillars.forEach((p) => {
    const dim = pillarFilter && pillarFilter !== p.id;
    edges.push(`<line x1="${cx}" y1="${cy}" x2="${p.x}" y2="${p.y}" stroke="${dim ? "#1a2430" : "#2a3a4c"}" stroke-width="1.2"/>`);
    p.axes.forEach((name) => {
      const n = byName[name];
      if (n) edges.push(`<line x1="${p.x}" y1="${p.y}" x2="${n.x}" y2="${n.y}" stroke="${dim ? "#151c24" : "#223040"}" stroke-width="1"/>`);
    });
  });
  const pillarCircles = pillars.map((p) => {
    const on = pillarFilter === p.id || (selected && p.axes.includes(selected));
    const dim = pillarFilter && pillarFilter !== p.id;
    return `<g class="node hub" tabindex="0" data-pillar="${esc(p.id)}">\n      <circle cx="${p.x}" cy="${p.y}" r="28" fill="${on ? "#243044" : "#182230"}" stroke="${on ? "#d4b15f" : "#3a4d3a"}" opacity="${dim ? 0.35 : 1}"/>\n      <text x="${p.x}" y="${p.y + 4}" text-anchor="middle">${esc(p.title)}</text>\n      <title>${esc(p.title)} \u2014 click to filter the tape</title>\n    </g>`;
  }).join("");
  const leaves = nodes.map((n) => {
    const a = axisOf(n.name);
    const on = measuredOf(a);
    const dim = pillarFilter && pillarFilter !== n.pillar;
    const tie = a?.axis === "jail" && a?.separation === "TIE";
    const fill = on ? (tie ? "#2a2418" : "#163427") : "#1a222c";
    const stroke = selected === n.name ? "#d4b15f" : (tie ? "#d4a24a" : (on ? "#3dbe8c" : "#5a6876"));
    const label = n.name.replace("machinery-conformity", "machinery").replace("provenance-controls", "prov-ctrl").replace("regulatory-framework", "reg-fw").replace("distribution-integrity", "distrib").replace("reserve-attestation", "reserve").replace("custody-disclosure", "custody").replace("humanoid-labour-index", "humanoid").replace("human-labour-index", "labour").replace("ai-economy-index", "economy").replace("detector-interop", "detectors").replace("art5-safeguard", "art.5");
    const tip = a
      ? `${a.axis} \u2014 ${measuredOf(a) ? (tie ? "MEASURED \u00b7 TIE \u00b7 floor" : "MEASURED") : "empty"}${a.leader ? ` \u00b7 ${a.leader}` : ""}`
      : n.name;
    return `<g class="node" tabindex="0" data-axis="${esc(n.name)}" opacity="${dim ? 0.28 : 1}">\n      <circle cx="${n.x}" cy="${n.y}" r="${selected === n.name ? 18 : 16}" fill="${fill}" stroke="${stroke}" stroke-width="${selected === n.name ? 2 : 1}"/>\n      <text x="${n.x}" y="${n.y + 28}" text-anchor="middle">${esc(label)}</text>\n      <title>${esc(tip)}</title>\n    </g>`;
  }).join("");
  document.getElementById("graph").innerHTML =
    `<svg viewBox="0 0 ${W} ${H}" role="group" aria-label="GSPC ontology \u2014 five pillars, twenty-two axes">\n      ${edges.join("")}\n      <g class="hub">\n        <circle cx="${cx}" cy="${cy}" r="42" fill="#182230" stroke="#d4b15f" stroke-width="1.6"/>\n        <text x="${cx}" y="${cy + 4}" text-anchor="middle">GSPC</text>\n        <title>Governance \u00b7 Safety \u00b7 Provenance \u00b7 Continuity \u00b7 Markets</title>\n      </g>\n      ${pillarCircles}\n      ${leaves}\n    </svg>`;
  document.querySelectorAll("#graph [data-axis]").forEach((g) => {
    const open = () => openAxis(g.getAttribute("data-axis"));
    g.onclick = open;
    g.onkeydown = (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open(); } };
  });
  document.querySelectorAll("#graph [data-pillar]").forEach((g) => {
    const toggle = () => {
      const id = g.getAttribute("data-pillar");
      pillarFilter = pillarFilter === id ? null : id;
      renderLegend();
      renderGraph();
      renderBoardTable();
    };
    g.onclick = (e) => { e.stopPropagation(); toggle(); };
    g.onkeydown = (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggle(); } };
  });
  renderLegend();
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
  history.replaceState(null, "", `#${encodeURIComponent(name)}`);
  renderGraph();
  renderBoardTable();
  const desk = document.getElementById("desk");
  desk.hidden = false;
  const on = measuredOf(a);
  document.getElementById("desk-kicker").textContent = on ? "Published finding" : "Published empty slot";
  document.getElementById("desk-h").textContent = a.axis;
  document.getElementById("desk-sub").textContent = [a.bench, a.task].filter(Boolean).join(" \u00b7 ");
  const fig = on ? (typeof a.accuracy === "number" ? pct(a.accuracy) : "facts \u00b7 no accuracy") : "no figure";
  const iv = on && Array.isArray(a.interval) ? `${pct(a.interval[0])} – ${pct(a.interval[1])}` : (on ? "withheld" : "\u2014");
  const sep = a.axis === "jail" && a.separation === "TIE"
    ? "TIE \u00b7 floor"
    : (a.separation || "\u2014");
  document.getElementById("quote").innerHTML = [
    [chip(a.status, a.separation), "Status"],
    [esc(fig), "Figure"],
    [esc(on && a.n != null ? a.n : "\u2014"), "n"],
    [esc(iv), "95% interval"],
    [esc(sep), "Separation"],
    [esc(on && a.leader ? a.leader : "\u2014"), "Leader"],
    [esc(on && typeof a.fleet_mean === "number" ? pct(a.fleet_mean) : "\u2014"), "Fleet mean"],
    [esc(on && typeof a.macro_f1 === "number" ? String(a.macro_f1) : "\u2014"), "Macro F1"],
  ].map(([v, k]) => `<div><b>${v}</b><span>${esc(k)}</span></div>`).join("");

  const finding = [
    ["Axis", esc(a.axis)],
    ["Family", esc(a.family || "\u2014")],
    ["Kind", esc(a.kind || "\u2014")],
    ["Instrument / task", esc(a.task || a.bench || "\u2014")],
    ["Leader", on ? esc(a.leader || "\u2014") : "\u2014"],
    ["n", on && a.n != null ? esc(String(a.n)) : "\u2014"],
    ["Figure", on ? esc(fig) : "\u2014"],
    ["95% interval", esc(iv)],
    ["Fleet mean", on && typeof a.fleet_mean === "number" ? esc(pct(a.fleet_mean)) : "\u2014"],
    ["Macro F1", on && typeof a.macro_f1 === "number" ? esc(String(a.macro_f1)) : "\u2014"],
    ["Separation", esc(sep)],
    ["McNemar p", on && a.separation_p != null ? esc(String(a.separation_p)) : "\u2014"],
    ["Unparsed rate", on && typeof a.unparsed_rate === "number" ? esc(pct(a.unparsed_rate)) : "\u2014"],
  ];
  if (on && typeof a.mean_harm === "number") finding.push(["Mean harm", esc(num(a.mean_harm))]);
  if (on && typeof a.cvar05_harm === "number") finding.push(["CVaR harm", esc(num(a.cvar05_harm))]);
  const bank = a.dataset_url
    ? `<a href="${esc(a.dataset_url)}" target="_blank" rel="noreferrer">${esc(a.dataset || a.dataset_url)}</a>`
    : esc(a.dataset || "\u2014");
  finding.push(["Bank", bank]);
  if (a.axis === "jail") {
    finding.push(["Note", "Measured floor. A TIE is not a scored arena door."]);
  }
  if (!on) {
    finding.push(["Note", "This slot is published empty. No measurement has been signed."]);
  }
  document.getElementById("find-table").innerHTML = rows(finding);

  const recs = cardsFor(name);
  if (!recs.length) {
    document.getElementById("rec-table").innerHTML =
      `<thead><tr><th>Record</th><th>State</th></tr></thead>` +
      `<tbody><tr><td colspan="2">${on ? "No compact cards listed for this axis yet. The cell on the board is still the finding." : "Empty slot \u2014 no signed compact cards."}</td></tr></tbody>`;
  } else {
    document.getElementById("rec-table").innerHTML =
      `<thead><tr><th>Card</th><th>When</th><th></th></tr></thead><tbody>` +
      recs.slice(0, 12).map((c) => {
        const url = c.card_url ? (c.card_url.startsWith("http") ? c.card_url : SITE + c.card_url) : VERIFY;
        const id = String(c.card || "").slice(0, 12);
        const ts = c.ts ? String(c.ts).replace("T", " ").slice(0, 19) : "\u2014";
        return `<tr><td>${esc(id)}\u2026</td><td>${esc(ts)}</td><td><a href="${esc(url)}" target="_blank" rel="noreferrer">open</a> \u00b7 <a href="${VERIFY}" target="_blank" rel="noreferrer">verify</a></td></tr>`;
      }).join("") +
      `<tr><td colspan="3">${recs.length} compact card(s) in the public index. They verify. They do not yet bind a subject or weight-manifest digest \u2014 signed legacy measurements, not Card v2 unique-lineage cells.</td></tr>` +
      `</tbody>`;
  }

  const honest = [];
  if (a.null_grammar) honest.push(["Null grammar", esc(a.null_grammar)]);
  if (a.n_note) honest.push(["n note", esc(a.n_note)]);
  if (a.dataset_note) honest.push(["Bank note", esc(a.dataset_note)]);
  limsFor(name).forEach((l, i) => honest.push([`Limitation ${i + 1}`, esc(l)]));
  corrsFor(name).slice(0, 6).forEach((c) => {
    honest.push([c.id || c.date || "Correction", esc(c.what_was_wrong || c.fix || "")]);
  });
  if (!honest.length) {
    honest.push(["On this axis", on
      ? "No extra limitation names this cell beyond the board-wide honesty notes below."
      : "The slot is empty. That fact is the honesty."]);
  }
  honest.push(["Lineage", "Public compact cards do not yet carry subject, weights, or weight-manifest digest. Card v2 immutable-lineage binding is the next gate."]);
  document.getElementById("honest-table").innerHTML = rows(honest);

  const fleet = document.getElementById("fleet");
  if (fleet) {
    const models = a.per_model && typeof a.per_model === "object" ? Object.entries(a.per_model) : [];
    if (models.length) {
      fleet.hidden = false;
      fleet.innerHTML = `<h3>Per-model cells on this axis</h3>\n        <table class="sheet">\n          <thead><tr><th>Model</th><th>n</th><th>Accuracy</th><th>Precision</th><th>Recall</th></tr></thead>\n          <tbody>${models.map(([m, r]) => {
            const acc = r.accuracy != null ? pct(r.accuracy) : (r.honesty_rate != null ? pct(r.honesty_rate) : "\u2014");
            return `<tr><td>${esc(m)}</td><td>${esc(r.n ?? "\u2014")}</td><td>${esc(acc)}</td><td>${esc(r.precision ?? "\u2014")}</td><td>${esc(r.recall ?? "\u2014")}</td></tr>`;
          }).join("")}</tbody>\n        </table>\n        <p class="fine">${esc(a.quotable_note || a.fleet || "Published per-model rows. A listing elsewhere is not this table.")}</p>`;
    } else {
      fleet.hidden = true;
      fleet.innerHTML = "";
    }
  }

  document.getElementById("desk-note").textContent = a.note || "";
  const links = [];
  if (a.dataset_url) links.push(`<a href="${esc(a.dataset_url)}" target="_blank" rel="noreferrer">Bank</a>`);
  else if (a.dataset) links.push(`<a href="https://huggingface.co/datasets/${esc(a.dataset)}" target="_blank" rel="noreferrer">Bank</a>`);
  links.push(`<a href="${API}?axis=${encodeURIComponent(a.axis)}" target="_blank" rel="noreferrer">GET /api/gspc?axis=${esc(a.axis)}</a>`);
  links.push(`<a href="${VERIFY}" target="_blank" rel="noreferrer">Verify a card</a>`);
  document.getElementById("desk-links").innerHTML = links.join("");
  desk.scrollIntoView({ block: "nearest", behavior: "smooth" });
}

function renderRead() {
  const el = document.getElementById("read-box");
  if (!el) return;
  el.innerHTML = READ.map((r) =>
    `<article class="panel"><strong>${esc(r.title)}</strong><p class="fine">${esc(r.body)}</p></article>`
  ).join("");
}

function renderEmpty() {
  const el = document.getElementById("empty-box");
  if (!el) return;
  const empty = (BOARD?.axes || []).filter((a) => !measuredOf(a));
  el.innerHTML = empty.map((a) => {
    const extra = EMPTY_NEXT[a.axis] || { next: a.note || "Published empty.", not: "An invented zero." };
    return `<article class="panel gap" data-axis="${esc(a.axis)}" tabindex="0">\n      <div class="top"><strong>${esc(a.axis)}</strong>${chip(a.status)}</div>\n      <p class="fine">${esc(a.task || a.note || "")}</p>\n      <p class="fine"><b>Next published step.</b> ${esc(extra.next)}</p>\n      <p class="fine"><b>What this is not.</b> ${esc(extra.not)}</p>\n    </article>`;
  }).join("");
  el.querySelectorAll("[data-axis]").forEach((n) => {
    const open = () => openAxis(n.getAttribute("data-axis"));
    n.onclick = open;
    n.onkeydown = (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open(); } };
  });
}

function renderHealth() {
  const el = document.getElementById("health-table");
  if (!el) return;
  const t = BOARD?.totals || {};
  const rowsH = [
    ["Declared slots", "GET /api/gspc totals.axes", String(t.axes ?? "\u2014")],
    ["Measured slots", "GET /api/gspc totals.measured_axes", String(t.measured_axes ?? "\u2014")],
    ["Empty slots", "GET /api/gspc totals.unmeasured_axes", String(t.unmeasured_axes ?? "\u2014")],
    ["Rows behind the board", "totals.items \u2014 sum of per-axis n, not models or cards", String(t.items ?? "\u2014")],
    ["Signed compact cards", "signed/card_index.json \u2014 verify, no lineage digest yet", String(INDEX.length || "\u2014")],
    ["Lineage-bound cards", "subject / weights / weight-manifest digest on the public cards", "0"],
    ["Verify pass", "/gspc-verify \u00b7 verify_card \u00b7 board snapshot", "open"],
    ["Corrections", "GET /api/corrections", String(CORRS.length || "\u2014")],
    ["Limitations", "GET /api/gspc limitations[]", String((BOARD?.limitations || []).length || "\u2014")],
    ["Jail floor", "MEASURED, separation TIE", "present"],
    ["Speed 0 census", "hub-queue n_site_pages \u00b7 paginated Hub walk", "ready, not yet completed"],
    ["Independent rerun", "Absent until one exists", "empty"],
    ["Issuer", BOARD?.issuer || "CSOAI Ltd", "UK 16939677"],
  ];
  el.innerHTML = `<thead><tr><th>Fact</th><th>Where you check it</th><th>State</th></tr></thead><tbody>` +
    rowsH.map((r) => `<tr><td>${esc(r[0])}</td><td>${esc(r[1])}</td><td>${esc(r[2])}</td></tr>`).join("") +
    `</tbody>`;
}

function renderCensusSites() {
  const el = document.getElementById("census-sites");
  if (!el) return;
  el.innerHTML = CENSUS_SITES.map((s) =>
    `<article class="panel">\n      <div class="top"><strong>${esc(s.title)}</strong>${chip(s.status)}</div>\n      <p class="fine">${esc(s.does)}</p>\n    </article>`
  ).join("");
}

async function renderQueue() {
  try {
    const q = await loadJson(QUEUE);
    document.getElementById("queue").textContent =
      `hub-queue n=${q.n} \u00b7 status_all=${q.status_all} \u00b7 n_measured=${q.n_measured} \u00b7 n_site_pages=${q.n_site_pages ?? 0} \u00b7 as_of=${q.as_of}\n` +
      `${q.filter || ""}\n${q.note || ""}`;
    const ruling = document.getElementById("census-ruling");
    if (ruling) {
      ruling.textContent =
        `${Number(q.n).toLocaleString("en-GB")} subjects DISCOVERED in the planted queue. Full Hub-scale paginated Speed 0 census is ready to run, not yet completed.`;
    }
    document.getElementById("census-counts").innerHTML = [
      [q.n, "DISCOVERED in queue", "UNMEASURED \u00b7 planted walk"],
      [q.n_measured, "MEASURED in this queue", "0 \u2014 no lineage-bound cell yet"],
      [q.n_site_pages ?? 0, "Paginated Hub pages", "0 \u2014 Speed 0 census not yet run"],
      [q.filter ? "downloads limit" : "\u2014", "How this queue was cut", q.filter || "see SUMMARY"],
    ].map(([v, k, n]) => `<div><b>${esc(v)}</b><span>${esc(k)} \u00b7 ${esc(n)}</span></div>`).join("");
    renderRuling(q.n);
  } catch (e) {
    document.getElementById("queue").textContent = "hub-queue SUMMARY unavailable \u2014 nothing fabricated. " + e;
  }
  try {
    const c = await loadJson(CATALOG);
    const n = c.counts || {};
    document.getElementById("catalog").textContent =
      `living-catalog ${n.datasets || 0} datasets \u00b7 ${n.spaces || 0} Spaces \u00b7 ${n.models || 0} models \u00b7 ${n.apis || 0} APIs \u00b7 generated ${c.generated || ""}`;
  } catch (e) {
    document.getElementById("catalog").textContent = "living-catalog unavailable \u2014 nothing fabricated. " + e;
  }
}

function renderDoors() {
  const el = document.getElementById("doors-box");
  if (!el) return;
  el.innerHTML = DOORS.map(([title, href, note]) =>
    `<article class="panel">\n      <div class="top"><strong><a href="${esc(href)}" target="_blank" rel="noreferrer">${esc(title)}</a></strong></div>\n      <p class="fine">${esc(note)}</p>\n    </article>`
  ).join("");
}

function renderHonesty() {
  const lims = BOARD?.limitations || [];
  document.getElementById("limits").innerHTML = lims.map((l) => `<li>${esc(l)}</li>`).join("");
  const tb = document.getElementById("corr-table");
  tb.innerHTML = `<thead><tr><th>Id</th><th>Date</th><th>What was wrong</th></tr></thead><tbody>` +
    (CORRS.length
      ? CORRS.slice(0, 16).map((c) =>
          `<tr><td>${esc(c.id || "")}</td><td>${esc(c.date || "")}</td><td>${esc(c.what_was_wrong || "")}</td></tr>`
        ).join("")
      : `<tr><td colspan="3">Corrections ledger unavailable \u2014 nothing fabricated.</td></tr>`) +
    `</tbody>`;
  const lanes = BOARD?.measured_in_lane || [];
  const names = lanes.map((x) => x.axis || x.bench).filter(Boolean).join(", ");
  const lane = names
    ? `In-lane, not on the public count: ${names}. Served for honesty \u2014 not added into totals.measured_axes.`
    : "In-lane work is not quoted as a public axis total.";
  document.getElementById("lane-note").textContent =
    `${lane} Compact cards verify and do not yet bind a subject or weight-manifest digest. Full Speed 0 pagination and Card v2 immutable-lineage binding are the next production gates.`;
}

function renderRuling(queueN) {
  const el = document.getElementById("ruling");
  if (!el || !BOARD) return;
  const t = BOARD.totals || {};
  const n = queueN != null ? Number(queueN).toLocaleString("en-GB") : "2,410";
  el.textContent =
    `Council of AI measures AI health. The live board contains ${t.measured_axes ?? 15} measured axes covered by a valid signed board snapshot. The planted Hub queue contains ${n} DISCOVERED, UNMEASURED subjects. Full Speed 0 pagination and Card v2 immutable-lineage binding are the next production gates. A rank is never sold.`;
}

function loadLookup() {
  try { return JSON.parse(localStorage.getItem(LOOKUP_KEY) || "[]"); } catch { return []; }
}
function saveLookup(rows) { localStorage.setItem(LOOKUP_KEY, JSON.stringify(rows)); }

function renderLookup() {
  const rows = loadLookup();
  const tb = document.querySelector("#watch-table tbody");
  if (!tb) return;
  tb.innerHTML = rows.map((r) =>
    `<tr><td>${esc(r.id)}</td><td>DISCOVERED</td><td>${esc(r.digest || "\u2014")}</td></tr>`
  ).join("") || `<tr><td colspan="3" class="fine">No ids on this desk yet. Paste owner/name \u2014 one per line.</td></tr>`;
}

function addLookup() {
  const ids = (document.getElementById("watch-draft").value || "")
    .split(/[\s,]+/).map((s) => s.trim()).filter((s) => s.includes("/"));
  if (!ids.length) {
    document.getElementById("watch-note").textContent = "Paste owner/name ids. A listing is DISCOVERED, never MEASURED.";
    return;
  }
  const rows = loadLookup();
  for (const id of ids) {
    if (!rows.some((r) => r.id === id)) rows.push({ id, digest: null });
  }
  saveLookup(rows);
  document.getElementById("watch-draft").value = "";
  document.getElementById("watch-note").textContent = `${ids.length} listing(s) on this desk. Local digest compare only \u2014 not a grade.`;
  renderLookup();
}

async function refreshLookup() {
  const rows = loadLookup();
  document.getElementById("watch-note").textContent = "Reading Hub API blobs=true \u2014 metadata only, no weight download.";
  for (const r of rows) {
    try {
      const d = await loadJson(`https://huggingface.co/api/models/${encodeURIComponent(r.id)}?blobs=true`);
      const shas = (d.siblings || []).map((s) => s.lfs && s.lfs.sha256).filter(Boolean);
      r.digest = shas[0] ? `lfs:${shas.length}` : "no-lfs";
    } catch {
      r.digest = "unresolvable";
    }
  }
  saveLookup(rows);
  renderLookup();
  document.getElementById("watch-note").textContent = "Digests refreshed. Still DISCOVERED. Not MEASURED.";
}

function bindChrome() {
  const q = document.getElementById("q");
  if (q) {
    q.addEventListener("input", () => {
      query = q.value;
      renderBoardTable();
    });
  }
  const add = document.getElementById("watch-add");
  const refresh = document.getElementById("watch-refresh");
  if (add) add.addEventListener("click", addLookup);
  if (refresh) refresh.addEventListener("click", refreshLookup);
  renderLookup();
}

async function boot() {
  renderRead();
  renderDoors();
  bindChrome();
  try {
    BOARD = await loadJson(API);
    renderRuling();
    renderTape(BOARD);
    renderGraph();
    renderBoardTable();
    renderEmpty();
    renderHealth();
    renderCensusSites();
    renderHonesty();
    const hash = decodeURIComponent((location.hash || "").replace(/^#/, ""));
    if (hash && axisOf(hash)) openAxis(hash);
  } catch (e) {
    document.getElementById("stamp").textContent = "The board could not be read.";
    document.getElementById("board-body").innerHTML =
      `<tr><td colspan="8" class="err">${esc(String(e))}</td></tr>`;
  }
  try {
    const idx = await loadJson(CARDS);
    INDEX = idx.cards || [];
    if (BOARD) renderTape(BOARD);
    renderHealth();
    if (selected) openAxis(selected);
  } catch {
    INDEX = [];
  }
  try {
    const corr = await loadJson(CORRECTIONS);
    CORRS = corr.corrections || corr.items || [];
    if (BOARD) {
      renderTape(BOARD);
      renderHealth();
      renderHonesty();
    }
    if (selected) openAxis(selected);
  } catch {
    CORRS = [];
  }
  renderQueue();
}

boot();
window.addEventListener("hashchange", () => {
  const hash = decodeURIComponent((location.hash || "").replace(/^#/, ""));
  if (hash && axisOf(hash)) openAxis(hash);
});
