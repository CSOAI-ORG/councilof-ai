#!/usr/bin/env node
/**
 * evidence-pack-generate.mjs — assemble SKU-2 (the "proof" product): given a SUBJECT and a
 * REGULATION (article-50 | dora | cra), gather the ALREADY-SIGNED cards relevant to that
 * obligation and wrap them in an OSCAL 1.1.0 assessment-results file — the auditor-legible
 * bundle that drops into a technical file / a bank's Register of Information / a TPRM folder.
 *
 * ── HARD HONESTY RULES (enforced structurally, not by good intentions) ────────────────────────
 * 1. REUSE, NEVER FABRICATE. Every observation stands behind a real public/cards/<sha16>.json
 *    that is already Ed25519-signed. A card that does not exist is never invented; if nothing
 *    matches, the pack is empty and the script says so (exit 3) rather than manufacturing a cell.
 * 2. NEVER LAPTOP-SIGN. This script assembles; it does NOT sign. The wrapper is emitted UNSIGNED.
 *    The evidence is the per-card sig_ed25519 (already on each card) + the published Merkle root;
 *    sealing the assembly itself is an owner action via the board-sign path, never from here.
 * 3. RELEVANT-TO, NEVER A DETERMINATION. Cards are attached as OSCAL `observations` (neutral
 *    evidence), NOT as `findings` with satisfied/not-satisfied. A signed measurement is not a
 *    pass/fail and this pack never asserts the subject is compliant. relation is always
 *    "relevant-to". The customer's auditor keeps the compliance call.
 * 4. DETERMINISTIC. No new Date(), no randomness. UUIDs are sha256-derived; last-modified is the
 *    newest card's own as_of, read OUT of the cards. Re-running on unchanged cards writes
 *    byte-identical output.
 * 5. COUNSEL GATE. Statutory obligation text + penalty magnitudes are working anchors from
 *    EXEC-A-REVENUE.md §4; each regulation carries counsel_confirmed and, where false, a note.
 *    DORA and CRA are NOT yet in the axis↔regulator crosswalk — flagged, not hidden.
 *
 * Usage:
 *   node scripts/evidence-pack-generate.mjs --subject "Anthropic Claude" --regulation dora
 *   node scripts/evidence-pack-generate.mjs --subject "..." --regulation article-50 --out <dir>
 *   node scripts/evidence-pack-generate.mjs --selftest      (no network, no facilitator, no signing)
 *
 * Exit: 0 ok · 1 bad usage · 2 cannot run (missing cards dir) · 3 no matching signed cards.
 */
