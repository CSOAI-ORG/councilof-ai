#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { verifyArtifact } from "../../v0.2/reference/claim-capture.mjs";
const HERE=dirname(fileURLToPath(import.meta.url));
const sha=b=>createHash("sha256").update(b).digest("hex");
const manifest=JSON.parse(readFileSync(resolve(HERE,"manifest.json"),"utf8"));
let bad=0;
for(const c of manifest.cases){const raw=readFileSync(resolve(HERE,c.file));const hash=sha(raw);const a=JSON.parse(raw);const got=verifyArtifact(a).ok?"PASS":"FAIL";const ok=hash===c.sha256&&got===c.expected;if(!ok)bad++;console.log(`${ok?"PASS":"FAIL"} ${c.id} expected=${c.expected} got=${got} sha256=${hash===c.sha256?"MATCH":"MISMATCH"}`)}
console.log(`Claim Maintenance v${manifest.spec_version} corpus: ${manifest.cases.length-bad}/${manifest.cases.length} expected outcomes reproduced. This is interoperability testing, not certification.`);
process.exit(bad?1:0);
