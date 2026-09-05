/**
 * /api/bank-complete — evidence-derived reader for the bank × chain × stablecoin census.
 * Data is embedded at build time (zero-drift with public/interop/bank-registry.json).
 */
import { BANK_REGISTRY_SNAPSHOT as d } from "./_bank-registry-snapshot";

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
  return json({
    schema: "csoai.bank-complete/0.1",
    status: "READER",
    writes_board: false,
    total_banks: d.total_banks,
    total_records: d.total_records,
    banks: d.banks,
    verify: "https://councilof.ai/gspc-verify",
    honesty: "Measurement, not certification. Verification is free forever.",
  });
};

export const onRequestOptions: PagesFunction = async () => {
  return new Response(null, { status: 204 });
};
