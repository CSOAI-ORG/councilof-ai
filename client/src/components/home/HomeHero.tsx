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
 * read as a measurement body, no hedging where we have evidence, a proof link beside every claim).
 * No line types a count: each figure lives at the link, and the board itself renders in #board and
 * #distribution below. Each href was read live on 2026-11-21 and answered 200.
 */
export const HERO_PROOF: { id: string; claim: string; label: string; href: string }[] = [
  { id: "board", claim: "The results are on a live board, free to read.", label: "GET /api/gspc", href: "/api/gspc" },
  {
    id: "signed",
    claim: "Our measurement cards are signed with Ed25519, and the public keys are published.",
    label: "Public keys",
    href: "/.well-known/did.json",
  },
  { id: "corrections", claim: "Our corrections are published in a signed ledger.", label: "GET /api/corrections", href: "/api/corrections" },
  {
    id: "distribution",
    claim: "We count downloads of CSOAI's own packages every day: distribution, not adoption.",
    label: "Download census",
    href: "/interop/distribution-latest.json",
  },
  {
    id: "standards",
    claim: "Other Internet-Drafts cite our IETF Internet-Drafts.",
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
            Council of AI tests them, and the systems they call, against frozen
            test banks with fixed grading rules. We publish the results on a
            live board, sign our measurement records and keep a public ledger
            of our own corrections.
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
              href="/gspc-verify"
              className="hp-button hp-button-light"
              data-testid="hero-cta-check"
              data-cta="secondary"
            >
              Verify a record <ArrowUpRight size={17} aria-hidden="true" />
            </Link>
          </div>
          <p className="hp-hero-note">
            Verification is free, forever. Nobody we measure pays for a place
            on the board or for a score.
          </p>
          <a
            href="#developers"
            className="hp-hero-developers"
            data-testid="hero-cta-agents"
          >
            Building with AI? Connect the free tools{" "}
            <ArrowUpRight size={15} aria-hidden="true" />
          </a>
        </div>
        <figure className="hp-hero-art">
          <img
            src={HOME_HERO.image}
            srcSet={HOME_HERO.srcSet}
            sizes="(min-width: 1024px) 48vw, 100vw"
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
          <span>01</span> Published results
        </a>
        <a href="#watchdog">
          <span>02</span> Public Watchdog
        </a>
        <a href="#products">
          <span>03</span> Put evidence to work
        </a>
        <a href="#learning">
          <span>04</span> Academy and practice
        </a>
        <a href="#how-it-works">
          <span>05</span> How to check it
        </a>
        <a href="#developers">
          <span>06</span> For developers
        </a>
      </div>
    </section>
  );
}
