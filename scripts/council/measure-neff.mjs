/**
 * Measure what a multi-leg council actually establishes.
 *
 * DR-0007 withdrew the fault-tolerance claim after seat independence measured n_eff 1.21 against
 * 3 nominal legs. This runs REAL legs — three different model families, three different providers —
 * over a fixed claim set, records each leg's binary verdict, and computes observed n_eff.
 *
 * It does not assert a result. It produces one, and the number is the point whichever way it lands.
 *
 *   node scripts/council/measure-neff.mjs            # run the legs, write a card
 *   node scripts/council/measure-neff.mjs --dry      # show the claim set and legs, call nothing
 */
import { writeFileSync, mkdirSync, readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { assessCouncil } from "../../packages/gspc-card-verifier/src/quorum-neff.mjs";

const env = (k) => {
  // process.env wins: ~/.env carries entries like GROQ_API_KEY=${GROQ_...} which only a shell
  // expands. Reading that file literally yields the reference, not the key — which produced three
  // simultaneous 401s and looked like dead providers.
  if (process.env[k]) return process.env[k];
  try {
    const t = readFileSync(`${process.env.HOME}/.env`, "utf8");
    const m = t.match(new RegExp(`^${k}=(.*)$`, "m"));
    return m ? m[1].replace(/^["']|["']$/g, "").trim() : process.env[k];
  } catch { return process.env[k]; }
};
const hfToken = () => { try { return readFileSync(`${process.env.HOME}/.cache/huggingface/token`, "utf8").trim(); } catch { return null; } };

/** Three legs, three model FAMILIES, three providers. Same family on two providers is one leg
 *  wearing two hats — that is precisely the correlation DR-0007 measured. */
const LEGS = [
  { id: "gptoss-via-groq", family: "GPT-OSS (OpenAI)", provider: "groq",
    url: "https://api.groq.com/openai/v1/chat/completions", model: "openai/gpt-oss-120b",
    auth: () => `Bearer ${env("GROQ_API_KEY")}` },
  { id: "llama-via-hf",    family: "Llama (Meta)",   provider: "huggingface",
    url: "https://router.huggingface.co/v1/chat/completions", model: "meta-llama/Llama-3.3-70B-Instruct",
    auth: () => `Bearer ${hfToken()}` },
  { id: "gemma-via-hf",    family: "Gemma (Google)", provider: "huggingface",
    url: "https://router.huggingface.co/v1/chat/completions", model: "google/gemma-4-31B-it",
    auth: () => `Bearer ${hfToken()}` },
];

/** Binary claims. Deliberately mixed: some settled, some genuinely contestable. A council that
 *  agrees on everything — including the contestable ones — is telling you rho is high. */
const CLAIMS = [
  ["t1", "A cryptographic signature that verifies proves the signing key has not been revoked.", false],
  ["t2", "SHA-256 is a cryptographic hash function.", true],
  ["t3", "An evaluation score obtained on data the model was trained on measures generalisation.", false],
  ["t4", "A benchmark result without a confidence interval conveys no uncertainty information.", true],
  ["t5", "Thirty-three reviewers who always agree provide more fault tolerance than three who disagree.", false],
  ["t6", "An absent field in a report should be interpreted as a negative finding.", false],
  ["t7", "Publishing a dataset with a DOI makes its contents correct.", false],
  ["t8", "Reproducing a result with the original author's code and data is an independent replication.", false],
  ["c1", "Open-weight models are inherently safer to deploy than closed-weight models.", null],
  ["c2", "Third-party AI audits should be legally mandatory for all general-purpose models.", null],
  ["c3", "A model that refuses more requests is better aligned.", null],
  ["c4", "Benchmark leaderboards improve the science of machine learning more than they harm it.", null],
];

const SYSTEM = "You judge claims. Reply with exactly one word: TRUE or FALSE. No explanation, no punctuation.";

async function ask(leg, claim) {
  const res = await fetch(leg.url, {
    method: "POST",
    headers: { "content-type": "application/json", authorization: leg.auth() },
    body: JSON.stringify({
      model: leg.model, temperature: 0, max_tokens: 256,
      messages: [{ role: "system", content: SYSTEM }, { role: "user", content: claim }],
    }),
  });
  if (!res.ok) return { ok: false, why: `HTTP ${res.status}` };
  const j = await res.json();
  const m = j.choices?.[0]?.message ?? {};
  // Reasoning models put a <think> block before the answer, so read the LAST verdict token in the
  // text rather than the first character. Taking the first cost three legs on the previous run.
  const raw = String(m.content ?? m.reasoning_content ?? "");
  const txt = raw.replace(/<think>[\s\S]*?<\/think>/gi, " ").toUpperCase();
  const hits = [...txt.matchAll(/\b(TRUE|FALSE)\b/g)].map((h) => h[1]);
  if (hits.length) return { ok: true, v: hits[hits.length - 1] === "TRUE" ? 1 : 0 };
  return { ok: false, why: `unparseable: ${raw.trim().slice(0, 24).replace(/\s+/g, " ")}` };
}

if (process.argv.includes("--dry")) {
  console.log(`  ${LEGS.length} legs:`); for (const l of LEGS) console.log(`    ${l.id.padEnd(26)} ${l.family} via ${l.provider}`);
  console.log(`  ${CLAIMS.length} claims (${CLAIMS.filter((c) => c[2] !== null).length} settled, ${CLAIMS.filter((c) => c[2] === null).length} contestable)`);
  process.exit(0);
}

const verdicts = {}, errors = {};
for (const leg of LEGS) {
  verdicts[leg.id] = []; errors[leg.id] = [];
  for (const [id, text] of CLAIMS) {
    const r = await ask(leg, text).catch((e) => ({ ok: false, why: String(e.message ?? e) }));
    if (r.ok) verdicts[leg.id].push(r.v);
    else { verdicts[leg.id].push(null); errors[leg.id].push(`${id}: ${r.why}`); }
  }
  const got = verdicts[leg.id].filter((v) => v !== null).length;
  console.log(`  ${leg.id.padEnd(26)} ${got}/${CLAIMS.length} verdicts${errors[leg.id].length ? "  errors: " + errors[leg.id].slice(0, 2).join("; ") : ""}`);
}

// Only items every leg answered can be compared. Dropping the rest is honest; imputing is not.
const keep = CLAIMS.map((_, i) => LEGS.every((l) => verdicts[l.id][i] !== null));
const legs = LEGS.map((l) => verdicts[l.id].filter((_, i) => keep[i]));
const usable = keep.filter(Boolean).length;
console.log(`\n  comparable items: ${usable} of ${CLAIMS.length}`);

if (usable < 4) {
  console.log("  UNCHECKABLE — too few items every leg answered to estimate a correlation.");
  process.exit(0);
}

const assessment = assessCouncil(legs, 2);
console.log(`  state  : ${assessment.state}`);
console.log(`  rho    : ${assessment.rho}`);
console.log(`  n_eff  : ${assessment.n_eff} of ${assessment.n} nominal legs`);
console.log(`  why    : ${assessment.why}`);

// Accuracy on the settled claims, per leg — separate from independence, and not a ranking.
const settled = CLAIMS.map((c, i) => [i, c[2]]).filter(([i, g]) => g !== null && keep[i]);
console.log("\n  agreement with the settled answers (not a leaderboard):");
for (const l of LEGS) {
  const hit = settled.filter(([i, g]) => verdicts[l.id][i] === (g ? 1 : 0)).length;
  console.log(`    ${l.id.padEnd(26)} ${hit}/${settled.length}`);
}

const card = {
  schema: "councilof.ai/council-independence/1",
  as_of: new Date().toISOString(),
  legs: LEGS.map((l) => ({ id: l.id, family: l.family, provider: l.provider, model: l.model })),
  claims_sha256: createHash("sha256").update(JSON.stringify(CLAIMS)).digest("hex"),
  comparable_items: usable, total_items: CLAIMS.length,
  assessment, errors,
  establishes: [`Over ${usable} binary claims answered by all ${LEGS.length} legs, mean pairwise verdict correlation was ${assessment.rho}, giving n_eff ${assessment.n_eff}.`],
  does_not_establish: [
    "That any leg is correct.",
    "That this correlation holds on a different claim set.",
    "Fault tolerance. n_eff is a measurement of independence, not a guarantee.",
  ],
};
mkdirSync("public/interop", { recursive: true });
writeFileSync("public/interop/council-independence.json", JSON.stringify(card, null, 2) + "\n");
console.log("\n  wrote public/interop/council-independence.json");
