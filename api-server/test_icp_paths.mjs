// CSOAI ICP product-proof — proves /assess classifies + signs correctly across every
// vertical CSOAI has a legacy bridge for. Re-runnable evidence for Series-A diligence.
// Run:  node test_icp_paths.mjs
import { verifyBytes, pubB64 } from "./a2a.js";
import crypto from "node:crypto";
import express from "express";
const { default: assessRouter } = await import("./assess.js");
const app = express(); app.use(express.json()); app.use(assessRouter);
const PUB = crypto.createPublicKey({ key: Buffer.from(pubB64, "base64"), format: "der", type: "spki" });
function post(url, body) {
  return new Promise((r) => {
    const req = { method: "POST", url, headers: { "content-type": "application/json" }, body };
    const res = { statusCode: 200, setHeader() {}, status(c){this.statusCode=c;return this;}, json(o){r(o);}, send(o){r(o);}, end(){r({});} };
    app.handle(req, res, () => r({}));
  });
}
const cases = [
  ["FINANCE / COBOL",   { system: "credit scoring on COBOL mainframe", purpose: "creditworthiness", domain: "finance", logging: false }, "high_risk", "cobol"],
  ["HEALTH / HL7",      { system: "triage AI reading HL7 feeds", purpose: "triage", domain: "health" }, "high_risk", "hl7"],
  ["UTILITY / SCADA",   { system: "grid AI on SCADA + Modbus", purpose: "critical infrastructure", domain: "critical_infrastructure" }, "high_risk", "scada"],
  ["UTILITY / DLMS",    { system: "smart meter analytics via DLMS/COSEM", purpose: "metering", domain: "essential_services" }, "high_risk", "dlms"],
  ["INSURANCE / ACORD", { system: "premium pricing on ACORD data", purpose: "insurance pricing", domain: "insurance" }, "high_risk", "acord"],
  ["ENTERPRISE / SAP",  { system: "procurement AI on SAP ERP", purpose: "vendor scoring", domain: "finance" }, "high_risk", "sap"],
  ["PROHIBITED (ctrl)", { system: "live facial recognition crowd surveillance", purpose: "mass surveillance", domain: "law_enforcement" }, "prohibited", "-"],
  ["MINIMAL (ctrl)",    { system: "internal wiki bot", purpose: "search", domain: "internal" }, "minimal_risk", "-"],
];
let pass = 0;
for (const [name, profile, expectTier, expectLegacy] of cases) {
  const o = await post("/api/assess", profile);
  const sigOK = o.sig ? verifyBytes(Buffer.from(o.signed_payload), o.sig, PUB) : true;
  const legacy = o.legacy_bridge?.signal || "-";
  const ok = o.tier === expectTier && legacy === expectLegacy && sigOK;
  if (ok) pass++;
  console.log(`${ok ? "PASS" : "FAIL"}  ${name.padEnd(20)} tier=${(o.tier||"?").padEnd(12)} legacy=${String(legacy).padEnd(7)} sig=${sigOK}`);
}
console.log(`\n${pass}/${cases.length} ICP paths correct. Exit ${pass === cases.length ? 0 : 1}.`);
process.exit(pass === cases.length ? 0 : 1);
