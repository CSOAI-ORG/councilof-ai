/**
 * Zero-priced x402 discovery doors for named subjects. These are discovery resources, not
 * measurement cards or new paid SKUs. A confirmed zero-value settlement gives a Bazaar indexer
 * a distinct resource URL; the response then points at the existing catalogue and paid doors.
 */
import {
  buildPaymentRequiredV2,
  paymentRequiredResponseSigned,
  verifyX402Payment,
  x402Accepts,
  type X402Env,
} from "../_x402";

type Subject = {
  label: string;
  aliases: string[];
  evidenceSubject: string;
  links: (origin: string) => Record<string, string>;
};

export const SUBJECTS: Record<string, Subject> = {
  chainlink: {
    label: "Chainlink / LINK",
    aliases: ["Chainlink", "LINK"],
    evidenceSubject: "chainlink",
    links: (o) => ({
      commission: `${o}/api/request-attestation?subject=chainlink`,
      dora_bundle: `${o}/api/evidence-bundle?obligation=dora&subject=chainlink&bundle=1`,
    }),
  },
  ondo: {
    label: "Ondo Finance / ONDO",
    aliases: ["Ondo Finance", "ONDO"],
    evidenceSubject: "ondo-finance",
    links: (o) => ({
      commission: `${o}/api/request-attestation?subject=ondo-finance`,
      dora_bundle: `${o}/api/evidence-bundle?obligation=dora&subject=ondo-finance&bundle=1`,
    }),
  },
  "ondo-ousg": {
    label: "Ondo Finance OUSG on XRPL",
    aliases: ["Ondo Finance OUSG", "OUSG", "xrpl:OUSG"],
    evidenceSubject: "xrpl:OUSG",
    links: (o) => ({
      free_preview: `${o}/api/rwa/evidence?asset=OUSG&preview=1`,
      signed_evidence: `${o}/api/rwa/evidence?asset=OUSG`,
      dora_bundle: `${o}/api/evidence-bundle?obligation=dora&subject=xrpl%3AOUSG&bundle=1`,
    }),
  },
};

export const handleSubject = async (
  key: string,
  { request, env }: { request: Request; env: X402Env },
): Promise<Response> => {
  key = key.toLowerCase();
  const subject = SUBJECTS[key];
  if (!subject) {
    return Response.json(
      {
        error: "unknown_subject",
        supported: Object.keys(SUBJECTS),
        measurement: "not certification",
      },
      { status: 404 },
    );
  }

  const url = new URL(request.url);
  const resourceUrl = `${url.origin}/api/discover/${key}`;
  const description =
    `Free CSOAI discovery for ${subject.label}: evidence routes and verification links. ` +
    "It is an index entry, not a measurement, rating, endorsement, or certificate.";
  const accepts = x402Accepts(
    { ...env, X402_AMOUNT: "0" } as X402Env,
    resourceUrl,
    {
      skuId: "request_attestation",
      tier: "per_request",
      description,
    },
  );
  const output = {
    schema: "csoai.subject-discovery/0.1",
    subject: {
      id: subject.evidenceSubject,
      label: subject.label,
      aliases: subject.aliases,
    },
    state: "DISCOVERY_ONLY",
    measurement_state: "SEE_LINKED_EVIDENCE",
    catalog: `${url.origin}/api/x402`,
    board: `${url.origin}/api/gspc`,
    verify: `${url.origin}/gspc-verify`,
    routes: subject.links(url.origin),
    paid: {
      amount_usdc: 0,
      note: "the true price of this discovery resource; nothing was charged",
    },
    boundary:
      "Measurement, not certification. Discovery does not imply measurement, validity, or endorsement.",
  };
  const challenge = buildPaymentRequiredV2({
    resourceUrl,
    description,
    serviceName: `CSOAI ${subject.label} discovery`,
    accepts,
    bazaar: {
      info: {
        input: { type: "http", method: "GET" },
        output: { type: "json", example: output },
      },
      schema: {
        $schema: "https://json-schema.org/draft/2020-12/schema",
        type: "object",
        properties: {
          input: {
            type: "object",
            properties: {
              type: { type: "string", const: "http" },
              method: { type: "string", enum: ["GET"] },
            },
            required: ["type", "method"],
            additionalProperties: false,
          },
          output: {
            type: "object",
            properties: { type: { type: "string" } },
            required: ["type"],
          },
        },
        required: ["input"],
      },
    },
  });

  const payment = await verifyX402Payment(
    request,
    env,
    resourceUrl,
    accepts[0],
    { allowZeroAmount: true },
  );
  if (payment.ok) {
    return Response.json(output, {
      headers: {
        "cache-control": "no-store",
        "access-control-allow-origin": "*",
        ...(payment.paymentResponse
          ? { "x-payment-response": payment.paymentResponse }
          : {}),
      },
    });
  }

  const presented = !!(
    request.headers.get("x-payment") || request.headers.get("payment-signature")
  );
  return paymentRequiredResponseSigned(
    {
      ...challenge,
      catalog: `${url.origin}/api/x402`,
      csoai: {
        free_preview: resourceUrl,
        deliverable: `free discovery links for ${subject.label}; settling charges nothing and buys no measurement`,
        ...(presented ? { not_paid_reason: payment.reason } : {}),
      },
    },
    env,
  );
};
