import { useEffect } from "react";
import { setMetaDescription } from "@/lib/utils";

// PRODUCT CATALOG — the one coherent map of what Council of AI actually sells,
// and what is free forever. Council of AI is an independent MEASUREMENT +
// data-generation body: it measures AI systems UNSOLICITED and PERMISSIONLESS
// (no issuer opt-in, no issuer payment) and never sells a score.
//
// Lawful revenue = data-by-query + evidence packs + tooling licences + training.
// Settlement rides x402 / open rails — never a subscription wall on the rail,
// never a token or coin. Free forever for regulators and the public.
//
// Every link below points at a surface that exists in this app. Anything not yet
// live is marked "preview" in plain words — never dressed up as working.

type Status = "live" | "free" | "preview";

type Product = {
  id: string;
  name: string;
  tag: string;
  what: string;
  who: string;
  billing: string;
  status: Status;
  links: { label: string; href: string }[];
};

const PRODUCTS: Product[] = [
  {
    id: "cards",
    name: "Signed measurement cards + public board",
    tag: "Measurement",
    what: "Every measurement returns a 3KB Ed25519-signed, hash-chained card. The public GSPC board shows measured axes with item counts and confidence intervals — recompute any figure yourself, no account.",
    who: "Everyone — the public record of how AI systems measure against in-force regulation.",
    billing: "Free forever. Running a card costs nothing; verifying one costs nothing.",
    status: "free",
    links: [
      { label: "Browse the board →", href: "/gspc-scoreboard" },
      { label: "Verify a card →", href: "/gspc-verify" },
    ],
  },
  {
    id: "ras",
    name: "RAS — signed risk assessment",
    tag: "Assessment",
    what: "A deterministic, signed route-check: it classifies a system against Annex III categories and names the control gaps. Same input, same signed output — no model in the loop, so the verdict can be signed. It identifies the route; it is not a conformity assessment and not legal advice.",
    who: "Deployers and providers who need decision-grade evidence of where a system sits.",
    billing: "Signed assessment is live now. Metered pay-as-you-go settles via x402 (open rails, USDC on Base) — checkout is in preview while machine-access pricing awaits a published ruling.",
    status: "live",
    links: [
      { label: "Run an assessment →", href: "/assess" },
      { label: "Pay-per-call rail →", href: "/payg" },
    ],
  },
  {
    id: "api",
    name: "A2A / MCP API access",
    tag: "Machine access",
    what: "One key, every published instrument, over an agent-to-agent (MCP) rail. Every call returns a signed measurement card your auditor verifies independently of us. 100 free calls a day per key.",
    who: "Agents, CI pipelines and platforms that consume measurement programmatically.",
    billing: "100 free calls/day per key, then metered via x402 — no monthly seat, balance never expires. Machine-access pricing is pending a published ruling.",
    status: "live",
    links: [
      { label: "API & MCP docs →", href: "/api-docs" },
      { label: "MCP hub →", href: "/mcp" },
      { label: "Pay-per-call rail →", href: "/payg" },
    ],
  },
  {
    id: "data",
    name: "Evidence packs + data-by-query",
    tag: "Data",
    what: "The signed insurability evidence pack maps a measurement receipt into the four evidence classes underwriters ask for. The commercial data feed (EUNOMIA) serves the signed enforcement record + deadline calendar as raw data — never scores, never ranked.",
    who: "Insurers, bond desks and vendors buying decision-grade data — not a score.",
    billing: "Data-by-query is live over the open x402 receipt rail (per-query, settled on-chain — see the endpoint for the current rate). Evidence packs are a signed artefact supplied on request. Regulators and the public get the same stream free.",
    status: "live",
    links: [
      { label: "Evidence pack →", href: "/evidence" },
      { label: "EUNOMIA data feed →", href: "/eunomia-data" },
      { label: "Free public stream →", href: "/first-fine-watch" },
    ],
  },
  {
    id: "licensing",
    name: 'Tooling licences — "Powered by Council OS"',
    tag: "Licence",
    what: "Run the measurement rail under your own surface: white-label the signed-card engine and the third-party verify embed so partners can check a card in-page. The method stays open; the licence covers hosting, support and the brand mark.",
    who: "Platforms, consultancies and marketplaces embedding independent measurement.",
    billing: "Licensed by arrangement (open-source core, Apache-2.0). No revenue share on scores — scores are never sold.",
    status: "preview",
    links: [
      { label: "Licensing overview →", href: "/council-licensing" },
      { label: "Talk to us →", href: "/contact" },
    ],
  },
  {
    id: "academy",
    name: "Academy — training completion records",
    tag: "Training",
    what: "Council Academy courses on AI governance and the measurement method. Completion attests that a person completed training — it is not a statement about any AI system's compliance with any regulation.",
    who: "Practitioners, compliance teams and auditors building measurement literacy.",
    billing: "All courses free. Completion records attest training, never conformity.",
    status: "free",
    links: [{ label: "Open the Academy →", href: "/academy" }],
  },
];

