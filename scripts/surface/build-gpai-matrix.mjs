#!/usr/bin/env node
/**
 * build-gpai-matrix.mjs — public/interop/gpai-matrix.json, the EU AI Act provision ×
 * estate-tooling grounding matrix behind /gpai. Follows the build-axis-pages.mjs pattern:
 * every value is read from artifacts on THIS commit, the only typed strings are the
 * estate's own tool catalog (what exists and where) and the status vocabulary, and
 * --check fails when the committed JSON is stale against this commit's artifacts.
 *
 * WHY. The estate says 417 frozen provisions and 26 crosswalk assets. GPAI-provider
 * duties (Reg (EU) 2024/1689 Arts 53–55, plus the Commission GPAI Code of Practice) are
 * the obligation class regulators ask about first. Before this matrix the answer lived
 * in prose pages that typed obligation lists by hand — the exact defect class this repo
 * keeps paying for (see build-axis-pages.mjs: hand-typed paragraphs going stale the day
 * the underlying data moves). HARD GROUNDING RULE: no article text, obligation wording
 * or coverage claim is invented here. A provision enters the matrix because a published
 * artifact carries its identifier; a label enters because an artifact carries the words;
 * a tool is "wired" to a provision only through an artifact reference this script can
 * point at.
 *
 * SOURCES (all read from the repo, hashed at build time into `grounded_in`):
 *   public/interop/regulatory-inventory-latest.json      pointer (schema, index_url, shas)
 *   public/interop/regulatory-inventory-2026-*.json      the dated inventory it selects
 *   public/interop/frozen-provision-hashes.json          the 417 provision ids + sha256s
 *   functions/api/_obligations.ts                        obligation registry (Art 50, Art 53)
 *   functions/api/regulation.ts                          deadline register rows (dates, statuses)
 *   client/src/data/enforcement.ts                       First-Fine Watch + deadline rows
 *   public/interop/gpai-art12-pact-iaw/…json             Art 12 ↔ GSPC informative mapping
 *   public/interop/art50-marking-posture-2026-09/…json   Art 50(2) stated-posture cards
 *   public/interop/art5-emotion-ai-2026-09/…json         Art 5(1)(f) product-quote cards
 *   public/.well-known/eu-ai-act-art71-database.json     Art 71 database probe state
 *   public/.well-known/eu-ai-act.json, eu-ai-act-gpai.json  discovery doors
 *   public/interop/gpai-signatory-2026-09/…json          GPAI Code signatory census
 *   public/interop/gpai-signatories-2026-09-05.json      the earlier census sweep
 *   public/interop/axis-doors-2026-09-22.json            Art 53(2) hook mention
 *
 * ARTICLE-REFERENCE PARSING. An "Art N" token is attributed to the EU AI Act only when
 * the row it sits in names the AI Act instrument AND the token is not itself the article
 * of a DIFFERENT cited instrument ("…Digital Omnibus Reg (EU) 2026/1744 Art 1(39)(b)"
 * is Article 1 of the Omnibus, never Article 1 of the AI Act). Article ranges ("Arts
 * 53–55") expand, capped at 10 and bounded by the Act's own 113 articles. Wording is
 * never copied out of the statutes — only numbers and the artifact's own labels.
 *
 * VERIFICATION. The corpus root is recomputed here (sha256 over id+sha concatenated in
 * provision_id order, the inventory's own root_algorithm) and the script exits 1 if it
 * does not reproduce — a matrix that cannot recompute its own grounding must not ship.
 *
 *   node scripts/surface/build-gpai-matrix.mjs          # writes public/interop/gpai-matrix.json
 *   node scripts/surface/build-gpai-matrix.mjs --check  # fails if the committed JSON is stale
 */
import { createHash } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");

const read = (p) => readFileSync(join(ROOT, p), "utf8");
const readJson = (p) => JSON.parse(read(p));
const sha256File = (p) => createHash("sha256").update(read(p)).digest("hex");

function fail(msg) {
  console.error(`✖ build-gpai-matrix: ${msg}`);
  process.exit(1);
}

