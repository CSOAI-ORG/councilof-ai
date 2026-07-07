// CSOAI Assess — EU AI Act risk-tier + control-gap assessment, SIGNED with the shared
// Ed25519 spine from a2a.js (one signing key across the whole app; no duplicate crypto).
// Mount in server.js:  import assess from "./assess.js"; app.use(assess);
//
// POST /api/assess  { system, purpose, domain, human_oversight?, logging?, ... }
//   -> { report_id, tier, verdict, gaps[], rationale, signed_payload, sig, pub, kid, alg }
// GET  /api/assess/key  -> the public key any /verify surface uses to check a report.

import express from "express";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { canon, signBytes, verifyBytes, KID, pubB64 } from "./a2a.js";

const LEAD_STORE = process.env.LEAD_STORE || path.join(process.cwd(), "leads.jsonl");

const router = express.Router();

// ---- EU AI Act risk classification (Annex III high-risk domains) ----
const HIGH_RISK_DOMAINS = new Set([
  "employment", "hiring", "recruitment", "credit", "creditworthiness", "finance",
  "education", "law_enforcement", "biometric", "migration", "justice",
  "critical_infrastructure", "essential_services", "insurance",
  "healthcare", "health", "medical", "medical_devices",
]);
const PROHIBITED_SIGNALS = [
  "social_scoring", "subliminal_manipulation", "emotion_recognition_workplace", "predictive_policing",
  // Art.5: real-time remote biometric identification in publicly accessible spaces (narrow exceptions only)
  "real-time remote biometric", "live facial recognition", "crowd surveillance", "mass surveillance",
];

// ---- WEDGE: legacy / COBOL mainframe detection (the thing no competitor bridges) ----
// If the assessed system touches a legacy core (COBOL/CICS/mainframe/AS400/ISO-20022/etc),
// AI actions on that core need Art.12 tamper-evident logging — CSOAI signs an OSCAL package
// over the legacy action. Detection only (pattern match); the full parse lives in cobol-bridge-mcp.
const LEGACY_SIGNALS = [
  "cobol", "mainframe", "cics", "ims", "as400", "as/400", "ibm i", "ibm-z", "zos", "z/os",
  "copybook", "iso20022", "iso 20022", "iso8583", "iso 8583", "fix protocol", "nacha", "acord", "hl7",
];
function detectLegacyCore(inp) {
  const hay = `${inp.system || ""} ${inp.purpose || ""} ${inp.domain || ""} ${inp.legacy_core || ""}`.toLowerCase();
  const hit = LEGACY_SIGNALS.find((s) => hay.includes(s));
  if (!hit) return null;
  return {
    cobol_core_detected: true,
    signal: hit,
    art12_finding: `Legacy core signal ("${hit}") detected — AI actions on this core require EU AI Act Art.12 ` +
      `tamper-evident logging. CSOAI bridges the legacy layer and signs an OSCAL audit package over the action; ` +
      `no competitor (Microsoft Purview / IBM watsonx / Credo) bridges COBOL/mainframe cores.`,
    next_step: "Provide the legacy source (e.g. COBOL program) for a full signed Art.12 bridge report.",
  };
}

// ---- control gaps checked (mapped to EU AI Act articles) ----
function findGaps(inp) {
  const gaps = [];
  if (inp.human_oversight === false) gaps.push("art14_human_oversight");
  if (inp.logging === false || inp.record_keeping === false) gaps.push("art12_logging");
  if (inp.risk_management === false) gaps.push("art9_risk_management");
  if (inp.data_governance === false) gaps.push("art10_data_governance");
  if (inp.transparency === false || inp.user_disclosure === false) gaps.push("art13_transparency");
  if (inp.accuracy_robustness === false) gaps.push("art15_accuracy_robustness");
  if (inp.technical_documentation === false) gaps.push("art11_technical_documentation");
  return gaps;
}

