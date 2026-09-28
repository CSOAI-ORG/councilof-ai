/**
 * Commissioned-measurement disclosure guard (DRAFT — HELD for the owner's terms).
 *
 * checkCommission(record) → string[] of violations; [] means the record may be published once the
 * owner has ruled. It enforces the claim-maintenance spec's §10 on every commissioned artifact:
 *   §10.3  the commission is disclosed ON THE ARTIFACT: commissioned_by is named, and conflicts[]
 *          names the payer ("Commissioned and paid for by <name>"); a relationship is named too.
 *   §10.2  payment is never contingent on content; the basis is per delivered work; no amount.
 *   §10.1  no word of verdict or motive about the subject, and nothing sold as a grade.
 *   owner  self-commissioning (the subject pays for its own record) is refused until the owner
 *          rules — the ruling is recorded on the record, never assumed.
 * Schema: measurement/commissioned/commission-kinds-v0.1.schema.json.
 */
export const KINDS = ["maintained_claim", "reproduction_on_request", "underwriter_evidence_pack", "disclosure_timeline"];

// Spec §10.1: words of verdict and of motive are both out of bounds (the subject is never accused).
const VERDICT = /\b(false|falsely|misleading|deceptive|deceiv\w*|exaggerat\w*|fraud\w*|dishonest\w*|lie|lied|lying|non-?compliant|violat\w*|unsafe|certif(?:y|ied|ication|icate))\b/i;
// A commission never buys a grade, a score, a rank or a certificate, and the record carries no money.
const SOLD_RESULT = /\b(grade[sd]?|scor(?:e|ed|es)|rank(?:ed|ing)?|rating|rated|badge|seal|pass(?:ed)?\s+(?:the\s+)?(?:test|check))\b/i;
const MONEY = /(?:£|\$|€)\s?\d|\b\d+(?:\.\d+)?\s?(?:usd|usdc|gbp|eur)\b|\bamount\b\s*[:=]/i;

const str = (v) => (typeof v === "string" ? v : "");

export function checkCommission(r) {
  const errs = [];
  if (!r || typeof r !== "object") return ["record is not an object"];
  if (r.schema !== "csoai.commission/0.1") errs.push("schema must be csoai.commission/0.1");
  if (!KINDS.includes(r.kind)) errs.push(`kind must be one of ${KINDS.join(", ")}`);

  // §10.3 — who paid, on the artifact.
  const payer = str(r.commissioned_by?.name).trim();
  if (payer.length < 2) errs.push("§10.3: commissioned_by.name is required — a commission whose payer cannot be named is not accepted");
  const rel = r.commissioned_by?.relationship_to_subject;
  if (!["IS_SUBJECT", "THIRD_PARTY_NO_RELATIONSHIP", "THIRD_PARTY_WITH_RELATIONSHIP"].includes(rel))
    errs.push("§10.3: commissioned_by.relationship_to_subject must be declared");
  const conflicts = Array.isArray(r.conflicts) ? r.conflicts.map(str) : [];
  if (!conflicts.length) errs.push("§10.3: conflicts[] is required on every commissioned artifact");
  if (payer && !conflicts.some((c) => c.toLowerCase().includes(payer.toLowerCase()) && /commission/i.test(c)))
    errs.push(`§10.3: conflicts[] must name the commission itself ("Commissioned and paid for by ${payer}")`);
  if (rel === "THIRD_PARTY_WITH_RELATIONSHIP") {
    const what = str(r.commissioned_by?.relationship).trim();
    if (!what) errs.push("§10.3: a payer with a relationship to the subject must name the relationship");
    else if (!conflicts.some((c) => c.toLowerCase().includes(what.toLowerCase()))) errs.push("§10.3: the payer's relationship to the subject must appear in conflicts[]");
  }
  if (r.disclosure?.commission_visible_on_artifact !== true) errs.push("§10.3: disclosure.commission_visible_on_artifact must be true — a policy page is not a disclosure");

  // Owner gate — self-commissioning.
  if (rel === "IS_SUBJECT" && !(r.owner_ruling && str(r.owner_ruling.ruling).trim()))
    errs.push("owner: self-commissioning (the subject pays for its own record) is HELD until the owner rules; no owner_ruling on the record");

  // §10.2 — payment.
  const p = r.payment || {};
  if (!["x402", "gbp_invoice"].includes(p.rail)) errs.push("§10.2: payment.rail must be x402 or gbp_invoice");
  if (p.basis !== "per_delivered_work") errs.push("§10.2: payment.basis must be per_delivered_work");
  if (p.contingent_on_content !== false) errs.push("§10.2: payment.contingent_on_content must be false");
  for (const k of Object.keys(p)) if (/amount|price|fee|usd|gbp/i.test(k)) errs.push(`no public price: payment.${k} must not exist on the record`);

  // §10.1 and "never a grade" — over every human-readable string the record publishes.
  const text = JSON.stringify({ deliverable: r.deliverable, conflicts: r.conflicts, subject: r.subject, notes: r.notes ?? null });
  const v = text.match(VERDICT);
  if (v) errs.push(`§10.1: a word of verdict or motive about the subject ("${v[0]}")`);
  const s = str(r.deliverable).match(SOLD_RESULT);
  if (s) errs.push(`never a grade: the deliverable offers "${s[0]}"`);
  if (MONEY.test(text)) errs.push("no public price: the record carries an amount");
  const never = Array.isArray(r.never) ? r.never : [];
  if (!never.includes("a grade, score, rank or certificate")) errs.push('never[] must include "a grade, score, rank or certificate"');
  if (!Array.isArray(r.states) || !r.states.length) errs.push("states[] must list what the artifact can return (UNMEASURED included where it can occur)");
  return errs;
}
