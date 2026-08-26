/**
 * Adapter: Apollo ACRED — read-only public facts.
 * REPORTED / contact-only. Not MEASURED. No signing here.
 * Securitize DS Token on Ethereum (Stage-2 adjacency).
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
    slug: "apollo-acred",
    chain: "evm",
    public_id: "0x17418038ecF73BA4026c4f428547BF099706F27B",
    sources: [
      {
        label: "Etherscan token (re-verify before attach)",
        url: "https://etherscan.io/address/0x17418038ecF73BA4026c4f428547BF099706F27B",
        as_of: "2026-08-26",
      },
      {
        label: "Securitize fund pages (Reg D feeder)",
        url: "https://securitize.io/",
        as_of: "2026-08-26",
      },
    ],
    facts: {
      instrument: "ACRED",
      play: "clean",
      cluster: "securitize",
      measured_score: null,
    },
    signing_state: "unsigned",
    notes:
      "REPORTED/contact-only stub. Regulated feeder — measurement attestation language only. Never invent AUM as measured_score.",
  };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  fetchFacts().then((f) => {
    console.log(JSON.stringify(f, null, 2));
  });
}