// ---------------------------------------------------------------------------
// The estate's tool catalog. This is the ONLY typed surface: what tooling exists,
// where it lives, and what kind of thing it is. It carries no regulation content.
// hrefs are same-origin and checked against the built tree by link-gate.
// ---------------------------------------------------------------------------
const TOOLS = {
  regulationRegister: {
    tool: "Regulation deadline register (signed feed)",
    href: "/api/regulation",
    kind: "REGISTER",
    note: "GET /api/regulation — cited deadlines and statuses; dates are statements from the cited instrument, not a compliance decision.",
  },
  fineWatch: {
    tool: "First-Fine Watch (signed feed)",
    href: "/api/fines",
    kind: "WATCH",
    note: "GET /api/fines — systematic signed coverage of the public AI enforcement record; an unverified entry is stated UNMEASURED, never a zero.",
  },
  obligationRegistryArt50: {
    tool: "Evidence-bundle obligation record (counsel-confirmed)",
    href: "/api/evidence-bundle?obligation=article-50",
    kind: "OBLIGATION_REGISTRY",
    note: "Free obligation record; counsel_confirmed true; assembles an existing OSCAL pack at /packs/eu-article-50.",
  },
  obligationRegistryArt53: {
    tool: "Evidence-bundle obligation record (counsel review pending)",
    href: "/api/evidence-bundle?obligation=article-53",
    kind: "OBLIGATION_REGISTRY",
    note: "Free obligation record for Article 53; counsel_confirmed false; the record itself states the evidence is behavioural measurement mapped to documentation duties, never a conformity mark.",
  },
  art50Pane: {
    tool: "Article 50 verification services pane",
    href: "/art50",
    kind: "MEASUREMENT_PANE",
    note: "Marking-presence census, detector-interop bench and specimen ledger for Article 50 marking; dates derived live from the register.",
  },
  art50Pack: {
    tool: "Article 50 OSCAL evidence pack",
    href: "/packs/eu-article-50/article50_oscal.json",
    kind: "EVIDENCE_PACK",
    note: "Published OSCAL pack (with its Ed25519 sidecar signature) that the article-50 obligation record assembles against.",
  },
  art50Posture: {
    tool: "Art 50(2) stated-marking-posture cards",
    href: "/interop/art50-marking-posture-2026-09/index.json",
    kind: "CARD_PACK",
    note: "Stated vs detectable marking posture for three providers; stated posture located, detectable posture UNMEASURED (the pack's own honest_sentence).",
  },
  art50Recheck: {
    tool: "Art 50 re-check schedule",
    href: "/interop/art50-recheck-schedule-2026-10/schedule.json",
    kind: "CARD_PACK",
    note: "Dated re-check schedule for the Art 50 posture probes.",
  },
  art5Pack: {
    tool: "Art 5(1)(f) emotion-AI product-quote cards",
    href: "/interop/art5-emotion-ai-2026-09/index.json",
    kind: "CARD_PACK",
    note: "Product-page verbatim quotes beside the obligation text; PROBED only — no classification, no conclusion (the pack's own status).",
  },
  art71Probe: {
    tool: "Art 71 database probe record",
    href: "/.well-known/eu-ai-act-art71-database.json",
    kind: "PROBE_RECORD",
    note: "State UNVERIFIED_PROBED_NOT_FOUND: the upstream endpoint was looked for on a stated date and not located. Absent is not zero.",
  },
  art12Crosswalk: {
    tool: "GPAI Art.12 / EU AI Pact related-measures crosswalk",
    href: "/interop/gpai-art12-pact-iaw/gpai-art12-pact-gspc-crosswalk.json",
    kind: "CROSSWALK",
    note: "INFORMATIVE_MAPPING: lists GSPC axes that are related measures for Art.12 record-keeping. The mapping itself states it is not a legal determination, certification or compliance claim.",
  },
  gpaiEvidencePane: {
    tool: "GPAI evidence pack page",
    href: "/gpai-evidence",
    kind: "MEASUREMENT_PANE",
    note: "The existing_pack the article-53 obligation record points at.",
  },
  gspcVerify: {
    tool: "Signed-card verifier",
    href: "/gspc-verify",
    kind: "VERIFIER",
    note: "Free, loginless verification of any signed card published by this estate. Verify stays free forever.",
  },
  inventoryPointer: {
    tool: "Regulatory inventory pointer",
    href: "/interop/regulatory-inventory-latest.json",
    kind: "REGISTER",
    note: "Selects the stamped, OpenTimestamps-proved inventory whose derived-statement rows match the in-toto crosswalk index on this commit.",
  },
  frozenHashes: {
    tool: "Frozen provision hash manifest",
    href: "/interop/frozen-provision-hashes.json",
    kind: "REGISTER",
    note: "417 provision identifiers with SHA-256 content hashes and a recomputable aggregate corpus root; source bytes unresolved (the manifest's own limitation).",
  },
  signatoryCensus: {
    tool: "GPAI Code signatory census",
    href: "/interop/gpai-signatory-2026-09/index.json",
    kind: "CENSUS",
    note: "Name-presence on the European Commission GPAI Code public list at retrieval time. Not a legal list, not a compliance judgement; Council of AI is not a signatory.",
  },
  signatorySweep: {
    tool: "GPAI Code signatory sweep (Sept 2025 page)",
    href: "/interop/gpai-signatories-2026-09-05.json",
    kind: "CENSUS",
    note: "Name-presence in the official page's text at retrieval time; not a claim of signed commitments.",
  },
  gpaiDoor: {
    tool: "GPAI discovery door",
    href: "/.well-known/eu-ai-act-gpai.json",
    kind: "DISCOVERY_DOOR",
    note: "Layer-0 discovery document; asserts no measurement.",
  },
  euAiActDoor: {
    tool: "EU AI Act discovery door",
    href: "/.well-known/eu-ai-act.json",
    kind: "DISCOVERY_DOOR",
    note: "Discovery document only; measurement status UNMAPPED, axes_covered 0 — by its own lid.",
  },
  countdown: {
    tool: "Deadline countdown view",
    href: "/countdown",
    kind: "REGISTER",
    note: "Renders the deadline register.",
  },
  eastWest: {
    tool: "East–west multi-jurisdiction crosswalk",
    href: "/crosswalk/east-west-v1.json",
    kind: "CROSSWALK",
    note: "The only public multi-jurisdiction crosswalk counted in the inventory: four regimes.",
  },
};