function classify(inp) {
  const hay = `${inp.system || ""} ${inp.purpose || ""} ${inp.domain || ""}`.toLowerCase();
  for (const p of PROHIBITED_SIGNALS) if (hay.includes(p.replace(/_/g, " ")) || hay.includes(p)) {
    return { tier: "prohibited", basis: "Article 5 prohibited practice signal" };
  }
  const domain = (inp.domain || "").toLowerCase();
  const domainHit = HIGH_RISK_DOMAINS.has(domain) || [...HIGH_RISK_DOMAINS].some((d) => hay.includes(d));
  if (domainHit) return { tier: "high_risk", basis: "Annex III high-risk domain" };
  if (hay.includes("chatbot") || hay.includes("generat") || inp.interacts_with_humans)
    return { tier: "limited_risk", basis: "Article 50 transparency obligations" };
  return { tier: "minimal_risk", basis: "no Annex III / Article 50 trigger" };
}

function assess(inp) {
  const { tier, basis } = classify(inp);
  const gaps = tier === "minimal_risk" ? [] : findGaps(inp);
  let verdict;
  if (tier === "prohibited") verdict = "prohibited";
  else if (tier === "minimal_risk") verdict = "pass";
  else verdict = gaps.length ? "remediate" : "pass";
  const score = tier === "minimal_risk" ? 1.0
    : Math.max(0, 1 - gaps.length / 7);
  const legacy = detectLegacyCore(inp);
  const out = {
    assessed_at: new Date().toISOString().slice(0, 10),
    system: inp.system || "", purpose: inp.purpose || "", domain: inp.domain || "",
    tier, verdict, basis,
    compliance_score: Number(score.toFixed(2)),
    gaps,
    rationale: tier === "minimal_risk"
      ? "No Annex III high-risk domain or Article 50 transparency trigger detected."
      : `Classified ${tier} (${basis}); ${gaps.length} control gap(s) vs EU AI Act obligations.`,
  };
  if (legacy) out.legacy_bridge = legacy;   // the WEDGE, folded into the signed report
  return out;
}

router.get("/api/assess/key", (_req, res) => res.json({ kid: KID, alg: "Ed25519", publicKey: pubB64 }));

router.post("/api/assess", express.json({ limit: "64kb" }), (req, res) => {
  const body = req.body || {};
  if (!body.system && !body.purpose) return res.status(400).json({ error: "system or purpose required" });
  const report = assess(body);
  const report_id = crypto.createHash("sha256").update(canon(report)).digest("hex").slice(0, 16);
  const signed = { ...report, report_id };
  const signed_payload = canon(signed);
  const sig = signBytes(Buffer.from(signed_payload));
  res.json({ ...signed, signed_payload, sig, pub: pubB64, kid: KID, alg: "Ed25519" });
});

// ---- A4: lead capture (the signup). Appends to JSONL; owner wires email/CRM later. ----
router.post("/api/lead", express.json({ limit: "16kb" }), (req, res) => {
  const { email, name, report_id, tier, verdict, wants } = req.body || {};
  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return res.status(400).json({ error: "valid email required" });
  const lead = {
    ts: new Date().toISOString(),
    email, name: name || "", report_id: report_id || "", tier: tier || "", verdict: verdict || "",
    wants: wants || "signed_report", ua: req.headers["user-agent"] || "",
  };
  try { fs.appendFileSync(LEAD_STORE, JSON.stringify(lead) + "\n"); }
  catch (e) { return res.status(500).json({ error: "could not record lead" }); }
  res.json({ ok: true, recorded: true, report_id: lead.report_id });
});

// ---- A3: verify a signed assessment report (paste report -> check sig against our key) ----
router.post("/api/assess/verify", express.json({ limit: "64kb" }), (req, res) => {
  const { signed_payload, sig, pub } = req.body || {};
  if (!signed_payload || !sig) return res.status(400).json({ error: "signed_payload and sig required" });
  const peerKeyB64 = pub || pubB64; // default: verify against our own gate key
  let valid = false, report = null;
  try {
    const peer = crypto.createPublicKey({ key: Buffer.from(peerKeyB64, "base64"), format: "der", type: "spki" });
    valid = verifyBytes(Buffer.from(signed_payload), sig, peer);
    report = JSON.parse(signed_payload);
  } catch { valid = false; }
  res.json({ valid, kid: KID, alg: "Ed25519", report: valid ? report : null });
});

export { assess, classify, findGaps };
export default router;
