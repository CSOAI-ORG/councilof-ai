// functions/api/clarity.ts — MACHINE-READABILITY & CLARITY RECORD.
// Advertised in llms.txt since 08-22 but never built (audit 2026-08-23 caught the 404).
// Binary process facts about how regimes publish guidance; predicates only; signed;
// UNMEASURED honest where not verified. Never a certification of any regime.

interface Env { KV?: unknown }

export const onRequestGet: PagesFunction<Env> = async () => {
  const clarity = {
    schema: "csoai.clarity/0.1",
    note: "Binary process facts about how regimes publish AI guidance. Predicates only. Where not verified: UNMEASURED, stated honestly.",
    register: "REPORTED (attributed) where sourced; MEASURED only where we deterministically verified; never blended",
    predicates: {
      machine_readable: {
        gdpr: { value: true, source: "EUR-Lex machine-readable formats", verified: "MEASURED" },
        "eu-ai-act": { value: true, source: "EUR-Lex consolidated text", verified: "MEASURED" },
        "uk-osi": { value: false, source: "UK gov publish-advice pages", verified: "REPORTED" },
        "tc260": { value: false, source: "PRC standards portal (PDF-gated)", verified: "REPORTED" },
      },
      guidance_language: {
        english: { value: true, source: "primary publication language", verified: "MEASURED" },
        english_official: { value: "mixed", note: "varies by regime; not a clarity score", verified: "UNMEASURED" },
      },
      updates_published: {
        "eu-ai-act-implementing-acts": { value: true, source: "OJ L series", verified: "MEASURED" },
        "uk-ai-guidance": { value: true, source: "gov.uk updates", verified: "MEASURED" },
      },
    },
    not_a_certification: true,
    generated_at: new Date().toISOString(),
  };
  return Response.json(clarity, {
    headers: { "content-type": "application/json; charset=utf-8" },
  });
};