// What each matrix status means. Typed vocabulary, same role as SEPARATION_MEANS in
// build-axis-pages.mjs. The assignment RULES are code below; a status is never a vibe.
const STATUS_VOCABULARY = {
  WIRED: "At least one artifact names the provision AND the estate serves a live tool for it whose own artifact carries a counsel-confirmed obligation record or an executed measurement pane. This is tooling that exists today — it is not a claim that the provision is satisfied.",
  PARTIAL: "The provision is named in estate artifacts and at least one served surface (register row, obligation record, informative crosswalk, probe record or card pack) touches it — but no counsel-confirmed obligation record and no executed measurement of the provision's own duty exists. Tracking, not measurement.",
  UNMEASURED: "The provision exists in the estate ONLY as a frozen identifier and SHA-256 in the hash manifest. No published artifact names it, no tooling touches it. UNMEASURED is a first-class answer, not a failure to count.",
};

// ---------------------------------------------------------------------------
// Article-reference parsing.
// ---------------------------------------------------------------------------
const AI_ACT_ARTICLES = 113; // the Act's article count; recitals are negative-ordinal ids
const ART_REF_RE = /Art(?:icle)?s?\.?\s*(\d{1,3})(?:\s*[–—-]\s*(\d{1,3}))?/g;
// A non-AI-Act instrument citation directly before an Art token means the token is that
// instrument's article, not ours: "Digital Omnibus Reg (EU) 2026/1744 Art 1(39)(b)".
const OTHER_INSTR_BEFORE = /(?:Reg|Dir|Directive|Regulation)\.?\s*\(EU\)\s*\d{4}\/(\d+)\s*(?:\([^)]{0,60}\))?\s*$/;

function articleRefsIn(text, { requireAiActContext = false } = {}) {
  const found = new Set();
  for (const m of text.matchAll(ART_REF_RE)) {
    const lo = Number(m[1]);
    const hi = m[2] ? Number(m[2]) : lo;
    if (!Number.isFinite(lo) || lo < 1 || lo > AI_ACT_ARTICLES) continue;
    if (hi < lo || hi > AI_ACT_ARTICLES || hi - lo > 10) continue;
    if (requireAiActContext) {
      const before = text.slice(Math.max(0, m.index - 70), m.index);
      const other = before.match(OTHER_INSTR_BEFORE);
      if (other && other[1] !== "1689") continue;
    }
    for (let n = lo; n <= hi; n++) found.add(n);
  }
  return [...found];
}

