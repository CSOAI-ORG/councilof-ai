import { Link } from "wouter";
import { ArrowDown, ArrowUpRight } from "lucide-react";

/** A stable first screen. Service discovery belongs in the page, not a rotating headline. */
export const HOME_HERO = {
  title: "We measure AI models and agents. Check the evidence yourself.",
  image: "/images/coliseum_hero_arena.jpg",
  srcSet:
    "/images/coliseum_hero_arena-640.webp 640w, /images/coliseum_hero_arena-1024.webp 1024w, /images/coliseum_hero_arena-1376.webp 1376w",
  alt: "AI systems and people facing a row of illuminated test stations in an arena",
};

/**
 * One plain claim per line, with the live source that proves it beside it (owner, 21 Nov 2026:
 * read as a measurement body, a proof link beside every claim). The same claims, in the same
 * order, lead /about/ (AboutRecord), /investors/ and the lead of /llms.txt. No line types a
 * count: each figure lives at its link, and the board itself renders in #board below.
 */
export const HERO_PROOF: { id: string; claim: string; label: string; href: string }[] = [
  { id: "board", claim: "The results are on a live board, free to read.", label: "GET /api/gspc", href: "/api/gspc" },
  {
    id: "signed",
    claim: "Anyone can re-check our signed records for free, against our published Ed25519 keys.",
    label: "Public keys",
    href: "/.well-known/did.json",
  },
  { id: "corrections", claim: "Our corrections are published in a signed ledger.", label: "GET /api/corrections", href: "/api/corrections" },
  {
    id: "distribution",
    claim: "We publish a dated census of downloads of our own packages: distribution, not adoption.",
    label: "Download census",
    href: "/interop/distribution-latest.json",
  },
  {
    id: "standards",
    claim: "Another author's Internet-Drafts cite our work at the IETF.",
    label: "IETF Datatracker",
    href: "https://datatracker.ietf.org/doc/draft-templeman-scitt-framing-space/referencedby/",
  },
];

export default function HomeHero() {
  return (
    <section
      className="hp-hero"
      aria-labelledby="home-hero-h"
      data-testid="home-hero"
    >
      <div className="section-shell hp-hero-grid">
        <div className="hp-hero-copy">
          <p className="hp-eyebrow">
            <span aria-hidden="true" />
            Independent AI measurement
          </p>
          <h1 id="home-hero-h">
            We measure AI models and agents.
            <br />
            <span>Check the evidence yourself.</span>
          </h1>
          <p className="hp-hero-lede" data-testid="hero-what-we-do">
            Council of AI tests AI models and agents, and the systems they call,
            against frozen test banks with fixed grading rules (
            <Link href="/methodology/">the method</Link>,{" "}
            <a href="/api/gspc">GET /api/gspc</a>). We publish the results
            and their limits on a live board, sign our measurement records and
            keep a public ledger of our own corrections.
          </p>
          <ul className="hp-hero-proof" aria-label="The proof for each claim" data-testid="hero-proof">
            {HERO_PROOF.map((p) => (
              <li key={p.id} data-proof={p.id}>
                {p.claim}{" "}
                <a href={p.href} rel={p.href.startsWith("https://") ? "noopener noreferrer" : undefined}>
                  {p.label}
                </a>
              </li>
            ))}
          </ul>
          <div className="hp-actions">
            <a
              href="#board"
              className="hp-button hp-button-primary"
              data-testid="hero-cta-board"
              data-cta="primary"
            >
              Explore the results <ArrowDown size={17} aria-hidden="true" />
            </a>
            <Link
              href="/gspc-verify/"
              className="hp-button hp-button-light"
              data-testid="hero-cta-check"
              data-cta="secondary"
            >
              Verify a record <ArrowUpRight size={17} aria-hidden="true" />
            </Link>
          </div>
          <p className="hp-hero-note">
            Verification is free, forever. A result is a measurement of what we
            ran and when, never a mark, a badge or a grade to buy. Payment never
            buys a place on the board or a better result (
            <Link href="/how-we-work/">how we are funded</Link>).
          </p>
          <a
            href="#developers"
            className="hp-hero-developers"
            data-testid="hero-cta-agents"
          >
            Building with AI? Connect the free tools{" "}
            <ArrowUpRight size={15} aria-hidden="true" />
          </a>
          <Link
            href="/investors/"
            className="hp-hero-developers"
            data-testid="hero-cta-investors"
          >
            Investor or partner? Read the company brief{" "}
            <ArrowUpRight size={15} aria-hidden="true" />
          </Link>
        </div>
        <figure className="hp-hero-art">
          <img
            src={HOME_HERO.image}
            srcSet={HOME_HERO.srcSet}
            sizes="(max-width: 800px) calc(100vw - 44px), (min-width: 1440px) 560px, (min-width: 1152px) 504px, calc(50vw - 48px)"
            alt={HOME_HERO.alt}
            width={1376}
            height={768}
            fetchPriority="high"
            decoding="async"
          />
          <figcaption>
            <span>THE COUNCIL OF AI</span>
            <span>Evidence in the open.</span>
          </figcaption>
        </figure>
      </div>
      <div
        className="section-shell hp-hero-index"
        aria-label="Explore this page"
        data-journey-index
      >
        <a href="#board">
          <span>01</span> GSPC Living Board
        </a>
        <a href="#watchdog">
          <span>02</span> Public Watchdog
        </a>
        <a href="#products">
          <span>03</span> Council OS and evidence tools
        </a>
        <a href="#learning">
          <span>04</span> Academy, games and human review
        </a>
        <a href="#how-it-works">
          <span>05</span> How to check it
        </a>
        <a href="#developers">
          <span>06</span> For developers
        </a>
        <a href="/dashboard/?tab=home">
          <span>07</span> Open Council OS
        </a>
        <a href="/tools/#extension">
          <span>08</span> Browser extension and plugins
        </a>
      </div>
    </section>
  );
}
