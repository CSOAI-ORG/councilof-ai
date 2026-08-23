/**
 * Shared deterministic assess engine — used by POST /api/assess and POST /api/assess/batch.
 * No model in the verdict path. Measurement, not certification.
 */

export const PROHIBITED: [string, RegExp][] = [
  ["social scoring (Art 5(1)(c))", /\b(social scor\w*|social credit|citizen scor\w*|trustworthiness scor\w*|scor\w*[^.]{0,30}(?:citizens?|people|individuals?)[^.]{0,30}(?:social )?behaviou?r|rank\w*[^.]{0,30}(?:citizens?|people)[^.]{0,30}behaviou?r)\b/i],
  ["real-time remote biometric ID for law enforcement (Art 5(1)(h))", /\b(real.?time\s+remote\s+biometric|remote\s+biometric\s+identif\w*|live\s+facial\s+recognition[^.]{0,40}(?:public|law enforcement|police))\b/i],
  ["emotion recognition at work/school (Art 5(1)(f))", /\bemotion(?:al)?\s+(?:recognition|detection|inference|analysis)\b[^.]{0,60}\b(work\w*|employ\w*|office|school|education|classroom|students?)/i],
  ["predictive policing from profiling (Art 5(1)(d))", /\b(predictive\s+polic\w*|predict\w*[^.]{0,30}(?:likelihood|risk)[^.]{0,30}(?:commit\w*|offend\w*|crim\w*))\b/i],
  ["exploiting vulnerabilities (Art 5(1)(b))", /\bexploit\w*[^.]{0,40}(vulnerab\w*|disabilit\w*|elderly|children|minors?)/i],
  ["biometric categorization of sensitive traits (Art 5(1)(g))", /\bbiometric\s+categor\w*/i],
  ["subliminal manipulation (Art 5(1)(a))", /\b(subliminal|manipulat\w* technique|deceptive technique)\b/i],
  ["untargeted facial scraping (Art 5(1)(e))", /\b(untargeted scrap\w*|scrap\w* (?:of )?facial|scrap\w*[^.]{0,30}facial (?:image|recognition))\b/i],
];

export const ANNEX_III: [string, RegExp][] = [
  ["biometric identification", /\b(biometric\w*|face (?:recognition|match\w*|identification|verification)|facial recognition|fingerprint|iris)\b/i],
  ["employment", /\b(employ\w*|recruit\w*|hiring|cvs?|candidates?|applicants?|hr\b|workers?|promotion)\b/i],
  ["education", /\b(education|exams?|students?|admissions?|grading|proctor\w*)\b/i],
  ["essential services", /\b(credit\w*|loan|insurance|benefits?|welfare|banking|emergency|triage)\b/i],
  ["law enforcement", /\b(police|law enforcement|criminal|predictive polic\w*|suspects?)\b/i],
  ["migration", /\b(migration|asylum|border|visa|immigration)\b/i],
  ["justice", /\b(justice|judicial|court|sentencing)\b/i],
  ["critical infrastructure", /\b(critical infrastructure|water|gas|electricity|grid|traffic)\b/i],
  ["medical", /\b(medical|patient|clinical|diagnos\w*|health\w*)\b/i],
];

export const CONTROLS = [
  ["art9_risk_management", "Risk management system (Art 9)"],
  ["art10_data_governance", "Data governance (Art 10)"],
  ["art12_logging", "Logging / record-keeping (Art 12)"],
  ["art13_transparency", "Transparency to deployers (Art 13)"],
  ["art14_human_oversight", "Human oversight (Art 14)"],
  ["art15_accuracy_robustness", "Accuracy & robustness (Art 15)"],
  ["art50_transparency_obligations", "Interaction/marking transparency (Art 50)"],
] as const;

export function canonical(o: unknown): string {
  if (o === null || typeof o !== "object") return JSON.stringify(o);
  if (Array.isArray(o)) return "[" + o.map(canonical).join(",") + "]";
  const rec = o as Record<string, unknown>;
  return "{" + Object.keys(rec).sort().map((k) => JSON.stringify(k) + ":" + canonical(rec[k])).join(",") + "}";
}

