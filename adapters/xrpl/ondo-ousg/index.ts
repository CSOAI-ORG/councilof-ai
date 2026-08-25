/**
 * Adapter: Ondo OUSG (XRPL) — read-only public facts.
 * Seeded from rwaAttestationTargets. Not MEASURED. No signing here.
 */
export type AdapterFacts = {
  slug: string;
  chain: "xrpl" | "evm";
  public_id: string;
  sources: { label: string; url: string; as_of: string }[];
  facts: Record<string, string | number | boolean | null>;
  signing_state: "unsigned";
  notes: string;
};

export async function fetchFacts(): Promise<AdapterFacts> {
  return {
    slug: "ondo-ousg",
    chain: "xrpl",
    public_id: "rHuiXXjHLpMP8ZE9sSQU5aADQVWDwv6h5p",
    sources: [
      {
        label: "XRPScan issuer (re-verify before attach)",
        url: "https://xrpscan.com/account/rHuiXXjHLpMP8ZE9sSQU5aADQVWDwv6h5p",
        as_of: "2026-08-25",
      },
    ],
    facts: {
      currency: "OUSG",
      dual_chain: true,
      stage2_ref: true,
    },
    signing_state: "unsigned",
    notes: "Stage-2 reference with BUIDL + JMWH. Adapter returns stubs until live explorer fetch is wired.",
  };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  fetchFacts().then((f) => {
    console.log(JSON.stringify(f, null, 2));
  });
}