import { readFileSync, readdirSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = join(HERE, "..");
const CARDS_DIR_DEFAULT = join(REPO, "public/cards");
const NS = "https://councilof.ai/ns/gspc";

// ── regulation config — grounded in EXEC-A-REVENUE.md §4 + client/src/data/regulator-crosswalk.json
const REGULATIONS = {
  "article-50": {
    control_id: "EU-AI-ACT-50",
    title: "EU AI Act Article 50 — transparency & marking of AI-generated content",
    obligation: "Article 50 — provider transparency + synthetic-content marking (machine-readable & detectable)",
    regulator: "eu-ai-act",
    statutory_maximum:
      "up to €15,000,000 or 3% of worldwide annual turnover (EU AI Act Art. 99) — confirm exact figure with counsel",
    // Words that make a card relevant-to this obligation (matched in subject/surface/tags).
    keywords: ["article 50", "art50", "art 50", "disclosure", "transparency", "provenance", "c2pa", "watermark", "synthetic", "marking", "agent.disclosure"],
    existing_pack: "public/packs/eu-article-50",
    counsel_confirmed: true, // the provbench pack is already built and signed
    honesty: null,
  },
  dora: {
    control_id: "DORA-28-30",
    title: "DORA Art. 28-30 — ICT third-party risk oversight + Register of Information",
    obligation:
      "DORA Art. 28-30 — ICT third-party oversight of an AI vendor's public model; feeds the financial entity's Register of Information",
    regulator: "eu-dora",
    statutory_maximum: "DORA supervisory / enforcement measures — magnitude to be confirmed with counsel",
    keywords: ["vendor", "system-card", "model", "provider", "behaviour", "dora", "ict", "third-party", "gemini", "claude", "gpt", "frontier", "fedramp"],
    existing_pack: null,
    counsel_confirmed: false,
    honesty:
      "DORA is NOT yet in the axis↔regulator crosswalk. This wrapper maps SKU-1 signed measurement " +
      "cards of the PUBLIC model into a Register-of-Information-shaped OSCAL file. The Art.28-30 " +
      "obligation text and any penalty magnitude must be confirmed by regulatory counsel " +
      "(counters.json owner: Regulatory Counsel) before this appears in a customer quote.",
  },
  cra: {
    control_id: "CRA-ESSENTIAL",
    title: "Cyber Resilience Act — essential requirements + vulnerability handling for a product's AI digital element",
    obligation:
      "CRA essential requirements + vulnerability/drift evidence for the embedded public model (technical documentation)",
    regulator: "eu-cra",
    statutory_maximum: "CRA administrative fines — magnitude to be confirmed with counsel",
    keywords: ["vendor", "system-card", "model", "vulnerability", "drift", "behaviour", "cra", "digital element", "product", "frontier"],
    existing_pack: null,
    counsel_confirmed: false,
    honesty:
      "CRA is a PIPELINE product (longer cycle) and is NOT in the crosswalk. This wrapper assembles " +
      "behaviour + drift-recompute cards; the essential-requirements text and penalty magnitudes are " +
      "counsel-pending. Do not present as a conformity file.",
  },
};

// ── deterministic sha256-derived UUID (RFC-4122 v5 shape). No randomness, no clock.
function uuidFrom(name) {
  const h = createHash("sha256").update(name).digest("hex");
  const b = h.slice(0, 32).split("");
  b[12] = "5"; // version 5 (name-based)
  const variant = "89ab"[parseInt(h[16], 16) % 4];
  b[16] = variant;
  const s = b.join("");
  return `${s.slice(0, 8)}-${s.slice(8, 12)}-${s.slice(12, 16)}-${s.slice(16, 20)}-${s.slice(20, 32)}`;
}

function loadCards(dir) {
  if (!existsSync(dir)) return null;
  const out = [];
  for (const f of readdirSync(dir)) {
    if (!f.endsWith(".json")) continue;
    let w;
    try {
      w = JSON.parse(readFileSync(join(dir, f), "utf8"));
    } catch {
      continue;
    }
    const c = w && w.card;
    if (!c || !c.sha256 || !c.sig_ed25519) continue; // only real signed cards
    out.push({
      file: `public/cards/${f}`,
      sha256: c.sha256,
      subject: c.subject || "",
      surface: c.surface || "",
      tags: Array.isArray(c.tags) ? c.tags : [],
      did: c.did || null,
      sig_ed25519: c.sig_ed25519,
      source_urls: Array.isArray(c.source_urls) ? c.source_urls : [],
      unmeasured: Array.isArray(c.unmeasured) ? c.unmeasured : [],
      as_of: c.as_of || null,
      proof_len: Array.isArray(w.proof) ? w.proof.length : 0,
    });
  }
  // Deterministic order.
  out.sort((a, b) => a.sha256.localeCompare(b.sha256));
  return out;
}

function selectCards(cards, subject, reg) {
  const subj = (subject || "").trim().toLowerCase();
  return cards.filter((c) => {
    const hay = `${c.subject} ${c.surface} ${c.tags.join(" ")}`.toLowerCase();
    const subjectMatch = subj ? hay.includes(subj) : false;
    const regMatch = reg.keywords.some((k) => hay.includes(k));
    return subjectMatch && regMatch;
  });
}

// ── build the OSCAL 1.1.0 assessment-results wrapper (observations, never findings).
function buildOscal(subject, regKey, reg, selected, existingPackRef) {
  // last-modified = the newest selected card's own as_of (read OUT of the cards). Falls back to
  // null when no card carries one — never a clock.
  const stamps = selected.map((c) => c.as_of).filter(Boolean).sort();
  const lastModified = stamps.length ? stamps[stamps.length - 1] : null;
  const rootUuid = uuidFrom(`csoai:evidence-pack:${regKey}:${subject}`);

  const observations = selected.map((c) => ({
    uuid: uuidFrom(`obs:${regKey}:${c.sha256}`),
    title: `Signed measurement: ${c.subject}`,
    description:
      `Independent CSOAI measurement of "${c.subject}" (surface ${c.surface}), sealed as an ` +
      `Ed25519 card (sha256 ${c.sha256.slice(0, 16)}…) and anchored in the published Merkle root. ` +
      `RELEVANT-TO ${reg.obligation}. This is evidence, NOT a determination of compliance.`,
    methods: ["TEST"],
    props: [
      { name: "card-sha256", ns: NS, value: c.sha256 },
      { name: "card-file", ns: NS, value: c.file },
      { name: "sig-ed25519", ns: NS, value: c.sig_ed25519 },
      { name: "did", ns: NS, value: c.did || "" },
      { name: "relation", ns: NS, value: "relevant-to" },
      { name: "merkle-proof-depth", ns: NS, value: String(c.proof_len) },
      ...(c.unmeasured.length ? [{ name: "unmeasured", ns: NS, value: c.unmeasured.join(", ") }] : []),
    ],
    "relevant-evidence": [
      ...c.source_urls.map((u) => ({ href: u, description: "public source URL (recomputable input)" })),
      { href: `/api/proof?sha=${c.sha256}`, description: "free inclusion proof against the published root" },
      { href: `/${c.file.replace(/^public\//, "")}`, description: "the signed card wrapper" },
    ],
    collected: c.as_of || lastModified,
  }));

  return {
    "assessment-results": {
      uuid: rootUuid,
      metadata: {
        title: `CSOAI evidence bundle — ${reg.title} — subject: ${subject}`,
        "last-modified": lastModified,
        version: "1.0.0",
        "oscal-version": "1.1.0",
        props: [
          { name: "measurement-body", ns: NS, value: "CSOAI (CSOAI LTD, UK 16939677)" },
          { name: "regulator", ns: NS, value: reg.regulator },
          { name: "obligation", ns: NS, value: reg.obligation },
          { name: "statutory-maximum", ns: NS, value: reg.statutory_maximum },
          { name: "counsel-confirmed", ns: NS, value: String(reg.counsel_confirmed) },
          { name: "relation", ns: NS, value: "relevant-to" },
          { name: "assembly", ns: NS, value: "unsigned — evidence is per-card Ed25519 + published Merkle root" },
        ],
        roles: [{ id: "assessor", title: "Independent measurement body" }],
        parties: [
          {
            uuid: uuidFrom("party:csoai"),
            type: "organization",
            name: "CSOAI",
            remarks:
              "Independent AI-governance measurement body. Issues measurements and signed " +
              "attestations, never certificates of conformity.",
          },
        ],
      },
      "import-ap": {
        href: `#${regKey}-evidence-plan`,
        remarks:
          `Assessment plan: gather the signed cards relevant-to ${reg.obligation} for subject ` +
          `"${subject}"; attach each as a neutral observation with its recomputable inputs. No ` +
          `pass/fail is asserted.`,
      },
      results: [
        {
          uuid: uuidFrom(`result:${regKey}:${subject}`),
          title: `${reg.title} — evidence for "${subject}"`,
          description: `Signed measurements relevant-to ${reg.obligation}. Measurement, not certification.`,
          start: lastModified,
          end: lastModified,
          props: [
            { name: "observations-count", ns: NS, value: String(observations.length) },
            { name: "control-id", ns: NS, value: reg.control_id },
          ],
          "reviewed-controls": {
            "control-selections": [{ "include-controls": [{ "control-id": reg.control_id }] }],
          },
          observations,
        },
      ],
      // Assembly-level pointers that are NOT OSCAL-native, kept under a namespaced back-matter
      // resource so a strict OSCAL reader ignores them but a CSOAI reader sees the provenance.
      "back-matter": {
        resources: [
          {
            uuid: uuidFrom(`bm:${regKey}:${subject}`),
            title: "CSOAI evidence-pack provenance",
            props: [
              { name: "generator", ns: NS, value: "scripts/evidence-pack-generate.mjs" },
              { name: "verify", ns: NS, value: "/verify (free, no account) + /api/proof?sha=<64-hex>" },
              { name: "root", ns: NS, value: "/root.json (published Merkle root)" },
              ...(reg.honesty ? [{ name: "counsel-note", ns: NS, value: reg.honesty }] : []),
              ...(existingPackRef
                ? [{ name: "prebuilt-bundle", ns: NS, value: existingPackRef }]
                : []),
            ],
          },
        ],
      },
    },
  };
}

function buildManifest(subject, regKey, reg, selected, oscalFile, existingPackRef) {
  return {
    schema: "csoai.evidence-pack/0.1",
    subject,
    regulation: regKey,
    control_id: reg.control_id,
    obligation: reg.obligation,
    regulator: reg.regulator,
    statutory_maximum: reg.statutory_maximum,
    counsel_confirmed: reg.counsel_confirmed,
    counsel_note: reg.honesty,
    relation: "relevant-to",
    assembly: {
      signed: false,
      why_unsigned:
        "This wrapper is an assembly of already-signed cards; it is NOT laptop-signed. The evidence " +
        "is each card's sig_ed25519 + the published Merkle root. Sealing the assembly is an owner " +
        "action via the board-sign path.",
      evidence_is: ["per-card Ed25519 (sig_ed25519)", "published Merkle root (/root.json)", "free /verify + /api/proof"],
    },
    oscal_file: oscalFile,
    prebuilt_bundle: existingPackRef,
    cards: selected.map((c) => ({
      sha256: c.sha256,
      subject: c.subject,
      surface: c.surface,
      file: c.file,
      sig_ed25519: c.sig_ed25519,
      as_of: c.as_of,
    })),
    card_count: selected.length,
    note: "Measurement, not certification. The subject's auditor keeps the compliance call. Recomputable end-to-end.",
  };
}

function generate({ subject, regulation, cardsDir, outDir }) {
  const reg = REGULATIONS[regulation];
  if (!reg) {
    console.error(`✗ unknown regulation '${regulation}'. One of: ${Object.keys(REGULATIONS).join(", ")}`);
    return { code: 1 };
  }
  const cards = loadCards(cardsDir);
  if (cards == null) {
    console.error(`✗ cards dir not found: ${cardsDir}`);
    return { code: 2 };
  }
  const existingPackRef =
    reg.existing_pack && existsSync(join(REPO, reg.existing_pack)) ? reg.existing_pack : null;
  const selected = selectCards(cards, subject, reg);

  if (!selected.length && !existingPackRef) {
    console.error(
      `✗ no signed cards match subject "${subject}" for ${regulation}, and no pre-built bundle ` +
        `exists. Nothing is fabricated — the pack would be empty.\n` +
        `  Scanned ${cards.length} signed cards in ${cardsDir}.\n` +
        `  Try a subject that appears in a card, e.g.: ` +
        [...new Set(cards.map((c) => c.subject.split(" ")[0]))].slice(0, 8).join(", "),
    );
    return { code: 3 };
  }

  const slug = `${regulation}__${subject.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")}`.slice(0, 80);
  const dir = outDir || join(REPO, "evidence-packs", slug);
  mkdirSync(dir, { recursive: true });
  const oscalName = `${regulation}_oscal.json`;
  const oscal = buildOscal(subject, regulation, reg, selected, existingPackRef);
  const manifest = buildManifest(subject, regulation, reg, selected, oscalName, existingPackRef);
  writeFileSync(join(dir, oscalName), JSON.stringify(oscal, null, 2) + "\n");
  writeFileSync(join(dir, "manifest.json"), JSON.stringify(manifest, null, 2) + "\n");

  console.log(`✓ evidence pack written: ${dir}`);
  console.log(`  regulation : ${regulation} (${reg.control_id})`);
  console.log(`  subject    : ${subject}`);
  console.log(`  cards      : ${selected.length} signed observation(s)`);
  console.log(`  prebuilt   : ${existingPackRef || "(none)"}`);
  console.log(`  counsel    : ${reg.counsel_confirmed ? "confirmed" : "PENDING (counsel gate — see manifest.counsel_note)"}`);
  console.log(`  signed     : no (assembly of already-signed cards; never laptop-signed)`);
  return { code: 0, dir, selected, oscal, manifest };
}

// ── selftest: no network, no facilitator, no signing. Validates the generator + the existing pack.
function selftest() {
  let failures = 0;
  const check = (name, cond) => {
    console.log(`  ${cond ? "✓" : "✗"} ${name}`);
    if (!cond) failures++;
  };
  console.log("evidence-pack-generate --selftest");

  // 1. The already-built Article-50 OSCAL pack is well-formed 1.1.0 assessment-results.
  const a50 = join(REPO, "public/packs/eu-article-50/article50_oscal.json");
  if (existsSync(a50)) {
    const doc = JSON.parse(readFileSync(a50, "utf8"));
    const ar = doc["assessment-results"];
    check("article50 pack: assessment-results present", !!ar);
    check("article50 pack: oscal-version 1.1.0", ar?.metadata?.["oscal-version"] === "1.1.0");
    check("article50 pack: has results", Array.isArray(ar?.results) && ar.results.length > 0);
  } else {
    check("article50 pack present", false);
  }

  // 2. Generate a DORA pack from real vendor cards (subject present in the card set). Deterministic.
  const tmp = join(REPO, "evidence-packs", "_selftest_dora_claude");
  const r1 = generate({ subject: "Claude", regulation: "dora", cardsDir: CARDS_DIR_DEFAULT, outDir: tmp });
  check("dora/Claude: generated (exit 0)", r1.code === 0);
  check("dora/Claude: at least one signed card observation", (r1.selected || []).length > 0);
  if (r1.oscal) {
    const ar = r1.oscal["assessment-results"];
    check("dora pack: oscal-version 1.1.0", ar?.metadata?.["oscal-version"] === "1.1.0");
    const obs = ar?.results?.[0]?.observations || [];
    check("dora pack: every observation carries a real card sha256", obs.every((o) => o.props.some((p) => p.name === "card-sha256" && /^[0-9a-f]{64}$/.test(p.value))));
    check("dora pack: relation is relevant-to (never a determination)", obs.every((o) => o.props.some((p) => p.name === "relation" && p.value === "relevant-to")));
    check("dora pack: no OSCAL findings emitted (no satisfied/not-satisfied)", !ar?.results?.[0]?.findings);
    check("dora pack: counsel gate flagged (dora not counsel-confirmed)", r1.manifest.counsel_confirmed === false && !!r1.manifest.counsel_note);
    check("dora pack: assembly is unsigned (never laptop-signed)", r1.manifest.assembly.signed === false);
  }

  // 3. Determinism: regenerate and compare bytes.
  const r2 = generate({ subject: "Claude", regulation: "dora", cardsDir: CARDS_DIR_DEFAULT, outDir: tmp });
  check("dora/Claude: deterministic (byte-identical OSCAL on re-run)", JSON.stringify(r1.oscal) === JSON.stringify(r2.oscal));

  // 4. No-fabrication: a subject with no matching card and no prebuilt bundle yields exit 3, no pack.
  const r3 = generate({ subject: "zzz-nonexistent-subject-zzz", regulation: "cra", cardsDir: CARDS_DIR_DEFAULT, outDir: join(REPO, "evidence-packs", "_selftest_empty") });
  check("no-match: exits 3 and fabricates nothing", r3.code === 3);

  console.log(failures ? `\n✗ selftest: ${failures} failure(s)` : "\n✓ selftest: all checks passed");
  return failures ? 1 : 0;
}

// ── CLI
function parseArgs(argv) {
  const a = { cardsDir: CARDS_DIR_DEFAULT };
  for (let i = 0; i < argv.length; i++) {
    const k = argv[i];
    if (k === "--selftest") a.selftest = true;
    else if (k === "--subject") a.subject = argv[++i];
    else if (k === "--regulation") a.regulation = argv[++i];
    else if (k === "--cards") a.cardsDir = argv[++i];
    else if (k === "--out") a.outDir = argv[++i];
  }
  return a;
}

const args = parseArgs(process.argv.slice(2));
if (args.selftest) {
  process.exit(selftest());
}
if (!args.subject || !args.regulation) {
  console.error(
    "usage: evidence-pack-generate --subject \"<subject>\" --regulation <article-50|dora|cra> [--out <dir>]\n" +
      "       evidence-pack-generate --selftest",
  );
  process.exit(1);
}
process.exit(generate(args).code);
