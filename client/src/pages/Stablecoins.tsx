import { Helmet } from "react-helmet-async";
import { Link } from "wouter";
import StablecoinReadinessView from "@/components/StablecoinReadinessView";

const CANONICAL = "https://councilof.ai/stablecoins";
const READINESS_LEDGER = "/interop/stablecoin-universe-2026-09/readiness.json";
const PROMOTION_QUEUE = "/interop/stablecoin-universe-2026-09/promotion-queue.json";

const PAGE_DESCRIPTION =
  "Explore a frozen stablecoin discovery index with evidence-derived measurement, signature, root, witness and settlement status for each asset. Indexed is not measured.";

const PAGE_LD = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  name: "Stablecoin evidence readiness index",
  description: PAGE_DESCRIPTION,
  url: CANONICAL,
  about: {
    "@type": "Thing",
    name: "Stablecoin evidence readiness",
  },
  mainEntity: {
    "@type": "Dataset",
    name: "Council of AI stablecoin evidence readiness index",
    description:
      "A frozen discovery index whose rows separately report independent measurement, signature, root, witness and asset-specific settlement state. Inclusion in the index is not a measurement.",
    url: CANONICAL,
    isAccessibleForFree: true,
    creator: {
      "@type": "Organization",
      name: "CSOAI Ltd",
      url: "https://councilof.ai/",
    },
    distribution: [
      {
        "@type": "DataDownload",
        name: "Stablecoin readiness evidence ledger",
        encodingFormat: "application/json",
        contentUrl: `https://councilof.ai${READINESS_LEDGER}`,
      },
      {
        "@type": "DataDownload",
        name: "Stablecoin evidence promotion queue",
        encodingFormat: "application/json",
        contentUrl: `https://councilof.ai${PROMOTION_QUEUE}`,
      },
    ],
    variableMeasured: [
      "index state",
      "independent measurement state",
      "signature state",
      "root inclusion state",
      "external witness or anchor state",
      "asset-specific settlement state",
    ],
  },
};

export default function Stablecoins() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <Helmet>
        <title>Stablecoin evidence readiness index | Council of AI</title>
        <meta name="description" content={PAGE_DESCRIPTION} />
        <meta name="robots" content="index,follow" />
        <link rel="canonical" href={CANONICAL} />
        <meta property="og:type" content="website" />
        <meta property="og:title" content="Stablecoin evidence readiness index | Council of AI" />
        <meta property="og:description" content={PAGE_DESCRIPTION} />
        <meta property="og:url" content={CANONICAL} />
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content="Stablecoin evidence readiness index | Council of AI" />
        <meta name="twitter:description" content={PAGE_DESCRIPTION} />
        <script type="application/ld+json">{JSON.stringify(PAGE_LD)}</script>
      </Helmet>

      <header className="border-b border-emerald-950 bg-slate-950 px-5 py-14 text-slate-100 sm:py-18">
        <div className="mx-auto max-w-7xl">
          <nav aria-label="Breadcrumb" className="text-sm text-slate-400">
            <Link href="/" className="underline decoration-slate-600 underline-offset-4 hover:text-emerald-300">
              Council of AI
            </Link>
            <span aria-hidden="true" className="px-2">/</span>
            <span>Stablecoins</span>
          </nav>
          <p className="mt-8 font-mono text-xs font-bold uppercase tracking-[0.2em] text-emerald-300">
            Frozen discovery index · evidence state per asset
          </p>
          <h1 className="mt-3 max-w-4xl text-4xl font-black tracking-tight sm:text-5xl">
            Stablecoin readiness, without turning an index into a measurement.
          </h1>
          <p className="mt-5 max-w-3xl text-base leading-7 text-slate-300 sm:text-lg sm:leading-8">
            Search the published catalog and inspect what evidence exists for each asset. Identity and
            reported-chain metadata establish discovery coverage. Independent measurement, signing,
            root inclusion, external witnessing and settlement remain separate states.
          </p>
          <p className="mt-4 max-w-3xl text-sm leading-6 text-slate-400">
            The figures below are read from the published evidence files when this page loads. If the
            ledger cannot be read, the page reports that failure and shows no fallback totals.
          </p>
          <div className="mt-6 flex flex-wrap gap-3 text-sm font-semibold">
            <a className="rounded-lg bg-emerald-400 px-4 py-2.5 text-slate-950 hover:bg-emerald-300" href="#stablecoins">
              Explore the evidence states
            </a>
            <a className="rounded-lg border border-slate-700 px-4 py-2.5 text-slate-200 hover:border-emerald-400 hover:text-emerald-300" href={READINESS_LEDGER}>
              Read the evidence ledger JSON
            </a>
          </div>
        </div>
      </header>

      <section aria-labelledby="scope-heading" className="mx-auto max-w-7xl px-5 py-10 sm:py-12">
        <h2 id="scope-heading" className="text-2xl font-black">How to read this catalog</h2>
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wider text-emerald-700">Indexed</p>
            <h3 className="mt-2 text-lg font-bold">Discovered in the frozen source</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              The row carries identity and reported-chain metadata from the published discovery index.
              This state alone says nothing about independent measurement.
            </p>
          </article>
          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wider text-emerald-700">Measured</p>
            <h3 className="mt-2 text-lg font-bold">Backed by asset-level evidence</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              A measured row names its depth, freshness and evidence URL. Unmeasured rows stay visible
              so discovery breadth cannot be mistaken for completed work.
            </p>
          </article>
          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wider text-emerald-700">Integrity and delivery</p>
            <h3 className="mt-2 text-lg font-bold">Separate proof states</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Signature, current-root inclusion, external witness or anchor, protocol discovery and
              asset-specific settlement are reported independently. None is inferred from another.
            </p>
          </article>
        </div>
      </section>

      <section aria-label="Stablecoin evidence catalog" className="mx-auto max-w-7xl px-5 pb-16">
        <StablecoinReadinessView />
      </section>
    </main>
  );
}
