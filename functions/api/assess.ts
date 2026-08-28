/**
 * POST /api/assess — the deterministic risk check, finally attached to its button.
 *
 * THE BRIDGE THIS CLOSES
 * The front end (/assess, AssessTool.tsx) has shipped for weeks pointing at
 * `https://api.csoai.org` — a hostname with no DNS record. Every click on "Run signed
 * assessment" failed. The engine existed the whole time, in a Next route in csoai-org-v2 that
 * had no public deploy. This Pages Function is that engine, ported to the Workers runtime and
 * served same-origin, so the button and the backend finally share a URL.
 *
 * WHAT THIS IS AND IS NOT
 * A decision table. Domain classification is keyword matching against Annex III categories;
 * the tier is the most severe match; gaps are the fixed control set minus what the caller
 * claims. No model is consulted — the same input always produces the same output, which is why
 * the verdict can be signed at all. It identifies the route; it is not a conformity assessment
 * and not legal advice.
 *
 * SIGNING — three outcomes, never two
 *   signed     ASSESS_SIGNING_KEY_PKCS8_B64 is provisioned; Ed25519 over canonical JSON.
 *   UNSIGNED   the secret is absent. The report says alg:"UNSIGNED" out loud rather than
 *              fabricating a signature or silently omitting the field. The front renders it;
 *              a reader can see exactly what they do not have.
 *   (error)    a malformed key is a 500, not an unsigned fallback — a key that exists but
 *              cannot sign is an operations failure someone must see.
 */

interface Env {
  ASSESS_SIGNING_KEY_PKCS8_B64?: string;
}

// ── The decision table ──────────────────────────────────────────────────────────
// Annex III categories as keyword sets. Biometrics is present — its absence from a sibling
// table put a false NO CATEGORY MATCHED on the homepage console, on our own demo input.
const PROHIBITED: [string, RegExp][] = [
  ["social scoring (Art 5(1)(c))", /\b(social scor\w*|social credit|citizen scor\w*|trustworthiness scor\w*|scor\w*[^.]{0,30}(?:citizens?|people|individuals?)[^.]{0,30}(?:social )?behaviou?r|rank\w*[^.]{0,30}(?:citizens?|people)[^.]{0,30}behaviou?r)\b/i],
  ["real-time remote biometric ID for law enforcement (Art 5(1)(h))", /\b(real.?time\s+remote\s+biometric|remote\s+biometric\s+identif\w*|live\s+facial\s+recognition[^.]{0,40}(?:public|law enforcement|police))\b/i],
  ["emotion recognition at work/school (Art 5(1)(f))", /\bemotion(?:al)?\s+(?:recognition|detection|inference|analysis)\b[^.]{0,60}\b(work\w*|employ\w*|office|school|education|classroom|students?)/i],
  ["predictive policing from profiling (Art 5(1)(d))", /\b(predictive\s+polic\w*|predict\w*[^.]{0,30}(?:likelihood|risk)[^.]{0,30}(?:commit\w*|offend\w*|crim\w*))\b/i],
  ["exploiting vulnerabilities (Art 5(1)(b))", /\bexploit\w*[^.]{0,40}(vulnerab\w*|disabilit\w*|elderly|children|minors?)/i],
  ["biometric categorization of sensitive traits (Art 5(1)(g))", /\bbiometric\s+categor\w*/i],
  ["subliminal manipulation (Art 5(1)(a))", /\b(subliminal|manipulat\w* technique|deceptive technique)\b/i],
  ["untargeted facial scraping (Art 5(1)(e))", /\b(untargeted scrap\w*|scrap\w* (?:of )?facial|scrap\w*[^.]{0,30}facial (?:image|recognition))\b/i],
];

