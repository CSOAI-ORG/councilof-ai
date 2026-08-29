#!/usr/bin/env node
/**
 * Drive the shipped CRA register + runbook on disk.
 * Does not file to ENISA. Does not certify.
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const dir = dirname(fileURLToPath(import.meta.url));
const register = JSON.parse(readFileSync(join(dir, "REGISTER.json"), "utf8"));
const runbook = readFileSync(join(dir, "RUNBOOK.md"), "utf8");
const template = JSON.parse(readFileSync(join(dir, "candidates/TEMPLATE.json"), "utf8"));

if (register.not_a_certification !== true) throw new Error("register must refuse certification");
if (!Array.isArray(register.candidates)) throw new Error("candidates must be an array");
if (register.candidates.length !== 0) throw new Error("empty register must stay empty until a real candidate");
if (!runbook.includes("11 September 2026")) throw new Error("runbook missing Art. 14 date");
if (!runbook.includes("not a certificate")) throw new Error("runbook missing never-certificate");
if (!runbook.includes("Announce “we are CRA compliant”")) {
  throw new Error("runbook must forbid the CRA-compliant announcement");
}
if (!runbook.includes("No “passed CRA”")) {
  throw new Error("runbook must forbid passed-CRA language");
}
if (template.csirt.includes("CERT-UK is not automatic") === false) {
  throw new Error("template must not treat CERT-UK as the Art. 14 CSIRT");
}
if (template.filings.early_warning !== null) throw new Error("template must not pre-fill a filing");
console.log("incidents_ok register empty; runbook refuses certification");
