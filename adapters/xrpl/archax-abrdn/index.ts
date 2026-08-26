/**
 * Adapter: Archax × abrdn USD Liquidity (XRPL) — read-only public facts.
 * REPORTED / contact-only. Not MEASURED. No signing here.
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
    slug: "archax-abrdn-mmf-xrpl",
    chain: "xrpl",
    public_id: "rKCu4CucpepQ6N89c8T5GuX2jkxzCST18Q",
    sources: [
      {
        label: "XRPScan issuer (re-verify before attach)",
        url: "https://xrpscan.com/account/rKCu4CucpepQ6N89c8T5GuX2jkxzCST18Q",
        as_of: "2026-08-26",
      },
    ],
    facts: {
      instrument: "Archax × abrdn USD Liquidity",
      play: "clean",
      cluster: "xrpl-mmf",
      measured_score: null,
    },
    signing_state: "unsigned",
    notes:
      "REPORTED/contact-only stub. First tokenized MMF on XRPL (Nov 2024 cite). Re-verify on-ledger activity before publish. Never invent NAV as measured_score.",
  };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  fetchFacts().then((f) => {
    console.log(JSON.stringify(f, null, 2));
  });
}