// ---------------------------------------------------------------------------
// Load the grounding artifacts.
// ---------------------------------------------------------------------------
const pointer = readJson("public/interop/regulatory-inventory-latest.json");
if (pointer?.schema !== "csoai.regulatory-inventory-pointer/1" || pointer?.kind !== "DISCOVERY_POINTER_ONLY") {
  fail("public/interop/regulatory-inventory-latest.json is not the expected DISCOVERY_POINTER_ONLY pointer — the inventory shape changed; update this script before trusting it.");
}
const inventoryPath = pointer.index_url.replace(/^\//, "public/").replace(/^public\/public\//, "public/");
if (!existsSync(join(ROOT, inventoryPath))) fail(`pointer index_url ${pointer.index_url} does not resolve in this tree`);
const inventory = readJson(inventoryPath);
const hashesPath = "public/interop/frozen-provision-hashes.json";
const hashes = readJson(hashesPath);
const anchors = hashes.anchors ?? {};

// Verify the aggregate corpus root recomputes (fail-closed). root_algorithm:
// sha256(concat(sorted(provision_id + provision_sha256))) — sorted by composite id.
const rootInput = Object.keys(anchors)
  .sort()
  .map((id) => id + anchors[id])
  .join("");
const rootRecomputed = createHash("sha256").update(rootInput).digest("hex");
const expectedRoot = inventory?.frozen_provisions?.corpus_root;
if (rootRecomputed !== expectedRoot) {
  fail(`corpus root does not recompute: manifest sha256=${rootRecomputed} vs inventory frozen_provisions.corpus_root=${expectedRoot}`);
}
const anchorIds = Object.keys(anchors);
if (anchorIds.length !== inventory?.frozen_provisions?.value) {
  fail(`anchor count ${anchorIds.length} != inventory frozen_provisions.value ${inventory?.frozen_provisions?.value}`);
}

const CELEX = "32024R1689";
const aiActIds = anchorIds
  .filter((id) => id.startsWith(`${CELEX}:`))
  .sort((a, b) => Number(a.split(":")[1]) - Number(b.split(":")[1]));
const instrumentCount = inventory?.frozen_provisions?.instruments?.["EU AI Act"];
if (typeof instrumentCount !== "number" || aiActIds.length !== instrumentCount) {
  fail(`inventory instruments["EU AI Act"] says ${instrumentCount} but the hash manifest carries ${aiActIds.length} ${CELEX} identifiers`);
}

// ---------------------------------------------------------------------------
// Parse the served surfaces for EU-AI-Act article references.
// ---------------------------------------------------------------------------
// 1. functions/api/regulation.ts — deadline register rows naming the EU AI Act.
const regulationSrc = read("functions/api/regulation.ts");
const ROW_RE =
  /\{\s*date:\s*"([^"]+)",\s*instrument:\s*"([^"]+)",\s*what:\s*"((?:[^"\\]|\\.)*)",\s*basis:\s"((?:[^"\\]|\\.)*)",\s*status:\s*"([^"]+)",\s*penalty_exposure:\s"((?:[^"\\]|\\.)*)"/g;
const registerRows = [];
const registerArticles = new Map(); // article -> rows[]
for (const m of regulationSrc.matchAll(ROW_RE)) {
  const [, date, instrument, what, basis, status, penalty] = m;
  const rowText = `${instrument} ${basis}`;
  if (!/EU AI Act|2024\/1689/.test(rowText)) continue;
  // instrument + what sit inside a row that names the AI Act; basis + penalty may cite
  // OTHER instruments (amendments), so their Art tokens need local AI-Act context.
  const articles = [
    ...articleRefsIn(`${instrument} ${what}`),
    ...articleRefsIn(`${basis} ${penalty}`, { requireAiActContext: true }),
  ];
  const row = { date, instrument, what, basis, status, articles };
  registerRows.push(row);
  for (const art of articles) {
    if (!registerArticles.has(art)) registerArticles.set(art, []);
    registerArticles.get(art).push(row);
  }
}
const euAiActRowCount = registerRows.length;

// 2. client/src/data/enforcement.ts — deadline + fine-watch rows.
const enforcementSrc = read("client/src/data/enforcement.ts");
const enforcementArticles = new Map();
const EN_ROW_RE = /\{\s*name:\s*"([^"]+)",\s*date:\s*"([^"]+)",\s*note:\s*"([^"]+)"\s*\}/g;
for (const m of enforcementSrc.matchAll(EN_ROW_RE)) {
  const [, name, date, note] = m;
  if (!/EU AI Act|GPAI/.test(`${name} ${note}`)) continue;
  const arts = articleRefsIn(`${name} ${note}`);
  for (const art of arts) {
    if (!enforcementArticles.has(art)) enforcementArticles.set(art, []);
    enforcementArticles.get(art).push({ name, date, note });
  }
}
const FINE_RE = /\{\s*actor:\s*"([^"]+)",\s*jurisdiction:\s*"([^"]+)",\s*regime:\s*"([^"]+)",\s*amount:\s*"([^"]*)",\s*status:\s*"([^"]+)"\s*\}/g;
let gpaiFineWatchRow = null;
for (const m of enforcementSrc.matchAll(FINE_RE)) {
  const [, actor, jurisdiction, regime, , status] = m;
  if (/GPAI/.test(actor) && /EU AI Act/.test(regime)) {
    gpaiFineWatchRow = { actor, jurisdiction, regime, status, articles: articleRefsIn(actor) };
  }
}
if (gpaiFineWatchRow) {
  for (const art of gpaiFineWatchRow.articles) {
    if (!enforcementArticles.has(art)) enforcementArticles.set(art, []);
    enforcementArticles.get(art).push({ name: gpaiFineWatchRow.actor, date: null, note: `First-Fine Watch status: ${gpaiFineWatchRow.status}` });
  }
}

// 3. functions/api/_obligations.ts — the obligation registry (article-50, article-53).
//    Only the SERVED text of a record attributes articles: the listing endpoint returns
//    id/control_id/title and the record returns obligation/honesty — parse those fields,
//    not file comments.
const obligationsSrc = read("functions/api/_obligations.ts");
const obligationEntries = new Map(); // article -> entry
const obligationNamedArticles = new Map(); // article -> [{id, served_field}]
for (const id of ["article-50", "article-53"]) {
  const start = obligationsSrc.indexOf(`"${id}": {`);
  if (start < 0) continue;
  const end = obligationsSrc.indexOf("\n  },", start);
  const block = obligationsSrc.slice(start, end < 0 ? obligationsSrc.length : end);
  const field = (name) => {
    const m = block.match(new RegExp(`${name}:\\s*(true|false|null|"(?:[^"\\\\]|\\\\.)*"(?:\\s*\\+\\s*"(?:[^"\\\\]|\\\\.)*")*)`, "s"));
    if (!m) return undefined;
    const raw = m[1];
    if (raw === "true") return true;
    if (raw === "false") return false;
    if (raw === "null") return null;
    return raw.replace(/"\s*\+\s*"/g, "").slice(1, -1).replace(/\\"/g, '"');
  };
  const article = Number(id.split("-")[1]);
  const title = field("title");
  const obligation = field("obligation");
  obligationEntries.set(article, {
    id,
    control_id: field("control_id"),
    title,
    counsel_confirmed: field("counsel_confirmed"),
    existing_pack: field("existing_pack"),
    review_note: field("review_note"),
  });
  // Served text of this record names its own article (and any article the text cites).
  for (const art of articleRefsIn(`${title} ${obligation}`, { requireAiActContext: true })) {
    if (!obligationNamedArticles.has(art)) obligationNamedArticles.set(art, []);
    obligationNamedArticles.get(art).push({ id, article });
  }
}

// 4. The published card packs / probe records / crosswalks that name articles.
const namedBy = new Map(); // article -> [{artifact, toolKey, detail}]
function nameArticle(art, artifactPath, toolKey, detail) {
  if (!namedBy.has(art)) namedBy.set(art, []);
  namedBy.get(art).push({ artifact: artifactPath, toolKey, detail });
}

const art12Crosswalk = readJson("public/interop/gpai-art12-pact-iaw/gpai-art12-pact-gspc-crosswalk.json");
for (const st of art12Crosswalk.statutes ?? []) {
  const inst = st.instrument ?? "";
  const art = Number(st.article);
  if (/2024\/1689/.test(inst) && Number.isFinite(art) && art >= 1 && art <= AI_ACT_ARTICLES) {
    nameArticle(art, "public/interop/gpai-art12-pact-iaw/gpai-art12-pact-gspc-crosswalk.json", "art12Crosswalk", {
      label_from_artifact: st.label,
      related_gspc_axes: (art12Crosswalk.related_gspc_axes ?? []).map((a) => a.axis),
    });
  }
}

const art50PosturePath = "public/interop/art50-marking-posture-2026-09/index.json";
const art50Posture = readJson(art50PosturePath);
{
  const art = articleRefsIn(art50Posture?.obligation?.article ?? "");
  for (const a of art) {
    nameArticle(a, art50PosturePath, "art50Posture", {
      honest_sentence: art50Posture.honest_sentence,
      cards: (art50Posture.cards ?? []).length,
      probe_needed: (art50Posture.probe_needed ?? []).length,
    });
  }
}

const art50SchedulePath = "public/interop/art50-recheck-schedule-2026-10/schedule.json";
const art50ScheduleText = read(art50SchedulePath);
if (/2024\/1689|Art\.?\s*50|article-?50|art50/i.test(art50ScheduleText)) {
  for (const a of articleRefsIn(art50ScheduleText, { requireAiActContext: true })) {
    nameArticle(a, art50SchedulePath, "art50Recheck", {});
  }
}

const art5PackPath = "public/interop/art5-emotion-ai-2026-09/index.json";
const art5Pack = readJson(art5PackPath);
{
  const cite = art5Pack?.obligation_common?.cite ?? "";
  if (/2024\/1689/.test(cite)) {
    for (const a of articleRefsIn(cite)) {
      nameArticle(a, art5PackPath, "art5Pack", { status: art5Pack.status, n: art5Pack.n, honest_sentence: art5Pack.honest_sentence });
    }
  }
}

const art71Path = "public/.well-known/eu-ai-act-art71-database.json";
const art71 = readJson(art71Path);
{
  const basis = art71?.legal_basis ?? {};
  if (/2024\/1689/.test(basis.instrument ?? "")) {
    for (const a of articleRefsIn(basis.article ?? "")) {
      nameArticle(a, art71Path, "art71Probe", { state: art71.state });
    }
  }
}

const axisDoorsPath = "public/interop/axis-doors-2026-09-22.json";
const axisDoors = readJson(axisDoorsPath);
{
  const m = JSON.stringify(axisDoors).match(/EU AI Act Art\.?\s*(\d{1,3})\((\d)\)\s+([^"]*)/);
  if (m) {
    const art = Number(m[1]);
    if (art >= 1 && art <= AI_ACT_ARTICLES) {
      nameArticle(art, axisDoorsPath, null, {
        hook: m[0],
        caveat: "the doors file marks this hook as analyst judgement (market map), not measured coverage",
      });
    }
  }
}

// ---------------------------------------------------------------------------
// Per-provision status. The rule is code, not judgement:
//   WIRED    — obligation registry carries a counsel_confirmed:true record for the
//              article AND its existing_pack path exists in public/.
//   PARTIAL  — the article is named by any other estate artifact served today.
//   UNMEASURED — frozen identifier only.
// ---------------------------------------------------------------------------
function packExists(packPath) {
  if (!packPath || typeof packPath !== "string") return false;
  const rel = packPath.replace(/^\//, "public/");
  return existsSync(join(ROOT, rel)) || existsSync(join(ROOT, "client", rel));
}

function statusFor(article) {
  const ob = obligationEntries.get(article);
  if (ob && ob.counsel_confirmed === true && packExists(ob.existing_pack)) return "WIRED";
  if (ob || obligationNamedArticles.has(article) || registerArticles.has(article) || enforcementArticles.has(article) || namedBy.has(article)) return "PARTIAL";
  return "UNMEASURED";
}

function labelFor(article) {
  const sources = [];
  const ob = obligationEntries.get(article);
  if (ob?.title) sources.push({ from: "functions/api/_obligations.ts", label: ob.title });
  for (const n of namedBy.get(article) ?? []) {
    if (n.detail?.label_from_artifact) sources.push({ from: n.artifact, label: n.detail.label_from_artifact });
  }
  const regRows = registerArticles.get(article) ?? [];
  if (regRows.length) {
    sources.push({
      from: "functions/api/regulation.ts",
      label: `named in ${regRows.length} deadline-register row${regRows.length === 1 ? "" : "s"} (${regRows.map((r) => r.date).join(", ")})`,
    });
  }
  const enfRows = enforcementArticles.get(article) ?? [];
  if (enfRows.length) sources.push({ from: "client/src/data/enforcement.ts", label: `named in enforcement register row(s): ${enfRows.map((r) => r.name).join("; ")}` });
  const obNamed = obligationNamedArticles.get(article) ?? [];
  if (obNamed.length && !ob) {
    sources.push({ from: "functions/api/_obligations.ts", label: `named in the served text of obligation record(s) ${obNamed.map((o) => o.id).join(", ")}` });
  }
  return sources;
}

function toolingFor(article) {
  const tools = [];
  const seen = new Set();
  const add = (t) => {
    if (!t || seen.has(t.href)) return;
    seen.add(t.href);
    tools.push({ tool: t.tool, href: t.href, kind: t.kind, note: t.note });
  };
  const ob = obligationEntries.get(article);
  if (ob?.id === "article-50") {
    add(TOOLS.obligationRegistryArt50);
    add(TOOLS.art50Pack);
    add(TOOLS.art50Pane);
  }
  if (ob?.id === "article-53") {
    add(TOOLS.obligationRegistryArt53);
    add(TOOLS.gpaiEvidencePane);
  }
  if (registerArticles.has(article)) add(TOOLS.regulationRegister);
  if (enforcementArticles.has(article)) add(TOOLS.fineWatch);
  for (const n of namedBy.get(article) ?? []) if (n.toolKey && TOOLS[n.toolKey]) add(TOOLS[n.toolKey]);
  // Estate-wide verification is reachable for every provision a published artifact names.
  if (tools.length) add(TOOLS.gspcVerify);
  return tools;
}

const provisions = aiActIds.map((id) => {
  const article = Number(id.split(":")[1]);
  const status = statusFor(article);
  const labels = labelFor(article);
  const sha = anchors[id];
  const evidence = [`${hashesPath}#${id}=${sha}`];
  for (const n of namedBy.get(article) ?? []) evidence.push(`${n.artifact}=${sha256File(n.artifact)}`);
  if (obligationEntries.has(article) || obligationNamedArticles.has(article)) evidence.push(`functions/api/_obligations.ts=${sha256File("functions/api/_obligations.ts")}`);
  if (registerArticles.has(article)) evidence.push(`functions/api/regulation.ts=${sha256File("functions/api/regulation.ts")}`);
  if (enforcementArticles.has(article)) evidence.push(`client/src/data/enforcement.ts=${sha256File("client/src/data/enforcement.ts")}`);
  return {
    provision_id: id,
    instrument: "Regulation (EU) 2024/1689 (EU AI Act)",
    provision_class:
      article > 0
        ? "article identifier"
        : `negative-ordinal identifier — the published artifacts do not state what class of provision this id denotes (normaliser_version ${hashes.normaliser_version})`,
    title_or_label_from_artifacts: labels.length ? labels : null,
    tooling_wired: toolingFor(article),
    status,
    evidence,
  };
});

const counts = {
  total: provisions.length,
  WIRED: provisions.filter((p) => p.status === "WIRED").length,
  PARTIAL: provisions.filter((p) => p.status === "PARTIAL").length,
  UNMEASURED: provisions.filter((p) => p.status === "UNMEASURED").length,
};

// ---------------------------------------------------------------------------
// GPAI Code of Practice block — grounded only in the census artifacts.
// ---------------------------------------------------------------------------
const sigIndexPath = "public/interop/gpai-signatory-2026-09/index.json";
const sigManifestPath = "public/interop/gpai-signatory-2026-09/artefact-manifest.json";
const sigSweepPath = "public/interop/gpai-signatories-2026-09-05.json";
const sigIndex = readJson(sigIndexPath);
const sigManifest = readJson(sigManifestPath);
const sigSweep = readJson(sigSweepPath);
const codeOfPractice = {
  note: "The GPAI Code of Practice is a Commission voluntary instrument, not a provision of Regulation (EU) 2024/1689, so it earns no provision row. What the estate can check today is name-presence on the Commission's public list, published as the artifacts below.",
  artifacts: [
    { path: sigIndexPath, sha256: sha256File(sigIndexPath), as_of: sigIndex.as_of, measured: { n: sigIndex.n, n_measured: sigIndex.n_measured, n_appears: sigIndex.n_appears, n_does_not_appear: sigIndex.n_does_not_appear, n_partial: sigIndex.n_partial, full_signatory_names_observed: sigIndex.primary_source?.full_signatory_names_observed?.length ?? null } },
    { path: sigManifestPath, sha256: sha256File(sigManifestPath), method: sigManifest.method },
    { path: sigSweepPath, sha256: sha256File(sigSweepPath), detected_entities: sigSweep.detected_entities, principle: sigSweep.principle },
    { path: "public/interop/gpai-art12-pact-iaw/gpai-art12-pact-gspc-crosswalk.json", sha256: sha256File("public/interop/gpai-art12-pact-iaw/gpai-art12-pact-gspc-crosswalk.json"), as_of: art12Crosswalk.as_of, status: art12Crosswalk.status },
  ],
  honest_sentence: sigIndex.honest_sentence ?? null,
};

const groundedIn = [
  { path: "public/interop/regulatory-inventory-latest.json", sha256: sha256File("public/interop/regulatory-inventory-latest.json"), role: "discovery pointer (schema csoai.regulatory-inventory-pointer/1)" },
  { path: inventoryPath, sha256: sha256File(inventoryPath), role: "stamped regulatory inventory selected by the pointer" },
  { path: hashesPath, sha256: sha256File(hashesPath), role: "frozen provision identifiers + sha256 (evidence_source named by the inventory)" },
  { path: "functions/api/_obligations.ts", sha256: sha256File("functions/api/_obligations.ts"), role: "served obligation registry (article-50, article-53)" },
  { path: "functions/api/regulation.ts", sha256: sha256File("functions/api/regulation.ts"), role: "served deadline register (GET /api/regulation body)" },
  { path: "client/src/data/enforcement.ts", sha256: sha256File("client/src/data/enforcement.ts"), role: "First-Fine Watch + deadline register (shared with GET /api/fines)" },
  { path: "public/interop/gpai-art12-pact-iaw/gpai-art12-pact-gspc-crosswalk.json", sha256: sha256File("public/interop/gpai-art12-pact-iaw/gpai-art12-pact-gspc-crosswalk.json"), role: "inventory crosswalk asset gpai-art12-pact-iaw (INFORMATIVE_MAPPING)" },
  { path: art50PosturePath, sha256: sha256File(art50PosturePath), role: "Art 50(2) stated-posture card index" },
  { path: art50SchedulePath, sha256: sha256File(art50SchedulePath), role: "Art 50 re-check schedule" },
  { path: art5PackPath, sha256: sha256File(art5PackPath), role: "Art 5(1)(f) product-quote card index" },
  { path: art71Path, sha256: sha256File(art71Path), role: "Art 71 database probe record" },
  { path: "public/.well-known/eu-ai-act.json", sha256: sha256File("public/.well-known/eu-ai-act.json"), role: "EU AI Act discovery door" },
  { path: "public/.well-known/eu-ai-act-gpai.json", sha256: sha256File("public/.well-known/eu-ai-act-gpai.json"), role: "GPAI discovery door" },
  { path: sigIndexPath, sha256: sha256File(sigIndexPath), role: "GPAI Code signatory census index" },
  { path: sigManifestPath, sha256: sha256File(sigManifestPath), role: "GPAI Code census artefact manifest" },
  { path: sigSweepPath, sha256: sha256File(sigSweepPath), role: "GPAI Code signatory sweep (2026-09-05 page)" },
  { path: axisDoorsPath, sha256: sha256File(axisDoorsPath), role: "axis doors (Art 53(2) hook mention, analyst judgement)" },
];

const matrix = {
  schema: "csoai.gpai-matrix/0.1",
  kind: "DERIVED_GROUNDING_MATRIX",
  layer: "Council of AI — Global Regulation Atlas",
  title: "EU AI Act provision × estate-tooling grounding matrix (GPAI focus: Arts 53–55 and the Code of Practice)",
  as_of: inventory.versioned_at ?? null,
  measurement_not_certification: true,
  grounded_in: groundedIn,
  instrument_scope: {
    name: "EU AI Act",
    celex: CELEX,
    instrument_label: "Regulation (EU) 2024/1689",
    frozen_identifier_count: aiActIds.length,
    inventory_frozen_provision_counter: inventory?.frozen_provisions?.value,
    inventory_state: inventory?.frozen_provisions?.state,
    inventory_limitation: inventory?.frozen_provisions?.limitation ?? null,
    corpus_root_recomputed: true,
    corpus_root: expectedRoot,
    normaliser_version: hashes.normaliser_version,
    anchored_at: hashes.anchored_at,
    authority_watcher: hashes.watcher ?? null,
    deadline_register_rows_naming_this_instrument: euAiActRowCount,
  },
  status_vocabulary: STATUS_VOCABULARY,
  counts,
  truth_boundaries: [
    ...(inventory.truth_boundaries ?? []),
    "Every label in this matrix is quoted or summarised from the estate artifacts listed in grounded_in; where no artifact names a provision, the label is null and the row is UNMEASURED. No article text has been added from outside this commit.",
    "WIRED means tooling exists today; it never means the provision is satisfied. PARTIAL means tracked or mapped, not measured. UNMEASURED is a first-class answer.",
    "The GPAI Code of Practice census is name-presence on a Commission page at retrieval time; it is not a legal list of signatories and is not a compliance judgement.",
    "This matrix is generated by scripts/surface/build-gpai-matrix.mjs from this commit's artifacts; regenerate it rather than editing it.",
  ],
  provisions,
  gpai_code_of_practice: codeOfPractice,
  discovery_doors: [
    TOOLS.euAiActDoor,
    TOOLS.gpaiDoor,
    TOOLS.regulationRegister,
    TOOLS.fineWatch,
    TOOLS.obligationRegistryArt53,
    TOOLS.inventoryPointer,
    TOOLS.eastWest,
  ].map(({ tool, href, kind, note }) => ({ tool, href, kind, note })),
  regeneration: "node scripts/surface/build-gpai-matrix.mjs (add --check to fail on staleness)",
};

const OUT_REL = "public/interop/gpai-matrix.json";
const outJson = JSON.stringify(matrix, null, 2) + "\n";

const args = process.argv.slice(2);
const check = args.includes("--check");
const outPath = join(ROOT, OUT_REL);
const cur = existsSync(outPath) ? readFileSync(outPath, "utf8") : null;
if (cur === outJson) {
  console.log(`✓ gpai matrix: ${counts.total} provisions (WIRED ${counts.WIRED} · PARTIAL ${counts.PARTIAL} · UNMEASURED ${counts.UNMEASURED}) matches this commit's artifacts`);
} else if (check) {
  console.error("✖ gpai matrix is stale against this commit's artifacts — run node scripts/surface/build-gpai-matrix.mjs");
  process.exit(1);
} else {
  writeFileSync(outPath, outJson);
  console.log(`✓ gpai matrix: wrote ${relative(ROOT, outPath)} — ${counts.total} provisions (WIRED ${counts.WIRED} · PARTIAL ${counts.PARTIAL} · UNMEASURED ${counts.UNMEASURED})`);
}
