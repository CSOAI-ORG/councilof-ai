/**
 * Adapter: Aviva USD Liquidity (XRPL) — read-only public facts.
 * REPORTED / contact-only. Not MEASURED. Issuer TBD until XRPScan verify.
 */
export type AdapterFacts = {
  slug: string;
  chain: "xrpl";
  public_id: string | null;
  sources: { label: string; url: string; as_of: string }[];
  facts: Record<string, string | number | boolean | null>;
  signing_state: "unsigned";
  notes: string;
};

export async function fetchFacts(): Promise<AdapterFacts> {
  return {
    slug: "aviva-usd-liquidity",
    chain: "xrpl",
    public_id: null,
    sources: [
      {
        label: "Aviva / Ripple / Licuido public coverage (re-verify)",
        url: "https://ripple.com/",
        as_of: "2026-08-26",
      },
    ],
    facts: {
      currency: "Aviva USD Liquidity (tokenized UCITS)",
      play: "clean",
      stage2_ref: true,
      measured_score: null,
      issuer_verified: false,
    },
    signing_state: "unsigned",
    notes:
      "Gate check #166: public_id TBD. Do not invent reserve balances as measured_score. Attestation ≠ tokenization ≠ ownership.",
  };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  fetchFacts().then((f) => console.log(JSON.stringify(f, null, 2)));
}
