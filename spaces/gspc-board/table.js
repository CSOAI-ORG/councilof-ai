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
  ["Verify a card", "https://councilof.ai/gspc-verify", "Browser WebCrypto. sha256 · issuer · axis. Free."],
  ["Public MCP", "https://councilof.ai/mcp", "board_totals · get_axis · verify_card · list_cards."],
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
  ["HF collection", "https://huggingface.co/collections/csoai/gspc-board-verify-flywheel-queue-banks-6a92a75986947dfa9d5306b5", "Board · verify · flywheel · queue · banks."],
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
  return String(s ?? "").replace(/[&<>\"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[c]));
}

function pct(n) {
  return typeof n === "number" && Number.isFinite(n) ? `${Math.round(n * 1000) / 10}%` : "—";
}

function num(n, d = 4) {
  return typeof n === "number" && Number.isFinite(n) ? n.toFixed(d) : "—";
}

function chip(status, sep) {
  const u = String(status || "UNMEASURED").toUpperCase();
  const kind = u === "MEASURED" ? (sep === "TIE" ? "warn" : "ok") : "empty";
  return `<span class=\"chip ${kind}\">${esc(u)}</span>`;
}
