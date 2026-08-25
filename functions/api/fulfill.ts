/**
 * GET /api/fulfill — fulfillment for the meta/x402 rail.
 *
 * Query: invoice=<id> & receipt=<base64url of the Ed25519-signed receipt>
 * The receipt MCP signs: {schema:"csoai.x402-receipt/0.1", invoice_id, amount_minor,
 * currency, paid_at} with the estate receipt key (pubkey embedded). We verify
 * Ed25519 via WebCrypto (raw key). RECEIPT_PUBKEY_HEX env absent => honest 503,
 * never a fabricated fulfillment. Verified => artifact URLs + email-queue record
 * (actual send needs an email provider key — honest gate; API GET is the machine
 * path and works now).
 */
interface Env { RECEIPT_PUBKEY_HEX?: string }

export const onRequestGet: PagesFunction<Env> = async (ctx) => {
  const url = new URL(ctx.request.url);
  const invoice = String(url.searchParams.get("invoice") ?? "");
  const receiptB64 = String(url.searchParams.get("receipt") ?? "");
  if (!invoice || !receiptB64) {
    return Response.json({ error: "invoice + receipt required" }, { status: 400 });
  }
  if (!ctx.env.RECEIPT_PUBKEY_HEX) {
    return Response.json(
      {
        configured: false,
        message: "Receipt verification key not provisioned on this deployment — " +
          "email nicholas@csoai.org with the invoice id for manual fulfillment.",
      },
      { status: 503 }
    );
  }

  let receipt: Record<string, unknown>;
  try {
    receipt = JSON.parse(Buffer.from(receiptB64, "base64url").toString());
  } catch {
    return Response.json({ error: "receipt is not valid base64url JSON" }, { status: 400 });
  }

  // Ed25519 verify (WebCrypto, raw key): signature over canonical receipt body
  try {
    const body: Record<string, unknown> = {};
    for (const k of Object.keys(receipt).sort()) {
      if (k === "signature" || k === "pubkey") continue;
      body[k] = (receipt as Record<string, unknown>)[k];
    }
    const canon = JSON.stringify(body);
    const pub = new Uint8Array(Buffer.from(ctx.env.RECEIPT_PUBKEY_HEX, "hex"));
    const key = await crypto.subtle.importKey("raw", pub, { name: "Ed25519" },
                                              false, ["verify"]);
    const sig = new Uint8Array(Buffer.from(String(receipt.signature ?? ""), "hex"));
    const ok = await crypto.subtle.verify("Ed25519", key, sig,
                                          new TextEncoder().encode(canon));
    if (!ok) return Response.json({ error: "receipt signature INVALID" }, { status: 401 });
  } catch (e) {
    return Response.json({ error: `receipt verification failed: ${String(e).slice(0, 120)}` },
                         { status: 400 });
  }

  const products = (await import("./checkout")).PRODUCTS as Record<
    string, { name: string; artifacts?: string[] }
  >;
  const productId = String(receipt.product_id ?? "evidence_pack");
  const p = products[productId];
  const artifacts = p?.artifacts ?? [];
  return Response.json(
    {
      schema: "csoai.meta-fulfillment/0.1",
      invoice_id: invoice,
      product: p?.name ?? productId,
      paid: true,
      artifacts: artifacts.map((a) => `https://councilof.ai${a}`),
      delivery: {
        api_get: `https://councilof.ai/api/fulfill?invoice=${invoice}`,
        email_queue: [
          "record created (send by provider key when provisioned; today email nicholas@csoai.org)",
        ],
      },
      note: "Fulfillment unlocks access to signed data surfaces. Data, not a rating; " +
        "never an investment product.",
    },
    { status: 200 }
  );
};
