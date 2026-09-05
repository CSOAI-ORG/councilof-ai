/**
 * /api/eu-ai-act — evidence summary for the EU AI Act regime (Art 50, high-risk, GPAI).
 * Obligation map is the same one the evidence-bundle assembler uses (see ./_obligations).
 */
import { OBLIGATIONS } from "./_obligations";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body, null, 2), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      "access-control-allow-origin": "*",
    },
  });

export const onRequestGet: PagesFunction = async () => {
  const items = Object.values(OBLIGATIONS).map((o) => ({
    id: o.id,
    control_id: o.control_id,
    title: o.title,
    regulator: o.regulator,
    counsel_confirmed: o.counsel_confirmed,
    honesty: o.honesty || null,
  }));
  return json({
    schema: "csoai.eu-ai-act/0.1",
    status: "READER",
    writes_board: false,
    total_obligations: items.length,
    obligations: items,
    doors: [
      "https://councilof.ai/.well-known/eu-ai-act.json",
      "https://councilof.ai/.well-known/eu-ai-act-art50.json",
      "https://councilof.ai/.well-known/eu-ai-act-high-risk.json",
      "https://councilof.ai/.well-known/eu-ai-act-gpai.json",
    ],
    honesty: "Evidence bundles attach cards as OSCAL observations, never as satisfied/not-satisfied findings.",
  });
};

export const onRequestOptions: PagesFunction = async () => {
  return new Response(null, { status: 204 });
};