export const hex = (buf: ArrayBuffer) =>
  [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");

export type AssessInput = {
  system?: string;
  purpose?: string;
  domain?: string;
  description?: string;
  scenario?: string;
  text?: string;
  use_case?: string;
  human_oversight?: boolean;
  logging?: boolean;
  claimed_controls?: string[];
  frameworks_in_scope?: string[];
  system_id?: string;
  org_name?: string;
};

export async function runAssess(body: AssessInput) {
  const text = ["system", "purpose", "domain", "description", "scenario", "text", "use_case"]
    .map((k) => String((body as Record<string, unknown>)[k] ?? ""))
    .join(" ")
    .slice(0, 4000);

  if (text.trim().length < 8) {
    return {
      error: "no assessable description supplied",
      status: 400 as const,
      detail:
        "Provide the system description in one of: system, purpose, domain, description, scenario, text, use_case.",
    };
  }

  const prohibited = PROHIBITED.filter(([, rx]) => rx.test(text)).map(([n]) => n);
  const cats = ANNEX_III.filter(([, rx]) => rx.test(text)).map(([n]) => n);

  const claimed = new Set<string>();
  if (body.human_oversight) claimed.add("art14_human_oversight");
  if (body.logging) claimed.add("art12_logging");
  for (const c of Array.isArray(body.claimed_controls) ? body.claimed_controls : [])
    claimed.add(String(c));

  const gaps = CONTROLS.filter(([id]) => !claimed.has(id)).map(([, label]) => label);
  const score = Math.round(((CONTROLS.length - gaps.length) / CONTROLS.length) * 100);

  let tier: string, verdict: string, basis: string;
  if (prohibited.length) {
    tier = "PROHIBITED";
    verdict = `Matches a prohibited practice: ${prohibited.join("; ")}. No conformity route exists — controls cannot remediate an Art 5 practice.`;
    basis = "EU AI Act Art 5";
  } else if (cats.length) {
    tier = "HIGH_RISK";
    verdict = `High-risk on this description (Annex III: ${cats.join(", ")}). Conformity assessment required before EU placement; ${gaps.length} of ${CONTROLS.length} controls unclaimed.`;
    basis = "EU AI Act Art 6, Annex III";
  } else {
    tier = "LIMITED_OR_MINIMAL";
    verdict = `No prohibited practice or Annex III category matched this description. Article 50 transparency duties may still apply.`;
    basis = "EU AI Act Art 6, Art 50";
  }

  const payload = {
    report_id: crypto.randomUUID(),
    assessed_at: new Date().toISOString(),
    input_digest: hex(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text))),
    system_id: body.system_id || null,
    org_name: body.org_name || null,
    frameworks_in_scope: body.frameworks_in_scope || [],
    tier,
    verdict,
    compliance_score: score,
    gaps,
    rationale:
      "Deterministic keyword classification against frozen Annex III category sets; gap list is the fixed Art 9–15/50 control set minus claimed controls. No model in the verdict path.",
    basis,
    engine: "csoai-assess/2.1 pages-function",
  };

  return { payload, signed_payload: canonical(payload), status: 200 as const };
}

export async function signPayload(signed_payload: string, b64?: string) {
  let sig = "", pub = "", kid = "", alg = "UNSIGNED";
  if (b64) {
    const der = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
    const key = await crypto.subtle.importKey("pkcs8", der, { name: "Ed25519" }, true, ["sign"]);
    sig = hex(await crypto.subtle.sign("Ed25519", key, new TextEncoder().encode(signed_payload)));
    const jwk = (await crypto.subtle.exportKey("jwk", key)) as JsonWebKey;
    pub = jwk.x ?? "";
    kid = "assess-2026-07";
    alg = "Ed25519";
  }
  return { sig, pub, kid, alg };
}
