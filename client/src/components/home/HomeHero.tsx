import { Link } from "wouter";
import { ArrowDown, ArrowUpRight } from "lucide-react";
import HeroEvidenceConsole from "./HeroEvidenceConsole";

/** A stable first screen. Service discovery belongs in the page, not a rotating headline. */
export const HOME_HERO = {
  title: "See how AI behaves. Check the evidence yourself.",
  image: "/images/coliseum_hero_arena.jpg",
  srcSet:
    "/images/coliseum_hero_arena-640.webp 640w, /images/coliseum_hero_arena-1024.webp 1024w, /images/coliseum_hero_arena-1376.webp 1376w",
  alt: "AI systems and people facing a row of illuminated test stations in an arena",
};

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
            See how AI behaves.
            <br />
            <span>Check the evidence yourself.</span>
          </h1>
          <p className="hp-hero-lede" data-testid="hero-what-we-do">
            Independent measurements of AI models, agents and the systems they
            call. Explore the results, understand their limits and verify the
            records yourself.
          </p>
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
            Measurement, not certification. Verification is free, forever.
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
          <div className="hp-hero-art-label" aria-hidden="true">
            <span>THE MEASUREMENT ARENA</span>
            <span>Evidence · method · human judgement</span>
          </div>
          <HeroEvidenceConsole />
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