const ANNEX_III: [string, RegExp][] = [
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

const CONTROLS = [
  ["art9_risk_management", "Risk management system (Art 9)"],
  ["art10_data_governance", "Data governance (Art 10)"],
  ["art12_logging", "Logging / record-keeping (Art 12)"],
  ["art13_transparency", "Transparency to deployers (Art 13)"],
  ["art14_human_oversight", "Human oversight (Art 14)"],
  ["art15_accuracy_robustness", "Accuracy & robustness (Art 15)"],
  ["art50_transparency_obligations", "Interaction/marking transparency (Art 50)"],
] as const;

function canonical(o: unknown): string {
  if (o === null || typeof o !== "object") return JSON.stringify(o);
  if (Array.isArray(o)) return "[" + o.map(canonical).join(",") + "]";
  const rec = o as Record<string, unknown>;
  return "{" + Object.keys(rec).sort().map((k) => JSON.stringify(k) + ":" + canonical(rec[k])).join(",") + "}";
}

const hex = (buf: ArrayBuffer) =>
  [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");

/**
 * GET /api/assess — discovery endpoint, same pattern as GET /api/mcp.
 *
 * Returns metadata about this endpoint: what it does, how to use it, and
 * what inputs it accepts. POST the actual assessment; GET discovers the API.
 * An empty GET that returned 404 JSON was wrong — discovery should work.
 */
export const onRequestGet: PagesFunction<Env> = async () => {
  return new Response(
    JSON.stringify({
      endpoint: "/api/assess",
      method: "POST",
      description:
        "Deterministic EU AI Act risk classification. POST a system description; " +
        "receive a signed tier verdict (PROHIBITED / HIGH_RISK / LIMITED_OR_MINIMAL / UNMEASURED). " +
        "No model in the verdict path — the same input always produces the same output.",
      input_fields: [
        "system", "purpose", "domain", "description", "scenario", "text",
        "use_case", "endpoint", "url", "system_url",
      ],
      input_note:
        "Provide the system description in any of the above fields. Multiple fields " +
        "are concatenated. An empty or very short description returns UNMEASURED, not a low-risk finding.",
      optional_claims: {
        human_oversight: "boolean — claim Art 14 control",
        logging: "boolean — claim Art 12 control",
        claimed_controls: "string[] — explicit control identifiers (e.g. art9_risk_management)",
      },
      output: {
        tier: "PROHIBITED | HIGH_RISK | LIMITED_OR_MINIMAL | UNMEASURED",
        verdict: "Human-readable classification rationale",
        compliance_score: "0-100 based on claimed controls",
        gaps: "string[] — unclaimed controls from the fixed Art 9–15/50 set",
        sig: "Ed25519 hex signature (or empty if UNSIGNED)",
        alg: "Ed25519 | UNSIGNED",
      },
      verify_key: "/api/assess/key",
      note:
        "This is a keyword-based classifier against frozen Annex III category sets. " +
        "It identifies the route; it is not a conformity assessment, not a GSPC bench run, " +
        "and not legal advice. No score is invented — UNMEASURED is the honest empty state.",
      related: ["/api/mcp", "/api/gspc", "/gspc-verify"],
    }),
    {
      status: 200,
      headers: {
        "content-type": "application/json",
        "cache-control": "public, max-age=300",
      },
    }
  );
};

export const onRequestPost: PagesFunction<Env> = async (ctx) => {
  let body: Record<string, unknown>;
  try {
    body = await ctx.request.json();
  } catch {
    return Response.json({ error: "body must be JSON" }, { status: 400 });
  }

  // Accept the obvious aliases too. A caller who posts {"scenario": "..."} was previously
  // parsed as EMPTY text, matched no Annex III category, and was told
  // "No prohibited practice or Annex III category matched" — i.e. a governance API answering
  // "looks fine" to a question it never actually read. That is the worst failure this product
  // can have, so the field list is generous and the empty case is refused outright below.
  const text = ["system", "purpose", "domain", "description", "scenario", "text", "use_case",
    "endpoint", "url", "system_url"]
    .map((k) => String(body[k] ?? ""))
    .join(" ")
    .slice(0, 4000);

  // UNMEASURED is the safe default. No describable input means no assessment — never
  // LIMITED_OR_MINIMAL, which a reader would take as "assessed, and it is fine".
  if (text.trim().length < 8) {
    return Response.json(
      {
        tier: "UNMEASURED",
        error: "no assessable description supplied",
        detail:
          "Provide the system description in one of: system, purpose, domain, description, " +
          "scenario, text, use_case, endpoint, url, system_url. An empty description is not a low-risk finding.",
      },
      { status: 400 },
    );
  }

  // ── classify ────────────────────────────────────────────────────────────────
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
    verdict = `High-risk on this description (Annex III: ${cats.join(", ")}). ${gaps.length} of ${CONTROLS.length} controls unclaimed. This is a measurement of the submitted text, not a conformity assessment.`;
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
    tier,
    verdict,
    compliance_score: score,
    gaps,
    rationale:
      "Deterministic keyword classification against frozen Annex III category sets; gap list is the fixed Art 9–15/50 control set minus claimed controls. No model in the verdict path. The endpoint field is recorded as text — this function does not fetch or probe a URL, and it is not a GSPC bench run.",
    basis,
    engine: "csoai-assess/2.1 pages-function",
    measurement_kind: "eu_ai_act_keyword_v2",
    disclaimer: "Text-only classifier. Not a certificate. We do not remediate. Empty cells stay empty.",
  };

  const signed_payload = canonical(payload);

  // ── sign, or say plainly that we cannot ────────────────────────────────────
  let sig = "", pub = "", kid = "", alg = "UNSIGNED";
  const b64 = ctx.env.ASSESS_SIGNING_KEY_PKCS8_B64;
  if (b64) {
    // A provisioned-but-broken key must fail loudly here, not degrade to UNSIGNED.
    const der = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
    const key = await crypto.subtle.importKey("pkcs8", der, { name: "Ed25519" }, true, ["sign"]);
    sig = hex(await crypto.subtle.sign("Ed25519", key, new TextEncoder().encode(signed_payload)));
    const jwk = (await crypto.subtle.exportKey("jwk", key)) as JsonWebKey;
    pub = jwk.x ?? "";
    kid = "assess-2026-07";
    alg = "Ed25519";
  }

  return Response.json(
    { ...payload, signed_payload, sig, pub, kid, alg },
    { headers: { "cache-control": "no-store" } }
  );
};
