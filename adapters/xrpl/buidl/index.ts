/**
 * Adapter: BlackRock BUIDL — read-only public facts.
 * REPORTED / contact-only. Not MEASURED. No signing here.
 * Primary chain: Ethereum (Stage-2 adjacency ref for XRPL corpus).
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
    slug: "blackrock-buidl",
    chain: "evm",
    public_id: "0x7712c34205737192402172409a8f7ccef8aa2aec",
    sources: [
      {
        label: "Etherscan token (re-verify before attach)",
        url: "https://etherscan.io/address/0x7712c34205737192402172409a8f7ccef8aa2aec",
        as_of: "2026-08-25",
      },
    ],
    facts: {
      instrument: "BUIDL",
      play: "clean",
      stage2_ref: true,
      measured_score: null,
    },
    signing_state: "unsigned",
    notes:
      "REPORTED/contact-only stub. Confirm contract on Etherscan. Never invent holder concentration as measured_score.",
  };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  fetchFacts().then((f) => {
    console.log(JSON.stringify(f, null, 2));
  });
}
