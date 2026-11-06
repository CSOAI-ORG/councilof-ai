import { ArrowUpRight } from "lucide-react";
import NewsletterSignup from "@/components/NewsletterSignup";

export default function HomeUpdates() {
  return (
    <section
      className="hp-section hp-updates"
      aria-labelledby="home-updates-h"
      data-testid="home-daily-report-band"
    >
      <div className="section-shell">
        <div className="hp-update-grid">
          <div>
            <p className="hp-eyebrow">Continue exploring</p>
            <h2 id="home-updates-h">
              Keep the context.
              <br />
              <span>Follow the work.</span>
            </h2>
            <p>
              Read published reports, explore the research or follow changes in
              the public record. Every source has a date and a scope.
            </p>
            <div className="hp-editorial-links">
              <a
                href="https://huggingface.co/datasets/csoai/gspc-daily-reports"
                target="_blank"
                rel="noopener noreferrer"
              >
                <span>01</span>
                <div>
                  <strong>Measurement reports</strong>
                  <p>Dated summaries and their evidence status.</p>
                </div>
                <ArrowUpRight size={20} aria-hidden="true" />
              </a>
              <a href="/library/">
                <span>02</span>
                <div>
                  <strong>Research and the library</strong>
                  <p>The methods, papers and material behind the work.</p>
                </div>
                <ArrowUpRight size={20} aria-hidden="true" />
              </a>
              <a
                href="https://github.com/CSOAI-ORG/councilof-ai/pulls?q=is%3Apr+is%3Amerged+sort%3Aupdated-desc"
                target="_blank"
                rel="noopener noreferrer"
              >
                <span>03</span>
                <div>
                  <strong>The public changelog</strong>
                  <p>Follow merged changes at their source.</p>
                </div>
                <ArrowUpRight size={20} aria-hidden="true" />
              </a>
            </div>
          </div>
          <div className="hp-newsletter">
            <p className="hp-eyebrow">Evidence updates</p>
            <h3>
              A closer look,
              <br />
              when there is more to see.
            </h3>
            <p>Get updates on published measurements and corrections.</p>
            <div className="hp-newsletter-form">
              <NewsletterSignup />
            </div>
            <a href="/privacy-policy/" className="hp-text-link">
              How we handle your information{" "}
              <ArrowUpRight size={14} aria-hidden="true" />
            </a>
          </div>
        </div>
        <p className="hp-archive-link">
          <a href="/how-we-work/" className="hp-text-link">
            Explore the full evidence workflow and archive{" "}
            <ArrowUpRight size={15} aria-hidden="true" />
          </a>
        </p>
        <div className="hp-enquiry">
          <div>
            <p className="hp-eyebrow">A question about your own system?</p>
            <h3>Let’s define the measurement.</h3>
            <p>
              Discuss the subject, method and deliverable before any work is
              commissioned.
            </p>
          </div>
          <a href="/contact?arm=run" className="hp-button hp-button-dark">
            Start a scoped enquiry <ArrowUpRight size={17} aria-hidden="true" />
          </a>
        </div>
      </div>
    </section>
  );
}
