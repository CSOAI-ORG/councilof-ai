#!/usr/bin/env node
// persona-e2e.mjs — talk to the LIVE Sovereign as real region+role end users, score
// each answer, and surface weak spots for training. Read-only (does not change the
// brain — produces the training signal M4 can act on). Mirrors client/src/lib/sovAsk.ts.
//
// Scores per persona: on-topic (governance terms) · region-appropriate (right regime) ·
// clean (no persona-bleed/refusal) · substantive (length). Exit 1 if <70% clean+on-topic.

const GW = process.env.SOV_GW || "https://os.meok.ai/api";
const SYS =
  "You are the CSOAI Sovereign — the AI-governance and cybersecurity assistant inside the CSOAI Sovereign OS. " +
  "Answer strictly in that role: specific and practical, about AI governance, regulations (EU AI Act, NIST, ISO 42001, NIS2, DORA, GDPR), cybersecurity, or the user's system/scenario. " +
  "Do NOT role-play as a personal 'companion', do NOT describe yourself in poetic/emotional terms, do NOT mention other companies' products or personas, and do NOT refuse ordinary informational questions. " +
  "If a question is out of scope, briefly steer it back to AI governance. Keep it concise.";
const BAD = /(i['’]?m sorry[, ]|can['’]?t help with that|i cannot help|as an ai language model|companion|walks beside you|gentle prose|fellow travell?er|on your journey|hold space|dear friend|my friend|kindred|wander)/i;
const GOV = /(governance|EU AI Act|NIST|ISO ?42001|ISO ?27001|DORA|NIS2|GDPR|HIPAA|risk|compliance|framework|high.?risk|Annex|Article|attestation|Ed25519|sign|audit|regulat)/i;

const PERSONAS = [
  { id: "jp-bank", region: "Japan", q: "I'm the CISO at a bank in Tokyo deploying an AI credit-scoring model. What AI-governance rules apply to us?", expect: /(Japan|METI|MIC|AI Guidelines for Business|APPI|FSA)/i },
  { id: "eu-insurer", region: "EU/Germany", q: "We're an insurer in Germany rolling out an AI pricing model. What must we do under the EU AI Act?", expect: /(EU AI Act|high.?risk|Annex|DORA|conformity|GDPR)/i },
  { id: "us-hospital", region: "US", q: "I run compliance at a US hospital using an AI diagnostic tool. Which rules apply and what should we document?", expect: /(HIPAA|NIST|FDA|risk management|documentation)/i },
  { id: "kr-startup", region: "South Korea", q: "AI startup in Seoul — what does Korea's AI Basic Act mean for our product?", expect: /(Korea|AI Basic Act|PIPA|risk|transparency|ISO ?42001)/i },
  { id: "sg-fintech", region: "Singapore", q: "Fintech in Singapore with an AI loan model — how should we govern it?", expect: /(Singapore|MAS|FEAT|Model AI Governance|AI Verify|ISO ?42001)/i },
  { id: "dev-verify", region: "Global", q: "How do I make an AI system's decision verifiable and tamper-evident so an auditor can check it later?", expect: /(sign|Ed25519|attestation|hash|verif|Layer ?0|audit)/i },
];

async function ask(q) {
  const t0 = Date.now();
  try {
    const r = await fetch(GW + "/chat", { method: "POST", headers: { "content-type": "text/plain" }, body: JSON.stringify({ message: SYS + "\n\nUser question: " + q }) });
    const d = await r.json();
    return { text: String((d && d.response) || "").trim(), model: d && d.model, ms: Date.now() - t0 };
  } catch (e) { return { text: "", err: e.message, ms: Date.now() - t0 }; }
}

console.log(`\n# Sovereign persona test — live brain (${GW})\n`);
const rows = [];
for (const p of PERSONAS) {
  const a = await ask(p.q);
  const clean = !!a.text && !BAD.test(a.text) && a.model !== "idle" && a.text.length > 40;
  const onTopic = GOV.test(a.text);
  const regionOk = p.expect.test(a.text);
  const pass = clean && onTopic;
  rows.push({ ...p, clean, onTopic, regionOk, pass, ms: a.ms, snippet: a.text.slice(0, 90).replace(/\s+/g, " ") });
  console.log(`${pass ? "PASS" : "WEAK"} [${p.id}] clean=${clean} onTopic=${onTopic} region=${regionOk} ${a.ms}ms`);
  console.log(`   Q: ${p.q.slice(0, 70)}...`);
  console.log(`   A: ${a.text ? a.text.slice(0, 120).replace(/\s+/g, " ") + "…" : "(no answer / " + (a.err || a.model) + ")"}`);
}

const passN = rows.filter((r) => r.pass).length;
const regionN = rows.filter((r) => r.regionOk).length;
const weak = rows.filter((r) => !r.pass || !r.regionOk);
console.log(`\n=== ${passN}/${rows.length} clean+on-topic · ${regionN}/${rows.length} region-appropriate ===`);
if (weak.length) {
  console.log("\nWeak spots to train (hand to M4 for prompt/knowledge tuning):");
  weak.forEach((r) => console.log(`  - [${r.id}] ${!r.clean ? "persona-bleed/refusal " : ""}${!r.onTopic ? "off-topic " : ""}${!r.regionOk ? "missed " + r.region + " regime" : ""}`));
}
// Gate: clean+on-topic must hold for >=70%; region-appropriateness is a training signal (not a hard fail).
process.exit(passN / rows.length >= 0.7 ? 0 : 1);
