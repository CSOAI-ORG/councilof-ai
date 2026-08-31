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
