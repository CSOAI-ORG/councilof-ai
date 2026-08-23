/**
 * GET /api/ecosystem — machine-readable org index (Distribution Hive).
 *
 * Query params:
 *   ?id=<accountId>  — single org + JSON-LD block
 *   ?type=regulator  — filter by type
 *   ?region=EU       — filter by region
 *   ?recon=cited     — filter by recon_status
 *
 * Org-level public data only. Measurement, not certification.
 */
// @ts-expect-error generated at build time
import INDEX from "../data/ecosystem.json";

type EcosystemIndex = {
  schema: string;
  generated_at: string;
  license: string;
  doctrine: string;
  counts: Record<string, number>;
  accounts: Array<Record<string, unknown>>;
};

const DATA = INDEX as EcosystemIndex;

function jsonLdOrg(a: Record<string, unknown>) {
  const [lng, lat] = (a.hq as number[]) || [0, 0];
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `https://councilof.ai/brief?id=${a.id}`,
    name: a.name,
    url: a.source && String(a.source).startsWith("http") ? a.source : `https://councilof.ai/brief?id=${a.id}`,
    description:
      `Public org-level AI governance intel for ${a.name}. ` +
      `Frameworks in scope: ${((a.frameworks as string[]) || []).join(", ")}. ` +
      `Council measures; does not certify.`,
    areaServed: ((a.jurisdictions as string[]) || []).join(", "),
    geo:
      lat && lng
        ? { "@type": "GeoCoordinates", latitude: lat, longitude: lng }
        : undefined,
    additionalProperty: [
      { "@type": "PropertyValue", name: "account_type", value: a.type },
      { "@type": "PropertyValue", name: "recon_status", value: a.recon_status },
      { "@type": "PropertyValue", name: "posture", value: a.posture },
      { "@type": "PropertyValue", name: "measurement_doctrine", value: "not_certification" },
    ],
  };
}

export const onRequestGet: PagesFunction = async (ctx) => {
  const url = new URL(ctx.request.url);
  const id = url.searchParams.get("id");
  const type = url.searchParams.get("type");
  const region = url.searchParams.get("region");
  const recon = url.searchParams.get("recon");

  if (id) {
    const a = DATA.accounts.find((x) => x.id === id);
    if (!a) return Response.json({ error: "account not found", id }, { status: 404 });
    return Response.json(
      {
        schema: "csoai.ecosystem-org/0.1",
        account: a,
        jsonld: jsonLdOrg(a),
        links: {
          brief: `https://councilof.ai/brief?id=${id}`,
          crosswalk: `https://councilof.ai/crosswalk?fw=${encodeURIComponent(((a.frameworks as string[]) || []).join(","))}`,
          assess: "https://councilof.ai/assess",
          signal: "https://councilof.ai/api/signal",
          remediation: "https://councilof.ai/remediation-partners",
        },
        firewall:
          "Council measures and signs. Remediation is independent. Re-measurement is free.",
      },
      { headers: { "cache-control": "public, max-age=3600" } },
    );
  }

  let accounts = DATA.accounts;
  if (type) accounts = accounts.filter((a) => a.type === type);
  if (region) accounts = accounts.filter((a) => a.region === region);
  if (recon) accounts = accounts.filter((a) => a.recon_status === recon);

  return Response.json(
    {
      schema: DATA.schema,
      generated_at: DATA.generated_at,
      license: DATA.license,
      doctrine: DATA.doctrine,
      counts: DATA.counts,
      filtered: accounts.length,
      accounts: accounts.map((a) => ({
        id: a.id,
        name: a.name,
        type: a.type,
        region: a.region,
        country: a.country,
        sector: a.sector,
        frameworks: a.frameworks,
        posture: a.posture,
        play: a.play,
        recon_status: a.recon_status,
        brief_url: a.brief_url,
      })),
      discovery: {
        llms_txt: "https://councilof.ai/llms.txt",
        brief_pattern: "https://councilof.ai/brief?id={id}",
        coliseum: "https://councilof.ai/coliseum",
      },
    },
    { headers: { "cache-control": "public, max-age=3600" } },
  );
};
