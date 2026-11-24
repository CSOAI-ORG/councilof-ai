import {
  ArrowUpRight,
  Bot,
  Cable,
  ShieldCheck,
  AudioLines,
  FileCheck2,
  History,
  Layers3,
  ScanLine,
  Telescope,
} from "lucide-react";

export const PRODUCTS = [
  {
    id: "plugins",
    eyebrow: "Connect",
    title: "Use Council evidence inside your AI tools",
    body: "Connect Claude, Cursor or another supported client to read published GSPC measurements and corrections. Try a free read on a model you already use.",
    href: "/connect/#platforms",
    cta: "Choose your AI platform",
    icon: Cable,
    note: "Free evidence reads · platform setup guides",
  },
  {
    id: "models",
    eyebrow: "Compare",
    title: "Inspect open models and their measured results",
    body: "Find models tested on published question banks. Inspect our own prompt overlays alongside their base models and see which results carry signed records.",
    href: "/models-measured/",
    cta: "Browse measured models",
    icon: Bot,
    note: "Published test banks · signed evidence",
  },
  {
    id: "maintain",
    eyebrow: "Monitor",
    title: "Track changes to public AI claims",
    body: "Follow a dated claim back to its source, see the latest recorded check and find what changed. Discuss a monitoring scope for the claims your team relies on.",
    href: "/claim-maintenance/",
    cta: "See the claim monitoring register",
    icon: History,
    note: "Public sources · dated checks and corrections",
  },
  {
    id: "workspace",
    eyebrow: "Explore",
    title: "Find the evidence you need",
    body: "Look up a model, a server or a result. Council OS brings published measurements and their sources into one workspace.",
    href: "/dashboard",
    cta: "Open Council OS",
    icon: Telescope,
    note: "Published evidence · free to read",
  },
  {
    id: "art50",
    eyebrow: "Inspect",
    title: "Check an AI output for a mark",
    body: "Inspect an image, video, audio file or PDF for supported machine-readable marks. Start with the preview and its limitations.",
    href: "/dashboard?tab=art50",
    cta: "Check an output",
    icon: ScanLine,
    note: "Marking evidence · bounded methods",
  },
  {
    id: "authority",
    eyebrow: "Pilot",
    title: "Check the evidence behind an agent action",
    body: "Walk through the demonstration of a proposed action, its approval and an effect receipt. Use the published example to scope an evidence pilot for your workflow.",
    href: "/pilots/agent-authority/",
    cta: "Explore the agent authority pilot",
    icon: ShieldCheck,
    note: "Synthetic demonstration · scoped pilot enquiry",
  },
  {
    id: "packs",
    eyebrow: "Assemble",
    title: "Bring the evidence together",
    body: "Inspect the scope of an evidence pack and its existing records before commissioning assembly. A pack is evidence, never a verdict.",
    href: "/services/",
    cta: "View services and previews",
    icon: Layers3,
    note: "Terms before any paid request",
  },
  {
    id: "run",
    eyebrow: "Commission",
    title: "Ask for a measurement of your system",
    body: "Discuss the question, frozen method, deliverables and acceptance criteria. A fresh measurement starts with a scoped enquiry.",
    href: "/contact?arm=run",
    cta: "Discuss a measurement",
    icon: FileCheck2,
    note: "Scope agreed before a run",
  },
  {
    id: "data",
    eyebrow: "Reuse",
    title: "Build on the published work",
    body: "Inspect open datasets, reproducible instruments and supporting software. Keep each artifact’s licence, date and scope with it.",
    href: "/open-source/",
    cta: "Explore open source and data",
    icon: AudioLines,
    note: "Code, datasets and reproducible work",
  },
] as const;

export default function HomeProducts() {
  return (
    <section
      id="products"
      className="hp-section hp-services"
      aria-labelledby="home-products-h"
      data-testid="home-products"
    >
      <div className="section-shell">
        <div className="hp-section-heading">
          <div>
            <p className="hp-eyebrow">Put evidence to work</p>
            <h2 id="home-products-h">
              Tools for checking
              <br />
              <span>AI evidence.</span>
            </h2>
          </div>
          <p className="hp-heading-aside">
            Read public records in your own tools, compare models and track changes. If your team needs a fresh measurement or a monitoring scope, start with the published examples.
          </p>
        </div>
        <div className="hp-service-grid">
          {PRODUCTS.map((product) => {
            const Icon = product.icon;
            return (
              <article
                key={product.id}
                data-product={product.id}
                className="hp-service"
              >
                <div className="hp-service-top">
                  <Icon size={25} strokeWidth={1.5} aria-hidden="true" />
                  <span>
                    {product.eyebrow}
                  </span>
                </div>
                <h3>
                  <a href={product.href}>
                    {product.title}
                    <ArrowUpRight size={19} aria-hidden="true" />
                  </a>
                </h3>
                <p>{product.body}</p>
                <div className="hp-service-bottom">
                  <span>{product.note}</span>
                  <a
                    href={product.href}
                    aria-label={`${product.cta}: ${product.title}`}
                  >
                    {product.cta} <ArrowUpRight size={15} aria-hidden="true" />
                  </a>
                </div>
              </article>
            );
          })}
        </div>
        <div
          className="hp-resource-row"
          aria-label="More ways to use the evidence"
        >
          <span>Go deeper</span>
          <a href="/registers">
            Specialist registers <ArrowUpRight size={14} aria-hidden="true" />
          </a>
          <a href="/dashboard?tab=learn">
            Learn and reproduce <ArrowUpRight size={14} aria-hidden="true" />
          </a>
          <a href="/regulators">
            For regulators and auditors{" "}
            <ArrowUpRight size={14} aria-hidden="true" />
          </a>
          <a href="/working-groups/">
            Working groups <ArrowUpRight size={14} aria-hidden="true" />
          </a>
        </div>
      </div>
    </section>
  );
}
