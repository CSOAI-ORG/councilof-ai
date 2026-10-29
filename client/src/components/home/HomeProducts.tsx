import { Link } from "wouter";

export interface HomeProduct {
  id: string;
  eyebrow: string;
  title: string;
  body: string;
  href: string;
  cta: string;
  image: string;
  alt: string;
}

/** Nine real destinations. A product appears here only when a visitor can open it today. */
export const PRODUCTS: HomeProduct[] = [
  {
    id: "board",
    eyebrow: "Compare",
    title: "The living board",
    body: "Read dated AI measurements axis by axis, with ties, gaps and untested work left visible.",
    href: "/board",
    cta: "Explore the board",
    image: "/images/detail/board_arena_detail.jpg",
    alt: "AI systems and people facing each other across an illuminated measurement arena",
  },
  {
    id: "verify",
    eyebrow: "Re-check",
    title: "The record verifier",
    body: "Check a supported signed record in your browser. No account, no fee, and clear verification limits.",
    href: "/gspc-verify",
    cta: "Verify a record",
    image: "/images/home/evidence-card-800.webp",
    alt: "A signed measurement record held up for inspection",
  },
  {
    id: "workspace",
    eyebrow: "Work",
    title: "Council OS",
    body: "Bring the board, verifier, evidence tools and plain-language questions into one workspace.",
    href: "/dashboard",
    cta: "Open the workspace",
    image: "/images/cinematic/council-os-lobby.jpg",
    alt: "People working with connected evidence screens in a digital workspace",
  },
  {
    id: "run",
    eyebrow: "Measure",
    title: "A run on your system",
    body: "Enquire about a scoped measurement run using published tests, fixed rules and a signed record of the result.",
    href: "/contact?arm=run",
    cta: "Discuss a measurement run",
    image: "/images/detail/evidence_vault_detail.jpg",
    alt: "People inspecting a compact measurement credential at an open evidence vault",
  },
  {
    id: "connect",
    eyebrow: "Connect",
    title: "MCP, API and agents",
    body: "Read public measurements and inspect records from your own code, MCP client or AI assistant.",
    href: "/connect/",
    cta: "Connect your tools",
    image: "/images/cinematic/harness-plugin.jpg",
    alt: "A robotic connector joining a glowing measurement cable to a system",
  },
  {
    id: "feeds",
    eyebrow: "Reuse",
    title: "Evidence feeds and datasets",
    body: "Download published board data and supporting datasets to inspect, cite or use in your own analysis.",
    href: "/board/#board-download",
    cta: "Find the data",
    image: "/images/secure_evidence_vault.jpg",
    alt: "A secure evidence vault containing organised measurement records",
  },
  {
    id: "maintain",
    eyebrow: "Keep current",
    title: "Claim maintenance",
    body: "Re-read dated public claims and surface moved evidence, staleness and the need for a fresh measurement.",
    href: "/claim-maintenance/",
    cta: "See how claims stay current",
    image: "/images/liveness_drift_engine.jpg",
    alt: "An hourglass comparing stale evidence with a freshly re-attested seal",
  },
  {
    id: "embed",
    eyebrow: "Publish",
    title: "Embeddable evidence",
    body: "Put a measurement badge or card on your own site, with a browser-based signature check for each reader.",
    href: "/embed",
    cta: "Build an evidence embed",
    image: "/images/method/foundry.webp",
    alt: "A pale evidence form emerging from a mould on a beam of green light",
  },
  {
    id: "registers",
    eyebrow: "Specialise",
    title: "Specialist registers",
    body: "Inspect measurement work for financial and legacy systems, with each instrument and its limits named.",
    href: "/registers",
    cta: "Open the registers",
    image: "/images/loop/four-states.webp",
    alt: "Measurement specimens in glass tubes moving through four visible states",
  },
];

export default function HomeProducts() {
  return (
    <section id="products" aria-labelledby="home-products-h" className="surface-sunken section-y border-t border-border" data-testid="home-products">
      <div className="section-shell">
        <div className="max-w-3xl">
          <p className="t-kicker text-emerald-800 dark:text-emerald-300">Products and services</p>
          <h2 id="home-products-h" className="t-band mt-3 text-foreground">Start with the job you need to do.</h2>
          <p className="t-lede mt-4 text-muted-foreground">
            Compare AI systems, verify a record, connect your tools or commission a run. Every card below opens a working part of Council of AI.
          </p>
        </div>
        <ul className="mt-10 grid list-none gap-5 p-0 md:grid-cols-2 lg:grid-cols-3">
          {PRODUCTS.map((product) => (
            <li key={product.id} data-product={product.id}>
              <Link
                href={product.href}
                aria-label={`${product.cta}: ${product.title}`}
                className="card-quiet group flex h-full flex-col overflow-hidden transition duration-300 hover:-translate-y-1 hover:border-emerald-600/50 hover:shadow-[0_24px_60px_-38px_rgba(4,18,12,.65)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2"
              >
                <div className="relative aspect-[16/9] overflow-hidden bg-emerald-950">
                  <img
                    src={product.image}
                    alt={product.alt}
                    loading="lazy"
                    decoding="async"
                    width={800}
                    height={450}
                    className="h-full w-full object-cover transition-transform duration-500 motion-safe:group-hover:scale-[1.035]"
                  />
                  <span className="absolute left-4 top-4 rounded-full border border-white/20 bg-[#04120c]/80 px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-100 backdrop-blur-sm">
                    {product.eyebrow}
                  </span>
                </div>
                <div className="flex flex-1 flex-col p-5 sm:p-6">
                  <h3 className="text-xl font-black tracking-tight text-foreground group-hover:text-emerald-800 dark:group-hover:text-emerald-300">{product.title}</h3>
                  <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">{product.body}</p>
                  <span className="mt-auto inline-flex items-center gap-2 pt-5 text-sm font-extrabold text-emerald-800 dark:text-emerald-300">
                    {product.cta}<span aria-hidden="true" className="transition-transform group-hover:translate-x-1">→</span>
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
