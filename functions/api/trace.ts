/**
 * GET /api/trace — TRACE Trust Record stub.
 * Hardware fields UNCHECKABLE. writes_board=false. Not a GSPC axis.
 */
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body, null, 2), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      "access-control-allow-origin": "*",
    },
  });

export const onRequestGet: PagesFunction = async () =>
  json({
    schema: "https://councilof.ai/schema/trace-trust-record-v0.json",
    kind: "csoai.trace-trust-record/0.1",
    writes_board: false,
    claims: {
      rats: { status: "UNCHECKABLE" },
      eat: { status: "UNCHECKABLE" },
      slsa: { status: "UNCHECKABLE" },
      scitt: { status: "UNCHECKABLE" },
      spiffe: { status: "UNCHECKABLE" },
      ear: { status: "UNCHECKABLE" },
      silicon: { status: "UNCHECKABLE" },
    },
    honesty:
      "Software stub. Linux Foundation TRACE (25 Aug 2026) is not implemented. Silicon UNCHECKABLE, not zero. Not a GSPC score. Not a certificate. Emitter: packages/trace/emit.py",
    emitter: "/packages/trace/emit.py",
  });
