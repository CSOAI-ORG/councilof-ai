/**
 * GET /api/rwa-attestation — RWA attestation catalog (honest Stage 2 stub).
 * GET /api/rwa-attestation/:slug — single target.
 *
 * All entries UNMEASURED until frozen bank + custody + counsel gates.
 * Attestation ≠ tokenization ≠ ownership.
 */

type RwaRow = {
  slug: string;
  name: string;
  chain: string;
  public_id: string;
  play: "clean" | "demo";
  status: "UNMEASURED";
  measured_score: null;
  signing_state: "unsigned";
  stage: 2;
  note: string;
};

const TARGETS: RwaRow[] = [
  {
    slug: "ondo-ousg",
    name: "Ondo OUSG",
    chain: "dual",
    public_id: "rHuiXXjHLpMP8ZE9sSQU5aADQVWDwv6h5p",
    play: "clean",
    status: "UNMEASURED",
    measured_score: null,
    signing_state: "unsigned",
    stage: 2,
    note: "Stage-2 reference. Public artifact only — no invented AUM as MEASURED.",
  },
  {
    slug: "blackrock-buidl",
    name: "BlackRock BUIDL",
    chain: "ethereum",
    public_id: "0x7712c34205737192402172409a8f7ccef8aa2aec",
    play: "clean",
    status: "UNMEASURED",
    measured_score: null,
    signing_state: "unsigned",
    stage: 2,
    note: "REPORTED/contact-only. Confirm contract on Etherscan.",
  },
  {
    slug: "ripple-rlusd",
    name: "Ripple USD (RLUSD)",
    chain: "xrpl",
    public_id: "rMxCKbEDwqr76QuheSUMdEGf4B9xJ8m5De",
    play: "clean",
    status: "UNMEASURED",
    measured_score: null,
    signing_state: "unsigned",
    stage: 2,
    note: "Settlement rail facts only — not a rating.",
  },
  {
    slug: "franklin-benji",
    name: "Franklin Templeton BENJI (FOBXX)",
    chain: "ethereum",
    public_id: "0x3DDc84940Ab509C11B20B76B466933f40b750dc9",
    play: "clean",
    status: "UNMEASURED",
    measured_score: null,
    signing_state: "unsigned",
    stage: 2,
    note: "Cite dated primary AUM as REPORTED only.",
  },
  {
    slug: "justoken-jmwh",
    name: "Justoken JMWH",
    chain: "xrpl",
    public_id: "TBD — verify on XRPScan",
    play: "demo",
    status: "UNMEASURED",
    measured_score: null,
    signing_state: "unsigned",
    stage: 2,
    note: "DEMO ONLY — demonstrative EAT; never production MEASURED mainnet.",
  },
];

export const onRequestGet: PagesFunction = async (context) => {
  const url = new URL(context.request.url);
  const slug =
    url.searchParams.get("slug") ||
    url.pathname.replace(/^\/api\/rwa-attestation\/?/, "").replace(/\/$/, "") ||
    "";

  const body =
    slug && slug !== "rwa-attestation"
      ? (() => {
          const row = TARGETS.find((t) => t.slug === slug);
          if (!row) {
            return { error: "unknown_target", slug, known: TARGETS.map((t) => t.slug) };
          }
          return {
            schema: "csoai.rwa-attestation-catalog/0.1",
            as_of: new Date().toISOString().slice(0, 10),
            register: "UNMEASURED",
            target: row,
            doctrine: "Attestation ≠ tokenization ≠ ownership. No invented scores.",
          };
        })()
      : {
          schema: "csoai.rwa-attestation-catalog/0.1",
          as_of: new Date().toISOString().slice(0, 10),
          register: "UNMEASURED",
          stage: 2,
          count: TARGETS.length,
          targets: TARGETS,
          measured_score: null,
          doctrine:
            "Stage 2 prep — honest catalog. Measurement, not certification. Scores never sold. Not live MEASURED mainnet.",
          surfaces: { competitors: "/competitors", powered_by: "/powered-by", verify: "/gspc-verify" },
        };

  return new Response(JSON.stringify(body, null, 2), {
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "public, max-age=60",
      "access-control-allow-origin": "*",
    },
  });
};
