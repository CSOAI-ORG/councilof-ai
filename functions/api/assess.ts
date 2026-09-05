/**
 * POST /api/assess — a deterministic, text-only EU AI Act screening helper.
 *
 * THE BRIDGE THIS CLOSES
 * The front end (/assess, AssessTool.tsx) has shipped for weeks pointing at
 * `https://api.csoai.org` — a hostname with no DNS record. Every click on "Run signed
 * assessment" failed. The engine existed the whole time, in a Next route in csoai-org-v2 that
 * had no public deploy. This Pages Function is that engine, ported to the Workers runtime and
 * served same-origin, so the button and the backend finally share a URL.
 *
 * WHAT THIS IS AND IS NOT
 * Keyword matches identify provisions a human should inspect. They do not establish legal tier,
 * applicability, exceptions, facts, or compliance. Control coverage is calculated only from
 * unverified caller assertions. No model is consulted; a signature preserves this scoped output
 * but does not validate the input or turn the screen into legal advice.
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
        "Deterministic, text-only EU AI Act screening. POST a system description to receive " +
        "possible provision matches and unverified claimed-control coverage. This is not a legal tier verdict.",
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
        screening_state: "POSSIBLE_PROHIBITED_TEXT_MATCH | POSSIBLE_ANNEX_III_TEXT_MATCH | NO_MATCH_IN_LIMITED_KEYWORD_SET | UNMEASURED",
        explanation: "Human-readable scope and match rationale",
        claimed_control_coverage: "Caller-asserted controls divided by the fixed Art 9–15/50 list; not verified and not a compliance score",
        unclaimed_controls: "string[] — controls the caller did not claim; not established deficiencies",
        sig: "Ed25519 hex signature (or empty if UNSIGNED)",
        alg: "Ed25519 | UNSIGNED",
      },
      verify_key: "/api/assess/key",
      note:
        "This is a limited keyword screen. It does not fetch evidence or decide applicability, " +
        "exceptions, legal tier, lawfulness, conformity, certification, or compliance. A signature " +
        "only preserves the returned bytes. UNMEASURED is the honest empty state.",
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
        screening_state: "UNMEASURED",
        legal_determination: false,
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

  const unclaimedControls = CONTROLS.filter(([id]) => !claimed.has(id)).map(([, label]) => label);
  const claimedPercent = Math.round(((CONTROLS.length - unclaimedControls.length) / CONTROLS.length) * 100);

  let screeningState: string, explanation: string, basis: string;
  if (prohibited.length) {
    screeningState = "POSSIBLE_PROHIBITED_TEXT_MATCH";
    explanation = `The submitted text matched phrases associated with possible Article 5 practices: ${prohibited.join("; ")}. Applicability, exceptions, context, and facts were not tested.`;
    basis = "Keyword pointers to EU AI Act Article 5; qualified review required";
  } else if (cats.length) {
    screeningState = "POSSIBLE_ANNEX_III_TEXT_MATCH";
    explanation = `The submitted text matched possible Annex III categories: ${cats.join(", ")}. ${unclaimedControls.length} of ${CONTROLS.length} listed controls were not claimed by the caller. Neither legal tier nor control effectiveness was established.`;
    basis = "Keyword pointers to EU AI Act Article 6 and Annex III; qualified review required";
  } else {
    screeningState = "NO_MATCH_IN_LIMITED_KEYWORD_SET";
    explanation = "The limited keyword set found no Article 5 or Annex III phrase match. This is not evidence of low risk, lawfulness, or non-applicability; Article 50 and other duties may still apply.";
    basis = "Limited keyword set only; no legal conclusion";
  }

  const payload = {
    result_id: crypto.randomUUID(),
    screened_at: new Date().toISOString(),
    input_digest: hex(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text))),
    screening_state: screeningState,
    explanation,
    possible_text_matches: {
      article_5: prohibited,
      annex_iii: cats,
    },
    claimed_control_coverage: {
      claimed: CONTROLS.length - unclaimedControls.length,
      total: CONTROLS.length,
      percent: claimedPercent,
      evidence_state: "CALLER_ASSERTED_UNVERIFIED",
      note: "This percentage is not a compliance score and does not test control design or operation.",
    },
    unclaimed_controls: unclaimedControls,
    legal_determination: false,
    facts_checked: false,
    urls_fetched: false,
    rationale:
      "Deterministic keyword screening against frozen phrase sets. The unclaimed list is the fixed Art 9–15/50 list minus caller-asserted controls. No model is in the path. Endpoint fields are recorded as text; this function fetches no URL and runs no GSPC benchmark.",
    basis,
    engine: "csoai-assess/3.0 pages-function",
    measurement_kind: "eu_ai_act_keyword_screen_v3",
    disclaimer: "Text-only screening output. Not legal advice, a legal tier, compliance finding, conformity assessment, attestation, or certificate. No remediation occurred.",
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
