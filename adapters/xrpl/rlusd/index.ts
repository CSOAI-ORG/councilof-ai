/**
 * Adapter: Ripple USD RLUSD (XRPL) — read-only public facts.
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
    slug: "ripple-rlusd",
    chain: "xrpl",
    public_id: "rMxCKbEDwqr76QuheSUMdEGf4B9xJ8m5De",
    sources: [
      {
        label: "XRPScan issuer (re-verify before attach)",
        url: "https://xrpscan.com/account/rMxCKbEDwqr76QuheSUMdEGf4B9xJ8m5De",
        as_of: "2026-08-25",
      },
    ],
    facts: {
      currency: "RLUSD",
      play: "clean",
      stage2_ref: true,
      measured_score: null,
    },
    signing_state: "unsigned",
    notes:
      "REPORTED/contact-only stub. Cash leg for XRPL RWA DvP — cite XRPScan primary. Never invent reserve balances as measured_score.",
  };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  fetchFacts().then((f) => {
    console.log(JSON.stringify(f, null, 2));
  });
}
