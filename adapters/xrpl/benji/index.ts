/**
 * Adapter: Franklin Templeton BENJI (FOBXX) — read-only public facts.
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
    slug: "franklin-benji",
    chain: "evm",
    public_id: "0x3DDc84940Ab509C11B20B76B466933f40b750dc9",
    sources: [
      {
        label: "Etherscan security token (re-verify before attach)",
        url: "https://etherscan.io/address/0x3DDc84940Ab509C11B20B76B466933f40b750dc9",
        as_of: "2026-08-25",
      },
    ],
    facts: {
      instrument: "BENJI",
      fund: "FOBXX",
      play: "clean",
      stage2_ref: true,
      measured_score: null,
    },
    signing_state: "unsigned",
    notes:
      "REPORTED/contact-only stub. '40 Act fund — retail-eligible footnote. Cite dated primary pages as REPORTED only; measured_score stays null.",
  };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  fetchFacts().then((f) => {
    console.log(JSON.stringify(f, null, 2));
  });
}