const STATUS_LABEL: Record<Status, string> = {
  live: "Live",
  free: "Free forever",
  preview: "In preview",
};

const STATUS_CLASS: Record<Status, string> = {
  live: "border-emerald-400/40 bg-emerald-400/10 text-emerald-300",
  free: "border-teal-300/40 bg-teal-300/10 text-teal-200",
  preview: "border-amber-400/40 bg-amber-400/10 text-amber-300",
};

export default function Products() {
  useEffect(() => {
    document.title = "Product catalogue — Council of AI";
    setMetaDescription(
      "What Council of AI offers: signed measurement cards, RAS assessments, A2A/MCP access, evidence packs and data-by-query, tooling licences, and Academy training. Settlement rides x402 / open rails — free forever for regulators.",
    );
  }, []);

  return (
    <div className="min-h-screen bg-[#03110b] text-emerald-50">
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-emerald-500/15 mx-auto max-w-6xl px-6 pt-16 pb-10 text-center">
        <div
          className="pointer-events-none absolute inset-0"
          style={{ background: "radial-gradient(800px 380px at 50% -10%, rgba(16,185,129,.20), transparent 60%)" }}
        />
        <p className="relative font-mono text-[11px] uppercase tracking-[3px] text-emerald-300/70">
          Unsolicited · Permissionless
        </p>
        <h1 className="relative mt-3 text-4xl sm:text-6xl font-black tracking-tight">
          The product is the evidence.{" "}
          <span className="bg-gradient-to-r from-emerald-300 via-emerald-400 to-teal-300 bg-clip-text text-transparent">
            Never the score.
          </span>
        </h1>
        <p className="relative mt-4 mx-auto max-w-3xl text-emerald-100/80">
          Council of AI measures AI systems <strong>unsolicited and permissionless</strong> — no issuer opt-in, no
          issuer payment. Scores are never for sale. What we sell is signed data, evidence and tooling; settlement
          rides <strong>x402 / open rails</strong> — never a subscription wall on the rail, never a token or coin.
        </p>
      </section>

      {/* Regulators-free banner */}
      <section className="mx-auto max-w-6xl px-6 pt-8">
        <div className="rounded-2xl border border-teal-300/30 bg-teal-300/[0.07] px-5 py-4 text-center">
          <p className="text-sm font-bold text-teal-100">
            Regulators &amp; the public: everything here is free, forever.
          </p>
          <p className="mt-1 text-xs text-teal-100/70">
            No paywall on measurement, no paywall on verification. The commercial lanes below fund the free record —
            they never gate it.
          </p>
        </div>
      </section>

      {/* Catalogue */}
      <section className="mx-auto max-w-6xl px-6 pt-10 pb-14">
        <div className="grid gap-4 md:grid-cols-2">
          {PRODUCTS.map((p) => (
            <div
              key={p.id}
              className="flex flex-col rounded-2xl border border-emerald-500/20 bg-[#05140d] p-6"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-[2px] text-emerald-300/60">{p.tag}</p>
                  <h2 className="mt-1 text-xl font-black text-emerald-100">{p.name}</h2>
                </div>
                <span
                  className={
                    "shrink-0 rounded-full border px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-wide " +
                    STATUS_CLASS[p.status]
                  }
                >
                  {STATUS_LABEL[p.status]}
                </span>
              </div>

              <p className="mt-3 text-sm text-emerald-100/80">{p.what}</p>

              <dl className="mt-4 space-y-2 text-sm">
                <div>
                  <dt className="font-mono text-[10px] uppercase tracking-[1.5px] text-emerald-300/60">Who it's for</dt>
                  <dd className="text-emerald-100/75">{p.who}</dd>
                </div>
                <div>
                  <dt className="font-mono text-[10px] uppercase tracking-[1.5px] text-emerald-300/60">How it's billed</dt>
                  <dd className="text-emerald-100/75">{p.billing}</dd>
                </div>
              </dl>

              <div className="mt-auto flex flex-wrap gap-x-4 gap-y-2 pt-5">
                {p.links.map((l) => (
                  <a key={l.href} href={l.href} className="text-sm font-bold text-emerald-300 hover:text-emerald-200">
                    {l.label}
                  </a>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Honest footing */}
        <div className="mt-8 rounded-2xl border border-emerald-500/15 bg-black/20 px-5 py-4 text-sm text-emerald-100/70">
          <p>
            <strong>How settlement works.</strong> The x402 rail settles data-by-query in USDC on Base via the open
            x402 receipt MCP — no account, no card on file, no coin of our own. The RAS metered checkout and the
            tooling licence are marked <em>in preview</em> above because their public pricing awaits a published
            ruling; you can use the signed assessment and talk to us in the meantime. We never fabricate a working
            payment flow, and we never sell a score.
          </p>
        </div>

        <p className="mt-6 text-center text-xs text-emerald-300/75">
          Council of AI is a measurement body — it measures, it does not certify or issue conformity marks. Cards are
          verified measurement credentials, not certificates.
        </p>
      </section>
    </div>
  );
}
